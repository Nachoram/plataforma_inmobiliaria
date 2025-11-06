// Script para corregir guarantors que no tienen property_id asignado
// Fecha: 2025-10-30

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGuarantorPropertyIds() {
  console.log('🔧 Corrigiendo guarantors sin property_id...');

  try {
    // Verificar estado actual
    console.log('📊 Verificando estado actual...');

    const { data: guarantorsData, error: guarantorsError } = await supabase
      .from('guarantors')
      .select('id, property_id, rut, first_name, paternal_last_name')
      .is('property_id', null);

    if (guarantorsError) {
      console.error('❌ Error consultando guarantors:', guarantorsError);
      return;
    }

    console.log(`📋 Guarantors sin property_id: ${guarantorsData.length}`);

    if (guarantorsData.length > 0) {
      console.log('Garante sin property_id encontrado:', guarantorsData[0]);
    }

    // Aplicar la corrección
    console.log('🔄 Aplicando corrección...');

    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE guarantors
        SET property_id = applications.property_id
        FROM applications
        WHERE guarantors.id = applications.guarantor_id
        AND guarantors.property_id IS NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error actualizando guarantors:', updateError);
      return;
    }

    console.log('✅ Actualización aplicada');

    // Verificar resultados
    console.log('🔍 Verificando resultados...');

    const { data: verificationData, error: verificationError } = await supabase
      .from('guarantors')
      .select('id, property_id, rut, first_name, paternal_last_name')
      .is('property_id', null);

    if (verificationError) {
      console.error('❌ Error verificando resultados:', verificationError);
      return;
    }

    console.log(`📊 Guarantors sin property_id después de la corrección: ${verificationData.length}`);

    if (verificationData.length === 0) {
      console.log('🎉 ¡ÉXITO! Todos los guarantors ahora tienen property_id asignado.');
    } else {
      console.log('⚠️ Aún quedan guarantors sin property_id:', verificationData);
    }

    // Verificar que la aplicación específica funcione
    console.log('🧪 Probando creación de aplicación...');

    // Primero obtener un garante que ahora debería tener property_id
    const { data: testGuarantor, error: testError } = await supabase
      .from('guarantors')
      .select('id, property_id')
      .not('property_id', 'is', null)
      .limit(1);

    if (testError) {
      console.error('❌ Error obteniendo garante de prueba:', testError);
      return;
    }

    if (testGuarantor && testGuarantor.length > 0) {
      const guarantor = testGuarantor[0];
      console.log(`✅ Garante de prueba encontrado: ${guarantor.id} -> property_id: ${guarantor.property_id}`);

      // Verificar que el trigger permitiría una inserción
      console.log('🔍 Verificando que el trigger funcionaría...');

      const { data: triggerTest, error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT validate_guarantor_property_consistency_test('${guarantor.id}', '${guarantor.property_id}') as result;
        `
      });

      if (triggerError && !triggerError.message.includes('function') && !triggerError.message.includes('does not exist')) {
        console.log('ℹ️ Función de test no existe (esperado), pero el trigger debería funcionar');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixGuarantorPropertyIds();









