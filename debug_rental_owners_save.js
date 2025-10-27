/**
 * Script para diagnosticar por qué no se están guardando los datos del propietario
 * en la tabla rental_owners
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (usar las mismas variables que el proyecto)
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes. Asegúrate de tener:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const runDiagnostics = async () => {
  console.log('🔍 Diagnosticando problema con guardado de rental_owners...\n');

  try {
    // 1. Verificar que la tabla rental_owners existe
    console.log('1️⃣ Verificando tabla rental_owners...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'rental_owners');

    if (tablesError) {
      console.error('❌ Error consultando tablas:', tablesError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.error('❌ La tabla rental_owners NO existe');
      console.log('💡 Ejecuta las migraciones pendientes para crear la tabla');
      return;
    }

    console.log('✅ Tabla rental_owners existe');

    // 2. Verificar estructura de la tabla
    console.log('\n2️⃣ Verificando estructura de rental_owners...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'rental_owners')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error consultando columnas:', columnsError);
      return;
    }

    console.log('Columnas encontradas:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 3. Verificar datos existentes en rental_owners
    console.log('\n3️⃣ Verificando datos existentes en rental_owners...');
    const { data: existingOwners, error: ownersError } = await supabase
      .from('rental_owners')
      .select('*')
      .limit(10);

    if (ownersError) {
      console.error('❌ Error consultando rental_owners:', ownersError);
      return;
    }

    if (!existingOwners || existingOwners.length === 0) {
      console.log('ℹ️ No hay datos en rental_owners');
    } else {
      console.log(`📊 Se encontraron ${existingOwners.length} registros en rental_owners:`);
      existingOwners.forEach((owner, index) => {
        console.log(`  ${index + 1}. ID: ${owner.id}, Property: ${owner.property_id}, Nombre: ${owner.first_name} ${owner.paternal_last_name}`);
      });
    }

    // 4. Verificar propiedades recientes para ver si hay propietarios asociados
    console.log('\n4️⃣ Verificando propiedades recientes...');
    const { data: recentProperties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, listing_type, created_at, owner_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (propertiesError) {
      console.error('❌ Error consultando propiedades:', propertiesError);
      return;
    }

    if (recentProperties && recentProperties.length > 0) {
      console.log('Propiedades recientes:');
      for (const prop of recentProperties) {
        console.log(`  - ID: ${prop.id}, Tipo: ${prop.listing_type}, Creada: ${prop.created_at}`);

        // Verificar si tiene propietario en rental_owners
        const { data: owner, error: ownerCheck } = await supabase
          .from('rental_owners')
          .select('id, first_name, paternal_last_name')
          .eq('property_id', prop.id)
          .maybeSingle();

        if (ownerCheck && ownerCheck.code !== 'PGRST116') {
          console.error(`    ❌ Error verificando propietario para propiedad ${prop.id}:`, ownerCheck);
        } else if (owner) {
          console.log(`    ✅ Tiene propietario: ${owner.first_name} ${owner.paternal_last_name}`);
        } else {
          console.log(`    ⚠️ No tiene propietario en rental_owners`);
        }
      }
    }

    // 5. Verificar permisos RLS
    console.log('\n5️⃣ Verificando políticas RLS...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'rental_owners')
      .like('constraint_name', '%rls%');

    if (rlsError) {
      console.log('⚠️ No se pudo verificar RLS:', rlsError.message);
    } else if (!rlsPolicies || rlsPolicies.length === 0) {
      console.log('⚠️ No se encontraron políticas RLS específicas');
    } else {
      console.log('✅ Políticas RLS encontradas');
    }

    // 6. Probar inserción manual para verificar permisos
    console.log('\n6️⃣ Probando inserción manual...');
    const testOwnerData = {
      property_id: '00000000-0000-0000-0000-000000000001', // ID ficticio para prueba
      first_name: 'Test',
      paternal_last_name: 'User',
      maternal_last_name: null,
      rut: '12.345.678-9',
      marital_status: 'soltero',
      phone: '+56912345678',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: testResult, error: testError } = await supabase
        .from('rental_owners')
        .insert(testOwnerData)
        .select()
        .single();

      if (testError) {
        console.error('❌ Error en inserción de prueba:', testError);
        console.log('💡 Esto podría indicar problemas de permisos RLS o estructura de tabla');
      } else {
        console.log('✅ Inserción de prueba exitosa:', testResult.id);

        // Limpiar el registro de prueba
        await supabase.from('rental_owners').delete().eq('id', testResult.id);
        console.log('🧹 Registro de prueba eliminado');
      }
    } catch (error) {
      console.error('❌ Error en prueba de inserción:', error);
    }

    console.log('\n🎯 Diagnóstico completado.');
    console.log('\n💡 Posibles causas del problema:');
    console.log('1. El formulario usado no es PropertyPublicationForm.tsx');
    console.log('2. Error en la función saveRentalOwner');
    console.log('3. Problemas de permisos RLS');
    console.log('4. La propiedad no se está guardando primero');
    console.log('5. Error en los datos enviados a saveRentalOwner');

    console.log('\n🔧 Pasos de debugging recomendados:');
    console.log('1. Verificar qué formulario estás usando (venta vs alquiler)');
    console.log('2. Revisar la consola del navegador para logs de saveRentalOwner');
    console.log('3. Verificar que los datos del propietario llegan correctamente');
    console.log('4. Probar crear una propiedad nueva y verificar logs');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    console.error('Stack:', error.stack);
  }
};

// Ejecutar diagnóstico si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics();
}

export { runDiagnostics };
