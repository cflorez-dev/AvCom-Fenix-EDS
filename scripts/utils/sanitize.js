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
 * Fails closed: if DOMPurify is not yet loaded, returns an empty string
 * instead of the untrusted input. Use sanitizeHTMLAsync() when the caller
 * can await the DOMPurify load.
 *
 * @param {string} dirty - The untrusted HTML string
 * @param {Object} [config] - Optional DOMPurify config
 * @returns {string} Sanitized HTML string, or '' if DOMPurify is not ready
 */
export function sanitizeHTML(dirty, config = { USE_PROFILES: { html: true } }) {
  if (!dirty) return '';
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(dirty, config);
  }
  // Fail closed: DOMPurify not loaded yet. Returning the unsanitized input
  // would expose any caller running during the early load window to XSS.
  // Callers that need sanitization before DOMPurify is ready should use
  // sanitizeHTMLAsync() instead.
  // eslint-disable-next-line no-console
  console.warn('[sanitizeHTML] DOMPurify not loaded yet; returning empty string. Use sanitizeHTMLAsync() for async contexts.');
  return '';
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
 * Validates that a URL is safe to use in an href attribute or link component.
 * Blocks javascript:, data:, vbscript:, file: and other unsafe schemes that
 * can lead to XSS when rendered as a link. Use this at trust boundaries
 * (CMS content extraction) to prevent authors from injecting malicious URIs.
 *
 * Returns true for:
 *  - Relative paths: "/page", "#anchor", "?query", "page.html"
 *  - Safe absolute schemes: https://, http://, mailto:, tel:, sms:
 *
 * Returns false for:
 *  - javascript:, data:, vbscript:, file:, about:, etc.
 *  - Non-string / empty inputs
 *
 * @param {string} url - The URL string to validate
 * @returns {boolean} true if the URL uses a safe scheme or is relative
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Strip ASCII tab/LF/CR before validating. The WHATWG URL parser silently
  // removes these characters when the browser resolves an href, so
  // "java\tscript:alert(1)" is parsed by the browser as "javascript:alert(1)".
  // Without this normalization, an attacker can bypass the scheme allowlist by
  // embedding control characters inside the scheme. We must validate the same
  // string the browser will execute, not the literal input.
  const normalized = url.replace(/[\t\n\r]/g, '').trim();
  if (!normalized) return false;

  // Relative URLs (path / fragment / query) are always safe
  if (/^(\/|#|\?)/.test(normalized)) return true;

  // Absolute URLs with known safe schemes
  if (/^(https?|mailto|tel|sms):/i.test(normalized)) return true;

  // Bare paths without scheme (e.g. "page.html") — safe
  // A scheme-like prefix must match: letter, then letters/digits/+/./-, then ":"
  if (!/^[a-z][a-z0-9+.-]*:/i.test(normalized)) return true;

  // Anything else has an unknown scheme → block it
  return false;
}

/**
 * Sanitizes SVG markup using DOMPurify with SVG profile enabled.
 * Fails closed: if DOMPurify is not yet loaded, returns an empty string
 * to prevent XSS via inline <script> or event handlers inside SVG.
 *
 * @param {string} dirty - The untrusted SVG string
 * @returns {string} Sanitized SVG string, or '' if DOMPurify is not ready
 */
export function sanitizeSVG(dirty) {
  if (!dirty) return '';
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(dirty, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
    });
  }
  // Fail closed: see sanitizeHTML() for rationale.
  // eslint-disable-next-line no-console
  console.warn('[sanitizeSVG] DOMPurify not loaded yet; returning empty string.');
  return '';
}
