/**
 * Service for managing country and language selection
 * Handles cookies, provides country/language lists, and flag icons
 */
import {
  ensurePOSDataLoaded,
  getPOSDataSnapshot,
  ensureLanguagesDataLoaded,
  getLanguagesDataSnapshot,
  getDefaultPos,
  getDefaultCountryIsoCode,
} from './get-pos-data.js';
import { resolveHreflangRedirectUrl } from './hreflang-redirection.js';

/**
 * Detect if the page is running in AEM author / Universal Editor mode.
 * Redirects and POS validation are skipped in author mode to avoid
 * interfering with content editing.
 * @returns {boolean}
 */
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

// Cookie names
const COUNTRY_COOKIE = 'selected-country';
const LANGUAGE_COOKIE = 'selected-language';
const CURRENCY_COOKIE = 'selected-currency';
const STORAGE_EVENT = 'pos-storage-change';
const COUNTRY_DATA_EVENT = 'pos-country-data-updated';

// Country data mapping: code -> {label, flagFileName, currencyCode}
const COUNTRY_DATA = {
  col: {
    label: 'Colombia',
    flagFileName: 'colombia-flag.svg',
    currencyCode: 'COP',
    keyIso: 'co',
  },
  us: {
    label: 'Estados Unidos',
    flagFileName: 'estados-unidos-flag.svg',
    currencyCode: 'USD',
    keyIso: 'us',
  },
  mex: {
    label: 'México',
    flagFileName: 'mexico-flag.svg',
    currencyCode: 'USD',
    keyIso: 'mx',
  },
  per: {
    label: 'Perú',
    flagFileName: 'peru-flag.svg',
    currencyCode: 'USD',
    keyIso: 'pe',
  },
  ecu: {
    label: 'Ecuador',
    flagFileName: 'ecuador-flag.svg',
    currencyCode: 'USD',
    keyIso: 'ec',
  },
  slv: {
    label: 'El Salvador',
    flagFileName: 'el-salvador-flag.svg',
    currencyCode: 'USD',
    keyIso: 'sv',
  },
  cri: {
    label: 'Costa Rica',
    flagFileName: 'costa-rica-flag.svg',
    currencyCode: 'USD',
    keyIso: 'cr',
  },
  bra: {
    label: 'Brasil',
    flagFileName: 'brasil-flag.svg',
    currencyCode: 'BRL',
    keyIso: 'br',
  },
  arg: {
    label: 'Argentina',
    flagFileName: 'argentina-flag.svg',
    currencyCode: 'ARS',
    keyIso: 'ar',
  },
  bol: {
    label: 'Bolivia',
    flagFileName: 'bolivia-flag.svg',
    currencyCode: 'USD',
    keyIso: 'bo',
  },
  chl: {
    label: 'Chile',
    flagFileName: 'chile-flag.svg',
    currencyCode: 'USD',
    keyIso: 'cl',
  },
  can: {
    label: 'Canadá',
    flagFileName: 'canada-flag.svg',
    currencyCode: 'USD',
    keyIso: 'ca',
  },
  gtm: {
    label: 'Guatemala',
    flagFileName: 'guatemala-flag.svg',
    currencyCode: 'USD',
    keyIso: 'gt',
  },
  hnd: {
    label: 'Honduras',
    flagFileName: 'honduras-flag.svg',
    currencyCode: 'USD',
    keyIso: 'hn',
  },
  nic: {
    label: 'Nicaragua',
    flagFileName: 'nicaragua-flag.svg',
    currencyCode: 'USD',
    keyIso: 'ni',
  },
  pan: {
    label: 'Panamá',
    flagFileName: 'panama-flag.svg',
    currencyCode: 'USD',
    keyIso: 'pa',
  },
  pry: {
    label: 'Paraguay',
    flagFileName: 'paraguay-flag.svg',
    currencyCode: 'USD',
    keyIso: 'py',
  },
  dom: {
    label: 'República Dominicana',
    flagFileName: 'republica-dominicana-flag.svg',
    currencyCode: 'USD',
    keyIso: 'do',
  },
  esp: {
    label: 'España',
    flagFileName: 'spain-flag.svg',
    currencyCode: 'EUR',
    keyIso: 'eu',
    iataCountryCode: 'es',
  },
  gbr: {
    label: 'Reino Unido',
    flagFileName: 'uk-flag.svg',
    currencyCode: 'GBP',
    keyIso: 'gb',
    iataCountryCode: 'uk',
  },
  ury: {
    label: 'Uruguay',
    flagFileName: 'uruguay-flag.svg',
    currencyCode: 'USD',
    keyIso: 'uy',
  },
  oth: {
    label: 'Otros países',
    flagFileName: 'others-flag.svg',
    currencyCode: 'USD',
    keyIso: 'ot',
  },
};

