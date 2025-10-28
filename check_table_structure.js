import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== CHECKING RENTAL_CONTRACT_CONDITIONS TABLE ===');

  // Try to get a sample record to see available columns
  const { data: sampleData, error: sampleError } = await supabase
    .from('rental_contract_conditions')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('❌ Error accessing rental_contract_conditions:', sampleError);
    return;
  }

  if (sampleData && sampleData.length > 0) {
    console.log('✅ Table exists. Sample record columns:');
    console.log(Object.keys(sampleData[0]));
    console.log('\nSample data:');
    console.log(JSON.stringify(sampleData[0], null, 2));
  } else {
    console.log('✅ Table exists but is empty');
  }

  // Try to get table description
  const { data: descData, error: descError } = await supabase
    .rpc('sql', {
      query: `SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_name = 'rental_contract_conditions'
              ORDER BY ordinal_position;`
    });

  if (!descError && descData) {
    console.log('\n=== TABLE STRUCTURE ===');
    descData.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });
  }

  // Try to get constraints
  const { data: constraintData, error: constraintError } = await supabase
    .rpc('sql', {
      query: `SELECT conname, contype, pg_get_constraintdef(c.oid) as definition
              FROM pg_constraint c
              JOIN pg_class t ON t.oid = c.conrelid
              WHERE t.relname = 'rental_contract_conditions';`
    });

  if (!constraintError && constraintData) {
    console.log('\n=== CONSTRAINTS ===');
    constraintData.forEach(con => {
      console.log(`${con.conname}: ${con.definition}`);
    });
  }
})();
