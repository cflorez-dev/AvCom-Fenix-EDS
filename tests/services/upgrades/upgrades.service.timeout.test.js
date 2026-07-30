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

const mockDeps = ({ credentials } = {}) => {
  vi.doMock(tokenServicePath, () => ({
    getApimCredentials: credentials || vi.fn().mockImplementation((s) => {
      if (s === 'digital') return Promise.resolve(DIGITAL);
      if (s === 'upgrades') return Promise.resolve(UPGRADES);
      return Promise.reject(new Error(`unknown ${s}`));
    }),
    clearApimTokenCache: vi.fn(),
  }));
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: [] }),
  }));
};

const jsonResponse = (status, body) => ({
  ok: status < 400, status, json: async () => body,
});

const neverResolves = () => new Promise(() => {});

// Sin límite de tiempo, un backend que no responde deja el FullPageLoader a pantalla
// completa para siempre: no tiene botón de cierre, ni Escape, ni clic fuera. La única
// salida era recargar la página.
describe('upgrades.service — límite de tiempo de /validate', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.doUnmock(tokenServicePath);
    vi.doUnmock(aemDataPath);
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete global.fetch;
  });

  it('rechaza cuando la petición se cuelga, en vez de esperar indefinidamente', async () => {
    vi.useFakeTimers();
    mockDeps();
    global.fetch = vi.fn(neverResolves);
    const { validateUpgrade, VALIDATE_TIMEOUT_MS } = await import(servicePath);

    const pending = validateUpgrade({ pnr: 'CD3IHK' });
    const rejects = expect(pending).rejects.toThrow(/tiempo/i);
    await vi.advanceTimersByTimeAsync(VALIDATE_TIMEOUT_MS + 50);

    await rejects;
  });

  it('el timeout NO consume reintento: falla rápido y acota el loader', async () => {
    vi.useFakeTimers();
    mockDeps();
    global.fetch = vi.fn(neverResolves);
    const { validateUpgrade, VALIDATE_TIMEOUT_MS } = await import(servicePath);

    const pending = validateUpgrade({ pnr: 'CD3IHK' });
    const rejects = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(VALIDATE_TIMEOUT_MS + 50);
    await rejects;

    // Reintentar un cuelgue duplicaría la espera, que es justo lo que se quiere evitar.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('aborta la petición en curso para no dejar el socket colgado', async () => {
    vi.useFakeTimers();
    mockDeps();
    let capturedSignal;
    global.fetch = vi.fn((_url, init) => {
      capturedSignal = init.signal;
      return neverResolves();
    });
    const { validateUpgrade, VALIDATE_TIMEOUT_MS } = await import(servicePath);

    const pending = validateUpgrade({ pnr: 'CD3IHK' });
    const rejects = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(VALIDATE_TIMEOUT_MS + 50);
    await rejects;

    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect(capturedSignal.aborted).toBe(true);
  });

  it('también corta si el cuelgue es ANTES del fetch (servicio de token)', async () => {
    vi.useFakeTimers();
    // Aquí el signal no tendría nada que abortar: hace falta el límite global.
    mockDeps({ credentials: vi.fn(neverResolves) });
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(200, {})));
    const { validateUpgrade, VALIDATE_TIMEOUT_MS } = await import(servicePath);

    const pending = validateUpgrade({ pnr: 'CD3IHK' });
    const rejects = expect(pending).rejects.toThrow(/tiempo/i);
    await vi.advanceTimersByTimeAsync(VALIDATE_TIMEOUT_MS + 50);
    await rejects;

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('una respuesta normal no se ve afectada: no hay timeout falso', async () => {
    mockDeps();
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { pnr: 'CD3IHK' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'CD3IHK' });

    expect(res).toEqual({ ok: true, status: 200, body: { pnr: 'CD3IHK' } });
  });

  it('el retry ante 5xx sigue funcionando con el límite puesto', async () => {
    mockDeps();
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503, null))
      .mockResolvedValueOnce(jsonResponse(200, { pnr: 'CD3IHK' }));
    const { validateUpgrade } = await import(servicePath);

    const res = await validateUpgrade({ pnr: 'CD3IHK' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(true);
  });

  it('el límite es por intento y acota el peor caso a un valor razonable', async () => {
    const { VALIDATE_TIMEOUT_MS, RETRY_5XX_DELAY_MS } = await import(servicePath);

    // Peor caso visible: un 5xx rápido + backoff + un intento que se cuelga.
    const peorCaso = VALIDATE_TIMEOUT_MS + RETRY_5XX_DELAY_MS;
    expect(VALIDATE_TIMEOUT_MS).toBeGreaterThanOrEqual(8000);
    expect(peorCaso).toBeLessThanOrEqual(15000);
  });
});
