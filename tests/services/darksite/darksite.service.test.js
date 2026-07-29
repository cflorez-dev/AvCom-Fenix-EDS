// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';

const aemDataPath = '../../../scripts/utils/aem-data.js';
const servicePath = '../../../scripts/services/darksite/darksite.service.js';

const CONFIG_URL = 'https://publish-p34631-e1321407.adobeaemcloud.com/graphql/execute.json/avianca/getDarksiteConfig';

const ENV_ROWS = [
  { Key: 'AV_DARKSITE_CONFIG_URL', Text: CONFIG_URL },
];

function mockEnv(rows = ENV_ROWS) {
  vi.doMock(aemDataPath, () => ({
    fetchAEMData: vi.fn().mockResolvedValue({ data: rows }),
  }));
}

function mockFetchResponse(body, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    headers: { get: () => 'application/json' },
    json: async () => body,
  });
}

const CF_ON = {
  data: {
    darksiteConfigList: {
      items: [{
        enabled: true, level: 'max', affectedPos: ['CO', 'US'], blockedPaths: ['/ofertas-destinos'], lastUpdated: '2026-07-07T10:00:00Z',
      }],
    },
  },
};

describe('darksite.service', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('fetchDarksiteState normaliza la respuesta de la persisted query directa y cachea en localStorage', async () => {
    mockEnv();
    mockFetchResponse(CF_ON);
    const svc = await import(servicePath);
    const state = await svc.fetchDarksiteState();
    expect(state.enabled).toBe(true);
    expect(state.affectedPos).toEqual(['CO', 'US']);
    expect(JSON.parse(localStorage.getItem(svc.STATE_KEY)).enabled).toBe(true);

    // GET simple a la URL exacta de AV_DARKSITE_CONFIG_URL, sin method POST
    // (evita preflight CORS: sin headers custom, sin body).
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = global.fetch.mock.calls[0];
    expect(calledUrl).toBe(CONFIG_URL);
    expect(calledOptions?.method).not.toBe('POST');
    expect(calledOptions?.body).toBeUndefined();
    expect(calledOptions?.headers).toBeUndefined();
  });

  it('fail-open: HTTP 500 devuelve null y no rompe', async () => {
    mockEnv();
    mockFetchResponse({}, false);
    const svc = await import(servicePath);
    expect(await svc.fetchDarksiteState()).toBeNull();
    expect(localStorage.getItem(svc.STATE_KEY)).toBeNull();
  });

  // Fix F2: respuesta HTTP ok y bien formada, pero la query no trae items
  // (CF vacío/no publicado). Antes devolvía null sin cachear; ahora cachea un
  // sentinel "disabled" para no reintentar el fetch cada carga cuando el
  // resultado ya se conoce.
  it('F2: respuesta ok sin items cachea un sentinel disabled en vez de null', async () => {
    mockEnv();
    mockFetchResponse({ data: { darksiteConfigList: { items: [] } } });
    const svc = await import(servicePath);
    const state = await svc.fetchDarksiteState();
    expect(state).toEqual({
      enabled: false,
      level: 'max',
      affectedPos: [],
      blockedPaths: [],
      lastUpdated: null,
      activatedAt: null,
      contactSwitchMinutes: 60,
      flights: [],
    });
    expect(JSON.parse(localStorage.getItem(svc.STATE_KEY))).toEqual(state);
  });

  it('fail-open: enabled no estrictamente true queda apagado', async () => {
    mockEnv();
    mockFetchResponse({ data: { darksiteConfigList: { items: [{ enabled: 'true', affectedPos: ['ALL'] }] } } });
    const svc = await import(servicePath);
    const state = await svc.fetchDarksiteState();
    expect(state.enabled).toBe(false);
  });

  it('fail-open: env sin AV_DARKSITE_CONFIG_URL devuelve null sin fetch', async () => {
    mockEnv([{ Key: 'AV_DARKSITE_CONFIG_URL', Text: '' }]);
    global.fetch = vi.fn();
    const svc = await import(servicePath);
    expect(await svc.fetchDarksiteState()).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fail-open: timeout aborta el fetch y devuelve null', async () => {
    mockEnv();
    vi.useFakeTimers();
    global.fetch = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    }));
    const svc = await import(servicePath);
    const promise = svc.fetchDarksiteState();
    await vi.advanceTimersByTimeAsync(800);
    expect(await promise).toBeNull();
    vi.useRealTimers();
  });

  it('readCachedState devuelve null con JSON corrupto', async () => {
    mockEnv();
    const svc = await import(servicePath);
    localStorage.setItem(svc.STATE_KEY, '{corrupto');
    expect(svc.readCachedState()).toBeNull();
  });

  it('isActiveForPos: ALL activa cualquier POS; lista respeta mayúsculas/minúsculas de entrada', async () => {
    mockEnv();
    const svc = await import(servicePath);
    const base = {
      enabled: true, level: 'max', affectedPos: ['ALL'], blockedPaths: [], lastUpdated: null,
    };
    expect(svc.isActiveForPos(base, 'ec')).toBe(true);
    expect(svc.isActiveForPos({ ...base, affectedPos: ['CO'] }, 'co')).toBe(true);
    expect(svc.isActiveForPos({ ...base, affectedPos: ['CO'] }, 'US')).toBe(false);
    expect(svc.isActiveForPos({ ...base, enabled: false }, 'CO')).toBe(false);
    expect(svc.isActiveForPos({ ...base, affectedPos: [] }, 'CO')).toBe(false);
    expect(svc.isActiveForPos(null, 'CO')).toBe(false);
  });

  it('isPathBlocked matchea por prefijo con y sin prefijo de idioma', async () => {
    mockEnv();
    const svc = await import(servicePath);
    const state = {
      enabled: true, level: 'max', affectedPos: ['ALL'], blockedPaths: ['/ofertas-destinos'], lastUpdated: null,
    };
    expect(svc.isPathBlocked(state, '/es/ofertas-destinos')).toBe(true);
    expect(svc.isPathBlocked(state, '/en/ofertas-destinos/vuelos-baratos')).toBe(true);
    expect(svc.isPathBlocked(state, '/ofertas-destinos')).toBe(true);
    expect(svc.isPathBlocked(state, '/es/equipaje')).toBe(false);
    expect(svc.isPathBlocked(state, '/es/ofertas-destinos-otra')).toBe(false);
    expect(svc.isPathBlocked(null, '/es/ofertas-destinos')).toBe(false);
  });

  // Fix F7: el CF puede autorarse sin la barra inicial en blockedPaths
  // (p.ej. "ofertas-destinos" en vez de "/ofertas-destinos"); normalizeState
  // debe anteponerla para que isPathBlocked siga matcheando por prefijo.
  it('F7: normalizeState antepone "/" a blockedPaths que llegan sin ella', async () => {
    mockEnv();
    mockFetchResponse({
      data: {
        darksiteConfigList: {
          items: [{ enabled: true, affectedPos: ['ALL'], blockedPaths: ['ofertas-destinos'] }],
        },
      },
    });
    const svc = await import(servicePath);
    const state = await svc.fetchDarksiteState();
    expect(state.blockedPaths).toEqual(['/ofertas-destinos']);
    expect(svc.isPathBlocked(state, '/es/ofertas-destinos')).toBe(true);
  });

  // Task 11: normalización de activatedAt/contactSwitchMinutes (contactos
  // temporizados). Spec: docs/superpowers/specs/2026-07-07-darksite-design.md §7.4.
  describe('normalización de activatedAt/contactSwitchMinutes', () => {
    it('valores válidos se preservan', async () => {
      mockEnv();
      mockFetchResponse({
        data: {
          darksiteConfigList: {
            items: [{
              enabled: true,
              affectedPos: ['ALL'],
              activatedAt: '2026-07-07T10:00:00Z',
              contactSwitchMinutes: 30,
            }],
          },
        },
      });
      const svc = await import(servicePath);
      const state = await svc.fetchDarksiteState();
      expect(state.activatedAt).toBe('2026-07-07T10:00:00Z');
      expect(state.contactSwitchMinutes).toBe(30);
    });

    it('activatedAt ausente ⇒ null; contactSwitchMinutes ausente ⇒ default 60', async () => {
      mockEnv();
      mockFetchResponse({
        data: { darksiteConfigList: { items: [{ enabled: true, affectedPos: ['ALL'] }] } },
      });
      const svc = await import(servicePath);
      const state = await svc.fetchDarksiteState();
      expect(state.activatedAt).toBeNull();
      expect(state.contactSwitchMinutes).toBe(60);
    });

    it('valores basura (no-string activatedAt, contactSwitchMinutes <=0 o no-numérico) caen a defaults', async () => {
      mockEnv();
      mockFetchResponse({
        data: {
          darksiteConfigList: {
            items: [{
              enabled: true,
              affectedPos: ['ALL'],
              activatedAt: 12345,
              contactSwitchMinutes: 'no-numero',
            }],
          },
        },
      });
      const svc = await import(servicePath);
      const state = await svc.fetchDarksiteState();
      expect(state.activatedAt).toBeNull();
      expect(state.contactSwitchMinutes).toBe(60);

      mockFetchResponse({
        data: {
          darksiteConfigList: {
            items: [{
              enabled: true, affectedPos: ['ALL'], activatedAt: '', contactSwitchMinutes: -5,
            }],
          },
        },
      });
      const state2 = await svc.fetchDarksiteState();
      expect(state2.activatedAt).toBeNull();
      expect(state2.contactSwitchMinutes).toBe(60);

      mockFetchResponse({
        data: {
          darksiteConfigList: {
            items: [{ enabled: true, affectedPos: ['ALL'], contactSwitchMinutes: 0 }],
          },
        },
      });
      const state3 = await svc.fetchDarksiteState();
      expect(state3.contactSwitchMinutes).toBe(60);
    });

    it('contactSwitchMinutes numérico como string se acepta', async () => {
      mockEnv();
      mockFetchResponse({
        data: {
          darksiteConfigList: {
            items: [{ enabled: true, affectedPos: ['ALL'], contactSwitchMinutes: '45' }],
          },
        },
      });
      const svc = await import(servicePath);
      const state = await svc.fetchDarksiteState();
      expect(state.contactSwitchMinutes).toBe(45);
    });
  });
});
