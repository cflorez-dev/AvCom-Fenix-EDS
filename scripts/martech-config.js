/**
 * MarTech Configuration for Avianca EDS
 * Centralizes environment detection and script URLs
 */

/**
 * Detect current environment based on hostname
 * @returns {'development' | 'production'}
 */
export function getEnvironment() {
  const { hostname } = window.location;

  // Production: avianca.com (with or without www) and the fenix-prd aem.live host
  if (
    hostname === 'avianca.com'
    || hostname === 'www.avianca.com'
    || hostname === 'main--fenix-prd--aviancavsts.aem.live'
  ) {
    return 'production';
  }

  // Development: Everything else (localhost, .aem.page, .aem.live, etc.)
  return 'development';
}

/**
 * Check if analytics/tracking is disabled via query param
 * @returns {boolean}
 */
export function isTrackingDisabled() {
  return window.location.search.includes('martech=off');
}

/**
 * Detect if the page is running in AEM author mode / Universal Editor.
 * @returns {boolean}
 */
export function isAuthorMode() {
  try {
    return !!(
      window.xwalk?.isAuthorEnv
      || window.hlx?.aue
      || document.querySelector('meta[name="urn:auecon:aemconnection"]')
      || window.location.hostname.includes('author-')
      || window.location.hostname.includes('adobeaemcloud.com')
    );
  } catch (e) {
    return false;
  }
}

// Adobe Launch URLs per environment
export const ADOBE_LAUNCH_URLS = {
  development: 'https://assets.adobedtm.com/6ac3e976c146/4026528cdd43/launch-ENf32bf57525554e6f8b6d31b098cb7d66-development.min.js',
  production: 'https://assets.adobedtm.com/6ac3e976c146/4026528cdd43/launch-EN80a601f9b57746f2985c5b443538b3c1.min.js',
};

// OneTrust Configuration
export const ONETRUST_CONFIG = {
  scriptUrl: 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js',
  domainScript: 'c6058a04-d31f-4774-b497-6894f2030591',
};

// GTM Container ID
export const GTM_CONTAINER_ID = 'GTM-P35N52K';
