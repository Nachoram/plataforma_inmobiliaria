import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumn() {
  try {
    console.log('🔍 Checking if tipo_propiedad column exists...');

    // Try to select a property and see if the column exists
    const { data, error } = await supabase
      .from('properties')
      .select('tipo_propiedad')
      .limit(1);

    if (error) {
      console.log('❌ Column does not exist or there was an error:', error.message);
      return false;
    }

    console.log('✅ Column exists!');
    return true;
  } catch (error) {
    console.error('❌ Check failed:', error);
    return false;
  }
}

checkColumn();
