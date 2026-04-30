/**
 * Proxy implementation of getCheapestPrices / getCheapestPricesOutbound —
 * calls the App Builder action `avianca` with the corresponding `action` field.
 * Used when AV_APIM_DIRECT_MODE is NOT "true". Selectable from the router in
 * `date-range-picker.service.js`.
 *
 * This file holds the original implementation extracted verbatim so the proxy
 * path remains rollback-able forever — toggleable via the AV_APIM_DIRECT_MODE flag.
 */

import { getStoredCountry } from '../../../scripts/services/header/language-country-selector.js';
import { fetchAEMData } from '../../../scripts/utils/aem-data.js';

const CACHE_PREFIX = 'avianca_pricing';
const CACHE_DURATION = 30 * 60 * 1000;

const getEndpointUrl = async () => {
  const config = await fetchAEMData('environment');
  return config.data.find((item) => item.Key === 'AV_BOOKINGBOX_ENDPOINT')?.Text ?? '';
};

const getCacheKey = (tripType, origin, destination, year, month, outboundDate = null) => {
  const baseKey = `${CACHE_PREFIX}_${tripType}_${origin}_${destination}_${year}_${month}`;
  return outboundDate ? `${baseKey}_${outboundDate}` : baseKey;
};

const getFromCache = (cacheKey) => {
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

const saveToCache = (cacheKey, data) => {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

const formatDateKey = (dateString) => dateString.split('T')[0];
const formatDateCompact = (dateString) => dateString.replace(/-/g, '');

export const getCheapestPricesProxy = async ({
  origin,
  destination,
  year,
  month,
  tripType = 'RT',
}) => {
  if (!origin || !destination || year == null || month == null) {
    throw new Error('Missing required parameters: origin, destination, year, month');
  }

  const cacheKey = getCacheKey(tripType, origin, destination, year, month);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const endPoint = await getEndpointUrl();
  if (!endPoint) return {};

  try {
    const response = await fetch(endPoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getCheapestPrices',
        originCityCode: origin,
        destinationCityCode: destination,
        year,
        month: month + 1,
        tripType,
        pos: getStoredCountry() || 'CO',
      }),
    });
    if (!response.ok) throw new Error(`Pricing API error: ${response.status}`);

    const data = await response.json();
    if (!data?.success) return {};

    const daysPrices = data.data.journeyPrices?.[0]?.daysPrices || {};
    const normalized = {};
    if (!daysPrices.length) return {};
    daysPrices.forEach((dayPrice) => {
      normalized[formatDateKey(dayPrice.date)] = dayPrice;
    });

    saveToCache(cacheKey, normalized);
    return normalized;
  } catch (error) {
    console.error('Error fetching cheapest prices:', error);
    return {};
  }
};

export const getCheapestPricesOutboundProxy = async ({
  origin,
  destination,
  outboundDate,
  year,
  month,
}) => {
  if (!origin || !destination || !outboundDate || year == null || month == null) {
    throw new Error('Missing required parameters: origin, destination, outboundDate, year, month');
  }

  const cacheKey = getCacheKey('RT', origin, destination, year, month, outboundDate);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const endPoint = await getEndpointUrl();
  if (!endPoint) return {};

  try {
    const response = await fetch(endPoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getCheapestPricesOutbound',
        originCityCode: origin,
        destinationCityCode: destination,
        pos: getStoredCountry() || 'CO',
        outboundDate: formatDateCompact(outboundDate),
        year,
        month: month + 1,
        tripType: 'RT',
      }),
    });
    if (!response.ok) throw new Error(`Pricing API error: ${response.status}`);

    const data = await response.json();
    if (!data?.success) return {};

    const daysPrices = data.data?.daysPrices || {};
    if (!daysPrices.length) return {};

    const normalized = {};
    daysPrices.forEach((dayPrice) => {
      normalized[formatDateKey(dayPrice.date)] = dayPrice;
    });

    saveToCache(cacheKey, normalized);
    return normalized;
  } catch (error) {
    console.error('Error fetching return prices:', error);
    return {};
  }
};
