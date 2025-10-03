// ============================================================================
// DIAGNÓSTICO ESPECÍFICO: Contrato 30c300dc-f66e-482e-857b-39628e936e89
// ============================================================================
// Script para diagnosticar específicamente el contrato que no se puede editar
//
// Instrucciones:
// 1. Ve a: http://localhost:5173/contract/30c300dc-f66e-482e-857b-39628e936e89
// 2. Abre la consola del navegador (F12)
// 3. Copia y pega TODO este código
// 4. Presiona Enter
// ============================================================================

(async () => {
  console.log('🔍 === DIAGNÓSTICO CONTRATO ESPECÍFICO ===');
  console.log('📄 Contrato ID: 30c300dc-f66e-482e-857b-39628e936e89');

  try {
    // Importar Supabase
    let supabase;
    try {
      supabase = window.supabase || (await import('./src/lib/supabase.js')).supabase;
    } catch (e) {
      console.error('❌ No se pudo acceder a Supabase. Asegúrate de estar en la aplicación.');
      return;
    }

    // 1. VERIFICAR AUTENTICACIÓN
    console.log('🔐 === VERIFICANDO AUTENTICACIÓN ===');
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError);
      return;
    }

    if (!session?.user) {
      console.error('❌ No hay usuario autenticado. Debes iniciar sesión para ver contratos.');
      console.log('💡 SOLUCIÓN: Inicia sesión en la aplicación primero');
      return;
    }

    console.log('✅ Usuario autenticado:', session.user.id);

    // 2. INTENTAR CARGAR EL CONTRATO ESPECÍFICO
    console.log('📄 === INTENTANDO CARGAR CONTRATO ===');
    const contractId = '30c300dc-f66e-482e-857b-39628e936e89';

    const { data: contractData, error: contractError } = await supabase
      .from('rental_contracts')
      .select(`
        id,
        contract_content,
        contract_html,
        contract_format,
        contract_number,
        status,
        applications (
          id,
          applicant_id,
          property_id,
          snapshot_applicant_first_name,
          snapshot_applicant_paternal_last_name,
          properties (
            owner_id,
            description,
            address_street,
            address_number,
            address_department,
            address_commune,
            address_region
          )
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError) {
      console.error('❌ Error cargando contrato:', contractError.message);
      console.error('Código de error:', contractError.code);

      if (contractError.message.includes('permission denied') || contractError.message.includes('RLS')) {
        console.log('🚫 PROBLEMA: No tienes permisos para ver este contrato');
        console.log('💡 POSIBLES CAUSAS:');
        console.log('   - No eres el propietario de la propiedad');
        console.log('   - No eres el aplicante de la solicitud');
        console.log('   - Las políticas RLS están bloqueando el acceso');
        console.log('💡 SOLUCIÓN: SOLUCION_RAPIDA_EDICION_CONTRATOS.sql');
      } else if (contractError.code === 'PGRST116') {
        console.log('🚫 PROBLEMA: El contrato no existe');
        console.log('💡 VERIFICA: El ID del contrato es correcto');
      }

      return;
    }

    if (!contractData) {
      console.error('❌ Contrato no encontrado');
      return;
    }

    console.log('✅ Contrato cargado exitosamente');
    console.log('📋 Detalles del contrato:');
    console.log('   - ID:', contractData.id);
    console.log('   - Estado:', contractData.status);
    console.log('   - Formato:', contractData.contract_format || 'No especificado');
    console.log('   - Número:', contractData.contract_number || 'Sin número');
    console.log('   - Tiene contract_html:', !!contractData.contract_html);
    console.log('   - Tiene contract_content:', !!contractData.contract_content);

    // 3. VERIFICAR PERMISOS PARA EDITAR
    console.log('🔒 === VERIFICANDO PERMISOS DE EDICIÓN ===');

    const applicantId = contractData.applications?.applicant_id;
    const ownerId = contractData.applications?.properties?.owner_id;

    console.log('👤 Aplicante ID:', applicantId);
    console.log('🏠 Propietario ID:', ownerId);
    console.log('🔑 Tu usuario ID:', session.user.id);

    const canEditAsApplicant = applicantId === session.user.id;
    const canEditAsOwner = ownerId === session.user.id;
    const canEdit = canEditAsApplicant || canEditAsOwner;

    console.log('✅ Puedes editar como aplicante:', canEditAsApplicant);
    console.log('✅ Puedes editar como propietario:', canEditAsOwner);
    console.log('🎯 PERMISO TOTAL DE EDICIÓN:', canEdit ? '✅ SÍ' : '❌ NO');

    if (!canEdit) {
      console.log('🚫 POR QUÉ NO PUEDES EDITAR:');
      if (!canEditAsApplicant && !canEditAsOwner) {
        console.log('   - No eres ni el aplicante ni el propietario');
      } else {
        console.log('   - Error inesperado en la lógica de permisos');
      }
      console.log('💡 SOLUCIÓN: Solo puedes editar contratos donde seas el propietario o aplicante');
      return;
    }

    // 4. PROBAR EDICIÓN REAL
    console.log('✏️ === PROBANDO EDICIÓN REAL ===');

    // Determinar qué columna actualizar
    const hasHtml = contractData.contract_html && contractData.contract_html.length > 0;
    const hasContent = contractData.contract_content && Object.keys(contractData.contract_content).length > 0;

    let updateData = { updated_at: new Date().toISOString() };
    let columnToUpdate = '';

    if (hasHtml) {
      console.log('📝 Actualizando contract_html');
      columnToUpdate = 'contract_html';
      updateData.contract_html = contractData.contract_html + '\n\n<!-- EDITADO DESDE DIAGNÓSTICO - ' + new Date().toISOString() + ' -->';
    } else if (hasContent) {
      console.log('📝 Actualizando contract_content');
      columnToUpdate = 'contract_content';
      updateData.contract_content = {
        ...contractData.contract_content,
        diagnostico_test: `Editado desde diagnóstico ${new Date().toISOString()}`
      };
    } else {
      console.log('📝 Contrato sin contenido - agregando contract_html básico');
      columnToUpdate = 'contract_html';
      updateData.contract_html = `<p>Contrato editado desde diagnóstico - ${new Date().toISOString()}</p>`;
    }

    const { error: updateError } = await supabase
      .from('rental_contracts')
      .update(updateData)
      .eq('id', contractId);

    if (updateError) {
      console.error('❌ Error en edición:', updateError.message);
      console.error('Código:', updateError.code);

      if (updateError.message.includes('permission denied') || updateError.message.includes('RLS')) {
        console.log('🚫 PROBLEMA: Políticas RLS bloqueando la edición');
        console.log('💡 SOLUCIÓN: Ejecuta SOLUCION_RAPIDA_EDICION_CONTRATOS.sql');
      }
    } else {
      console.log('✅ ¡EDICIÓN EXITOSA!');
      console.log('📝 Columna actualizada:', columnToUpdate);
      console.log('🎉 El contrato se puede editar correctamente');
      console.log('💡 El botón "Editar" debería aparecer en la interfaz');
    }

    // 5. VERIFICAR POLÍTICAS RLS
    console.log('🔒 === VERIFICANDO POLÍTICAS RLS ===');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname, cmd')
        .eq('tablename', 'rental_contracts')
        .eq('cmd', 'UPDATE');

      if (policiesError) {
        console.log('⚠️ No se pudo verificar políticas desde el navegador');
      } else {
        console.log('📋 Políticas UPDATE activas:', policies.length);
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}`);
        });
      }
    } catch (e) {
      console.log('⚠️ Error verificando políticas desde el navegador');
    }

  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
  }

  console.log('🎯 === DIAGNÓSTICO COMPLETADO ===');
})();

// ============================================================================
// INTERPRETACIÓN DE RESULTADOS:
// ============================================================================
// ✅ Usuario autenticado + Contrato cargado + Permiso de edición + Edición exitosa
//    → TODO FUNCIONA - El botón debería aparecer
//
// ❌ Usuario autenticado + Contrato cargado + PERO "No tienes permisos"
//    → Problema: No eres owner/applicant de este contrato
//
// ❌ Usuario NO autenticado
//    → Problema: Debes iniciar sesión
//
// ❌ Error "permission denied" al cargar contrato
//    → Problema: RLS bloqueando lectura, ejecuta SOLUCION_RAPIDA_EDICION_CONTRATOS.sql
//
// ❌ Contrato no encontrado
//    → Problema: ID incorrecto o contrato no existe
// ============================================================================
