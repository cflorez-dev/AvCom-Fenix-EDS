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
