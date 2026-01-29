/**
 * Waits for window.hlx to be initialized and returns codeBasePath
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 30)
 * @param {number} options.retryDelay - Delay between retries in milliseconds (default: 100)
 * @returns {Promise<string>} Promise that resolves to codeBasePath (empty string if not available)
 */
export async function waitForHlxCodeBasePath({
  maxRetries = 30,
  retryDelay = 100,
} = {}) {
  return new Promise((resolve) => {
    let retryCount = 0;

    const checkHlx = () => {
      // Check if window.hlx exists and codeBasePath is available
      if (window.hlx !== undefined) {
        const codeBasePath = window.hlx?.codeBasePath || '';
        resolve(codeBasePath);
        return;
      }

      // If not available yet, retry
      retryCount += 1;
      if (retryCount < maxRetries) {
        setTimeout(checkHlx, retryDelay);
      } else {
        // After max retries, resolve with empty string as fallback
        // eslint-disable-next-line no-console
        if (process.env.NODE_ENV === 'development') {
          console.warn('[hlx.helper] window.hlx not available after max retries, using fallback');
        }
        resolve('');
      }
    };

    // Start checking immediately
    checkHlx();
  });
}

/**
 * Builds an absolute icon path using codeBasePath
 * @param {string} iconName - Name of the icon file
 * @param {string} codeBasePath - Base path from window.hlx.codeBasePath
 * @returns {string} Absolute URL to the icon
 */
export function buildIconPath(iconName, codeBasePath = '') {
  // If codeBasePath is empty, build absolute URL from origin
  if (!codeBasePath) {
    const origin = window.location.origin;
    const cleanPath = `/icons/${iconName}`.replace(/\/+/g, '/');
    return `${origin}${cleanPath}`;
  }
  
  // If codeBasePath is already absolute, use it directly
  if (codeBasePath.startsWith('http://') || codeBasePath.startsWith('https://')) {
    const cleanPath = `/icons/${iconName}`.replace(/\/+/g, '/');
    return `${codeBasePath}${cleanPath}`;
  }
  
  // If codeBasePath is relative, build absolute URL
  const origin = window.location.origin;
  const basePath = codeBasePath.startsWith('/') ? codeBasePath : `/${codeBasePath}`;
  const cleanPath = `${basePath}/icons/${iconName}`.replace(/\/+/g, '/');
  return `${origin}${cleanPath}`;
}

/**
 * Builds an absolute asset path using codeBasePath
 * @param {string} assetPath - Relative path to the asset
 * @param {string} codeBasePath - Base path from window.hlx.codeBasePath
 * @returns {string} Absolute URL to the asset
 */
export function buildAssetPath(assetPath, codeBasePath = '') {
  // Ensure assetPath starts with /
  const cleanAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  
  // If codeBasePath is empty, build absolute URL from origin
  if (!codeBasePath) {
    const origin = window.location.origin;
    return `${origin}${cleanAssetPath}`.replace(/\/+/g, '/');
  }
  
  // If codeBasePath is already absolute, use it directly
  if (codeBasePath.startsWith('http://') || codeBasePath.startsWith('https://')) {
    return `${codeBasePath}${cleanAssetPath}`.replace(/\/+/g, '/');
  }
  
  // If codeBasePath is relative, build absolute URL
  const origin = window.location.origin;
  const basePath = codeBasePath.startsWith('/') ? codeBasePath : `/${codeBasePath}`;
  return `${origin}${basePath}${cleanAssetPath}`.replace(/\/+/g, '/');
}
