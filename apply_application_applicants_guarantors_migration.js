// Script to apply the application_applicants and application_guarantors migration
import fs from 'fs';

console.log('📋 Application Applicants & Guarantors Migration');
console.log('Copy and paste the following SQL into your Supabase SQL Editor:');
console.log('https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
console.log('');
console.log('='.repeat(80));

// Read and display the migration file
try {
  const migrationSQL = fs.readFileSync('supabase/migrations/20251104_create_application_applicants_guarantors_tables.sql', 'utf8');
  console.log(migrationSQL);
} catch (error) {
  console.error('❌ Error reading migration file:', error);
}

console.log('='.repeat(80));
console.log('');
console.log('📝 Instructions:');
console.log('1. Go to https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
console.log('2. Create a new query');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('');
console.log('✅ This migration will:');
console.log('   - Create application_applicants table for multiple applicants per application');
console.log('   - Create application_guarantors table for multiple guarantors per application');
console.log('   - Support both natural and legal entities');
console.log('   - Migrate existing data from applications table');
console.log('   - Set up RLS policies for proper access control');
console.log('   - Add utility functions for counting applicants/guarantors');
console.log('');
console.log('⚠️  IMPORTANT: Backup your database before running this migration!');
