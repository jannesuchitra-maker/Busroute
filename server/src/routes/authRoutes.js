// ============================================================================
// RouteReady Campus - Auth API Routes
// ============================================================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config/env');
const { createToken, requireAuth } = require('../middleware/auth');
const { isValidEmail } = require('../middleware/validation');

// POST /api/v1/auth/register
// Students can register with email and password
// PRIVILEGE ESCALATION PREVENTION: Public registration cannot choose admin or transport_manager!
router.post('/register', (req, res) => {
  const { full_name, email, password, phone } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'full_name, email, and password are required'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address format'
    });
  }

  const existing = db.findOne('profiles', p => p.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists'
    });
  }

  // Always force student role for public self-registration
  const newProfile = db.insert('profiles', {
    college_id: config.COLLEGE.id,
    full_name: full_name.trim(),
    email: email.toLowerCase().trim(),
    role: 'student',
    phone: phone ? phone.trim() : null,
    password_hash: password, // For local demonstration
    is_active: true
  });

  // Default notification preferences
  db.insert('notification_preferences', {
    user_id: newProfile.id,
    email_enabled: true,
    in_app_enabled: true
  });

  const token = createToken(newProfile);

  const safeProfile = { ...newProfile };
  delete safeProfile.password_hash;

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: safeProfile
  });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  const user = db.findOne('profiles', p => p.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || user.password_hash !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      error: 'Your account has been deactivated. Please contact transport admin.'
    });
  }

  const token = createToken(user);
  const safeProfile = { ...user };
  delete safeProfile.password_hash;

  return res.json({
    success: true,
    message: 'Sign-in successful',
    token,
    user: safeProfile
  });
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, (req, res) => {
  const safeUser = { ...req.user };
  delete safeUser.password_hash;

  const prefs = db.findOne('notification_preferences', p => p.user_id === req.user.id) || {
    email_enabled: true,
    in_app_enabled: true
  };

  return res.json({
    success: true,
    user: safeUser,
    preferences: prefs
  });
});

// PUT /api/v1/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  const { full_name, phone, email_enabled, in_app_enabled } = req.body;

  const updates = {};
  if (full_name) updates.full_name = full_name.trim();
  if (phone !== undefined) updates.phone = phone ? phone.trim() : null;

  const updatedUser = db.update('profiles', p => p.id === req.user.id, updates);

  if (email_enabled !== undefined || in_app_enabled !== undefined) {
    const prefUpdates = {};
    if (email_enabled !== undefined) prefUpdates.email_enabled = Boolean(email_enabled);
    if (in_app_enabled !== undefined) prefUpdates.in_app_enabled = Boolean(in_app_enabled);

    const existingPref = db.findOne('notification_preferences', p => p.user_id === req.user.id);
    if (existingPref) {
      db.update('notification_preferences', p => p.user_id === req.user.id, prefUpdates);
    } else {
      db.insert('notification_preferences', { user_id: req.user.id, ...prefUpdates });
    }
  }

  const safeProfile = { ...updatedUser };
  delete safeProfile.password_hash;

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: safeProfile
  });
});

module.exports = router;

