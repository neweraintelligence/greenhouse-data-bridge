import { supabase } from './supabase';
import { generateRandomScenario, generateDeterministicScenario } from './ai/orderGenerator';

// Demo data - Realistic Big Marble Farms greenhouse operations
// Mix of OUTBOUND (plants to customers) and INBOUND (supplies from vendors)
const expectedShipmentsData = [
  // OUTBOUND: Bedding plants to garden centers
  { ship_date: '2025-01-06', shipment_id: 'OUT-2025-0001', vendor: 'Home Depot Store #4521', destination: 'HD Distribution Center', expected_qty: 48, expected_sku: 'PET-WAVE-606-PUR', notes: 'Wave Petunia Purple, 606 packs, rush order' },
  { ship_date: '2025-01-08', shipment_id: 'OUT-2025-0002', vendor: 'Green Thumb Garden Center', destination: 'GTGC Mainstreet', expected_qty: 24, expected_sku: 'GER-ZON-45-RED', notes: 'Geranium 4.5" pots' },
  { ship_date: '2025-01-10', shipment_id: 'OUT-2025-0003', vendor: "Lowe's Store #8847", destination: 'Lowes Regional DC', expected_qty: 72, expected_sku: 'PET-STVB-606-PINK', notes: 'Supertunia Vista Bubblegum' },

  // INBOUND: Plugs and supplies from vendors
  { ship_date: '2025-01-12', shipment_id: 'IN-2025-0001', vendor: 'Ball Horticultural', destination: 'BMG Greenhouse 1', expected_qty: 20, expected_sku: 'PLUG-288-PETWAVE', notes: 'Petunia Wave plugs, 288-cell trays' },
  { ship_date: '2025-01-14', shipment_id: 'IN-2025-0002', vendor: 'Sun Gro Horticulture', destination: 'BMG Supply Shed', expected_qty: 150, expected_sku: 'SUNGRO-PROF-3CF', notes: 'Professional growing mix, 3 cu ft bags' },

  // OUTBOUND: More bedding plants
  { ship_date: '2025-01-16', shipment_id: 'OUT-2025-0004', vendor: 'Menards Store #2214', destination: 'Menards DC', expected_qty: 36, expected_sku: 'CAL-SBMG-1801-GRAPE', notes: 'Calibrachoa Superbells, 1801 packs' },
  { ship_date: '2025-01-18', shipment_id: 'OUT-2025-0005', vendor: 'Ace Hardware #5523', destination: 'Ace Hardware', expected_qty: 18, expected_sku: 'TOM-CEL-1204', notes: 'Celebrity Tomato, 1204 packs' },

  // INBOUND: Fertilizer
  { ship_date: '2025-01-20', shipment_id: 'IN-2025-0003', vendor: 'JR Peters (Jacks)', destination: 'BMG Fertilizer Storage', expected_qty: 80, expected_sku: 'JACK-201020-25LB', notes: '20-10-20 Peat-Lite formula, 1 pallet' },

  // OUTBOUND: Herbs and vegetables
  { ship_date: '2025-01-21', shipment_id: 'OUT-2025-0006', vendor: 'Whole Foods Market', destination: 'WFM Regional', expected_qty: 60, expected_sku: 'BAS-SWT-804', notes: 'Sweet Basil, 804 packs' },
  { ship_date: '2025-01-22', shipment_id: 'OUT-2025-0007', vendor: 'Green Thumb Garden Center', destination: 'GTGC Mainstreet', expected_qty: 12, expected_sku: 'PET-WAVE-HB10-PUR', notes: 'Wave Petunia hanging baskets, 10"' },

  // INBOUND: Containers
  { ship_date: '2025-01-24', shipment_id: 'IN-2025-0004', vendor: 'HC Companies', destination: 'BMG Supply Shed', expected_qty: 500, expected_sku: 'INS-606-225', notes: '606 inserts, 2.25" deep, 5 cases' },
  { ship_date: '2025-01-26', shipment_id: 'IN-2025-0005', vendor: 'Ball Horticultural', destination: 'BMG Greenhouse 2', expected_qty: 15, expected_sku: 'PLUG-288-TOMBF', notes: 'Tomato Big Beef plugs, 288-cell' },

  // OUTBOUND: Spring rush orders
  { ship_date: '2025-01-28', shipment_id: 'OUT-2025-0008', vendor: 'Home Depot Store #4521', destination: 'HD Distribution Center', expected_qty: 96, expected_sku: 'PET-WAVE-606-PUR', notes: 'Repeat order, Wave Petunia Purple' },
  { ship_date: '2025-01-30', shipment_id: 'OUT-2025-0009', vendor: "Lowe's Store #8847", destination: 'Lowes Regional DC', expected_qty: 48, expected_sku: 'GER-IVY-HB10-MIX', notes: 'Ivy Geranium hanging baskets, mixed colors' },
  { ship_date: '2025-02-01', shipment_id: 'OUT-2025-0010', vendor: 'Premium Landscapes Inc', destination: 'PLI Staging Yard', expected_qty: 144, expected_sku: 'PER-ECHPW-1GAL', notes: 'Echinacea PowWow, 1-gallon perennials' },
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

// Barcode scans - with deliberate discrepancies for demo
const barcodeScansData = [
  // OUT-0001: Shortage - only 42 flats scanned instead of 48
  { shipment_id: 'OUT-2025-0001', sku: 'PET-WAVE-606-PUR', qty_scanned: 42, scanned_by: 'Mike Chen', scanned_at: '2025-01-06T10:15:00Z' },
  // OUT-0002: Perfect match
  { shipment_id: 'OUT-2025-0002', sku: 'GER-ZON-45-RED', qty_scanned: 24, scanned_by: 'Sarah Johnson', scanned_at: '2025-01-08T09:42:00Z' },
  // OUT-0003: SUBTLE ISSUE - Received wrong color! Expected PINK, got PURPLE. SKU appears similar.
  { shipment_id: 'OUT-2025-0003', sku: 'PET-STVB-606-PUR', qty_scanned: 72, scanned_by: 'Mike Chen', scanned_at: '2025-01-10T14:20:00Z' },
  // IN-0001: Perfect match
  { shipment_id: 'IN-2025-0001', sku: 'PLUG-288-PETWAVE', qty_scanned: 20, scanned_by: 'Maria Rodriguez', scanned_at: '2025-01-12T11:05:00Z' },
  // IN-0002: Perfect match
  { shipment_id: 'IN-2025-0002', sku: 'SUNGRO-PROF-3CF', qty_scanned: 150, scanned_by: 'Sarah Johnson', scanned_at: '2025-01-14T13:30:00Z' },
  // OUT-0004: Perfect match
  { shipment_id: 'OUT-2025-0004', sku: 'CAL-SBMG-1801-GRAPE', qty_scanned: 36, scanned_by: 'Mike Chen', scanned_at: '2025-01-16T10:50:00Z' },
  // OUT-0005: Shortage - 3 packs short
  { shipment_id: 'OUT-2025-0005', sku: 'TOM-CEL-1204', qty_scanned: 15, scanned_by: 'Maria Rodriguez', scanned_at: '2025-01-18T15:15:00Z' },
  // IN-0003: Perfect match
  { shipment_id: 'IN-2025-0003', sku: 'JACK-201020-25LB', qty_scanned: 80, scanned_by: 'Sarah Johnson', scanned_at: '2025-01-20T09:25:00Z' },
  // OUT-0006: Perfect match
  { shipment_id: 'OUT-2025-0006', sku: 'BAS-SWT-804', qty_scanned: 60, scanned_by: 'Mike Chen', scanned_at: '2025-01-21T14:40:00Z' },
  // OUT-0007: Perfect match
  { shipment_id: 'OUT-2025-0007', sku: 'PET-WAVE-HB10-PUR', qty_scanned: 12, scanned_by: 'Maria Rodriguez', scanned_at: '2025-01-22T11:20:00Z' },
];

// Received shipments - matches scans, includes condition notes for issues
const shipmentsReceivedData = [
  // OUT-0001: Shortage - customer received 42 flats, 6 flats missing
  { shipment_id: 'OUT-2025-0001', received_qty: 42, received_at: '2025-01-06T14:30:00Z', receiver_name: 'HD Receiving', condition: '6 flats missing from delivery', reconciled: false },
  // OUT-0002: Perfect
  { shipment_id: 'OUT-2025-0002', received_qty: 24, received_at: '2025-01-08T15:15:00Z', receiver_name: 'GTGC Receiving', condition: 'Good condition', reconciled: true },
  // OUT-0003: Wrong color received - customer notes mismatch
  { shipment_id: 'OUT-2025-0003', received_qty: 72, received_at: '2025-01-10T16:45:00Z', receiver_name: 'Lowes Receiving', condition: 'Received purple instead of pink - color variance', reconciled: false },
  // IN-0001: Perfect
  { shipment_id: 'IN-2025-0001', received_qty: 20, received_at: '2025-01-12T14:20:00Z', receiver_name: 'BMG Receiving', condition: 'Good condition, plugs healthy', reconciled: true },
  // IN-0002: Perfect
  { shipment_id: 'IN-2025-0002', received_qty: 150, received_at: '2025-01-14T16:00:00Z', receiver_name: 'BMG Receiving', condition: 'Good condition', reconciled: true },
  // OUT-0004: Perfect
  { shipment_id: 'OUT-2025-0004', received_qty: 36, received_at: '2025-01-16T13:30:00Z', receiver_name: 'Menards Receiving', condition: 'Good condition', reconciled: true },
  // OUT-0005: Shortage - 3 packs short
  { shipment_id: 'OUT-2025-0005', received_qty: 15, received_at: '2025-01-18T17:00:00Z', receiver_name: 'Ace Receiving', condition: '3 packs missing', reconciled: false },
  // IN-0003: Perfect
  { shipment_id: 'IN-2025-0003', received_qty: 80, received_at: '2025-01-20T12:15:00Z', receiver_name: 'BMG Receiving', condition: 'Good condition', reconciled: true },
  // OUT-0006: Perfect
  { shipment_id: 'OUT-2025-0006', received_qty: 60, received_at: '2025-01-21T16:30:00Z', receiver_name: 'WFM Receiving', condition: 'Good condition', reconciled: true },
  // OUT-0007: Perfect
  { shipment_id: 'OUT-2025-0007', received_qty: 12, received_at: '2025-01-22T13:50:00Z', receiver_name: 'GTGC Receiving', condition: 'Good condition', reconciled: true },
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
  // Generate random shipping scenario with AI variation
  let scenario;
  try {
    scenario = await generateRandomScenario();
    console.log('Generated random scenario with planted error:', scenario.plantedError);
  } catch (error) {
    console.log('Using deterministic fallback scenario');
    scenario = generateDeterministicScenario();
  }

  // Insert expected shipments from generated scenario
  const shipmentsToInsert = scenario.orders.map((row) => ({
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

  // Insert barcode scans from generated scenario
  const scansToInsert = scenario.scans.map((row) => ({
    session_code: sessionCode,
    shipment_id: row.shipment_id,
    sku: row.sku,
    qty_scanned: row.qty_scanned,
    scanned_by: row.scanned_by,
    scanned_at: row.scanned_at,
  }));

  const { error: scansError } = await supabase
    .from('barcode_scans')
    .insert(scansToInsert);

  if (scansError) {
    console.error('Error seeding barcode scans:', scansError);
    throw scansError;
  }

  // Insert received shipments from generated scenario
  const receivedToInsert = scenario.received.map((row) => ({
    session_code: sessionCode,
    shipment_id: row.shipment_id,
    received_qty: row.received_qty,
    received_at: row.received_at,
    receiver_name: row.receiver_name,
    condition: row.condition,
    reconciled: row.reconciled,
  }));

  const { error: receivedError } = await supabase
    .from('shipments_received')
    .insert(receivedToInsert);

  if (receivedError) {
    console.error('Error seeding received shipments:', receivedError);
    throw receivedError;
  }

  console.log(`Session ${sessionCode} seeded successfully with all data including barcode scans and received shipments`);
}
