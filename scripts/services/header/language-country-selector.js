/**
 * Service for managing country and language selection
 * Handles cookies, provides country/language lists, and flag icons
 */

// Cookie names
const COUNTRY_COOKIE = 'selected-country';
const LANGUAGE_COOKIE = 'selected-language';
const CURRENCY_COOKIE = 'selected-currency';
const STORAGE_EVENT = 'pos-storage-change';

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
    currencyCode: 'MXN',
    keyIso: 'mx',
  },
  per: {
    label: 'Perú',
    flagFileName: 'peru-flag.svg',
    currencyCode: 'PEN',
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
    currencyCode: 'CRC',
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
    currencyCode: 'BOB',
    keyIso: 'bo',
  },
  chl: {
    label: 'Chile',
    flagFileName: 'chile-flag.svg',
    currencyCode: 'CLP',
    keyIso: 'cl',
  },
  can: {
    label: 'Canadá',
    flagFileName: 'canada-flag.svg',
    currencyCode: 'CAD',
    keyIso: 'ca',
  },
  gtm: {
    label: 'Guatemala',
    flagFileName: 'guatemala-flag.svg',
    currencyCode: 'GTQ',
    keyIso: 'gt',
  },
  hnd: {
    label: 'Honduras',
    flagFileName: 'honduras-flag.svg',
    currencyCode: 'HNL',
    keyIso: 'hn',
  },
  nic: {
    label: 'Nicaragua',
    flagFileName: 'nicaragua-flag.svg',
    currencyCode: 'NIO',
    keyIso: 'ni',
  },
  pan: {
    label: 'Panamá',
    flagFileName: 'panama-flag.svg',
    currencyCode: 'PAB',
    keyIso: 'pa',
  },
  pry: {
    label: 'Paraguay',
    flagFileName: 'paraguay-flag.svg',
    currencyCode: 'PYG',
    keyIso: 'py',
  },
  dom: {
    label: 'República Dominicana',
    flagFileName: 'republica-dominicana-flag.svg',
    currencyCode: 'DOP',
    keyIso: 'do',
  },
  esp: {
    label: 'España',
    flagFileName: 'spain-flag.svg',
    currencyCode: 'EUR',
    keyIso: 'eu',
  },
  gbr: {
    label: 'Reino Unido',
    flagFileName: 'uk-flag.svg',
    currencyCode: 'GBP',
    keyIso: 'gb',
  },
  ury: {
    label: 'Uruguay',
    flagFileName: 'uruguay-flag.svg',
    currencyCode: 'UYU',
    keyIso: 'uy',
  },
  eur: {
    label: 'Europa',
    flagFileName: 'europe-flag.svg',
    currencyCode: 'EUR',
    keyIso: 'eu',
  },
  fra: {
    label: 'Francia',
    flagFileName: 'france-flag.svg',
    currencyCode: 'EUR',
    keyIso: 'fr',
  },
  oth: {
    label: 'Otros',
    flagFileName: 'others-flag.svg',
    currencyCode: '',
    keyIso: 'ot',
  },
};

