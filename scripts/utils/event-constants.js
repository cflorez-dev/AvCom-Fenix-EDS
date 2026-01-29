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
 * @param {Object} cityData - City data object
 * @param {string} cityData.originIataCode - IATA code
 * @param {string} cityData.originName - City name
 */
export function dispatchCityFromOriginDropdownEvent(cityData) {
  const event = new CustomEvent(CITY_FROM_ORIGIN_DROPDOWN_EVENT, {
    detail: {
      originIataCode: cityData.originIataCode,
      originName: cityData.originName,
    },
    bubbles: true,
    composed: true, // Important for shadow DOM or web components
  });
  
  window.dispatchEvent(event);
}
