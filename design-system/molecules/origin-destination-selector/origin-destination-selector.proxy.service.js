/**
 * Proxy implementation of fetchCities — calls the App Builder action `avianca`
 * with `action: 'consultaCombinabilidad'`. Used when AV_APIM_DIRECT_MODE is
 * NOT set to "true". Selectable from the router in
 * `origin-destination-selector.service.js`.
 *
 * This file holds the original implementation extracted verbatim so the proxy
 * path remains rollback-able forever — toggleable via the AV_APIM_DIRECT_MODE flag.
 */

import { getStoredLanguage } from '../../../scripts/services/header/language-country-selector.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';

const CACHE_KEY = 'avianca_cities_cache';
const DEFAULT_LANGUAGE = 'es';

const getEndpointUrl = async () => {
  const config = await fetchAEMData('environment');
  return config.data.find((item) => item.Key === 'AV_BOOKINGBOX_ENDPOINT')?.Text ?? '';
};

// eslint-disable-next-line import/prefer-default-export
export const fetchCitiesProxy = async ({
  originCode = '',
  destinationCode = '',
  useCache = false,
}) => {
  if (useCache && typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          return parsedCache;
        }
      } catch (error) {
        console.warn('Error parsing cached cities:', error);
      }
    }
  }

  const endPoint = await getEndpointUrl();
  if (!endPoint) {
    return [];
  }

  try {
    const response = await fetch(endPoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'consultaCombinabilidad',
        codigoIataOrigen: originCode,
        codigoIataDestino: destinationCode,
        idioma: getStoredLanguage() || DEFAULT_LANGUAGE,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const cities = data?.data?.data || data || [];

    if (useCache && typeof sessionStorage !== 'undefined' && cities.length > 0) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cities));
      } catch (error) {
        console.warn('Error saving cities to cache:', error);
      }
    }

    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);

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
