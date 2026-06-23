/**
 * Haversine Distance Helper
 *
 * Pure math: great-circle distance between two points on a sphere (the Earth).
 * Reusable by any feature that needs proximity-based sorting or thresholds
 * (geolocation triangulation, nearby offices, lounges, fare maps, etc.).
 */

const EARTH_RADIUS_KM = 6371;

const toRadians = (deg) => (deg * Math.PI) / 180;

/**
 * Great-circle distance in kilometers between two lat/lng points.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in km (0 for identical points, ~20015 for antipodes)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export default calculateDistance;
