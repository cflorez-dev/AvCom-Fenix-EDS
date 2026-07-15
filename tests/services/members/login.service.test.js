/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const loginPath = '../../../scripts/services/members/login.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
const configPath = '../../../scripts/services/members/members-config.js';

const mockDeps = (loginMode) => {
  vi.doMock(loaderPath, () => ({
    loadLmScript: vi.fn().mockResolvedValue(undefined),
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  vi.doMock(configPath, () => ({
    loadMembersConfig: vi.fn().mockResolvedValue({ loginMode }),
  }));
};

describe('members/login.service', () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.window = {};
    globalThis.document = { documentElement: { lang: 'pt' } };
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.document;
  });

  it('invokes window.lmLogin with (lang, isPopup, callbacks)', async () => {
    mockDeps('popup');
    const lmLogin = vi.fn((lang, isPopup, cbs) => cbs.onSuccess({ ok: true }));
    globalThis.window.lmLogin = lmLogin;

    const { login } = await import(loginPath);
    const res = await login('en');

    expect(lmLogin).toHaveBeenCalledTimes(1);
    const [lang, isPopup, cbs] = lmLogin.mock.calls[0];
    expect(lang).toBe('en');
    expect(isPopup).toBe(true); // loginMode 'popup' → isPopup true
    expect(cbs).toHaveProperty('onSuccess');
    expect(cbs).toHaveProperty('onError');
    expect(res).toEqual({ ok: true });
    // Ya NO seteamos window.__LM_LOGIN_CONFIG__ (lo inyecta el script de Lifemiles por host).
    // eslint-disable-next-line no-underscore-dangle
    expect(globalThis.window.__LM_LOGIN_CONFIG__).toBeUndefined();
  });

  it('defaults lang from document and uses redirect mode (isPopup=false)', async () => {
    mockDeps('redirect');
    const lmLogin = vi.fn((lang, isPopup, cbs) => cbs.onSuccess());
    globalThis.window.lmLogin = lmLogin;

    const { login } = await import(loginPath);
    await login();

    const [lang, isPopup] = lmLogin.mock.calls[0];
    expect(lang).toBe('pt'); // from document.documentElement.lang
    expect(isPopup).toBe(false);
  });

  // Mapeo CF loginMode → isPopup (lmLogin es binario: popup vs redirect).
  // El CF emite 'redirect'|'window'|'fullscreen' (+ 'popup' legacy).
  it.each([
    ['redirect', false],
    ['window', true],
    ['fullscreen', true],
    ['popup', true],
    [undefined, false],
  ])('maps loginMode %s → isPopup %s', async (loginMode, expectedIsPopup) => {
    mockDeps(loginMode);
    const lmLogin = vi.fn((lang, isPopup, cbs) => cbs.onSuccess());
    globalThis.window.lmLogin = lmLogin;

    const { login } = await import(loginPath);
    await login('pt');

    const [, isPopup] = lmLogin.mock.calls[0];
    expect(isPopup).toBe(expectedIsPopup);
  });

  it('rejects gracefully when window.lmLogin is not available', async () => {
    mockDeps('redirect');
    // no window.lmLogin defined
    const { login } = await import(loginPath);
    await expect(login('pt')).rejects.toThrow('lmLogin no disponible');
  });
});
