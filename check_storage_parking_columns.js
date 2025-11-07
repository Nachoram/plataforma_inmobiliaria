import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking properties table columns for storage and parking fields...\n');

  try {
    // Query to check column existence
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing properties table:', error.message);
      return;
    }

    // Check specific columns using raw SQL
    const columnsToCheck = [
      'tiene_bodega',
      'metros_bodega',
      'ubicacion_bodega',
      'ubicacion_estacionamiento',
      'parking_location',
      'numero_bodega',
      'storage_number'
    ];

    console.log('📋 Checking column existence...\n');

    for (const column of columnsToCheck) {
      try {
        const { data: columnData, error: columnError } = await supabase
          .rpc('check_column_exists', {
            table_name: 'properties',
            column_name: column
          });

        if (columnError) {
          // Try direct query approach
          const { data: directData, error: directError } = await supabase
            .from('properties')
            .select(column)
            .limit(1);

          if (directError && directError.message.includes('column') && directError.message.includes('does not exist')) {
            console.log(`❌ ${column}: does not exist`);
          } else {
            console.log(`✅ ${column}: exists`);
          }
        } else {
          console.log(`✅ ${column}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${column}: error checking - ${err.message}`);
      }
    }

    console.log('\n📊 Sample data check...\n');

    // Get sample data to see current values
    const { data: sampleData, error: sampleError } = await supabase
      .from('properties')
      .select('id, tiene_bodega, metros_bodega, ubicacion_bodega, ubicacion_estacionamiento, parking_location, numero_bodega, storage_number, estacionamientos')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError.message);
    } else {
      console.log('Sample properties data:');
      console.log(JSON.stringify(sampleData, null, 2));
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkColumns();
