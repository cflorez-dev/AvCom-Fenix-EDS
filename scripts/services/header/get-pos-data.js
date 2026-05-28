import { fetchAEMData } from '../../utils/aem-data.js';
import { mapCountryToPos } from '../../utils/pos-mapping.js';

const CACHE_KEY_PREFIX = 'avianca_pos_';
const USE_CACHE = false;
const COUNTRIES_LIST_CACHE_KEY = `${CACHE_KEY_PREFIX}countries_list`;
const COUNTRIES_LIST_PERSISTENT_CACHE_KEY = `${CACHE_KEY_PREFIX}countries_list_persistent`;
const COUNTRIES_LIST_DATASETS = ['countireslist'];
const LANGUAGES_LIST_PERSISTENT_CACHE_KEY = `${CACHE_KEY_PREFIX}languages_list_persistent`;
const LANGUAGES_LIST_DATASETS = ['languageslist'];
const LANGUAGE_COOKIE = 'selected-language';
const SUPPORTED_LANGUAGES = ['es', 'en', 'pt', 'fr'];
const COUNTRIES_LIST_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

let countriesListSnapshot = [];
let countriesListSnapshotExpiresAt = 0;
let countriesListLoadPromise = null;
let persistentCacheHydrated = false;

let languagesListSnapshot = [];
let languagesListSnapshotExpiresAt = 0;
let languagesListLoadPromise = null;
let persistentLanguagesCacheHydrated = false;

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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

const normalizeLanguageCode = (value) => {
  if (!value || typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';

  const language = normalized.includes('-') ? normalized.split('-')[0] : normalized;
  if (SUPPORTED_LANGUAGES.includes(language)) {
    return language;
  }

  return '';
};

const getCookieValue = (name) => {
  if (typeof document === 'undefined') return '';

  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift() || '';
    }
  } catch (error) {
    return '';
  }

  return '';
};

const getCurrentLanguage = () => {
  const sessionLanguage = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem(LANGUAGE_COOKIE)
    : '';
  const normalizedSessionLanguage = normalizeLanguageCode(sessionLanguage);
  if (normalizedSessionLanguage) return normalizedSessionLanguage;

  const localLanguage = typeof localStorage !== 'undefined'
    ? localStorage.getItem(LANGUAGE_COOKIE)
    : '';
  const normalizedLocalLanguage = normalizeLanguageCode(localLanguage);
  if (normalizedLocalLanguage) return normalizedLocalLanguage;

  const cookieLanguage = normalizeLanguageCode(getCookieValue(LANGUAGE_COOKIE));
  if (cookieLanguage) return cookieLanguage;

  return 'es';
};

const fetchCountriesListFromAEM = async () => {
  const responses = await Promise.all(
    COUNTRIES_LIST_DATASETS.map(async (dataset) => {
      try {
        const response = await fetchAEMData(dataset);
        const rows = normalizeRows(response);
        return rows.length > 0 ? rows : null;
      } catch (error) {
        return null;
      }
    }),
  );

  return responses.find((rows) => Array.isArray(rows) && rows.length > 0) || [];
};

const isValidCountriesList = (rows) => Array.isArray(rows) && rows.length > 0;

const writePersistentCountriesListCache = (rows, ttlMs = COUNTRIES_LIST_CACHE_TTL_MS) => {
  if (!isValidCountriesList(rows)) return;
  const now = Date.now();
  const normalizedTtl = toPositiveNumber(ttlMs, COUNTRIES_LIST_CACHE_TTL_MS);
  setLocalCache(COUNTRIES_LIST_PERSISTENT_CACHE_KEY, {
    data: rows,
    fetchedAt: now,
    expiresAt: now + normalizedTtl,
  });
};

const readPersistentCountriesListCache = () => {
  const cached = getLocalCache(COUNTRIES_LIST_PERSISTENT_CACHE_KEY);
  if (!cached || !Array.isArray(cached.data)) return null;

  return {
    data: cached.data,
    fetchedAt: Number(cached.fetchedAt) || 0,
    expiresAt: Number(cached.expiresAt) || 0,
  };
};

const setCountriesListSnapshot = (rows, expiresAt = 0) => {
  if (!Array.isArray(rows)) return;
  countriesListSnapshot = rows;
  countriesListSnapshotExpiresAt = Number(expiresAt) || 0;
};

const hydrateSnapshotFromPersistentCache = () => {
  if (persistentCacheHydrated) return;
  persistentCacheHydrated = true;

  const cached = readPersistentCountriesListCache();
  if (!cached || !isValidCountriesList(cached.data)) return;
  setCountriesListSnapshot(cached.data, cached.expiresAt);
};

