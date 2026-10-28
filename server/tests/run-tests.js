// ============================================================================
// RouteReady Campus - Direct In-Memory Automated Test Suite
// ============================================================================

const assert = require('assert');
const { Readable } = require('stream');
const http = require('http');

const config = require('../src/config/env');
const db = require('../src/config/database');
const { calculateDistance, estimateWalkMinutes } = require('../src/utils/haversine');
const { createToken, verifyToken } = require('../src/middleware/auth');
const simulationEngine = require('../src/utils/simulationEngine');
const { app } = require('../src/app');

console.log('--- Starting RouteReady Campus Test Suite ---');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// 1. Haversine Geographic Distance Tests
it('Haversine: Calculates distance correctly between JNTU and MRECW', () => {
  const dist = calculateDistance(17.4981, 78.3897, 17.5615, 78.4485);
  assert(dist.meters > 9000 && dist.meters < 12000, `Expected ~10km, got ${dist.meters}m`);
  assert(dist.kilometers >= 9.0 && dist.kilometers <= 12.0);
  const walkMins = estimateWalkMinutes(dist.meters);
  assert(walkMins > 100, `Expected > 100 mins walk, got ${walkMins}`);
});

it('Haversine: Returns 0 for identical points', () => {
  const dist = calculateDistance(17.5615, 78.4485, 17.5615, 78.4485);
  assert.strictEqual(dist.meters, 0);
  assert.strictEqual(dist.kilometers, 0);
});

// 2. Auth & Token Tests
it('Auth: Generates and verifies JWT session tokens correctly', () => {
  const user = {
    id: 'b0000000-0000-0000-0000-000000000001',
    role: 'student',
    email: 'student@mrecw.ac.in',
    college_id: config.COLLEGE.id
  };
  const token = createToken(user);
  assert(token.includes('.'), 'Token must contain signature delimiter');
  const payload = verifyToken(token);
  assert(payload !== null, 'Token verification must succeed');
  assert.strictEqual(payload.userId, user.id);
  assert.strictEqual(payload.role, 'student');
});

it('Auth: Rejects tampered tokens', () => {
  const user = { id: 'test-1', role: 'student', email: 'test@mrecw.ac.in' };
  const token = createToken(user);
  const tampered = token.slice(0, -4) + 'abcd';
  const payload = verifyToken(tampered);
  assert.strictEqual(payload, null);
});

// 3. Database State Tests
it('Database: Loads pre-seeded routes, buses, and stops for MRECW', () => {
  const routes = db.collection('routes');
  assert(routes.length >= 4, `Expected at least 4 routes, found ${routes.length}`);
  const r1 = db.findOne('routes', r => r.route_number === 'R-01');
  assert(r1, 'Route R-01 must exist');

  const buses = db.collection('buses');
  assert(buses.length >= 4, 'Buses must be seeded');

  const stops = db.collection('stops');
  assert(stops.length >= 15, `Expected >= 15 stops, found ${stops.length}`);
});

it('Database: Verifies route stops sequence ordering', () => {
  const r1Stops = db.find('route_stops', rs => rs.route_id === 'e0000000-0000-0000-0000-000000000001')
    .sort((a, b) => a.stop_sequence - b.stop_sequence);

  assert.strictEqual(r1Stops.length, 7, 'Route 1 should have 7 stops');
  assert.strictEqual(r1Stops[0].stop_sequence, 1);
  assert.strictEqual(r1Stops[6].stop_sequence, 7);
  assert.strictEqual(r1Stops[6].stop_id, 'd0000000-0000-0000-0000-000000000000');
});

// 4. Simulation Engine Tests
it('SimulationEngine: Generates valid live bus positions for active trips', () => {
  simulationEngine.tick();
  const positions = simulationEngine.getLivePositions();
  assert(positions.length > 0, 'Should have at least 1 live simulated bus position');
  const pos = positions[0];
  assert(pos.latitude >= 17.0 && pos.latitude <= 18.0, `Invalid latitude: ${pos.latitude}`);
  assert(pos.longitude >= 78.0 && pos.longitude <= 79.0, `Invalid longitude: ${pos.longitude}`);
  assert.strictEqual(pos.is_simulated, true);
  assert.strictEqual(pos.label, 'DEMO / SIMULATED');
});

