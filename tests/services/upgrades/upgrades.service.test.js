import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const tokenServicePath = '../../../scripts/services/apim/apim-token.service.js';
const aemDataPath = '../../../scripts/utils/aem-data.js';
const servicePath = '../../../scripts/services/upgrades/upgrades.service.js';

const DIGITAL = {
  token: 'azure-jwt', subscriptionKey: 'sub-key', apimBaseUrl: 'https://apim.example/API_CanalesDigitales',
};
const UPGRADES = { token: 'cognito-jwt' };

const mockDeps = ({ envRows = [], clearSpy = vi.fn() } = {}) => {
  vi.doMock(tokenServicePath, () => ({
    getApimCredentials: vi.fn().mockImplementation((s) => {
      if (s === 'digital') return Promise.resolve(DIGITAL);
      if (s === 'upgrades') return Promise.resolve(UPGRADES);
      return Promise.reject(new Error(`unknown ${s}`));
    }),
    clearApimTokenCache: clearSpy,
  }));
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: envRows }),
  }));
  return { clearSpy };
};

const jsonResponse = (status, body) => ({
  ok: status < 400, status, json: async () => body,
});

describe('upgrades.service', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.doUnmock(tokenServicePath);
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
    delete global.fetch;
  });

  it('GETs /v1/upgrades/validate con los 5 headers y PNR en mayúsculas', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { pnr: 'AYQQQS' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ayqqqs' });

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://apim.example/API_CanalesDigitales/v1/upgrades/validate');
    expect(init.headers).toEqual({
      Authorization: 'azure-jwt',
      'Ocp-Apim-Subscription-Key': 'sub-key',
      AuthorizationUpgrades: 'cognito-jwt',
      channel: 'MMB',
      PNR: 'AYQQQS',
    });
    expect(res).toEqual({ ok: true, status: 200, body: { pnr: 'AYQQQS' } });
  });

  it('usa AV_UPGRADES_CHANNEL de environment cuando existe', async () => {
    mockDeps({ envRows: [{ Key: 'AV_UPGRADES_CHANNEL', Text: 'WEB' }] });
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    const { validateUpgrade } = await import(servicePath);

    await validateUpgrade({ pnr: 'ABC123' });

    expect(global.fetch.mock.calls[0][1].headers.channel).toBe('WEB');
  });

  it('ante 401 limpia ambos caches y reintenta UNA vez', async () => {
    const { clearSpy } = mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, null))
      .mockResolvedValueOnce(jsonResponse(200, { pnr: 'X' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ABC123' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(clearSpy).toHaveBeenCalledWith('digital');
    expect(clearSpy).toHaveBeenCalledWith('upgrades');
    expect(res.ok).toBe(true);
  });

  it('un segundo 401 NO reintenta de nuevo y devuelve ok:false', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(401, null));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ABC123' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: false, status: 401, body: null });
  });

  it('body no-JSON no lanza: devuelve body null', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('bad json'); } });
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ABC123' });

    expect(res).toEqual({ ok: true, status: 200, body: null });
  });

  it('getUpgradesConfig: defaults y overrides de environment', async () => {
    mockDeps({ envRows: [{ Key: 'AV_UPGRADES_MMB_URL', Text: 'https://uat.example/{lang}/upgrade' }] });
    const { getUpgradesConfig, DEFAULT_MMB_URL } = await import(servicePath);

    const cfg = await getUpgradesConfig();

    expect(cfg.mmbUrl).toBe('https://uat.example/{lang}/upgrade');
    expect(cfg.channel).toBe('MMB');
    expect(DEFAULT_MMB_URL).toBe('https://gestiona.avianca.com/{lang}/manage/upgrade-business-class');
  });
});
