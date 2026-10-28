// ============================================================================
// RouteReady Campus - Environment & Server Configuration
// ============================================================================

const path = require('path');
const fs = require('fs');

// Simple zero-dependency .env file loader
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BUS_TRACKING_MODE: process.env.BUS_TRACKING_MODE || 'simulated',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SESSION_SECRET: process.env.SESSION_SECRET || 'mrecw-routeready-campus-secure-session-key-2026',
  SIMULATION_INTERVAL_MS: parseInt(process.env.SIMULATION_INTERVAL_MS, 10) || 3000,
  GPS_STALE_THRESHOLD_SECONDS: parseInt(process.env.GPS_STALE_THRESHOLD_SECONDS, 10) || 45,
  COLLEGE: {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Malla Reddy Engineering College for Women',
    code: 'MRECW',
    timezone: 'Asia/Kolkata',
    campusCoordinates: {
      latitude: 17.5615000,
      longitude: 78.4485000
    }
  }
};

