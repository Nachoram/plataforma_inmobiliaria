// Script simple para corregir guarantor_characteristic_id faltantes
const { createClient } = require('@supabase/supabase-js');

async function fixGuarantorIds() {
  console.log('🔧 Corrigiendo guarantor_characteristic_id faltantes...');

  const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Primero verificar el estado actual
    console.log('📊 Verificando estado actual...');
    const { data: beforeData, error: beforeError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .not('guarantor_id', 'is', null);

    if (beforeError) {
      console.error('❌ Error verificando datos iniciales:', beforeError);
      return;
    }

    const beforeCount = beforeData.filter(app => !app.guarantor_characteristic_id).length;
    console.log(`📊 Aplicaciones con guarantor_id pero sin guarantor_characteristic_id: ${beforeCount}`);

    if (beforeCount === 0) {
      console.log('✅ No hay aplicaciones que necesiten corrección.');
      return;
    }

    // Ejecutar la corrección usando rpc con SQL personalizado
    console.log('🔄 Ejecutando corrección...');

    // Usar el service role key para poder ejecutar SQL
    const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

    const { error: updateError } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        UPDATE applications
        SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
        WHERE guarantor_characteristic_id IS NULL AND guarantor_id IS NOT NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error ejecutando UPDATE:', updateError);
      console.log('💡 Intentando método alternativo...');

      // Método alternativo: actualizar registro por registro
      console.log('🔄 Actualizando registro por registro...');
      let updatedCount = 0;

      for (const app of beforeData.filter(app => !app.guarantor_characteristic_id)) {
        const characteristicId = `GUAR_${Math.floor(new Date(app.created_at).getTime() / 1000).toString().padStart(10, '0')}_${app.id.substring(0, 8)}`;

        const { error: singleUpdateError } = await supabase
          .from('applications')
          .update({ guarantor_characteristic_id: characteristicId })
          .eq('id', app.id);

        if (singleUpdateError) {
          console.error(`❌ Error actualizando aplicación ${app.id}:`, singleUpdateError);
        } else {
          updatedCount++;
        }
      }

      console.log(`✅ Actualizados ${updatedCount} registros individualmente.`);
    } else {
      console.log('✅ UPDATE ejecutado exitosamente via RPC.');
    }

    // Verificar resultados
    console.log('\n🔍 Verificando resultados...');
    const { data: afterData, error: afterError } = await supabase
      .from('applications')
      .select('id, guarantor_id, guarantor_characteristic_id')
      .not('guarantor_id', 'is', null);

    if (afterError) {
      console.error('❌ Error verificando resultados:', afterError);
      return;
    }

    const afterCount = afterData.filter(app => !app.guarantor_characteristic_id).length;
    console.log(`📊 Aplicaciones con guarantor_id pero sin guarantor_characteristic_id después: ${afterCount}`);

    // Verificar vista
    const { data: viewData, error: viewError } = await supabase
      .from('completed_processes_characteristics')
      .select('contract_id, guarantor_characteristic_id')
      .limit(5);

    if (!viewError) {
      const viewWithId = viewData.filter(row => row.guarantor_characteristic_id).length;
      console.log(`📋 Registros en vista con guarantor_characteristic_id: ${viewWithId}/${viewData.length}`);
    }

    if (afterCount === 0) {
      console.log('🎉 ¡ÉXITO! Todas las aplicaciones ahora tienen guarantor_characteristic_id.');
    } else {
      console.log(`⚠️  Aún quedan ${afterCount} aplicaciones sin guarantor_characteristic_id.`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

fixGuarantorIds();
















