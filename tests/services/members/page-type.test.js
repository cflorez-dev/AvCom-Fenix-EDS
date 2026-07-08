import { describe, it, expect } from 'vitest';
import { isPortalPage } from '../../../scripts/services/members/page-type.js';

const cfg = { portalRoutes: ['/members'], portalExclude: ['/members/auth'] };

describe('members/page-type isPortalPage', () => {
  it('una página de perfil del Portal (anidada) → true', () => {
    expect(isPortalPage('/pt/members/profile', cfg)).toBe(true);
  });

  it('el leaf pelado /lang/members → true (también es Portal)', () => {
    expect(isPortalPage('/pt/members', cfg)).toBe(true);
    expect(isPortalPage('/es/members', cfg)).toBe(true);
  });

  it('una página-puente de auth (anidada) → false (excluida)', () => {
    expect(isPortalPage('/pt/members/auth/callback', cfg)).toBe(false);
  });

  it('el leaf de auth /lang/members/auth → false (excluida)', () => {
    expect(isPortalPage('/pt/members/auth', cfg)).toBe(false);
  });

  it('la Home → false', () => {
    expect(isPortalPage('/pt/', cfg)).toBe(false);
  });

  it('no matchea segmentos parecidos (/remembers) → false', () => {
    expect(isPortalPage('/pt/remembers', cfg)).toBe(false);
    expect(isPortalPage('/pt/remembers/x', cfg)).toBe(false);
  });

  it('cualquiera de los 4 locales en el Portal → true (redirect transversal)', () => {
    ['/es/members/profile', '/en/members/profile', '/fr/members/profile', '/pt/members/profile']
      .forEach((p) => expect(isPortalPage(p, cfg)).toBe(true));
  });

  it('portalRoutes vacío → false (default seguro: no redirige)', () => {
    expect(isPortalPage('/pt/members/profile', { portalRoutes: [], portalExclude: [] })).toBe(false);
  });

  it('cfg ausente → false (no rompe)', () => {
    expect(isPortalPage('/pt/members/profile', undefined)).toBe(false);
  });
});