let countryDataSnapshot = { ...COUNTRY_DATA };
let countryDataLoadPromise = null;

function hasCountryData(data) {
  return !!data && typeof data === 'object' && Object.keys(data).length > 0;
}

function isCountryDataDifferent(nextData) {
  const currentKeys = Object.keys(countryDataSnapshot);
  const nextKeys = Object.keys(nextData);

  if (currentKeys.length !== nextKeys.length) {
    return true;
  }

  return nextKeys.some((key) => {
    const current = countryDataSnapshot[key] || {};
    const next = nextData[key] || {};
    return (
      current.label !== next.label
      || current.flagFileName !== next.flagFileName
      || current.currencyCode !== next.currencyCode
      || current.keyIso !== next.keyIso
    );
  });
}

function setCountryDataSnapshot(nextData, dispatchEvent = true) {
  if (!hasCountryData(nextData)) return false;

  const changed = isCountryDataDifferent(nextData);
  countryDataSnapshot = nextData;

  if (
    changed
    && dispatchEvent
    && typeof window !== 'undefined'
    && typeof window.dispatchEvent === 'function'
    && typeof CustomEvent === 'function'
  ) {
    window.dispatchEvent(new CustomEvent(COUNTRY_DATA_EVENT, {
      detail: {
        updatedAt: Date.now(),
        size: Object.keys(nextData).length,
      },
    }));
  }

  return changed;
}

function scheduleCountryDataLoad(options = {}) {
  if (typeof window === 'undefined') {
    return Promise.resolve(countryDataSnapshot);
  }

  if (countryDataLoadPromise) {
    return countryDataLoadPromise;
  }

  countryDataLoadPromise = ensurePOSDataLoaded({
    preferStale: false,
    ...options,
  })
    .then((remoteData) => {
      setCountryDataSnapshot(remoteData);
      return countryDataSnapshot;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[language-country-selector] Error loading POS data:', error);
      return countryDataSnapshot;
    })
    .finally(() => {
      countryDataLoadPromise = null;
    });

  return countryDataLoadPromise;
}

function getCountryData() {
  // Fire-and-forget refresh to keep sync API unchanged.
  scheduleCountryDataLoad();
  return countryDataSnapshot;
}

const cachedCountryData = getPOSDataSnapshot();
setCountryDataSnapshot(cachedCountryData, false);

/**
 * Ensure latest country data is loaded from POS service.
 * Keeps backward compatibility: existing sync methods can still be used.
 * @param {Object} [options] - Loading options
 * @returns {Promise<Object>} Resolved country data snapshot
 */
export function ensureCountryDataLoaded(options = {}) {
  return scheduleCountryDataLoad(options);
}

/**
 * Ensure latest language data is loaded from AEM spreadsheet.
 * @param {Object} [options] - Loading options
 * @returns {Promise<Object>} Resolved language data snapshot
 */
export function ensureLanguageDataLoaded(options = {}) {
  return scheduleLanguageDataLoad(options);
}

/**
 * Validate stored POS against active country/language lists.
 * If stored POS references an inactive entry, switch to the dynamic default.
 * Called after fresh data loads from AEM.
 * @returns {boolean} True if stored POS was valid, false if replaced.
 */
