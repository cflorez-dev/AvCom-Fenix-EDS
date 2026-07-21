/**
 * `?poscode=` URL parameter helper.
 *
 * The `poscode` query param is the Level-1 POS source in the resolution
 * hierarchy (see `resolvePOSFromURL` in
 * `scripts/services/geolocation/geolocation.service.js`). External systems
 * deep-link back into the site carrying it, e.g. `/es/?poscode=do`.
 *
 * Because Level 1 wins over the `selected-country` cookie on EVERY page load,
 * a stale `poscode` silently reverts a POS the user just picked in the header:
 * the POS change reloads the same path, the param survives the reload, and
 * `resolvePOSFromURL()` writes the old POS back into the cookie.
 *
 * The fix is to keep the param (external systems and analytics rely on it
 * being there) but rewrite it whenever the POS changes, so URL and cookie
 * always agree.
 *
 * Value convention: the same vocabulary the param is validated against in
 * `resolvePOSFromURL()` — the `keyIso` column of the AEM `countrieslist`
 * catalog, i.e. a lowercase ISO 3166-1 alpha-2 code (`co`, `do`, `us`) or an
 * umbrella POS code (`eu`). Matching is case-insensitive on read, so this
 * helper mirrors whatever casing the incoming URL used.
 */

export const POSCODE_PARAM = 'poscode';

/**
 * Read the raw `?poscode=` value from a query string.
 * @param {string} [search] - Query string (`window.location.search` by default)
 * @returns {string|null} Raw param value, or null when absent/empty
 */
export function getPoscodeParam(search) {
  let query = search;
  if (query === undefined) {
    query = typeof window !== 'undefined' ? window.location.search : '';
  }
  if (!query) return null;
  try {
    const value = new URLSearchParams(query).get(POSCODE_PARAM);
    return value && value.trim() ? value.trim() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Mirror the casing convention of the incoming value so we hand back the same
 * shape the calling system used (`DO` → `CO`, `do` → `co`).
 * @param {string} value - New poscode
 * @param {string|null} reference - Existing poscode in the URL, if any
 * @returns {string}
 */
function matchCase(value, reference) {
  if (reference && reference === reference.toUpperCase() && /[a-z]/i.test(reference)) {
    return value.toUpperCase();
  }
  return value.toLowerCase();
}

/**
 * Rewrite `?poscode=` on a target URL so it reflects the POS the user is
 * actually on.
 *
 * By default this is an UPDATE, not an insert: when the current URL carries no
 * `poscode`, the target URL is returned untouched. That keeps organic traffic
 * free of the param (which would otherwise pin Level 1 for the rest of the
 * session) and only maintains it for visitors who arrived from a system that
 * set it. Pass `addIfMissing: true` to always stamp it.
 *
 * @param {string} targetUrl - Destination URL, absolute or relative
 * @param {string} poscode - New POS code (catalog `keyIso`, e.g. 'co')
 * @param {object} [options]
 * @param {string} [options.currentUrl] - URL to read the existing param from
 *   and to resolve `targetUrl` against. Defaults to `window.location.href`.
 * @param {boolean} [options.addIfMissing=false] - Stamp the param even when the
 *   current URL doesn't have one.
 * @returns {string} Target URL with `poscode` synced; same-origin results are
 *   returned as a path so callers can keep assigning relative URLs.
 */
export function syncPoscodeInUrl(targetUrl, poscode, options = {}) {
  if (!targetUrl) return targetUrl;
  if (!poscode || typeof poscode !== 'string') return targetUrl;

  const { addIfMissing = false } = options;
  const base = options.currentUrl
    || (typeof window !== 'undefined' ? window.location.href : '');
  if (!base) return targetUrl;

  let current;
  let target;
  try {
    current = new URL(base);
    target = new URL(targetUrl, base);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[poscode-url.helper] could not parse URL, leaving it untouched:', error);
    return targetUrl;
  }

  const existing = getPoscodeParam(current.search);
  if (!existing && !addIfMissing) return targetUrl;

  target.searchParams.set(POSCODE_PARAM, matchCase(poscode.trim(), existing));

  return target.origin === current.origin
    ? `${target.pathname}${target.search}${target.hash}`
    : target.href;
}

/**
 * Sync `?poscode=` on the address bar in place, without navigating.
 *
 * Used before a `location.reload()`: the reload replays whatever is in the
 * address bar, so the param has to be corrected first or Level 1 re-applies
 * the stale POS.
 *
 * @param {string} poscode - New POS code (catalog `keyIso`, e.g. 'co')
 * @param {object} [options] - Same options as `syncPoscodeInUrl`
 * @returns {boolean} true when the address bar was rewritten
 */
export function syncPoscodeInAddressBar(poscode, options = {}) {
  if (typeof window === 'undefined' || !window.history?.replaceState) return false;

  const currentUrl = options.currentUrl || window.location.href;
  const nextUrl = syncPoscodeInUrl(currentUrl, poscode, { ...options, currentUrl });
  if (!nextUrl) return false;

  try {
    // Resolve both sides before comparing: `syncPoscodeInUrl` returns a path
    // for same-origin results, so a raw string compare against the absolute
    // href would report a change that isn't one.
    if (new URL(nextUrl, currentUrl).href === new URL(currentUrl).href) return false;
    window.history.replaceState(window.history.state, '', nextUrl);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[poscode-url.helper] replaceState failed:', error);
    return false;
  }
}
