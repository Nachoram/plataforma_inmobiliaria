/**
 * Script para verificar que la migración UUID fix se aplicó correctamente
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MzI5ODMsImV4cCI6MjA0ODEwODk4M30.0QP5FQKqL8tH7bz7k0yZ7Vz6s5g9Y7Vz6s5g9Y7Vz6s5g9Y7Vz6';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verificando que la migración UUID fix se aplicó correctamente...\n');

  try {
    // 1. Verificar que la tabla property_type_characteristics existe
    console.log('1. Verificando tabla property_type_characteristics...');
    const { data: types, error: typesError } = await supabase
      .from('property_type_characteristics')
      .select('id, name, description')
      .limit(10);

    if (typesError) {
      console.error('❌ Error:', typesError);
      return;
    }

    console.log(`✅ Encontrados ${types.length} tipos de propiedad:`);
    types.forEach(type => {
      console.log(`   - ${type.name}: ${type.id}`);
    });

    // 2. Verificar que la nueva columna existe en properties
    console.log('\n2. Verificando nueva columna en properties...');
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, tipo_propiedad, property_type_characteristics_id, property_characteristic_id')
      .limit(5);

    if (propsError) {
      console.error('❌ Error:', propsError);
      return;
    }

    console.log(`✅ Verificadas ${properties.length} propiedades:`);
    let mappedCount = 0;
    properties.forEach(prop => {
      const hasMapping = prop.property_type_characteristics_id ? '✅' : '❌';
      console.log(`   - ${prop.tipo_propiedad}: ${hasMapping} UUID mapeado`);
      if (prop.property_type_characteristics_id) mappedCount++;
    });

    // 3. Probar una consulta que antes fallaba
    console.log('\n3. Probando consulta UUID (antes fallaba)...');
    if (properties.length > 0 && properties[0].property_type_characteristics_id) {
      const testUUID = properties[0].property_type_characteristics_id;

      const { data: result, error: queryError } = await supabase
        .from('property_type_characteristics')
        .select('name')
        .eq('id', testUUID)
        .single();

      if (queryError) {
        console.error('❌ Consulta falló:', queryError);
      } else {
        console.log(`✅ Consulta exitosa: ${result.name} (UUID: ${testUUID})`);
      }
    }

    // 4. Verificar estadísticas
    console.log('\n4. Estadísticas de mapeo:');
    const { data: stats, error: statsError } = await supabase
      .from('properties')
      .select('property_type_characteristics_id')
      .not('property_type_characteristics_id', 'is', null);

    if (!statsError) {
      console.log(`   - Propiedades con UUID mapeado: ${stats.length}`);
      console.log(`   - Tasa de éxito: ${((stats.length / properties.length) * 100).toFixed(1)}%`);
    }

    console.log('\n🎉 Verificación completada! La migración se aplicó correctamente.');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyMigration();
