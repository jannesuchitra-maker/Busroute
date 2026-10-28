// ============================================================================
// RouteReady Campus - Routes API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/v1/routes
// Query parameters:
// - q: search text in number, name, origin, destination
// - origin_stop_id: find routes starting from or passing through origin
// - destination_stop_id: find routes reaching destination after origin
// - status: 'published' (default for public/students)
router.get('/', (req, res) => {
  const { q, origin_stop_id, destination_stop_id, status } = req.query;
  const isStaff = req.user && ['admin', 'transport_manager'].includes(req.user.role);

  let routes = db.find('routes', r => {
    if (!isStaff && r.status !== 'published') return false;
    if (status && r.status !== status) return false;
    return true;
  });

  // Free text search
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    routes = routes.filter(r =>
      r.route_number.toLowerCase().includes(term) ||
      r.name.toLowerCase().includes(term) ||
      r.origin_label.toLowerCase().includes(term) ||
      r.destination_label.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  }

  // Origin & Destination stop sequence search
  if (origin_stop_id && destination_stop_id) {
    routes = routes.filter(route => {
      const stops = db.find('route_stops', rs => rs.route_id === route.id)
        .sort((a, b) => a.stop_sequence - b.stop_sequence);

      const originIndex = stops.findIndex(s => s.stop_id === origin_stop_id);
      const destIndex = stops.findIndex(s => s.stop_id === destination_stop_id);

      // Origin must exist and MUST precede destination in the stop sequence
      return originIndex !== -1 && destIndex !== -1 && originIndex < destIndex;
    });
  } else if (origin_stop_id) {
    routes = routes.filter(route => {
      return db.findOne('route_stops', rs => rs.route_id === route.id && rs.stop_id === origin_stop_id);
    });
  }

  // Enrich routes with stop count, trip status, assigned bus
  const enriched = routes.map(route => {
    const routeStops = db.find('route_stops', rs => rs.route_id === route.id)
      .sort((a, b) => a.stop_sequence - b.stop_sequence);

    const activeTrip = db.findOne('trips', t => t.route_id === route.id && t.status === 'active');
    const bus = activeTrip ? db.findOne('buses', b => b.id === activeTrip.bus_id) : null;
    const occupancy = bus ? db.find('bus_occupancy', o => o.bus_id === bus.id)[0] : null;

    let intermediateStops = null;
    let segmentEstimatedMinutes = null;

    if (origin_stop_id && destination_stop_id) {
      const originRS = routeStops.find(s => s.stop_id === origin_stop_id);
      const destRS = routeStops.find(s => s.stop_id === destination_stop_id);
      if (originRS && destRS && originRS.stop_sequence < destRS.stop_sequence) {
        intermediateStops = Math.max(0, destRS.stop_sequence - originRS.stop_sequence - 1);
        segmentEstimatedMinutes = Math.max(5, destRS.scheduled_arrival_offset_minutes - originRS.scheduled_departure_offset_minutes);
      }
    }

    return {
      id: route.id,
      route_number: route.route_number,
      name: route.name,
      description: route.description,
      origin_label: route.origin_label,
      destination_label: route.destination_label,
      estimated_duration_minutes: route.estimated_duration_minutes,
      is_accessible: route.is_accessible,
      status: route.status,
      total_stops: routeStops.length,
      departure_time: route.departure_time || '07:30 AM',
      arrival_time: route.arrival_time || '08:15 AM',
      has_active_trip: Boolean(activeTrip),
      active_trip_id: activeTrip ? activeTrip.id : null,
      assigned_bus_number: bus ? bus.bus_number : null,
      seat_capacity: bus ? bus.seat_capacity : null,
      available_seats: (bus && occupancy) ? Math.max(0, bus.seat_capacity - occupancy.occupied_seats) : null,
      origin_destination_search: (origin_stop_id && destination_stop_id) ? {
        intermediate_stops: intermediateStops,
        scheduled_segment_minutes: segmentEstimatedMinutes,
        note: 'Scheduled estimate based on timetable offsets; traffic conditions may vary.'
      } : null
    };
  });

  return res.json({
    success: true,
    count: enriched.length,
    routes: enriched
  });
});

// GET /api/v1/routes/:id
router.get('/:id', (req, res) => {
  const route = db.findOne('routes', r => r.id === req.params.id);
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }

  // Fetch ordered stops
  const routeStops = db.find('route_stops', rs => rs.route_id === route.id)
    .sort((a, b) => a.stop_sequence - b.stop_sequence);

  const stops = routeStops.map(rs => {
    const stop = db.findOne('stops', s => s.id === rs.stop_id);
    return {
      sequence: rs.stop_sequence,
      stop_id: rs.stop_id,
      name: stop ? stop.name : 'Unknown Stop',
      description: stop ? stop.description : '',
      latitude: stop ? stop.latitude : null,
      longitude: stop ? stop.longitude : null,
      address_label: stop ? stop.address_label : '',
      is_accessible: stop ? stop.is_accessible : false,
      scheduled_arrival_offset_minutes: rs.scheduled_arrival_offset_minutes,
      scheduled_departure_offset_minutes: rs.scheduled_departure_offset_minutes,
      segment_duration_minutes: rs.segment_duration_minutes
    };
  });

  // Active or scheduled trips
  const trips = db.find('trips', t => t.route_id === route.id);
  const activeTrip = trips.find(t => t.status === 'active') || trips[0];
  const bus = activeTrip ? db.findOne('buses', b => b.id === activeTrip.bus_id) : null;
  const occupancy = bus ? db.find('bus_occupancy', o => o.bus_id === bus.id)[0] : null;

  return res.json({
    success: true,
    route: {
      ...route,
      stops,
      assigned_bus: bus ? {
        id: bus.id,
        bus_number: bus.bus_number,
        registration_number: bus.registration_number,
        seat_capacity: bus.seat_capacity,
        accessibility_features: bus.accessibility_features,
        verified_occupied_seats: occupancy ? occupancy.occupied_seats : null,
        available_seats: occupancy ? Math.max(0, bus.seat_capacity - occupancy.occupied_seats) : null,
        occupancy_source: occupancy ? occupancy.source : 'unknown',
        occupancy_freshness: occupancy ? occupancy.recorded_at : null
      } : null,
      active_trip: activeTrip ? {
        id: activeTrip.id,
        service_date: activeTrip.service_date,
        status: activeTrip.status,
        scheduled_start_at: activeTrip.scheduled_start_at,
        scheduled_end_at: activeTrip.scheduled_end_at
      } : null
    }
  });
});

module.exports = router;

