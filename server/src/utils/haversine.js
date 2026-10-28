// ============================================================================
// RouteReady Campus - Haversine Geographic Distance Utility
// ============================================================================

/**
 * Calculates the great-circle distance between two geographic coordinates
 * on Earth using the Haversine formula.
 *
 * NOTE: This represents straight-line geographic proximity (as the crow flies),
 * NOT street-level pedestrian walking or road driving distance.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {{ meters: number, kilometers: number, miles: number }}
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's mean radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = Math.round(R * c);
  const kilometers = Number((meters / 1000).toFixed(2));
  const miles = Number((kilometers * 0.621371).toFixed(2));

  return { meters, kilometers, miles };
}

/**
 * Estimates walking travel time (assuming average pedestrian speed of 4.8 km/h or 80 m/min)
 * Labeled explicitly as estimated geographic walking approximation.
 *
 * @param {number} distanceMeters
 * @returns {number} Estimated minutes
 */
function estimateWalkMinutes(distanceMeters) {
  // 80 meters per minute ~ 4.8 km/h
  return Math.max(1, Math.round(distanceMeters / 80));
}

module.exports = {
  calculateDistance,
  estimateWalkMinutes
};

