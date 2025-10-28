import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== TESTING MIGRATION STEP BY STEP ===');

  // Test if we can add the contact_email column
  console.log('\n1. Testing ADD COLUMN contact_email...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS contact_email text;'
    });

    if (error) {
      console.log(`❌ ADD COLUMN failed: ${error.message}`);
    } else {
      console.log(`✅ ADD COLUMN successful`);
    }
  } catch (err) {
    console.log(`❌ ADD COLUMN exception: ${err.message}`);
  }

  // Check if contact_email column now exists
  console.log('\n2. Checking if contact_email column exists...');
  try {
    const { data, error } = await supabase
      .from('guarantors')
      .select('contact_email')
      .limit(1);

    if (error) {
      console.log(`❌ contact_email still doesn't exist: ${error.message}`);
    } else {
      console.log(`✅ contact_email column now exists`);
    }
  } catch (err) {
    console.log(`❌ contact_email check exception: ${err.message}`);
  }

  // Test setting NOT NULL on empty table
  console.log('\n3. Testing SET NOT NULL on contact_email...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE guarantors ALTER COLUMN contact_email SET NOT NULL;'
    });

    if (error) {
      console.log(`❌ SET NOT NULL failed: ${error.message}`);
    } else {
      console.log(`✅ SET NOT NULL successful`);
    }
  } catch (err) {
    console.log(`❌ SET NOT NULL exception: ${err.message}`);
  }
})();
