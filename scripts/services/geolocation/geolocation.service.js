/**
 * Geolocation Service
 *
 * Single source of truth for resolving the user's geolocation
 * (PBI 1216373 — Fenix Geolocalización Home).
 *
 * Orchestrates:
 *   1. Return cached result from sessionStorage (if any)
 *   2. Query W3C geolocation permission state
 *   3. Fetch coordinates with a 400ms timeout (only if permission === 'granted')
 *   4. Persist result in sessionStorage
 *
 * Render-safe: never blocks the page. When permission is 'prompt' in the
 * eager phase, returns null and lets the page render with a fallback.
 * A lazy phase (post-render) can re-invoke with `{ force: true }` after
 * the user grants permission.
 *
 * Does NOT know about POS, airports, cookies, or AEM. Those concerns live
 * in triangulation.service.js and the loadEager() orchestration.
 */

import {
  queryGeolocationPermission,
  getCurrentCoordinates,
  onGeolocationPermissionChange,
} from '../../utils/browser-geolocation.helper.js';
import { ensurePOSDataLoaded } from '../header/get-pos-data.js';
import {
  setStoredCountry,
  setStoredLanguage,
  setStoredCurrency,
  getStoredCountry,
  getStoredLanguage,
  normalizeToIsoCountry,
} from '../header/language-country-selector.js';
import { detectLocale } from '../../aem.js';
import { fetchAEMData } from '../../utils/aem-data.js';
import { calculateDistance } from '../../utils/haversine.helper.js';
import { triangulatePOS } from './triangulation.service.js';
import {
  resolveUmbrellaPosSubresolution,
  hasUmbrellaSubresolution,
} from './umbrella-pos-subresolution.service.js';

const CACHE_KEY = 'geo-result';
const URL_POSCODE_KEY = 'url-poscode';
const GEO_SOURCE_KEY = 'geo-source';
const GEO_CONFLICT_KEY = 'geo-conflict';
const GEO_NEAREST_AIRPORT_KEY = 'geo-nearest-airport';

/**
 * If the user's real coordinates are more than this many kilometers away
 * from the cached resolution, we treat it as a "relocation" and invalidate
 * downstream state (conflict tag, detected POS, nearest airport) so the
 * flow re-resolves with fresh data. Typical inter-city distances (e.g.
 * Bogotá ↔ Medellín ≈ 240 km) stay under this threshold; cross-country
 * travel (e.g. Colombia ↔ Spain ≈ 8600 km) triggers invalidation.
 */
const CACHE_INVALIDATION_DISTANCE_KM = 200;
/**
 * System-detected POS (best effort): W3C triangulation if available,
 * otherwise the Accept-Language guess. Used by the manual-POS-change
 * listener to decide whether to show the conflict modal when the user
 * picks a different country in the header (PBI header rule + LATAM UX).
 */
const INITIAL_DETECTED_POS_KEY = 'initial-detected-pos';
const INITIAL_DETECTED_POS_SOURCE_KEY = 'initial-detected-pos-source';
const DEFAULT_TIMEOUT_MS = 400;

// Source ranking for `persistInitialDetectedPos` upgrades.
// Higher rank = more authoritative; can overwrite any lower-or-equal rank
// already persisted. Keeps the captured POS stable once the best signal
// for the session has been observed, but avoids freezing on a weak eager
// fallback when a stronger signal (W3C geo, URL) arrives later.
const INITIAL_DETECTED_POS_SOURCE_RANK = {
  'accept-language': 1,
  'existing-cookie': 1,
  'w3c-geo-conflict': 2,
  'w3c-geo': 2,
  'url-umbrella': 3,
  url: 3,
};

/**
 * @typedef {object} GeoResult
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {'granted'|'denied'|'unsupported'|'timeout'} status
 * @property {number} timestamp
 */

/**
 * @returns {GeoResult | null}
 */
function readCache() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] cache read failed:', error);
    return null;
  }
}

/**
 * @param {GeoResult} result
 */
function writeCache(result) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] cache write failed:', error);
  }
}

/**
 * Invalidate downstream geo state when a relocation is detected.
 * Cleans everything EXCEPT the fresh geo-result itself (which the caller
 * is about to rewrite) and the user's explicit modal dismissal flag
 * (localStorage) — the user's previous "no, keep me here" choice might
 * still be valid after movement, they can dismiss again if needed.
 */
