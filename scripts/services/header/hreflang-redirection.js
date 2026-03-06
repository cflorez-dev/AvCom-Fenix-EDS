import { fetchAEMData } from '../../utils/aem-data.js';

const CACHE_KEY_PREFIX = 'avianca_hreflang_';
const HREFLANG_CACHE_KEY = `${CACHE_KEY_PREFIX}data`;
const HREFLANG_PERSISTENT_CACHE_KEY = `${CACHE_KEY_PREFIX}data_persistent`;
const HREFLANG_DATASET = 'hreflangs';
const HREFLANG_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

let hreflangSnapshot = [];
let hreflangSnapshotExpiresAt = 0;
let hreflangLoadPromise = null;
let persistentCacheHydrated = false;

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getSessionCache = (key) => {
  if (typeof sessionStorage === 'undefined') return null;
  const cached = sessionStorage.getItem(key);
  if (!cached) return null;
  return safeParse(cached, null);
};

const setSessionCache = (key, value) => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
};

const getLocalCache = (key) => {
  if (typeof localStorage === 'undefined') return null;
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  return safeParse(cached, null);
};

const setLocalCache = (key, value) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const toPositiveNumber = (value, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
};

const isValidHreflangList = (rows) => Array.isArray(rows) && rows.length > 0;

const fetchHreflangFromAEM = async () => {
  try {
    const response = await fetchAEMData(HREFLANG_DATASET);
    const rows = normalizeRows(response);
    return rows.length > 0 ? rows : [];
  } catch {
    return [];
  }
};

const writePersistentCache = (rows, ttlMs = HREFLANG_CACHE_TTL_MS) => {
  if (!isValidHreflangList(rows)) return;
  const now = Date.now();
  const normalizedTtl = toPositiveNumber(ttlMs, HREFLANG_CACHE_TTL_MS);
  setLocalCache(HREFLANG_PERSISTENT_CACHE_KEY, {
    data: rows,
    fetchedAt: now,
    expiresAt: now + normalizedTtl,
  });
};

const readPersistentCache = () => {
  const cached = getLocalCache(HREFLANG_PERSISTENT_CACHE_KEY);
  if (!cached || !Array.isArray(cached.data)) return null;

  return {
    data: cached.data,
    fetchedAt: Number(cached.fetchedAt) || 0,
    expiresAt: Number(cached.expiresAt) || 0,
  };
};

const setHreflangSnapshot = (rows, expiresAt = 0) => {
  if (!Array.isArray(rows)) return;
  hreflangSnapshot = rows;
  hreflangSnapshotExpiresAt = Number(expiresAt) || 0;
};

const hydrateSnapshotFromPersistentCache = () => {
  if (persistentCacheHydrated) return;
  persistentCacheHydrated = true;

  const cached = readPersistentCache();
  if (!cached || !isValidHreflangList(cached.data)) return;
  setHreflangSnapshot(cached.data, cached.expiresAt);
};

const isSnapshotFresh = () => isValidHreflangList(hreflangSnapshot)
  && hreflangSnapshotExpiresAt > Date.now();

const resolveHreflangList = async ({
  forceRefresh = false,
  preferStale = true,
  ttlMs = HREFLANG_CACHE_TTL_MS,
} = {}) => {
  hydrateSnapshotFromPersistentCache();

  if (!forceRefresh && isSnapshotFresh()) {
    return hreflangSnapshot;
  }

  if (!forceRefresh && isValidHreflangList(hreflangSnapshot) && preferStale) {
    if (!hreflangLoadPromise) {
      hreflangLoadPromise = (async () => {
        const rows = await fetchHreflangFromAEM();
        if (isValidHreflangList(rows)) {
          const now = Date.now();
          const normalizedTtl = toPositiveNumber(ttlMs, HREFLANG_CACHE_TTL_MS);
          setHreflangSnapshot(rows, now + normalizedTtl);
          writePersistentCache(rows, normalizedTtl);
        }
        return hreflangSnapshot;
      })().finally(() => {
        hreflangLoadPromise = null;
      });
    }
    return hreflangSnapshot;
  }

  if (!hreflangLoadPromise) {
    hreflangLoadPromise = (async () => {
      const rows = await fetchHreflangFromAEM();
      if (isValidHreflangList(rows)) {
        const now = Date.now();
        const normalizedTtl = toPositiveNumber(ttlMs, HREFLANG_CACHE_TTL_MS);
        setHreflangSnapshot(rows, now + normalizedTtl);
        writePersistentCache(rows, normalizedTtl);
      }
      return hreflangSnapshot;
    })().finally(() => {
      hreflangLoadPromise = null;
    });
  }

  return hreflangLoadPromise;
};

/**
 * Fetch hreflang data from AEM (with optional session cache)
 * @param {boolean} useCache - Whether to use session cache
 * @returns {Promise<Array>}
 */
export const fetchHreflangList = async (useCache = false) => {
  if (useCache) {
    const cached = getSessionCache(HREFLANG_CACHE_KEY);
    if (cached) return cached;
  }

  const rows = await fetchHreflangFromAEM();

  if (useCache && rows.length > 0) {
    setSessionCache(HREFLANG_CACHE_KEY, rows);
  }

  return rows;
};

/**
 * Get hreflang data snapshot (synchronous, from memory/persistent cache)
 * @returns {Array}
 */
export const getHreflangSnapshot = () => {
  hydrateSnapshotFromPersistentCache();
  return hreflangSnapshot;
};

/**
 * Ensure hreflang data is loaded (async, with stale-while-revalidate strategy)
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false]
 * @param {boolean} [options.preferStale=true]
 * @param {number} [options.ttlMs]
 * @returns {Promise<Array>}
 */
export const ensureHreflangDataLoaded = async ({
  forceRefresh = false,
  preferStale = true,
  ttlMs = HREFLANG_CACHE_TTL_MS,
} = {}) => resolveHreflangList({ forceRefresh, preferStale, ttlMs });

/**
 * Get hreflang data (main entry point)
 * @param {boolean} useCache - Whether to use session cache
 * @returns {Promise<Array>}
 */
export const getHreflangData = async (useCache = false) => {
  if (!useCache) {
    return ensureHreflangDataLoaded();
  }

  return fetchHreflangList(useCache);
};

const SUPPORTED_LANGUAGES = ['es', 'en', 'pt', 'fr'];

/**
 * Detect the current language from the pathname
 * @param {string} pathname
 * @returns {string|null} Language code or null
 */
const detectLanguageFromPath = (pathname) => {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && SUPPORTED_LANGUAGES.includes(match[1])) {
    return match[1];
  }
  return null;
};

/**
 * Resolve the redirect URL for a target language using hreflang data.
 * - Looks up the current pathname in hreflangs to find a matching `source_{currentLang}`
 * - If found, returns the corresponding `source_{targetLang}`
 * - If not found, falls back to `/{targetLang}/`
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
  if (!currentPath) return fallbackUrl;

  const currentLanguage = detectLanguageFromPath(currentPath);
  if (!currentLanguage) return fallbackUrl;

  // If same language, no need to look up hreflangs
  if (currentLanguage === targetLanguage) return currentPath;

  const sourceKey = `source_${currentLanguage}`;
  const targetKey = `source_${targetLanguage}`;

  try {
    const hreflangList = await fetchHreflangList();

    const match = hreflangList.find(
      (entry) => entry[sourceKey] && entry[sourceKey] === currentPath,
    );

    if (match && match[targetKey]) {
      return match[targetKey];
    }
  } catch {
    // fall through to fallback
  }

  return fallbackUrl;
};
