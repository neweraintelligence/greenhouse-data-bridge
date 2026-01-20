import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qfwdvhfiogxazvcimetn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2R2aGZpb2d4YXp2Y2ltZXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDYzNDYsImV4cCI6MjA4NDMyMjM0Nn0.MYnLU2yyVtGKzJVkEERVJ5fUkhnpUXEyg0ZKGuodUR0'
);

console.log('Quick seeding DEMO26 with basic data...');

// Add a few sample shipments
const shipments = [
  {
    session_code: 'DEMO26',
    ship_date: '2026-01-20',
    shipment_id: 'SHP-0001',
    vendor: 'Nature\'s Pride',
    destination: 'Distribution Center A',
    expected_qty: 500,
    expected_sku: 'CTN-12OZ',
    notes: 'Petunias'
  },
  {
    session_code: 'DEMO26',
    ship_date: '2026-01-20',
    shipment_id: 'SHP-0002',
    vendor: 'Green Valley',
    destination: 'Distribution Center B',
    expected_qty: 800,
    expected_sku: 'CTN-1LB',
    notes: 'Tomatoes'
  }
];

const { error: shipError } = await supabase
  .from('shipments_expected')
  .insert(shipments);

if (shipError) {
  console.error('Error inserting shipments:', shipError);
} else {
  console.log('✓ Added sample shipments');
}

console.log('✓ DEMO26 basic seed complete!');
process.exit(0);
