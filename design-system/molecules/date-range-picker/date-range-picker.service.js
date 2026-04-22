/**
 * DateRangePicker Service
 *
 * Servicio para gestión de pricing, validación de fechas y formateo.
 * Incluye cache en sessionStorage y lógica de categorización de precios.
 */

import { getStoredLanguage, getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';

// ========== CONSTANTES ==========

/**
 * Máximo de días reservables desde hoy
 * @constant {number}
 */
export const MAX_BOOKING_DAYS = 355;

/**
 * Endpoint del servicio de pricing
 * @constant {string}
 */

/**
 * Cache key prefix para sessionStorage
 * @constant {string}
 */
const CACHE_PREFIX = 'avianca_pricing';

/**
 * Duración del cache en milisegundos (30 minutos)
 * @constant {number}
 */
const CACHE_DURATION = 30 * 60 * 1000;

const getEndpointUrl = async () => {
  const config = await fetchAEMData('environment');
  return config.data.find((item) => item.Key === 'AV_BOOKINGBOX_ENDPOINT')?.Text ?? '';
};

// ========== HELPERS DE FECHAS ==========

/**
 * Obtiene la fecha actual normalizada (00:00:00)
 * @returns {Date} Fecha actual sin horas
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Calcula la fecha máxima reservable (hoy + MAX_BOOKING_DAYS días)
 * @returns {Date} Fecha máxima reservable
 */
export function getMaxBookingDate() {
  const maxDate = getToday();
  maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS);
  return maxDate;
}

/**
 * Retorna la constante MAX_BOOKING_DAYS (para exportar)
 * @returns {number} Número de días máximos reservables
 */
export function getMaxBookingDays() {
  return MAX_BOOKING_DAYS;
}

/**
 * Normaliza una fecha a medianoche (00:00:00)
 * @param {Date} date - Fecha a normalizar
 * @returns {Date} Fecha normalizada
 */
export function normalizeDate(date) {
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Compara si dos fechas son el mismo día
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} True si son el mismo día
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;

  return (
    date1?.getFullYear?.() === date2?.getFullYear?.()
    && date1.getMonth() === date2.getMonth()
    && date1.getDate() === date2.getDate()
  );
}

/**
 * Verifica si date1 es anterior a date2
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} True si date1 < date2
 */
export function isBefore(date1, date2) {
  if (!date1 || !date2) return false;
  return normalizeDate(date1) < normalizeDate(date2);
}

/**
 * Verifica si date1 es posterior a date2
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} True si date1 > date2
 */
export function isAfter(date1, date2) {
  if (!date1 || !date2) return false;
  return normalizeDate(date1) > normalizeDate(date2);
}

/**
 * Verifica si una fecha está dentro de un rango
 * @param {Date} date - Fecha a verificar
 * @param {Date} start - Fecha de inicio del rango
 * @param {Date} end - Fecha de fin del rango
 * @returns {boolean} True si está en el rango
 */
export function isInRange(date, start, end) {
  if (!date || !start || !end) return false;

  const normalized = normalizeDate(date);
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);

  return normalized >= normalizedStart && normalized <= normalizedEnd;
}

/**
 * Calcula array de meses desde hoy hasta maxDate para mobile scroll
 * @returns {Array<{year: number, month: number}>} Array de objetos {year, month}
 */
export function getMonthsToRender() {
  const today = getToday();
  const maxDate = getMaxBookingDate();

  const months = [];
  const current = new Date(today);
  current.setDate(1); // Primer día del mes actual

  while (current <= maxDate) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth(),
    });

    // Siguiente mes
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

// ========== FORMATEO DE FECHAS ==========

/**
 * Formatea una fecha según el idioma del usuario
 * @param {Date} date - Fecha a formatear
 * @param {string} format - Formato ('short' | 'long' | 'weekday' | 'numeric')
 * @returns {string} Fecha formateada
 *
 * @example
 * formatDate(new Date('2026-01-15'), 'short') // 'Lun 15 Ene'
 * formatDate(new Date('2026-01-15'), 'long') // 'Lunes 15 Enero 2026'
 * formatDate(new Date('2026-01-15'), 'numeric') // '15/01/2026'
 */