// Language data mapping: code -> {label}
const LANGUAGE_DATA = {
  es: { label: 'Español' },
  en: { label: 'English' },
  pt: { label: 'Português' },
  fr: { label: 'Français' },
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
    document.cookie = `${name}=${value}; path=/`;
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
    'fr-fra': 'fr-fra',
    'fr-eur': 'fr-eur',
  };

  // Check if we have a direct mapping
  if (posMapper[normalizedPos]) {
    return posMapper[normalizedPos];
  }

  // Try to parse and validate the format
  const parts = normalizedPos.split('-');
  if (parts.length === 2) {
    const [lang, country] = parts;
    // If language and country exist in our data, return normalized format
    if (LANGUAGE_DATA[lang] && COUNTRY_DATA[country]) {
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
  // Check if language and country exist in our data
  return !!(language && country && LANGUAGE_DATA[language] && COUNTRY_DATA[country]);
}

/**
 * Normalize and validate POS value
 * Returns a valid POS or fallback to default
 * @param {string} pos - POS value to normalize
 * @param {string} [fallback='es-col'] - Fallback POS if normalization fails
 * @returns {string} Normalized and validated POS value
 */
export function normalizePos(pos, fallback = 'es-col') {
  if (!pos || typeof pos !== 'string') {
    return fallback;
  }

  const normalizedPos = mapPosToStandard(pos);
  if (normalizedPos && validatePos(normalizedPos)) {
    return normalizedPos;
  }

  // If normalization failed, try to use fallback
  const normalizedFallback = mapPosToStandard(fallback);
  if (normalizedFallback && validatePos(normalizedFallback)) {
    return normalizedFallback;
  }

  // Last resort: return 'es-col' if everything fails
  return 'es-col';
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

  // Search in COUNTRY_DATA for the country that has this keyIso
  const found = Object.entries(COUNTRY_DATA)
    .find(([, data]) => data.keyIso === isoCode.toLowerCase());

  if (found) {
    return found[0];
  }

  // If not found by keyIso, check if isoCode is already an internal code
  // (for backward compatibility with old cookies)
  if (COUNTRY_DATA[isoCode.toLowerCase()]) {
    return isoCode.toLowerCase();
  }

  return null;
}

/**
 * Get all countries list
 * @returns {Array<{value: string, label: string, flagPath: string, currencyCode: string}>}
 * Array of countries with label including currency code (e.g., "Colombia (COP)")
 */
export function getCountries() {
  return Object.entries(COUNTRY_DATA)
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
  return Object.entries(LANGUAGE_DATA)
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
  if (!countryCode || !COUNTRY_DATA[countryCode]) {
    return null;
  }
  return `${getIconsBasePath()}/${COUNTRY_DATA[countryCode].flagFileName}`;
}

/**
 * Get country label
 * @param {string} countryCode - Country code
 * @param {boolean} [includeCurrency=true] - Whether to include currency code in label
 * @returns {string} Country label with currency (e.g., "Colombia (COP)") or empty string
 */
export function getCountryLabel(countryCode, includeCurrency = true) {
  const countryData = COUNTRY_DATA[countryCode];
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
  return LANGUAGE_DATA[languageCode]?.label || '';
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

    if (countryEntry?.mainCity) {
      return countryEntry.mainCity.toUpperCase();
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
 * @param {string} countryCode - Country code
 */
export function setStoredCountry(countryCode) {
  if (countryCode) {
    setCookie(COUNTRY_COOKIE, countryCode);

    // Also set currency cookie based on country
    const countryData = COUNTRY_DATA[countryCode];
    if (countryData && countryData.currencyCode) {
      setCookie(CURRENCY_COOKIE, countryData.currencyCode);
    }

    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, {
      detail: {
        country: countryCode,
        currency: countryData?.currencyCode || null,
      },
    }));
  }
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
 * @param {string} [fallback='es-col'] - Fallback POS if validation fails
 */
export function setStoredPos(pos, fallback = 'es-col') {
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

  if (!language || !country) {
    // eslint-disable-next-line no-console
    console.error('[language-country-selector] Failed to parse normalized POS:', normalizedPos);
    return;
  }

  // Validate that language and country exist in our data
  if (!LANGUAGE_DATA[language] || !COUNTRY_DATA[country]) {
    // eslint-disable-next-line no-console
    console.error('[language-country-selector] Invalid language or country:', { language, country });
    return;
  }
  const isoCountry = COUNTRY_DATA[country].keyIso;
  const countryCurrency = COUNTRY_DATA[country].currencyCode;

  // Set cookies
  setStoredCountry(isoCountry); // This will also set currency
  setStoredLanguage(language);
  setStoredCurrency(countryCurrency);

  // NOTE: Removed automatic redirect - setStoredPos() now only sets cookies
  // Use navigateToPOS() for explicit user-initiated navigation

  // Get currency from country data
  const countryData = COUNTRY_DATA[country];
  const currency = countryData?.currencyCode || null;

  // eslint-disable-next-line no-console
  console.log('[language-country-selector] POS set successfully:', {
    original: pos,
    normalized: normalizedPos,
    language,
    country,
    currency,
  });

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
 * Navigate to a POS path (explicit user action only)
 * Call this when user explicitly selects a country/language
 * This function should be called AFTER setStoredPos() to navigate to the new POS
 * @param {string} pos - POS value in format "language-country" (e.g., "es-col")
 */
export function navigateToPOS(pos) {
  if (!pos) return;

  const normalizedPos = normalizePos(pos, 'es-col');
  if (!normalizedPos) return;

  const { language, country } = parsePos(normalizedPos);
  if (!language || !country) return;

  const countryData = COUNTRY_DATA[country];
  if (!countryData) return;

  const isoCountry = countryData.keyIso || country;
  const currentHostname = window.location.hostname.toLowerCase();

  let targetPath;
  if (currentHostname === 'avianca.omni.pro') {
    targetPath = `/${language}/`;
  } else {
    targetPath = `/${isoCountry}/${language}/`;
  }

  // Only navigate if not already on target path
  if (!window.location.pathname.startsWith(targetPath)) {
    // eslint-disable-next-line no-console
    console.log('[language-country-selector] Navigating to:', targetPath);
    window.location.href = targetPath;
  }
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
  const countryData = COUNTRY_DATA[countryCode];
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
