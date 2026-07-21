/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const servicePath = '../../../scripts/services/members/session.service.js';
const storePath = '../../../scripts/services/members/session.store.js';
const eventsPath = '../../../scripts/services/members/session.events.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
const configPath = '../../../scripts/services/members/members-config.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

const flush = async () => {
  for (let i = 0; i < 12; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => { setTimeout(r, 0); });
  }
};

const setupDom = ({ cookie = '', sessionData = {} } = {}) => {
  const store = { ...sessionData };
  globalThis.window = {};
  globalThis.document = { cookie };
  globalThis.sessionStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
  return { store };
};

const mockDeps = () => {
  const setSession = vi.fn();
  vi.doMock(storePath, () => ({ setSession }));
  const handlers = {};
  vi.doMock(eventsPath, () => ({
    onCrossTab: (event, cb) => { handlers[event] = cb; },
    MEMBERS_EVENTS: { LOGIN_SUCCESS: 'members/login-success', LOGOUT: 'members/logout' },
  }));
  const loadLmScript = vi.fn().mockResolvedValue(undefined);
  vi.doMock(loaderPath, () => ({
    loadLmScript,
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  // 1255576: el handler LOGOUT ahora usa la config (portalRoutes) y el locale.
  // Mockeamos members-config (evita fetchAEMData) y language-country-selector
  // (evita los side-effects de import de ese módulo pesado).
  const loadMembersConfig = vi.fn().mockResolvedValue({
    portalRoutes: ['/members'],
    portalExclude: ['/members/auth'],
  });
  vi.doMock(configPath, () => ({ loadMembersConfig }));
  const getStoredLanguage = vi.fn().mockReturnValue('pt');
  vi.doMock(langPath, () => ({ getStoredLanguage }));
  return {
    setSession, handlers, loadLmScript, loadMembersConfig, getStoredLanguage,
  };
};

describe('members/session.service', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.sessionStorage;
    delete globalThis.fetch;
  });

  it('sin cookie → status anonymous', async () => {
    setupDom({ cookie: '' });
    const { setSession } = mockDeps();
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    expect(setSession).toHaveBeenCalledWith({ status: 'anonymous', user: null, error: null });
  });

  it('con cookie + cache → muestra el cache YA y SIEMPRE revalida contra el wrapper', async () => {
    const cachedUser = { tier: 'Gold', firstName: 'Juan' };
    setupDom({ cookie: 'access_token=abc', sessionData: { 'members-profile': JSON.stringify(cachedUser) } });
    const { setSession, loadLmScript } = mockDeps();
    // La revalidación confirma la sesión (mismo perfil) → sigue authenticated.
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        memberProfileDetails: { memberAccount: { tier: 'Gold', memberProfile: { membershipNumber: '123', individualInfo: { givenName: 'Juan' } } } },
      }),
    });
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    // (1) estado inmediato desde cache, sin flash
    expect(setSession).toHaveBeenCalledWith({ status: 'authenticated', user: cachedUser });
    // (2) PERO ahora SIEMPRE revalida: en single-logout la cookie sigue presente y solo el wrapper
    // detecta la expiración → un early-return con cache la ocultaría.
    expect(loadLmScript).toHaveBeenCalled();
    expect(globalThis.window.lmFetchWrapper).toHaveBeenCalledWith('memberProfile', {}, false);
  });

  it('con cookie + sin cache → parsea el Response del wrapper (.json()), lo mapea y lo cachea', async () => {
    const { store } = setupDom({ cookie: 'access_token=abc' });
    const { setSession, loadLmScript } = mockDeps();
    // lmFetchWrapper devuelve un Response CRUDO (no el JSON) → el service le hace .json().
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        memberProfileDetails: {
          memberAccount: {
            tier: 'Gold',
            memberProfile: { membershipNumber: '123', individualInfo: { givenName: 'Juan' } },
          },
        },
      }),
    });
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    expect(loadLmScript).toHaveBeenCalled();
    // refreshLoginFlag=false va en 3ª posición (R={} en 2ª): evita el auto-redirect al SSO (PKCE
    // roto) si el refresh falla. En 2ª posición quedaba en true (bug cazado QA 2026-06-11).
    expect(globalThis.window.lmFetchWrapper).toHaveBeenCalledWith('memberProfile', {}, false);
    expect(store['members-profile']).toContain('Gold');
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({
      status: 'authenticated',
      user: expect.objectContaining({ tier: 'Gold', firstName: 'Juan', membershipNumber: '123' }),
    }));
  });

  it('wrapper devuelve flag E.EON (auto-refresh agotado) → expired, SIN llamar lmRefreshSession', async () => {
    setupDom({ cookie: 'access_token=abc' });
    const { setSession } = mockDeps();
    const refresh = vi.fn();
    globalThis.window.lmRefreshSession = refresh;
    // El wrapper (con refreshLoginFlag=false) agotó su auto-refresh → devuelve el flag E.EON.
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue('E.EON.13 token error');
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    expect(setSession).toHaveBeenLastCalledWith({ status: 'expired', user: null });
    // El camino de carga NO usa lmRefreshSession (arity-0 y redirige); refresca el wrapper.
    expect(refresh).not.toHaveBeenCalled();
  });

  it('el refresh/validación va por lmFetchWrapper(refreshLoginFlag=false), NO por un lmRefreshSession proactivo (1255354)', async () => {
    setupDom({ cookie: 'access_token=abc' });
    const { setSession } = mockDeps();
    const refresh = vi.fn().mockResolvedValue(true);
    globalThis.window.lmRefreshSession = refresh;
    const wrapper = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        memberProfileDetails: {
          memberAccount: { tier: 'Gold', memberProfile: { membershipNumber: '123', individualInfo: { givenName: 'Juan' } } },
        },
      }),
    });
    globalThis.window.lmFetchWrapper = wrapper;
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    expect(wrapper).toHaveBeenCalledWith('memberProfile', {}, false);
    // NO hay lmRefreshSession proactivo: el requisito dice que el refresh lo hace el wrapper.
    expect(refresh).not.toHaveBeenCalled();
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ status: 'authenticated' }));
  });

  it('token vencido + refresh no recupera la sesión (cookie invalidada) → estado expired, sin modal (1255354)', async () => {
    const expired = Math.floor(Date.now() / 1000) - 100; // access_token ya venció
    const jwt = `h.${btoa(JSON.stringify({ exp: expired }))}.s`;
    setupDom({ cookie: `access_token=${jwt}` });
    const { setSession } = mockDeps();
    // El refresh_token también venció: el refresh invalida la cookie y no la recupera.
    globalThis.window.lmRefreshSession = vi.fn(() => {
      globalThis.document.cookie = '';
      return Promise.resolve();
    });
    // wrapper devuelve string de error (no Response) → cae al fallback.
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue('E.EON.13 token error');
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    expect(setSession).toHaveBeenLastCalledWith({ status: 'expired', user: null });
  });

  it('fallback: si el wrapper viene vacío → llama la API directa con Bearer token', async () => {
    setupDom({ cookie: 'access_token=tok; userinfo=13515182590' });
    const { setSession } = mockDeps();
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue({}); // wrapper roto
    // eslint-disable-next-line no-underscore-dangle
    globalThis.window.__LM_LOGIN_CONFIG__ = { API_BASE_PROFILE: 'https://api/svc/user-info-profile' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        memberProfileDetails: { memberAccount: { tier: 'Gold', memberProfile: { membershipNumber: '13515182590', individualInfo: { givenName: 'Ana' } } } },
      }),
    });
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api/svc/user-info-profile/13515182590',
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({
      status: 'authenticated',
      user: expect.objectContaining({ tier: 'Gold', firstName: 'Ana' }),
    }));
  });

  it('logout de otra tab → limpia el cache y vuelve a anonymous', async () => {
    const { store } = setupDom({
      cookie: 'access_token=abc',
      sessionData: { 'members-profile': '{"tier":"Gold"}' },
    });
    const { setSession, handlers } = mockDeps();
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    handlers['members/logout']();
    expect(store['members-profile']).toBeUndefined();
    expect(setSession).toHaveBeenLastCalledWith({ status: 'anonymous', user: null, error: null });
  });

  it('logout cross-tab en página de Portal → redirige a la Home del locale (1255576)', async () => {
    setupDom({ cookie: 'access_token=abc' });
    globalThis.window.location = { pathname: '/es/members/profile', assign: vi.fn() };
    const { handlers, getStoredLanguage } = mockDeps();
    getStoredLanguage.mockReturnValue('es');
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await handlers['members/logout']();
    expect(globalThis.window.location.assign).toHaveBeenCalledWith('/es');
  });

  it('logout cross-tab en Home/corporativa → se queda (sin redirect) y estado anónimo (1255576)', async () => {
    const { store } = setupDom({
      cookie: 'access_token=abc',
      sessionData: { 'members-profile': '{"tier":"Gold"}' },
    });
    globalThis.window.location = { pathname: '/pt/', assign: vi.fn() };
    const { setSession, handlers } = mockDeps();
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await handlers['members/logout']();
    expect(globalThis.window.location.assign).not.toHaveBeenCalled();
    expect(store['members-profile']).toBeUndefined();
    expect(setSession).toHaveBeenLastCalledWith({ status: 'anonymous', user: null, error: null });
  });

  it('página-puente de auth recibe logout → NO redirige (excluida del Portal) (1255576)', async () => {
    setupDom({ cookie: 'access_token=abc' });
    globalThis.window.location = { pathname: '/pt/members/auth/callback', assign: vi.fn() };
    const { handlers } = mockDeps();
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await handlers['members/logout']();
    expect(globalThis.window.location.assign).not.toHaveBeenCalled();
  });

  it('si loadMembersConfig falla en logout → no redirige, no rompe (tab logged-out, nunca colgada) (1255576)', async () => {
    setupDom({ cookie: 'access_token=abc' });
    globalThis.window.location = { pathname: '/pt/members/profile', assign: vi.fn() };
    const { setSession, handlers, loadMembersConfig } = mockDeps();
    loadMembersConfig.mockRejectedValue(new Error('config down'));
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await expect(handlers['members/logout']()).resolves.toBeUndefined();
    expect(globalThis.window.location.assign).not.toHaveBeenCalled();
    expect(setSession).toHaveBeenLastCalledWith({ status: 'anonymous', user: null, error: null });
  });

  it('refresh del token exitoso → carga perfil, sesión authenticated', async () => {
    const { store } = setupDom({ cookie: 'access_token=eyJleHAiOjk5OTk5OTk5OTl9.xxx.yyy' }); // token fresco (exp = year 5138)
    const { setSession } = mockDeps();
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        memberProfileDetails: {
          memberAccount: { tier: 'Gold', memberProfile: { membershipNumber: '123' }, individualInfo: { givenName: 'Ana' } },
        },
      }),
    });
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    // Se esperan 2 llamadas: (1) authenticated + cached = null, (2) authenticated + user loaded
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ status: 'authenticated' }));
    expect(store['members-profile']).toBeDefined();
  });

  it('con cache + token revocado en Lifemiles (wrapper devuelve E.EON al revalidar) → expired y limpia cache', async () => {
    // Single-logout SSO: la cookie access_token sigue presente (el logout cross-domain no la borra)
    // así que isLoggedIn() es true; solo la revalidación contra el wrapper detecta la expiración.
    const { store } = setupDom({
      cookie: 'access_token=abc',
      sessionData: { 'members-profile': '{"tier":"Gold","firstName":"Ana"}' },
    });
    const { setSession } = mockDeps();
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue('E.EON.13 token revoked');
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    // (1) authenticated desde cache → (2) expired tras revalidar
    expect(setSession).toHaveBeenLastCalledWith({ status: 'expired', user: null });
    expect(store['members-profile']).toBeUndefined();
  });

  it('sin cache + wrapper devuelve E.EON → expired (sin flash de datos)', async () => {
    setupDom({ cookie: 'access_token=abc' }); // sin cache de perfil
    const { setSession } = mockDeps();
    globalThis.window.lmFetchWrapper = vi.fn().mockResolvedValue('E.EON.13 token revoked');
    const { initSession } = await import(servicePath);
    initSession();
    await flush();
    await flush();
    expect(setSession).toHaveBeenLastCalledWith({ status: 'expired', user: null });
  });
});

