/**
 * Target filtering utility for AEM EDS blocks
 * Provides centralized logic for country and language based content targeting
 */

import { getStoredCountry, getStoredLanguage } from '../services/header/language-country-selector.js';

/**
 * Country code mapper: converts 3-letter cookie codes to 2-letter ISO codes
 * Cookie format (col, arg, mex) → ISO format (co, ar, mx) for targeting
 */
const COUNTRY_CODE_TO_ISO = {
  col: 'co',
  us: 'us',
  mex: 'mx',
  per: 'pe',
  ecu: 'ec',
  slv: 'sv',
  cri: 'cr',
  bra: 'br',
  arg: 'ar',
  bol: 'bo',
  chl: 'cl',
  can: 'ca',
  gtm: 'gt',
  hnd: 'hn',
  nic: 'ni',
  pan: 'pa',
  pry: 'py',
  dom: 'do',
  esp: 'eu',
  gbr: 'gb',
  ury: 'uy',
  oth: 'ot',
};

/**
 * Detect if running in Universal Editor / Author environment
 * In author mode, targeting rules should be bypassed so content authors
 * can see and edit all components regardless of their targeting configuration.
 * @returns {boolean} True if in author/editor environment
 */
function isAuthorEnvironment() {
  try {
    // Primary: xwalk author environment flag (used by most blocks)
    if (window.xwalk?.isAuthorEnv) {
      return true;
    }
    // Secondary: hlx AUE flag
    if (window.hlx?.aue) {
      return true;
    }
    // URL-based detection: author hostname (e.g., author-p34631-e1321407.adobeaemcloud.com)
    if (window.location.hostname.includes('author-')
        || window.location.hostname.includes('adobeaemcloud.com')) {
      return true;
    }
    // Fallback: AEM connection meta tag
    if (document.querySelector('meta[name="urn:auecon:aemconnection"]')) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Parse target values from config (supports both array and comma-separated string formats)
 * @param {string|Array<string>} targetValue - Target value from block config
 * @returns {Array<string>} Array of lowercase, trimmed target values
 */
function parseTargetValues(targetValue) {
  if (!targetValue) {
    return [];
  }

  // If already an array (multiselect returns array)
  if (Array.isArray(targetValue)) {
    return targetValue.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  }

  // If string (comma-separated or single value)
  if (typeof targetValue === 'string') {
    return targetValue
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

/**
 * Get current user's country from cookies
 * @returns {string} Current country code in lowercase (e.g., 'co', 'us') or empty string
 */
function getCurrentCountry() {
  try {
    const cookieCountry = getStoredCountry();
    if (!cookieCountry) {
      return '';
    }

    // Convert cookie format (col, arg, mex) to ISO format (co, ar, mx)
    const countryLower = cookieCountry.toLowerCase();
    const isoCode = COUNTRY_CODE_TO_ISO[countryLower];

    return isoCode || countryLower; // Fallback to original if not in map
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[target-filter] Error getting current country:', error);
    return '';
  }
}

/**
 * Get current user's language from cookies or document
 * @returns {string} Current language code in lowercase (e.g., 'es', 'en') or 'en' as fallback
 */
function getCurrentLanguage() {
  try {
    const language = getStoredLanguage();
    if (language) {
      return language.toLowerCase();
    }

    // Fallback to document language
    const docLang = document.documentElement.lang;
    return docLang ? docLang.toLowerCase() : 'en';
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[target-filter] Error getting current language:', error);
    return 'en';
  }
}

/**
 * Check if content should be shown based on targeting rules
 * @param {string|Array<string>} targetCountries - Target countries
 *   (comma-separated string or array)
 * @param {string|Array<string>} targetLanguages - Target languages
 *   (comma-separated string or array)
 * @returns {boolean} True if content should be shown, false if hidden
 */
export function shouldShowByTargeting(targetCountries, targetLanguages) {
  // In author mode, always show content so editors can manage all components
  if (isAuthorEnvironment()) {
    return true;
  }

  const countries = parseTargetValues(targetCountries);
  const languages = parseTargetValues(targetLanguages);

  // If no targeting is configured, show to everyone
  if (countries.length === 0 && languages.length === 0) {
    return true;
  }

  const currentCountry = getCurrentCountry();
  const currentLanguage = getCurrentLanguage();

  // Country filtering: only validate if both config AND cookie exist
  if (countries.length > 0 && currentCountry) {
    if (!countries.includes(currentCountry)) {
      return false;
    }
  }

  // Language filtering: only validate if config exists
  if (languages.length > 0 && currentLanguage) {
    if (!languages.includes(currentLanguage)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter array of items by their targeting configuration
 * @param {Array<Object>} items - Array of items to filter
 * @param {string} countryField - Name of the country targeting field
 * @param {string} langField - Name of the language targeting field
 * @returns {Array<Object>} Filtered array with only items that should be shown
 */
export function filterItemsByTargeting(
  items,
  countryField = 'targetCountries',
  langField = 'targetLanguages',
) {
  if (!Array.isArray(items)) {
    return [];
  }

  // In author mode, return all items without filtering
  if (isAuthorEnvironment()) {
    return items;
  }

  return items.filter((item) => {
    const targetCountries = item[countryField];
    const targetLanguages = item[langField];
    return shouldShowByTargeting(targetCountries, targetLanguages);
  });
}

/**
 * Hide a block and collapse its wrapper to avoid empty spaces
 * Only collapses the immediate wrapper, not the entire section
 * This prevents hiding other blocks that should be visible
 * @param {Element} block - The block element to hide
 */
export function hideBlockWithSection(block) {
  if (!block) {
    return;
  }

  // Hide the block itself
  block.classList.add('hidden');
  block.style.display = 'none';

  // Collapse the immediate parent wrapper (usually div.block-wrapper or similar)
  const wrapper = block.parentElement;
  if (wrapper && wrapper !== document.body && !wrapper.classList.contains('section')) {
    wrapper.style.display = 'none';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
    wrapper.style.height = '0';
    wrapper.style.overflow = 'hidden';
  }

  // Check if section should be collapsed (only if all blocks are hidden)
  const section = block.closest('.section');
  if (section) {
    const visibleBlocks = section.querySelectorAll('.block:not(.hidden)');
    if (visibleBlocks.length === 0) {
      // All blocks in section are hidden, collapse the section
      section.style.display = 'none';
      section.style.padding = '0';
      section.style.margin = '0';
      section.style.height = '0';
      section.style.overflow = 'hidden';
    }
  }
}

/**
 * Check if content should be shown based on legacy field names (backward compatibility)
 * Supports new (target-countries, target-languages) and old (targetMarkets, targetLanguages)
 * @param {Object} config - Configuration object with target fields
 * @returns {boolean} True if content should be shown, false if it should be hidden
 */
export function shouldShowByTargetingLegacy(config) {
  if (!config || typeof config !== 'object') {
    return true;
  }

  // New format (multiselect): target-countries, target-languages
  const targetCountries = config['target-countries'] || config.targetCountries || config.targetMarkets;
  const targetLanguages = config['target-languages'] || config.targetLanguages;

  return shouldShowByTargeting(targetCountries, targetLanguages);
}
