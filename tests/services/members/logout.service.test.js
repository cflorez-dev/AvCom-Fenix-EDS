/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const logoutPath = '../../../scripts/services/members/logout.service.js';
const loaderPath = '../../../scripts/services/members/lm-script.loader.js';
const langPath = '../../../scripts/services/header/language-country-selector.js';

const mockDeps = ({ lang = 'pt', loadRejects = false } = {}) => {
  vi.doMock(loaderPath, () => ({
    loadLmScript: loadRejects
      ? vi.fn().mockRejectedValue(new Error('LM down'))
      : vi.fn().mockResolvedValue(undefined),
    whenLmReady: vi.fn().mockResolvedValue(undefined),
  }));
  vi.doMock(langPath, () => ({ getStoredLanguage: () => lang }));
};

describe('members/logout.service', () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.window = { location: { assign: vi.fn() } };
    globalThis.document = { documentElement: { lang: 'pt' } };
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.document;
  });

  it('llama window.lmLogout cuando está disponible (borra cookies + redirige) y NO usa el fallback', async () => {
    mockDeps({ lang: 'pt' });
    const lmLogout = vi.fn();
    globalThis.window.lmLogout = lmLogout;

    const { logout } = await import(logoutPath);
    await logout();

    expect(lmLogout).toHaveBeenCalledTimes(1);
    expect(globalThis.window.location.assign).not.toHaveBeenCalled();
  });

  it('fallback: si lmLogout no está, navega a la ruta puente con el idioma del POS', async () => {
    mockDeps({ lang: 'es' });
    // no window.lmLogout

    const { logout } = await import(logoutPath);
    await logout();

    expect(globalThis.window.location.assign)
      .toHaveBeenCalledWith('/es/members/auth/redirect-logout');
  });

  it('fallback también si loadLmScript falla (LM caído) — el usuario no queda atrapado', async () => {
    mockDeps({ lang: 'pt', loadRejects: true });

    const { logout } = await import(logoutPath);
    await logout();

    expect(globalThis.window.location.assign)
      .toHaveBeenCalledWith('/pt/members/auth/redirect-logout');
  });
});
