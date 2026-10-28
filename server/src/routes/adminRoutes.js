// ============================================================================
// RouteReady Campus - Admin & Transport Manager Management API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { isValidCoordinate } = require('../middleware/validation');

// Guard all admin routes: Requires role 'admin' or 'transport_manager'
router.use(requireAuth);
router.use(requireRole(['admin', 'transport_manager']));

// ============================================================================
// 1. ANALYTICS & OVERVIEW
// ============================================================================
router.get('/analytics', (req, res) => {
  const routes = db.collection('routes');
  const buses = db.collection('buses');
  const stops = db.collection('stops');
  const trips = db.collection('trips');
  const issues = db.collection('transport_issues');
  const feedback = db.collection('feedback');
  const activeTrips = trips.filter(t => t.status === 'active');

  const totalSeats = buses.reduce((acc, b) => acc + (b.seat_capacity || 0), 0);
  const totalOccupied = db.collection('bus_occupancy').reduce((acc, o) => acc + (o.occupied_seats || 0), 0);

  const avgRating = feedback.length > 0
    ? Number((feedback.reduce((a, b) => a + b.rating, 0) / feedback.length).toFixed(1))
    : 0;

  const issuesByCategory = {};
  const issuesByStatus = { submitted: 0, investigating: 0, resolved: 0, closed: 0 };
  issues.forEach(i => {
    issuesByCategory[i.category] = (issuesByCategory[i.category] || 0) + 1;
    issuesByStatus[i.status] = (issuesByStatus[i.status] || 0) + 1;
  });

  return res.json({
    success: true,
    analytics: {
      total_routes: routes.length,
      published_routes: routes.filter(r => r.status === 'published').length,
      total_buses: buses.length,
      active_buses: buses.filter(b => b.status === 'active').length,
      total_stops: stops.length,
      total_trips_today: trips.length,
      active_trips: activeTrips.length,
      open_issues: issuesByStatus.submitted + issuesByStatus.investigating,
      total_issues: issues.length,
      issues_by_status: issuesByStatus,
      issues_by_category: issuesByCategory,
      fleet_seat_capacity: totalSeats,
      current_occupied_seats: totalOccupied,
      fleet_occupancy_percentage: totalSeats > 0 ? Math.round((totalOccupied / totalSeats) * 100) : 0,
      average_student_rating: avgRating,
      total_feedback: feedback.length,
      tracking_mode: config.BUS_TRACKING_MODE
    }
  });
});

// ============================================================================
// 2. BUS MANAGEMENT (CRUD)
// ============================================================================
router.get('/buses', (req, res) => {
  return res.json({ success: true, count: db.collection('buses').length, buses: db.collection('buses') });
});

router.post('/buses', (req, res) => {
  const { bus_number, registration_number, seat_capacity, wheelchair_accessible, low_floor, status } = req.body;

  if (!bus_number || !registration_number || !seat_capacity) {
    return res.status(400).json({ success: false, error: 'bus_number, registration_number, and seat_capacity are required' });
  }

  const existing = db.findOne('buses', b => b.registration_number.toLowerCase() === registration_number.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ success: false, error: 'Bus with this registration number already exists' });
  }

  const newBus = db.insert('buses', {
    college_id: config.COLLEGE.id,
    bus_number: bus_number.trim(),
    registration_number: registration_number.trim().toUpperCase(),
    seat_capacity: parseInt(seat_capacity, 10),
    accessibility_features: {
      wheelchair_accessible: Boolean(wheelchair_accessible),
      low_floor: Boolean(low_floor),
      priority_seating: true
    },
    status: status || 'active'
  });

  return res.status(201).json({ success: true, message: 'Bus registered successfully', bus: newBus });
});

router.put('/buses/:id', (req, res) => {
  const updates = req.body;
  if (updates.seat_capacity) updates.seat_capacity = parseInt(updates.seat_capacity, 10);

  const updated = db.update('buses', b => b.id === req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, error: 'Bus not found' });

  return res.json({ success: true, message: 'Bus updated successfully', bus: updated });
});

router.delete('/buses/:id', (req, res) => {
  const removed = db.delete('buses', b => b.id === req.params.id);
  if (!removed) return res.status(404).json({ success: false, error: 'Bus not found' });
  return res.json({ success: true, message: 'Bus deleted successfully' });
});

// ============================================================================
// 3. ROUTE MANAGEMENT (CRUD & STOPS)
// ============================================================================
router.post('/routes', (req, res) => {
  const { route_number, name, description, origin_label, destination_label, estimated_duration_minutes, is_accessible, status } = req.body;

  if (!route_number || !name || !origin_label || !destination_label) {
    return res.status(400).json({ success: false, error: 'route_number, name, origin_label, and destination_label are required' });
  }

  const newRoute = db.insert('routes', {
    college_id: config.COLLEGE.id,
    route_number: route_number.trim().toUpperCase(),
    name: name.trim(),
    description: description ? description.trim() : '',
    origin_label: origin_label.trim(),
    destination_label: destination_label.trim(),
    estimated_duration_minutes: parseInt(estimated_duration_minutes, 10) || 45,
    is_accessible: Boolean(is_accessible),
    status: status || 'published',
    created_by: req.user.id
  });

  return res.status(201).json({ success: true, message: 'Route created successfully', route: newRoute });
});

