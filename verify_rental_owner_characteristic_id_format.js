#!/usr/bin/env node

/**
 * VERIFICATION SCRIPT: Rental Owner Characteristic ID Format
 * Verifies that all rental_owner_characteristic_id follow the format RENTAL_OWNER_xxxxxx
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - you can also use environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRentalOwnerIds() {
  console.log('🔍 VERIFICANDO FORMATO DE RENTAL_OWNER_CHARACTERISTIC_ID...');
  console.log('========================================================');

  try {
    // Get all rental owners
    const { data: rentalOwners, error } = await supabase
      .from('rental_owners')
      .select('id, first_name, paternal_last_name, rental_owner_characteristic_id, created_at');

    if (error) {
      console.error('❌ Error al consultar rental_owners:', error.message);
      return;
    }

    console.log(`📊 Total de rental_owners encontrados: ${rentalOwners.length}`);

    let correctFormat = 0;
    let incorrectFormat = 0;
    let missingIds = 0;
    const incorrectIds = [];

    // Regex for correct format: RENTAL_OWNER_ followed by exactly 6 digits
    const correctFormatRegex = /^RENTAL_OWNER_[0-9]{6}$/;

    rentalOwners.forEach(owner => {
      const id = owner.rental_owner_characteristic_id;

      if (!id || id.trim() === '') {
        missingIds++;
        incorrectIds.push({
          id: owner.id,
          name: `${owner.first_name || 'Sin nombre'} ${owner.paternal_last_name || 'Sin apellido'}`,
          issue: 'ID faltante o vacío',
          current_id: id
        });
      } else if (!correctFormatRegex.test(id)) {
        incorrectFormat++;
        incorrectIds.push({
          id: owner.id,
          name: `${owner.first_name || 'Sin nombre'} ${owner.paternal_last_name || 'Sin apellido'}`,
          issue: 'Formato incorrecto',
          current_id: id,
          expected_format: 'RENTAL_OWNER_xxxxxx'
        });
      } else {
        correctFormat++;
      }
    });

    console.log('');
    console.log('📊 RESULTADOS DE VERIFICACIÓN:');
    console.log(`  ✅ IDs con formato correcto (RENTAL_OWNER_xxxxxx): ${correctFormat}`);
    console.log(`  ❌ IDs con formato incorrecto: ${incorrectFormat}`);
    console.log(`  ⚠️  IDs faltantes: ${missingIds}`);
    console.log(`  📈 Porcentaje correcto: ${((correctFormat / rentalOwners.length) * 100).toFixed(1)}%`);

    if (incorrectIds.length > 0) {
      console.log('');
      console.log('🔧 DETALLE DE IDs PROBLEMÁTICOS:');
      console.log('========================================================');

      incorrectIds.slice(0, 10).forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   Nombre: ${item.name}`);
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

      const correctSamples = rentalOwners
        .filter(owner => owner.rental_owner_characteristic_id && correctFormatRegex.test(owner.rental_owner_characteristic_id))
        .slice(0, 5);

      correctSamples.forEach((owner, index) => {
        console.log(`${index + 1}. ${owner.rental_owner_characteristic_id} - ${owner.first_name || 'Sin nombre'} ${owner.paternal_last_name || 'Sin apellido'}`);
      });
    }

    console.log('');
    console.log('========================================================');

    if (incorrectFormat === 0 && missingIds === 0) {
      console.log('✅ ÉXITO: Todos los rental_owner_characteristic_id tienen el formato correcto RENTAL_OWNER_xxxxxx');
      console.log('🎯 Los IDs están optimizados para búsqueda de arrendatarios en generación de contratos');
      process.exit(0);
    } else {
      console.log('⚠️  ATENCIÓN: Se encontraron problemas con algunos IDs');
      console.log('💡 Recomendación: Ejecutar la migración fix_rental_owner_characteristic_id_to_6_digits.sql');
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
    const formattedId = `RENTAL_OWNER_${i.toString().padStart(6, '0')}`;
    console.log(`Secuencia ${i} → ${formattedId}`);
  }

  console.log('');
}

// Run verification
verifyRentalOwnerIds().then(() => {
  testGeneratorOutput();
});
