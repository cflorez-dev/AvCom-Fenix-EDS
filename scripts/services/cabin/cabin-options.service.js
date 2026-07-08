import { parametroCabinas } from '../apim/apim-client.service.js';

const DEFAULT_LANGUAGE = 'es';

/**
 * Fetches the cabin options from APIM (parametroCabinas).
 * Returns the raw service array [{ id, value }] localized by language,
 * or [] on any error / empty response (caller hides the section).
 * @param {string} language ISO code (es|en|fr|pt)
 * @returns {Promise<Array<{id:string, value:string}>>}
 */
export const fetchCabinOptions = async (language = DEFAULT_LANGUAGE) => {
  try {
    const data = await parametroCabinas({ idioma: language || DEFAULT_LANGUAGE });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[cabin-options] Error fetching parametroCabinas:', error);
    return [];
  }
};

/**
 * Resolves the global Booking Box cabin kill-switch from the environment spreadsheet.
 * Fail-safe: only an exact "true" enables it; missing key / bad input → false.
 * @param {Array<{Key:string, Text:string}>} envData environment.json `data` array
 * @returns {boolean}
 */
export const isBookingBoxCabinEnabled = (envData) => (Array.isArray(envData)
  ? envData.find((item) => item?.Key?.trim() === 'AV_BOOKINGBOX_CABIN_ENABLED')
    ?.Text?.trim() === 'true'
  : false);
