/**
 * OriginDestinationSelector Service
 *
 * Service to query the available cities from the combinability API.
 * Handles sessionStorage caching and option filtering.
 *
 * `fetchCities` acts as a router: it reads the `AV_APIM_DIRECT_MODE` feature
 * flag and delegates to one of two paths — direct APIM (new) or the App Builder
 * proxy (extracted to `origin-destination-selector.proxy.service.js`). Both
 * paths coexist indefinitely: the flag is toggled from AEM Author without a
 * redeploy.
 */

import { getStoredLanguage, getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';
import { readUserOriginSelection } from '../../../scripts/utils/event-constants.js';
import { isApimDirectMode } from '../../../scripts/services/apim/apim-mode.js';
import { consultaCombinabilidad } from '../../../scripts/services/apim/apim-client.service.js';
import { fetchCitiesProxy } from './origin-destination-selector.proxy.service.js';

// Constants
const CACHE_KEY = 'avianca_cities_cache';
const DEFAULT_LANGUAGE = 'es';
const USE_CACHE = false;

/**
 * Resolve the destination when the origin changes (PBI CU-189 CA4 rule 3):
 * if the user picks an origin different from the current one and a destination
 * was already selected, the destination is cleared so it can be recomputed
 * against the destinations available from the new origin.
 * @param {{iataCityCode?: string} | null} currentOrigin
 * @param {{iataCityCode?: string} | null} nextOrigin
 * @param {object | null} destination
 * @returns {object | null}
 */
export const resolveNextDestination = (currentOrigin, nextOrigin, destination) => {
  const originChanged = currentOrigin?.iataCityCode !== nextOrigin?.iataCityCode;
  return originChanged && destination ? null : destination;
};

/**
 * Read the nearest-airport hint persisted by `resolvePOS()` when the user's
 * W3C geolocation resolved within the same POS as the active cookie.
 * Only honored if the hint's country matches the current POS (stale guard).
 * @param {string} pos Active cookie POS ISO (e.g. 'co', 'gb')
 * @returns {string|null} IATA city code from the hint, or null
 */
const getNearestAirportHint = (pos) => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('geo-nearest-airport');
    if (!raw) return null;
    const hint = JSON.parse(raw);
    const hintCountry = String(hint?.iataCountryCode || '').toLowerCase();
    const active = String(pos || '').toLowerCase();
    // Stale guard: discard hint if it belongs to a different country than
    // the current POS (e.g. user changed POS manually after geo resolved).
    const matchesActive = hintCountry === active
      || (hintCountry === 'uk' && active === 'gb')
      || (hintCountry === 'gb' && active === 'uk');
    if (!matchesActive) return null;
    return hint?.iataCityCode || null;
  } catch (_) {
    return null;
  }
};

/**
 * Find the city entry in the Booking Box catalog that corresponds to the POS
 * default ATO. The catalog returned by `consultaCombinabilidad` splits each
 * record into `iataCityCode` (metropolitan code, e.g. BUE, PAR, NYC) and
 * `iataTerminal` (the physical airport, e.g. EZE, CDG, JFK). A multi-airport
 * city exposes several rows sharing the same `iataCityCode` — one per physical
 * terminal (BUE/AEP, BUE/EZE) plus, when the backend publishes it, a
 * metropolitan aggregate row whose terminal equals the city code (BUE/BUE =
 * "all Buenos Aires airports").
 *
 * Resolution order (first match wins), deliberately independent of the
 * backend array order:
 *   1. Metropolitan aggregate / single-airport city: a row where both
 *      `iataCityCode` and `iataTerminal` equal `ato`. This makes `ato=BUE`
 *      resolve to the BUE/BUE aggregate instead of whichever terminal row
 *      (AEP/EZE) happens to come first in the response. Single-airport cities
 *      (BOG/BOG) also match here, so they stay deterministic.
 *   2. Any row whose city code equals `ato` — used when `ato` is a metro code
 *      but no aggregate row exists (falls back to backend order, unavoidable).
 *   3. Terminal pin: a row whose terminal equals `ato`, so authors may still
 *      force a specific airport (e.g. `ato=EZE` → Ezeiza over Aeroparque) and
 *      the code stays tolerant of a `countireslist` row that stores a terminal
 *      code instead of leaving the Booking Box empty.
 * @param {Array<{iataCityCode?: string, iataTerminal?: string}>|null} cities
 * @param {string|null} ato IATA code (city or terminal)
 * @returns {object|null} The matched city entry, or null.
 */