export function formatDate(date, format = 'numeric') {
  if (!date) return '';

  const locale = getStoredLanguage() || 'es-CO';

  const options = {
    short: {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    },
    long: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    weekday: {
      weekday: 'short',
    },
    numeric: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  };

  return new Intl.DateTimeFormat(locale, options[format]).format(date);
}

/**
 * Formatea un rango de fechas
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin (opcional)
 * @returns {string} Rango formateado
 *
 * @example
 * formatDateRange(new Date('2026-01-15'), new Date('2026-01-20'))
 * // 'Lun 15 Ene - Vie 20 Ene 2026'
 */
export function formatDateRange(startDate, endDate = null) {
  if (!startDate) return '';

  if (!endDate) {
    return `${formatDate(startDate, 'short')} ${startDate.getFullYear()}`;
  }

  const sameMonth = startDate.getMonth() === endDate.getMonth()
    && startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')} ${endDate.getFullYear()}`;
  }

  return `${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')} ${endDate.getFullYear()}`;
}

// ========== VALIDACIÓN DE FECHAS ==========

/**
 * Valida si una fecha puede ser seleccionada
 * @param {Date} dateToCheck - Fecha a validar
 * @param {Object} options - Opciones de validación
 * @param {Date} options.minDate - Fecha mínima permitida (opcional)
 * @param {Date} options.maxDate - Fecha máxima permitida (opcional)
 * @param {Array<string>} options.disabledDates - Fechas deshabilitadas desde CMS (ISO strings)
 * @returns {boolean} True si la fecha está deshabilitada
 */
export function isDateDisabled(dateToCheck, options = {}) {
  if (!dateToCheck) return true;

  const {
    minDate = null,
    maxDate = getMaxBookingDate(),
    disabledDates = [],
  } = options;

  const today = getToday();
  const normalizedDate = normalizeDate(dateToCheck);

  // 1. Fechas pasadas (antes de hoy) están deshabilitadas
  if (normalizedDate < today) {
    return true;
  }

  // 2. Fechas futuras más allá de MAX_BOOKING_DAYS están deshabilitadas
  if (normalizedDate > maxDate) {
    return true;
  }

  // 3. Fechas antes de minDate están deshabilitadas (para return date >= departure)
  if (minDate) {
    const normalizedMinDate = normalizeDate(minDate);
    if (normalizedDate < normalizedMinDate) {
      return true;
    }
  }

  // 4. Fechas deshabilitadas desde CMS
  if (disabledDates && disabledDates.length > 0) {
    return disabledDates.some((dateStr) => {
      const disabledDate = new Date(dateStr);
      return isSameDay(disabledDate, normalizedDate);
    });
  }

  return false;
}

// ========== CACHE MANAGEMENT ==========

/**
 * Genera cache key para pricing
 * @param {string} tripType - 'RT' | 'OW'
 * @param {string} origin - Código IATA origen
 * @param {string} destination - Código IATA destino
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @param {string} outboundDate - Fecha ida (ISO string, opcional para return)
 * @returns {string} Cache key
 */
function getCacheKey(tripType, origin, destination, year, month, outboundDate = null) {
  const baseKey = `${CACHE_PREFIX}_${tripType}_${origin}_${destination}_${year}_${month}`;
  return outboundDate ? `${baseKey}_${outboundDate}` : baseKey;
}

/**
 * Obtiene datos del cache si están vigentes
 * @param {string} cacheKey - Key del cache
 * @returns {Object|null} Datos cacheados o null
 */
