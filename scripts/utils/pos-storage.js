/**
 * Utility functions for managing POS (Point of Sale) selection
 * DEPRECATED: This module is kept for backward compatibility.
 * New code should use scripts/services/header/language-country-selector.js instead.
 * 
 * This module now uses cookies internally instead of sessionStorage.
 * POS format: "language-country" (e.g., "es-col", "en-us")
 */

// Re-export from the new service for backward compatibility
import {
  getStoredPos as getStoredPosFromService,
  setStoredPos as setStoredPosFromService,
  getStorageEventName as getStorageEventNameFromService,
  formatPosForDisplay as formatPosForDisplayFromService,
  parsePos as parsePosFromService,
  buildPos as buildPosFromService,
} from '../services/header/language-country-selector.js';

/**
 * Get the selected POS from cookies
 * @deprecated Use scripts/services/header/language-country-selector.js instead
 * @returns {string|null} The selected POS or null if not set
 */
export function getStoredPos() {
  return getStoredPosFromService();
}

/**
 * Set the selected POS in cookies and dispatch a custom event
 * @deprecated Use scripts/services/header/language-country-selector.js instead
 * @param {string} pos - POS value in format "language-country" (e.g., "es-col")
 */
export function setStoredPos(pos) {
  setStoredPosFromService(pos);
}

/**
 * Get the storage event name for listening to changes
 * @deprecated Use scripts/services/header/language-country-selector.js instead
 * @returns {string} The event name
 */
export function getStorageEventName() {
  return getStorageEventNameFromService();
}

/**
 * Format POS for display: "language-country" -> "COUNTRY - LANGUAGE" (e.g., "es-col" -> "COL - ES")
 * @deprecated Use scripts/services/header/language-country-selector.js instead
 * @param {string} pos - POS value in format "language-country"
 * @returns {string} Formatted POS for display (e.g., "COL - ES")
 */
export function formatPosForDisplay(pos) {
  return formatPosForDisplayFromService(pos);
}

/**
 * Parse POS value to extract language and country
 * @deprecated Use scripts/services/header/language-country-selector.js instead
 * @param {string} pos - POS value in format "language-country" (e.g., "es-col")
 * @returns {Object} Object with language and country properties
 */
export function parsePos(pos) {
  return parsePosFromService(pos);
}

/**
 * Build POS value from language and country
 * @deprecated Use scripts/services/header/language-country-selector.js instead
 * @param {string} language - Language code (e.g., "es")
 * @param {string} country - Country code (e.g., "col")
 * @returns {string} POS value in format "language-country" (e.g., "es-col")
 */
export function buildPos(language, country) {
  return buildPosFromService(language, country);
}
