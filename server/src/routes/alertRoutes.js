// ============================================================================
// RouteReady Campus - Service Alerts API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /api/v1/alerts
router.get('/', (req, res) => {
  const isStaff = req.user && ['admin', 'transport_manager'].includes(req.user.role);

  const alerts = db.find('service_alerts', a => {
    if (!isStaff && a.status !== 'active') return false;
    return true;
  }).map(alert => {
    const route = alert.route_id ? db.findOne('routes', r => r.id === alert.route_id) : null;
    const bus = alert.bus_id ? db.findOne('buses', b => b.id === alert.bus_id) : null;
    return {
      ...alert,
      route_name: route ? `${route.route_number} - ${route.name}` : null,
      bus_number: bus ? bus.bus_number : null
    };
  }).sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));

  return res.json({ success: true, count: alerts.length, alerts });
});

// POST /api/v1/alerts
router.post('/', requireAuth, requireRole(['admin', 'transport_manager']), (req, res) => {
  const { title, description, severity, route_id, bus_id } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, error: 'Title and description are required' });
  }

  const newAlert = db.insert('service_alerts', {
    college_id: config.COLLEGE.id,
    route_id: route_id || null,
    bus_id: bus_id || null,
    title: title.trim(),
    description: description.trim(),
    severity: severity && ['minor', 'warning', 'severe'].includes(severity) ? severity : 'warning',
    starts_at: new Date().toISOString(),
    status: 'active',
    created_by: req.user.id
  });

  return res.status(201).json({ success: true, message: 'Service alert published', alert: newAlert });
});

// PATCH /api/v1/alerts/:id/resolve
router.patch('/:id/resolve', requireAuth, requireRole(['admin', 'transport_manager']), (req, res) => {
  const updated = db.update('service_alerts', a => a.id === req.params.id, {
    status: 'resolved',
    ends_at: new Date().toISOString()
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  return res.json({ success: true, message: 'Service alert resolved', alert: updated });
});

module.exports = router;

