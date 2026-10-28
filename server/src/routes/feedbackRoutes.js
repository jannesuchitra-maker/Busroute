// ============================================================================
// RouteReady Campus - Feedback & Ratings API
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// GET /api/v1/feedback
router.get('/', (req, res) => {
  const { route_id } = req.query;
  let feedback = db.collection('feedback');

  if (route_id) {
    feedback = feedback.filter(f => f.route_id === route_id);
  }

  const enriched = feedback.map(f => {
    const user = db.findOne('profiles', p => p.id === f.user_id);
    const route = f.route_id ? db.findOne('routes', r => r.id === f.route_id) : null;
    return {
      ...f,
      user_name: user ? user.full_name : 'Anonymous Student',
      route_name: route ? `${route.route_number} - ${route.name}` : 'General Transport'
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const averageRating = enriched.length > 0
    ? Number((enriched.reduce((acc, curr) => acc + curr.rating, 0) / enriched.length).toFixed(1))
    : 0;

  return res.json({
    success: true,
    count: enriched.length,
    average_rating: averageRating,
    feedback: enriched
  });
});

// POST /api/v1/feedback
router.post('/', requireAuth, (req, res) => {
  const { route_id, trip_id, rating, comment } = req.body;

  const nRating = parseInt(rating, 10);
  if (isNaN(nRating) || nRating < 1 || nRating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
  }

  const newFeedback = db.insert('feedback', {
    user_id: req.user.id,
    route_id: route_id || null,
    trip_id: trip_id || null,
    rating: nRating,
    comment: comment ? comment.trim() : null
  });

  return res.status(201).json({
    success: true,
    message: 'Thank you for your feedback!',
    feedback: newFeedback
  });
});

module.exports = router;

