// ============================================================================
// RouteReady Campus - Authoritative Data Store & Database Service
// ============================================================================

const fs = require('fs');
const path = require('path');
const config = require('./env');

const DATA_DIR = path.resolve(__dirname, '../../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seeds for Malla Reddy Engineering College for Women
function getInitialSeed() {
  const collegeId = config.COLLEGE.id;

  return {
    colleges: [
      {
        id: collegeId,
        name: config.COLLEGE.name,
        code: config.COLLEGE.code,
        timezone: config.COLLEGE.timezone,
        created_at: new Date().toISOString()
      }
    ],
    profiles: [
      {
        id: 'b0000000-0000-0000-0000-000000000001',
        college_id: collegeId,
        full_name: 'Sneha Reddy',
        email: 'student@mrecw.ac.in',
        role: 'student',
        phone: '+91 98765 43210',
        password_hash: 'Student@123',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'b0000000-0000-0000-0000-000000000002',
        college_id: collegeId,
        full_name: 'Ramesh Kumar',
        email: 'driver@mrecw.ac.in',
        role: 'driver',
        phone: '+91 98480 12345',
        password_hash: 'Driver@123',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        college_id: collegeId,
        full_name: 'Transport Admin Office',
        email: 'admin@mrecw.ac.in',
        role: 'admin',
        phone: '+91 98490 54321',
        password_hash: 'Admin@123',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'b0000000-0000-0000-0000-000000000004',
        college_id: collegeId,
        full_name: 'Dr. K. V. Sharma',
        email: 'manager@mrecw.ac.in',
        role: 'transport_manager',
        phone: '+91 98490 99887',
        password_hash: 'Manager@123',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ],
    buses: [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        college_id: collegeId,
        bus_number: 'BUS-01',
        registration_number: 'TS 08 UB 4512',
        seat_capacity: 54,
        accessibility_features: { wheelchair_accessible: true, low_floor: true, priority_seating: true },
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        college_id: collegeId,
        bus_number: 'BUS-02',
        registration_number: 'TS 08 UB 4515',
        seat_capacity: 50,
        accessibility_features: { wheelchair_accessible: false, low_floor: false, priority_seating: true },
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        college_id: collegeId,
        bus_number: 'BUS-03',
        registration_number: 'TS 08 UB 4518',
        seat_capacity: 54,
        accessibility_features: { wheelchair_accessible: true, low_floor: true, priority_seating: true },
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        college_id: collegeId,
        bus_number: 'BUS-04',
        registration_number: 'TS 08 UB 4520',
        seat_capacity: 52,
        accessibility_features: { wheelchair_accessible: false, low_floor: false, priority_seating: true },
        status: 'active',
        created_at: new Date().toISOString()
      }
    ],
    stops: [
      {
        id: 'd0000000-0000-0000-0000-000000000000',
        college_id: collegeId,
        name: 'MRECW Campus Gate',
        description: 'Main College Entrance & Bus Bay, Maisammaguda',
        latitude: 17.5615000,
        longitude: 78.4485000,
        address_label: 'Maisammaguda, Dhulapally, Secunderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        college_id: collegeId,
        name: 'KPHB Colony Phase 1',
        description: 'Near Remedy Hospital Bus Stop',
        latitude: 17.4933000,
        longitude: 78.3914000,
        address_label: 'KPHB Colony, Kukatpally',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000002',
        college_id: collegeId,
        name: 'JNTU College Metro',
        description: 'Opposite JNTUH Main Gate',
        latitude: 17.4981000,
        longitude: 78.3897000,
        address_label: 'Kukatpally Housing Board Colony',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        college_id: collegeId,
        name: 'Nizampet X Roads',
        description: 'Near Big Bazaar / Metro Pillar',
        latitude: 17.5028000,
        longitude: 78.3862000,
        address_label: 'Nizampet Road Junction',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000004',
        college_id: collegeId,
        name: 'Pragathi Nagar Arch',
        description: 'Entry Arch Bus Shelter',
        latitude: 17.5210000,
        longitude: 78.3750000,
        address_label: 'Pragathi Nagar Road',
        is_accessible: false,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000005',
        college_id: collegeId,
        name: 'Bachupally X Roads',
        description: 'Near Silver Oaks School Junction',
        latitude: 17.5368000,
        longitude: 78.3639000,
        address_label: 'Bachupally Highway',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000006',
        college_id: collegeId,
        name: 'Gandi Maisamma X Roads',
        description: 'Police Station Junction',
        latitude: 17.5580000,
        longitude: 78.4320000,
        address_label: 'Gandi Maisamma',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000010',
        college_id: collegeId,
        name: 'Secunderabad Station',
        description: 'Opposite Clock Tower / City Bus Bay',
        latitude: 17.4344000,
        longitude: 78.5011000,
        address_label: 'Secunderabad Junction',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000011',
        college_id: collegeId,
        name: 'Paradise / Patny Circle',
        description: 'Near Paradise Hotel Metro Pier',
        latitude: 17.4435000,
        longitude: 78.4980000,
        address_label: 'MG Road, Secunderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000012',
        college_id: collegeId,
        name: 'Bowenpally Checkpost',
        description: 'Old Bowenpally Traffic Signal',
        latitude: 17.4728000,
        longitude: 78.4820000,
        address_label: 'Bowenpally, Secunderabad',
        is_accessible: false,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000013',
        college_id: collegeId,
        name: 'Suchitra Junction',
        description: 'Near More Supermarket / NH 44',
        latitude: 17.5132000,
        longitude: 78.4746000,
        address_label: 'Quthbullapur Mandal',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000014',
        college_id: collegeId,
        name: 'Kompally X Roads',
        description: 'Near Cine Planet Multiplex',
        latitude: 17.5375000,
        longitude: 78.4842000,
        address_label: 'Kompally, NH 44',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000015',
        college_id: collegeId,
        name: 'Dhulapally Junction',
        description: 'Near Forest Academy Arch',
        latitude: 17.5520000,
        longitude: 78.4550000,
        address_label: 'Dhulapally Road',
        is_accessible: false,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000020',
        college_id: collegeId,
        name: 'Uppal Ring Road',
        description: 'Under Uppal Metro Station Pillar 12',
        latitude: 17.4019000,
        longitude: 78.5602000,
        address_label: 'Uppal, Hyderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000021',
        college_id: collegeId,
        name: 'Tarnaka Metro Junction',
        description: 'Beside Rail Nilayam Approach',
        latitude: 17.4285000,
        longitude: 78.5318000,
        address_label: 'Tarnaka, Secunderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000022',
        college_id: collegeId,
        name: 'Tirumalagiri X Roads',
        description: 'Near RTA Office Junction',
        latitude: 17.4640000,
        longitude: 78.5130000,
        address_label: 'Tirumalagiri',
        is_accessible: false,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000023',
        college_id: collegeId,
        name: 'Alwal IG Statue',
        description: 'Main Highway Bus Stop',
        latitude: 17.5050000,
        longitude: 78.5100000,
        address_label: 'Alwal, Secunderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000024',
        college_id: collegeId,
        name: 'Bolarum Railway Gate',
        description: 'Near Rythu Bazar',
        latitude: 17.5270000,
        longitude: 78.5120000,
        address_label: 'Bolarum',
        is_accessible: false,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000025',
        college_id: collegeId,
        name: 'Gundlapochampally',
        description: 'ORR Junction Bus Shelter',
        latitude: 17.5550000,
        longitude: 78.4850000,
        address_label: 'Medchal Highway',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000030',
        college_id: collegeId,
        name: 'Mehdipatnam Rythu Bazar',
        description: 'Near Pillar 18 PVNR Expressway',
        latitude: 17.3916000,
        longitude: 78.4402000,
        address_label: 'Mehdipatnam, Hyderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000031',
        college_id: collegeId,
        name: 'Panjagutta Metro',
        description: 'Opposite Central Mall',
        latitude: 17.4262000,
        longitude: 78.4520000,
        address_label: 'Panjagutta, Hyderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000032',
        college_id: collegeId,
        name: 'Begumpet Airport',
        description: 'Near Old Airport Flyover',
        latitude: 17.4520000,
        longitude: 78.4680000,
        address_label: 'Begumpet, Secunderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000033',
        college_id: collegeId,
        name: 'Balanagar X Roads',
        description: 'Near Hal Bus Stop',
        latitude: 17.4760000,
        longitude: 78.4400000,
        address_label: 'Balanagar Industrial Area',
        is_accessible: false,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000034',
        college_id: collegeId,
        name: 'Jeedimetla Industrial Area',
        description: 'Near Shapur Nagar Bus Stand',
        latitude: 17.5150000,
        longitude: 78.4450000,
        address_label: 'Jeedimetla, Hyderabad',
        is_accessible: true,
        is_active: true
      },
      {
        id: 'd0000000-0000-0000-0000-000000000035',
        college_id: collegeId,
        name: 'Bahadurpally X Roads',
        description: 'Tech Mahindra Junction',
        latitude: 17.5500000,
        longitude: 78.4350000,
        address_label: 'Bahadurpally',
        is_accessible: true,
        is_active: true
      }
    ],
    routes: [
      {
        id: 'e0000000-0000-0000-0000-000000000001',
        college_id: collegeId,
        route_number: 'R-01',
        name: 'KPHB to MRECW Campus',
        description: 'Via JNTU, Nizampet, Bachupally & Gandi Maisamma',
        origin_label: 'KPHB Colony Phase 1',
        destination_label: 'MRECW Campus Gate',
        estimated_duration_minutes: 45,
        is_accessible: true,
        status: 'published',
        departure_time: '07:30 AM',
        arrival_time: '08:15 AM'
      },
      {
        id: 'e0000000-0000-0000-0000-000000000002',
        college_id: collegeId,
        route_number: 'R-02',
        name: 'Secunderabad to MRECW Campus',
        description: 'Via Patny, Bowenpally, Suchitra & Kompally',
        origin_label: 'Secunderabad Station',
        destination_label: 'MRECW Campus Gate',
        estimated_duration_minutes: 55,
        is_accessible: false,
        status: 'published',
        departure_time: '07:20 AM',
        arrival_time: '08:15 AM'
      },
      {
        id: 'e0000000-0000-0000-0000-000000000003',
        college_id: collegeId,
        route_number: 'R-03',
        name: 'Uppal to MRECW Campus',
        description: 'Via Tarnaka, Tirumalagiri, Alwal & Medchal Hwy',
        origin_label: 'Uppal Ring Road',
        destination_label: 'MRECW Campus Gate',
        estimated_duration_minutes: 60,
        is_accessible: true,
        status: 'published',
        departure_time: '07:15 AM',
        arrival_time: '08:15 AM'
      },
      {
        id: 'e0000000-0000-0000-0000-000000000004',
        college_id: collegeId,
        route_number: 'R-04',
        name: 'Mehdipatnam to MRECW Campus',
        description: 'Via Begumpet, Balanagar, Jeedimetla & Bahadurpally',
        origin_label: 'Mehdipatnam Rythu Bazar',
        destination_label: 'MRECW Campus Gate',
        estimated_duration_minutes: 65,
        is_accessible: false,
        status: 'published',
        departure_time: '07:10 AM',
        arrival_time: '08:15 AM'
      }
    ],
    route_stops: [
      // Route 1
      { id: 'rs-1-1', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000001', stop_sequence: 1, scheduled_arrival_offset_minutes: 0, scheduled_departure_offset_minutes: 0, segment_duration_minutes: 0 },
      { id: 'rs-1-2', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000002', stop_sequence: 2, scheduled_arrival_offset_minutes: 8, scheduled_departure_offset_minutes: 9, segment_duration_minutes: 8 },
      { id: 'rs-1-3', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000003', stop_sequence: 3, scheduled_arrival_offset_minutes: 15, scheduled_departure_offset_minutes: 16, segment_duration_minutes: 7 },
      { id: 'rs-1-4', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000004', stop_sequence: 4, scheduled_arrival_offset_minutes: 23, scheduled_departure_offset_minutes: 24, segment_duration_minutes: 8 },
      { id: 'rs-1-5', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000005', stop_sequence: 5, scheduled_arrival_offset_minutes: 30, scheduled_departure_offset_minutes: 31, segment_duration_minutes: 7 },
      { id: 'rs-1-6', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000006', stop_sequence: 6, scheduled_arrival_offset_minutes: 38, scheduled_departure_offset_minutes: 39, segment_duration_minutes: 8 },
      { id: 'rs-1-7', route_id: 'e0000000-0000-0000-0000-000000000001', stop_id: 'd0000000-0000-0000-0000-000000000000', stop_sequence: 7, scheduled_arrival_offset_minutes: 45, scheduled_departure_offset_minutes: 45, segment_duration_minutes: 7 },

      // Route 2
      { id: 'rs-2-1', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000010', stop_sequence: 1, scheduled_arrival_offset_minutes: 0, scheduled_departure_offset_minutes: 0, segment_duration_minutes: 0 },
      { id: 'rs-2-2', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000011', stop_sequence: 2, scheduled_arrival_offset_minutes: 7, scheduled_departure_offset_minutes: 8, segment_duration_minutes: 7 },
      { id: 'rs-2-3', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000012', stop_sequence: 3, scheduled_arrival_offset_minutes: 17, scheduled_departure_offset_minutes: 18, segment_duration_minutes: 10 },
      { id: 'rs-2-4', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000013', stop_sequence: 4, scheduled_arrival_offset_minutes: 30, scheduled_departure_offset_minutes: 31, segment_duration_minutes: 13 },
      { id: 'rs-2-5', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000014', stop_sequence: 5, scheduled_arrival_offset_minutes: 40, scheduled_departure_offset_minutes: 41, segment_duration_minutes: 10 },
      { id: 'rs-2-6', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000015', stop_sequence: 6, scheduled_arrival_offset_minutes: 48, scheduled_departure_offset_minutes: 49, segment_duration_minutes: 8 },
      { id: 'rs-2-7', route_id: 'e0000000-0000-0000-0000-000000000002', stop_id: 'd0000000-0000-0000-0000-000000000000', stop_sequence: 7, scheduled_arrival_offset_minutes: 55, scheduled_departure_offset_minutes: 55, segment_duration_minutes: 7 },

      // Route 3
      { id: 'rs-3-1', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000020', stop_sequence: 1, scheduled_arrival_offset_minutes: 0, scheduled_departure_offset_minutes: 0, segment_duration_minutes: 0 },
      { id: 'rs-3-2', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000021', stop_sequence: 2, scheduled_arrival_offset_minutes: 10, scheduled_departure_offset_minutes: 11, segment_duration_minutes: 10 },
      { id: 'rs-3-3', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000022', stop_sequence: 3, scheduled_arrival_offset_minutes: 22, scheduled_departure_offset_minutes: 23, segment_duration_minutes: 12 },
      { id: 'rs-3-4', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000023', stop_sequence: 4, scheduled_arrival_offset_minutes: 34, scheduled_departure_offset_minutes: 35, segment_duration_minutes: 12 },
      { id: 'rs-3-5', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000024', stop_sequence: 5, scheduled_arrival_offset_minutes: 44, scheduled_departure_offset_minutes: 45, segment_duration_minutes: 10 },
      { id: 'rs-3-6', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000025', stop_sequence: 6, scheduled_arrival_offset_minutes: 52, scheduled_departure_offset_minutes: 53, segment_duration_minutes: 8 },
      { id: 'rs-3-7', route_id: 'e0000000-0000-0000-0000-000000000003', stop_id: 'd0000000-0000-0000-0000-000000000000', stop_sequence: 7, scheduled_arrival_offset_minutes: 60, scheduled_departure_offset_minutes: 60, segment_duration_minutes: 8 },

      // Route 4
      { id: 'rs-4-1', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000030', stop_sequence: 1, scheduled_arrival_offset_minutes: 0, scheduled_departure_offset_minutes: 0, segment_duration_minutes: 0 },
      { id: 'rs-4-2', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000031', stop_sequence: 2, scheduled_arrival_offset_minutes: 12, scheduled_departure_offset_minutes: 13, segment_duration_minutes: 12 },
      { id: 'rs-4-3', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000032', stop_sequence: 3, scheduled_arrival_offset_minutes: 22, scheduled_departure_offset_minutes: 23, segment_duration_minutes: 10 },
      { id: 'rs-4-4', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000033', stop_sequence: 4, scheduled_arrival_offset_minutes: 35, scheduled_departure_offset_minutes: 36, segment_duration_minutes: 13 },
      { id: 'rs-4-5', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000034', stop_sequence: 5, scheduled_arrival_offset_minutes: 48, scheduled_departure_offset_minutes: 49, segment_duration_minutes: 13 },
      { id: 'rs-4-6', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000035', stop_sequence: 6, scheduled_arrival_offset_minutes: 56, scheduled_departure_offset_minutes: 57, segment_duration_minutes: 8 },
      { id: 'rs-4-7', route_id: 'e0000000-0000-0000-0000-000000000004', stop_id: 'd0000000-0000-0000-0000-000000000000', stop_sequence: 7, scheduled_arrival_offset_minutes: 65, scheduled_departure_offset_minutes: 65, segment_duration_minutes: 9 }
    ],
    trips: [
      {
        id: 'f0000000-0000-0000-0000-000000000001',
        route_id: 'e0000000-0000-0000-0000-000000000001',
        bus_id: 'c0000000-0000-0000-0000-000000000001',
        driver_id: 'b0000000-0000-0000-0000-000000000002',
        service_date: new Date().toISOString().split('T')[0],
        service_day: 'All_Weekdays',
        scheduled_start_at: '07:30 AM',
        scheduled_end_at: '08:15 AM',
        status: 'active'
      },
      {
        id: 'f0000000-0000-0000-0000-000000000002',
        route_id: 'e0000000-0000-0000-0000-000000000002',
        bus_id: 'c0000000-0000-0000-0000-000000000002',
        driver_id: 'b0000000-0000-0000-0000-000000000002',
        service_date: new Date().toISOString().split('T')[0],
        service_day: 'All_Weekdays',
        scheduled_start_at: '07:20 AM',
        scheduled_end_at: '08:15 AM',
        status: 'active'
      },
      {
        id: 'f0000000-0000-0000-0000-000000000003',
        route_id: 'e0000000-0000-0000-0000-000000000003',
        bus_id: 'c0000000-0000-0000-0000-000000000003',
        driver_id: 'b0000000-0000-0000-0000-000000000002',
        service_date: new Date().toISOString().split('T')[0],
        service_day: 'All_Weekdays',
        scheduled_start_at: '07:15 AM',
        scheduled_end_at: '08:15 AM',
        status: 'scheduled'
      },
      {
        id: 'f0000000-0000-0000-0000-000000000004',
        route_id: 'e0000000-0000-0000-0000-000000000004',
        bus_id: 'c0000000-0000-0000-0000-000000000004',
        driver_id: 'b0000000-0000-0000-0000-000000000002',
        service_date: new Date().toISOString().split('T')[0],
        service_day: 'All_Weekdays',
        scheduled_start_at: '07:10 AM',
        scheduled_end_at: '08:15 AM',
        status: 'scheduled'
      }
    ],
    bus_locations: [],
    bus_occupancy: [
      {
        id: 'occ-1',
        bus_id: 'c0000000-0000-0000-0000-000000000001',
        trip_id: 'f0000000-0000-0000-0000-000000000001',
        occupied_seats: 38,
        source: 'driver_manual',
        recorded_at: new Date(Date.now() - 3 * 60000).toISOString()
      },
      {
        id: 'occ-2',
        bus_id: 'c0000000-0000-0000-0000-000000000002',
        trip_id: 'f0000000-0000-0000-0000-000000000002',
        occupied_seats: 46,
        source: 'driver_manual',
        recorded_at: new Date(Date.now() - 1 * 60000).toISOString()
      }
    ],
    favorite_routes: [
      {
        id: 'fav-1',
        user_id: 'b0000000-0000-0000-0000-000000000001',
        route_id: 'e0000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString()
      }
    ],
    transport_issues: [
      {
        id: 'issue-1',
        reporter_id: 'b0000000-0000-0000-0000-000000000001',
        route_id: 'e0000000-0000-0000-0000-000000000001',
        stop_id: 'd0000000-0000-0000-0000-000000000003',
        bus_id: 'c0000000-0000-0000-0000-000000000001',
        category: 'overcrowding',
        description: 'Morning bus R-01 had very few standing spots left after Nizampet stop.',
        status: 'investigating',
        priority: 'medium',
        incident_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 24 * 3600000).toISOString()
      }
    ],
    announcements: [
      {
        id: 'ann-1',
        college_id: collegeId,
        title: 'Semester Examination Special Bus Schedules',
        body: 'All college bus routes will operate an additional afternoon trip departing MRECW Campus at 04:45 PM during upcoming end-semester examinations.',
        severity: 'info',
        is_published: true,
        published_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        created_by: 'b0000000-0000-0000-0000-000000000004'
      },
      {
        id: 'ann-2',
        college_id: collegeId,
        title: 'Route R-02 Temporary Diversion at Suchitra',
        body: 'Due to flyover maintenance near Suchitra junction, Route R-02 may experience 5-10 minute delays during the morning commute.',
        severity: 'warning',
        is_published: true,
        published_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        created_by: 'b0000000-0000-0000-0000-000000000004'
      }
    ],
    service_alerts: [
      {
        id: 'alert-1',
        college_id: collegeId,
        route_id: 'e0000000-0000-0000-0000-000000000002',
        bus_id: 'c0000000-0000-0000-0000-000000000002',
        title: 'Road Repair at Suchitra Circle',
        description: 'Slow-moving traffic on NH 44 northbound. Expected delay: ~8 mins.',
        severity: 'warning',
        status: 'active',
        starts_at: new Date(Date.now() - 3600000).toISOString(),
        created_by: 'b0000000-0000-0000-0000-000000000004'
      }
    ],
    feedback: [
      {
        id: 'fb-1',
        user_id: 'b0000000-0000-0000-0000-000000000001',
        route_id: 'e0000000-0000-0000-0000-000000000001',
        rating: 5,
        comment: 'Driver was punctual and courteous. Bus reached campus on time before 08:15 AM assembly.',
        created_at: new Date(Date.now() - 48 * 3600000).toISOString()
      }
    ],
    notifications: [],
    notification_preferences: [
      {
        user_id: 'b0000000-0000-0000-0000-000000000001',
        email_enabled: true,
        in_app_enabled: true
      }
    ]
  };
}

class Database {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[Database] Failed to read database.json, re-initializing from seeds:', err.message);
    }
    const seed = getInitialSeed();
    this.saveData(seed);
    return seed;
  }

  saveData(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[Database] Failed to save database.json:', err.message);
    }
  }

  // Generic collection accessors
  collection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(colName, predicate = () => true) {
    return this.collection(colName).filter(predicate);
  }

  findOne(colName, predicate) {
    return this.collection(colName).find(predicate);
  }

  insert(colName, item) {
    if (!item.id) {
      item.id = 'gen-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    }
    if (!item.created_at) {
      item.created_at = new Date().toISOString();
    }
    this.collection(colName).push(item);
    this.saveData();
    return item;
  }

  update(colName, predicate, updates) {
    const item = this.findOne(colName, predicate);
    if (!item) return null;
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    this.saveData();
    return item;
  }

  delete(colName, predicate) {
    const list = this.collection(colName);
    const index = list.findIndex(predicate);
    if (index !== -1) {
      const removed = list.splice(index, 1)[0];
      this.saveData();
      return removed;
    }
    return null;
  }
}

const db = new Database();

module.exports = db;

