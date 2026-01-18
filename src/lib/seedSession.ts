import { supabase } from './supabase';

// Demo data embedded directly to avoid file fetch issues in browser
const expectedShipmentsData = [
  { ship_date: '2025-01-06', shipment_id: 'SHP-2025-0001', vendor: 'GreenLine Logistics', destination: 'BMG Packhouse A', expected_qty: 980, expected_sku: 'CTN-12OZ', notes: 'rush for retailer' },
  { ship_date: '2025-01-08', shipment_id: 'SHP-2025-0002', vendor: 'NorthStar Packaging Ltd.', destination: 'BMG Packhouse A', expected_qty: 1200, expected_sku: 'CTN-1LB', notes: '' },
  { ship_date: '2025-01-10', shipment_id: 'SHP-2025-0003', vendor: 'Valley Produce Co.', destination: 'BMG Packhouse B', expected_qty: 860, expected_sku: 'CTN-12OZ', notes: '' },
  { ship_date: '2025-01-12', shipment_id: 'SHP-2025-0004', vendor: 'Coastal Freight', destination: 'BMG Packhouse A', expected_qty: 540, expected_sku: 'BAG-2LB', notes: '' },
  { ship_date: '2025-01-14', shipment_id: 'SHP-2025-0005', vendor: 'Sunrise Produce', destination: 'BMG Packhouse C', expected_qty: 720, expected_sku: 'CTN-1LB', notes: 'temp sensitive' },
  { ship_date: '2025-01-16', shipment_id: 'SHP-2025-0006', vendor: 'NorthStar Packaging Ltd.', destination: 'BMG Packhouse A', expected_qty: 1100, expected_sku: 'CTN-12OZ', notes: '' },
  { ship_date: '2025-01-18', shipment_id: 'SHP-2025-0007', vendor: 'Fresh Valley Markets', destination: 'BMG Packhouse A', expected_qty: 1320, expected_sku: 'CTN-12OZ', notes: '' },
  { ship_date: '2025-01-20', shipment_id: 'SHP-2025-0008', vendor: 'Cedar Ridge Farms', destination: 'BMG Packhouse B', expected_qty: 640, expected_sku: 'BAG-2LB', notes: '' },
  { ship_date: '2025-01-21', shipment_id: 'SHP-2025-0009', vendor: 'GreenLine Logistics', destination: 'BMG Packhouse A', expected_qty: 880, expected_sku: 'CTN-1LB', notes: '' },
  { ship_date: '2025-01-22', shipment_id: 'SHP-2025-0010', vendor: 'Valley Produce Co.', destination: 'BMG Packhouse C', expected_qty: 760, expected_sku: 'CTN-12OZ', notes: '' },
  { ship_date: '2025-01-24', shipment_id: 'SHP-2025-0011', vendor: 'NorthStar Packaging Ltd.', destination: 'BMG Packhouse A', expected_qty: 1240, expected_sku: 'CTN-1LB', notes: '' },
  { ship_date: '2025-01-26', shipment_id: 'SHP-2025-0012', vendor: 'Coastal Freight', destination: 'BMG Packhouse B', expected_qty: 600, expected_sku: 'BAG-2LB', notes: '' },
  { ship_date: '2025-01-28', shipment_id: 'SHP-2025-0013', vendor: 'Sunrise Produce', destination: 'BMG Packhouse A', expected_qty: 980, expected_sku: 'CTN-12OZ', notes: '' },
  { ship_date: '2025-01-30', shipment_id: 'SHP-2025-0014', vendor: 'GreenLine Logistics', destination: 'BMG Packhouse C', expected_qty: 720, expected_sku: 'CTN-1LB', notes: '' },
  { ship_date: '2025-02-01', shipment_id: 'SHP-2025-0015', vendor: 'Fresh Valley Markets', destination: 'BMG Packhouse A', expected_qty: 1050, expected_sku: 'CTN-12OZ', notes: '' },
];