function invalidateRelatedGeoState() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(GEO_CONFLICT_KEY);
    sessionStorage.removeItem(GEO_NEAREST_AIRPORT_KEY);
    sessionStorage.removeItem(INITIAL_DETECTED_POS_KEY);
    sessionStorage.removeItem(INITIAL_DETECTED_POS_SOURCE_KEY);
    sessionStorage.removeItem(GEO_SOURCE_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] relocation state invalidation failed:', error);
  }
}

/**
 * Resolve the user's geolocation.
 *
 * Return values:
 *   - `null` → permission is 'prompt' and `allowPromptUser` is false
 *     (eager phase: do not block render; lazy phase should re-invoke)
 *   - `GeoResult` with status 'granted' → valid lat/lng
 *   - `GeoResult` with status 'denied'|'unsupported'|'timeout' → no coords, apply fallback
 *
 * @param {object} [options]
 * @param {number} [options.timeout=400] - Max ms to wait for getCurrentPosition
 * @param {boolean} [options.force=false] - Bypass sessionStorage cache
 * @param {boolean} [options.allowPromptUser=false] - When `true`, actively
 *   triggers the native browser prompt if permission is 'prompt'. Intended
 *   for the lazy phase (post-render). Default false to protect LCP.
 * @returns {Promise<GeoResult | null>}
 */
export async function resolveGeolocation({
  timeout = DEFAULT_TIMEOUT_MS,
  force = false,
  allowPromptUser = false,
} = {}) {
  const cached = !force ? readCache() : null;

  // Non-granted cached states (denied/unsupported/timeout) do not depend
  // on coordinates, so we can short-circuit without freshness check.
  if (cached && cached.status !== 'granted') {
    return cached;
  }

  const permission = await queryGeolocationPermission();

  if (permission === 'denied' || permission === 'unsupported') {
    const result = {
      lat: null, lng: null, status: permission, timestamp: Date.now(),
    };
    writeCache(result);
    return result;
  }

  if (permission === 'prompt' && !allowPromptUser) {
    // Eager phase: do NOT request permission — native browser prompt would
    // block render. The lazy phase passes `allowPromptUser: true` to show it.
    // If we have a cached granted result, preserve it for this session.
    if (cached?.status === 'granted') return cached;
    return null;
  }

  const coords = await getCurrentCoordinates({ timeout });
  if (!coords) {
    // Fresh fetch failed — preserve cached granted result if it exists,
    // otherwise record the timeout so callers can fall back.
    if (cached?.status === 'granted') return cached;
    const result = {
      lat: null, lng: null, status: 'timeout', timestamp: Date.now(),
    };
    writeCache(result);
    return result;
  }

  // Relocation detection: if the user's real coords are far from the last
  // cached resolution, invalidate dependent state (conflict, nearest, etc.)
  // so the rest of resolvePOS re-derives everything with the new location.
  // Typical intra-POS movement (ciudad→ciudad) stays under the threshold.
  if (cached?.status === 'granted' && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
    const dist = calculateDistance(cached.lat, cached.lng, coords.lat, coords.lng);
    if (dist <= CACHE_INVALIDATION_DISTANCE_KM) {
      // Still in the same area — keep cached resolution (preserves timestamp).
      return cached;
    }
    // Drastic movement → invalidate downstream so resolvePOS re-runs fresh.
    // eslint-disable-next-line no-console
    console.log(`[geolocation.service] relocation detected (${dist.toFixed(0)}km) — invalidating geo state`);
    invalidateRelatedGeoState();
  }

  const result = {
    lat: coords.lat,
    lng: coords.lng,
    status: 'granted',
    timestamp: Date.now(),
  };
  writeCache(result);
  return result;
}

/**
 * @typedef {object} URLPOSResult
 * @property {string} pos  ISO 2-letter or umbrella code (e.g. 'do', 'co', 'eu')
 * @property {boolean} isUmbrella  true when poscode is an "umbrella POS" with
 *   sub-resolution rules in the AEM `umbrella-pos-subresolution` sheet →
 *   caller must run sub-resolution to get the final POS
 */

/**
 * @param {string} poscode
 */
function persistURLPoscode(poscode) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(URL_POSCODE_KEY, poscode);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] url-poscode persist failed:', error);
  }
}

