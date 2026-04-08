/**
 * Hub Destinations Service
 *
 * Service for querying destinations data from local JSON files and AEM GraphQL.
 * Handles sessionStorage cache and normalizes responses.
 */

import { fetchAEMData } from '../../utils/aem-data.js';

const CACHE_KEY_PREFIX = 'avianca_hub_destinations_';
const USE_CACHE = false;

// GraphQL persisted query name. Tied to the AEM Content Fragment schema, not environment.
const ALL_DESTINATIONS_QUERY_NAME = 'getAllDestinations';

let graphqlConfigCache = null;

/**
 * Loads GraphQL config from environment.json (AEM Author).
 * Required env keys:
 *   - AV_API_URL_CONTENT_FRAGMENTS: GraphQL endpoint URL
 *   - AV_NAME_SITE: AEM site name
 * Logs a warning if any key is missing — the subsequent fetch will then fail
 * with a clearer network error visible in the console.
 * @returns {Promise<{ endpoint: string, site: string, queryName: string }>}
 */
const getGraphQLConfig = async () => {
  if (graphqlConfigCache) return graphqlConfigCache;

  const envData = await fetchAEMData('environment');
  const envRows = Array.isArray(envData?.data) ? envData.data : [];
  const readEnv = (key) => envRows.find((item) => item.Key === key)?.Text?.trim() || '';

  const endpoint = readEnv('AV_API_URL_CONTENT_FRAGMENTS');
  const site = readEnv('AV_NAME_SITE');

  if (!endpoint) {
    // eslint-disable-next-line no-console
    console.warn('[hub-destination.service] Missing env var AV_API_URL_CONTENT_FRAGMENTS in environment.json');
  }
  if (!site) {
    // eslint-disable-next-line no-console
    console.warn('[hub-destination.service] Missing env var AV_NAME_SITE in environment.json');
  }

  graphqlConfigCache = {
    endpoint,
    site,
    queryName: ALL_DESTINATIONS_QUERY_NAME,
  };

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
 * Build the JSON endpoint URL.
 * @param {string} dataType - Data type:
 * 'regions', 'destinationbyregions', 'destinationsbyorigin', 'iata'
 * @returns {string} - Full endpoint URL
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
 * Get data from cache or API.
 * @param {string} dataType - Data type to query
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Object>} - Queried data
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

  // Check cache
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

    // Save to cache
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
 * Get available regions.
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Array>} - List of regions
 */
export const fetchRegions = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('regions', useCache);
  return data.data || [];
};

/**
 * Get destinations grouped by region.
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Array>} - List of destinations grouped by region
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
 * Get destinations by origin.
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Array>} - List of destinations by origin
 */
export const fetchDestinationsByOrigin = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('destinationsbyorigin', useCache);
  return data.data || [];
};

/**
 * Get destination countries.
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Array>} - List of destination countries
 */
export const fetchDestinationCountries = async (useCache = USE_CACHE) => {
  const data = await fetchHubDestinationsData('destinationcountries', useCache);
  return data.data || [];
};

/**
 * Get the IATA city catalog from the root spreadsheet (iata.json).
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Array>} - List of cities/IATA codes
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
 * Clear destinations data cache.
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
 * Check whether cache exists for a given data type.
 * @param {string} dataType - Data type to check
 * @returns {boolean} - true if cache exists, false otherwise
 */
export const hasCacheForDataType = (dataType) => {
  if (typeof sessionStorage === 'undefined') return false;
  const cacheKey = `${CACHE_KEY_PREFIX}${dataType}`;
  return sessionStorage.getItem(cacheKey) !== null;
};

/**
 * Get all destinations from AEM GraphQL.
 * @param {boolean} useCache - Whether to use cache when available
 * @returns {Promise<Array>} - List of destinations from Content Fragments
 *
 * @example
 * ```javascript
 * const destinations = await fetchAllDestinationsGraphQL();
 * console.log('Destinations:', destinations);
 * ```
 */
export const fetchAllDestinationsGraphQL = async (useCache = USE_CACHE) => {
  const cacheKey = `${CACHE_KEY_PREFIX}graphql_all_destinations`;

  // Check cache
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

    // Save to cache
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
