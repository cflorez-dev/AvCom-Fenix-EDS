import { fetchAEMData } from './aem-data.js';

const ENV_ENDPOINT = 'environment';
const BASE_KEY = 'AV_AIRMARKETING_EMBED_BASE';
const SEARCHBAR_KEY = 'AV_SEARCHBAR_API_KEY';
const DESTINATION_CARDS_KEY = 'AV_DESTINATION_CARDS_API_KEY';

let cachedConfig;

/**
 * Reads the AirMarketing embed config (base URL + widget GUIDs) from environment.json.
 * Cached in memory after the first call. Missing values resolve to ''.
 * @returns {Promise<{baseUrl: string, searchbarApiKey: string, destinationCardsApiKey: string}>}
 */
export async function getAirMarketingConfig() {
  if (cachedConfig) return cachedConfig;
  const config = await fetchAEMData(ENV_ENDPOINT);
  const rows = Array.isArray(config?.data) ? config.data : [];
  const read = (key) => rows.find((item) => item.Key === key)?.Text?.trim() || '';
  const result = {
    baseUrl: read(BASE_KEY).replace(/\/+$/, ''),
    searchbarApiKey: read(SEARCHBAR_KEY),
    destinationCardsApiKey: read(DESTINATION_CARDS_KEY),
  };
  if (result.baseUrl || result.searchbarApiKey || result.destinationCardsApiKey) {
    cachedConfig = result;
  }
  return result;
}

/**
 * Warms up DNS + TLS for the AirMarketing host. Idempotent; no-op when baseUrl is empty.
 * @param {string} baseUrl
 */
export function preconnectAirMarketing(baseUrl) {
  if (!baseUrl) return;
  if (document.querySelector(`link[rel="preconnect"][href="${baseUrl}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = baseUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * Loads an AirMarketing embed module script once. The custom element it defines
 * auto-upgrades every instance on the page, so a single load covers all blocks.
 * @param {string} scriptUrl
 */
export function loadAirMarketingEmbed(scriptUrl) {
  if (document.querySelector(`script[src="${scriptUrl}"]`)) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = scriptUrl;
  document.body.appendChild(script);
}

/**
 * Clears the in-memory config cache. Intended for tests.
 */
export function resetAirMarketingConfigCache() {
  cachedConfig = undefined;
}
