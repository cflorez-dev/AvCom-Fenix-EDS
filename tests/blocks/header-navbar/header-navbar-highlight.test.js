import {
  describe, it, expect, vi,
} from 'vitest';

// `isLifemilesNavItem` es pura (regex sobre megamenu.anchor/url), pero el helper importa
// target-filter → session.store / language-country-selector (cadena que referencia
// globals del browser al importar). Los mockeamos para poder importar el helper en node.
vi.mock('../../../scripts/services/members/session.store.js', () => ({
  session: {},
  getSession: () => null,
}));
vi.mock('../../../scripts/services/header/language-country-selector.js', () => ({
  getStoredCountry: () => '',
  getStoredLanguage: () => '',
}));

const { isLifemilesNavItem } = await import('../../../blocks/header-navbar/header-navbar-helper.js');

describe('header-navbar · isLifemilesNavItem (highlight Lifemiles, 1263924 Sub C)', () => {
  it('anchor del megamenú "megamenu-lifemiles" → true', () => {
    expect(isLifemilesNavItem({ megamenu: { anchor: 'megamenu-lifemiles' } })).toBe(true);
  });

  it('URL al portal "/es/members" (leaf) → true', () => {
    expect(isLifemilesNavItem({ url: '/es/members' })).toBe(true);
  });

  it('URL anidada "/pt/members/profile" → true', () => {
    expect(isLifemilesNavItem({ url: '/pt/members/profile' })).toBe(true);
  });

  it('link plano autoreado (label "Lifemiles", url "lifemiles") → true', () => {
    expect(isLifemilesNavItem({ itemLabel: 'Lifemiles', url: 'lifemiles' })).toBe(true);
  });

  it('URL con segmento lifemiles ("/es/lifemiles") → true', () => {
    expect(isLifemilesNavItem({ url: '/es/lifemiles' })).toBe(true);
  });

  it('item ajeno (Ofertas: label "Ofertas CO" + url /co/ofertas) → false', () => {
    expect(isLifemilesNavItem({ itemLabel: 'Ofertas CO', megamenu: { anchor: 'megamenu-ofertas' }, url: '/co/ofertas' })).toBe(false);
  });

  it('NO falso positivo en "/es/remembers" (match por segmento)', () => {
    expect(isLifemilesNavItem({ url: '/es/remembers' })).toBe(false);
  });

  it('sin datos / undefined → false (fail-soft, no rompe)', () => {
    expect(isLifemilesNavItem({})).toBe(false);
    expect(isLifemilesNavItem(undefined)).toBe(false);
  });
});
