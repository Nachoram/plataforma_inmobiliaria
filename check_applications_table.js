import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== CHECKING APPLICATIONS TABLE STRUCTURE ===');

  // Try to get a sample record to see available columns
  const { data: sampleData, error: sampleError } = await supabase
    .from('applications')
    .select('*')
    .limit(1);

  // Try to get guarantors sample record
  const { data: guarantorSampleData, error: guarantorSampleError } = await supabase
    .from('guarantors')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('❌ Error getting sample applications data:', sampleError);
    return;
  }

  if (sampleData && sampleData.length > 0) {
    console.log('=== APPLICATIONS TABLE COLUMNS (from sample record) ===');
    console.log(Object.keys(sampleData[0]));
    console.log('\n=== SAMPLE APPLICATION RECORD ===');
    console.log(JSON.stringify(sampleData[0], null, 2));
  } else {
    console.log('✅ Applications table exists but is empty');
  }

  if (guarantorSampleData && guarantorSampleData.length > 0) {
    console.log('\n=== GUARANTORS TABLE COLUMNS (from sample record) ===');
    console.log(Object.keys(guarantorSampleData[0]));
    console.log('\n=== SAMPLE GUARANTOR RECORD ===');
    console.log(JSON.stringify(guarantorSampleData[0], null, 2));
  } else {
    console.log('✅ Guarantors table exists but is empty');
  }

  // Check guarantors table structure
  console.log('\n=== CHECKING GUARANTORS TABLE STRUCTURE ===');
  const { data: guarantorData, error: guarantorError } = await supabase
    .from('guarantors')
    .select('*')
    .limit(1);

  if (guarantorError) {
    console.error('❌ Error getting guarantors data:', guarantorError);
  } else if (guarantorData && guarantorData.length > 0) {
    console.log('=== GUARANTORS TABLE COLUMNS (from sample record) ===');
    console.log(Object.keys(guarantorData[0]));
    console.log('\n=== SAMPLE GUARANTOR RECORD ===');
    console.log(JSON.stringify(guarantorData[0], null, 2));
  } else {
    console.log('✅ Guarantors table exists but is empty');

    // Try to get column info by attempting to select specific columns
    console.log('\n=== TESTING COLUMN AVAILABILITY ===');
    const testColumns = [
      'full_name', 'contact_email', 'contact_phone', 'rut',
      'first_name', 'email', 'phone'  // old column names
    ];

    for (const col of testColumns) {
      try {
        const { data, error } = await supabase
          .from('guarantors')
          .select(col)
          .limit(1);

        if (error) {
          console.log(`❌ Column '${col}' does not exist:`, error.message);
        } else {
          console.log(`✅ Column '${col}' exists`);
        }
      } catch (err) {
        console.log(`❌ Exception testing column '${col}':`, err.message);
      }
    }
  }

  // Now try the problematic query from AdminPropertyDetailView
  console.log('\n=== TESTING THE PROBLEMATIC QUERY ===');
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        applicant_id,
        guarantor_id,
        status,
        created_at,
        message,
        application_characteristic_id,
        guarantor_characteristic_id,
        profiles!applicant_id (
          first_name,
          paternal_last_name,
          maternal_last_name,
          email,
          phone
        ),
        guarantors!guarantor_id (
          first_name,
          rut
        )
      `)
      .eq('property_id', '509808ab-40ff-4edb-b2b8-19895409d7c5')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error with problematic query:', error);
    } else {
      console.log('✅ Query successful, data:', data?.length || 0, 'records');
    }
  } catch (err) {
    console.error('❌ Exception during query:', err);
  }
})();