/**
 * Read `?poscode=` from URL and apply it as the highest-priority POS source.
 *
 * Hierarchy position: Level 1 in the PBI resolution order.
 *
 * Flow:
 * - If the poscode is an "umbrella POS" (has rows in `umbrella-pos-subresolution`
 *   sheet) → only tag and persist; caller runs sub-resolution by geo.
 * - If the poscode is a normal POS (found in `countrieslist`) → set cookies
 *   and return.
 * - Otherwise → warn and return null (fall through to geo).
 *
 * @returns {Promise<URLPOSResult | null>}
 *   - `null` → no param, invalid param, or catalog load failed → continue to geo
 *   - `{ pos, isUmbrella: true }` → orchestrator must run sub-resolution
 *   - `{ pos, isUmbrella: false }` → cookies set, POS resolution done
 */
export async function resolvePOSFromURL() {
  if (typeof window === 'undefined') return null;

  const raw = new URLSearchParams(window.location.search).get('poscode');
  if (!raw) return null;

  const poscode = raw.trim().toLowerCase();

  // Umbrella check first — if this POS has sub-resolution rules, defer to
  // the orchestrator (don't set cookies yet, sub-resolution will do it).
  const isUmbrella = await hasUmbrellaSubresolution(poscode);
  if (isUmbrella) {
    persistURLPoscode(poscode);
    return { pos: poscode, isUmbrella: true };
  }

  try {
    const posData = await ensurePOSDataLoaded();
    const isValid = Object.values(posData || {})
      .some((entry) => entry?.keyIso === poscode);

    if (!isValid) {
      // eslint-disable-next-line no-console
      console.warn(`[geolocation.service] poscode=${raw} not found in catalog; continuing with geo`);
      return null;
    }

    setStoredCountry(poscode);
    persistURLPoscode(poscode);
    return { pos: poscode, isUmbrella: false };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] POS catalog load failed:', error);
    return null;
  }
}

/**
 * Accept-Language fallback (PBI level 3).
 *
 * Source of truth: AEM `countrieslist` sheet, column `acceptLanguage`.
 * Rows whose `acceptLanguage` matches `navigator.language` decide the POS.
 * Special row `_FALLBACK_` captures the "any other language" case.
 *
 * Minimal inline fallback below is used only when the AEM sheet fails
 * completely — keeps the service from crashing.
 */
const ACCEPT_LANG_MINIMAL_FALLBACK = {
  mapping: {
    es: {
      pos: 'co', language: 'es', currency: 'COP', ato: 'BOG',
    },
    en: {
      pos: 'us', language: 'en', currency: 'USD', ato: 'MIA',
    },
    pt: {
      pos: 'br', language: 'pt', currency: 'BRL', ato: 'GRU',
    },
    fr: {
      pos: 'fr', language: 'fr', currency: 'EUR', ato: 'CDG',
    },
  },
  fallback: {
    pos: 'ot', language: 'en', currency: 'USD', ato: 'MIA',
  },
};

const COUNTRIESLIST_ENDPOINT = 'countireslist';
const ACCEPT_LANG_FALLBACK_KEY = '_fallback_';
let acceptLangMappingCache = null;

function parseAcceptLanguage() {
  if (typeof navigator === 'undefined') return 'es';
  const langs = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || 'es'];
  return (langs[0] || 'es').split('-')[0].toLowerCase();
}

/**
 * Build the Accept-Language → POS mapping from the AEM `countrieslist`
 * sheet by reading the `acceptLanguage` column on each row.
 * @returns {Promise<{mapping: object, fallback: object|null}>}
 */
async function buildAcceptLanguageMapping() {
  try {
    const data = await fetchAEMData(COUNTRIESLIST_ENDPOINT);
    const rows = Array.isArray(data?.data) ? data.data : [];
    const mapping = {};
    let fallback = null;

    rows.forEach((row) => {
      const acceptLang = String(row?.acceptLanguage || '').trim().toLowerCase();
      if (!acceptLang) return;
      const pos = String(row?.pos || '').trim().toLowerCase();
      if (!pos) return;
      const entry = {
        pos,
        language: acceptLang === ACCEPT_LANG_FALLBACK_KEY ? 'en' : acceptLang,
        currency: String(row?.countryCurrencyCode || '').toUpperCase(),
        // PBI priority table: "ATO Default del POS" lives in the `ato` column,
        // which can differ from `mainCity` (e.g. BRA: mainCity=GIG vs ato=GRU,
        // ARG: BUE vs EZE, DOM: PUJ vs SDQ, OTH: BOG vs MIA). Fall back to
        // mainCity only when `ato` is missing to stay resilient to legacy rows.
        ato: String(row?.ato || row?.mainCity || '').toUpperCase(),
      };
      if (acceptLang === ACCEPT_LANG_FALLBACK_KEY) fallback = entry;
      else mapping[acceptLang] = entry;
    });

    return { mapping, fallback };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] countrieslist fetch failed, using minimal fallback:', error);
    return { mapping: {}, fallback: null };
  }
}

