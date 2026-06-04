import { fetchAEMData } from '../../utils/aem-data.js';
import { loadCSS, loadScript } from '../../aem.js';

const FLAG_KEY = 'AV_CENTRIBAL_CHAT_ENABLED';
const CENTRIBAL_ORIGIN = 'https://avianca-help.centribal.com';

let enabledCache = null;
let loaded = false;

/**
 * Reads the AV_CENTRIBAL_CHAT_ENABLED flag from the AEM Configuration Service
 * (/environment.json), mirroring the apim-mode.js pattern. A `?chat=on|off`
 * query param overrides the flag for QA without touching configuration.
 * @returns {Promise<boolean>}
 */
export const isCentribalChatEnabled = async () => {
  const { search } = window.location;
  if (search.includes('chat=off')) return false;
  if (search.includes('chat=on')) return true;
  if (enabledCache !== null) return enabledCache;
  const config = await fetchAEMData('environment');
  const rows = Array.isArray(config?.data) ? config.data : [];
  const value = rows.find((r) => r?.Key?.trim?.() === FLAG_KEY)?.Text?.trim?.();
  enabledCache = value === 'true';
  return enabledCache;
};

export const resetCentribalChatCache = () => {
  enabledCache = null;
};

/**
 * Loads the Centribal chatbot widget (CSS + JS) when the feature flag is on.
 *
 * Moved out of head.html so its two requests (CSS + JS, ~12 KB) no longer block
 * the critical path. The widget bootstraps itself via `window.onload = ...`;
 * because this runs in the delayed phase (after the `load` event already
 * fired), it depends on the window.onload safety net installed in scripts.js
 * (loadEager) to still fire that handler. The injected script keeps nonce="aem"
 * to match the previous head.html tag.
 * @returns {Promise<void>}
 */
export const loadCentribalChat = async () => {
  if (loaded) return;
  if (!(await isCentribalChatEnabled())) return;
  loaded = true;
  loadCSS(`${CENTRIBAL_ORIGIN}/api/v1/recaptcha-css/`);
  await loadScript(`${CENTRIBAL_ORIGIN}/api/v1/recaptcha-jsx/`, { nonce: 'aem' });
};