describe('session.service · metas del hero desde eliteGoalsV2 (T18)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.sessionStorage;
  });

  const V2 = {
    gold: { totales: { col: 20000, row: 24000 }, avianca: { col: 8000, row: 12000 } },
    magno: { totales: null, avianca: { col: 110000, row: 110000 } },
  };
  const METRICS = { total: 'historic', avianca: 'av-miles' };

  it('resolveEliteGoalsV2: elige col/row por región + métricas de eliteMetrics (shape v1)', async () => {
    setupDom(); mockDeps();
    const { resolveEliteGoalsV2 } = await import(servicePath);
    expect(resolveEliteGoalsV2(V2, 'gold', 'COL', METRICS)).toEqual({
      metaTotal: 20000, metaAvianca: 8000, metricTotal: 'historic', metricAvianca: 'av-miles',
    });
    expect(resolveEliteGoalsV2(V2, 'gold', 'EXCOL', METRICS)).toEqual({
      metaTotal: 24000, metaAvianca: 12000, metricTotal: 'historic', metricAvianca: 'av-miles',
    });
    // magno: sin totales → metaTotal null (hero no pinta barra total) pero sí avianca
    const magno = resolveEliteGoalsV2(V2, 'magno', 'COL', METRICS);
    expect(magno.metaTotal).toBeNull();
    expect(magno.metaAvianca).toBe(110000);
    // tier sin metas (lifemiles) → undefined (sin barras)
    expect(resolveEliteGoalsV2(V2, 'lifemiles', 'COL', METRICS)).toBeUndefined();
  });

  it('resolveRegionFromProfile: applicableRegion o countryOfResidence+map → COL/EXCOL', async () => {
    setupDom(); mockDeps();
    const { resolveRegionFromProfile } = await import(servicePath);
    expect(resolveRegionFromProfile({ memberProfileDetails: { applicableRegion: { value: 'COL' } } })).toBe('COL');
    expect(resolveRegionFromProfile({ memberProfileDetails: { applicableRegion: { value: 'PER' } } })).toBe('EXCOL');
    const raw = {
      memberProfileDetails: { memberAccount: { memberProfile: { individualInfo: { countryOfResidence: 'CO' } } } },
    };
    expect(resolveRegionFromProfile(raw, { CO: 'COL' })).toBe('COL');
    expect(resolveRegionFromProfile(null)).toBe('EXCOL'); // conservador
  });
});