export function validateAndFixStoredPos() {
  // Skip validation/redirects in author mode to avoid interfering with Universal Editor
  if (typeof window !== 'undefined' && isAuthorEnvironment()) {
    return true;
  }

  const storedPos = getStoredPos();
  const languages = getLanguageData();

  // Detect current URL language
  const urlLang = typeof window !== 'undefined'
    ? (window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] || '')
    : '';

  // If URL language is not in the active list, redirect to default
  if (urlLang && !languages[urlLang]) {
    const dynamicDefault = normalizePos('');
    const { language: defaultLang } = parsePos(dynamicDefault);

    // eslint-disable-next-line no-console
    console.warn(
      '[language-country-selector] URL language is inactive, redirecting to default:',
      { urlLang, dynamicDefault },
    );
    setStoredPos(dynamicDefault);

    if (defaultLang && defaultLang !== urlLang) {
      navigateToPOS(dynamicDefault);
    }
    return false;
  }

  // Validate stored POS against active lists
  if (!storedPos) return true;

  const { language, country } = parsePos(storedPos);
  const countries = getCountryData();

  const isLanguageActive = !!languages[language];
  const isCountryActive = !!countries[country];

  if (isLanguageActive && isCountryActive) {
    return true;
  }

  const dynamicDefault = normalizePos('');
  const { language: defaultLang } = parsePos(dynamicDefault);

  // eslint-disable-next-line no-console
  console.warn(
    '[language-country-selector] Stored POS references inactive country/language, switching to default:',
    { storedPos, dynamicDefault, isLanguageActive, isCountryActive },
  );
  setStoredPos(dynamicDefault);

  if (
    defaultLang
    && defaultLang !== language
    && typeof window !== 'undefined'
  ) {
    navigateToPOS(dynamicDefault);
  }

  return false;
}

// Default language data (fallback when AEM data is not loaded)
const DEFAULT_LANGUAGE_DATA = {
  es: { label: 'Español' },
  en: { label: 'English' },
  pt: { label: 'Português' },
  fr: { label: 'Français' },
};

let languageDataSnapshot = { ...DEFAULT_LANGUAGE_DATA };
let languageDataLoadPromise = null;

function hasLanguageData(data) {
  return !!data && typeof data === 'object' && Object.keys(data).length > 0;
}

function setLanguageDataSnapshot(nextData) {
  if (!hasLanguageData(nextData)) return;
  languageDataSnapshot = nextData;
}

function scheduleLanguageDataLoad(options = {}) {
  if (typeof window === 'undefined') {
    return Promise.resolve(languageDataSnapshot);
  }

  if (languageDataLoadPromise) {
    return languageDataLoadPromise;
  }

  languageDataLoadPromise = ensureLanguagesDataLoaded({
    preferStale: false,
    ...options,
  })
    .then((remoteData) => {
      setLanguageDataSnapshot(remoteData);
      return languageDataSnapshot;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[language-country-selector] Error loading language data:', error);
      return languageDataSnapshot;
    })
    .finally(() => {
      languageDataLoadPromise = null;
    });

  return languageDataLoadPromise;
}

function getLanguageData() {
  scheduleLanguageDataLoad();
  return languageDataSnapshot;
}

const cachedLanguageData = getLanguagesDataSnapshot();
setLanguageDataSnapshot(cachedLanguageData);
scheduleLanguageDataLoad();

// Once both datasets are loaded, validate URL language and stored POS against active lists
// Skip entirely in author mode — redirects break the Universal Editor
if (typeof window !== 'undefined' && !isAuthorEnvironment()) {
  Promise.all([
    scheduleCountryDataLoad(),
    scheduleLanguageDataLoad(),
  ]).then(() => {
    const languages = getLanguageData();
    const countries = getCountryData();
    const defaultPos = normalizePos('');
    const { language: defaultLang } = parsePos(defaultPos);

    // 1. Check URL language is active
    const urlLang = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] || '';
    if (!urlLang) return; // Non-language URLs (e.g. /development/) — skip validation
    if (!languages[urlLang]) {
      if (defaultLang && defaultLang !== urlLang) {
        // eslint-disable-next-line no-console
        console.warn('[language-country-selector] URL language inactive, redirecting:', { urlLang, defaultPos });
        setStoredPos(defaultPos);
        window.location.href = `/${defaultLang}/`;
        return;
      }
    }

    // 2. Check stored cookies reference active country/language
    const storedLang = getStoredLanguage();
    const storedCountry = getStoredCountry(); // ISO code from cookie (e.g. "fr", "co")
    if (!storedLang && !storedCountry) return; // No cookies, nothing to fix
    // countries map is keyed by countryCode ("fra", "col"), not ISO — convert before lookup
    const storedCountryCode = storedCountry ? mapIsoToCountryCode(storedCountry) : null;
    const langActive = !storedLang || !!languages[storedLang];
    const countryActive = !storedCountry || (!!storedCountryCode && !!countries[storedCountryCode]);
    if (langActive && countryActive) return; // Both active, nothing to do
    // eslint-disable-next-line no-console
    console.warn('[language-country-selector] Stored POS inactive, switching to default:', { storedLang, storedCountry, defaultPos });
    setStoredPos(defaultPos);
    if (defaultLang && defaultLang !== urlLang) {
      window.location.href = `/${defaultLang}/`;
    }
  });
}

