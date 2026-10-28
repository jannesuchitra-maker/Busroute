// ============================================================================
// RouteReady Campus - Transport Issue Reports API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const VALID_CATEGORIES = ['delay', 'breakdown', 'missed_stop', 'overcrowding', 'safety', 'other'];
const VALID_STATUSES = ['submitted', 'investigating', 'resolved', 'closed'];

// GET /api/v1/issues
// Students see their own; Admin/Transport Manager see all
router.get('/', requireAuth, (req, res) => {
  const isStaff = ['admin', 'transport_manager'].includes(req.user.role);

  let issues = isStaff
    ? db.collection('transport_issues')
    : db.find('transport_issues', i => i.reporter_id === req.user.id);

  // Enrich issues with route, bus, reporter names
  const enriched = issues.map(issue => {
    const route = issue.route_id ? db.findOne('routes', r => r.id === issue.route_id) : null;
    const bus = issue.bus_id ? db.findOne('buses', b => b.id === issue.bus_id) : null;
    const stop = issue.stop_id ? db.findOne('stops', s => s.id === issue.stop_id) : null;
    const reporter = db.findOne('profiles', p => p.id === issue.reporter_id);

    return {
      ...issue,
      route_name: route ? `${route.route_number} - ${route.name}` : null,
      bus_number: bus ? bus.bus_number : null,
      stop_name: stop ? stop.name : null,
      reporter_name: reporter ? reporter.full_name : 'Anonymous',
      reporter_email: reporter ? reporter.email : null
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return res.json({ success: true, count: enriched.length, issues: enriched });
});

// POST /api/v1/issues
// Submit a new transport issue
router.post('/', requireAuth, (req, res) => {
  const { category, description, route_id, stop_id, bus_id, incident_at, priority } = req.body;

  if (!category || !description) {
    return res.status(400).json({ success: false, error: 'Category and description are required' });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Invalid category. Must be one of: [${VALID_CATEGORIES.join(', ')}]`
    });
  }

  const newIssue = db.insert('transport_issues', {
    reporter_id: req.user.id,
    route_id: route_id || null,
    stop_id: stop_id || null,
    bus_id: bus_id || null,
    category,
    description: description.trim(),
    incident_at: incident_at || new Date().toISOString(),
    priority: priority && ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
    status: 'submitted',
    resolution_notes: null
  });

  return res.status(201).json({
    success: true,
    message: 'Transport issue report submitted successfully. Staff will review it shortly.',
    issue: newIssue
  });
});

// PATCH /api/v1/issues/:id/status
// Staff updates status and resolution notes
router.patch('/:id/status', requireAuth, requireRole(['admin', 'transport_manager']), (req, res) => {
  const { status, resolution_notes, priority, assigned_to } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
    });
  }

  const updates = {};
  if (status) updates.status = status;
  if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;
  if (priority) updates.priority = priority;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;

  const updated = db.update('transport_issues', i => i.id === req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Issue report not found' });
  }

  return res.json({
    success: true,
    message: 'Issue report updated successfully',
    issue: updated
  });
});

module.exports = router;

