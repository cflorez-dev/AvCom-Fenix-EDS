/**
 * Root → default language redirect.
 *
 * When a visitor lands on the bare root (e.g. /), redirect them to the
 * appropriate /<lang> home. Other paths are left untouched.
 * Full design: docs/superpowers/specs/2026-05-28-root-language-redirect-design.md
 */

const PROBE_TIMEOUT_MS = 400;

function isAuthorEnvironment() {
  try {
    return !!(
      window.xwalk?.isAuthorEnv
      || window.hlx?.aue
      || document.querySelector('meta[name="urn:auecon:aemconnection"]')
    );
  } catch (e) {
    return false;
  }
}

function emit(name, detail) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch (e) {
    // CustomEvent may not be available in some test envs — non-fatal.
  }
}

const SESSION_FLAG = 'root-redirect-attempted';

function alreadyAttempted() {
  try {
    return window.sessionStorage?.getItem(SESSION_FLAG) === '1';
  } catch (e) {
    return false;
  }
}

function markAttempted() {
  try {
    window.sessionStorage?.setItem(SESSION_FLAG, '1');
  } catch (e) {
    // sessionStorage may be unavailable (private mode quirks); proceed without it.
  }
}

async function probeLanguageHome(lang) {
  try {
    const res = await fetch(`/${lang}`, {
      method: 'HEAD',
      cache: 'no-store',
      credentials: 'omit',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return res.ok;
  } catch (e) {
    // Timeout or network error → assume reachable; we'd rather an occasional
    // 404 than fail to redirect on a slow network.
    return true;
  }
}

async function buildResolutionChain() {
  const [
    { ensureLanguagesDataLoaded, ensurePOSDataLoaded, getDefaultLanguageRow },
    {
      getStoredLanguage, getStoredCountry, mapIsoToCountryCode,
      getAllowedLanguages, getDefaultLanguage,
    },
  ] = await Promise.all([
    import('../services/header/get-pos-data.js'),
    import('../services/header/language-country-selector.js'),
  ]);

  const [languages] = await Promise.all([
    ensureLanguagesDataLoaded(),
    ensurePOSDataLoaded(),
  ]);

  const storedLang = (getStoredLanguage() || '').toLowerCase();
  const storedCountryIso = getStoredCountry();
  const countryCode = storedCountryIso ? mapIsoToCountryCode(storedCountryIso) : null;
  const allowed = countryCode ? getAllowedLanguages(countryCode) : null;

  const chain = [];

  if (storedLang && languages[storedLang] && (!allowed || allowed.includes(storedLang))) {
    chain.push({ lang: storedLang, source: 'cookie' });
  }

  if (countryCode) {
    const posDefault = getDefaultLanguage(countryCode);
    if (posDefault && languages[posDefault] && !chain.find((c) => c.lang === posDefault)) {
      chain.push({ lang: posDefault, source: 'pos' });
    }
  }

  const row = getDefaultLanguageRow();
  const globalDefault = row ? String(row.languageCode || '').trim().toLowerCase() : '';
  if (globalDefault && languages[globalDefault] && !chain.find((c) => c.lang === globalDefault)) {
    chain.push({ lang: globalDefault, source: 'global' });
  }

  return chain;
}

async function resolveRootLanguage() {
  const chain = await buildResolutionChain();
  // eslint-disable-next-line no-restricted-syntax
  for (const candidate of chain) {
    // eslint-disable-next-line no-await-in-loop
    if (await probeLanguageHome(candidate.lang)) {
      return candidate;
    }
  }
  return null;
}

// eslint-disable-next-line import/prefer-default-export
export async function redirectRootToDefaultLanguage() {
  const { pathname } = window.location;
  if (pathname !== '/' && pathname !== '') {
    return false;
  }
  if (isAuthorEnvironment()) {
    return false;
  }
  if (alreadyAttempted()) {
    return false;
  }
  try {
    const resolved = await resolveRootLanguage();
    if (!resolved) {
      emit('root-redirect-fallback', { reason: 'all-probes-failed' });
      return false;
    }
    markAttempted();
    emit('root-redirect', { lang: resolved.lang, source: resolved.source });
    // eslint-disable-next-line no-console
    console.info('[root-redirect]', { lang: resolved.lang, source: resolved.source });
    window.location.replace(`/${resolved.lang}`);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[root-redirect] resolveRootLanguage failed:', error);
    emit('root-redirect-fallback', { reason: 'error', error: String(error) });
    return false;
  }
}
