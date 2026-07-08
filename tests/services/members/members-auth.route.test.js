/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const routePath = '../../../scripts/services/members/members-auth.route.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
const configPath = '../../../scripts/services/members/members-config.js';
const storePath = '../../../scripts/services/members/session.store.js';
const eventsPath = '../../../scripts/services/members/session.events.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';
const loaderAtomPath = '../../../design-system/atoms/simple-loader/simple-loader.js';

const setupDom = (pathname) => {
  const assign = vi.fn();
  const store = {};
  globalThis.window = { location: { pathname, search: '', assign } };
  globalThis.document = {
    documentElement: { lang: 'pt' },
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
    body: { appendChild: () => {} },
  };
  globalThis.sessionStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
  return { assign, store };
};

const hostPath = '../../../scripts/services/members/members-modal-host.js';

const mockDeps = ({ loginReturnTo = 'home', loginReturnUrl, lang = 'fr' } = {}) => {
  vi.doMock(loaderAtomPath, () => ({ SimpleLoader: () => null }));
  // El modal pending ahora se rutea por el host central (lazy import); lo espiamos.
  const showMembersModal = vi.fn().mockResolvedValue(undefined);
  vi.doMock(hostPath, () => ({ showMembersModal }));
  const loadLmScript = vi.fn().mockResolvedValue(undefined);
  vi.doMock(loaderPath, () => ({
    loadLmScript,
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  vi.doMock(configPath, () => ({
    loadMembersConfig: vi.fn().mockResolvedValue({ loginReturnTo, loginReturnUrl }),
  }));
  const setSession = vi.fn();
  vi.doMock(storePath, () => ({ setSession }));
  const emitCrossTab = vi.fn();
  vi.doMock(eventsPath, () => ({
    emitCrossTab,
    MEMBERS_EVENTS: { LOGIN_SUCCESS: 'members/login-success', LOGOUT: 'members/logout' },
  }));
  vi.doMock(langPath, () => ({ getStoredLanguage: () => lang }));
  return {
    loadLmScript, setSession, emitCrossTab, showMembersModal,
  };
};

describe('members/members-auth.route', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.sessionStorage;
  });

  it('redirect-login: emite login-success y redirige al home del POS', async () => {
    const { assign } = setupDom('/members/auth/redirect-login');
    const { setSession, emitCrossTab } = mockDeps({ loginReturnTo: 'home', lang: 'fr' });
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(setSession).toHaveBeenCalledWith({ status: 'authenticated' });
    expect(emitCrossTab).toHaveBeenCalledWith('members/login-success', {});
    expect(assign).toHaveBeenCalledWith('/fr/');
  });

  it('redirect-login con loginReturnTo=origin: redirige a la ruta guardada y la limpia', async () => {
    const { assign, store } = setupDom('/members/auth/redirect-login');
    store['members-return-to'] = '/pt/ofertas';
    mockDeps({ loginReturnTo: 'origin', lang: 'pt' });
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(assign).toHaveBeenCalledWith('/pt/ofertas');
    expect('members-return-to' in store).toBe(false);
  });

  it('redirect-login con loginReturnTo=url: redirige a loginReturnUrl e ignora el origen', async () => {
    const { assign, store } = setupDom('/members/auth/redirect-login');
    store['members-return-to'] = '/es/ofertas'; // en modo url se ignora
    mockDeps({ loginReturnTo: 'url', loginReturnUrl: '/es/members', lang: 'es' });
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(assign).toHaveBeenCalledWith('/es/members');
    expect('members-return-to' in store).toBe(false);
  });

  it('redirect-login con loginReturnTo=url pero loginReturnUrl inseguro/ausente: cae al home', async () => {
    const { assign } = setupDom('/members/auth/redirect-login');
    mockDeps({ loginReturnTo: 'url', loginReturnUrl: '//evil.com', lang: 'es' });
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(assign).toHaveBeenCalledWith('/es/');
  });

  it('redirect-logout: limpia a anonymous y redirige al home', async () => {
    const { assign } = setupDom('/members/auth/redirect-logout');
    const { setSession, emitCrossTab } = mockDeps({ lang: 'es' });
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(setSession).toHaveBeenCalledWith({ status: 'anonymous', user: null, error: null });
    expect(emitCrossTab).toHaveBeenCalledWith('members/logout', {});
    expect(assign).toHaveBeenCalledWith('/es/');
  });

  it('callback: ejecuta lmCompleteLogin cuando el script LM está listo', async () => {
    setupDom('/members/auth/callback');
    const { loadLmScript } = mockDeps();
    globalThis.window.lmCompleteLogin = vi.fn();
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(loadLmScript).toHaveBeenCalled();
    expect(globalThis.window.lmCompleteLogin).toHaveBeenCalledTimes(1);
  });

  it('callback: si lmCompleteLogin devuelve E.EON → redirige a home + setea pending-error mark', async () => {
    const { assign, store } = setupDom('/members/auth/callback');
    mockDeps({ lang: 'pt' });
    globalThis.window.lmCompleteLogin = vi.fn().mockResolvedValue('E.EON.6 - sin code_verifier');
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(globalThis.window.lmCompleteLogin).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith('/pt/'); // redirige a home
    expect(store['members-auth-pending-error']).toBe('E.EON.6 - sin code_verifier'); // marca guardada
  });

  it('callback con ?error= → redirige a home + setea pending-error mark, NO corre lmCompleteLogin', async () => {
    const { assign, store } = setupDom('/members/auth/callback');
    globalThis.window.location.search = '?error=invalid_request&error_description=Missing+code_challenge_method';
    mockDeps({ lang: 'es' });
    globalThis.window.lmCompleteLogin = vi.fn();
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(globalThis.window.lmCompleteLogin).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith('/es/'); // redirige a home
    expect(store['members-auth-pending-error']).toBe('invalid_request'); // marca guardada
  });

  it('ruta que NO es members/auth: no hace nada', async () => {
    const { assign } = setupDom('/pt/');
    const { setSession } = mockDeps();
    const { handleAuthRoute } = await import(routePath);
    await handleAuthRoute();
    expect(setSession).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('showPendingErrorModal: con marca en sessionStorage → muestra el modal clasificado + limpia marca', async () => {
    const { store } = setupDom('/pt/');
    store['members-auth-pending-error'] = 'E.EON.6'; // callback error → connection-error
    const { showMembersModal } = mockDeps();
    const { showPendingErrorModal } = await import(routePath);
    await showPendingErrorModal();
    expect(showMembersModal).toHaveBeenCalledWith('connection-error'); // clasificado y ruteado al host
    expect('members-auth-pending-error' in store).toBe(false); // marca limpiada
  });

  it('showPendingErrorModal: marca no reconocida → cae a generic-error', async () => {
    const { store } = setupDom('/pt/');
    store['members-auth-pending-error'] = 'invalid_request'; // no está en la tabla → generic-error
    const { showMembersModal } = mockDeps();
    const { showPendingErrorModal } = await import(routePath);
    await showPendingErrorModal();
    expect(showMembersModal).toHaveBeenCalledWith('generic-error');
    expect('members-auth-pending-error' in store).toBe(false);
  });

  it('showPendingErrorModal: sin marca → no hace nada', async () => {
    setupDom('/pt/');
    // no setear la marca en sessionStorage
    const { showMembersModal } = mockDeps();
    const { showPendingErrorModal } = await import(routePath);
    await showPendingErrorModal();
    expect(showMembersModal).not.toHaveBeenCalled(); // no mostró modal
  });

  it('showPendingErrorModal: si sessionStorage falla en getItem → no crashea', async () => {
    setupDom('/pt/');
    globalThis.sessionStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('sessionStorage error');
    });
    mockDeps();
    const { showPendingErrorModal } = await import(routePath);
    // debe ejecutar sin error (el catch ignora la excepción)
    await expect(showPendingErrorModal()).resolves.not.toThrow();
  });
});
