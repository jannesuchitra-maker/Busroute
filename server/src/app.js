// ============================================================================
// RouteReady Campus - Express Application Setup
// ============================================================================

const path = require('path');
const fs = require('fs');
const http = require('http');

let express;
let hasExpress = false;
try {
  express = require('express');
  hasExpress = true;
} catch (e) {
  hasExpress = false;
}

const config = require('./config/env');
const { authenticate } = require('./middleware/auth');

// Route modules
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const stopRoutes = require('./routes/stopRoutes');
const tripRoutes = require('./routes/tripRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const issueRoutes = require('./routes/issueRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const alertRoutes = require('./routes/alertRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminRoutes = require('./routes/adminRoutes');

let app;

if (hasExpress) {
  app = express();

  // Basic CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Body parser with sensible size limit
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Attach auth context from Bearer token
  app.use(authenticate);

  // Serve static client assets
  const clientDir = path.resolve(__dirname, '../../client');
  app.use(express.static(clientDir));

  // Mount API Endpoints
  app.get('/api/v1/health', (req, res) => {
    res.json({
      status: 'healthy',
      institution: config.COLLEGE.name,
      code: config.COLLEGE.code,
      tracking_mode: config.BUS_TRACKING_MODE,
      server_time: new Date().toISOString()
    });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/routes', routeRoutes);
  app.use('/api/v1/stops', stopRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/tracking', trackingRoutes);
  app.use('/api/v1/favorites', favoriteRoutes);
  app.use('/api/v1/issues', issueRoutes);
  app.use('/api/v1/announcements', announcementRoutes);
  app.use('/api/v1/alerts', alertRoutes);
  app.use('/api/v1/feedback', feedbackRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 404 handler for API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint ${req.method} ${req.url} not found` });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[ServerError]', err);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred',
      message: config.NODE_ENV === 'development' ? err.message : undefined
    });
  });
} else {
  // Built-in Native Dispatcher Fallback (in case node_modules are not yet downloaded)
  console.log('[App] Express not installed in node_modules yet. Using built-in HTTP engine.');
  // We will provide a clean native bridge in server.js
}

module.exports = { app, hasExpress };

