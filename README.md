# RouteReady Campus 🚌
### College Bus Route, Stop & Timetable Planner
**Institution:** Malla Reddy Engineering College for Women (MRECW), Maisammaguda, Secunderabad, Telangana  
**Technology Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Node.js, Express.js REST API, Supabase PostgreSQL, Row Level Security (RLS), Leaflet (OpenStreetMap), jsPDF.

---

## 1. Project Overview

**RouteReady Campus** is a comprehensive, production-grade college transportation management and passenger information web application designed for students, bus drivers, campus administrators, and transport managers at Malla Reddy Engineering College for Women.

### Key Capabilities
* **Find College Routes:** Search routes by number, corridor name, destination, or origin/destination stop combinations with sequence verification.
* **Nearest Stop Discovery:** Leverage browser Geolocation API with the **Haversine formula** to calculate geographic proximity to college boarding stops.
* **Timetables & PDF Generation:** Access ordered stop schedules with time offsets and download printable PDF route timetables.
* **Real-Time & Simulated Bus Tracking:** Interactive Leaflet maps with live bus movement along Hyderabad transit corridors (KPHB, Secunderabad, Uppal, Mehdipatnam). Clearly labeled as **DEMO / SIMULATED** or **LIVE GPS**.
* **Seat Capacity & Verified Occupancy:** Monitor bus capacity and driver-verified passenger counts.
* **Driver Operation Portal:** Dedicated driver workflow to start/end trips and broadcast GPS telemetry.
* **Issue Reporting & Feedback:** Students can submit reports on delays, overcrowding, and breakdowns, track resolution notes, and provide 1–5 star ratings.
* **Role-Based Portals:** Granular security and views for **Student**, **Driver**, **Administrator**, and **Transport Manager**.

---

## 2. Pre-seeded Demo Accounts

| Role | Email Address | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@mrecw.ac.in` | `Student@123` | Search routes, find nearby stops, save favorites, download PDFs, report issues, submit feedback. |
| **Driver** | `driver@mrecw.ac.in` | `Driver@123` | View assigned trips (BUS-01), start/end trips, broadcast GPS telemetry, update verified occupancy. |
| **Transport Admin** | `admin@mrecw.ac.in` | `Admin@123` | Full CRUD on buses, routes, stops, trips, scheduling, and user role elevation. |
| **Transport Manager** | `manager@mrecw.ac.in` | `Manager@123` | Fleet monitoring, broadcast urgent service alerts, post announcements, resolve issues. |

---

## 3. Quick Start & Execution

### Prerequisites
* **Node.js** (v18.0.0 or higher) installed on Windows / macOS / Linux.

### 1. Launch the Server
In PowerShell or Terminal:
```powershell
cd routeready-campus
npm start
```
*(Or directly: `node server/src/server.js`)*

The server will initialize the authoritative relational dataset, start the waypoint simulation engine, and serve the application at:
```text
http://localhost:3000
```

### 2. Run Automated Test Suite
To run the automated in-memory unit and integration test suite:
```powershell
npm test
```
*(14 tests covering Haversine distance, token cryptography, stop sequence ordering, simulation engine, and API security).*

---

## 4. System Architecture & Project Structure

```text
routeready-campus/
├── client/                      # Framework-free Frontend (HTML5, CSS3, ES6+ JS)
│   ├── index.html               # Public landing page with fleet map overview
│   ├── login.html               # Secure login & one-click demo role switcher
│   ├── register.html            # Student self-registration portal
│   ├── routes.html              # Route explorer & origin-destination sequencer
│   ├── route-details.html       # Stop sequence timeline & interactive Leaflet tracker
│   ├── stops.html               # Stop explorer with browser Geolocation proximity
│   ├── timetable.html           # Master timetable schedule & PDF generator
│   ├── student-dashboard.html   # Student personal transit dashboard
│   ├── driver-dashboard.html    # Driver trip controls, GPS broadcast & occupancy
│   ├── admin-dashboard.html     # CRUD management for buses, routes, stops, roles
│   ├── manager-dashboard.html   # Fleet operations, alert broadcaster & worklist
│   ├── reports.html             # Transport issue reporting and resolution history
│   ├── feedback.html            # 1-5 star service ratings & student reviews
│   ├── profile.html             # Profile settings & notification preferences
│   └── assets/
│       ├── css/
│       │   ├── design-system.css # Design tokens, custom properties, light/dark themes
│       │   ├── components.css    # Buttons, cards, badges, modals, toasts, tables
│       │   └── pages.css         # Responsive layouts, hero section, sidebars, maps
│       └── js/
│           ├── theme.js          # Persistent light/dark theme switcher
│           ├── auth.js           # Session token storage & role guards
│           ├── api.js            # Fetch wrapper with Bearer token injection
│           ├── components.js     # Dynamic navbar, sidebar & topbar builders
│           ├── map-service.js    # Leaflet OpenStreetMap service & icon visualizer
│           └── pdf-service.js    # Printable timetable PDF generation
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js           # Environment configuration loader
│   │   │   └── database.js      # Relational repository with JSON persistence
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT Bearer token authentication
│   │   │   ├── roles.js         # Role authorization guards (least privilege)
│   │   │   └── validation.js    # Coordinate & payload validators
│   │   ├── routes/              # Modular Express REST API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── routeRoutes.js
│   │   │   ├── stopRoutes.js
│   │   │   ├── tripRoutes.js
│   │   │   ├── trackingRoutes.js
│   │   │   ├── favoriteRoutes.js
│   │   │   ├── issueRoutes.js
│   │   │   ├── announcementRoutes.js
│   │   │   ├── alertRoutes.js
│   │   │   ├── feedbackRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   ├── haversine.js     # Great-circle geographic distance formula
│   │   │   └── simulationEngine.js # Realistic GPS waypoint interpolation engine
│   │   ├── app.js               # Express application pipeline
│   │   └── server.js            # HTTP server entry point & graceful shutdown
│   └── tests/
│       └── run-tests.js         # Automated regression test suite
├── supabase/
│   ├── migrations/
│   │   └── 20261027_init.sql    # Complete PostgreSQL schema & RLS policies
│   └── seed.sql                 # Authoritative MRECW transit seed data
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Database Schema & Row Level Security (RLS)