const isSnapshotFresh = () => isValidCountriesList(countriesListSnapshot)
  && countriesListSnapshotExpiresAt > Date.now();

const resolveCountriesList = async ({
  forceRefresh = false,
  preferStale = true,
  ttlMs = COUNTRIES_LIST_CACHE_TTL_MS,
} = {}) => {
  hydrateSnapshotFromPersistentCache();

  if (!forceRefresh && isSnapshotFresh()) {
    return countriesListSnapshot;
  }

  if (!forceRefresh && isValidCountriesList(countriesListSnapshot) && preferStale) {
    if (!countriesListLoadPromise) {
      countriesListLoadPromise = (async () => {
        const rows = await fetchCountriesListFromAEM();
        if (isValidCountriesList(rows)) {
          const now = Date.now();
          const normalizedTtl = toPositiveNumber(ttlMs, COUNTRIES_LIST_CACHE_TTL_MS);
          setCountriesListSnapshot(rows, now + normalizedTtl);
          writePersistentCountriesListCache(rows, normalizedTtl);
        }
        return countriesListSnapshot;
      })().finally(() => {
        countriesListLoadPromise = null;
      });
    }
    return countriesListSnapshot;
  }

  if (!countriesListLoadPromise) {
    countriesListLoadPromise = (async () => {
      const rows = await fetchCountriesListFromAEM();
      if (isValidCountriesList(rows)) {
        const now = Date.now();
        const normalizedTtl = toPositiveNumber(ttlMs, COUNTRIES_LIST_CACHE_TTL_MS);
        setCountriesListSnapshot(rows, now + normalizedTtl);
        writePersistentCountriesListCache(rows, normalizedTtl);
      }
      return countriesListSnapshot;
    })().finally(() => {
      countriesListLoadPromise = null;
    });
  }

  return countriesListLoadPromise;
};

const fetchLanguagesListFromAEM = async () => {
  const responses = await Promise.all(
    LANGUAGES_LIST_DATASETS.map(async (dataset) => {
      try {
        const response = await fetchAEMData(dataset);
        const rows = normalizeRows(response);
        return rows.length > 0 ? rows : null;
      } catch (error) {
        return null;
      }
    }),
  );

  return responses.find((rows) => Array.isArray(rows) && rows.length > 0) || [];
};

const writePersistentLanguagesListCache = (rows, ttlMs = COUNTRIES_LIST_CACHE_TTL_MS) => {
  if (!isValidCountriesList(rows)) return;
  const now = Date.now();
  const normalizedTtl = toPositiveNumber(ttlMs, COUNTRIES_LIST_CACHE_TTL_MS);
  setLocalCache(LANGUAGES_LIST_PERSISTENT_CACHE_KEY, {
    data: rows,
    fetchedAt: now,
    expiresAt: now + normalizedTtl,
  });
};

const readPersistentLanguagesListCache = () => {
  const cached = getLocalCache(LANGUAGES_LIST_PERSISTENT_CACHE_KEY);
  if (!cached || !Array.isArray(cached.data)) return null;

  return {
    data: cached.data,
    fetchedAt: Number(cached.fetchedAt) || 0,
    expiresAt: Number(cached.expiresAt) || 0,
  };
};

const setLanguagesListSnapshot = (rows, expiresAt = 0) => {
  if (!Array.isArray(rows)) return;
  languagesListSnapshot = rows;
  languagesListSnapshotExpiresAt = Number(expiresAt) || 0;
};

const hydrateLanguagesSnapshotFromPersistentCache = () => {
  if (persistentLanguagesCacheHydrated) return;
  persistentLanguagesCacheHydrated = true;

  const cached = readPersistentLanguagesListCache();
  if (!cached || !isValidCountriesList(cached.data)) return;
  setLanguagesListSnapshot(cached.data, cached.expiresAt);
};

const isLanguagesSnapshotFresh = () => isValidCountriesList(languagesListSnapshot)
  && languagesListSnapshotExpiresAt > Date.now();

