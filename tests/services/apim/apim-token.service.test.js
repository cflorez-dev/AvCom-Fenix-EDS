import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const aemDataPath = '../../../scripts/utils/aem-data.js';
const servicePath = '../../../scripts/services/apim/apim-token.service.js';

const TOKEN_ENDPOINT = 'https://app-builder.example/api/v1/web/avianca-appbuilder/getApiToken';

const ENV_WITH_ENDPOINT = {
  data: [{ Key: 'AV_TOKEN_ENDPOINT', Text: TOKEN_ENDPOINT }],
};

const mockEnv = (env = ENV_WITH_ENDPOINT) => {
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue(env),
  }));
};

const base64UrlEncode = (obj) => btoa(JSON.stringify(obj))
  .replace(/=+$/, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const makeJwt = (payload) => {
  const header = base64UrlEncode({ alg: 'RS256', typ: 'JWT' });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.fakesignature`;
};

const makeTokenResponse = ({
  service = 'digital',
  expiresIn = '3599',
  jwtPayload,
  apiVersion = null,
} = {}) => {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = jwtPayload ?? {
    aud: 'api://test',
    iat: nowSec,
    nbf: nowSec,
    exp: nowSec + 3900,
  };
  return {
    apiVersion,
    apimBaseUrl: 'https://apim.example/API',
    expiresIn,
    service,
    subscriptionKey: 'sub-key-test',
    token: `Bearer ${makeJwt(payload)}`,
  };
};

const mockTokenFetch = (response, { ok = true, status = 200 } = {}) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

describe('apim-token.service', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
    delete global.fetch;
    vi.useRealTimers();
  });

  describe('getApimCredentials', () => {
    it('throws on invalid service', async () => {
      mockEnv();
      const { getApimCredentials } = await import(servicePath);

      await expect(getApimCredentials('invalid')).rejects.toThrow(/Invalid service/);
    });

    it('fetches token on cache miss and stores it in localStorage', async () => {
      mockEnv();
      mockTokenFetch(makeTokenResponse());
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');

      expect(creds.token).toMatch(/^Bearer /);
      expect(creds.subscriptionKey).toBe('sub-key-test');
      expect(creds.apimBaseUrl).toBe('https://apim.example/API');
      expect(creds.expiresAt).toBeGreaterThan(Date.now());
      expect(localStorage.getItem('avianca_apim_token_digital')).toBeTruthy();
    });

    it('returns cached token without re-fetching when still valid', async () => {
      mockEnv();
      mockTokenFetch(makeTokenResponse());
      const { getApimCredentials } = await import(servicePath);

      await getApimCredentials('digital');
      await getApimCredentials('digital');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when cached token is within the 2-minute refresh margin', async () => {
      mockEnv();
      const closeToExpiry = {
        token: 'Bearer not-a-real-jwt',
        subscriptionKey: 'old',
        apimBaseUrl: 'https://old.example',
        apiVersion: null,
        expiresAt: Date.now() + 60 * 1000, // 1 min from now → inside 2min margin
      };
      localStorage.setItem('avianca_apim_token_digital', JSON.stringify(closeToExpiry));
      mockTokenFetch(makeTokenResponse());
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(creds.subscriptionKey).toBe('sub-key-test');
    });

    it('returns cached token when still well outside refresh margin', async () => {
      mockEnv();
      const fresh = {
        token: 'Bearer cached',
        subscriptionKey: 'cached-key',
        apimBaseUrl: 'https://cached.example',
        apiVersion: 'v1',
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 min from now
      };
      localStorage.setItem('avianca_apim_token_pricing', JSON.stringify(fresh));
      global.fetch = vi.fn();
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('pricing');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(creds.subscriptionKey).toBe('cached-key');
    });

    it('treats corrupt cached JSON as cache miss', async () => {
      mockEnv();
      localStorage.setItem('avianca_apim_token_digital', '{not-json');
      mockTokenFetch(makeTokenResponse());
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');

      expect(creds.subscriptionKey).toBe('sub-key-test');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('single-flight: 10 concurrent calls trigger only 1 network fetch', async () => {
      mockEnv();
      let resolveFetch;
      const fetchGate = new Promise((resolve) => { resolveFetch = resolve; });
      global.fetch = vi.fn().mockImplementation(() => fetchGate.then(() => ({
        ok: true,
        status: 200,
        json: async () => makeTokenResponse(),
      })));
      const { getApimCredentials } = await import(servicePath);

      const promises = Array.from({ length: 10 }, () => getApimCredentials('digital'));
      // Let microtasks settle so all 10 calls reach pendingFetch dedup
      await new Promise((r) => { setTimeout(r, 10); });
      resolveFetch();
      const results = await Promise.all(promises);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      // All callers got the same credentials object
      expect(new Set(results.map((r) => r.token)).size).toBe(1);
    });

    it('throws when AV_TOKEN_ENDPOINT is missing from environment', async () => {
      mockEnv({ data: [{ Key: 'OTHER', Text: 'x' }] });
      mockTokenFetch(makeTokenResponse());
      const { getApimCredentials } = await import(servicePath);

      await expect(getApimCredentials('digital')).rejects.toThrow(/AV_TOKEN_ENDPOINT no configurado/);
    });

    it('throws on non-OK token endpoint response', async () => {
      mockEnv();
      mockTokenFetch({}, { ok: false, status: 500 });
      const { getApimCredentials } = await import(servicePath);

      await expect(getApimCredentials('digital')).rejects.toThrow(/Token request failed: 500/);
    });

    // Note: "no crash on setItem quota exceeded" is implemented via try/catch
    // around getStorage().setItem(...) in writeCache. Direct spying on
    // localStorage.setItem is brittle in happy-dom's Storage proxy — the
    // defensive try/catch is verified by code review (see writeCache).
  });

  describe('computeExpiresAt (via getApimCredentials)', () => {
    it('uses JWT exp claim when JWT is well-formed', async () => {
      mockEnv();
      const nowSec = Math.floor(Date.now() / 1000);
      const expectedExpSec = nowSec + 4000; // intentionally != expiresIn
      const response = makeTokenResponse({
        expiresIn: '3599', // would yield ~now+3599s
        jwtPayload: { iat: nowSec, exp: expectedExpSec },
      });
      mockTokenFetch(response);
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');

      // Should match JWT exp, not expiresIn
      expect(creds.expiresAt).toBe(expectedExpSec * 1000);
    });

    it('falls back to expiresIn when JWT is malformed', async () => {
      mockEnv();
      const before = Date.now();
      mockTokenFetch({
        ...makeTokenResponse(),
        token: 'Bearer not.a.valid-jwt-payload!!!',
        expiresIn: '3599',
      });
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');
      const after = Date.now();

      // Should be ~ now + 3599s
      expect(creds.expiresAt).toBeGreaterThanOrEqual(before + 3599 * 1000);
      expect(creds.expiresAt).toBeLessThanOrEqual(after + 3599 * 1000);
    });

    it('falls back to expiresIn when JWT payload has no exp claim', async () => {
      mockEnv();
      const before = Date.now();
      const response = makeTokenResponse({
        expiresIn: '1800',
        jwtPayload: { iat: 123, aud: 'no-exp' }, // no exp
      });
      mockTokenFetch(response);
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');
      const after = Date.now();

      expect(creds.expiresAt).toBeGreaterThanOrEqual(before + 1800 * 1000);
      expect(creds.expiresAt).toBeLessThanOrEqual(after + 1800 * 1000);
    });

    it('handles expiresIn as string (the real backend shape)', async () => {
      mockEnv();
      mockTokenFetch({
        ...makeTokenResponse(),
        token: 'Bearer malformed', // forces fallback to expiresIn
        expiresIn: '3599',
      });
      const { getApimCredentials } = await import(servicePath);

      const creds = await getApimCredentials('digital');

      // Number('3599') * 1000 = 3599000
      expect(creds.expiresAt - Date.now()).toBeGreaterThan(3500 * 1000);
      expect(creds.expiresAt - Date.now()).toBeLessThan(3700 * 1000);
    });
  });

  describe('clearApimTokenCache', () => {
    it('removes the cached entry for a specific service', async () => {
      mockEnv();
      localStorage.setItem('avianca_apim_token_digital', '{}');
      localStorage.setItem('avianca_apim_token_pricing', '{}');
      const { clearApimTokenCache } = await import(servicePath);

      clearApimTokenCache('digital');

      expect(localStorage.getItem('avianca_apim_token_digital')).toBeNull();
      expect(localStorage.getItem('avianca_apim_token_pricing')).toBe('{}');
    });

    it('removes all cached entries when called without service', async () => {
      mockEnv();
      localStorage.setItem('avianca_apim_token_digital', '{}');
      localStorage.setItem('avianca_apim_token_pricing', '{}');
      localStorage.setItem('unrelated_key', 'preserve');
      const { clearApimTokenCache } = await import(servicePath);

      clearApimTokenCache();

      expect(localStorage.getItem('avianca_apim_token_digital')).toBeNull();
      expect(localStorage.getItem('avianca_apim_token_pricing')).toBeNull();
      expect(localStorage.getItem('unrelated_key')).toBe('preserve');
    });

    it('forces next getApimCredentials to fetch a new token', async () => {
      mockEnv();
      mockTokenFetch(makeTokenResponse());
      const { getApimCredentials, clearApimTokenCache } = await import(servicePath);

      await getApimCredentials('digital');
      clearApimTokenCache('digital');
      await getApimCredentials('digital');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
