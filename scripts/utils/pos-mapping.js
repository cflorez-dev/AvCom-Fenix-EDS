/**
 * POS Code Mapping Utility
 *
 * Maps ISO country codes (stored in cookies) to POS codes used in analytics
 * and downstream booking flows. Most codes are simply uppercased ISO codes,
 * but some require special mapping (e.g., GB → UK, OT → OTR).
 *
 * Single source of truth for POS codes — update this map when new exceptions arise.
 *
 * POS Reference Table:
 * AR, BO, BR, CA, CL, CO, CR, DO, EC, EU, GT, HN, MX, NI, OTR, PA, PE, PY, SV, UK, US, UY
 */

/**
 * Exception map: ISO codes that differ from their POS code.
 * Only codes that need special handling are listed here.
 * All other ISO codes are simply uppercased.
 */
const ISO_TO_POS_EXCEPTIONS = {
  gb: 'UK',
  ot: 'OTR',
};

/**
 * Convert an ISO country code to its corresponding POS code.
 *
 * @param {string} isoCode - Lowercase ISO country code (e.g., 'co', 'gb', 'ot')
 * @returns {string} Uppercase POS code (e.g., 'CO', 'UK', 'OTR')
 *
 * @example
 * mapCountryToPos('co')  // → 'CO'
 * mapCountryToPos('gb')  // → 'UK'
 * mapCountryToPos('ot')  // → 'OTR'
 * mapCountryToPos('us')  // → 'US'
 */
export function mapCountryToPos(isoCode) {
  if (!isoCode) return 'CO'; // Default fallback
  const normalized = isoCode.toLowerCase().trim();
  return ISO_TO_POS_EXCEPTIONS[normalized] || normalized.toUpperCase();
}

export default mapCountryToPos;
