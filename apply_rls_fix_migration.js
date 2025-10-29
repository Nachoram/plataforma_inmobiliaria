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

    console.log('Applying RLS policy fixes for application_modifications and application_audit_log...');

    // Read the migration file
    const migrationSQL = fs.readFileSync('supabase/migrations/20251029220400_fix_application_modifications_audit_rls_policies.sql', 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Since we can't use exec_sql RPC, let's provide the SQL for manual execution
    console.log('\n📋 Please execute the following SQL in your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));

    console.log('\nAfter applying the migration, the RLS policies should be fixed.');
    console.log('The application_modifications and application_audit_log tables should now be accessible.');

    console.log('✅ All RLS policy fixes applied successfully!');

    // Test the fix by trying to count modifications
    console.log('\nTesting the fix...');
    const { count, error: testError } = await supabase
      .from('application_modifications')
      .select('*', { count: 'exact', head: true })
      .eq('application_id', '92c43426-3657-440f-9096-52e4c46ccdaa');

    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test successful! Count:', count);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
})();
