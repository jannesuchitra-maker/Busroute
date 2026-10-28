// ============================================================================
// RouteReady Campus - Request Validation Utilities
// ============================================================================

function isValidCoordinate(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90.0 &&
    nLat <= 90.0 &&
    nLng >= -180.0 &&
    nLng <= 180.0
  );
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateLocationUpdate(req, res, next) {
  const { trip_id, latitude, longitude } = req.body;
  if (!trip_id) {
    return res.status(400).json({ success: false, error: 'trip_id is required' });
  }
  if (!isValidCoordinate(latitude, longitude)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.'
    });
  }
  next();
}

module.exports = {
  isValidCoordinate,
  isValidEmail,
  validateLocationUpdate
};

