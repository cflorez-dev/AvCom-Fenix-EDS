/**
 * OriginDestinationSelector Service
 *
 * Servicio para consultar ciudades disponibles desde el API de combinabilidad.
 * Maneja cache en sessionStorage y filtrado de opciones.
 */

import { getStoredLanguage, getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';

// Constants
const CACHE_KEY = 'avianca_cities_cache';
const DEFAULT_LANGUAGE = 'es';
const USE_CACHE = false;

const getEndpointUrl = async () => {
  const config = await fetchAEMData('environment');
  return config.data.find((item) => item.Key === 'AV_BOOKINGBOX_ENDPOINT')?.Text ?? '';
};

export const getDefaultOriginAiata = async () => {
  const config = await fetchAEMData('countireslist');
  const pos = getStoredCountry() || 'co';
  return config.data.find((item) => item.pos === pos)?.mainCity ?? '';
};

/**
 * Consultar ciudades disponibles desde el API
 *
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.originCode - Código IATA de origen (ej: 'BOG')
 * @param {string} params.destinationCode - Código IATA de destino (ej: 'MAD')
 * @param {boolean} params.useCache - The request must use cache if available (default: true)
 * @returns {Promise<Array>} - Lista de ciudades disponibles
 *
 * @example
 * ```javascript
 * const cities = await fetchCities({
 *   originCode: 'BOG',
 *   destinationCode: 'MAD'
 * });
 * ```
 */
export const fetchCities = async ({
  originCode = '',
  destinationCode = '',
  useCache = USE_CACHE,
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
    return {};
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

    // Fallback: intentar retornar cache aunque sea expirado
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

    // Si todo falla, retornar array vacío
    return [];
  }
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
