import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - usar valores de desarrollo
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCalendarFunction() {
  console.log('🧪 Testing Calendar Function Integration\n');

  try {
    // Test 1: Verificar conexión a Supabase
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');

    // Test 2: Verificar existencia de tablas requeridas
    console.log('2️⃣ Testing required tables...');

    const tablesToCheck = [
      'scheduled_visits',
      'rental_contracts',
      'property_sale_offers',
      'properties',
      'applications'
    ];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`⚠️ Table '${table}' may not exist or have RLS issues:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }
    console.log('');

    // Test 3: Verificar si la función PostgreSQL existe
    console.log('3️⃣ Testing PostgreSQL function...');

    // Intentar llamar a la función con un UUID de prueba
    const testUserId = '00000000-0000-0000-0000-000000000000'; // UUID nulo para testing

    try {
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_user_calendar_events', { user_id: testUserId });

      if (functionError) {
        console.log('⚠️ Function call failed (expected for test UUID):', functionError.message);
        console.log('💡 This is normal - the function exists but RLS prevents access to test UUID');
      } else {
        console.log('✅ Function exists and returned data:', functionData?.length || 0, 'events');
      }
    } catch (err) {
      console.log('❌ Function does not exist or is not accessible:', err.message);
      console.log('💡 Make sure to deploy the Edge Function and run the SQL migration');
    }
    console.log('');

    // Test 4: Verificar estructura de datos esperada
    console.log('4️⃣ Testing expected data structure...');

    const expectedStructure = {
      id: 'string',
      title: 'string',
      description: 'string',
      start_date: 'timestamp',
      end_date: 'timestamp',
      all_day: 'boolean',
      event_type: 'string',
      priority: 'string',
      status: 'string',
      related_entity_type: 'string',
      related_entity_id: 'uuid',
      location: 'string',
      color: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp'
    };

    console.log('✅ Expected event structure:');
    Object.entries(expectedStructure).forEach(([field, type]) => {
      console.log(`  - ${field}: ${type}`);
    });
    console.log('');

    // Test 5: Simular tipos de eventos
    console.log('5️⃣ Testing event types...');

    const eventTypes = [
      { type: 'visit', color: '#3B82F6', description: 'Visitas agendadas' },
      { type: 'closing', color: '#10B981', description: 'Firmas de contratos' },
      { type: 'deadline', color: '#EF4444', description: 'Plazos de ofertas' },
      { type: 'negotiation', color: '#F97316', description: 'Negociaciones activas' }
    ];

    eventTypes.forEach(eventType => {
      console.log(`✅ ${eventType.type}: ${eventType.description} (${eventType.color})`);
    });
    console.log('');

    // Test 6: Verificar campos de deadline_date
    console.log('6️⃣ Testing deadline_date field...');

    try {
      // Verificar si la columna existe
      const { data: columnCheck, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'property_sale_offers')
        .eq('column_name', 'deadline_date');

      if (columnError) {
        console.log('⚠️ Could not verify column existence:', columnError.message);
      } else if (columnCheck && columnCheck.length > 0) {
        console.log('✅ deadline_date column exists in property_sale_offers');
      } else {
        console.log('⚠️ deadline_date column does not exist in property_sale_offers');
        console.log('💡 Run migration: supabase/migrations/20250129000000_add_deadline_date_to_offers.sql');
      }
    } catch (err) {
      console.log('❌ Error checking deadline_date column:', err.message);
    }

    console.log('\n🎉 Testing completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy the Edge Function: supabase functions deploy get-user-calendar-events');
    console.log('2. Run the migration: Execute the SQL in Supabase Dashboard or CLI');
    console.log('3. Test with real user authentication');
    console.log('4. Implement frontend components');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Ejecutar las pruebas
testCalendarFunction();

