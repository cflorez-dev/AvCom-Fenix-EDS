/**
 * Proxy implementation of the airport catalog fetch — calls the App Builder
 * action `avianca` with `action: 'consultaCombinabilidad'`. Used when
 * AV_APIM_DIRECT_MODE is NOT set to "true". Selectable from the router in
 * `triangulation.service.js`.
 *
 * This file holds the original implementation extracted verbatim so the proxy
 * path remains rollback-able forever — toggleable via the AV_APIM_DIRECT_MODE flag.
 */

import { fetchAEMData } from '../../utils/aem-data.js';

const ENDPOINT_ENV_KEY = 'AV_BOOKINGBOX_ENDPOINT';

const resolveEndpoint = async () => {
  const config = await fetchAEMData('environment');
  return config?.data?.find((item) => item.Key === ENDPOINT_ENV_KEY)?.Text ?? '';
};

/**
 * Returns the raw airports array (before normalization), or [] on failure.
 * The caller is responsible for normalization and caching.
 * @param {{language: string}} args
 */
// eslint-disable-next-line import/prefer-default-export
export const fetchAirportsRawProxy = async ({ language }) => {
  const endpoint = await resolveEndpoint();
  if (!endpoint) {
    console.warn('[triangulation.service] missing AV_BOOKINGBOX_ENDPOINT');
    return [];
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'consultaCombinabilidad',
        codigoIataOrigen: '',
        codigoIataDestino: '',
        idioma: language,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    return payload?.data?.data || payload?.data || [];
  } catch (error) {
    console.warn('[triangulation.service] catalog fetch failed (proxy):', error);
    return [];
  }
};
