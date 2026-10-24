const { createClient } = require('@supabase/supabase-js');

const db = createClient(
  'https://aqaviocrpgkbfyyvhclf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZpb2NycGdrYmZ5eXZoY2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI1MTEwNiwiZXhwIjoyMDkzODI3MTA2fQ.sHSLLfrKQNdZJwVQmzrEiwY79lrNvC3IlHD3DE0BAQo'
);

const SUPABASE_URL = 'https://aqaviocrpgkbfyyvhclf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXZpb2NycGdrYmZ5eXZoY2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI1MTEwNiwiZXhwIjoyMDkzODI3MTA2fQ.sHSLLfrKQNdZJwVQmzrEiwY79lrNvC3IlHD3DE0BAQo';

// Use Supabase Management API to run SQL
const PROJECT_REF = 'aqaviocrpgkbfyyvhclf';

const queries = [
  `ALTER TABLE hafalan_progress ADD COLUMN IF NOT EXISTS is_pr boolean NOT NULL DEFAULT false`,
  `ALTER TABLE hafalan_progress ADD COLUMN IF NOT EXISTS pr_notes_guru text`,
  `ALTER TABLE hafalan_progress ADD COLUMN IF NOT EXISTS parent_rating int`,
  `ALTER TABLE hafalan_progress ADD COLUMN IF NOT EXISTS parent_status text`,
  `ALTER TABLE hafalan_progress ADD COLUMN IF NOT EXISTS parent_notes text`,
  `ALTER TABLE hafalan_progress ADD COLUMN IF NOT EXISTS parent_simak_at timestamptz`,
  `ALTER TABLE murajaah_sessions ADD COLUMN IF NOT EXISTS is_pr boolean NOT NULL DEFAULT false`,
  `ALTER TABLE murajaah_sessions ADD COLUMN IF NOT EXISTS pr_notes_guru text`,
  `ALTER TABLE murajaah_sessions ADD COLUMN IF NOT EXISTS parent_rating int`,
  `ALTER TABLE murajaah_sessions ADD COLUMN IF NOT EXISTS parent_status text`,
  `ALTER TABLE murajaah_sessions ADD COLUMN IF NOT EXISTS parent_notes text`,
  `ALTER TABLE murajaah_sessions ADD COLUMN IF NOT EXISTS parent_simak_at timestamptz`,
  `ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check`,
  `ALTER TABLE materials ADD CONSTRAINT materials_type_check CHECK (type IN ('pdf', 'video', 'link', 'text', 'artikel', 'audio'))`,
];

async function checkColumns() {
  // Verify columns exist by selecting from information_schema
  const { data: cols, error } = await db
    .from('information_schema.columns')
    .select('table_name, column_name')
    .in('table_name', ['hafalan_progress', 'murajaah_sessions'])
    .like('column_name', '%pr%');
  
  if (error) {
    console.log('Could not check via information_schema, trying alternate...');
    // Try direct select
    const { data: hp, error: e2 } = await db
      .from('hafalan_progress')
      .select('id, is_pr')
      .limit(1);
    if (e2) console.log('is_pr column NOT YET added. Error:', e2.message);
    else console.log('is_pr column ALREADY EXISTS in hafalan_progress');
    return;
  }
  console.log('PR columns found:', cols);
}

checkColumns().then(() => {
  console.log('\nDone checking. Migration SQL file ready at supabase/migrations/20261010000000_add_pr_flag_and_audio.sql');
  console.log('Please run via Supabase Dashboard SQL Editor or Supabase CLI.');
  console.log('\nSQL to run:');
  queries.forEach(q => console.log('  ' + q + ';'));
});
