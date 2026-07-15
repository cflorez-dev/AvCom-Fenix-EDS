/* global globalThis */
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const modulePath = '../../scripts/utils/root-redirect.js';
const getPosDataPath = '../../scripts/services/header/get-pos-data.js';
const selectorPath = '../../scripts/services/header/language-country-selector.js';

const setup = ({
  pathname = '/',
  author = false,
  languages = {
    es: {}, en: {}, pt: {}, fr: {},
  },
  storedLang = null,
  storedCountryIso = null,
  countryCode = null,
  allowed = null,
  posDefault = null,
  defaultRow = { languageCode: 'es' },
  fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 }),
  sessionFlag = null,
} = {}) => {
  const replace = vi.fn();
  const sessionStore = sessionFlag ? { 'root-redirect-attempted': sessionFlag } : {};
  globalThis.window = {
    location: { pathname, replace },
    ...(author ? { hlx: { aue: true } } : {}),
    dispatchEvent: vi.fn(),
    sessionStorage: {
      getItem: (k) => sessionStore[k] ?? null,
      setItem: (k, v) => { sessionStore[k] = v; },
    },
  };
  globalThis.document = { querySelector: vi.fn(() => null) };
  globalThis.fetch = fetchImpl;

  vi.doMock(getPosDataPath, () => ({
    ensureLanguagesDataLoaded: vi.fn().mockResolvedValue(languages),
    ensurePOSDataLoaded: vi.fn().mockResolvedValue({}),
    getDefaultLanguageRow: vi.fn(() => defaultRow),
  }));
  vi.doMock(selectorPath, () => ({
    getStoredLanguage: vi.fn(() => storedLang),
    getStoredCountry: vi.fn(() => storedCountryIso),
    mapIsoToCountryCode: vi.fn(() => countryCode),
    getAllowedLanguages: vi.fn(() => allowed),
    getDefaultLanguage: vi.fn(() => posDefault),
  }));

  return { replace };
};

describe('redirectRootToDefaultLanguage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.fetch;
    vi.clearAllMocks();
  });

  it('does not redirect on a non-root path', async () => {
    const { replace } = setup({ pathname: '/es/algo' });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not redirect in author / Universal Editor mode (hlx.aue)', async () => {
    const { replace } = setup({ pathname: '/', author: true });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not redirect when xwalk.isAuthorEnv is set', async () => {
    const { replace } = setup({ pathname: '/' });
    globalThis.window.xwalk = { isAuthorEnv: true };
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not redirect when the AEM connection meta tag is present', async () => {
    const { replace } = setup({ pathname: '/' });
    globalThis.document.querySelector = vi.fn((sel) => (
      sel === 'meta[name="urn:auecon:aemconnection"]' ? {} : null
    ));
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('would-be redirect is blocked by author guard', async () => {
    const { replace } = setup({
      pathname: '/',
      author: true,
      languages: { es: {} },
      defaultRow: { languageCode: 'es' },
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).not.toHaveBeenCalled();
  });

  it('falls back to the global default language when there is no cookie or POS', async () => {
    const { replace } = setup({
      languages: { es: {}, en: {}, fr: {} },
      defaultRow: { languageCode: 'fr' },
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(true);
    expect(replace).toHaveBeenCalledWith('/fr');
  });

  it('uses POS default language when there is no language cookie', async () => {
    const { replace } = setup({
      languages: { es: {}, pt: {}, fr: {} },
      storedCountryIso: 'br',
      countryCode: 'bra',
      posDefault: 'pt',
      defaultRow: { languageCode: 'fr' }, // global default differs — POS must win
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/pt');
  });

  it('skips POS step when no country is stored', async () => {
    const { replace } = setup({
      languages: { es: {}, fr: {} },
      defaultRow: { languageCode: 'fr' },
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/fr');
  });

  it('honors an active, POS-allowed selected-language cookie', async () => {
    const { replace } = setup({
      languages: { es: {}, en: {} },
      storedLang: 'en',
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/en');
  });

  it('ignores a cookie language not allowed for the stored POS', async () => {
    const { replace } = setup({
      languages: { es: {}, en: {}, pt: {} },
      storedLang: 'en',
      storedCountryIso: 'br',
      countryCode: 'bra',
      allowed: ['pt'],
      posDefault: 'pt',
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/pt');
  });

  it('ignores a cookie language that is not active', async () => {
    const { replace } = setup({
      languages: { es: {}, pt: {} },
      storedLang: 'en',
      defaultRow: { languageCode: 'pt' },
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/pt');
  });

  it('does not redirect when no active default language can be resolved', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const { replace } = setup({
      languages: { es: {} },
      defaultRow: null,
      fetchImpl,
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not redirect when the configured default language is not active', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const { replace } = setup({
      languages: { fr: {} },
      defaultRow: { languageCode: 'es' },
      fetchImpl,
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('descends through the chain when the resolved language home is 404', async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url === '/en') return { ok: false, status: 404 };
      if (url === '/fr') return { ok: true, status: 200 };
      return { ok: true, status: 200 };
    });
    const { replace } = setup({
      languages: { en: {}, fr: {} },
      storedLang: 'en', // step 1 picks /en (will 404)
      defaultRow: { languageCode: 'fr' }, // step 3 should win after descent
      fetchImpl,
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(fetchImpl).toHaveBeenCalledWith('/en', expect.any(Object));
    expect(fetchImpl).toHaveBeenCalledWith('/fr', expect.any(Object));
    expect(replace).toHaveBeenCalledWith('/fr');
  });

  it('treats a HEAD timeout as success and proceeds with the redirect', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const { replace } = setup({
      languages: { fr: {} },
      defaultRow: { languageCode: 'fr' },
      fetchImpl,
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/fr');
  });

  it('emits root-redirect-fallback and does not redirect when every level is 404', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const { replace } = setup({
      languages: { es: {} },
      defaultRow: { languageCode: 'es' },
      fetchImpl,
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
    expect(globalThis.window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'root-redirect-fallback' }),
    );
  });

  it('skips when the sessionStorage flag is already set', async () => {
    const { replace } = setup({
      languages: { fr: {} },
      defaultRow: { languageCode: 'fr' },
      sessionFlag: '1',
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    const result = await redirectRootToDefaultLanguage();

    expect(result).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('sets the sessionStorage flag when a redirect is issued', async () => {
    const { replace } = setup({
      languages: { fr: {} },
      defaultRow: { languageCode: 'fr' },
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/fr');
    expect(globalThis.window.sessionStorage.getItem('root-redirect-attempted')).toBe('1');
  });

  it('emits root-redirect event with lang and source on success', async () => {
    const { replace } = setup({
      languages: { fr: {} },
      defaultRow: { languageCode: 'fr' },
    });
    const { redirectRootToDefaultLanguage } = await import(modulePath);

    await redirectRootToDefaultLanguage();

    expect(replace).toHaveBeenCalledWith('/fr');
    expect(globalThis.window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'root-redirect',
        detail: { lang: 'fr', source: 'global' },
      }),
    );
  });
});
