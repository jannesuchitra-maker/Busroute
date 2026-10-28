// ============================================================================
// RouteReady Campus - Favorites API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/v1/favorites
// User views their saved favorite routes
router.get('/', requireAuth, (req, res) => {
  const userFavorites = db.find('favorite_routes', f => f.user_id === req.user.id);
  const routeIds = userFavorites.map(f => f.route_id);

  const routes = routeIds.map(rid => {
    const route = db.findOne('routes', r => r.id === rid);
    if (!route) return null;
    const stopsCount = db.find('route_stops', rs => rs.route_id === rid).length;
    return {
      ...route,
      total_stops: stopsCount
    };
  }).filter(Boolean);

  return res.json({
    success: true,
    favorites: routes,
    favorite_ids: routeIds
  });
});

// POST /api/v1/favorites/:routeId
router.post('/:routeId', requireAuth, (req, res) => {
  const { routeId } = req.params;
  const route = db.findOne('routes', r => r.id === routeId);
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }

  const existing = db.findOne('favorite_routes', f => f.user_id === req.user.id && f.route_id === routeId);
  if (existing) {
    return res.json({ success: true, message: 'Route already in favorites' });
  }

  db.insert('favorite_routes', {
    user_id: req.user.id,
    route_id: routeId,
    created_at: new Date().toISOString()
  });

  return res.status(201).json({ success: true, message: 'Added to favorite routes' });
});

// DELETE /api/v1/favorites/:routeId
router.delete('/:routeId', requireAuth, (req, res) => {
  const { routeId } = req.params;
  db.delete('favorite_routes', f => f.user_id === req.user.id && f.route_id === routeId);
  return res.json({ success: true, message: 'Removed from favorite routes' });
});

module.exports = router;

