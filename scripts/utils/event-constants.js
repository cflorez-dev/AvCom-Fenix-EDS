/**
 * Event Constants - Centralized event name management
 *
 * This file contains all custom event names used throughout the application.
 * Centralizing event names helps maintain consistency and makes refactoring easier.
 */

/**
 * Event dispatched when a city is selected from the origin dropdown selector
 * @event city-from-origin-dropdown
 * @type {CustomEvent}
 * @property {Object} detail - Event details
 * @property {string} detail.originIataCode - IATA code of the selected city (e.g., 'BOG')
 * @property {string} detail.originName - Name of the selected city (e.g., 'Bogotá')
 */
export const CITY_FROM_ORIGIN_DROPDOWN_EVENT = 'city-from-origin-dropdown';

/**
 * Helper function to dispatch city selection event
 * Also stores the last dispatched value so late-initializing blocks can retrieve it.
 * @param {Object} cityData - City data object
 * @param {string} cityData.originIataCode - IATA code
 * @param {string} cityData.originName - City name
 */
export function dispatchCityFromOriginDropdownEvent(cityData) {
  const detail = {
    originIataCode: cityData.originIataCode,
    originName: cityData.originName,
  };

  // Store last dispatched value for late subscribers (race condition handling)
  window.lastOriginDropdownCity = detail;

  const event = new CustomEvent(CITY_FROM_ORIGIN_DROPDOWN_EVENT, {
    detail,
    bubbles: true,
    composed: true,
  });

  window.dispatchEvent(event);
}

/**
 * Gets the last dispatched origin city data (for late-initializing blocks)
 * @returns {Object|null} Last dispatched city data or null
 */
export function getLastOriginDropdownCity() {
  return window.lastOriginDropdownCity || null;
}

/**
 * Event dispatched when geo-nearest-airport result is refreshed.
 *
 * Components that pre-filled their origin from `geo-nearest-airport` at
 * mount time listen to this event to re-read the storage and re-render
 * with the fresh value without requiring a page reload.
 *
 * @event geo-nearest-airport-refreshed
 * @type {CustomEvent}
 * @property {Object} detail
 * @property {string} detail.iataCityCode - Fresh IATA code (e.g. 'BOG')
 * @property {string} detail.iataCountryCode - Country code (e.g. 'co')
 * @property {string} detail.pos - Resolved POS (e.g. 'CO')
 */
export const GEO_NEAREST_AIRPORT_REFRESHED_EVENT = 'geo-nearest-airport-refreshed';

export function dispatchGeoNearestAirportRefreshed(detail) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(GEO_NEAREST_AIRPORT_REFRESHED_EVENT, {
    detail,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
}

/**
 * PBI 1216373 rule 6.5 — "La selección manual del usuario prevalece."
 *
 * When the user explicitly picks an origin city (via booking box or
 * origin-dropdown-selector), we persist the choice so it survives page
 * reloads within the same browser tab.
 *
 * Lifecycle:
 *   - `sessionStorage` scope → auto-cleans when the tab closes.
 *   - Cleared manually on POS change and relocation detection.
 */
const USER_ORIGIN_SELECTION_KEY = 'user-selected-origin';

function readCurrentPos() {
  if (typeof document === 'undefined') return '';
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split('; selected-country=');
    return parts.length === 2
      ? (parts.pop().split(';').shift() || '').toLowerCase()
      : '';
  } catch (_) {
    return '';
  }
}

export function persistUserOriginSelection(cityData) {
  if (typeof sessionStorage === 'undefined') return;
  if (!cityData?.originIataCode) return;
  try {
    sessionStorage.setItem(USER_ORIGIN_SELECTION_KEY, JSON.stringify({
      originIataCode: cityData.originIataCode,
      originName: cityData.originName || '',
      pos: readCurrentPos(),
    }));
  } catch (_) { /* quota exceeded — ignore */ }
}

/**
 * Returns the persisted user selection if (and only if) the POS the
 * selection was made in still matches the current cookie POS. Prevents
 * showing a Colombian city when the user switched to MX, etc.
 */
export function readUserOriginSelection() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_ORIGIN_SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const currentPos = readCurrentPos();
    if (parsed?.pos && currentPos && parsed.pos !== currentPos) {
      clearUserOriginSelection();
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}

export function clearUserOriginSelection() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(USER_ORIGIN_SELECTION_KEY);
  } catch (_) { /* ignore */ }
}
