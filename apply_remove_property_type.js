/**
 * Script para eliminar la columna property_type de la tabla properties
 */

import { createClient } from '@supabase/supabase-js';

// Usar service role key para poder ejecutar DDL
// NOTA: En producción nunca expongas esta key, pero para desarrollo está bien
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
// Esta es la anon key que funciona para consultas, pero necesitamos service role para DDL
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function removePropertyTypeColumn() {
  console.log('🗑️  ELIMINANDO COLUMNA property_type DE LA TABLA properties...\n');

  try {
    // Paso 1: Eliminar el trigger que sincroniza property_type con tipo_propiedad
    console.log('1. Eliminando trigger sync_property_type_trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS sync_property_type_trigger ON public.properties;'
    });

    if (triggerError) {
      console.error('❌ Error eliminando trigger:', triggerError);
    } else {
      console.log('✅ Trigger eliminado exitosamente');
    }

    // Paso 2: Eliminar la función que sincroniza los campos
    console.log('2. Eliminando función sync_property_type_fields...');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.sync_property_type_fields();'
    });

    if (functionError) {
      console.error('❌ Error eliminando función:', functionError);
    } else {
      console.log('✅ Función eliminada exitosamente');
    }

    // Paso 3: Eliminar la columna property_type
    console.log('3. Eliminando columna property_type...');
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.properties DROP COLUMN IF EXISTS property_type;'
    });

    if (columnError) {
      console.error('❌ Error eliminando columna:', columnError);
    } else {
      console.log('✅ Columna property_type eliminada exitosamente');
    }

    // Verificación
    console.log('\n4. Verificando eliminación...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'properties')
      .eq('column_name', 'property_type');

    if (checkError) {
      console.error('❌ Error en verificación:', checkError);
    } else if (columns && columns.length === 0) {
      console.log('✅ Verificación exitosa: columna property_type ya no existe');
    } else {
      console.log('⚠️  Verificación: columna aún existe (posiblemente por permisos)');
    }

    console.log('\n🎉 Proceso de eliminación completado!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

removePropertyTypeColumn();
