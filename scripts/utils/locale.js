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
 * New pattern: /{lang}/ URLs
 * Rules:
 * 1. Language from URL (SEO-safe, bookmarkable)
 * 2. Country from cookie (user preference for POS/currency)
 * 3. Default: language-appropriate country (e.g., PT → BR, EN → US)
 *
 * @returns {Promise<Object>} { country, language, prefix, source, cookieMismatch }
 */
export async function resolveLocale() {
  if (resolvedLocale) return resolvedLocale;

  const urlLocale = detectLocale();

  // Read and NORMALIZE cookie values for BOTH country AND language
  let cookieCountry = null;
  let cookieLanguage = null;
  try {
    const rawCountry = document.cookie.match(/selected-country=([^;]+)/)?.[1] || null;
    cookieCountry = normalizeCookieValue(rawCountry);
    
    const rawLanguage = document.cookie.match(/selected-language=([^;]+)/)?.[1] || null;
    cookieLanguage = normalizeCookieValue(rawLanguage);
  } catch (e) { /* cookies blocked */ }

  // Language from URL, country from cookie
  if (urlLocale) {
    const urlLangNorm = urlLocale.language.toLowerCase();
    
    // Check if language cookie matches URL language
    const languageMismatch = cookieLanguage && cookieLanguage !== urlLangNorm;
    
    // If no country cookie, use language-appropriate default country
    // This prevents illogical combinations like PT (Portuguese) + CO (Colombia/COP)
    let country = cookieCountry;
    let usedDefaultCountry = false;
    
    if (!country) {
      // Dynamically import to avoid circular dependencies
      try {
        const { getDefaultCountryForLanguage } = await import('../services/header/language-country-selector.js');
        country = getDefaultCountryForLanguage(urlLangNorm);
        usedDefaultCountry = true;
        // eslint-disable-next-line no-console
        console.log(`[Locale] No country cookie, using language default: ${urlLangNorm} → ${country}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Locale] Failed to load getDefaultCountryForLanguage, using fallback:', error);
        country = 'co'; // Fallback to Colombia if import fails
      }
    }

    resolvedLocale = {
      country,
      language: urlLangNorm,
      prefix: `/${urlLangNorm}`,
      source: 'url',
      cookieMismatch: usedDefaultCountry || languageMismatch, // Flag if mismatch detected
    };

    // CRITICAL: Sync cookies IMMEDIATELY if there's a mismatch
    // This ensures components that read cookies later see the correct values
    if (resolvedLocale.cookieMismatch) {
      try {
        const {
          setStoredCountry,
          setStoredLanguage,
          getDefaultCountryForLanguage,
        } = await import('../services/header/language-country-selector.js');
        
        // Always sync language to match URL (URL is source of truth)
        setStoredLanguage(urlLangNorm);
        
        // If no country cookie or used default, also set country
        if (usedDefaultCountry) {
          setStoredCountry(country);
        }
        
        // eslint-disable-next-line no-console
        console.log(
          `[Locale] Cookies synced immediately: lang=${urlLangNorm}, country=${country}`,
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Locale] Failed to sync cookies immediately:', error);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[Locale] Resolved: lang=${urlLangNorm} (URL), country=${country} (${cookieCountry ? 'cookie' : 'default'}), cookieLanguage=${cookieLanguage || 'none'}${languageMismatch ? ' [MISMATCH - will sync]' : ''}`);
  } else if (cookieCountry) {
    // No URL locale but have cookie - use defaults with cookie country
    resolvedLocale = {
      country: cookieCountry,
      language: 'es',
      prefix: '/es',
      source: 'cookie',
    };
  } else {
    // Full default fallback
    resolvedLocale = {
      country: 'co',
      language: 'es',
      prefix: '/es',
      source: 'default',
    };
  }

  return resolvedLocale;
}

/**
 * Initialize document.documentElement.lang and window.aviancaMarket
 * IDEMPOTENT: Safe to call multiple times
 * Cookie syncing happens automatically in resolveLocale() when mismatches are detected
 */
export async function initLocaleGlobals() {
  const locale = await resolveLocale();
  const targetLang = locale.language;
  const targetMarket = locale.country.toUpperCase();

  if (document.documentElement.lang !== targetLang) {
    document.documentElement.lang = targetLang;
  }
  if (window.aviancaMarket !== targetMarket) {
    window.aviancaMarket = targetMarket;
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
 * Get localized paths with 2-level fallback
 * Pattern: Language-specific first, then global fallback
 * 
 * CONTENT MODEL:
 * - /es/nav → Header en español (textos, enlaces) + personalización por país con target-countries
 * - /en/nav → Header en inglés (textos, enlaces) + personalización por país con target-countries
 * - /nav → Fallback global (si no existe versión por idioma)
 * 
 * PERSONALIZATION:
 * - Language: Managed via folder structure (/es/, /en/, /pt/)
 * - Country: Managed via target-countries INSIDE each language version
 * 
 * Example /es/nav:
 *   Block 1: cms-banner, target-countries: co,ec → "Vuelos desde Colombia"
 *   Block 2: cms-banner, target-countries: br → Won't show (different language)
 *   Block 3: header-logo (no targeting) → Shows for all
 * 
 * @param {string} type Resource type ('nav', 'footer', etc.)
 * @param {string} customPath Optional custom path from metadata
 * @returns {Array<string>} Paths to try in priority order
 */
export async function getLocalizedPaths(type, customPath = null) {
  // Validate type parameter
  if (!type || typeof type !== 'string' || !type.trim()) {
    // eslint-disable-next-line no-console
    console.error('[Locale] getLocalizedPaths called with invalid type:', type);
    return [];
  }

  if (customPath) return [customPath];

  const locale = await resolveLocale();
  const cacheKey = `${type}:${locale.country}:${locale.language}`;

  if (resolvedPathCache.has(cacheKey)) {
    return [resolvedPathCache.get(cacheKey)];
  }

  // 2-level fallback for all resources
  const candidates = [
    `/${locale.language}/${type}`, // Level 1: Language-specific (e.g., /es/nav)
    `/${type}`, // Level 2: Global fallback (e.g., /nav)
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
export async function cacheResolvedPath(type, successfulPath) {
  const locale = await resolveLocale();
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
