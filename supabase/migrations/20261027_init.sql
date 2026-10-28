-- ============================================================================
-- RouteReady Campus - Database Schema & Row Level Security (RLS)
-- Institution: Malla Reddy Engineering College for Women (MRECW)
-- Version: 1.0.0 (2026-10-27)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. COLLEGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked with Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'driver', 'admin', 'transport_manager')),
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_college ON public.profiles(college_id);

-- ----------------------------------------------------------------------------
-- 3. BUSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    bus_number TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
    accessibility_features JSONB NOT NULL DEFAULT '{"wheelchair_accessible": false, "low_floor": false, "priority_seating": true}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bus_number_per_college UNIQUE (college_id, bus_number)
);

-- ----------------------------------------------------------------------------
-- 4. ROUTES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    route_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    origin_label TEXT NOT NULL,
    destination_label TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (estimated_duration_minutes > 0),
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_route_number_per_college UNIQUE (college_id, route_number)
);

CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);

-- ----------------------------------------------------------------------------
-- 5. STOPS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    address_label TEXT,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stops_geo ON public.stops(latitude, longitude);

-- ----------------------------------------------------------------------------
-- 6. ROUTE_STOPS TABLE (Normalized Stop Sequence per Route)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
    stop_sequence INTEGER NOT NULL CHECK (stop_sequence > 0),
    scheduled_arrival_offset_minutes INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_arrival_offset_minutes >= 0),
    scheduled_departure_offset_minutes INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_departure_offset_minutes >= scheduled_arrival_offset_minutes),
    segment_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (segment_duration_minutes >= 0),
    CONSTRAINT uq_route_sequence UNIQUE (route_id, stop_sequence),
    CONSTRAINT uq_route_stop UNIQUE (route_id, stop_id)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq ON public.route_stops(route_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_route_stops_stop ON public.route_stops(stop_id);

-- ----------------------------------------------------------------------------
-- 7. TRIPS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    service_date DATE NOT NULL,
    service_day TEXT NOT NULL CHECK (service_day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All_Weekdays')),
    scheduled_start_at TIMESTAMPTZ NOT NULL,
    scheduled_end_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled', 'delayed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON public.trips(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_service_date ON public.trips(service_date, status);

-- ----------------------------------------------------------------------------
-- 8. TRIP_STOP_TIMES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_stop_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    route_stop_id UUID NOT NULL REFERENCES public.route_stops(id) ON DELETE RESTRICT,
    scheduled_arrival_at TIMESTAMPTZ NOT NULL,
    scheduled_departure_at TIMESTAMPTZ NOT NULL,
    actual_arrival_at TIMESTAMPTZ,
    actual_departure_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_stop_times_trip ON public.trip_stop_times(trip_id);

-- ----------------------------------------------------------------------------
-- 9. BUS_LOCATIONS TABLE (GPS & Simulation History with Retention)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bus_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT NOT NULL CHECK (source IN ('gps', 'simulated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bus_locations_trip_time ON public.bus_locations(trip_id, recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 10. BUS_OCCUPANCY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bus_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    occupied_seats INTEGER NOT NULL CHECK (occupied_seats >= 0),
    source TEXT NOT NULL CHECK (source IN ('driver_manual', 'sensor', 'verified_count')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bus_occupancy_bus_time ON public.bus_occupancy(bus_id, recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 11. FAVORITE_ROUTES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorite_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_favorite_route UNIQUE (user_id, route_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorite_routes(user_id);

-- ----------------------------------------------------------------------------
-- 12. TRANSPORT_ISSUES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transport_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('delay', 'breakdown', 'missed_stop', 'overcrowding', 'safety', 'other')),
    description TEXT NOT NULL,
    incident_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'investigating', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_issues_reporter ON public.transport_issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_transport_issues_status ON public.transport_issues(status);

-- ----------------------------------------------------------------------------
-- 13. ANNOUNCEMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(college_id, is_published, published_at DESC);

-- ----------------------------------------------------------------------------
-- 14. SERVICE_ALERTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('minor', 'warning', 'severe')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_alerts_status ON public.service_alerts(college_id, status);

-- ----------------------------------------------------------------------------
-- 15. FEEDBACK TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_route ON public.feedback(route_id);

-- ----------------------------------------------------------------------------
-- 16. NOTIFICATIONS & PREFERENCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper functions for trusted role verification (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'transport_manager')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stop_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Colleges: Publicly readable
CREATE POLICY "Colleges are readable by all authenticated and anonymous users"
    ON public.colleges FOR SELECT USING (true);

-- 2. Profiles:
CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins and managers can read all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin_or_manager());

CREATE POLICY "Users can update own permitted profile fields (no role change)"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update all profiles including roles"
    ON public.profiles FOR ALL
    USING (public.get_auth_role() = 'admin');

-- 3. Buses: Readable by everyone, editable by admin/manager
CREATE POLICY "Buses are viewable by all users"
    ON public.buses FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage buses"
    ON public.buses FOR ALL
    USING (public.is_admin_or_manager());

-- 4. Routes: Published routes viewable by all; draft/archived by admin/manager
CREATE POLICY "Published routes are viewable by all"
    ON public.routes FOR SELECT
    USING (status = 'published' OR public.is_admin_or_manager());

CREATE POLICY "Admins and managers can manage routes"
    ON public.routes FOR ALL
    USING (public.is_admin_or_manager());

-- 5. Stops: Viewable by all, managed by admin/manager
CREATE POLICY "Stops are viewable by all"
    ON public.stops FOR SELECT USING (is_active = true OR public.is_admin_or_manager());

CREATE POLICY "Admins and managers can manage stops"
    ON public.stops FOR ALL
    USING (public.is_admin_or_manager());

-- 6. Route Stops: Viewable by all, managed by admin/manager
CREATE POLICY "Route stops are viewable by all"
    ON public.route_stops FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage route stops"
    ON public.route_stops FOR ALL
    USING (public.is_admin_or_manager());

-- 7. Trips: Viewable by all, managed by admin/manager, drivers see assigned trips
CREATE POLICY "Trips viewable by all"
    ON public.trips FOR SELECT USING (true);

CREATE POLICY "Drivers can update status of assigned trips"
    ON public.trips FOR UPDATE
    USING (driver_id = auth.uid() AND public.get_auth_role() = 'driver');

CREATE POLICY "Admins and managers can manage trips"
    ON public.trips FOR ALL
    USING (public.is_admin_or_manager());

-- 8. Trip Stop Times: Viewable by all, managed by admin/manager
CREATE POLICY "Trip stop times viewable by all"
    ON public.trip_stop_times FOR SELECT USING (true);

CREATE POLICY "Admins and managers can manage trip stop times"
    ON public.trip_stop_times FOR ALL
    USING (public.is_admin_or_manager());

-- 9. Bus Locations: Viewable by all for active tracking; inserted by assigned driver or admin
CREATE POLICY "Bus locations viewable by authenticated users"
    ON public.bus_locations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Assigned drivers can insert location for active trip"
    ON public.bus_locations FOR INSERT
    WITH CHECK (
        driver_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE id = trip_id AND driver_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can insert simulated locations"
    ON public.bus_locations FOR ALL
    USING (public.is_admin_or_manager());

-- 10. Bus Occupancy: Viewable by all, insertable by driver/admin
CREATE POLICY "Bus occupancy viewable by all"
    ON public.bus_occupancy FOR SELECT USING (true);

CREATE POLICY "Drivers and staff can report occupancy"
    ON public.bus_occupancy FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND (public.get_auth_role() IN ('driver', 'admin', 'transport_manager')));

-- 11. Favorites: Strict user isolation
CREATE POLICY "Users can manage own favorite routes"
    ON public.favorite_routes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 12. Transport Issues:
CREATE POLICY "Users can view their own reports"
    ON public.transport_issues FOR SELECT
    USING (auth.uid() = reporter_id OR public.is_admin_or_manager());

CREATE POLICY "Authenticated users can submit reports"
    ON public.transport_issues FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins and managers can update reports"
    ON public.transport_issues FOR UPDATE
    USING (public.is_admin_or_manager());

-- 13. Announcements:
CREATE POLICY "Published announcements viewable by all"
    ON public.announcements FOR SELECT
    USING (is_published = true OR public.is_admin_or_manager());

CREATE POLICY "Admins and managers can manage announcements"
    ON public.announcements FOR ALL
    USING (public.is_admin_or_manager());

-- 14. Service Alerts:
CREATE POLICY "Active alerts viewable by all"
    ON public.service_alerts FOR SELECT
    USING (status = 'active' OR public.is_admin_or_manager());

CREATE POLICY "Admins and managers can manage alerts"
    ON public.service_alerts FOR ALL
    USING (public.is_admin_or_manager());

-- 15. Feedback:
CREATE POLICY "Users can view own feedback; staff can view all"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_manager());

CREATE POLICY "Users can submit feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 16. Notifications:
CREATE POLICY "Users can view and update own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id);

