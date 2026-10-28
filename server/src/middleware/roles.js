// ============================================================================
// RouteReady Campus - Role Authorization Middleware
// ============================================================================

/**
 * Ensures user has one of the required roles
 * Roles: 'student', 'driver', 'admin', 'transport_manager'
 *
 * @param {string|string[]} roles
 */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowed.join(', ')}]. Your role is '${req.user.role}'.`,
        code: 'FORBIDDEN_ROLE'
      });
    }

    next();
  };
}

module.exports = {
  requireRole
};

