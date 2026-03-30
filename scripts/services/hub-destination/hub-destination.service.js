/**
 * Hub Destinations Service
 *
 * Servicio para consultar datos de destinos desde archivos JSON locales y GraphQL de AEM.
 * Maneja cache en sessionStorage y normaliza respuestas.
 */

import { fetchAEMData } from '../../utils/aem-data.js';

const CACHE_KEY_PREFIX = 'avianca_hub_destinations_';
const USE_CACHE = false;
const DEFAULT_GRAPHQL_CONFIG = {
  endpoint: 'https://73963-aemintegrations-development.adobeioruntime.net/api/v1/web/avianca-appbuilder/avianca',
  site: 'Avianca-home-site',
  queryName: 'getAllDestinations',
};
let graphqlConfigCache = null;

/**
 * Obtiene el primer valor válido de environment.json para una lista de claves
 * @param {Array} envRows - Filas de configuración
 * @param {Array<string>} keys - Lista de llaves a revisar en orden
 * @param {string} fallback - Valor por defecto
 * @returns {string}
 */
const getFirstEnvValue = (envRows, keys, fallback = '') => {
  for (let i = 0; i < keys.length; i += 1) {
    const value = envRows.find((item) => item.Key === keys[i])?.Text;
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
};

/**
 * Carga configuración GraphQL desde environment.json
 * @returns {Promise<Object>}
 */
const getGraphQLConfig = async () => {
  if (graphqlConfigCache) return graphqlConfigCache;

  try {
    const envData = await fetchAEMData('environment');
    const envRows = Array.isArray(envData?.data) ? envData.data : [];

    graphqlConfigCache = {
      endpoint: getFirstEnvValue(
        envRows,
        ['AV_GRAPHQL_DESTINATIONS_ENDPOINT', 'AV_API_URL_CONTENT_FRAGMENTS'],
        DEFAULT_GRAPHQL_CONFIG.endpoint,
      ),
      site: getFirstEnvValue(
        envRows,
        ['AV_NAME_SITE'],
        DEFAULT_GRAPHQL_CONFIG.site,
      ),
      queryName: getFirstEnvValue(
        envRows,
        ['AV_QUERY_NAME_ALL_DESTINATIONS', 'AV_QUERY_NAME_DESTINATIONS'],
        DEFAULT_GRAPHQL_CONFIG.queryName,
      ),
    };
  } catch (error) {
    graphqlConfigCache = { ...DEFAULT_GRAPHQL_CONFIG };
  }

  return graphqlConfigCache;
};

const extractDestinationsFromResponse = (result) => {
  const payload = result?.data?.data || result?.data || result;

  if (Array.isArray(payload?.destinationList?.items)) {
    return payload.destinationList.items;
  }

  if (Array.isArray(payload?.allDestinationsList?.items)) {
    return payload.allDestinationsList.items;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    let errorDetails = '';
    try {
      const errorText = await response.text();
      if (errorText) errorDetails = ` ${errorText}`;
    } catch (error) {
      // No-op: if body can't be read, keep base HTTP error only
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText || ''}${errorDetails}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON but received ${contentType || 'unknown content-type'}`);
  }

  return response.json();
};

/**
 * Construir la URL del endpoint JSON
 * @param {string} dataType - Tipo de dato:
 * 'regions', 'destinationbyregions', 'destinationsbyorigin', 'iata'
 * @returns {string} - URL completa del endpoint
 */
const buildEndpointUrl = (dataType) => {
  const endpoints = {
    regions: `/regions.json`,
    destinationbyregions: `/destinationbyregions.json`,
    destinationsbyorigin: `/destinationsbyorigin.json`,
    destinationcountries: `/destinationcountries.json`,
    iata: '/iata.json',
  };
  return endpoints[dataType] || '';
};

/**
 * Obtener datos desde cache o API
 * @param {string} dataType - Tipo de dato a consultar
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Object>} - Datos consultados
 *
 * @example
 * ```javascript
 * const regions = await fetchHubDestinationsData('regions');
 * const destinations = await fetchHubDestinationsData('destinationbyregions');
 * const originDestinations = await fetchHubDestinationsData('destinationsbyorigin');
 * ```
 */
export const fetchHubDestinationsData = async (dataType, useCache = USE_CACHE) => {
  const cacheKey = `${CACHE_KEY_PREFIX}${dataType}`;

  // Verificar cache
  if (useCache && typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const url = buildEndpointUrl(dataType);
  if (!url) {
    console.error(`[hub-destination.service] Unknown dataType: ${dataType}`);
    return {};
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Guardar en cache
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error(`[hub-destination.service] Error fetching ${dataType}:`, error);
    return {};
  }
};

/**
 * Obtener regiones disponibles
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Array>} - Lista de regiones
 */
export const fetchRegions = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('regions', useCache);
  return data.data || [];
};

/**
 * Obtener destinos por regiones
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Array>} - Lista de destinos agrupados por región
 */
export const fetchDestinationsByRegions = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('destinationbyregions', useCache);
  data.data.push({
    "Regions": "Region South America",
    "Category": "City",
    "Name": "Buenos Aires",
    "IataCityCode": "EZE"
})
data.data.push({
    "Regions": "Region South America",
    "Category": "City",
    "Name": "Buenos Aires",
    "IataCityCode": "AEP"
})
  return data.data || [];
};

/**
 * Obtener destinos por origen
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Array>} - Lista de destinos por origen
 */
export const fetchDestinationsByOrigin = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('destinationsbyorigin', useCache);
  return data.data || [];
};

/**
 * Obtener países de destino
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Array>} - Lista de países de destino
 */
export const fetchDestinationCountries = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('destinationcountries', useCache);
  return data.data || [];
};

/**
 * Obtener catálogo de ciudades IATA desde spreadsheet raíz (iata.json)
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Array>} - Lista de ciudades/códigos IATA
 */
export const fetchIata = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('iata', useCache);
  return data.data || [];
};

export const getCitiesByPos= async (country) => {
  const iataData = await fetchIata();
  if (!iataData || iataData.length === 0) return [];
  const citiesByPos = iataData.filter((item) => item.pais === country.toUpperCase());
  return citiesByPos
}

/**
 * Limpiar cache de datos de destinos
 */
export const clearHubDestinationsCache = () => {
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

/**
 * Verificar si existe cache para un tipo de dato
 * @param {string} dataType - Tipo de dato a verificar
 * @returns {boolean} - true si existe cache, false en caso contrario
 */
export const hasCacheForDataType = (dataType) => {
  if (typeof sessionStorage === 'undefined') return false;
  const cacheKey = `${CACHE_KEY_PREFIX}${dataType}`;
  return sessionStorage.getItem(cacheKey) !== null;
};

/**
 * Obtener todos los destinos desde AEM GraphQL
 * @param {boolean} useCache - Usar cache si está disponible
 * @returns {Promise<Array>} - Lista de destinos desde Content Fragments
 *
 * @example
 * ```javascript
 * const destinations = await fetchAllDestinationsGraphQL();
 * console.log('Destinations:', destinations);
 * ```
 */
export const fetchAllDestinationsGraphQL = async (useCache = USE_CACHE) => {
  const cacheKey = `${CACHE_KEY_PREFIX}graphql_all_destinations`;

  // Verificar cache
  if (useCache && typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        console.warn('[hub-destination.service] Error parsing cached GraphQL data:', error);
      }
    }
  }

  try {
    const config = await getGraphQLConfig();
    const result = await fetchJson(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getContentFragments',
        site: config.site,
        query: config.queryName,
        bypassCache: !useCache,
      }),
    });

    const destinations = extractDestinationsFromResponse(result);

    // Guardar en cache
    if (useCache && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(destinations));
      } catch (error) {
        console.warn('[hub-destination.service] Error saving GraphQL data to cache:', error);
      }
    }

    return destinations;
  } catch (error) {
    console.error('[hub-destination.service] Error fetching GraphQL destinations:', error);
    return [];
  }
};
