/**
 * Fetches data from AEM endpoints with caching.
 * @param {string} endpoint - Path to the AEM endpoint (e.g., 'briefofertas')
 * @param {Object} [options] - Optional configuration
 * @param {boolean} [options.useCache=true] - Whether to use cached data
 * @returns {Promise<Object>} A promise that resolves with the endpoint data
 */
export async function fetchAEMData(endpoint, options = {}) {
  const { useCache = true } = options;
  const rootPath = window.location.origin;

  // Initialize cache
  window.aemDataCache = window.aemDataCache || {};
  window.aemDataCache.pending = window.aemDataCache.pending || {};

  // Build URL - add .json extension if not present
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${rootPath}/${cleanEndpoint}${cleanEndpoint.endsWith('.json') ? '' : '.json'}`;

  // Return cached data if available
  if (useCache && window.aemDataCache[endpoint]) {
    return Promise.resolve(window.aemDataCache[endpoint]);
  }

  // Return pending request if it exists
  if (window.aemDataCache.pending[endpoint]) {
    return window.aemDataCache.pending[endpoint];
  }

  // Create new fetch promise
  const fetchPromise = fetch(url)
    .then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        window.aemDataCache[endpoint] = data;
        return data;
      }
      throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
    })
    .catch(() => ({ data: [] }))
    .finally(() => {
      delete window.aemDataCache.pending[endpoint];
    });

  window.aemDataCache.pending[endpoint] = fetchPromise;
  return fetchPromise;
}