// Default country mapping per language
// Used when no country cookie exists to provide logical defaults
// Prevents illogical combinations like PT (Portuguese) + CO (Colombia/COP)
const LANGUAGE_DEFAULT_COUNTRY = {
  es: 'co', // Spanish -> Colombia
  en: 'us', // English -> United States
  pt: 'br', // Portuguese -> Brazil
  fr: 'fr', // French -> France (matches pos:'fr' in countireslist.json)
};

/**
 * Get base path for icons
 * Flags are served from assets/icons/flags/ which is accessible in AEM EDS
 * @returns {string} Base path for flag icons (absolute URL)
 */
function getIconsBasePath() {
  // Flags are in assets/icons/flags/ which is served by AEM EDS
  // Use origin directly to ensure icons work regardless of codeBasePath value
  // Always get the current origin to handle dynamic imports correctly
  try {
    const origin = window.location?.origin || window.location?.href?.split('/').slice(0, 3).join('/') || '';
    if (!origin) {
      // Fallback: try to get origin from document or current script
      const scripts = document.querySelectorAll('script[src]');
      if (scripts.length > 0) {
        const scriptSrc = scripts[scripts.length - 1].src;
        const url = new URL(scriptSrc);
        return `${url.origin}/assets/icons/flags`;
      }
      // Last resort: use relative path (shouldn't happen in production)
      return '/assets/icons/flags';
    }
    return `${origin}/assets/icons/flags`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[language-country-selector] Error getting icons base path:', error);
    // Fallback to relative path
    return '/assets/icons/flags';
  }
}

