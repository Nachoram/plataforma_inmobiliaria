import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== CHECKING GUARANTORS TABLE DATA ===');

  // Get all guarantors data
  const { data: guarantors, error } = await supabase
    .from('guarantors')
    .select('*');

  if (error) {
    console.error('❌ Error getting guarantors data:', error);
    return;
  }

  console.log(`Found ${guarantors.length} guarantors records`);

  if (guarantors.length > 0) {
    console.log('\n=== GUARANTORS DATA ANALYSIS ===');

    let nullContactEmail = 0;
    let nullFullName = 0;
    let nullContactPhone = 0;
    let hasOldColumns = false;

    guarantors.forEach((g, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  ID: ${g.id}`);
      console.log(`  full_name: ${g.full_name || 'NULL'}`);
      console.log(`  contact_email: ${g.contact_email || 'NULL'}`);
      console.log(`  contact_phone: ${g.contact_phone || 'NULL'}`);

      // Check old columns
      if (g.first_name || g.email || g.phone) {
        console.log(`  OLD COLUMNS EXIST:`);
        console.log(`    first_name: ${g.first_name || 'NULL'}`);
        console.log(`    email: ${g.email || 'NULL'}`);
        console.log(`    phone: ${g.phone || 'NULL'}`);
        hasOldColumns = true;
      }

      if (g.contact_email === null) nullContactEmail++;
      if (g.full_name === null) nullFullName++;
      if (g.contact_phone === null) nullContactPhone++;
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total records: ${guarantors.length}`);
    console.log(`Records with NULL contact_email: ${nullContactEmail}`);
    console.log(`Records with NULL full_name: ${nullFullName}`);
    console.log(`Records with NULL contact_phone: ${nullContactPhone}`);
    console.log(`Has old columns (first_name, email, phone): ${hasOldColumns ? 'YES' : 'NO'}`);
  }
})();
