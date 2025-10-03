// ============================================================================
// PRUEBA ESPECÍFICA: Edición de contract_html
// ============================================================================
// Script para probar específicamente la edición de contratos en formato HTML
// Útil si sabes que tus contratos están en la columna contract_html
//
// Instrucciones:
// 1. Inicia sesión en tu aplicación
// 2. Abre la consola del navegador (F12)
// 3. Copia y pega TODO este código
// 4. Presiona Enter
// ============================================================================

(async () => {
  console.log('🔍 === PRUEBA DE EDICIÓN CONTRACT_HTML ===');

  try {
    // Importar Supabase
    let supabase;
    try {
      supabase = window.supabase || (await import('./src/lib/supabase.js')).supabase;
    } catch (e) {
      console.error('❌ No se pudo acceder a Supabase. Asegúrate de estar en la aplicación.');
      return;
    }

    // Verificar autenticación
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error('❌ No hay usuario autenticado. Inicia sesión primero.');
      return;
    }
    console.log('✅ Usuario autenticado:', session.user.id);

    // Buscar contratos que el usuario puede editar
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contracts')
      .select(`
        id,
        status,
        contract_html,
        contract_format,
        application_id,
        applications (
          applicant_id,
          property_id,
          properties (
            owner_id,
            address_street
          )
        )
      `)
      .not('contract_html', 'is', null)
      .limit(3);

    if (contractsError) {
      console.error('❌ Error consultando contratos:', contractsError);
      return;
    }

    if (!contracts || contracts.length === 0) {
      console.log('⚠️ No se encontraron contratos con contract_html');
      return;
    }

    console.log(`📋 Encontrados ${contracts.length} contratos con contract_html:`);

    // Encontrar un contrato editable
    const editableContract = contracts.find(contract => {
      const applicantId = contract.applications?.applicant_id;
      const ownerId = contract.applications?.properties?.owner_id;
      return applicantId === session.user.id || ownerId === session.user.id;
    });

    if (!editableContract) {
      console.log('❌ No tienes permisos para editar ninguno de estos contratos');
      console.log('Necesitas ser el aplicante o propietario de al menos un contrato.');
      return;
    }

    console.log(`🎯 Probando edición del contrato: ${editableContract.id}`);
    console.log(`📍 Estado actual: ${editableContract.status}`);
    console.log(`🏠 Propiedad: ${editableContract.applications?.properties?.address_street || 'Sin dirección'}`);

    // Crear contenido HTML de prueba
    const timestamp = new Date().toLocaleString();
    const testHtml = `
      <div style="border: 2px solid #4CAF50; padding: 20px; margin: 10px;">
        <h2 style="color: #4CAF50;">🧪 CONTRATO DE PRUEBA - EDITADO</h2>
        <p><strong>Fecha de edición:</strong> ${timestamp}</p>
        <p><strong>Editado por:</strong> ${session.user.id}</p>
        <p><strong>Estado del contrato:</strong> ${editableContract.status}</p>
        <p style="color: #666; font-style: italic;">
          Este es un contenido de prueba generado automáticamente para verificar que la edición funciona.
        </p>
        <hr>
        <p><strong>Contenido original:</strong></p>
        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
          ${editableContract.contract_html?.substring(0, 200) || 'Sin contenido original'}...
        </div>
      </div>
    `;

    console.log('📝 Contenido HTML de prueba creado');
    console.log('🔄 Enviando actualización a contract_html...');

    // Actualizar contract_html
    const { error: updateError } = await supabase
      .from('rental_contracts')
      .update({
        contract_html: testHtml,
        updated_at: new Date().toISOString()
      })
      .eq('id', editableContract.id);

    if (updateError) {
      console.error('❌ ERROR en la edición:', updateError.message);
      console.error('Código:', updateError.code);
      console.error('Detalles:', updateError.details);

      if (updateError.message.includes('permission denied') || updateError.message.includes('RLS')) {
        console.log('💡 SOLUCIÓN: Las políticas RLS están bloqueando. Ejecuta SOLUCION_RAPIDA_EDICION_CONTRATOS.sql en Supabase SQL Editor');
      }
    } else {
      console.log('✅ ¡EDICIÓN EXITOSA! El contract_html se actualizó correctamente');

      // Verificar que se guardó
      const { data: verifyData, error: verifyError } = await supabase
        .from('rental_contracts')
        .select('contract_html, updated_at')
        .eq('id', editableContract.id)
        .single();

      if (verifyError) {
        console.error('⚠️ Error verificando el guardado:', verifyError);
      } else {
        console.log('✅ Verificación exitosa:');
        console.log('   - Fecha de actualización:', verifyData.updated_at);
        console.log('   - Contenido actualizado:', verifyData.contract_html?.substring(0, 150) + '...');

        // Verificar que contiene nuestro timestamp
        if (verifyData.contract_html?.includes(timestamp)) {
          console.log('✅ CONFIRMACIÓN: El contenido se guardó exactamente como enviado');
        }
      }

      console.log('');
      console.log('🎉 ¡PERFECTO! Los contratos se pueden editar correctamente.');
      console.log('📝 El ContractEditor debería poder guardar cambios ahora.');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
})();

// ============================================================================
// RESULTADOS ESPERADOS:
// ============================================================================
// ✅ Usuario autenticado
// ✅ Contrato encontrado con contract_html
// ✅ Edición exitosa
// ✅ Verificación que el contenido se guardó
//
// ============================================================================
// SI FALLA:
// ============================================================================
// ❌ "No hay usuario autenticado" → Inicia sesión
// ❌ "No se encontraron contratos" → No tienes contratos con HTML
// ❌ "No tienes permisos" → No eres owner/applicant
// ❌ "permission denied" → Ejecuta SOLUCION_RAPIDA_EDICION_CONTRATOS.sql
// ============================================================================
