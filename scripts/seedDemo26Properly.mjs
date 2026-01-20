import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qfwdvhfiogxazvcimetn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2R2aGZpb2d4YXp2Y2ltZXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDYzNDYsImV4cCI6MjA4NDMyMjM0Nn0.MYnLU2yyVtGKzJVkEERVJ5fUkhnpUXEyg0ZKGuodUR0'
);

console.log('Checking if DEMO26 needs full seed...');

// Check if already seeded
const { data: existing } = await supabase
  .from('shipments_expected')
  .select('*')
  .eq('session_code', 'DEMO26');

if (existing && existing.length > 2) {
  console.log('✓ DEMO26 already has full data');
  process.exit(0);
}

// Clear partial data
console.log('Clearing partial data...');
const tables = [
  'shipments_expected',
  'shipments_received',
  'barcode_scans',
  'training_roster',
  'training_acknowledgements',
  'incidents',
  'quality_receiving_log',
  'quality_coa_records',
  'quality_issues',
  'customer_orders',
  'customer_order_lines',
  'customer_order_issues',
  'product_price_list',
  'product_inventory',
  'expense_submissions',
  'expense_issues',
  'expense_policy_limits'
];

for (const table of tables) {
  await supabase.from(table).delete().eq('session_code', 'DEMO26');
}

console.log('Triggering full seed via API call to production app...');

// Call the production app to seed itself
const response = await fetch('https://greenhouse-data-bridge-app.onrender.com/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'seed', sessionCode: 'DEMO26' })
});

if (!response.ok) {
  console.log('API approach failed, seeding directly...');

  // Import and run the TypeScript seed function directly
  // We need to compile it first
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync(
      'cd "/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge" && npm run dev -- --seed DEMO26',
      { timeout: 60000 }
    );
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Failed to run seed script:', error.message);
    process.exit(1);
  }
}

console.log('✓ DEMO26 fully seeded!');
