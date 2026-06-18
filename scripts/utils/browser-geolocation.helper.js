/**
 * Browser Geolocation Helper
 *
 * Pure wrapper around W3C Geolocation API and Permissions API.
 * No business logic — just permission state and coordinate fetching.
 * Reusable by any feature that needs the user's location
 * (geolocation service, nearby offices, lounges, airports, etc.).
 */

const isBrowser = typeof navigator !== 'undefined';

const hasPermissionsApi = isBrowser
  && typeof navigator.permissions?.query === 'function';

const hasGeolocationApi = isBrowser
  && typeof navigator.geolocation?.getCurrentPosition === 'function';

/**
 * Query the current geolocation permission state.
 * @returns {Promise<'granted'|'prompt'|'denied'|'unsupported'>}
 */
export async function queryGeolocationPermission() {
  if (!hasGeolocationApi) return 'unsupported';

  // Safari < 16 doesn't expose Permissions API for geolocation.
  // Treat as 'prompt' so callers can decide whether to request.
  if (!hasPermissionsApi) return 'prompt';

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[browser-geolocation.helper] permission query failed:', error);
    return 'prompt';
  }
}

/**
 * Request the user's current coordinates with a timeout.
 * Resolves to null on error/timeout/denial — never throws.
 * @param {object} [options]
 * @param {number} [options.timeout=400] - Max ms to wait
 * @param {number} [options.maximumAge=0] - Max age of cached position in ms
 * @param {boolean} [options.enableHighAccuracy=false] - GPS-grade accuracy
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export function getCurrentCoordinates({
  timeout = 400,
  maximumAge = 0,
  enableHighAccuracy = false,
} = {}) {
  if (!hasGeolocationApi) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.warn('[browser-geolocation.helper] getCurrentPosition failed:', error.message);
        resolve(null);
      },
      { timeout, maximumAge, enableHighAccuracy },
    );
  });
}

/**
 * Subscribe to geolocation permission state changes via the Permissions
 * API. Fires the handler with the new state whenever the user changes
 * their decision (e.g. clicks Allow after the initial timeout, or toggles
 * the permission in browser settings).
 *
 * Returns a cleanup function (unsubscribe). No-ops silently on Safari <16
 * and any browser without Permissions API support for geolocation.
 *
 * @param {(state: 'granted'|'prompt'|'denied') => void} handler
 * @returns {Promise<() => void>} unsubscribe
 */
export async function onGeolocationPermissionChange(handler) {
  if (!hasPermissionsApi) return () => {};

  let status;
  try {
    status = await navigator.permissions.query({ name: 'geolocation' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[browser-geolocation.helper] permission subscribe failed:', error);
    return () => {};
  }

  const listener = () => handler(status.state);
  status.addEventListener('change', listener);
  return () => status.removeEventListener('change', listener);
}