async function ensureAcceptLanguageMapping() {
  if (acceptLangMappingCache) return acceptLangMappingCache;
  const result = await buildAcceptLanguageMapping();
  // If the sheet returned nothing usable, fall back to the minimal map.
  if (Object.keys(result.mapping).length === 0 && !result.fallback) {
    acceptLangMappingCache = ACCEPT_LANG_MINIMAL_FALLBACK;
  } else {
    acceptLangMappingCache = result;
  }
  return acceptLangMappingCache;
}

async function resolveAcceptLanguageFallback() {
  const lang = parseAcceptLanguage();
  const { mapping, fallback } = await ensureAcceptLanguageMapping();
  return mapping[lang]
    || fallback
    || ACCEPT_LANG_MINIMAL_FALLBACK.fallback;
}

function persistGeoSource(source) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(GEO_SOURCE_KEY, source);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] geo-source persist failed:', error);
  }
}

/**
 * Tag a POS conflict without touching cookies. The modal service (T06)
 * reads this post-render to decide whether to prompt the user.
 * @param {{ cookiePos: string, geoPos: string, geoAto?: string }} state
 */
function persistConflictState(state) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(GEO_CONFLICT_KEY, JSON.stringify(state));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] geo-conflict persist failed:', error);
  }
}

/**
 * Persist the nearest airport resolved by triangulation so downstream
 * components (booking box, origin dropdown) can pre-fill the origin field
 * with the user's closest Avianca airport (ATO nearest) instead of the
 * POS mainCity default (ATO default).
 * @param {{ iataCityCode: string, iataCountryCode: string, pos: string, distance: number }} airport
 */
function persistNearestAirport(airport) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(GEO_NEAREST_AIRPORT_KEY, JSON.stringify(airport));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] geo-nearest-airport persist failed:', error);
  }
}

/**
 * Persist the system-detected POS (ISO 2-letter) for later comparison
 * against manual header selections.
 *
 * Uses a rank-based upgrade policy instead of "first wins": a weak eager
 * fallback (Accept-Language, existing cookie) can be replaced later by a
 * stronger signal (W3C geolocation, URL poscode). Once the strongest
 * signal for the session lands, further writes of equal-or-lower rank
 * are ignored so the value stays stable.
 *
 * @param {string} pos    ISO 2-letter POS (e.g. 'co', 'gb')
 * @param {string} source origin of the value — key in INITIAL_DETECTED_POS_SOURCE_RANK
 */
function persistInitialDetectedPos(pos, source) {
  if (typeof sessionStorage === 'undefined' || !pos || !source) return;
  const incomingRank = INITIAL_DETECTED_POS_SOURCE_RANK[source] || 0;
  if (!incomingRank) return;
  try {
    const currentSource = sessionStorage.getItem(INITIAL_DETECTED_POS_SOURCE_KEY);
    const currentRank = currentSource
      ? (INITIAL_DETECTED_POS_SOURCE_RANK[currentSource] || 0)
      : 0;
    // Only overwrite when incoming source is strictly stronger. Equal-rank
    // writes are ignored to keep the captured value stable within a tier.
    if (currentRank && incomingRank <= currentRank) return;
    sessionStorage.setItem(INITIAL_DETECTED_POS_KEY, pos.toLowerCase());
    sessionStorage.setItem(INITIAL_DETECTED_POS_SOURCE_KEY, source);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] initial-detected-pos persist failed:', error);
  }
}

function applyResolutionCookies({ pos, language, currency }) {
  if (pos) setStoredCountry(pos);
  if (language) setStoredLanguage(language);
  if (currency) setStoredCurrency(currency);
}

/**
 * Ensure the `selected-language` cookie is present. The header re-normalizes
 * the POS when ANY of (selected-country, selected-language, selected-pos)
 * is missing. We set it to the language detected from the URL (source of
 * truth for language) or keep any existing value.
 */
