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

console.log('Seeding DEMO26 session with demo data...');

// Check if DEMO26 already has data
const { data: existingData, error: checkError } = await supabase
  .from('shipments_expected')
  .select('*')
  .eq('session_code', 'DEMO26')
  .limit(1);

if (checkError) {
  console.error('Error checking existing data:', checkError);
  process.exit(1);
}

if (existingData && existingData.length > 0) {
  console.log('✓ DEMO26 already has data seeded');
  process.exit(0);
}

// Import and run seedSession
try {
  // Dynamically import the TypeScript module through tsx
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const result = await execAsync('cd "/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge" && npx vite-node -m src/lib/seedSessionRunner.ts DEMO26');
  console.log(result.stdout);
  console.log('✓ DEMO26 seeded successfully!');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
