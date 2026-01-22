import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SESSION_CODE = 'LIVE01';

console.log(`Setting up ${SESSION_CODE} presentation session...`);

// First, create or update the session
const { error: sessionError } = await supabase
  .from('sessions')
  .upsert({
    code: SESSION_CODE,
    name: 'Presentation Mode',
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString()
  }, {
    onConflict: 'code'
  });

if (sessionError) {
  console.error('Error creating session:', sessionError);
  process.exit(1);
}

console.log(`Session ${SESSION_CODE} created/updated`);

// Check if already has data
const { data: existingData } = await supabase
  .from('shipments_expected')
  .select('*')
  .eq('session_code', SESSION_CODE)
  .limit(1);

if (existingData && existingData.length > 0) {
  console.log(`${SESSION_CODE} already has data. Clearing for clean presentation...`);

  // Delete existing data
  const tables = [
    'workflow_templates', 'communications_log', 'escalations', 'review_decisions',
    'barcode_scans', 'shipments_received', 'shipments_expected',
    'training_acknowledgements', 'training_roster', 'incidents',
    'quality_issues', 'quality_coa_records', 'quality_receiving_log',
    'customer_order_issues', 'customer_order_lines', 'customer_orders',
    'product_inventory', 'product_price_list', 'session_participants',
  ];

  for (const table of tables) {
    await supabase.from(table).delete().eq('session_code', SESSION_CODE);
  }
  console.log('Cleared existing data');
}

// Seed demo data - shipping
console.log('Seeding shipping data...');
const shipments = [
  { session_code: SESSION_CODE, ship_date: '2026-01-20', shipment_id: 'SHP-0001', vendor: "Nature's Pride", destination: 'Distribution Center A', expected_qty: 980, expected_sku: 'CTN-12OZ', notes: 'Petunias - priority shipment' },
  { session_code: SESSION_CODE, ship_date: '2026-01-20', shipment_id: 'SHP-0002', vendor: 'Green Valley Farms', destination: 'Distribution Center B', expected_qty: 1200, expected_sku: 'CTN-1LB', notes: 'Cherry Tomatoes' },
  { session_code: SESSION_CODE, ship_date: '2026-01-21', shipment_id: 'SHP-0003', vendor: "Nature's Pride", destination: 'Distribution Center A', expected_qty: 860, expected_sku: 'CTN-12OZ', notes: 'Lettuce Mix' },
  { session_code: SESSION_CODE, ship_date: '2026-01-21', shipment_id: 'SHP-0004', vendor: 'Valley Fresh Co', destination: 'Distribution Center C', expected_qty: 540, expected_sku: 'BAG-2LB', notes: 'Fresh Herbs' },
  { session_code: SESSION_CODE, ship_date: '2026-01-22', shipment_id: 'SHP-0005', vendor: 'Green Valley Farms', destination: 'Distribution Center A', expected_qty: 750, expected_sku: 'CTN-12OZ', notes: 'Mixed Greens' },
];

await supabase.from('shipments_expected').insert(shipments);
console.log('✓ Shipments');

// Barcode scans - with one discrepancy
const scans = [
  { session_code: SESSION_CODE, shipment_id: 'SHP-0001', sku: 'CTN-12OZ', qty_scanned: 950, scanned_by: 'Warehouse A', scanned_at: '2026-01-20T09:15:00' }, // 30 units short!
  { session_code: SESSION_CODE, shipment_id: 'SHP-0002', sku: 'CTN-1LB', qty_scanned: 1200, scanned_by: 'Warehouse B', scanned_at: '2026-01-20T10:30:00' },
  { session_code: SESSION_CODE, shipment_id: 'SHP-0003', sku: 'CTN-12OZ', qty_scanned: 860, scanned_by: 'Warehouse A', scanned_at: '2026-01-21T08:45:00' },
  { session_code: SESSION_CODE, shipment_id: 'SHP-0004', sku: 'BAG-2LB', qty_scanned: 520, scanned_by: 'Warehouse C', scanned_at: '2026-01-21T11:00:00' }, // 20 units short!
  { session_code: SESSION_CODE, shipment_id: 'SHP-0005', sku: 'CTN-12OZ', qty_scanned: 750, scanned_by: 'Warehouse A', scanned_at: '2026-01-22T09:00:00' },
];

await supabase.from('barcode_scans').insert(scans);
console.log('✓ Barcode scans');

