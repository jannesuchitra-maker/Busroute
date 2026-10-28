-- ============================================================================
-- RouteReady Campus - Seed Data
-- Institution: Malla Reddy Engineering College for Women (MRECW)
-- ============================================================================

-- 1. College
INSERT INTO public.colleges (id, name, code, timezone)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Malla Reddy Engineering College for Women',
    'MRECW',
    'Asia/Kolkata'
) ON CONFLICT (code) DO NOTHING;

-- 2. Fixed UUIDs for college and profiles
-- Note: In production Supabase Auth, profiles link to auth.users.id.
-- For local standalone development and demonstrations, pre-seeded demo accounts:
-- Student: student@mrecw.ac.in (pass: Student@123)
-- Driver: driver@mrecw.ac.in (pass: Driver@123)
-- Admin: admin@mrecw.ac.in (pass: Admin@123)
-- Transport Manager: manager@mrecw.ac.in (pass: Manager@123)

INSERT INTO public.profiles (id, college_id, full_name, email, role, phone, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sneha Reddy', 'student@mrecw.ac.in', 'student', '+91 98765 43210', true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ramesh Kumar (Driver 01)', 'driver@mrecw.ac.in', 'driver', '+91 98480 12345', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Transport Admin Office', 'admin@mrecw.ac.in', 'admin', '+91 98490 54321', true),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Dr. K. V. Sharma (Transport Manager)', 'manager@mrecw.ac.in', 'transport_manager', '+91 98490 99887', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Buses
INSERT INTO public.buses (id, college_id, bus_number, registration_number, seat_capacity, accessibility_features, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BUS-01', 'TS 08 UB 4512', 54, '{"wheelchair_accessible": true, "low_floor": true, "priority_seating": true}'::jsonb, 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BUS-02', 'TS 08 UB 4515', 50, '{"wheelchair_accessible": false, "low_floor": false, "priority_seating": true}'::jsonb, 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BUS-03', 'TS 08 UB 4518', 54, '{"wheelchair_accessible": true, "low_floor": true, "priority_seating": true}'::jsonb, 'active'),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'BUS-04', 'TS 08 UB 4520', 52, '{"wheelchair_accessible": false, "low_floor": false, "priority_seating": true}'::jsonb, 'active')
ON CONFLICT (registration_number) DO NOTHING;

-- 4. Stops (Real coordinates around Hyderabad/Secunderabad to MRECW Maisammaguda)
INSERT INTO public.stops (id, college_id, name, description, latitude, longitude, address_label, is_accessible, is_active)
VALUES
    -- MRECW Destination
    ('d0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'MRECW Campus Gate', 'Main College Entrance & Bus Bay, Maisammaguda', 17.5615000, 78.4485000, 'Maisammaguda, Dhulapally, Secunderabad', true, true),
    
    -- Route 1 Stops (KPHB to MRECW)
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'KPHB Colony Phase 1', 'Near Remedy Hospital Bus Stop', 17.4933000, 78.3914000, 'KPHB Colony, Kukatpally', true, true),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'JNTU College Metro', 'Opposite JNTUH Main Gate', 17.4981000, 78.3897000, 'Kukatpally Housing Board Colony', true, true),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Nizampet X Roads', 'Near Big Bazaar / Metro Pillar', 17.5028000, 78.3862000, 'Nizampet Road Junction', true, true),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Pragathi Nagar Arch', 'Entry Arch Bus Shelter', 17.5210000, 78.3750000, 'Pragathi Nagar Road', false, true),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Bachupally X Roads', 'Near Silver Oaks School Junction', 17.5368000, 78.3639000, 'Bachupally Highway', true, true),
    ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Gandi Maisamma X Roads', 'Police Station Junction', 17.5580000, 78.4320000, 'Gandi Maisamma', true, true),

    -- Route 2 Stops (Secunderabad to MRECW)
    ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Secunderabad Station', 'Opposite Clock Tower / City Bus Bay', 17.4344000, 78.5011000, 'Secunderabad Junction', true, true),
    ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Paradise / Patny Circle', 'Near Paradise Hotel Metro Pier', 17.4435000, 78.4980000, 'MG Road, Secunderabad', true, true),
    ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Bowenpally Checkpost', 'Old Bowenpally Traffic Signal', 17.4728000, 78.4820000, 'Bowenpally, Secunderabad', false, true),
    ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Suchitra Junction', 'Near More Supermarket / NH 44', 17.5132000, 78.4746000, 'Quthbullapur Mandal', true, true),
    ('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Kompally X Roads', 'Near Cine Planet Multiplex', 17.5375000, 78.4842000, 'Kompally, NH 44', true, true),
    ('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Dhulapally Junction', 'Near Forest Academy Arch', 17.5520000, 78.4550000, 'Dhulapally Road', false, true),

    -- Route 3 Stops (Uppal to MRECW)
    ('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'Uppal Ring Road', 'Under Uppal Metro Station Pillar 12', 17.4019000, 78.5602000, 'Uppal, Hyderabad', true, true),
    ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'Tarnaka Metro Junction', 'Beside Rail Nilayam Approach', 17.4285000, 78.5318000, 'Tarnaka, Secunderabad', true, true),
    ('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'Tirumalagiri X Roads', 'Near RTA Office Junction', 17.4640000, 78.5130000, 'Tirumalagiri', false, true),
    ('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'Alwal IG Statue', 'Main Highway Bus Stop', 17.5050000, 78.5100000, 'Alwal, Secunderabad', true, true),
    ('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'Bolarum Railway Gate', 'Near Rythu Bazar', 17.5270000, 78.5120000, 'Bolarum', false, true),
    ('d0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'Gundlapochampally', 'ORR Junction Bus Shelter', 17.5550000, 78.4850000, 'Medchal Highway', true, true),

    -- Route 4 Stops (Mehdipatnam to MRECW)
    ('d0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'Mehdipatnam Rythu Bazar', 'Near Pillar 18 PVNR Expressway', 17.3916000, 78.4402000, 'Mehdipatnam, Hyderabad', true, true),
    ('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'Panjagutta Metro', 'Opposite Central Mall', 17.4262000, 78.4520000, 'Panjagutta, Hyderabad', true, true),
    ('d0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'Begumpet Airport', 'Near Old Airport Flyover', 17.4520000, 78.4680000, 'Begumpet, Secunderabad', true, true),
    ('d0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'Balanagar X Roads', 'Near Hal Bus Stop', 17.4760000, 78.4400000, 'Balanagar Industrial Area', false, true),
    ('d0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'Jeedimetla Industrial Area', 'Near Shapur Nagar Bus Stand', 17.5150000, 78.4450000, 'Jeedimetla, Hyderabad', true, true),
    ('d0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'Bahadurpally X Roads', 'Tech Mahindra Junction', 17.5500000, 78.4350000, 'Bahadurpally', true, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Routes
INSERT INTO public.routes (id, college_id, route_number, name, description, origin_label, destination_label, estimated_duration_minutes, is_accessible, status, created_by)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'R-01', 'KPHB to MRECW Campus', 'Via JNTU, Nizampet, Bachupally & Gandi Maisamma', 'KPHB Colony Phase 1', 'MRECW Campus Gate', 45, true, 'published', 'b0000000-0000-0000-0000-000000000003'),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'R-02', 'Secunderabad to MRECW Campus', 'Via Patny, Bowenpally, Suchitra & Kompally', 'Secunderabad Station', 'MRECW Campus Gate', 55, false, 'published', 'b0000000-0000-0000-0000-000000000003'),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'R-03', 'Uppal to MRECW Campus', 'Via Tarnaka, Tirumalagiri, Alwal & Medchal Hwy', 'Uppal Ring Road', 'MRECW Campus Gate', 60, true, 'published', 'b0000000-0000-0000-0000-000000000003'),
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'R-04', 'Mehdipatnam to MRECW Campus', 'Via Begumpet, Balanagar, Jeedimetla & Bahadurpally', 'Mehdipatnam Rythu Bazar', 'MRECW Campus Gate', 65, false, 'published', 'b0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 6. Route Stops (Sequences and time offsets in minutes from trip start at 07:30 AM)
-- Route 1: KPHB -> MRECW
INSERT INTO public.route_stops (route_id, stop_id, stop_sequence, scheduled_arrival_offset_minutes, scheduled_departure_offset_minutes, segment_duration_minutes)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 1, 0, 0, 0),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 2, 8, 9, 8),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 3, 15, 16, 7),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 4, 23, 24, 8),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 5, 30, 31, 7),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 6, 38, 39, 8),
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000000', 7, 45, 45, 7)
ON CONFLICT (route_id, stop_sequence) DO NOTHING;

-- Route 2: Secunderabad -> MRECW
INSERT INTO public.route_stops (route_id, stop_id, stop_sequence, scheduled_arrival_offset_minutes, scheduled_departure_offset_minutes, segment_duration_minutes)
VALUES
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000010', 1, 0, 0, 0),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000011', 2, 7, 8, 7),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000012', 3, 17, 18, 10),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000013', 4, 30, 31, 13),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000014', 5, 40, 41, 10),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000015', 6, 48, 49, 8),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000000', 7, 55, 55, 7)
ON CONFLICT (route_id, stop_sequence) DO NOTHING;