const resolveLanguagesList = async ({
  forceRefresh = false,
  preferStale = true,
  ttlMs = COUNTRIES_LIST_CACHE_TTL_MS,
} = {}) => {
  hydrateLanguagesSnapshotFromPersistentCache();

  if (!forceRefresh && isLanguagesSnapshotFresh()) {
    return languagesListSnapshot;
  }

  if (!forceRefresh && isValidCountriesList(languagesListSnapshot) && preferStale) {
    if (!languagesListLoadPromise) {
      languagesListLoadPromise = (async () => {
        const rows = await fetchLanguagesListFromAEM();
        if (isValidCountriesList(rows)) {
          const now = Date.now();
          const normalizedTtl = toPositiveNumber(ttlMs, COUNTRIES_LIST_CACHE_TTL_MS);
          setLanguagesListSnapshot(rows, now + normalizedTtl);
          writePersistentLanguagesListCache(rows, normalizedTtl);
        }
        return languagesListSnapshot;
      })().finally(() => {
        languagesListLoadPromise = null;
      });
    }
    return languagesListSnapshot;
  }

  if (!languagesListLoadPromise) {
    languagesListLoadPromise = (async () => {
      const rows = await fetchLanguagesListFromAEM();
      if (isValidCountriesList(rows)) {
        const now = Date.now();
        const normalizedTtl = toPositiveNumber(ttlMs, COUNTRIES_LIST_CACHE_TTL_MS);
        setLanguagesListSnapshot(rows, now + normalizedTtl);
        writePersistentLanguagesListCache(rows, normalizedTtl);
      }
      return languagesListSnapshot;
    })().finally(() => {
      languagesListLoadPromise = null;
    });
  }

  return languagesListLoadPromise;
};

/**
 * Obtiene countriesList desde AEM (con cache opcional)
 * @param {boolean} useCache
 * @returns {Promise<Array>}
 */
export const fetchCountriesList = async (useCache = USE_CACHE) => {
  if (useCache) {
    const cached = getSessionCache(COUNTRIES_LIST_CACHE_KEY);
    if (cached) return cached;
  }

  const rows = await fetchCountriesListFromAEM();

  if (useCache && rows.length > 0) {
    setSessionCache(COUNTRIES_LIST_CACHE_KEY, rows);
  }

  return rows;
};

const toCountryDataEntry = (item, language = 'es') => {
  const countryCode = String(item?.countryCode || '').trim().toLowerCase();
  if (!countryCode) return null;

  const active = String(item?.active || '').trim().toLowerCase() === 'true';
  if (!active) return null;

  const labelByLanguage = {
    es: item?.countryName_es,
    en: item?.countryName_en,
    pt: item?.countryName_pt,
    fr: item?.countryName_fr,
  };
  const localizedLabel = labelByLanguage[language] || item?.countryName;

  const iataCountryCode = String(item?.iataCountryCode || '').trim().toLowerCase();
  const acceptLanguage = String(item?.acceptLanguage || '').trim().toLowerCase();

  const rawAllowedLanguages = String(item?.AllowedLanguages || '').trim();
  const rawDefaultLanguage = String(item?.DefaultLanguage || '').trim().toLowerCase();
  const allowedLanguages = rawAllowedLanguages
    ? rawAllowedLanguages.split(',').map((l) => l.trim().toLowerCase()).filter(Boolean)
    : null;

  return {
    key: countryCode,
    value: {
      label: localizedLabel || '',
      flagFileName: item?.countryFlagFileName || '',
      currencyCode: item?.countryCurrencyCode || '',
      keyIso: String(item?.pos || '').trim().toLowerCase(),
      // Optional: IATA country code when it differs from the ISO keyIso
      // (e.g. UK vs GB, OTHERS vs OT). Consumed by mapIsoToCountryCode so
      // geolocation-layer POS values resolve to the correct catalog entry.
      ...(iataCountryCode ? { iataCountryCode } : {}),
      // Optional: language this country is the default for (e.g. COL→'es',
      // BRA→'pt', OTH→'_fallback_'). Consumed by getDefaultCountryForLanguage
      // to pick a country when no cookie is set.
      ...(acceptLanguage ? { acceptLanguage } : {}),
      // Optional: restricted language list for this POS (from countireslist spreadsheet).
      // When present, the language selector only shows these options.
      ...(allowedLanguages && allowedLanguages.length > 0 ? { allowedLanguages } : {}),
      ...(rawDefaultLanguage ? { defaultLanguage: rawDefaultLanguage } : {}),
    },
  };
};

export const mapCountriesListToCountryData = (countriesList = [], language = 'es') => countriesList
  .map((item) => toCountryDataEntry(item, language))
  .filter(Boolean)
  .reduce((acc, entry) => {
    acc[entry.key] = entry.value;
    return acc;
  }, {});

const toLanguageDataEntry = (item) => {
  const languageCode = String(item?.languageCode || '').trim().toLowerCase();
  if (!languageCode) return null;

  const active = String(item?.active || '').trim().toLowerCase() === 'true';
  if (!active) return null;

  return {
    key: languageCode,
    value: {
      label: item?.languageName || '',
    },
  };
};

export const mapLanguagesListToLanguageData = (languagesList = []) => languagesList
  .map((item) => toLanguageDataEntry(item))
  .filter(Boolean)
  .reduce((acc, entry) => {
    acc[entry.key] = entry.value;
    return acc;
  }, {});