const trainingRosterData = [
  { employee_id: 'BM-1001', name: 'A. Chen', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2022-03-14' },
  { employee_id: 'BM-1002', name: 'R. Patel', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2023-06-02' },
  { employee_id: 'BM-1003', name: 'M. Santos', department: 'Packhouse', supervisor: 'L. Morgan', hire_date: '2020-09-21' },
  { employee_id: 'BM-1004', name: 'J. Nguyen', department: 'Quality', supervisor: 'L. Morgan', hire_date: '2021-11-04' },
  { employee_id: 'BM-1005', name: 'S. O\'Neil', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2024-01-09' },
  { employee_id: 'BM-1006', name: 'T. Clark', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2022-07-19' },
  { employee_id: 'BM-1007', name: 'L. Martinez', department: 'Logistics', supervisor: 'R. Gomez', hire_date: '2019-04-30' },
  { employee_id: 'BM-1008', name: 'K. Ahmed', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2023-02-12' },
  { employee_id: 'BM-1009', name: 'N. Brooks', department: 'Operations', supervisor: 'R. Gomez', hire_date: '2018-10-05' },
  { employee_id: 'BM-1010', name: 'E. Diaz', department: 'Growing', supervisor: 'S. Fields', hire_date: '2017-08-22' },
  { employee_id: 'BM-1011', name: 'C. Wong', department: 'Growing', supervisor: 'S. Fields', hire_date: '2020-02-11' },
  { employee_id: 'BM-1012', name: 'P. Singh', department: 'Maintenance', supervisor: 'J. Rivera', hire_date: '2021-05-03' },
  { employee_id: 'BM-1013', name: 'G. Hall', department: 'Finance', supervisor: 'A. Mercer', hire_date: '2016-12-15' },
  { employee_id: 'BM-1014', name: 'H. Kim', department: 'HR', supervisor: 'D. Lewis', hire_date: '2022-09-01' },
  { employee_id: 'BM-1015', name: 'B. Lopez', department: 'Operations', supervisor: 'R. Gomez', hire_date: '2024-01-20' },
];

const trainingAcknowledgementsData = [
  { employee_id: 'BM-1001', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person', notes: '' },
  { employee_id: 'BM-1002', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'missing signature' },
  { employee_id: 'BM-1003', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person', notes: '' },
  { employee_id: 'BM-1004', module: 'Safety & SOP', acknowledged_at: '2025-01-26', method: 'Outlook', notes: 'late acknowledgement' },
  { employee_id: 'BM-1005', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'on leave' },
  { employee_id: 'BM-1006', module: 'Safety & SOP', acknowledged_at: '2025-01-24', method: 'In-person', notes: '' },
  { employee_id: 'BM-1007', module: 'Safety & SOP', acknowledged_at: '2025-01-24', method: 'Outlook', notes: '' },
  { employee_id: 'BM-1008', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'missing confirmation' },
  { employee_id: 'BM-1009', module: 'Safety & SOP', acknowledged_at: '2025-01-25', method: 'Outlook', notes: '' },
  { employee_id: 'BM-1010', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person', notes: '' },
  { employee_id: 'BM-1011', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person', notes: '' },
  { employee_id: 'BM-1012', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'pending follow-up' },
  { employee_id: 'BM-1013', module: 'Safety & SOP', acknowledged_at: '2025-01-24', method: 'Outlook', notes: '' },
  { employee_id: 'BM-1014', module: 'Safety & SOP', acknowledged_at: '2025-01-24', method: 'In-person', notes: '' },
  { employee_id: 'BM-1015', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'new hire' },
];

const incidentsData = [
  {
    incident_id: 'INC-2025-0001',
    reported_at: '2025-01-24T09:12:00',
    reported_by: 'maintenance@bigmarble.com',
    location: 'Z3-R12',
    incident_type: 'Equipment',
    severity: 4,
    needs_followup: true,
    notes: 'Conveyor jam near wash line; cleared but needs inspection.',
    photo_path: 'IMG_20250124_0912.jpg',
    status: 'open',
  },
  {
    incident_id: 'INC-2025-0002',
    reported_at: '2025-01-25T07:45:00',
    reported_by: 'safety@bigmarble.com',
    location: null, // Missing location - will need review
    incident_type: 'Safety',
    severity: 3,
    needs_followup: true,
    notes: 'Wet floor near north exit; cones placed.',
    photo_path: 'IMG_20250125_0745.jpg',
    status: 'open',
  },
  {
    incident_id: 'INC-2025-0003',
    reported_at: '2025-01-26T14:30:00',
    reported_by: 'growing@bigmarble.com',
    location: 'Z1-R05',
    incident_type: 'Pest',
    severity: 2,
    needs_followup: false,
    notes: 'Minor aphid presence on tomato row 5. Treated with organic spray.',
    photo_path: null,
    status: 'resolved',
  },
  {
    incident_id: 'INC-2025-0004',
    reported_at: '2025-01-27T11:20:00',
    reported_by: 'maintenance@bigmarble.com',
    location: 'Z2-R08',
    incident_type: 'Equipment',
    severity: 5,
    needs_followup: true,
    notes: 'HVAC unit failure in zone 2. Temperature rising. Urgent repair needed.',
    photo_path: 'IMG_20250127_1120.jpg',
    status: 'open',
  },
];

export async function seedSession(sessionCode: string): Promise<void> {
  // Insert expected shipments
  const shipmentsToInsert = expectedShipmentsData.map((row) => ({
    session_code: sessionCode,
    ship_date: row.ship_date,
    shipment_id: row.shipment_id,
    vendor: row.vendor,
    destination: row.destination,
    expected_qty: row.expected_qty,
    expected_sku: row.expected_sku,
    notes: row.notes || null,
  }));

  const { error: shipmentsError } = await supabase
    .from('shipments_expected')
    .insert(shipmentsToInsert);

  if (shipmentsError) {
    console.error('Error seeding shipments:', shipmentsError);
    throw shipmentsError;
  }

  // Insert training roster
  const rosterToInsert = trainingRosterData.map((row) => ({
    session_code: sessionCode,
    employee_id: row.employee_id,
    name: row.name,
    department: row.department,
    supervisor: row.supervisor,
    hire_date: row.hire_date,
  }));

  const { error: rosterError } = await supabase
    .from('training_roster')
    .insert(rosterToInsert);

  if (rosterError) {
    console.error('Error seeding roster:', rosterError);
    throw rosterError;
  }

  // Insert training acknowledgements
  const ackToInsert = trainingAcknowledgementsData.map((row) => ({
    session_code: sessionCode,
    employee_id: row.employee_id,
    module: row.module,
    acknowledged_at: row.acknowledged_at,
    method: row.method,
    notes: row.notes || null,
  }));

  const { error: ackError } = await supabase
    .from('training_acknowledgements')
    .insert(ackToInsert);

  if (ackError) {
    console.error('Error seeding acknowledgements:', ackError);
    throw ackError;
  }

  // Insert incidents
  const incidentsToInsert = incidentsData.map((row) => ({
    session_code: sessionCode,
    incident_id: row.incident_id,
    reported_at: row.reported_at,
    reported_by: row.reported_by,
    location: row.location,
    incident_type: row.incident_type,
    severity: row.severity,
    needs_followup: row.needs_followup,
    notes: row.notes,
    photo_path: row.photo_path,
    status: row.status,
  }));

  const { error: incidentsError } = await supabase
    .from('incidents')
    .insert(incidentsToInsert);

  if (incidentsError) {
    console.error('Error seeding incidents:', incidentsError);
    throw incidentsError;
  }

  console.log(`Session ${sessionCode} seeded successfully`);
}
