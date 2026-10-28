// ============================================================================
// RouteReady Campus - Simulated Tracking Engine (Demo Mode)
// ============================================================================

const db = require('../config/database');
const config = require('../config/env');

class SimulationEngine {
  constructor() {
    this.timer = null;
    this.intervalMs = config.SIMULATION_INTERVAL_MS;
    // Map of tripId -> { currentStopIndex, progress, heading, speedKmh }
    this.tripStates = new Map();
  }

  start() {
    if (this.timer) return;
    console.log(`[SimulationEngine] Starting DEMO simulation (interval: ${this.intervalMs}ms)`);
    this.tick();
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[SimulationEngine] Stopped DEMO simulation');
    }
  }

  tick() {
    try {
      const activeTrips = db.find('trips', t => t.status === 'active');
      const now = new Date();

      activeTrips.forEach(trip => {
        const routeStops = db.find('route_stops', rs => rs.route_id === trip.route_id)
          .sort((a, b) => a.stop_sequence - b.stop_sequence);

        if (routeStops.length < 2) return;

        // Fetch stop details
        const stops = routeStops.map(rs => db.findOne('stops', s => s.id === rs.stop_id)).filter(Boolean);
        if (stops.length < 2) return;

        let state = this.tripStates.get(trip.id);
        if (!state) {
          state = { currentStopIndex: 0, progress: 0.05, speedKmh: 35 };
          this.tripStates.set(trip.id, state);
        }

        // Advance progress smoothly along current segment
        state.progress += 0.04;
        if (state.progress >= 1.0) {
          state.progress = 0.0;
          state.currentStopIndex = (state.currentStopIndex + 1) % (stops.length - 1);
        }

        const startStop = stops[state.currentStopIndex];
        const endStop = stops[state.currentStopIndex + 1];

        if (!startStop || !endStop) return;

        // Linear interpolation between the two consecutive stops
        const lat = startStop.latitude + (endStop.latitude - startStop.latitude) * state.progress;
        const lng = startStop.longitude + (endStop.longitude - startStop.longitude) * state.progress;

        const simulatedLocation = {
          trip_id: trip.id,
          bus_id: trip.bus_id,
          driver_id: trip.driver_id,
          latitude: Number(lat.toFixed(7)),
          longitude: Number(lng.toFixed(7)),
          recorded_at: now.toISOString(),
          source: 'simulated',
          is_simulated: true,
          label: 'DEMO / SIMULATED',
          next_stop_name: endStop.name,
          previous_stop_name: startStop.name,
          speed_kmh: state.speedKmh
        };

        // Update in-memory active bus location table
        // Keep only latest 20 updates per trip to respect retention
        const locs = db.collection('bus_locations');
        locs.unshift(simulatedLocation);
        if (locs.length > 100) {
          locs.length = 100;
        }
      });
    } catch (err) {
      console.error('[SimulationEngine] Error during simulation tick:', err);
    }
  }

  getLivePositions() {
    const activeTrips = db.find('trips', t => t.status === 'active');
    const result = [];

    activeTrips.forEach(trip => {
      // Find latest location recorded for this trip
      const latestLoc = db.find('bus_locations', l => l.trip_id === trip.id)[0];
      const bus = db.findOne('buses', b => b.id === trip.bus_id);
      const route = db.findOne('routes', r => r.id === trip.route_id);
      const occupancy = db.find('bus_occupancy', o => o.trip_id === trip.id || o.bus_id === trip.bus_id)[0];

      if (latestLoc && bus && route) {
        const isStale = (Date.now() - new Date(latestLoc.recorded_at).getTime()) > (config.GPS_STALE_THRESHOLD_SECONDS * 1000);

        result.push({
          trip_id: trip.id,
          bus_id: bus.id,
          bus_number: bus.bus_number,
          registration_number: bus.registration_number,
          route_id: route.id,
          route_number: route.route_number,
          route_name: route.name,
          latitude: latestLoc.latitude,
          longitude: latestLoc.longitude,
          recorded_at: latestLoc.recorded_at,
          source: latestLoc.source,
          is_simulated: latestLoc.source === 'simulated',
          label: latestLoc.source === 'simulated' ? 'DEMO / SIMULATED' : 'LIVE GPS',
          is_stale: isStale,
          speed_kmh: latestLoc.speed_kmh || 0,
          next_stop_name: latestLoc.next_stop_name || route.destination_label,
          seat_capacity: bus.seat_capacity,
          occupied_seats: occupancy ? occupancy.occupied_seats : null,
          available_seats: occupancy ? Math.max(0, bus.seat_capacity - occupancy.occupied_seats) : null,
          occupancy_freshness: occupancy ? occupancy.recorded_at : null
        });
      }
    });

    return result;
  }
}

const simulationEngine = new SimulationEngine();

module.exports = simulationEngine;

