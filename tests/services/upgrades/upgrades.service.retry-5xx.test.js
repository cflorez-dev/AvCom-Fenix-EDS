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

const mockDeps = ({ clearSpy = vi.fn() } = {}) => {
  vi.doMock(tokenServicePath, () => ({
    getApimCredentials: vi.fn().mockImplementation((s) => {
      if (s === 'digital') return Promise.resolve(DIGITAL);
      if (s === 'upgrades') return Promise.resolve(UPGRADES);
      return Promise.reject(new Error(`unknown ${s}`));
    }),
    clearApimTokenCache: clearSpy,
  }));
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
  }));
  return { clearSpy };
};

const jsonResponse = (status, body) => ({
  ok: status < 400, status, json: async () => body,
});

// El endpoint de QA devuelve 503/500 en la primera llamada de una ráfaga. Sin retry
// eso pinta el pop-up de error técnico sobre una reserva perfectamente válida, y
// contamina cualquier prueba de los demás estados (CA-02/CA-03/CA-04).
describe('upgrades.service — retry ante 5xx transitorio', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.doUnmock(tokenServicePath);
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
    delete global.fetch;
  });

  it('ante 503 reintenta UNA vez y devuelve la respuesta buena', async () => {
    mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503, null))
      .mockResolvedValueOnce(jsonResponse(200, { pnr: 'CD3IHK', passengers: [], segments: [] }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'CD3IHK' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
  });

  it('también reintenta ante 500', async () => {
    mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(500, null))
      .mockResolvedValueOnce(jsonResponse(200, { pnr: 'CD35O2' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'CD35O2' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(true);
  });

  it('un segundo 5xx NO reintenta de nuevo: cae a error técnico', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(503, null));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'CD3IHK' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: false, status: 503, body: null });
  });

  it('NO limpia los caches de token ante 5xx (el token es válido)', async () => {
    const { clearSpy } = mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503, null))
      .mockResolvedValueOnce(jsonResponse(200, {}));
    const { validateUpgrade } = await import(servicePath);

    await validateUpgrade({ pnr: 'CD3IHK' });

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('4xx de negocio no se reintenta: 404 pasa derecho a NOT_FOUND', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(404, null));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'ZZZZZZ' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(404);
  });

  it('los reintentos de auth y de servidor son independientes: 401 y luego 503', async () => {
    const { clearSpy } = mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, null))
      .mockResolvedValueOnce(jsonResponse(503, null))
      .mockResolvedValueOnce(jsonResponse(200, { pnr: 'CD38HP' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'CD38HP' });

    // 401 gasta el retry de auth, 503 gasta el de servidor, la 3.ª va bien.
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(clearSpy).toHaveBeenCalledWith('digital');
    expect(res.ok).toBe(true);
  });
});