function ensureLanguageCookie() {
  if (getStoredLanguage()) return;
  try {
    const urlLocale = detectLocale?.();
    const lang = urlLocale?.language?.toLowerCase();
    if (lang) setStoredLanguage(lang);
  } catch (_) { /* detectLocale may fail if DOM not ready — ignore */ }
}

/**
 * @typedef {object} POSResolution
 * @property {'url'|'url-eu'|'w3c-geo'|'accept-language'} source
 * @property {string} pos              POS code (ISO 2-letter, or 'OTHERS'/'EU'/'UK')
 * @property {string} [language]       language code when known
 * @property {string} [currency]       currency code when known
 * @property {string} [ato]            ATO IATA when known
 */

/**
 * Orchestrator: resolves POS through the full PBI hierarchy.
 *
 * Execution order (stops at first match):
 *   1. URL `?poscode=` → if valid, set cookies and return
 *   2. URL `?poscode=EU` → geo-triangulate to sub-resolve (FR/EU/OTHERS)
 *   3. W3C geolocation (permission granted) → triangulate nearest airport
 *   4. Accept-Language header → POS fallback (level 3)
 *
 * Side effects: writes cookies (`selected-country`, `selected-language`,
 * `selected-currency`) and sessionStorage (`geo-source`). Safe to call once
 * per page load before `initLocaleGlobals()`.
 *
 * Never throws. Never returns null — always produces a resolution (falls
 * back to Accept-Language at worst).
 *
 * @param {object} [options]
 * @param {number} [options.timeout=400]
 * @returns {Promise<POSResolution>}
 */
export async function resolvePOS(options = {}) {
  // Level 1: URL ?poscode=
  const urlResult = await resolvePOSFromURL();

  if (urlResult && !urlResult.isUmbrella) {
    // Cookies already set inside resolvePOSFromURL (country + currency).
    // Ensure language cookie is present so the header doesn't reset to default.
    ensureLanguageCookie();
    persistGeoSource('url');
    return { source: 'url', pos: urlResult.pos };
  }

  if (urlResult?.isUmbrella) {
    // Umbrella POS (e.g. EU, future LATAM/APAC): geo-triangulate to sub-resolve
    const geo = await resolveGeolocation(options);
    const country = geo?.status === 'granted'
      ? (await triangulatePOS(geo.lat, geo.lng))?.iataCountryCode
      : null;
    const resolved = await resolveUmbrellaPosSubresolution(
      urlResult.pos.toUpperCase(),
      country,
    );
    applyResolutionCookies({
      pos: resolved.pos.toLowerCase() === 'others' ? 'ot' : resolved.pos.toLowerCase(),
      language: resolved.idioma,
      currency: resolved.moneda,
    });
    persistGeoSource('url-umbrella');
    return {
      source: 'url-umbrella',
      pos: resolved.pos,
      language: resolved.idioma,
      currency: resolved.moneda,
      ato: resolved.ato,
    };
  }

  // Level 2: W3C geolocation + triangulation
  const geo = await resolveGeolocation(options);
  if (geo?.status === 'granted') {
    const triangulated = await triangulatePOS(geo.lat, geo.lng);
    if (triangulated) {
      const resolvedIso = normalizeToIsoCountry(triangulated.pos)
        || triangulated.pos.toLowerCase();
      const existingCookie = (getStoredCountry() || '').toLowerCase();

      if (existingCookie && existingCookie !== resolvedIso) {
        // Conflict detected — PBI rule: user decides via modal. Don't overwrite.
        persistConflictState({
          cookiePos: existingCookie,
          geoPos: resolvedIso,
          geoAto: triangulated.ato,
        });
        persistGeoSource('w3c-geo-conflict');
        persistInitialDetectedPos(resolvedIso, 'w3c-geo-conflict');
        return {
          source: 'w3c-geo',
          pos: triangulated.pos,
          ato: triangulated.ato,
          hasConflict: true,
          existingPos: existingCookie,
        };
      }

      applyResolutionCookies({ pos: resolvedIso });
      ensureLanguageCookie();
      persistGeoSource('w3c-geo');
      // Pre-fill hint for booking box (T07): closest Avianca airport
      persistNearestAirport({
        iataCityCode: triangulated.iataCityCode,
        iataCountryCode: triangulated.iataCountryCode,
        pos: triangulated.pos,
        distance: triangulated.distance,
      });
      persistInitialDetectedPos(resolvedIso, 'w3c-geo');
      return {
        source: 'w3c-geo',
        pos: triangulated.pos,
        ato: triangulated.ato,
      };
    }
  }

  // Before Level 3 fallback: respect an existing cookie. The user may have
  // picked a POS manually in the header in a prior session — do not override
  // their choice with Accept-Language guesses.
  const existingCookie = (getStoredCountry() || '').toLowerCase();
  if (existingCookie) {
    ensureLanguageCookie();
    persistGeoSource('existing-cookie');
    // Seed the system-detected POS using Accept-Language so the manual
    // POS-change listener can fire even for users who never granted geo.
    const existingFallback = await resolveAcceptLanguageFallback();
    persistInitialDetectedPos(existingFallback.pos, 'existing-cookie');
    return { source: 'existing-cookie', pos: existingCookie };
  }

  // Level 3: Accept-Language fallback (only when no prior cookie exists)
  const fallback = await resolveAcceptLanguageFallback();
  applyResolutionCookies(fallback);
  persistGeoSource('accept-language');
  persistInitialDetectedPos(fallback.pos, 'accept-language');
  return {
    source: 'accept-language',
    pos: fallback.pos,
    language: fallback.language,
    currency: fallback.currency,
    ato: fallback.ato,
  };
}

