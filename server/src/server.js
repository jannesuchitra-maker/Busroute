// ============================================================================
// RouteReady Campus - Server Entry Point
// ============================================================================

const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const config = require('./config/env');
const simulationEngine = require('./utils/simulationEngine');
const { app, hasExpress } = require('./app');

const PORT = config.PORT;

// If express is available, listen directly
if (hasExpress && app) {
  const server = app.listen(PORT, () => {
    printBanner();
  });

  if (config.BUS_TRACKING_MODE === 'simulated') {
    simulationEngine.start();
  }

  handleShutdown(server);
} else {
  // Ultra-resilient Native HTTP Engine
  // Serves frontend static files and delegates API requests seamlessly
  const db = require('./config/database');
  const { calculateDistance, estimateWalkMinutes } = require('./utils/haversine');
  const { createToken, verifyToken } = require('./middleware/auth');

  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const clientDir = path.resolve(__dirname, '../../client');

  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Helper: Send JSON
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // Helper: Parse Body
    const getBody = (cb) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          cb(body ? JSON.parse(body) : {});
        } catch (e) {
          cb({});
        }
      });
    };

    // Helper: Get Auth User
    const getAuthUser = () => {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.substring(7).trim();
      const payload = verifyToken(token);
      if (!payload) return null;
      return db.findOne('profiles', p => p.id === payload.userId);
    };

    // --- API ROUTER ---
    if (pathname.startsWith('/api/v1/')) {
      const user = getAuthUser();

      // Health
      if (pathname === '/api/v1/health') {
        return sendJson(200, {
          status: 'healthy',
          institution: config.COLLEGE.name,
          tracking_mode: config.BUS_TRACKING_MODE,
          server_time: new Date().toISOString()
        });
      }

      // Auth Register
      if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
        return getBody(body => {
          const { full_name, email, password, phone } = body;
          if (!full_name || !email || !password) {
            return sendJson(400, { success: false, error: 'full_name, email, and password are required' });
          }
          const existing = db.findOne('profiles', p => p.email.toLowerCase() === email.toLowerCase().trim());
          if (existing) {
            return sendJson(409, { success: false, error: 'Email already exists' });
          }
          const newProfile = db.insert('profiles', {
            college_id: config.COLLEGE.id,
            full_name: full_name.trim(),
            email: email.toLowerCase().trim(),
            role: 'student',
            phone: phone || null,
            password_hash: password,
            is_active: true
          });
          const token = createToken(newProfile);
          const safe = { ...newProfile };
          delete safe.password_hash;
          return sendJson(201, { success: true, message: 'Registration successful', token, user: safe });
        });
      }

      // Auth Login
      if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
        return getBody(body => {
          const { email, password } = body;
          const u = db.findOne('profiles', p => p.email.toLowerCase() === (email || '').toLowerCase().trim());
          if (!u || u.password_hash !== password) {
            return sendJson(401, { success: false, error: 'Invalid email or password' });
          }
          const token = createToken(u);
          const safe = { ...u };
          delete safe.password_hash;
          return sendJson(200, { success: true, message: 'Sign-in successful', token, user: safe });
        });
      }

      // Auth Me
      if (pathname === '/api/v1/auth/me' && req.method === 'GET') {
        if (!user) return sendJson(401, { success: false, error: 'Authentication required' });
        const safe = { ...user };
        delete safe.password_hash;
        return sendJson(200, { success: true, user: safe });
      }

      // Routes List
      if (pathname === '/api/v1/routes' && req.method === 'GET') {
        const { q, origin_stop_id, destination_stop_id } = parsedUrl.query;
        let routes = db.find('routes', r => r.status === 'published');

        if (q) {
          const term = q.toLowerCase();
          routes = routes.filter(r => r.route_number.toLowerCase().includes(term) || r.name.toLowerCase().includes(term));
        }

        if (origin_stop_id && destination_stop_id) {
          routes = routes.filter(route => {
            const stops = db.find('route_stops', rs => rs.route_id === route.id).sort((a, b) => a.stop_sequence - b.stop_sequence);
            const oIdx = stops.findIndex(s => s.stop_id === origin_stop_id);
            const dIdx = stops.findIndex(s => s.stop_id === destination_stop_id);
            return oIdx !== -1 && dIdx !== -1 && oIdx < dIdx;
          });
        }

        const enriched = routes.map(r => {
          const rStops = db.find('route_stops', rs => rs.route_id === r.id);
          const activeTrip = db.findOne('trips', t => t.route_id === r.id && t.status === 'active');
          const bus = activeTrip ? db.findOne('buses', b => b.id === activeTrip.bus_id) : null;
          const occ = bus ? db.find('bus_occupancy', o => o.bus_id === bus.id)[0] : null;

          return {
            ...r,
            total_stops: rStops.length,
            assigned_bus_number: bus ? bus.bus_number : null,
            seat_capacity: bus ? bus.seat_capacity : null,
            available_seats: (bus && occ) ? Math.max(0, bus.seat_capacity - occ.occupied_seats) : null
          };
        });

        return sendJson(200, { success: true, count: enriched.length, routes: enriched });
      }

      // Route Detail
      if (pathname.startsWith('/api/v1/routes/') && req.method === 'GET') {
        const routeId = pathname.split('/')[4];
        const route = db.findOne('routes', r => r.id === routeId);
        if (!route) return sendJson(404, { success: false, error: 'Route not found' });

        const routeStops = db.find('route_stops', rs => rs.route_id === route.id)
          .sort((a, b) => a.stop_sequence - b.stop_sequence)
          .map(rs => {
            const stop = db.findOne('stops', s => s.id === rs.stop_id);
            return {
              sequence: rs.stop_sequence,
              stop_id: rs.stop_id,
              name: stop ? stop.name : '',
              latitude: stop ? stop.latitude : null,
              longitude: stop ? stop.longitude : null,
              address_label: stop ? stop.address_label : '',
              is_accessible: stop ? stop.is_accessible : false,
              scheduled_arrival_offset_minutes: rs.scheduled_arrival_offset_minutes,
              scheduled_departure_offset_minutes: rs.scheduled_departure_offset_minutes
            };
          });

        const activeTrip = db.findOne('trips', t => t.route_id === route.id);
        const bus = activeTrip ? db.findOne('buses', b => b.id === activeTrip.bus_id) : null;
        const occ = bus ? db.find('bus_occupancy', o => o.bus_id === bus.id)[0] : null;

        return sendJson(200, {
          success: true,
          route: {
            ...route,
            stops: routeStops,
            assigned_bus: bus ? {
              bus_number: bus.bus_number,
              registration_number: bus.registration_number,
              seat_capacity: bus.seat_capacity,
              occupied_seats: occ ? occ.occupied_seats : null,
              available_seats: occ ? Math.max(0, bus.seat_capacity - occ.occupied_seats) : null
            } : null
          }
        });
      }

      // Stops List & Geo Search
      if (pathname === '/api/v1/stops' && req.method === 'GET') {
        const { q, lat, lng } = parsedUrl.query;
        let stops = db.find('stops', s => s.is_active);

        if (q) {
          const term = q.toLowerCase();
          stops = stops.filter(s => s.name.toLowerCase().includes(term));
        }

        if (lat !== undefined && lng !== undefined) {
          const uLat = parseFloat(lat);
          const uLng = parseFloat(lng);
          stops = stops.map(stop => {
            const dist = calculateDistance(uLat, uLng, stop.latitude, stop.longitude);
            return {
              ...stop,
              distance_meters: dist.meters,
              distance_km: dist.kilometers,
              estimated_walk_minutes: estimateWalkMinutes(dist.meters)
            };
          }).sort((a, b) => a.distance_meters - b.distance_meters);
        }

        const enriched = stops.map(stop => {
          const rStops = db.find('route_stops', rs => rs.stop_id === stop.id);
          const routes = rStops.map(rs => {
            const r = db.findOne('routes', route => route.id === rs.route_id);
            return r ? { id: r.id, route_number: r.route_number, name: r.name } : null;
          }).filter(Boolean);

          return { ...stop, routes, routes_count: routes.length };
        });

        return sendJson(200, { success: true, count: enriched.length, stops: enriched });
      }

      // Tracking Live
      if (pathname === '/api/v1/tracking/live' && req.method === 'GET') {
        const positions = simulationEngine.getLivePositions();
        return sendJson(200, {
          success: true,
          mode: config.BUS_TRACKING_MODE,
          count: positions.length,
          positions
        });
      }

      // Driver Trips
      if (pathname === '/api/v1/trips/driver/assigned' && req.method === 'GET') {
        if (!user || user.role !== 'driver') {
          return sendJson(403, { success: false, error: 'Driver access required' });
        }
        const trips = db.find('trips', t => t.driver_id === user.id).map(trip => {
          const route = db.findOne('routes', r => r.id === trip.route_id);
          const bus = db.findOne('buses', b => b.id === trip.bus_id);
          const routeStops = db.find('route_stops', rs => rs.route_id === trip.route_id)
            .sort((a, b) => a.stop_sequence - b.stop_sequence)
            .map(rs => {
              const stop = db.findOne('stops', s => s.id === rs.stop_id);
              return { sequence: rs.stop_sequence, name: stop ? stop.name : '' };
            });

          return {
            ...trip,
            route: route ? { id: route.id, route_number: route.route_number, name: route.name } : null,
            bus: bus ? { bus_number: bus.bus_number, registration_number: bus.registration_number, seat_capacity: bus.seat_capacity } : null,
            stops: routeStops
          };
        });
        return sendJson(200, { success: true, trips });
      }

      // Trip Start
      if (pathname.includes('/trips/') && pathname.endsWith('/start') && req.method === 'POST') {
        const tripId = pathname.split('/')[4];
        const updated = db.update('trips', t => t.id === tripId, { status: 'active', actual_start_at: new Date().toISOString() });
        return sendJson(200, { success: true, message: 'Trip started', trip: updated });
      }

      // Trip End
      if (pathname.includes('/trips/') && pathname.endsWith('/end') && req.method === 'POST') {
        const tripId = pathname.split('/')[4];
        const updated = db.update('trips', t => t.id === tripId, { status: 'completed', actual_end_at: new Date().toISOString() });
        return sendJson(200, { success: true, message: 'Trip completed', trip: updated });
      }

      // Driver GPS Location update
      if (pathname === '/api/v1/tracking/location' && req.method === 'POST') {
        return getBody(body => {
          const { trip_id, latitude, longitude } = body;
          const loc = {
            trip_id,
            latitude: Number(latitude),
            longitude: Number(longitude),
            recorded_at: new Date().toISOString(),
            source: 'gps',
            is_simulated: false
          };
          db.collection('bus_locations').unshift(loc);
          db.saveData();
          return sendJson(201, { success: true, message: 'Location recorded', location: loc });
        });
      }

      // Occupancy update
      if (pathname === '/api/v1/tracking/occupancy' && req.method === 'POST') {
        return getBody(body => {
          const { bus_id, occupied_seats } = body;
          const nOcc = parseInt(occupied_seats, 10);
          const existing = db.findOne('bus_occupancy', o => o.bus_id === bus_id);
          if (existing) {
            existing.occupied_seats = nOcc;
            existing.recorded_at = new Date().toISOString();
          } else {
            db.insert('bus_occupancy', { bus_id, occupied_seats: nOcc, source: 'driver_manual' });
          }
          db.saveData();
          return sendJson(200, { success: true, message: 'Occupancy updated' });
        });
      }

      // Favorites
      if (pathname === '/api/v1/favorites' && req.method === 'GET') {
        if (!user) return sendJson(401, { success: false, error: 'Auth required' });
        const favs = db.find('favorite_routes', f => f.user_id === user.id);
        const rIds = favs.map(f => f.route_id);
        const routes = rIds.map(id => db.findOne('routes', r => r.id === id)).filter(Boolean);
        return sendJson(200, { success: true, favorites: routes, favorite_ids: rIds });
      }

      if (pathname.startsWith('/api/v1/favorites/') && req.method === 'POST') {
        if (!user) return sendJson(401, { success: false, error: 'Auth required' });
        const rid = pathname.split('/')[4];
        if (!db.findOne('favorite_routes', f => f.user_id === user.id && f.route_id === rid)) {
          db.insert('favorite_routes', { user_id: user.id, route_id: rid });
        }
        return sendJson(201, { success: true, message: 'Added to favorites' });
      }

      if (pathname.startsWith('/api/v1/favorites/') && req.method === 'DELETE') {
        if (!user) return sendJson(401, { success: false, error: 'Auth required' });
        const rid = pathname.split('/')[4];
        db.delete('favorite_routes', f => f.user_id === user.id && f.route_id === rid);
        return sendJson(200, { success: true, message: 'Removed from favorites' });
      }

      // Issues
      if (pathname === '/api/v1/issues' && req.method === 'GET') {
        if (!user) return sendJson(401, { success: false, error: 'Auth required' });
        const isStaff = ['admin', 'transport_manager'].includes(user.role);
        const list = isStaff ? db.collection('transport_issues') : db.find('transport_issues', i => i.reporter_id === user.id);
        const enriched = list.map(i => {
          const r = i.route_id ? db.findOne('routes', route => route.id === i.route_id) : null;
          return { ...i, route_name: r ? `${r.route_number} - ${r.name}` : null };
        });
        return sendJson(200, { success: true, issues: enriched });
      }

      if (pathname === '/api/v1/issues' && req.method === 'POST') {
        if (!user) return sendJson(401, { success: false, error: 'Auth required' });
        return getBody(body => {
          const { category, description, route_id, priority } = body;
          const newIssue = db.insert('transport_issues', {
            reporter_id: user.id,
            category,
            description,
            route_id: route_id || null,
            priority: priority || 'medium',
            status: 'submitted'
          });
          return sendJson(201, { success: true, message: 'Issue submitted', issue: newIssue });
        });
      }

      if (pathname.startsWith('/api/v1/issues/') && pathname.endsWith('/status') && req.method === 'PATCH') {
        const issueId = pathname.split('/')[4];
        return getBody(body => {
          const updated = db.update('transport_issues', i => i.id === issueId, { status: body.status, resolution_notes: body.resolution_notes });
          return sendJson(200, { success: true, message: 'Status updated', issue: updated });
        });
      }

      // Announcements
      if (pathname === '/api/v1/announcements' && req.method === 'GET') {
        const anns = db.find('announcements', a => a.is_published);
        return sendJson(200, { success: true, announcements: anns });
      }

      if (pathname === '/api/v1/announcements' && req.method === 'POST') {
        return getBody(body => {
          const newAnn = db.insert('announcements', {
            college_id: config.COLLEGE.id,
            title: body.title,
            body: body.body,
            severity: body.severity || 'info',
            is_published: true
          });
          return sendJson(201, { success: true, announcement: newAnn });
        });
      }

      // Service Alerts
      if (pathname === '/api/v1/alerts' && req.method === 'GET') {
        const alerts = db.find('service_alerts', a => a.status === 'active');
        return sendJson(200, { success: true, alerts });
      }

      if (pathname === '/api/v1/alerts' && req.method === 'POST') {
        return getBody(body => {
          const newAlert = db.insert('service_alerts', {
            college_id: config.COLLEGE.id,
            title: body.title,
            description: body.description,
            severity: body.severity || 'warning',
            status: 'active'
          });
          return sendJson(201, { success: true, alert: newAlert });
        });
      }

      // Feedback
      if (pathname === '/api/v1/feedback' && req.method === 'GET') {
        const fb = db.collection('feedback').map(f => {
          const u = db.findOne('profiles', p => p.id === f.user_id);
          return { ...f, user_name: u ? u.full_name : 'Anonymous Student' };
        });
        return sendJson(200, { success: true, feedback: fb });
      }

      if (pathname === '/api/v1/feedback' && req.method === 'POST') {
        if (!user) return sendJson(401, { success: false, error: 'Auth required' });
        return getBody(body => {
          const newFb = db.insert('feedback', {
            user_id: user.id,
            route_id: body.route_id || null,
            rating: parseInt(body.rating, 10),
            comment: body.comment || ''
          });
          return sendJson(201, { success: true, feedback: newFb });
        });
      }

      // Admin Analytics
      if (pathname === '/api/v1/admin/analytics' && req.method === 'GET') {
        const routes = db.collection('routes');
        const buses = db.collection('buses');
        const stops = db.collection('stops');
        const trips = db.collection('trips');
        const issues = db.collection('transport_issues');
        const totalSeats = buses.reduce((acc, b) => acc + (b.seat_capacity || 0), 0);
        const totalOcc = db.collection('bus_occupancy').reduce((acc, o) => acc + (o.occupied_seats || 0), 0);

        return sendJson(200, {
          success: true,
          analytics: {
            total_routes: routes.length,
            total_buses: buses.length,
            total_stops: stops.length,
            active_trips: trips.filter(t => t.status === 'active').length,
            open_issues: issues.filter(i => ['submitted', 'investigating'].includes(i.status)).length,
            fleet_seat_capacity: totalSeats,
            current_occupied_seats: totalOcc,
            fleet_occupancy_percentage: totalSeats > 0 ? Math.round((totalOcc / totalSeats) * 100) : 0
          }
        });
      }

      // Admin Buses CRUD
      if (pathname === '/api/v1/admin/buses' && req.method === 'GET') {
        return sendJson(200, { success: true, buses: db.collection('buses') });
      }

      if (pathname === '/api/v1/admin/buses' && req.method === 'POST') {
        return getBody(body => {
          const b = db.insert('buses', {
            college_id: config.COLLEGE.id,
            bus_number: body.bus_number,
            registration_number: body.registration_number,
            seat_capacity: parseInt(body.seat_capacity, 10),
            status: 'active'
          });
          return sendJson(201, { success: true, bus: b });
        });
      }

      // Admin Users
      if (pathname === '/api/v1/admin/users' && req.method === 'GET') {
        const users = db.collection('profiles').map(u => {
          const safe = { ...u };
          delete safe.password_hash;
          return safe;
        });
        return sendJson(200, { success: true, users });
      }

      if (pathname.startsWith('/api/v1/admin/users/') && pathname.endsWith('/role') && req.method === 'PATCH') {
        const uid = pathname.split('/')[5];
        return getBody(body => {
          const updated = db.update('profiles', p => p.id === uid, { role: body.role });
          const safe = { ...updated };
          delete safe.password_hash;
          return sendJson(200, { success: true, user: safe });
        });
      }

      return sendJson(404, { success: false, error: 'Endpoint not found' });
    }

    // --- STATIC FILES HANDLER ---
    let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }

    let filePath = path.join(clientDir, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback for HTML5 navigation
        filePath = path.join(clientDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('File not found');
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  });

  server.listen(PORT, () => {
    printBanner();
  });

  if (config.BUS_TRACKING_MODE === 'simulated') {
    simulationEngine.start();
  }

  handleShutdown(server);
}

function printBanner() {
  console.log('================================================================');
  console.log('  RouteReady Campus - College Bus Route & Timetable Planner');
  console.log('  Institution: Malla Reddy Engineering College for Women (MRECW)');
  console.log('================================================================');
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  Tracking Mode:     ${config.BUS_TRACKING_MODE.toUpperCase()}`);
  console.log('----------------------------------------------------------------');
  console.log('  Demo Login Credentials:');
  console.log('   * Student:           student@mrecw.ac.in   / Student@123');
  console.log('   * Driver:            driver@mrecw.ac.in    / Driver@123');
  console.log('   * Admin:             admin@mrecw.ac.in     / Admin@123');
  console.log('   * Transport Manager: manager@mrecw.ac.in   / Manager@123');
  console.log('================================================================\n');
}

function handleShutdown(server) {
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    simulationEngine.stop();
    server.close(() => {
      console.log('[Server] Closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