export const findDefaultOriginCity = (cities, ato) => {
  if (!ato || !Array.isArray(cities) || cities.length === 0) return null;
  return cities.find((city) => city.iataCityCode === ato && city.iataTerminal === ato)
    || cities.find((city) => city.iataCityCode === ato)
    || cities.find((city) => city.iataTerminal === ato)
    || null;
};

/**
 * Cities whose several airports must be presented as one metropolitan unit
 * (PBI 1294884). The array is the exact order the options have to appear in,
 * aggregate first; any terminal not listed keeps its relative position after
 * the listed ones.
 *
 * Scoped on purpose: the PBI states the rule applies to Buenos Aires ONLY and
 * must not alter the behaviour of any other multi-airport city (PAR, NYC, SAO,
 * CHI…), so adding a city here is an explicit product decision, never a
 * side effect.
 * @constant {Record<string, string[]>}
 */
export const METRO_CITY_TERMINAL_ORDER = {
  BUE: ['BUE', 'EZE', 'AEP'],
};

/**
 * Promote a resolved city row to its metropolitan aggregate ("all airports").
 *
 * Needed because the IATA code we receive from the outside (an offer card's
 * `Destination`, a POS `ato`) may be a physical terminal — the offers brief
 * ships `EZE` today — while the PBI requires the Booking Box to be filled with
 * "Buenos Aires (todos los aeropuertos)". Verified on nuxqa2: a card carrying
 * EZE landed on "Buenos Aires (EZE)".
 *
 * Fail-safe by construction: any city outside `METRO_CITY_TERMINAL_ORDER`, a
 * missing aggregate row or a malformed pool returns `matched` untouched, so
 * this can never empty a field that would otherwise have been filled.
 *
 * @param {Array<{iataCityCode?: string, iataTerminal?: string}>|null} cities Pool of the match.
 * @param {object|null} matched Row resolved by `findDefaultOriginCity`.
 * @returns {object|null} The aggregate row when it exists, otherwise `matched`.
 */
export const promoteToMetroAggregate = (cities, matched) => {
  const cityCode = matched?.iataCityCode;
  if (!cityCode || !METRO_CITY_TERMINAL_ORDER[cityCode]) return matched;
  if (!Array.isArray(cities)) return matched;
  return cities.find(
    (city) => city.iataCityCode === cityCode && city.iataTerminal === cityCode,
  ) || matched;
};

/**
 * Reorder the airports of a metropolitan city so they are listed aggregate
 * first (PBI 1294884: BUE → EZE → AEP).
 *
 * The catalog order cannot be trusted: the same `consultaCombinabilidad` query
 * returned AEP/EZE/BUE on the Spanish page and BUE/EZE/AEP on the English one,
 * so the required order has to be imposed client-side.
 *
 * Rows are swapped **in place within the positions the city already occupied**
 * instead of being sorted globally: every other city keeps its exact index, and
 * the returned array always has the same length and the same members as the
 * input — the dropdown can never lose an option because of this function.
 *
 * @param {Array<{iataCityCode?: string, iataTerminal?: string}>|null} cities
 * @returns {Array} Same array reference when nothing changes, a reordered copy otherwise.
 */
export const applyMetroPriorityOrder = (cities) => {
  if (!Array.isArray(cities) || cities.length === 0) return cities || [];

  let result = cities;

  Object.entries(METRO_CITY_TERMINAL_ORDER).forEach(([cityCode, terminalOrder]) => {
    const positions = [];
    result.forEach((city, index) => {
      if (city?.iataCityCode === cityCode) positions.push(index);
    });
    if (positions.length < 2) return;

    const rank = (city) => {
      const position = terminalOrder.indexOf(city?.iataTerminal);
      return position === -1 ? terminalOrder.length : position;
    };
    const ordered = positions
      .map((index) => result[index])
      .sort((a, b) => rank(a) - rank(b));

    if (result === cities) result = [...cities];
    positions.forEach((index, slot) => {
      result[index] = ordered[slot];
    });
  });

  return result;
};

