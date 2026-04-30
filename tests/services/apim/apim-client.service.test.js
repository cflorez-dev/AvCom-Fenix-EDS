import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const tokenServicePath = '../../../scripts/services/apim/apim-token.service.js';
const clientServicePath = '../../../scripts/services/apim/apim-client.service.js';

const FAKE_DIGITAL_CREDS = {
  token: 'Bearer fake-jwt-digital',
  subscriptionKey: 'sub-key-digital',
  apimBaseUrl: 'https://apim.example/API_CanalesDigitales',
  apiVersion: null,
  expiresAt: Date.now() + 60 * 60 * 1000,
};

const FAKE_PRICING_CREDS = {
  token: 'Bearer fake-jwt-pricing',
  subscriptionKey: 'sub-key-pricing',
  apimBaseUrl: 'https://apim.example/API_Birchman',
  apiVersion: 'v1',
  expiresAt: Date.now() + 60 * 60 * 1000,
};

const mockTokenModule = ({
  digitalCreds = FAKE_DIGITAL_CREDS,
  pricingCreds = FAKE_PRICING_CREDS,
  clearSpy = vi.fn(),
} = {}) => {
  const getCreds = vi.fn().mockImplementation((service) => {
    if (service === 'digital') return Promise.resolve(digitalCreds);
    if (service === 'pricing') return Promise.resolve(pricingCreds);
    return Promise.reject(new Error(`Unknown service: ${service}`));
  });
  vi.doMock(tokenServicePath, () => ({
    getApimCredentials: getCreds,
    clearApimTokenCache: clearSpy,
  }));
  return { getCreds, clearSpy };
};

const mockFetchOk = (payload) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });
};

const mockFetchSequence = (...responses) => {
  const fetchMock = vi.fn();
  responses.forEach((r) => {
    fetchMock.mockResolvedValueOnce({
      ok: r.ok ?? r.status < 400,
      status: r.status ?? 200,
      statusText: r.statusText ?? '',
      json: async () => r.body,
      text: async () => (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)),
    });
  });
  global.fetch = fetchMock;
  return fetchMock;
};

