// ============================================================================
// RouteReady Campus - Trips & Driver Workflow API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /api/v1/trips
// Filter by route_id, driver_id, status
router.get('/', (req, res) => {
  const { route_id, driver_id, status } = req.query;

  let trips = db.find('trips', t => {
    if (route_id && t.route_id !== route_id) return false;
    if (driver_id && t.driver_id !== driver_id) return false;
    if (status && t.status !== status) return false;
    return true;
  });

  const enriched = trips.map(trip => {
    const route = db.findOne('routes', r => r.id === trip.route_id);
    const bus = db.findOne('buses', b => b.id === trip.bus_id);
    const driver = db.findOne('profiles', p => p.id === trip.driver_id);
    const occupancy = bus ? db.find('bus_occupancy', o => o.bus_id === bus.id)[0] : null;

    return {
      ...trip,
      route: route ? { id: route.id, route_number: route.route_number, name: route.name } : null,
      bus: bus ? { id: bus.id, bus_number: bus.bus_number, registration_number: bus.registration_number, seat_capacity: bus.seat_capacity } : null,
      driver: driver ? { id: driver.id, full_name: driver.full_name, phone: driver.phone } : null,
      occupancy: occupancy ? {
        occupied_seats: occupancy.occupied_seats,
        available_seats: bus ? Math.max(0, bus.seat_capacity - occupancy.occupied_seats) : null,
        recorded_at: occupancy.recorded_at
      } : null
    };
  });

  return res.json({ success: true, count: enriched.length, trips: enriched });
});

// GET /api/v1/trips/driver/assigned
// Trips assigned to the authenticated driver
router.get('/driver/assigned', requireAuth, requireRole('driver'), (req, res) => {
  const trips = db.find('trips', t => t.driver_id === req.user.id);

  const enriched = trips.map(trip => {
    const route = db.findOne('routes', r => r.id === trip.route_id);
    const bus = db.findOne('buses', b => b.id === trip.bus_id);
    const routeStops = db.find('route_stops', rs => rs.route_id === trip.route_id)
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map(rs => {
        const stop = db.findOne('stops', s => s.id === rs.stop_id);
        return {
          sequence: rs.stop_sequence,
          stop_id: rs.stop_id,
          name: stop ? stop.name : '',
          offset: rs.scheduled_arrival_offset_minutes
        };
      });

    const occupancy = bus ? db.find('bus_occupancy', o => o.bus_id === bus.id)[0] : null;

    return {
      ...trip,
      route: route ? { id: route.id, route_number: route.route_number, name: route.name, origin: route.origin_label, destination: route.destination_label } : null,
      bus: bus ? { id: bus.id, bus_number: bus.bus_number, registration_number: bus.registration_number, seat_capacity: bus.seat_capacity } : null,
      stops: routeStops,
      occupancy: occupancy ? { occupied_seats: occupancy.occupied_seats } : null
    };
  });

  return res.json({ success: true, count: enriched.length, trips: enriched });
});

// POST /api/v1/trips/:id/start
// Driver starts their assigned trip
router.post('/:id/start', requireAuth, requireRole(['driver', 'admin', 'transport_manager']), (req, res) => {
  const trip = db.findOne('trips', t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  // Authorization check: Only assigned driver or admin/manager
  if (req.user.role === 'driver' && trip.driver_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this trip' });
  }

  const updated = db.update('trips', t => t.id === trip.id, {
    status: 'active',
    actual_start_at: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Trip started successfully. Real-time location sharing is now active.',
    trip: updated
  });
});

// POST /api/v1/trips/:id/end
// Driver ends their assigned trip
router.post('/:id/end', requireAuth, requireRole(['driver', 'admin', 'transport_manager']), (req, res) => {
  const trip = db.findOne('trips', t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  if (req.user.role === 'driver' && trip.driver_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'You are not assigned to this trip' });
  }

  const updated = db.update('trips', t => t.id === trip.id, {
    status: 'completed',
    actual_end_at: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Trip completed successfully. Location sharing stopped.',
    trip: updated
  });
});

module.exports = router;