-- Route 3: Uppal -> MRECW
INSERT INTO public.route_stops (route_id, stop_id, stop_sequence, scheduled_arrival_offset_minutes, scheduled_departure_offset_minutes, segment_duration_minutes)
VALUES
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000020', 1, 0, 0, 0),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000021', 2, 10, 11, 10),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000022', 3, 22, 23, 12),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000023', 4, 34, 35, 12),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000024', 5, 44, 45, 10),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000025', 6, 52, 53, 8),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000000', 7, 60, 60, 8)
ON CONFLICT (route_id, stop_sequence) DO NOTHING;

-- Route 4: Mehdipatnam -> MRECW
INSERT INTO public.route_stops (route_id, stop_id, stop_sequence, scheduled_arrival_offset_minutes, scheduled_departure_offset_minutes, segment_duration_minutes)
VALUES
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000030', 1, 0, 0, 0),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000031', 2, 12, 13, 12),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000032', 3, 22, 23, 10),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000033', 4, 35, 36, 13),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000034', 5, 48, 49, 13),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000035', 6, 56, 57, 8),
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000000', 7, 65, 65, 9)
ON CONFLICT (route_id, stop_sequence) DO NOTHING;

-- 7. Trips
INSERT INTO public.trips (id, route_id, bus_id, driver_id, service_date, service_day, scheduled_start_at, scheduled_end_at, status)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Monday', (CURRENT_DATE || ' 07:30:00+05:30')::timestamptz, (CURRENT_DATE || ' 08:15:00+05:30')::timestamptz, 'active'),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Monday', (CURRENT_DATE || ' 07:20:00+05:30')::timestamptz, (CURRENT_DATE || ' 08:15:00+05:30')::timestamptz, 'active'),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Monday', (CURRENT_DATE || ' 07:15:00+05:30')::timestamptz, (CURRENT_DATE || ' 08:15:00+05:30')::timestamptz, 'scheduled'),
    ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE, 'Monday', (CURRENT_DATE || ' 07:10:00+05:30')::timestamptz, (CURRENT_DATE || ' 08:15:00+05:30')::timestamptz, 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- 8. Bus Occupancy (Verified records)
