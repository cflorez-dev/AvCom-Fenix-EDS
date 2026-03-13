import { loadScript } from '../aem.js';

let domPurifyLoaded = false;

/**
 * Ensures DOMPurify is loaded and available on window.DOMPurify
 * @returns {Promise<void>}
 */
async function ensureDOMPurify() {
  if (domPurifyLoaded && window.DOMPurify) return;
  await loadScript(`${window.hlx?.codeBasePath || ''}/scripts/dompurify.min.js`);
  domPurifyLoaded = true;
}

/**
 * Sanitizes HTML string using DOMPurify to prevent XSS attacks.
 * Falls back to returning the original content if DOMPurify is not yet loaded.
 *
 * @param {string} dirty - The untrusted HTML string
 * @param {Object} [config] - Optional DOMPurify config
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(dirty, config = { USE_PROFILES: { html: true } }) {
  if (!dirty) return '';
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(dirty, config);
  }
  return dirty;
}

/**
 * Loads DOMPurify and then sanitizes the given HTML string.
 * Use this in async contexts where you can await the load.
 *
 * @param {string} dirty - The untrusted HTML string
 * @param {Object} [config] - Optional DOMPurify config
 * @returns {Promise<string>} Sanitized HTML string
 */
export async function sanitizeHTMLAsync(dirty, config = { USE_PROFILES: { html: true } }) {
  if (!dirty) return '';
  await ensureDOMPurify();
  return window.DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitizes SVG markup using DOMPurify with SVG profile enabled.
 *
 * @param {string} dirty - The untrusted SVG string
 * @returns {string} Sanitized SVG string
 */
export function sanitizeSVG(dirty) {
  if (!dirty) return '';
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(dirty, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
    });
  }
  return dirty;
}
