/* global globalThis */
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';

// Mockeamos el flujo de login y la config (sync). `page-type.isPortalPage` se usa REAL
// (es puro) consumiendo el cfg que devuelve el mock de getMembersConfigSync.
vi.mock('../../../scripts/services/members/login.service.js', () => ({ login: vi.fn() }));
vi.mock('../../../scripts/services/members/members-config.js', () => ({ getMembersConfigSync: vi.fn() }));

const { login } = await import('../../../scripts/services/members/login.service.js');
const { getMembersConfigSync } = await import('../../../scripts/services/members/members-config.js');
const { guardPortalSession, resetGuard } = await import('../../../scripts/services/members/members-guard.js');

const PORTAL_CFG = { portalRoutes: ['/members'], portalExclude: ['/members/auth'] };

describe('members-guard · guardPortalSession (zona privada)', () => {
  beforeEach(() => {
    resetGuard();
    login.mockReset();
    login.mockResolvedValue(undefined);
    getMembersConfigSync.mockReset();
    getMembersConfigSync.mockReturnValue(PORTAL_CFG);
    globalThis.window = { location: { pathname: '/es/members/profile' } };
  });
  afterEach(() => {
    delete globalThis.window;
  });

  it('página del Portal sin sesión → redirige al login (una sola vez por lock)', () => {
    guardPortalSession();
    expect(login).toHaveBeenCalledTimes(1);
    guardPortalSession(); // lock activo → no vuelve a disparar
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('AEM author (xwalk.isAuthorEnv) → no redirige aunque sea ruta del Portal', () => {
    window.location.pathname = '/es/members/profile/account';
    window.xwalk = { isAuthorEnv: true };
    guardPortalSession();
    expect(login).not.toHaveBeenCalled();
    delete window.xwalk;
  });

  it('fuera del Portal (Home) → no redirige', () => {
    globalThis.window.location.pathname = '/es/';
    guardPortalSession();
    expect(login).not.toHaveBeenCalled();
  });

  it('página-puente de auth → no redirige (excluida del Portal)', () => {
    globalThis.window.location.pathname = '/es/members/auth/callback';
    guardPortalSession();
    expect(login).not.toHaveBeenCalled();
  });

  it('si la config lanza → fail-soft: no rompe ni redirige', () => {
    getMembersConfigSync.mockImplementation(() => { throw new Error('boom'); });
    expect(() => guardPortalSession()).not.toThrow();
    expect(login).not.toHaveBeenCalled();
  });
});