function getFromCache(cacheKey) {
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Verificar si cache expiró
    if (now - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

/**
 * Guarda datos en cache
 * @param {string} cacheKey - Key del cache
 * @param {Object} data - Datos a cachear
 */
function saveToCache(cacheKey, data) {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Limpia cache de pricing (útil para testing)
 */
export function clearPricingCache() {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

function formatDateKey(dateString) {
  return dateString.split('T')[0];
}

function formatDateCompact(dateString) {
  return dateString.replace(/-/g, '');
}

// ========== PRICING API ==========

/**
 * Fetch de precios más baratos para vuelos de ida (RT o OW)
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.origin - Código IATA origen
 * @param {string} params.destination - Código IATA destino
 * @param {number} params.year - Año
 * @param {number} params.month - Mes (0-11)
 * @param {string} params.tripType - 'RT' | 'OW'
 * @returns {Promise<Object>} Objeto con pricing por fecha
 *
 * @example
 * const prices = await getCheapestPrices({
 *   origin: 'BOG',
 *   destination: 'MAD',
 *   year: 2026,
 *   month: 0, // Enero
 *   tripType: 'RT',
 * });
 * // { '2026-01-15': 450000, '2026-01-16': 500000, ... }
 */
export async function getCheapestPrices({
  origin,
  destination,
  year,
  month,
  tripType = 'RT',
}) {
  // Validar params
  if (!origin || !destination || year == null || month == null) {
    throw new Error('Missing required parameters: origin, destination, year, month');
  }

  // Check cache
  const cacheKey = getCacheKey(tripType, origin, destination, year, month);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
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
        action: 'getCheapestPrices',
        originCityCode: origin,
        destinationCityCode: destination,
        year,
        month: month + 1, // API espera 1-12
        tripType,
        pos: getStoredCountry() || 'CO',
      }),
    });

    if (!response.ok) {
      throw new Error(`Pricing API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.success) {
      return {};
    }

    const daysPrices = data.data.journeyPrices?.[0]?.daysPrices || {};
    // Normalizar data: { 'YYYY-MM-DD': price }
    const normalized = {};
    if (!daysPrices.length) {
      return {};
    }
    daysPrices.forEach((dayPrice) => {
      normalized[formatDateKey(dayPrice.date)] = dayPrice;
    });

    // Save to cache
    saveToCache(cacheKey, normalized);

    return normalized;
  } catch (error) {
    console.error('Error fetching cheapest prices:', error);
    return {};
  }
}

/**
 * Fetch de precios de vuelos de regreso (solo para RT)
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.origin - Código IATA origen
 * @param {string} params.destination - Código IATA destino
 * @param {string} params.outboundDate - Fecha ida (ISO string YYYY-MM-DD)
 * @param {number} params.year - Año del mes de regreso
 * @param {number} params.month - Mes de regreso (0-11)
 * @returns {Promise<Object>} Objeto con pricing por fecha
 */
export async function getCheapestPricesOutbound({
  origin,
  destination,
  outboundDate,
  year,
  month,
}) {
  // Validar params
  if (!origin || !destination || !outboundDate || year == null || month == null) {
    throw new Error('Missing required parameters: origin, destination, outboundDate, year, month');
  }

  // Check cache
  const cacheKey = getCacheKey('RT', origin, destination, year, month, outboundDate);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
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
        action: 'getCheapestPricesOutbound',
        originCityCode: origin,
        destinationCityCode: destination,
        pos: getStoredCountry() || 'CO',
        outboundDate: formatDateCompact(outboundDate),
        year,
        month: month + 1, // API espera 1-12
        tripType: 'RT',
      }),
    });

    if (!response.ok) {
      throw new Error(`Pricing API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.success) {
      return {};
    }

    const daysPrices = data.data?.daysPrices || {};
    if (!daysPrices.length) {
      return {};
    }
    // Normalizar data: { 'YYYY-MM-DD': price }
    const normalized = {};
    daysPrices.forEach((dayPrice) => {
      normalized[formatDateKey(dayPrice.date)] = dayPrice;
    });

    // Save to cache
    saveToCache(cacheKey, normalized);

    return normalized;
  } catch (error) {
    console.error('Error fetching return prices:', error);
    return {};
  }
}

/**
 * Obtiene el color del indicador de precio según categoría
 * @param {'low'|'medium'|'high'|null} category - Categoría de precio
 * @returns {string} Color CSS variable
 */
export function getPricingColor(category) {
  const colors = {
    low: 'var(--price-indicator-low)',
    medium: 'var(--price-indicator-medium)',
    high: 'var(--price-indicator-high)',
  };

  return colors[category] || 'transparent';
}

// ========== EXPORTACIONES ==========

export default {
  // Constantes
  MAX_BOOKING_DAYS,

  // Helpers de fechas
  getToday,
  getMaxBookingDate,
  getMaxBookingDays,
  normalizeDate,
  isSameDay,
  isBefore,
  isAfter,
  isInRange,
  getMonthsToRender,

  // Formateo
  formatDate,
  formatDateRange,

  // Validación
  isDateDisabled,

  // Cache
  clearPricingCache,

  // Pricing API
  getCheapestPrices,
  getCheapestPricesOutbound,

  // Categorización
  getPricingColor,
};