export const getDefaultOriginAiata = async () => {
  const pos = getStoredCountry() || 'co';

  // Priority 0: user's explicit manual selection (PBI 1216373 rule 6.5).
  // Survives page reloads within the same tab and is auto-invalidated
  // when the user changes POS (see `readUserOriginSelection`).
  const userSelection = readUserOriginSelection();
  if (userSelection?.originIataCode) return userSelection.originIataCode.toUpperCase();

  // Priority 1: geo-nearest-airport hint (successful triangulation in same POS)
  const nearest = getNearestAirportHint(pos);
  if (nearest) return nearest;

  // Priority 2: countireslist per-POS override (`ato` column), then `mainCity`
  // as final fallback. `ato` lets content authors differentiate the default
  // booking origin from the country's representative main city (e.g. AR may
  // want `ato=EZE` while `mainCity=BUE`).
  const config = await fetchAEMData('countireslist');
  const row = config.data.find((item) => item.pos === pos);
  return String(row?.ato || row?.mainCity || '').toUpperCase();
};

/**
 * Direct APIM path: call APIM and normalize the response shape so the
 * consumer receives the same array that the proxy returns.
 * APIM returns the raw cities array (or { data: [...] } in some shapes);
 * App Builder wraps it as { data: { data: [...] } }.
 */
const fetchCitiesDirect = async ({ originCode = '', destinationCode = '', useCache = false }) => {
  if (useCache && typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) return parsedCache;
      } catch (error) {
        console.warn('Error parsing cached cities:', error);
      }
    }
  }

  try {
    const data = await consultaCombinabilidad({
      idioma: getStoredLanguage() || DEFAULT_LANGUAGE,
      codigoIataOrigen: originCode,
      codigoIataDestino: destinationCode,
    });
    const cities = (Array.isArray(data) && data) || data?.data || [];

    if (useCache && typeof sessionStorage !== 'undefined' && cities.length > 0) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cities));
      } catch (error) {
        console.warn('Error saving cities to cache:', error);
      }
    }
    return cities;
  } catch (error) {
    console.error('Error fetching cities (APIM direct):', error);
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          console.warn('Error parsing fallback cache:', parseError);
        }
      }
    }
    return [];
  }
};

/**
 * Query the available cities from the API.
 * Router: delegates to direct APIM or the proxy based on the AV_APIM_DIRECT_MODE flag.
 *
 * @param {Object} params - Query parameters
 * @param {string} params.originCode - Origin IATA code (e.g. 'BOG')
 * @param {string} params.destinationCode - Destination IATA code (e.g. 'MAD')
 * @param {boolean} params.useCache - Use the sessionStorage cache if present
 * @returns {Promise<Array>} - List of available cities
 */
export const fetchCities = async (params = {}) => {
  const args = { useCache: USE_CACHE, ...params };
  if (await isApimDirectMode()) return fetchCitiesDirect(args);
  return fetchCitiesProxy(args);
};

/**
 * Filter the origin options by excluding the destination city
 *
 * @param {Array} cities - Full list of cities
 * @param {Object | null} destinationCity - Selected destination city
 * @returns {Array} - List of cities without the destination city
 *
 * @example
 * ```javascript
 * const originOptions = filterOriginOptions(allCities, selectedDestination);
 * ```
 */
export const filterOriginOptions = (cities, destinationCity) => {
  if (!destinationCity || !cities || cities.length === 0) {
    return cities || [];
  }

  return cities.filter((city) => city.iataCityCode !== destinationCity.iataCityCode);
};

/**
 * Clear the cities cache
 * Useful to force a data reload
 */
export const clearCitiesCache = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(CACHE_KEY);
  }
};

/**
 * Check whether a cities cache exists
 * @returns {boolean} - true if a cache exists, false otherwise
 */
export const hasCitiesCache = () => {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(CACHE_KEY) !== null;
};