const normalizeLanguageForMapping = (language) => normalizeLanguageCode(language) || 'es';

export const getPOSDataSnapshot = (language = getCurrentLanguage()) => {
  hydrateSnapshotFromPersistentCache();
  const normalizedLanguage = normalizeLanguageForMapping(language);
  return mapCountriesListToCountryData(countriesListSnapshot, normalizedLanguage);
};

export const ensurePOSDataLoaded = async ({
  forceRefresh = false,
  preferStale = true,
  ttlMs = COUNTRIES_LIST_CACHE_TTL_MS,
} = {}) => {
  const countriesList = await resolveCountriesList({ forceRefresh, preferStale, ttlMs });
  const language = getCurrentLanguage();
  return mapCountriesListToCountryData(countriesList, language);
};

export const getLanguagesDataSnapshot = () => {
  hydrateLanguagesSnapshotFromPersistentCache();
  return mapLanguagesListToLanguageData(languagesListSnapshot);
};

export const ensureLanguagesDataLoaded = async ({
  forceRefresh = false,
  preferStale = true,
  ttlMs = COUNTRIES_LIST_CACHE_TTL_MS,
} = {}) => {
  const languagesList = await resolveLanguagesList({ forceRefresh, preferStale, ttlMs });
  return mapLanguagesListToLanguageData(languagesList);
};

const HARDCODED_FALLBACK_POS = 'es-col';

const findDefaultRow = (rows) => rows.find(
  (row) => String(row?.default || '').trim().toLowerCase() === 'true'
    && String(row?.active || '').trim().toLowerCase() === 'true',
) || null;

export const getDefaultCountryRow = () => {
  hydrateSnapshotFromPersistentCache();
  return findDefaultRow(countriesListSnapshot);
};

export const getDefaultLanguageRow = () => {
  hydrateLanguagesSnapshotFromPersistentCache();
  return findDefaultRow(languagesListSnapshot);
};

export const getDefaultPos = () => {
  const defaultLangRow = getDefaultLanguageRow();
  const defaultCountryRow = getDefaultCountryRow();

  if (!defaultLangRow || !defaultCountryRow) {
    return HARDCODED_FALLBACK_POS;
  }

  const lang = String(defaultLangRow.languageCode || '').trim().toLowerCase();
  const country = String(defaultCountryRow.countryCode || '').trim().toLowerCase();

  if (!lang || !country) {
    return HARDCODED_FALLBACK_POS;
  }

  return `${lang}-${country}`;
};

export const getDefaultCountryIsoCode = () => {
  const row = getDefaultCountryRow();
  if (!row) return 'co';
  const iso = String(row.pos || '').trim().toLowerCase();
  return iso || 'co';
};

export const getDefaultCountryCode = () => {
  const row = getDefaultCountryRow();
  if (!row) return 'col';
  const code = String(row.countryCode || '').trim().toLowerCase();
  return code || 'col';
};

export const getPOSData = async (useCache = USE_CACHE) => {
  if (!useCache) {
    return ensurePOSDataLoaded();
  }

  const countriesList = await fetchCountriesList(useCache);
  const language = getCurrentLanguage();
  return mapCountriesListToCountryData(countriesList, language);
};

/**
 * Resolves the Amadeus POS code for a given ISO country code.
 *
 * Checks the `amadeusPos` column in the countrieslist spreadsheet first.
 * If absent, empty, or the snapshot is not available for any reason, falls
 * back transparently to `mapCountryToPos(isoCode)` — identical to current behavior.
 *
 * Defensive contract: this function NEVER throws. All failure paths return
 * the same value that the codebase produced before this column existed.
 *
 * @param {string} isoCode - Lowercase ISO country code from cookie (e.g. 'co', 'fr')
 * @returns {string} Uppercase POS code to send to Amadeus (e.g. 'CO', 'ES')
 */
export const getAmadeusPosForIsoCode = (isoCode) => {
  try {
    hydrateSnapshotFromPersistentCache();

    const normalized = typeof isoCode === 'string' ? isoCode.trim().toLowerCase() : '';

    if (normalized && Array.isArray(countriesListSnapshot) && countriesListSnapshot.length > 0) {
      const row = countriesListSnapshot.find(
        (item) => typeof item === 'object'
          && item !== null
          && String(item?.pos ?? '').trim().toLowerCase() === normalized,
      );

      if (row) {
        const override = String(row?.amadeusPos ?? '').trim().toUpperCase();
        if (override) return override;
      }
    }
  } catch (error) {
    // Snapshot lookup failed for any reason — fall through to safe default
  }

  return mapCountryToPos(isoCode);
};
