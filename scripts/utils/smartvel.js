import { fetchAEMData } from './aem-data.js';

const ENV_ENDPOINT = 'environment';
const API_KEY_NAME = 'AV_SMARTVEL_API_KEY';

let cachedApiKey;

/**
 * Reads the Smartvel widget API key (AV_SMARTVEL_API_KEY) from environment.json.
 * Result is cached in memory after the first call.
 * @returns {Promise<string>} The API key, or '' if not configured.
 */
export async function getSmartvelApiKey() {
  if (cachedApiKey !== undefined) return cachedApiKey;
  const config = await fetchAEMData(ENV_ENDPOINT);
  const rows = Array.isArray(config?.data) ? config.data : [];
  const row = rows.find((item) => item.Key === API_KEY_NAME);
  cachedApiKey = row?.Text?.trim() || '';
  return cachedApiKey;
}

/**
 * Clears the in-memory API key cache. Intended for tests.
 */
export function resetSmartvelApiKeyCache() {
  cachedApiKey = undefined;
}