router.put('/routes/:id', (req, res) => {
  const updated = db.update('routes', r => r.id === req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Route not found' });
  return res.json({ success: true, message: 'Route updated successfully', route: updated });
});

router.delete('/routes/:id', (req, res) => {
  const removed = db.delete('routes', r => r.id === req.params.id);
  if (!removed) return res.status(404).json({ success: false, error: 'Route not found' });
  // Also clean up route_stops
  const rStops = db.collection('route_stops');
  db.data.route_stops = rStops.filter(rs => rs.route_id !== req.params.id);
  db.saveData();
  return res.json({ success: true, message: 'Route and assigned stops deleted' });
});

// Assign/update stop sequence for a route
router.post('/routes/:id/stops', (req, res) => {
  const routeId = req.params.id;
  const { stops } = req.body; // Array of { stop_id, stop_sequence, offset_minutes }

  if (!Array.isArray(stops)) {
    return res.status(400).json({ success: false, error: 'stops array is required' });
  }

  // Remove existing route stops
  db.data.route_stops = db.collection('route_stops').filter(rs => rs.route_id !== routeId);

  // Insert new ordered stops
  stops.forEach((s, idx) => {
    db.insert('route_stops', {
      id: `rs-${routeId.slice(-4)}-${idx + 1}`,
      route_id: routeId,
      stop_id: s.stop_id,
      stop_sequence: s.stop_sequence || idx + 1,
      scheduled_arrival_offset_minutes: s.offset_minutes || 0,
      scheduled_departure_offset_minutes: (s.offset_minutes || 0) + 1,
      segment_duration_minutes: 8
    });
  });

  return res.json({ success: true, message: 'Route stops updated successfully' });
});

// ============================================================================
// 4. STOP MANAGEMENT (CRUD)
// ============================================================================
router.post('/stops', (req, res) => {
  const { name, description, latitude, longitude, address_label, is_accessible } = req.body;

  if (!name || !isValidCoordinate(latitude, longitude)) {
    return res.status(400).json({ success: false, error: 'Valid name, latitude (-90 to 90), and longitude (-180 to 180) are required' });
  }

  const newStop = db.insert('stops', {
    college_id: config.COLLEGE.id,
    name: name.trim(),
    description: description ? description.trim() : '',
    latitude: Number(parseFloat(latitude).toFixed(7)),
    longitude: Number(parseFloat(longitude).toFixed(7)),
    address_label: address_label ? address_label.trim() : '',
    is_accessible: Boolean(is_accessible),
    is_active: true
  });

  return res.status(201).json({ success: true, message: 'Stop created successfully', stop: newStop });
});

router.put('/stops/:id', (req, res) => {
  const updates = { ...req.body };
  if (updates.latitude !== undefined) updates.latitude = Number(parseFloat(updates.latitude).toFixed(7));
  if (updates.longitude !== undefined) updates.longitude = Number(parseFloat(updates.longitude).toFixed(7));

  const updated = db.update('stops', s => s.id === req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, error: 'Stop not found' });
  return res.json({ success: true, message: 'Stop updated successfully', stop: updated });
});

router.delete('/stops/:id', (req, res) => {
  const inUse = db.findOne('route_stops', rs => rs.stop_id === req.params.id);
  if (inUse) {
    return res.status(400).json({ success: false, error: 'Cannot delete stop: It is assigned to one or more active routes. Remove it from route sequences first.' });
  }
  const removed = db.delete('stops', s => s.id === req.params.id);
  if (!removed) return res.status(404).json({ success: false, error: 'Stop not found' });
  return res.json({ success: true, message: 'Stop deleted successfully' });
});

// ============================================================================
// 5. TRIP ASSIGNMENTS (CRUD)
// ============================================================================
router.post('/trips', (req, res) => {
  const { route_id, bus_id, driver_id, service_date, service_day, scheduled_start_at, scheduled_end_at, status } = req.body;

  if (!route_id || !bus_id || !driver_id) {
    return res.status(400).json({ success: false, error: 'route_id, bus_id, and driver_id are required' });
  }

  const newTrip = db.insert('trips', {
    route_id,
    bus_id,
    driver_id,
    service_date: service_date || new Date().toISOString().split('T')[0],
    service_day: service_day || 'All_Weekdays',
    scheduled_start_at: scheduled_start_at || '07:30 AM',
    scheduled_end_at: scheduled_end_at || '08:15 AM',
    status: status || 'scheduled'
  });

  return res.status(201).json({ success: true, message: 'Trip created and assigned successfully', trip: newTrip });
});

router.put('/trips/:id', (req, res) => {
  const updated = db.update('trips', t => t.id === req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Trip not found' });
  return res.json({ success: true, message: 'Trip updated successfully', trip: updated });
});

router.delete('/trips/:id', (req, res) => {
  const removed = db.delete('trips', t => t.id === req.params.id);
  if (!removed) return res.status(404).json({ success: false, error: 'Trip not found' });
  return res.json({ success: true, message: 'Trip deleted' });
});

// ============================================================================
// 6. USER & ROLE MANAGEMENT
// ============================================================================
router.get('/users', (req, res) => {
  const users = db.collection('profiles').map(u => {
    const safe = { ...u };
    delete safe.password_hash;
    return safe;
  });
  return res.json({ success: true, count: users.length, users });
});

router.patch('/users/:id/role', requireRole('admin'), (req, res) => {
  const { role } = req.body;
  const ALLOWED_ROLES = ['student', 'driver', 'admin', 'transport_manager'];

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ success: false, error: `Invalid role. Must be one of: [${ALLOWED_ROLES.join(', ')}]` });
  }

  const updated = db.update('profiles', p => p.id === req.params.id, { role });
  if (!updated) return res.status(404).json({ success: false, error: 'User not found' });

  const safe = { ...updated };
  delete safe.password_hash;
  return res.json({ success: true, message: `User role updated to '${role}'`, user: safe });
});

module.exports = router;

