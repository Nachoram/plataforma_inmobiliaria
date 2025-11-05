// Simple script to apply the legal entity migration to Supabase
import fs from 'fs';

console.log('📋 Migration file content:');
console.log('Copy and paste the following SQL into your Supabase SQL Editor:');
console.log('https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
console.log('');
console.log('=' .repeat(80));

// Read and display the migration file
try {
  const migrationSQL = fs.readFileSync('migration_to_apply.sql', 'utf8');
  console.log(migrationSQL);
} catch (error) {
  console.error('❌ Error reading migration file:', error);
}

console.log('=' .repeat(80));
console.log('');
console.log('📝 Instructions:');
console.log('1. Go to https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
console.log('2. Create a new query');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('');
console.log('✅ This migration will:');
console.log('   - Make natural person fields nullable for legal entities');
console.log('   - Add proper constraints for data validation');
console.log('   - Support both natural and legal entity owners');



