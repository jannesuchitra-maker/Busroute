// ============================================================================
// RouteReady Campus - Authentication Middleware
// ============================================================================

const crypto = require('crypto');
const db = require('../config/database');
const config = require('../config/env');

/**
 * Creates a signed token for user session
 */
function createToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    college_id: user.college_id,
    exp: Date.now() + 7 * 24 * 3600 * 1000 // 7 days
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString('base64');
  const signature = crypto.createHmac('sha256', config.SESSION_SECRET).update(b64).digest('hex');
  return `${b64}.${signature}`;
}

/**
 * Verifies a token and returns the payload if valid
 */
function verifyToken(token) {
  if (!token) return null;

  // Convenience mock tokens for testing/evaluation
  if (token === 'demo-student-token') {
    return { userId: 'b0000000-0000-0000-0000-000000000001', role: 'student', email: 'student@mrecw.ac.in' };
  }
  if (token === 'demo-driver-token') {
    return { userId: 'b0000000-0000-0000-0000-000000000002', role: 'driver', email: 'driver@mrecw.ac.in' };
  }
  if (token === 'demo-admin-token') {
    return { userId: 'b0000000-0000-0000-0000-000000000003', role: 'admin', email: 'admin@mrecw.ac.in' };
  }
  if (token === 'demo-manager-token') {
    return { userId: 'b0000000-0000-0000-0000-000000000004', role: 'transport_manager', email: 'manager@mrecw.ac.in' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [b64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', config.SESSION_SECRET).update(b64).digest('hex');
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Express middleware to authenticate requests via Bearer token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
      code: 'AUTH_TOKEN_EXPIRED'
    });
  }

  // Fetch full user from database
  const user = db.findOne('profiles', p => p.id === payload.userId && p.is_active);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User profile not found or account deactivated',
      code: 'USER_DEACTIVATED'
    });
  }

  req.user = user;
  next();
}

/**
 * Middleware requiring user to be authenticated
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in.',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
}

module.exports = {
  createToken,
  verifyToken,
  authenticate,
  requireAuth
};

