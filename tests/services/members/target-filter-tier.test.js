/* global globalThis */
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';

// Mock de la sesión (controlamos el tier) y del selector país/idioma (sin cookies).
// `normalizeTierKey` se usa REAL (es puro).
vi.mock('../../../scripts/services/members/session.store.js', () => ({
  session: {},
  getSession: vi.fn(),
}));
vi.mock('../../../scripts/services/header/language-country-selector.js', () => ({
  getStoredCountry: () => '',
  getStoredLanguage: () => '',
}));

const { getSession } = await import('../../../scripts/services/members/session.store.js');
const { shouldShowByTargeting, filterItemsByTargeting } = await import('../../../scripts/utils/target-filter.js');

describe('target-filter · dimensión tier (1263924, Sub B)', () => {
  beforeEach(() => {
    getSession.mockReset();
    getSession.mockReturnValue({ status: 'authenticated', user: { tier: 'Gold' } });
    globalThis.window = { location: { hostname: 'localhost' } };
    globalThis.document = { documentElement: { lang: 'es' }, querySelector: () => null };
  });
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
  });

  it('tier que matchea → muestra', () => {
    expect(shouldShowByTargeting(undefined, undefined, ['gold'])).toBe(true);
  });

  it('tier que NO matchea → oculta', () => {
    expect(shouldShowByTargeting(undefined, undefined, ['silver'])).toBe(false);
  });

  it('lista de tiers, uno matchea → muestra', () => {
    expect(shouldShowByTargeting(undefined, undefined, ['silver', 'gold'])).toBe(true);
  });

  it('normaliza el tier del VM ("Gold" → "gold")', () => {
    getSession.mockReturnValue({ status: 'authenticated', user: { tier: 'Red Plus' } });
    expect(shouldShowByTargeting(undefined, undefined, ['red-plus'])).toBe(true);
    expect(shouldShowByTargeting(undefined, undefined, ['gold'])).toBe(false);
  });

  it('anónimo / sin tier → NO se filtra por tier (fail-soft, muestra)', () => {
    getSession.mockReturnValue({ status: 'anonymous', user: null });
    expect(shouldShowByTargeting(undefined, undefined, ['gold'])).toBe(true);
  });

  it('sin targeting de tier → muestra (no rompe país/idioma)', () => {
    expect(shouldShowByTargeting(undefined, undefined)).toBe(true);
    expect(shouldShowByTargeting(undefined, undefined, [])).toBe(true);
  });

  it('modo autor → siempre muestra (bypass)', () => {
    globalThis.window = { xwalk: { isAuthorEnv: true }, location: { hostname: 'author-x.adobeaemcloud.com' } };
    expect(shouldShowByTargeting(undefined, undefined, ['silver'])).toBe(true);
  });

  it('filterItemsByTargeting: multi-banner → devuelve los que matchean (primero = prioridad)', () => {
    const banners = [
      { key: 'silver', targetTiers: ['silver'] },
      { key: 'gold', targetTiers: ['gold'] },
      { key: 'all', targetTiers: [] },
    ];
    const matched = filterItemsByTargeting(banners, 'targetCountries', 'targetLanguages', 'targetTiers');
    expect(matched.map((b) => b.key)).toEqual(['gold', 'all']);
    expect(matched[0].key).toBe('gold');
  });
});
