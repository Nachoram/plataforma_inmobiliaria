import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== CHECKING GUARANTORS TABLE COLUMNS ===');

  // Test each possible column
  const columnsToTest = [
    'id', 'rut', 'first_name', 'paternal_last_name', 'maternal_last_name',
    'email', 'phone', 'full_name', 'contact_email', 'contact_phone',
    'company', 'monthly_income', 'work_seniority_years', 'address_id', 'updated_at'
  ];

  console.log('Testing column existence:');

  for (const col of columnsToTest) {
    try {
      const { data, error } = await supabase
        .from('guarantors')
        .select(col)
        .limit(1);

      if (error) {
        console.log(`❌ ${col}: does not exist`);
      } else {
        console.log(`✅ ${col}: exists`);
      }
    } catch (err) {
      console.log(`❌ ${col}: error - ${err.message}`);
    }
  }

  // Try to insert a test record to see what happens
  console.log('\n=== TESTING INSERT ===');
  try {
    const { data, error } = await supabase
      .from('guarantors')
      .insert({
        rut: '12345678-9',
        first_name: 'Test'
      })
      .select();

    if (error) {
      console.log(`❌ Insert failed: ${error.message}`);
    } else {
      console.log(`✅ Insert successful:`, data);
    }
  } catch (err) {
    console.log(`❌ Insert exception: ${err.message}`);
  }
})();