describe('apim-client.service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock(tokenServicePath);
    vi.restoreAllMocks();
    delete global.fetch;
  });

  describe('consultaCombinabilidad', () => {
    it('uses digital credentials and POSTs to /consultacombinabilidad', async () => {
      mockTokenModule();
      mockFetchOk([{ iataCityCode: 'BOG' }]);
      const { consultaCombinabilidad } = await import(clientServicePath);

      await consultaCombinabilidad({
        idioma: 'es',
        codigoIataOrigen: 'BOG',
        codigoIataDestino: 'MAD',
      });

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toBe('https://apim.example/API_CanalesDigitales/consultacombinabilidad');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Bearer fake-jwt-digital');
      expect(init.headers['Ocp-Apim-Subscription-Key']).toBe('sub-key-digital');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(init.body)).toEqual({
        idioma: 'es',
        codigoIataOrigen: 'BOG',
        codigoIataDestino: 'MAD',
      });
    });

    it('returns the parsed JSON payload', async () => {
      mockTokenModule();
      mockFetchOk([{ iataCityCode: 'BOG' }, { iataCityCode: 'MDE' }]);
      const { consultaCombinabilidad } = await import(clientServicePath);

      const result = await consultaCombinabilidad({});

      expect(result).toEqual([{ iataCityCode: 'BOG' }, { iataCityCode: 'MDE' }]);
    });

    it('defaults missing params to empty/es', async () => {
      mockTokenModule();
      mockFetchOk([]);
      const { consultaCombinabilidad } = await import(clientServicePath);

      await consultaCombinabilidad();

      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body).toEqual({ idioma: 'es', codigoIataOrigen: '', codigoIataDestino: '' });
    });
  });

  describe('getCheapestPrices', () => {
    it('uses pricing credentials and GETs with query params', async () => {
      mockTokenModule();
      mockFetchOk({});
      const { getCheapestPrices } = await import(clientServicePath);

      await getCheapestPrices({
        tripType: 'RT',
        originCityCode: 'BOG',
        destinationCityCode: 'MAD',
        pos: 'CO',
        month: 5,
        year: 2026,
      });

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toContain('https://apim.example/API_Birchman/v1/rt/cheapestPrices?');
      expect(url).toContain('tripType=RT');
      expect(url).toContain('OriginCityCode=BOG');
      expect(url).toContain('DestinationCityCode=MAD');
      expect(url).toContain('POS=CO');
      expect(url).toContain('month=5');
      expect(url).toContain('year=2026');
      expect(init.method).toBe('GET');
      expect(init.body).toBeUndefined();
      expect(init.headers.Authorization).toBe('Bearer fake-jwt-pricing');
      expect(init.headers['Ocp-Apim-Subscription-Key']).toBe('sub-key-pricing');
    });

    it('uses apiVersion v2 when credentials report v2 (PRD scenario)', async () => {
      mockTokenModule({
        pricingCreds: { ...FAKE_PRICING_CREDS, apiVersion: 'v2' },
      });
      mockFetchOk({});
      const { getCheapestPrices } = await import(clientServicePath);

      await getCheapestPrices({
        tripType: 'RT', originCityCode: 'BOG', destinationCityCode: 'MAD', pos: 'CO', month: 1, year: 2026,
      });

      expect(global.fetch.mock.calls[0][0]).toContain('/v2/rt/cheapestPrices');
    });

    it('falls back to v1 when apiVersion is null/missing', async () => {
      mockTokenModule({
        pricingCreds: { ...FAKE_PRICING_CREDS, apiVersion: null },
      });
      mockFetchOk({});
      const { getCheapestPrices } = await import(clientServicePath);

      await getCheapestPrices({
        tripType: 'RT', originCityCode: 'BOG', destinationCityCode: 'MAD', pos: 'CO', month: 1, year: 2026,
      });

      expect(global.fetch.mock.calls[0][0]).toContain('/v1/rt/cheapestPrices');
    });
  });

  describe('getCheapestPricesOutbound', () => {
    it('GETs the same /cheapestPrices endpoint as ida, plus OutboundDate query param', async () => {
      mockTokenModule();
      mockFetchOk({});
      const { getCheapestPricesOutbound } = await import(clientServicePath);

      await getCheapestPricesOutbound({
        tripType: 'RT',
        originCityCode: 'BOG',
        destinationCityCode: 'MAD',
        pos: 'CO',
        month: 5,
        year: 2026,
        outboundDate: '20260615',
      });

      const url = global.fetch.mock.calls[0][0];
      // APIM only exposes /rt/cheapestPrices; OutboundDate flips the response to "vuelta".
      expect(url).toContain('/v1/rt/cheapestPrices?');
      expect(url).not.toContain('cheapestPricesOutbound');
      expect(url).toContain('OutboundDate=20260615');
    });
  });

  describe('auth retry on 401', () => {
    it('clears cache and retries once on 401', async () => {
      const { clearSpy } = mockTokenModule();
      mockFetchSequence(
        { status: 401, body: 'unauthorized' },
        { status: 200, body: [{ ok: true }] },
      );
      const { consultaCombinabilidad } = await import(clientServicePath);

      const result = await consultaCombinabilidad({ codigoIataOrigen: 'BOG' });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(clearSpy).toHaveBeenCalledWith('digital');
      expect(result).toEqual([{ ok: true }]);
    });

    it('does NOT retry indefinitely if second call also returns 401', async () => {
      mockTokenModule();
      mockFetchSequence(
        { status: 401, body: 'unauthorized' },
        { status: 401, body: 'still unauthorized' },
      );
      const { consultaCombinabilidad } = await import(clientServicePath);

      await expect(consultaCombinabilidad({})).rejects.toThrow(/401/);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('throws with status and body text on non-401 error response', async () => {
      mockTokenModule();
      mockFetchSequence({ status: 500, statusText: 'Server Error', body: 'boom' });
      const { consultaCombinabilidad } = await import(clientServicePath);

      await expect(consultaCombinabilidad({})).rejects.toThrow(/500.*boom/);
    });

    it('propagates token service errors (e.g. AV_TOKEN_ENDPOINT missing)', async () => {
      vi.doMock(tokenServicePath, () => ({
        getApimCredentials: vi.fn().mockRejectedValue(new Error('AV_TOKEN_ENDPOINT missing')),
        clearApimTokenCache: vi.fn(),
      }));
      const { consultaCombinabilidad } = await import(clientServicePath);

      await expect(consultaCombinabilidad({})).rejects.toThrow(/AV_TOKEN_ENDPOINT missing/);
    });
  });
});
