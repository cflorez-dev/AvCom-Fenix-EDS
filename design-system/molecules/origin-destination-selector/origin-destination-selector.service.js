/**
 * OriginDestinationSelector Service
 *
 * Servicio para consultar ciudades disponibles desde el API de combinabilidad.
 * Maneja cache en sessionStorage y filtrado de opciones.
 *
 * `fetchCities` opera como router: lee el feature flag `AV_APIM_DIRECT_MODE`
 * y delega a uno de dos paths — APIM directo (nuevo) o proxy App Builder
 * (extraído a `origin-destination-selector.proxy.service.js`). Ambos paths
 * conviven indefinidamente: el flag se cambia desde AEM Author sin redeploy.
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
 * Resolver el destino al cambiar el origen (PBI CU-189 CA4 regla 3):
 * si el usuario modifica un origen distinto al actual y ya tenía un destino
 * elegido, el destino se limpia para recalcularse con los destinos
 * disponibles desde el nuevo origen.
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
 * `iataTerminal` (the physical airport, e.g. EZE, CDG, JFK). We match city
 * code first — the conventional contract — and fall back to terminal so that
 * authors may pin the default to a specific airport in multi-terminal cities
 * (e.g. `ato=EZE` for Argentina to force Ezeiza over Aeroparque). Same logic
 * also makes the code tolerant when the `countireslist` row accidentally
 * stores a terminal code: we still resolve a valid origin instead of leaving
 * the Booking Box empty.
 * @param {Array<{iataCityCode?: string, iataTerminal?: string}>|null} cities
 * @param {string|null} ato IATA code (city or terminal)
 * @returns {object|null} The matched city entry, or null.
 */
export const findDefaultOriginCity = (cities, ato) => {
  if (!ato || !Array.isArray(cities) || cities.length === 0) return null;
  return cities.find((city) => city.iataCityCode === ato)
    || cities.find((city) => city.iataTerminal === ato)
    || null;
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
 * App Builder wrappea con { data: { data: [...] } }.
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
 * Consultar ciudades disponibles desde el API.
 * Router: delega a APIM directo o al proxy según el flag AV_APIM_DIRECT_MODE.
 *
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.originCode - Código IATA de origen (ej: 'BOG')
 * @param {string} params.destinationCode - Código IATA de destino (ej: 'MAD')
 * @param {boolean} params.useCache - Usar cache de sessionStorage si existe
 * @returns {Promise<Array>} - Lista de ciudades disponibles
 */
export const fetchCities = async (params = {}) => {
  const args = { useCache: USE_CACHE, ...params };
  if (await isApimDirectMode()) return fetchCitiesDirect(args);
  return fetchCitiesProxy(args);
};

/**
 * Filtrar opciones de origen excluyendo la ciudad de destino
 *
 * @param {Array} cities - Lista completa de ciudades
 * @param {Object | null} destinationCity - Ciudad de destino seleccionada
 * @returns {Array} - Lista de ciudades sin la ciudad de destino
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
 * Limpiar cache de ciudades
 * Útil para forzar recarga de datos
 */
export const clearCitiesCache = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(CACHE_KEY);
  }
};

/**
 * Verificar si existe cache de ciudades
 * @returns {boolean} - true si existe cache, false en caso contrario
 */
export const hasCitiesCache = () => {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(CACHE_KEY) !== null;
};
