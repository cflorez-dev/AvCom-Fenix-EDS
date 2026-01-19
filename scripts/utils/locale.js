/**
 * Locale Resolution Module for Avianca EDS
 *
 * This module is separated from aem.js to avoid conflicts with Adobe SDK updates.
 * Pattern follows scripts/utils/aem-data.js
 *
 * @see /home/olsalas/.claude/plans/velvety-bubbling-popcorn.md for architecture details
 */

import { detectLocale } from '../aem.js';

// ============================================
// Cookie Normalization
// ============================================

/**
 * Normalize a cookie value: decode URI, lowercase, trim
 * @param {string|null} value Raw cookie value
 * @returns {string|null} Normalized value or null
 */
function normalizeCookieValue(value) {
  if (!value) return null;
  try {
    return decodeURIComponent(value).toLowerCase().trim();
  } catch (e) {
    return value.toLowerCase().trim();
  }
}

// ============================================
// Locale Resolution (Single Source of Truth)
// ============================================

let resolvedLocale = null; // Cache for the page lifecycle

/**
 * SINGLE SOURCE OF TRUTH for market/language resolution.
 * Rules:
 * 1. URL is authoritative for content resolution (SEO-safe, bookmarkable)
 * 2. Cookie is user preference (used for redirects, not content)
 * 3. On mismatch: log warning, URL wins
 *
 * @returns {Object} { country, language, prefix, source, cookieMismatch }
 */
export function resolveLocale() {
  if (resolvedLocale) return resolvedLocale;

  const urlLocale = detectLocale();

  // Read and NORMALIZE cookie values
  let cookieCountry = null;
  let cookieLang = null;
  try {
    const rawCountry = document.cookie.match(/selected-country=([^;]+)/)?.[1] || null;
    const rawLang = document.cookie.match(/selected-language=([^;]+)/)?.[1] || null;
    cookieCountry = normalizeCookieValue(rawCountry);
    cookieLang = normalizeCookieValue(rawLang);
  } catch (e) { /* cookies blocked */ }

  // URL wins for content resolution
  if (urlLocale) {
    const urlCountryNorm = urlLocale.country.toLowerCase();
    const urlLangNorm = urlLocale.language.toLowerCase();

    const cookieMismatch = cookieCountry && cookieLang
      && (cookieCountry !== urlCountryNorm || cookieLang !== urlLangNorm);

    if (cookieMismatch) {
      // eslint-disable-next-line no-console
      console.warn(
        `[Locale] URL/Cookie mismatch. URL: ${urlCountryNorm}/${urlLangNorm}, `
        + `Cookie: ${cookieCountry}/${cookieLang}. Using URL (authoritative). Cookies will be synced.`,
      );
    }

    resolvedLocale = {
      country: urlCountryNorm,
      language: urlLangNorm,
      prefix: `/${urlCountryNorm}/${urlLangNorm}`,
      source: 'url',
      cookieMismatch,
    };
  } else if (cookieCountry && cookieLang) {
    resolvedLocale = {
      country: cookieCountry,
      language: cookieLang,
      prefix: `/${cookieCountry}/${cookieLang}`,
      source: 'cookie',
      cookieMismatch: false,
    };
  } else {
    resolvedLocale = {
      country: 'co',
      language: 'es',
      prefix: '/co/es',
      source: 'default',
      cookieMismatch: false,
    };
  }

  return resolvedLocale;
}

/**
 * Sync cookies to match URL when there's a mismatch.
 * This ensures UI components (currency selector, etc.) show correct values.
 * @param {Object} locale - The resolved locale object
 */
async function syncCookiesToUrl(locale) {
  if (!locale.cookieMismatch || locale.source !== 'url') return;

  try {
    // Dynamic import to avoid circular dependencies
    const {
      mapIsoToCountryCode,
      setStoredCountry,
      setStoredLanguage,
    } = await import('../services/header/language-country-selector.js');

    // Convert ISO code (e.g., 'us') to internal code (e.g., 'us' or 'col')
    const internalCountryCode = mapIsoToCountryCode(locale.country);

    if (internalCountryCode) {
      // setStoredCountry also sets the currency cookie automatically
      setStoredCountry(internalCountryCode);
      setStoredLanguage(locale.language);

      // eslint-disable-next-line no-console
      console.log(
        `[Locale] Cookies synced to URL: country=${internalCountryCode}, lang=${locale.language}`,
      );
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Locale] Could not sync cookies:', e);
  }
}

/**
 * Initialize document.documentElement.lang and window.aviancaMarket
 * IDEMPOTENT: Safe to call multiple times
 * Also syncs cookies to match URL when there's a mismatch
 */
export function initLocaleGlobals() {
  const locale = resolveLocale();
  const targetLang = locale.language;
  const targetMarket = locale.country.toUpperCase();

  if (document.documentElement.lang !== targetLang) {
    document.documentElement.lang = targetLang;
  }
  if (window.aviancaMarket !== targetMarket) {
    window.aviancaMarket = targetMarket;
  }

  // Sync cookies to URL if there's a mismatch
  if (locale.cookieMismatch) {
    syncCookiesToUrl(locale);
  }

  if (!window.localeInitialized) {
    // eslint-disable-next-line no-console
    console.log(`[Locale] Initialized: market=${targetMarket}, lang=${targetLang}, source=${locale.source}`);
    window.localeInitialized = true;
  }
}

/**
 * Reset locale cache (for soft navigation edge cases)
 */
export function resetLocaleCache() {
  resolvedLocale = null;
  window.localeInitialized = false;
}

// ============================================
// Path Resolution with Caching
// ============================================

const resolvedPathCache = new Map();
const failedPathCache = new Set();

/**
 * Get localized paths with 3-level fallback
 * @param {string} type Resource type ('nav', 'footer', etc.)
 * @param {string} customPath Optional custom path from metadata
 * @returns {Array<string>} Paths to try in priority order
 */
export function getLocalizedPaths(type, customPath = null) {
  // Validate type parameter
  if (!type || typeof type !== 'string' || !type.trim()) {
    // eslint-disable-next-line no-console
    console.error('[Locale] getLocalizedPaths called with invalid type:', type);
    return [];
  }

  if (customPath) return [customPath];

  const locale = resolveLocale();
  const cacheKey = `${type}:${locale.country}:${locale.language}`;

  if (resolvedPathCache.has(cacheKey)) {
    return [resolvedPathCache.get(cacheKey)];
  }

  const candidates = [
    `${locale.prefix}/${type}`, // Level 1: POS-specific
    `/global/${locale.language}/${type}`, // Level 2: Global language default
    `/${type}`, // Level 3: Global fallback
  ];

  const paths = candidates.filter((p) => !failedPathCache.has(p));

  if (paths.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(`[Locale] All paths for ${type} previously failed, retrying global fallback`);
    return [`/${type}`];
  }

  return paths;
}

/**
 * Cache a successfully resolved path
 * @param {string} type Resource type ('nav', 'footer')
 * @param {string} successfulPath The path that worked
 */
export function cacheResolvedPath(type, successfulPath) {
  const locale = resolveLocale();
  const cacheKey = `${type}:${locale.country}:${locale.language}`;
  resolvedPathCache.set(cacheKey, successfulPath);
}

/**
 * Cache a failed path (negative cache for 404s)
 * @param {string} path The path that returned 404
 */
export function cacheFailedPath(path) {
  failedPathCache.add(path);
}
