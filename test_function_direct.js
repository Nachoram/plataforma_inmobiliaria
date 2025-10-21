// Test the get_properties_with_postulation_count function directly
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFunction() {
  console.log('🔍 Testing get_properties_with_postulation_count function...');

  try {
    // First, authenticate as demo user
    console.log('🔐 Authenticating...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo123456'
    });

    if (signInError) {
      console.error('❌ Authentication error:', signInError);
      return;
    }

    console.log('✅ Authenticated successfully');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Could not get user:', userError);
      return;
    }

    console.log('👤 User ID:', user.id);

    // Test the function
    console.log('🧪 Testing function call...');
    const { data, error } = await supabase
      .rpc('get_properties_with_postulation_count', {
        user_id_param: user.id
      });

    if (error) {
      console.error('❌ Function call error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return;
    }

    console.log('✅ Function call successful');
    console.log('📊 Results:', data);
    console.log('Number of properties:', data?.length || 0);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testFunction();
