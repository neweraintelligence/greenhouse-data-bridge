/**
 * Creates a permanent demo session for workshops
 * Session Code: DEMO26
 * Run with: npx tsx scripts/createDemoSession.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Make sure .env.local exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEMO_SESSION_CODE = 'DEMO26';

async function createDemoSession() {
  console.log('🎯 Creating demo session:', DEMO_SESSION_CODE);

  try {
    // Check if demo session already exists
    const { data: existing } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', DEMO_SESSION_CODE)
      .single();

    if (existing) {
      console.log('✓ Demo session already exists');
      console.log('  Deleting old data to refresh...');

      // Delete existing session data (cascade will delete related records)
      await supabase
        .from('sessions')
        .delete()
        .eq('code', DEMO_SESSION_CODE);

      console.log('  Old session deleted');
    }

    // Create fresh demo session
    const { error: insertError } = await supabase.from('sessions').insert({
      code: DEMO_SESSION_CODE,
      name: 'Big Marble Workshop Demo',
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      throw insertError;
    }

    console.log('✓ Demo session created');

    // Seed with realistic demo data
    console.log('📊 Seeding demo data...');
    await seedDemoSession(DEMO_SESSION_CODE);

    console.log('✅ Demo session ready!');
    console.log('');
    console.log('Session Details:');
    console.log('  Code: DEMO26');
    console.log('  Name: Big Marble Workshop Demo');
    console.log('  URL: https://greenhouse-data-bridge.onrender.com/flowchart');
    console.log('  Print Labels: https://greenhouse-data-bridge.onrender.com/print-labels/DEMO26');
    console.log('');
    console.log('📋 Attendees can join by:');
    console.log('  1. Go to landing page');
    console.log('  2. Click "Join Demo Session" button');
    console.log('  3. Start exploring!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating demo session:', error);
    process.exit(1);
  }
}

// Simplified seed function for DEMO26
async function seedDemoSession(sessionCode: string) {
  // Shipping scenario - Outbound shipments to customers
  const shipments = [
    { shipment_id: 'OUT-2025-0001', vendor: 'Big Marble Farms', destination: 'Garden Center A', expected_qty: 980, expected_sku: 'PET-WAVE-606-PUR', ship_date: '2025-01-27', notes: null },
    { shipment_id: 'OUT-2025-0002', vendor: 'Big Marble Farms', destination: 'Garden Center B', expected_qty: 1200, expected_sku: 'PET-WAVE-606-PINK', ship_date: '2025-01-27', notes: null },
    { shipment_id: 'OUT-2025-0003', vendor: 'Big Marble Farms', destination: 'Retail Chain X', expected_qty: 72, expected_sku: 'PET-STVB-606-PINK', ship_date: '2025-01-28', notes: null },
    { shipment_id: 'OUT-2025-0004', vendor: 'Big Marble Farms', destination: 'Landscaper Co.', expected_qty: 540, expected_sku: 'GER-ZON-45-RED', ship_date: '2025-01-28', notes: null },
  ];

  const scans = [
    { shipment_id: 'OUT-2025-0001', sku: 'PET-WAVE-606-PUR', qty_scanned: 980, scanned_by: 'Scanner Demo', scanned_at: '2025-01-27T10:15:00' },
    { shipment_id: 'OUT-2025-0002', sku: 'PET-WAVE-606-PINK', qty_scanned: 1200, scanned_by: 'Scanner Demo', scanned_at: '2025-01-27T10:20:00' },
    { shipment_id: 'OUT-2025-0003', sku: 'PET-STVB-606-PINK', qty_scanned: 72, scanned_by: 'Scanner Demo', scanned_at: '2025-01-28T08:30:00' },
    { shipment_id: 'OUT-2025-0004', sku: 'GER-ZON-45-RED', qty_scanned: 540, scanned_by: 'Scanner Demo', scanned_at: '2025-01-28T08:45:00' },
  ];

  const received = [
    { shipment_id: 'OUT-2025-0001', received_qty: 980, received_at: '2025-01-27T14:30:00', receiver_name: 'J. Smith', condition: 'good', reconciled: true },
    { shipment_id: 'OUT-2025-0002', received_qty: 1200, received_at: '2025-01-27T14:35:00', receiver_name: 'M. Jones', condition: 'good', reconciled: true },
    { shipment_id: 'OUT-2025-0003', received_qty: 72, received_at: '2025-01-28T11:00:00', receiver_name: 'R. Brown', condition: 'good', reconciled: true },
    { shipment_id: 'OUT-2025-0004', received_qty: 540, received_at: '2025-01-28T11:15:00', receiver_name: 'A. Davis', condition: 'good', reconciled: true },
  ];

  // Training roster
  const roster = [
    { employee_id: 'BM-1001', name: 'A. Chen', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2022-03-14' },
    { employee_id: 'BM-1002', name: 'R. Patel', department: 'Packhouse', supervisor: 'M. Santos', hire_date: '2023-06-02' },
    { employee_id: 'BM-1003', name: 'M. Santos', department: 'Packhouse', supervisor: 'L. Morgan', hire_date: '2020-09-21' },
    { employee_id: 'BM-1004', name: 'J. Nguyen', department: 'Quality', supervisor: 'L. Morgan', hire_date: '2021-11-04' },
  ];

  const acknowledgements = [
    { employee_id: 'BM-1001', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person', notes: '' },
    { employee_id: 'BM-1002', module: 'Safety & SOP', acknowledged_at: null, method: null, notes: 'missing signature' },
    { employee_id: 'BM-1003', module: 'Safety & SOP', acknowledged_at: '2025-01-23', method: 'In-person', notes: '' },
    { employee_id: 'BM-1004', module: 'Safety & SOP', acknowledged_at: '2025-01-26', method: 'Outlook', notes: 'late acknowledgement' },
  ];

  // Incidents
  const incidents = [
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

  // Insert all data
  await supabase.from('shipments_expected').insert(
    shipments.map(s => ({ ...s, session_code: sessionCode }))
  );

  await supabase.from('barcode_scans').insert(
    scans.map(s => ({ ...s, session_code: sessionCode }))
  );

  await supabase.from('shipments_received').insert(
    received.map(r => ({ ...r, session_code: sessionCode }))
  );

  await supabase.from('training_roster').insert(
    roster.map(r => ({ ...r, session_code: sessionCode }))
  );

  await supabase.from('training_acknowledgements').insert(
    acknowledgements.map(a => ({ ...a, session_code: sessionCode }))
  );

  await supabase.from('incidents').insert(
    incidents.map(i => ({ ...i, session_code: sessionCode }))
  );

  console.log('  ✓ Seeded shipments, scans, received data');
  console.log('  ✓ Seeded training roster and acknowledgements');
  console.log('  ✓ Seeded incidents');
}

createDemoSession();
