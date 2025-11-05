// Debug script for applications table
const { createClient } = require('@supabase/supabase-js');

async function debugApplications() {
  console.log('🔍 Checking applications table...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all applications
    const { data: allApps, error: allError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .limit(20);

    if (allError) {
      console.error('❌ Error:', allError);
      return;
    }

    console.log(`📊 Total applications: ${allApps.length}`);

    // Check which ones have guarantor_characteristic_id
    const withCharId = allApps.filter(app => app.guarantor_characteristic_id);
    console.log(`📊 Applications with guarantor_characteristic_id: ${withCharId.length}`);

    if (withCharId.length > 0) {
      console.log('🔍 Sample applications with characteristic_id:');
      withCharId.slice(0, 3).forEach(app => {
        console.log(`  ID: ${app.id}, Guarantor ID: ${app.guarantor_id}, Char ID: ${app.guarantor_characteristic_id}`);
      });
    }

    // Check specific application from view
    const specificAppId = '2fc3957d-0a92-4d10-9df9-32d8901a7cef';
    const { data: specificApp, error: specError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .eq('id', specificAppId);

    if (specError) {
      console.error('❌ Specific app error:', specError);
    } else if (specificApp.length > 0) {
      console.log(`🔍 Specific application ${specificAppId}:`, specificApp[0]);
    } else {
      console.log(`❌ Application ${specificAppId} not found`);
    }

    // Check all applications with any guarantor data
    const { data: appsWithGuarantorData, error: guarantorError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .or('guarantor_id.not.is.null,guarantor_characteristic_id.not.is.null');

    if (guarantorError) {
      console.error('❌ Guarantor data error:', guarantorError);
    } else {
      console.log(`📊 Applications with any guarantor data: ${appsWithGuarantorData.length}`);
      if (appsWithGuarantorData.length > 0) {
        console.log('🔍 All applications with guarantor data:');
        appsWithGuarantorData.forEach(app => {
          console.log(`  ID: ${app.id}, Guarantor ID: ${app.guarantor_id || 'NULL'}, Char ID: ${app.guarantor_characteristic_id || 'NULL'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugApplications();





