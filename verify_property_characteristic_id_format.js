#!/usr/bin/env node

/**
 * VERIFICATION SCRIPT: Property Characteristic ID Format
 * Verifies that all property_characteristic_id follow the format PROP_xxxxxx
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - you can also use environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPropertyIds() {
  console.log('🔍 VERIFICANDO FORMATO DE PROPERTY_CHARACTERISTIC_ID...');
  console.log('========================================================');

  try {
    // Get all properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, address_street, address_number, property_characteristic_id, created_at');

    if (error) {
      console.error('❌ Error al consultar properties:', error.message);
      return;
    }

    console.log(`📊 Total de properties encontrados: ${properties.length}`);

    let correctFormat = 0;
    let incorrectFormat = 0;
    let missingIds = 0;
    const incorrectIds = [];

    // Regex for correct format: PROP_ followed by exactly 6 digits
    const correctFormatRegex = /^PROP_[0-9]{6}$/;

    properties.forEach(property => {
      const id = property.property_characteristic_id;

      if (!id || id.trim() === '') {
        missingIds++;
        incorrectIds.push({
          id: property.id,
          address: `${property.address_street || 'Sin calle'} ${property.address_number || 'Sin número'}`,
          issue: 'ID faltante o vacío',
          current_id: id
        });
      } else if (!correctFormatRegex.test(id)) {
        incorrectFormat++;
        incorrectIds.push({
          id: property.id,
          address: `${property.address_street || 'Sin calle'} ${property.address_number || 'Sin número'}`,
          issue: 'Formato incorrecto',
          current_id: id,
          expected_format: 'PROP_xxxxxx'
        });
      } else {
        correctFormat++;
      }
    });

    console.log('');
    console.log('📊 RESULTADOS DE VERIFICACIÓN:');
    console.log(`  ✅ IDs con formato correcto (PROP_xxxxxx): ${correctFormat}`);
    console.log(`  ❌ IDs con formato incorrecto: ${incorrectFormat}`);
    console.log(`  ⚠️  IDs faltantes: ${missingIds}`);
    console.log(`  📈 Porcentaje correcto: ${((correctFormat / properties.length) * 100).toFixed(1)}%`);

    if (incorrectIds.length > 0) {
      console.log('');
      console.log('🔧 DETALLE DE IDs PROBLEMÁTICOS:');
      console.log('========================================================');

      incorrectIds.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   Dirección: ${item.address}`);
        console.log(`   Problema: ${item.issue}`);
        console.log(`   ID actual: ${item.current_id || 'N/A'}`);
        if (item.expected_format) {
          console.log(`   Formato esperado: ${item.expected_format}`);
        }
        console.log('');
      });

      if (incorrectIds.length > 10) {
        console.log(`... y ${incorrectIds.length - 10} más`);
      }
    }

    // Show sample of correct IDs
    if (correctFormat > 0) {
      console.log('');
      console.log('📋 EJEMPLOS DE IDs CON FORMATO CORRECTO:');
      console.log('========================================================');

      const correctSamples = properties
        .filter(property => property.property_characteristic_id && correctFormatRegex.test(property.property_characteristic_id))
        .slice(0, 5);

      correctSamples.forEach((property, index) => {
        console.log(`${index + 1}. ${property.property_characteristic_id} - ${property.address_street || 'Sin calle'} ${property.address_number || 'Sin número'}`);
      });
    }

    console.log('');
    console.log('========================================================');

    if (incorrectFormat === 0 && missingIds === 0) {
      console.log('✅ ÉXITO: Todos los property_characteristic_id tienen el formato correcto PROP_xxxxxx');
      console.log('🎯 Los IDs están optimizados para búsqueda de propiedades en generación de contratos');
      process.exit(0);
    } else {
      console.log('⚠️  ATENCIÓN: Se encontraron problemas con algunos IDs');
      console.log('💡 Recomendación: Ejecutar la migración fix_property_characteristic_id_to_6_digits.sql');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Test the generator function format
function testGeneratorOutput() {
  console.log('');
  console.log('🧪 PRUEBA DE FORMATO DEL GENERADOR:');
  console.log('========================================================');

  // Simulate what the function should generate
  for (let i = 1; i <= 10; i++) {
    const formattedId = `PROP_${i.toString().padStart(6, '0')}`;
    console.log(`Secuencia ${i} → ${formattedId}`);
  }

  console.log('');
}

// Run verification
verifyPropertyIds().then(() => {
  testGeneratorOutput();
});
