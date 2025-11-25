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

    // Check if the table exists by trying to query it
    console.log('Checking if application_modifications table exists...');

    const { data, error } = await supabase
      .from('application_modifications')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Table application_modifications does not exist');
        console.log('Error details:', error.message);
      } else {
        console.log('❌ Error accessing application_modifications table:', error);
      }
    } else {
      console.log('✅ Table application_modifications exists');
      console.log('Record count:', data);
    }

    // Also check the database schema
    console.log('\nChecking database schema for application_modifications...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'application_modifications' })
      .select('*');

    if (schemaError) {
      console.log('Could not get schema info (this is normal if RPC doesn\'t exist)');
    } else {
      console.log('Schema info:', schemaData);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
})();
























