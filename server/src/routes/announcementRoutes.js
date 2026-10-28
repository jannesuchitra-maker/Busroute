// ============================================================================
// RouteReady Campus - Announcements API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// GET /api/v1/announcements
router.get('/', (req, res) => {
  const isStaff = req.user && ['admin', 'transport_manager'].includes(req.user.role);

  const announcements = db.find('announcements', a => {
    if (!isStaff && !a.is_published) return false;
    return true;
  }).sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

  return res.json({ success: true, count: announcements.length, announcements });
});

// POST /api/v1/announcements
router.post('/', requireAuth, requireRole(['admin', 'transport_manager']), (req, res) => {
  const { title, body, severity } = req.body;

  if (!title || !body) {
    return res.status(400).json({ success: false, error: 'Title and body are required' });
  }

  const newAnn = db.insert('announcements', {
    college_id: config.COLLEGE.id,
    title: title.trim(),
    body: body.trim(),
    severity: severity && ['info', 'warning', 'critical'].includes(severity) ? severity : 'info',
    published_at: new Date().toISOString(),
    is_published: true,
    created_by: req.user.id
  });

  return res.status(201).json({ success: true, message: 'Announcement published', announcement: newAnn });
});

// DELETE /api/v1/announcements/:id
router.delete('/:id', requireAuth, requireRole(['admin', 'transport_manager']), (req, res) => {
  const removed = db.delete('announcements', a => a.id === req.params.id);
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Announcement not found' });
  }
  return res.json({ success: true, message: 'Announcement deleted' });
});

module.exports = router;

