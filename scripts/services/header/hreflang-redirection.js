const SUPPORTED_LANGUAGES = ['es', 'en', 'pt', 'fr'];
const META_NAME_PREFIX = 'alternate-page-';

/**
 * Normalize a metadata value into the public EDS pathname.
 * Accepts already-public paths and repository paths like /content/avianca/es/foo.
 * @param {string} value
 * @returns {string}
 */
export const normalizeAlternatePagePath = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let normalized = value.trim();
  if (!normalized) {
    return '';
  }

  normalized = normalized.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]+/, '');
  normalized = normalized.replace(/\/jcr:content(?:\/.*)?$/, '');
  normalized = normalized.replace(/^\/content\/[^/]+/, '');

  if (!normalized) {
    return '/';
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized;
};

const readMetaContent = (name) => {
  if (typeof document === 'undefined') {
    return '';
  }

  const meta = document.head.querySelector(`meta[name="${name}"]`);
  return meta?.content?.trim() || '';
};

/**
 * Detect the current language from the pathname
 * @param {string} pathname
 * @returns {string|null} Language code or null
 */
export const detectLanguageFromPath = (pathname) => {
  const match = pathname?.match(/^\/([a-z]{2})(\/|$)/);
  if (match && SUPPORTED_LANGUAGES.includes(match[1])) {
    return match[1];
  }
  return null;
};

export const getAlternatePageForLanguage = (language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return '';
  }

  return normalizeAlternatePagePath(readMetaContent(`${META_NAME_PREFIX}${language}`));
};

export const getCurrentPageAlternates = () => SUPPORTED_LANGUAGES
  .map((language) => ({
    hreflang: language,
    url: getAlternatePageForLanguage(language),
  }))
  .filter((entry) => !!entry.url);

export const fetchHreflangList = async () => getCurrentPageAlternates();

export const getHreflangSnapshot = () => getCurrentPageAlternates();

export const ensureHreflangDataLoaded = async () => getCurrentPageAlternates();

export const getHreflangData = async () => getCurrentPageAlternates();

/**
 * Resolve the redirect URL for a target language using page metadata.
 * - Reads `meta[name="alternate-page-${lang}"]` from the current document.
 * - Accepts both public EDS paths and repository paths as metadata values.
 * - Falls back to `/{targetLang}/` when no equivalent page is configured.
 *
 * @param {string} targetLanguage - Target language code (e.g., 'en', 'fr', 'pt', 'es')
 * @param {Object} [options]
 * @param {string} [options.pathname] - Override pathname (defaults to window.location.pathname)
 * @returns {Promise<string>} The resolved URL to redirect to
 */
export const resolveHreflangRedirectUrl = async (targetLanguage, { pathname } = {}) => {
  const fallbackUrl = `/${targetLanguage}/`;

  if (!targetLanguage || !SUPPORTED_LANGUAGES.includes(targetLanguage)) {
    return fallbackUrl;
  }

  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (!currentPath) {
    return fallbackUrl;
  }

  const currentLanguage = detectLanguageFromPath(currentPath);
  if (!currentLanguage) {
    return fallbackUrl;
  }

  if (currentLanguage === targetLanguage) {
    return currentPath;
  }

  const alternateUrl = getAlternatePageForLanguage(targetLanguage);
  return alternateUrl || fallbackUrl;
};
