// ============================================================================
// RouteReady Campus - Stops API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { calculateDistance, estimateWalkMinutes } = require('../utils/haversine');
const { isValidCoordinate } = require('../middleware/validation');

// GET /api/v1/stops
// Query parameters:
// - q: search term for stop name or address
// - lat, lng: user coordinates for nearest-stop calculation
// - max_distance_km: optional radius filter (default: 25 km)
router.get('/', (req, res) => {
  const { q, lat, lng, max_distance_km } = req.query;
  let stops = db.find('stops', s => s.is_active);

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    stops = stops.filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.address_label && s.address_label.toLowerCase().includes(term)) ||
      (s.description && s.description.toLowerCase().includes(term))
    );
  }

  // Geolocation Proximity Calculation
  let hasGeo = false;
  let userLat = null;
  let userLng = null;

  if (lat !== undefined && lng !== undefined) {
    userLat = parseFloat(lat);
    userLng = parseFloat(lng);

    if (isValidCoordinate(userLat, userLng)) {
      hasGeo = true;
      const maxKm = max_distance_km ? parseFloat(max_distance_km) : 35;

      stops = stops.map(stop => {
        const dist = calculateDistance(userLat, userLng, stop.latitude, stop.longitude);
        return {
          ...stop,
          distance_meters: dist.meters,
          distance_km: dist.kilometers,
          estimated_walk_minutes: estimateWalkMinutes(dist.meters),
          proximity_note: 'Geographic straight-line distance; actual pedestrian/road travel distance may vary.'
        };
      })
      .filter(s => s.distance_km <= maxKm)
      .sort((a, b) => a.distance_meters - b.distance_meters);
    }
  }

  // Enrich with routes that pass through each stop
  const enriched = stops.map(stop => {
    const routeStops = db.find('route_stops', rs => rs.stop_id === stop.id);
    const routesPassing = routeStops.map(rs => {
      const r = db.findOne('routes', route => route.id === rs.route_id && route.status === 'published');
      return r ? {
        id: r.id,
        route_number: r.route_number,
        name: r.name,
        sequence: rs.stop_sequence,
        offset_minutes: rs.scheduled_arrival_offset_minutes
      } : null;
    }).filter(Boolean);

    return {
      ...stop,
      routes: routesPassing,
      routes_count: routesPassing.length
    };
  });

  return res.json({
    success: true,
    count: enriched.length,
    geolocation_applied: hasGeo,
    user_coordinates: hasGeo ? { latitude: userLat, longitude: userLng } : null,
    stops: enriched
  });
});

// GET /api/v1/stops/:id
router.get('/:id', (req, res) => {
  const stop = db.findOne('stops', s => s.id === req.params.id);
  if (!stop) {
    return res.status(404).json({ success: false, error: 'Stop not found' });
  }

  const routeStops = db.find('route_stops', rs => rs.stop_id === stop.id);
  const routes = routeStops.map(rs => {
    const r = db.findOne('routes', route => route.id === rs.route_id);
    return r ? {
      ...r,
      stop_sequence: rs.stop_sequence,
      scheduled_arrival_offset_minutes: rs.scheduled_arrival_offset_minutes,
      scheduled_departure_offset_minutes: rs.scheduled_departure_offset_minutes
    } : null;
  }).filter(Boolean);

  return res.json({
    success: true,
    stop: {
      ...stop,
      routes
    }
  });
});

module.exports = router;

