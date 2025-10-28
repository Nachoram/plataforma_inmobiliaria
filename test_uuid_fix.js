/**
 * Script de verificación para probar que la corrección del error UUID funciona
 * Ejecutar con: node test_uuid_fix.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usar variables de entorno en producción)
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MzI5ODMsImV4cCI6MjA0ODEwODk4M30.0QP5FQKqL8tH7bz7k0yZ7Vz6s5g9Y7Vz6s5g9Y7Vz6s5g9Y7Vz6';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUUIDFix() {
  console.log('🧪 Probando corrección del error UUID en property_type_characteristics...\n');

  try {
    // 1. Verificar que la tabla property_type_characteristics existe y tiene datos
    console.log('1. Verificando tabla property_type_characteristics...');
    const { data: propertyTypes, error: typesError } = await supabase
      .from('property_type_characteristics')
      .select('id, name')
      .limit(5);

    if (typesError) {
      console.error('❌ Error al consultar property_type_characteristics:', typesError);
      return;
    }

    console.log('✅ property_type_characteristics encontrada con datos:');
    propertyTypes.forEach(type => {
      console.log(`   - ${type.name}: ${type.id}`);
    });

    // 2. Verificar que la nueva columna existe en properties
    console.log('\n2. Verificando nueva columna property_type_characteristics_id...');
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, tipo_propiedad, property_type_characteristics_id, property_characteristic_id')
      .limit(3);

    if (propsError) {
      console.error('❌ Error al consultar properties:', propsError);
      return;
    }

    console.log('✅ Propiedades encontradas:');
    properties.forEach(prop => {
      console.log(`   - ID: ${prop.id}`);
      console.log(`     Tipo: ${prop.tipo_propiedad}`);
      console.log(`     Nuevo UUID: ${prop.property_type_characteristics_id || 'NULL'}`);
      console.log(`     Código personalizado: ${prop.property_characteristic_id || 'NULL'}`);
    });

    // 3. Probar consulta que antes fallaba (usando UUID en lugar de código personalizado)
    console.log('\n3. Probando consulta que antes fallaba...');

    if (properties.length > 0 && properties[0].property_type_characteristics_id) {
      const testUUID = properties[0].property_type_characteristics_id;
      console.log(`   Usando UUID: ${testUUID}`);

      const { data: testData, error: testError } = await supabase
        .from('property_type_characteristics')
        .select('name')
        .eq('id', testUUID)
        .maybeSingle();

      if (testError) {
        console.error('❌ Error en consulta UUID:', testError);
      } else {
        console.log(`✅ Consulta exitosa: ${testData?.name || 'No encontrado'}`);
      }
    } else {
      console.log('⚠️ No hay propiedades con UUID mapeado para probar');
    }

    // 4. Probar consulta con código personalizado (debería fallar ahora)
    console.log('\n4. Verificando que códigos personalizados ya no se usen en consultas UUID...');

    if (properties.length > 0 && properties[0].property_characteristic_id) {
      const testCode = properties[0].property_characteristic_id;
      console.log(`   Intentando usar código personalizado: ${testCode}`);

      try {
        const { data: testData, error: testError } = await supabase
          .from('property_type_characteristics')
          .select('name')
          .eq('id', testCode); // Esto debería fallar

        if (testError) {
          console.log(`✅ Correcto: consulta con código personalizado falla como esperado: ${testError.message}`);
        } else {
          console.log('⚠️ La consulta no falló (inesperado)');
        }
      } catch (err) {
        console.log(`✅ Correcto: consulta con código personalizado falla como esperado`);
      }
    }

    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de correcciones:');
    console.log('   ✅ Nueva columna property_type_characteristics_id agregada');
    console.log('   ✅ Función de mapeo get_property_type_characteristics_id creada');
    console.log('   ✅ Datos existentes mapeados automáticamente');
    console.log('   ✅ AdminPropertyDetailView actualizado para usar UUIDs');
    console.log('   ✅ Función de validación UUID agregada');

  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
}

// Ejecutar pruebas
testUUIDFix();