The Supabase PostgreSQL migration (`supabase/migrations/20261027_init.sql`) implements 16 relational tables with strict Row Level Security:

* `colleges`: Multi-tenant college record for MRECW (`Asia/Kolkata` timezone).
* `profiles`: User accounts linked to Supabase Auth (`student`, `driver`, `admin`, `transport_manager`).
* `buses`: Fleet registration, capacity (e.g. 54 seats), wheelchair/low-floor accessibility.
* `routes`: Route metadata, origin/destination labels, scheduled durations.
* `stops`: Geographic coordinates (latitude/longitude validated), landmark labels.
* `route_stops`: Normalized ordered sequence (`stop_sequence`) with arrival/departure time offsets.
* `trips`: Date-specific driver-bus assignments and statuses (`scheduled`, `active`, `completed`).
* `bus_locations`: Location telemetry indexed by trip and timestamp. Distinct `gps` vs `simulated` markers.
* `bus_occupancy`: Verified occupied seats, source tagging (`driver_manual`, `verified_count`).
* `favorite_routes`: User-specific favorite route bookmarks.
* `transport_issues`: Student/driver reports with category, priority, and staff resolution notes.
* `announcements`: Published institution-wide notifications.
* `service_alerts`: Urgent route-specific delay/detour alerts.
* `feedback`: 1–5 star ratings and reviews.
* `notifications` & `notification_preferences`: Email and in-app alert subscriptions.

### Role-Based Access Control (RBAC) Matrix
* **Public / Anonymous:** Read published routes, stops, timetables, active service alerts, and announcements.
* **Student:** Read published data, manage own profile, save favorites, submit issue reports (read only own reports), submit feedback.
* **Driver:** Read assigned trips, start/end assigned trips, transmit GPS telemetry for active trips, report passenger occupancy. Cannot edit global timetables.
* **Transport Manager:** Operational oversight, review all issues, broadcast service alerts, review fleet analytics.
* **Admin:** Full administrative control including bus CRUD, route stop sequencing, and user role assignments.

---

## 6. Bus Tracking Modes

* **Mode A: Simulated Movement (`BUS_TRACKING_MODE=simulated`)**  
  Buses move smoothly along designated transit corridors between Hyderabad/Secunderabad stops and MRECW Campus Gate. Markers are visibly tagged with **DEMO / SIMULATED**.
* **Mode B: Real Driver GPS (`BUS_TRACKING_MODE=gps`)**  
  Authorized drivers transmit live coordinates using the browser Geolocation API. Stale locations (>45s) are flagged automatically.

