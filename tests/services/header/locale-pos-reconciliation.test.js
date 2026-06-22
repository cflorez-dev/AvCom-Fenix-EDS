// @vitest-environment happy-dom
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const selectorPath = '../../../scripts/services/header/language-country-selector.js';
const posDataPath = '../../../scripts/services/header/get-pos-data.js';
const hreflangPath = '../../../scripts/services/header/hreflang-redirection.js';

// Catalog snapshot mirroring countireslist.json: EC/CO disallow `fr`, FR allows it.
const COUNTRY_DATA = {
  ecu: {
    label: 'Ecuador', keyIso: 'ec', iataCountryCode: 'ec', currencyCode: 'USD', acceptLanguage: 'es', allowedLanguages: ['es', 'en'], defaultLanguage: 'es',
  },
  col: {
    label: 'Colombia', keyIso: 'co', iataCountryCode: 'co', currencyCode: 'COP', acceptLanguage: 'es', allowedLanguages: ['es', 'en', 'pt'], defaultLanguage: 'es',
  },
  fra: {
    label: 'Francia', keyIso: 'fr', iataCountryCode: 'fr', currencyCode: 'EUR', acceptLanguage: 'fr', allowedLanguages: ['fr', 'es'], defaultLanguage: 'fr',
  },
};
const LANG_DATA = {
  es: { label: 'Español' }, en: { label: 'English' }, pt: { label: 'Português' }, fr: { label: 'Français' },
};

function mockDeps() {
  vi.doMock(posDataPath, () => ({
    ensurePOSDataLoaded: vi.fn().mockResolvedValue(COUNTRY_DATA),
    getPOSDataSnapshot: vi.fn().mockReturnValue(COUNTRY_DATA),
    ensureLanguagesDataLoaded: vi.fn().mockResolvedValue(LANG_DATA),
    getLanguagesDataSnapshot: vi.fn().mockReturnValue(LANG_DATA),
    getDefaultPos: vi.fn().mockReturnValue('fr-fra'),
    getDefaultCountryIsoCode: vi.fn().mockReturnValue('fr'),
  }));
  vi.doMock(hreflangPath, () => ({
    resolveHreflangRedirectUrl: vi.fn().mockResolvedValue('/es/'),
  }));
}

/** Replace window.location with a stub that records href assignments. */
function stubLocation(pathname) {
  let hrefValue = `https://nuxqa2.avtest.ink${pathname}`;
  const stub = {
    pathname,
    get href() { return hrefValue; },
    set href(v) { hrefValue = v; },
  };
  Object.defineProperty(window, 'location', {
    value: stub, writable: true, configurable: true,
  });
  return stub;
}

function setCookies(pairs) {
  Object.entries(pairs).forEach(([k, v]) => { document.cookie = `${k}=${v}; path=/`; });
}

function clearCookies() {
  ['selected-country', 'selected-language', 'selected-currency'].forEach((n) => {
    document.cookie = `${n}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

describe('reconcileUrlLanguageWithPos (cross-state language/POS guard)', () => {
  beforeEach(() => {
    vi.resetModules();
    clearCookies();
    mockDeps();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearCookies();
  });

  it('redirects /fr → /es when the geolocated POS (EC) does not allow fr', async () => {
    // The bug: country resolved to Ecuador (allows es,en) but URL stayed /fr.
    const loc = stubLocation('/fr');
    setCookies({ 'selected-country': 'ec', 'selected-language': 'fr' });

    const { reconcileUrlLanguageWithPos } = await import(selectorPath);
    const redirected = await reconcileUrlLanguageWithPos();

    expect(redirected).toBe(true);
    expect(loc.href).toBe('/es/');
  });

  it('redirects /fr → /es for a geolocated CO POS (allows es,en,pt — not fr)', async () => {
    const loc = stubLocation('/fr');
    setCookies({ 'selected-country': 'co', 'selected-language': 'fr' });

    const { reconcileUrlLanguageWithPos } = await import(selectorPath);
    const redirected = await reconcileUrlLanguageWithPos();

    expect(redirected).toBe(true);
    expect(loc.href).toBe('/es/');
  });

  it('does NOT redirect when /fr is served for the FR POS (fr is allowed)', async () => {
    const loc = stubLocation('/fr');
    setCookies({ 'selected-country': 'fr', 'selected-language': 'fr' });

    const { reconcileUrlLanguageWithPos } = await import(selectorPath);
    const redirected = await reconcileUrlLanguageWithPos();

    expect(redirected).toBe(false);
    expect(loc.href).toBe('https://nuxqa2.avtest.ink/fr');
  });

  it('does NOT redirect a coherent /es page for a CO POS', async () => {
    const loc = stubLocation('/es');
    setCookies({ 'selected-country': 'co', 'selected-language': 'es' });

    const { reconcileUrlLanguageWithPos } = await import(selectorPath);
    const redirected = await reconcileUrlLanguageWithPos();

    expect(redirected).toBe(false);
    expect(loc.href).toBe('https://nuxqa2.avtest.ink/es');
  });

  it('skips non-language URLs (e.g. /development/) without redirecting', async () => {
    const loc = stubLocation('/development/');
    setCookies({ 'selected-country': 'ec', 'selected-language': 'fr' });

    const { reconcileUrlLanguageWithPos } = await import(selectorPath);
    const redirected = await reconcileUrlLanguageWithPos();

    expect(redirected).toBe(false);
    expect(loc.href).toBe('https://nuxqa2.avtest.ink/development/');
  });
});