/**
 * Get cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
function getCookie(name) {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error reading cookie ${name}:`, error);
  }
  return null;
}

/**
 * Set cookie value
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 */
function setCookie(name, value) {
  try {
    // Set cookie without expiration (session cookie)
    // Secure: only sent over HTTPS; SameSite=Lax: prevents CSRF while allowing top-level navigation
    document.cookie = `${name}=${value}; path=/; Secure; SameSite=Lax`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error setting cookie ${name}:`, error);
  }
}

/**
 * POS mapper: maps inconsistent POS formats to standard format
 * Handles variations like "eng-eeuu" -> "en-us", "es-col" -> "es-col"
 * @param {string} pos - POS value in any format
 * @returns {string|null} Normalized POS value or null if cannot be mapped
 */
export function mapPosToStandard(pos) {
  if (!pos || typeof pos !== 'string') {
    return null;
  }

  const normalizedPos = pos.toLowerCase().trim();

  // Direct mapping for known inconsistent formats
  const posMapper = {
    'eng-eeuu': 'en-us',
    'en-us': 'en-us',
    'en-eeuu': 'en-us',
    'es-col': 'es-col',
    'es-mex': 'es-mex',
    'es-per': 'es-per',
    'es-ecu': 'es-ecu',
    'es-slv': 'es-slv',
    'es-cri': 'es-cri',
    'pt-bra': 'pt-bra',
    'pt-br': 'pt-bra',
    'es-esp': 'es-esp',
    'es-arg': 'es-arg',
    'es-chl': 'es-chl',
    'es-bol': 'es-bol',
    'es-ury': 'es-ury',
    'es-pry': 'es-pry',
    'es-dom': 'es-dom',
    'es-gtm': 'es-gtm',
    'es-hnd': 'es-hnd',
    'es-nic': 'es-nic',
    'es-pan': 'es-pan',
    'en-can': 'en-can',
    'en-gbr': 'en-gbr',
  };

  // Check if we have a direct mapping
  if (posMapper[normalizedPos]) {
    return posMapper[normalizedPos];
  }

  // Try to parse and validate the format
  const parts = normalizedPos.split('-');
  if (parts.length === 2) {
    const [lang, country] = parts;
    const countryData = getCountryData();
    // If language and country exist in our data, return normalized format
    if (getLanguageData()[lang] && countryData[country]) {
      return `${lang}-${country}`;
    }
  }

  return null;
}

/**
 * Parse POS value to extract language and country
 * @param {string} pos - POS value in format "language-country" (e.g., "es-col")
 * @returns {Object} Object with language and country properties
 */
export function parsePos(pos) {
  if (!pos || typeof pos !== 'string') {
    return { language: '', country: '' };
  }
  const parts = pos.split('-');
  if (parts.length !== 2) {
    return { language: '', country: '' };
  }
  return {
    language: parts[0].trim(),
    country: parts[1].trim(),
  };
}

/**
 * Build POS value from language and country
 * @param {string} language - Language code (e.g., "es")
 * @param {string} country - Country code (e.g., "col")
 * @returns {string} POS value in format "language-country" (e.g., "es-col")
 */
export function buildPos(language, country) {
  if (!language || !country) {
    return '';
  }
  return `${language}-${country}`;
}

/**
 * Validate POS value format and data
 * @param {string} pos - POS value to validate
 * @returns {boolean} True if POS is valid, false otherwise
 */
export function validatePos(pos) {
  if (!pos || typeof pos !== 'string') {
    return false;
  }

  const normalizedPos = mapPosToStandard(pos);
  if (!normalizedPos) {
    return false;
  }

  const { language, country } = parsePos(normalizedPos);
  const countryData = getCountryData();
  // Check if language and country exist in our data
  return !!(language && country && getLanguageData()[language] && countryData[country]);
}

/**
 * Normalize and validate POS value
 * Returns a valid POS or fallback to default
 * @param {string} pos - POS value to normalize
 * @param {string} [fallback] - Fallback POS if normalization fails
 * @returns {string} Normalized and validated POS value
 */
export function normalizePos(pos, fallback) {
  const ULTIMATE_FALLBACK = 'es-col';

  if (!pos || typeof pos !== 'string') {
    return fallback || getDefaultPos() || ULTIMATE_FALLBACK;
  }

  const normalizedPos = mapPosToStandard(pos);
  if (normalizedPos && validatePos(normalizedPos)) {
    return normalizedPos;
  }

  // Try explicit fallback
  if (fallback) {
    const normalizedFallback = mapPosToStandard(fallback);
    if (normalizedFallback && validatePos(normalizedFallback)) {
      return normalizedFallback;
    }
  }

  // Try dynamic default from spreadsheet
  const dynamicDefault = getDefaultPos();
  if (dynamicDefault && dynamicDefault !== ULTIMATE_FALLBACK) {
    const normalizedDynamic = mapPosToStandard(dynamicDefault);
    if (normalizedDynamic && validatePos(normalizedDynamic)) {
      return normalizedDynamic;
    }
  }

  // Last resort
  return ULTIMATE_FALLBACK;
}

/**
 * Map ISO country code to internal country code
 * When POS is saved, the ISO code (e.g., "co") is stored in cookies,
 * but we need the internal code (e.g., "col") to build valid POS values
 * @param {string} isoCode - ISO country code from cookie (e.g., "co", "us")
 * @returns {string|null} Internal country code (e.g., "col", "us") or null if not found
 */
export function mapIsoToCountryCode(isoCode) {
  if (!isoCode || typeof isoCode !== 'string') {
    return null;
  }
  const countryData = getCountryData();

  // Search in COUNTRY_DATA for the country that has this keyIso
  const found = Object.entries(countryData)
    .find(([, data]) => data.keyIso === isoCode.toLowerCase());

  if (found) {
    return found[0];
  }

  // If not found by keyIso, check if isoCode is already an internal code
  // (for backward compatibility with old cookies)
  if (countryData[isoCode.toLowerCase()]) {
    return isoCode.toLowerCase();
  }

  return null;
}

/**
 * Resolve the IATA country code for a given POS ISO code.
 * Uses the iataCountryCode field from the countries spreadsheet
 * to bridge POS codes (e.g. 'eu') with iata.json pais values (e.g. 'ES').
 * Falls back to the POS code itself when no explicit mapping exists.
 * @param {string} posIso - POS ISO code from cookie (e.g., 'eu', 'gb', 'co')
 * @returns {string} IATA country code (e.g., 'es', 'uk', 'co')
 */
export function getIataCountryCode(posIso) {
  if (!posIso || typeof posIso !== 'string') return posIso;
  const countryData = getCountryData();
  const normalized = posIso.toLowerCase().trim();

  const found = Object.values(countryData)
    .find((data) => data.keyIso === normalized);

  return found?.iataCountryCode || normalized;
}

/**
 * Get default country ISO code for a language
 * Used when no country cookie exists to provide logical defaults
 * Prevents illogical combinations like PT (Portuguese) + CO (Colombia)
 * @param {string} language - Language code (e.g., 'es', 'pt', 'en', 'fr')
 * @returns {string} Default country ISO code (e.g., 'co', 'br', 'us')
 */
export function getDefaultCountryForLanguage(language) {
  if (!language || typeof language !== 'string') {
    return getDefaultCountryIsoCode();
  }

  const normalizedLang = language.toLowerCase().trim();
  return LANGUAGE_DEFAULT_COUNTRY[normalizedLang] || getDefaultCountryIsoCode();
}

/**
 * Get all countries list
 * @returns {Array<{value: string, label: string, flagPath: string, currencyCode: string}>}
 * Array of countries with label including currency code (e.g., "Colombia (COP)")
 */
export function getCountries() {
  const countryData = getCountryData();
  return Object.entries(countryData)
    .map(([code, data]) => ({
      value: code,
      label: data.currencyCode ? `${data.label} (${data.currencyCode})` : data.label,
      flagPath: `${getIconsBasePath()}/${data.flagFileName}`,
      currencyCode: data.currencyCode,
    }))
    .sort((a, b) => {
      // Sort by label without currency code for proper alphabetical order
      const labelA = a.label.replace(/\s*\([^)]*\)\s*$/, '');
      const labelB = b.label.replace(/\s*\([^)]*\)\s*$/, '');
      return labelA.localeCompare(labelB);
    });
}

/**
 * Get all languages list
 * @returns {Array<{value: string, label: string}>} Array of languages
 */
export function getLanguages() {
  return Object.entries(getLanguageData())
    .map(([code, data]) => ({
      value: code,
      label: data.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get flag path for a country code
 * @param {string} countryCode - Country code (e.g., 'col')
 * @returns {string|null} Flag SVG path or null if not found
 */
export function getCountryFlagPath(countryCode) {
  const countryData = getCountryData();
  if (!countryCode || !countryData[countryCode]) {
    return null;
  }
  return `${getIconsBasePath()}/${countryData[countryCode].flagFileName}`;
}

/**
 * Get country label
 * @param {string} countryCode - Country code
 * @param {boolean} [includeCurrency=true] - Whether to include currency code in label
 * @returns {string} Country label with currency (e.g., "Colombia (COP)") or empty string
 */
export function getCountryLabel(countryCode, includeCurrency = true) {
  const countries = getCountryData();
  const countryData = countries[countryCode];
  if (!countryData) return '';

  if (includeCurrency && countryData.currencyCode) {
    return `${countryData.label} (${countryData.currencyCode})`;
  }
  return countryData.label;
}

/**
 * Get language label
 * @param {string} languageCode - Language code
 * @returns {string} Language label or empty string
 */
export function getLanguageLabel(languageCode) {
  return getLanguageData()[languageCode]?.label || '';
}

/**
 * Get stored country from cookie
 * @returns {string|null} Country code or null
 */
export function getStoredCountry() {
  return getCookie(COUNTRY_COOKIE);
}

/**
 * Get stored language from cookie
 * @returns {string|null} Language code or null
 */
export function getStoredLanguage() {
  return getCookie(LANGUAGE_COOKIE);
}

/**
 * Get stored currency from cookies
 * @returns {string|null} Currency code or null
 */
export function getStoredCurrency() {
  return getCookie(CURRENCY_COOKIE);
}

/**
 * Get stored POS from cookies (format: "language-country")
 * Converts ISO country code from cookie back to internal country code
 * @returns {string|null} POS value or null
 */
export function getStoredPos() {
  const language = getStoredLanguage();
  const countryIso = getStoredCountry(); // This returns ISO code (e.g., "co", "us")

  if (language && countryIso) {
    // Convert ISO code to internal country code (e.g., "co" -> "col")
    const countryCode = mapIsoToCountryCode(countryIso);
    if (countryCode) {
      return buildPos(language, countryCode);
    }
    // If mapping fails, return null to trigger default behavior
    return null;
  }
  return null;
}

/**
 * Get main city (default origin) for current POS from countrieslist
 * @returns {Promise<string>} Main city IATA code (defaults to 'BOG' if not found)
 */
export async function getMainCityForCurrentPos() {
  try {
    const pos = getStoredPos();

    if (!pos) {
      return 'BOG';
    }

    const { country } = parsePos(pos);

    if (!country) {
      return 'BOG';
    }

    // Dynamically import fetchAEMData to avoid circular dependency
    const { fetchAEMData } = await import('../../utils/aem-data.js');
    const countriesData = await fetchAEMData('countireslist');

    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      return 'BOG';
    }

    // Find the matching country entry
    const countryEntry = countriesData.data.find(
      (item) => {
        const matchByCountryCode = item.countryCode?.toLowerCase() === country.toLowerCase();
        const matchByPos = item.pos?.toLowerCase() === pos.toLowerCase();
        const matchByCountryOnly = item.pos?.toLowerCase() === country.toLowerCase();

        return matchByCountryCode || matchByPos || matchByCountryOnly;
      },
    );

    // PBI priority table: "ATO Default del POS" → column `ato` in AEM.
    // `mainCity` used to be the source but for some POS they differ
    // (BRA: GIG vs GRU, ARG: BUE vs EZE, DOM: PUJ vs SDQ, OTH: BOG vs MIA).
    // Prefer `ato`; fall back to `mainCity` if a row has `ato` empty.
    const defaultAto = countryEntry?.ato || countryEntry?.mainCity;
    if (defaultAto) {
      return defaultAto.toUpperCase();
    }

    return 'BOG';
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[getMainCityForCurrentPos] Error getting main city:', error);
    return 'BOG';
  }
}

/**
 * Set currency in cookie
 * @param {string} currencyCode - Currency code (e.g., 'COP', 'USD')
 */
export function setStoredCurrency(currencyCode) {
  if (currencyCode) {
    setCookie(CURRENCY_COOKIE, currencyCode);
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, {
      detail: { currency: currencyCode },
    }));
  }
}

/**
 * Set country in cookie
 * Also sets currency cookie based on country
 * @param {string} countryCode - Country code (ISO code like 'co', 'us' or internal code like 'col')
 */
export function setStoredCountry(countryCode) {
  if (!countryCode) return;
  const countryDataMap = getCountryData();

  // Determine if we received an ISO code or internal code
  // First, try to find by ISO code (keyIso)
  let isoCode = null;
  let internalCode = null;
  let countryData = null;

  // Check if it's an ISO code by searching in COUNTRY_DATA
  const foundByIso = Object.entries(countryDataMap)
    .find(([, data]) => data.keyIso === countryCode.toLowerCase());

  if (foundByIso) {
    // It's an ISO code
    isoCode = countryCode.toLowerCase();
    [internalCode, countryData] = foundByIso;
  } else if (countryDataMap[countryCode.toLowerCase()]) {
    // It's an internal code
    internalCode = countryCode.toLowerCase();
    countryData = countryDataMap[internalCode];
    isoCode = countryData.keyIso;
  } else {
    // If we can't find it, try mapIsoToCountryCode as fallback
    const mappedCode = mapIsoToCountryCode(countryCode);
    if (mappedCode && countryDataMap[mappedCode]) {
      internalCode = mappedCode;
      countryData = countryDataMap[internalCode];
      isoCode = countryData.keyIso;
    } else {
      // eslint-disable-next-line no-console
      console.warn('[language-country-selector] setStoredCountry: Unknown country code:', countryCode);
      return;
    }
  }

  // Always store the ISO code in the cookie (not the internal code)
  setCookie(COUNTRY_COOKIE, isoCode);

  // Also set currency cookie based on country
  if (countryData && countryData.currencyCode) {
    setCookie(CURRENCY_COOKIE, countryData.currencyCode);
  }

  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, {
    detail: {
      country: isoCode, // Return ISO code in event
      currency: countryData?.currencyCode || null,
    },
  }));
}

/**
 * Set language in cookie
 * @param {string} languageCode - Language code
 */
export function setStoredLanguage(languageCode) {
  if (languageCode) {
    setCookie(LANGUAGE_COOKIE, languageCode);
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, {
      detail: { language: languageCode },
    }));
  }
}

/**
 * Set POS in cookies (parses and saves separately)
 * Also sets currency cookie based on country
 * Normalizes and validates POS before setting
 * @param {string} pos - POS value in format "language-country" (e.g., "es-col")
 * @param {string} [fallback] - Fallback POS if validation fails
 */
export function setStoredPos(pos, fallback) {
  if (!pos) {
    // eslint-disable-next-line no-console
    console.warn('[language-country-selector] setStoredPos called with empty value, using fallback:', fallback);
    const normalizedFallback = normalizePos(fallback);
    if (normalizedFallback) {
      setStoredPos(normalizedFallback);
    }
    return;
  }

  // Normalize and validate POS before setting
  const normalizedPos = normalizePos(pos, fallback);

  if (!normalizedPos) {
    // eslint-disable-next-line no-console
    console.error('[language-country-selector] Failed to normalize POS:', pos);
    return;
  }

  const { language, country } = parsePos(normalizedPos);
  const countryData = getCountryData();

  if (!language || !country) {
    // eslint-disable-next-line no-console
    console.error('[language-country-selector] Failed to parse normalized POS:', normalizedPos);
    return;
  }

  // Validate that language and country exist in our data
  if (!getLanguageData()[language] || !countryData[country]) {
    // eslint-disable-next-line no-console
    console.error('[language-country-selector] Invalid language or country:', { language, country });
    return;
  }
  const isoCountry = countryData[country].keyIso;
  const countryCurrency = countryData[country].currencyCode;

  // Set cookies
  setStoredCountry(isoCountry); // This will also set currency
  setStoredLanguage(language);
  setStoredCurrency(countryCurrency);

  // NOTE: Removed automatic redirect - setStoredPos() now only sets cookies
  // Use navigateToPOS() for explicit user-initiated navigation

  // Get currency from country data
  const currency = countryData[country]?.currencyCode || null;

  // Dispatch event with POS format for compatibility
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, {
    detail: {
      pos: normalizedPos,
      country,
      language,
      currency,
    },
  }));
}

/**
 * Navigate to a language path (explicit user action only)
 * Call this when user explicitly selects a country/language
 * Pattern: /{lang}/ - country is stored in cookie, not URL
 * @param {string} pos - POS value in format "language-country" (e.g., "es-col")
 */
export function navigateToPOS(pos) {
  if (!pos) return;

  // Skip navigation in author mode to avoid breaking the Universal Editor
  if (typeof window !== 'undefined' && isAuthorEnvironment()) return;

  const normalizedPos = normalizePos(pos);
  if (!normalizedPos) return;

  const { language } = parsePos(normalizedPos);
  if (!language) return;

  // Pattern: /{lang}/ - always use language-only path
  const targetPath = `/${language}/`;

  resolveHreflangRedirectUrl(language).then((redirectUrl) => {
    if (redirectUrl === window.location.pathname) {
      window.location.reload();
    } else {
      window.location.href = redirectUrl;
    }
  }).catch(() => {
    window.location.href = targetPath;
  });
}

/**
 * Format POS for display: "language-country" -> "CURRENCY - LANGUAGE"
 * (e.g., "es-col" -> "COP - ES")
 * Shows currency code first (from COUNTRY_DATA), then language code (uppercase)
 * Falls back to country code if currency code is not available
 * @param {string} pos - POS value in format "language-country"
 * @returns {string} Formatted POS for display (e.g., "COP - ES")
 */
export function formatPosForDisplay(pos) {
  if (!pos || typeof pos !== 'string') {
    return '';
  }
  const { language, country } = parsePos(pos);
  if (!language || !country) {
    return '';
  }

  // Obtener el código de moneda del país desde COUNTRY_DATA
  const countryCode = country.toLowerCase();
  const countries = getCountryData();
  const countryData = countries[countryCode];
  const currencyCode = countryData?.currencyCode || country.toUpperCase();

  // Return "CURRENCY - LANGUAGE" format (uppercase)
  return `${currencyCode} - ${language.toUpperCase()}`;
}

/**
 * Get the storage event name for listening to changes
 * @returns {string} The event name
 */
export function getStorageEventName() {
  return STORAGE_EVENT;
}

/**
 * Get the country data update event name
 * @returns {string} The event name
 */
export function getCountryDataEventName() {
  return COUNTRY_DATA_EVENT;
}