// Received shipments
const received = [
  { session_code: SESSION_CODE, shipment_id: 'SHP-0001', received_qty: 950, received_at: '2026-01-20T09:20:00', receiver_name: 'M. Santos', condition: '20 units damaged on arrival', reconciled: false },
  { session_code: SESSION_CODE, shipment_id: 'SHP-0002', received_qty: 1200, received_at: '2026-01-20T10:35:00', receiver_name: 'J. Chen', condition: 'Good', reconciled: true },
  { session_code: SESSION_CODE, shipment_id: 'SHP-0003', received_qty: 860, received_at: '2026-01-21T08:50:00', receiver_name: 'M. Santos', condition: 'Good', reconciled: true },
  { session_code: SESSION_CODE, shipment_id: 'SHP-0004', received_qty: 520, received_at: '2026-01-21T11:05:00', receiver_name: 'R. Patel', condition: '20 units refused - wilted', reconciled: false },
  { session_code: SESSION_CODE, shipment_id: 'SHP-0005', received_qty: 750, received_at: '2026-01-22T09:05:00', receiver_name: 'J. Chen', condition: 'Good', reconciled: true },
];

await supabase.from('shipments_received').insert(received);
console.log('✓ Received shipments');

// Training data
console.log('Seeding training data...');
const roster = [
  { session_code: SESSION_CODE, employee_id: 'BM-1001', name: 'A. Chen', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2022-03-14' },
  { session_code: SESSION_CODE, employee_id: 'BM-1002', name: 'R. Patel', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2023-06-02' },
  { session_code: SESSION_CODE, employee_id: 'BM-1003', name: 'M. Santos', department: 'Packhouse', supervisor: 'L. Morgan', hire_date: '2020-09-21' },
  { session_code: SESSION_CODE, employee_id: 'BM-1004', name: 'J. Nguyen', department: 'Quality', supervisor: 'L. Morgan', hire_date: '2021-11-04' },
  { session_code: SESSION_CODE, employee_id: 'BM-1005', name: "S. O'Neil", department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2024-01-09' },
  { session_code: SESSION_CODE, employee_id: 'BM-1006', name: 'T. Clark', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2022-07-19' },
  { session_code: SESSION_CODE, employee_id: 'BM-1007', name: 'L. Martinez', department: 'Logistics', supervisor: 'R. Gomez', hire_date: '2019-04-30' },
];

await supabase.from('training_roster').insert(roster);
console.log('✓ Training roster');

const acknowledgements = [
  { session_code: SESSION_CODE, employee_id: 'BM-1001', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person' },
  { session_code: SESSION_CODE, employee_id: 'BM-1002', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'missing signature' }, // Gap!
  { session_code: SESSION_CODE, employee_id: 'BM-1003', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person' },
  { session_code: SESSION_CODE, employee_id: 'BM-1004', module: 'Safety & SOP', acknowledged_at: '2025-01-26', method: 'Outlook', notes: 'late acknowledgement' },
  { session_code: SESSION_CODE, employee_id: 'BM-1005', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'on leave' }, // Gap!
  { session_code: SESSION_CODE, employee_id: 'BM-1006', module: 'Safety & SOP', acknowledged_at: '2025-01-24', method: 'In-person' },
  { session_code: SESSION_CODE, employee_id: 'BM-1007', module: 'Safety & SOP', acknowledged_at: '2025-01-24', method: 'Outlook' },
];

await supabase.from('training_acknowledgements').insert(acknowledgements);
console.log('✓ Training acknowledgements');

// Incidents
console.log('Seeding incident data...');
const incidents = [
  { session_code: SESSION_CODE, incident_id: 'INC-2025-0001', reported_at: '2025-01-24T09:12:00', reported_by: 'maintenance@bigmarble.com', location: 'Z3-R12', incident_type: 'Equipment', severity: 4, needs_followup: true, notes: 'Conveyor jam near wash line; cleared but needs inspection.', status: 'open' },
  { session_code: SESSION_CODE, incident_id: 'INC-2025-0002', reported_at: '2025-01-25T07:45:00', reported_by: 'safety@bigmarble.com', location: null, incident_type: 'Safety', severity: 3, needs_followup: true, notes: 'Wet floor near north exit; cones placed.', status: 'open' }, // Missing location!
  { session_code: SESSION_CODE, incident_id: 'INC-2025-0003', reported_at: '2025-01-26T14:30:00', reported_by: 'growing@bigmarble.com', location: 'Z1-R05', incident_type: 'Pest', severity: 2, needs_followup: false, notes: 'Minor aphid presence on tomato row 5. Treated with organic spray.', status: 'resolved' },
  { session_code: SESSION_CODE, incident_id: 'INC-2025-0004', reported_at: '2025-01-27T11:20:00', reported_by: 'maintenance@bigmarble.com', location: 'Z2-R08', incident_type: 'Equipment', severity: 5, needs_followup: true, notes: 'HVAC unit failure in zone 2. Temperature rising. Urgent repair needed.', status: 'open' }, // Critical!
];

await supabase.from('incidents').insert(incidents);
console.log('✓ Incidents');

console.log(`\n✓ ${SESSION_CODE} seeded successfully with clean demo data!`);
console.log('\nYou can now use LIVE01 for presentations.');
process.exit(0);
