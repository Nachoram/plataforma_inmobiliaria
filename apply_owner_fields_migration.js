// Script to apply the owner nationality and apartment number migration
import fs from 'fs';

console.log('📋 Migration: Add nationality and apartment_number columns to rental_owners table');
console.log('Copy and paste the following SQL into your Supabase SQL Editor:');
console.log('https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
console.log('');
console.log('=' .repeat(80));

// Read and display the migration file
try {
  const migrationSQL = fs.readFileSync('supabase/migrations/20251107113204_add_owner_nationality_and_apartment_number.sql', 'utf8');
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
console.log('   - Add nationality column (required, default "Chilena")');
console.log('   - Add apartment_number column (optional, varchar 16)');
console.log('   - Add comments documenting the purpose of each column');