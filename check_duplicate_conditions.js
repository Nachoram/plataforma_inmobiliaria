import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

(async () => {
  try {
    const envContent = fs.readFileSync('env.example.txt', 'utf8');
    const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.+)/);

    if (!urlMatch || !keyMatch) {
      console.error('Could not find Supabase credentials in env.example.txt');
      return;
    }

    const supabase = createClient(urlMatch[1], keyMatch[1]);

    // Check for duplicates across all application_ids
    const { data: allRecords, error: allError } = await supabase
      .from('rental_contract_conditions')
      .select('application_id');

    if (allError) {
      console.error('Error fetching all records:', allError);
      return;
    }

    // Group by application_id and count duplicates
    const countByAppId = {};
    allRecords.forEach(record => {
      countByAppId[record.application_id] = (countByAppId[record.application_id] || 0) + 1;
    });

    const duplicates = Object.entries(countByAppId)
      .filter(([appId, count]) => count > 1)
      .map(([appId, count]) => ({ application_id: appId, count }));

    console.log(`Total rental_contract_conditions records: ${allRecords.length}`);
    console.log(`Application IDs with duplicates: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('❌ Data integrity issues found:');
      duplicates.forEach(dup => {
        console.log(`  - Application ${dup.application_id}: ${dup.count} records`);
      });
    } else {
      console.log('✅ No duplicate records found - unique constraint working correctly');
    }

    // Check specifically for the problematic application_id
    const specificAppRecords = allRecords.filter(r => r.application_id === 'ab9d285d-78b0-4316-bba6-183f6af22dd0');
    console.log(`\nSpecific check for application_id ab9d285d-78b0-4316-bba6-183f6af22dd0: ${specificAppRecords.length} records`);

  } catch (error) {
    console.error('Script error:', error);
  }
})();