// 5. In-Memory Request / Response Dispatcher compatible with official Express & ServerResponse
function mockDispatch(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const rawBody = body ? JSON.stringify(body) : null;
    const req = new http.IncomingMessage(null);
    req.method = method;
    req.url = path;
    req.headers = {
      'content-type': 'application/json',
      ...(rawBody ? { 'content-length': Buffer.byteLength(rawBody) } : {}),
      ...headers
    };

    if (rawBody) {
      req.push(rawBody);
    }
    req.push(null);

    const res = new http.ServerResponse(req);
    let responseData = '';

    res.write = function (chunk) {
      if (chunk) responseData += chunk;
      return true;
    };

    res.end = function (chunk) {
      if (chunk) responseData += chunk;
      let parsed = responseData;
      try {
        parsed = JSON.parse(responseData);
      } catch (e) {}
      resolve({ statusCode: res.statusCode, headers: res.getHeaders ? res.getHeaders() : {}, data: parsed });
    };

    app(req, res);
  });
}

(async () => {
  await itAsync('API: GET /api/v1/health returns 200 healthy', async () => {
    const res = await mockDispatch('GET', '/api/v1/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.status, 'healthy');
    assert.strictEqual(res.data.code, 'MRECW');
  });

  await itAsync('API: GET /api/v1/routes lists published routes', async () => {
    const res = await mockDispatch('GET', '/api/v1/routes');
    assert.strictEqual(res.statusCode, 200);
    assert(res.data.routes.length >= 4);
    assert.strictEqual(res.data.routes[0].route_number, 'R-01');
  });

  await itAsync('API: GET /api/v1/routes/:id returns stops and timetable offsets', async () => {
    const res = await mockDispatch('GET', '/api/v1/routes/e0000000-0000-0000-0000-000000000001');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.route.stops.length, 7);
  });

  await itAsync('API: Origin-Destination search validates stop sequence order', async () => {
    const kphb = 'd0000000-0000-0000-0000-000000000001';
    const mrecw = 'd0000000-0000-0000-0000-000000000000';
    const res = await mockDispatch('GET', `/api/v1/routes?origin_stop_id=${kphb}&destination_stop_id=${mrecw}`);
    assert.strictEqual(res.statusCode, 200);
    assert(res.data.routes.length >= 1);
    assert.strictEqual(res.data.routes[0].route_number, 'R-01');
    assert.strictEqual(res.data.routes[0].origin_destination_search.intermediate_stops, 5);
  });

  await itAsync('API: GET /api/v1/stops with coordinates returns nearest stops', async () => {
    const res = await mockDispatch('GET', '/api/v1/stops?lat=17.5000&lng=78.3900');
    assert.strictEqual(res.statusCode, 200);
    assert(res.data.stops.length > 0);
    assert(res.data.stops[0].distance_meters > 0);
  });

  await itAsync('API: POST /api/v1/auth/login succeeds with valid credentials', async () => {
    const res = await mockDispatch('POST', '/api/v1/auth/login', {
      email: 'student@mrecw.ac.in',
      password: 'Student@123'
    });
    assert.strictEqual(res.statusCode, 200);
    assert(res.data.token);
  });

  await itAsync('Security: Protected admin routes reject unauthorized student token with 403', async () => {
    const token = createToken({ id: 'b0000000-0000-0000-0000-000000000001', role: 'student', email: 'student@mrecw.ac.in' });
    const res = await mockDispatch('PATCH', '/api/v1/admin/users/b0000000-0000-0000-0000-000000000001/role', {
      role: 'admin'
    }, {
      authorization: `Bearer ${token}`
    });
    assert.strictEqual(res.statusCode, 403);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