INSERT INTO public.bus_occupancy (id, bus_id, trip_id, occupied_seats, source, recorded_at, updated_by)
VALUES
    ('90000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 38, 'driver_manual', now() - INTERVAL '4 minutes', 'b0000000-0000-0000-0000-000000000002'),
    ('90000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 46, 'driver_manual', now() - INTERVAL '2 minutes', 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 9. Announcements
INSERT INTO public.announcements (id, college_id, title, body, severity, published_at, is_published, created_by)
VALUES
    ('70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Semester Examination Special Bus Schedules', 'All college bus routes will operate an additional afternoon trip departing MRECW Campus at 04:45 PM during upcoming end-semester examinations.', 'info', now() - INTERVAL '1 day', true, 'b0000000-0000-0000-0000-000000000004'),
    ('70000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Route R-02 Temporary Diversion at Suchitra', 'Due to flyover maintenance near Suchitra junction, Route R-02 may experience 5-10 minute delays during the morning commute.', 'warning', now() - INTERVAL '3 hours', true, 'b0000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- 10. Service Alerts
INSERT INTO public.service_alerts (id, college_id, route_id, bus_id, title, description, severity, starts_at, status, created_by)
VALUES
    ('60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Road Repair at Suchitra Circle', 'Slow-moving traffic on NH 44 northbound. Expected delay: ~8 mins.', 'warning', now() - INTERVAL '1 hour', 'active', 'b0000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- 11. Initial Demo Transport Issues
INSERT INTO public.transport_issues (id, reporter_id, route_id, stop_id, bus_id, category, description, status, priority)
VALUES
    ('50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'overcrowding', 'Morning bus R-01 had very few standing spots left after Nizampet stop.', 'investigating', 'medium')
ON CONFLICT (id) DO NOTHING;

