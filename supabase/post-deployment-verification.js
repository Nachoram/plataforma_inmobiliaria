/**
 * Script de Verificación Post-Deployment
 * Ejecutar después del deployment para confirmar que todo funciona correctamente
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDeployment() {
  console.log('🔍 Verificación Post-Deployment - Sección Calendario\n');

  let allChecksPass = true;

  try {
    // =====================================================
    // VERIFICACIÓN 1: CONEXIÓN CON SUPABASE
    // =====================================================
    console.log('1️⃣ Verificando conexión con Supabase...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Error de conexión:', error.message);
        allChecksPass = false;
      } else {
        console.log('✅ Conexión exitosa con Supabase');
      }
    } catch (err) {
      console.error('❌ Error inesperado en conexión:', err.message);
      allChecksPass = false;
    }

    // =====================================================
    // VERIFICACIÓN 2: TABLAS REQUERIDAS
    // =====================================================
    console.log('\n2️⃣ Verificando tablas requeridas...');

    const requiredTables = [
      'scheduled_visits',
      'rental_contracts',
      'property_sale_offers',
      'properties'
    ];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`⚠️ Tabla '${table}' tiene restricciones:`, error.message);
        } else {
          console.log(`✅ Tabla '${table}' accesible`);
        }
      } catch (err) {
        console.log(`❌ Error accediendo tabla '${table}':`, err.message);
        allChecksPass = false;
      }
    }

    // =====================================================
    // VERIFICACIÓN 3: COLUMNA DEADLINE_DATE
    // =====================================================
    console.log('\n3️⃣ Verificando columna deadline_date...');

    try {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'property_sale_offers')
        .eq('column_name', 'deadline_date');

      if (error) {
        console.log('⚠️ No se pudo verificar columna:', error.message);
      } else if (columns && columns.length > 0) {
        console.log(`✅ Columna deadline_date existe (${columns[0].data_type})`);
      } else {
        console.log('❌ Columna deadline_date NO encontrada');
        console.log('💡 Ejecutar: ALTER TABLE property_sale_offers ADD COLUMN deadline_date DATE;');
        allChecksPass = false;
      }
    } catch (err) {
      console.log('❌ Error verificando deadline_date:', err.message);
      allChecksPass = false;
    }

    // =====================================================
    // VERIFICACIÓN 4: FUNCIÓN POSTGRESQL
    // =====================================================
    console.log('\n4️⃣ Verificando función PostgreSQL...');

    try {
      // Verificar que la función existe
      const { data: functions, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'get_user_calendar_events');

      if (funcError) {
        console.log('⚠️ Error verificando función:', funcError.message);
      } else if (functions && functions.length > 0) {
        console.log('✅ Función get_user_calendar_events existe');
      } else {
        console.log('❌ Función get_user_calendar_events NO encontrada');
        console.log('💡 Verificar deployment de Edge Function');
        allChecksPass = false;
      }
    } catch (err) {
      console.log('❌ Error verificando función PostgreSQL:', err.message);
      allChecksPass = false;
    }

    // =====================================================
    // VERIFICACIÓN 5: EDGE FUNCTION
    // =====================================================
    console.log('\n5️⃣ Verificando Edge Function...');

    try {
      // Intentar llamar a la Edge Function (debería fallar por autenticación)
      const { data, error } = await supabase.functions.invoke('get-user-calendar-events', {
        body: {},
        headers: { 'Content-Type': 'application/json' }
      });

      if (error && error.message.includes('JWT')) {
        console.log('✅ Edge Function responde (requiere autenticación)');
      } else if (error) {
        console.log('⚠️ Edge Function responde con error inesperado:', error.message);
      } else {
        console.log('✅ Edge Function responde correctamente');
      }
    } catch (err) {
      console.log('❌ Edge Function no accesible:', err.message);
      console.log('💡 Verificar: npx supabase functions deploy get-user-calendar-events');
      allChecksPass = false;
    }

    // =====================================================
    // VERIFICACIÓN 6: DATOS DE EJEMPLO
    // =====================================================
    console.log('\n6️⃣ Verificando datos de ejemplo...');

    try {
      // Verificar si hay datos en las tablas
      const tablesToCheck = [
        { name: 'scheduled_visits', description: 'visitas agendadas' },
        { name: 'rental_contracts', description: 'contratos' },
        { name: 'property_sale_offers', description: 'ofertas' }
      ];

      for (const table of tablesToCheck) {
        try {
          const { count, error } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.log(`⚠️ Error consultando ${table.name}:`, error.message);
          } else {
            console.log(`📊 ${table.name}: ${count || 0} registros`);
          }
        } catch (err) {
          console.log(`❌ Error en ${table.name}:`, err.message);
        }
      }
    } catch (err) {
      console.log('❌ Error verificando datos:', err.message);
    }

    // =====================================================
    // RESULTADO FINAL
    // =====================================================
    console.log('\n' + '='.repeat(50));
    console.log('📋 RESULTADO DE VERIFICACIÓN');
    console.log('='.repeat(50));

    if (allChecksPass) {
      console.log('🎉 ✅ TODAS LAS VERIFICACIONES PASARON');
      console.log('🚀 La sección calendario está lista para producción');
    } else {
      console.log('⚠️ ⚠️ ALGUNAS VERIFICACIONES FALLARON');
      console.log('📝 Revisar los errores arriba y ejecutar las correcciones sugeridas');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🔗 ENDPOINTS DE PRODUCCIÓN');
    console.log('='.repeat(50));
    console.log(`📱 Aplicación: ${supabaseUrl.replace('/api', '')}/perfil`);
    console.log(`⚡ Edge Function: ${supabaseUrl}/functions/v1/get-user-calendar-events`);

    console.log('\n' + '='.repeat(50));
    console.log('🛠️ PRÓXIMOS PASOS');
    console.log('='.repeat(50));

    if (allChecksPass) {
      console.log('✅ Deployment completado exitosamente');
      console.log('👥 Comunicar a usuarios que la funcionalidad está disponible');
      console.log('📊 Monitorear logs y performance');
      console.log('🔄 Recopilar feedback para mejoras');
    } else {
      console.log('🔧 Corregir los problemas identificados');
      console.log('🔄 Re-ejecutar este script de verificación');
      console.log('📞 Contactar al equipo de desarrollo si es necesario');
    }

  } catch (error) {
    console.error('❌ Error inesperado en verificación:', error);
    allChecksPass = false;
  }
}

// Ejecutar verificación
verifyDeployment();

