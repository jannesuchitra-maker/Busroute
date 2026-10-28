// ============================================================================
// RouteReady Campus - Tracking & Occupancy API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config/env');
const simulationEngine = require('../utils/simulationEngine');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validateLocationUpdate } = require('../middleware/validation');

// GET /api/v1/tracking/live
// Returns current positions of all active trips (GPS or simulated)
router.get('/live', (req, res) => {
  const mode = config.BUS_TRACKING_MODE; // 'simulated' or 'gps'
  let positions = [];

  if (mode === 'simulated') {
    positions = simulationEngine.getLivePositions();
  } else {
    // Mode is GPS: query database for latest GPS readings
    const activeTrips = db.find('trips', t => t.status === 'active');
    activeTrips.forEach(trip => {
      const loc = db.find('bus_locations', l => l.trip_id === trip.id && l.source === 'gps')[0];
      const bus = db.findOne('buses', b => b.id === trip.bus_id);
      const route = db.findOne('routes', r => r.id === trip.route_id);
      const occ = db.find('bus_occupancy', o => o.bus_id === trip.bus_id)[0];

      if (loc && bus && route) {
        const isStale = (Date.now() - new Date(loc.recorded_at).getTime()) > (config.GPS_STALE_THRESHOLD_SECONDS * 1000);

        positions.push({
          trip_id: trip.id,
          bus_id: bus.id,
          bus_number: bus.bus_number,
          registration_number: bus.registration_number,
          route_id: route.id,
          route_number: route.route_number,
          route_name: route.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          recorded_at: loc.recorded_at,
          source: 'gps',
          is_simulated: false,
          label: 'LIVE GPS',
          is_stale: isStale,
          seat_capacity: bus.seat_capacity,
          occupied_seats: occ ? occ.occupied_seats : null,
          available_seats: occ ? Math.max(0, bus.seat_capacity - occ.occupied_seats) : null
        });
      }
    });
  }

  return res.json({
    success: true,
    mode: config.BUS_TRACKING_MODE,
    threshold_seconds: config.GPS_STALE_THRESHOLD_SECONDS,
    count: positions.length,
    timestamp: new Date().toISOString(),
    positions
  });
});

// POST /api/v1/tracking/location
// Authorized driver submits real GPS coordinates for their active trip
router.post('/location', requireAuth, requireRole('driver'), validateLocationUpdate, (req, res) => {
  const { trip_id, latitude, longitude, speed_kmh } = req.body;

  const trip = db.findOne('trips', t => t.id === trip_id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  // Verification: Driver MUST be assigned to this trip AND trip MUST be active
  if (trip.driver_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'You are not authorized to update coordinates for this trip' });
  }

  if (trip.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Trip is not currently active' });
  }

  const locationRecord = {
    trip_id,
    bus_id: trip.bus_id,
    driver_id: req.user.id,
    latitude: Number(parseFloat(latitude).toFixed(7)),
    longitude: Number(parseFloat(longitude).toFixed(7)),
    speed_kmh: speed_kmh ? Number(speed_kmh) : null,
    recorded_at: new Date().toISOString(),
    source: 'gps',
    is_simulated: false
  };

  // Prepend to locations history
  const locs = db.collection('bus_locations');
  locs.unshift(locationRecord);
  if (locs.length > 200) {
    locs.length = 200;
  }
  db.saveData();

  return res.status(201).json({
    success: true,
    message: 'GPS coordinates recorded successfully',
    location: locationRecord
  });
});

// POST /api/v1/tracking/occupancy
// Driver or staff updates verified seat occupancy
router.post('/occupancy', requireAuth, requireRole(['driver', 'admin', 'transport_manager']), (req, res) => {
  const { bus_id, trip_id, occupied_seats } = req.body;

  if (!bus_id || occupied_seats === undefined) {
    return res.status(400).json({ success: false, error: 'bus_id and occupied_seats are required' });
  }

  const bus = db.findOne('buses', b => b.id === bus_id);
  if (!bus) {
    return res.status(404).json({ success: false, error: 'Bus not found' });
  }

  const nOccupied = parseInt(occupied_seats, 10);
  if (isNaN(nOccupied) || nOccupied < 0) {
    return res.status(400).json({ success: false, error: 'Occupied seats must be a non-negative integer' });
  }

  if (nOccupied > bus.seat_capacity) {
    return res.status(400).json({
      success: false,
      error: `Occupied seats (${nOccupied}) cannot exceed total bus capacity (${bus.seat_capacity})`
    });
  }

  const record = {
    id: 'occ-' + Date.now(),
    bus_id,
    trip_id: trip_id || null,
    occupied_seats: nOccupied,
    source: req.user.role === 'driver' ? 'driver_manual' : 'verified_count',
    recorded_at: new Date().toISOString(),
    updated_by: req.user.id
  };

  // Upsert occupancy
  const existing = db.findOne('bus_occupancy', o => o.bus_id === bus_id);
  if (existing) {
    Object.assign(existing, record);
    db.saveData();
  } else {
    db.insert('bus_occupancy', record);
  }

  return res.json({
    success: true,
    message: 'Bus occupancy updated successfully',
    occupancy: {
      bus_id,
      seat_capacity: bus.seat_capacity,
      occupied_seats: nOccupied,
      available_seats: Math.max(0, bus.seat_capacity - nOccupied),
      source: record.source,
      recorded_at: record.recorded_at
    }
  });
});

// POST /api/v1/tracking/toggle-mode
// Admin toggle between simulated and real gps mode
router.post('/toggle-mode', requireAuth, requireRole(['admin', 'transport_manager']), (req, res) => {
  const { mode } = req.body;
  if (!['simulated', 'gps'].includes(mode)) {
    return res.status(400).json({ success: false, error: "mode must be either 'simulated' or 'gps'" });
  }

  config.BUS_TRACKING_MODE = mode;
  if (mode === 'simulated') {
    simulationEngine.start();
  } else {
    simulationEngine.stop();
  }

  return res.json({
    success: true,
    message: `Bus tracking mode switched to '${mode}'`,
    mode: config.BUS_TRACKING_MODE
  });
});

module.exports = router;