let lateGrantListenerAttached = false;

async function handleLateGrant() {
  // User accepted after both eager (400ms) and lazy (10s) timeouts — or
  // toggled the permission in browser settings. Refresh the resolution
  // with real coordinates.
  const result = await resolvePOS({ timeout: 10000, force: true });
  if (result?.hasConflict) {
    try {
      const mod = await import('./geo-conflict-modal.service.js');
      await mod.maybeShowGeoConflictModal();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[geolocation.service] late-grant conflict modal failed:', error);
    }
    return;
  }
  // No conflict: cookies and geo-nearest-airport have been refreshed.
  // Notify already-rendered components so they can re-read storage and
  // update their UI without requiring a page reload.
  try {
    const raw = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(GEO_NEAREST_AIRPORT_KEY)
      : null;
    if (!raw) return;
    const airport = JSON.parse(raw);
    const { dispatchGeoNearestAirportRefreshed } = await import(
      '../../utils/event-constants.js'
    );
    dispatchGeoNearestAirportRefreshed({
      iataCityCode: airport.iataCityCode,
      iataCountryCode: airport.iataCountryCode,
      pos: airport.pos,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[geolocation.service] late-grant notify failed:', error);
  }
}

async function attachLatePermissionGrantListener() {
  if (lateGrantListenerAttached) return;
  lateGrantListenerAttached = true;

  let unsubscribe = () => {};
  const handleChange = async (newState) => {
    if (newState === 'granted') {
      unsubscribe();
      lateGrantListenerAttached = false;
      await handleLateGrant();
    } else if (newState === 'denied') {
      unsubscribe();
      lateGrantListenerAttached = false;
    }
  };
  unsubscribe = await onGeolocationPermissionChange(handleChange);
}

/**
 * Lazy-phase geolocation request.
 *
 * Invoked post-render from `loadLazy()`. Runs AFTER LCP so it never blocks
 * initial paint.
 *
 * Behavior:
 *   - Cache already has a non-timeout result → no-op
 *   - permission === 'granted' + cache is 'timeout' (user accepted between
 *     eager timeout and lazy execution) → refresh immediately with real coords
 *   - permission === 'prompt' → shows the native prompt with a 10s timeout
 *     AND attaches a `permissions.onchange` listener as a safety net for
 *     users who decide after the 10s window
 *   - permission === 'denied' / 'unsupported' → no-op
 *
 * The onchange listener covers Safari 16+/Chrome/Firefox/Edge. Safari <16
 * lacks Permissions API support and silently no-ops the listener — the
 * 10s prompt timeout still covers the common case on those browsers.
 *
 * @returns {Promise<object|null>} the resolution result, or null if no-op
 */
export async function lazyGeolocationRequest() {
  if (typeof navigator === 'undefined') return null;

  const cached = readCache();
  if (cached && cached.status !== 'timeout') return null;

  const permission = await queryGeolocationPermission();

  if (permission === 'granted') {
    return resolvePOS({ timeout: 10000, force: true });
  }

  if (permission === 'prompt') {
    attachLatePermissionGrantListener();
    return resolvePOS({
      timeout: 10000,
      force: true,
      allowPromptUser: true,
    });
  }

  return null;
}

export default resolveGeolocation;
