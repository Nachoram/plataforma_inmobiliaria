// ============================================================================
// DIAGNÓSTICO DE PERMISOS DE CONTRATOS - EJECUTABLE EN NAVEGADOR
// ============================================================================
// Copia y pega este código en la CONSOLA DEL NAVEGADOR (F12)
// cuando estés logueado en tu aplicación y veas un contrato.
//
// Instrucciones:
// 1. Inicia sesión en tu aplicación
// 2. Ve a la página de contratos
// 3. Abre la consola del navegador (F12)
// 4. Copia y pega TODO este código
// 5. Presiona Enter
// 6. Revisa los resultados
// ============================================================================

(async () => {
  console.log('🔍 === DIAGNÓSTICO DE PERMISOS DE CONTRATOS ===');

  try {
    // Importar Supabase si no está disponible globalmente
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
      console.error('❌ No hay usuario autenticado. Inicia sesión primero.');
      return;
    }

    console.log('✅ Usuario autenticado:', session.user.id);

    // 2. VERIFICAR POLÍTICAS RLS
    console.log('🔒 === VERIFICANDO POLÍTICAS RLS ===');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, tablename')
      .eq('tablename', 'rental_contracts')
      .eq('cmd', 'UPDATE');

    if (policiesError) {
      console.error('❌ Error consultando políticas:', policiesError);
    } else {
      console.log('📋 Políticas UPDATE encontradas:', policies.length);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}`);
      });
    }

    // 3. VERIFICAR CONTRATOS DISPONIBLES Y SU FORMATO
    console.log('📄 === VERIFICANDO CONTRATOS DISPONIBLES ===');
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contracts')
      .select(`
        id,
        status,
        contract_format,
        contract_html,
        contract_content,
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
      .limit(5);

    if (contractsError) {
      console.error('❌ Error consultando contratos:', contractsError);
    } else {
      console.log(`📋 Encontrados ${contracts.length} contratos:`);
      contracts.forEach(contract => {
        const applicantId = contract.applications?.applicant_id;
        const ownerId = contract.applications?.properties?.owner_id;
        const address = contract.applications?.properties?.address_street || 'Sin dirección';

        const canEdit = (
          applicantId === session.user.id ||
          ownerId === session.user.id
        );

        // Verificar qué columnas tienen contenido
        const hasHtml = contract.contract_html && contract.contract_html.length > 0;
        const hasContent = contract.contract_content && Object.keys(contract.contract_content).length > 0;

        console.log(`  ID: ${contract.id}`);
        console.log(`    Estado: ${contract.status}`);
        console.log(`    Formato: ${contract.contract_format || 'No especificado'}`);
        console.log(`    Tiene contract_html: ${hasHtml ? '✅' : '❌'}`);
        console.log(`    Tiene contract_content: ${hasContent ? '✅' : '❌'}`);
        console.log(`    Propiedad: ${address}`);
        console.log(`    Eres aplicante: ${applicantId === session.user.id ? '✅' : '❌'}`);
        console.log(`    Eres propietario: ${ownerId === session.user.id ? '✅' : '❌'}`);
        console.log(`    ✅ PUEDES EDITAR: ${canEdit ? 'SÍ' : 'NO'}`);
        console.log('');
      });
    }

    // 4. VERIFICAR ESTRUCTURA DE LA TABLA
    console.log('📋 === VERIFICANDO ESTRUCTURA DE RENTAL_CONTRACTS ===');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'rental_contracts'
          AND column_name IN ('contract_html', 'contract_content', 'updated_at')
          ORDER BY column_name;
        `
      })
      .select();

    if (columnsError) {
      console.log('⚠️ No se pudo verificar columnas via RPC, intentando consulta directa...');
    } else {
      console.log('📋 Columnas relacionadas con contratos:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not null'})`);
      });
    }

    // 5. PRUEBA DE EDICIÓN REAL (con contract_html)
    console.log('✏️ === PRUEBA DE EDICIÓN REAL ===');
    if (contracts && contracts.length > 0) {
      // Tomar el primer contrato que el usuario puede editar
      const editableContract = contracts.find(contract => {
        const applicantId = contract.applications?.applicant_id;
        const ownerId = contract.applications?.properties?.owner_id;
        return applicantId === session.user.id || ownerId === session.user.id;
      });

      if (editableContract) {
        console.log(`🔄 Intentando editar contrato: ${editableContract.id}`);

        // Determinar qué columna actualizar basada en el contenido existente
        const hasHtml = editableContract.contract_html && editableContract.contract_html.length > 0;
        const hasContent = editableContract.contract_content && Object.keys(editableContract.contract_content).length > 0;

        let updateData = { updated_at: new Date().toISOString() };
        let columnToUpdate = '';

        if (hasHtml) {
          // El contrato usa HTML - actualizar contract_html
          console.log(`📝 Actualizando columna: contract_html`);
          columnToUpdate = 'contract_html';
          updateData.contract_html = `<p>Contenido de prueba actualizado el ${new Date().toLocaleString()}</p>`;
        } else if (hasContent) {
          // El contrato usa JSON estructurado - actualizar contract_content
          console.log(`📝 Actualizando columna: contract_content`);
          columnToUpdate = 'contract_content';
          updateData.contract_content = {
            ...editableContract.contract_content,
            test_update: `Prueba de edición ${new Date().toISOString()}`
          };
        } else {
          // No tiene contenido - intentar contract_html por defecto
          console.log(`📝 El contrato no tiene contenido - probando contract_html`);
          columnToUpdate = 'contract_html';
          updateData.contract_html = `<p>Contenido inicial de prueba ${new Date().toLocaleString()}</p>`;
        }

        const { error: updateError } = await supabase
          .from('rental_contracts')
          .update(updateData)
          .eq('id', editableContract.id);

        if (updateError) {
          console.error(`❌ Error en edición de ${columnToUpdate}:`, updateError.message);
          console.error('Código de error:', updateError.code);
          console.error('Detalles:', updateError.details);
        } else {
          console.log(`✅ Edición exitosa de ${columnToUpdate} - ¡Los contratos se pueden editar!`);

          // Verificar que el cambio se guardó
          const { data: verifyData, error: verifyError } = await supabase
            .from('rental_contracts')
            .select(columnToUpdate)
            .eq('id', editableContract.id)
            .single();

          if (verifyError) {
            console.error('⚠️ Error verificando el cambio:', verifyError);
          } else {
            console.log('✅ Verificación: El cambio se guardó correctamente');
            const content = verifyData[columnToUpdate];
            if (typeof content === 'string') {
              console.log('📄 Contenido actualizado:', content.substring(0, 100) + '...');
            } else {
              console.log('📄 Contenido actualizado:', JSON.stringify(content).substring(0, 100) + '...');
            }
          }
        }

      } else {
        console.log('⚠️ No se encontraron contratos que puedas editar');
        console.log('Esto puede significar:');
        console.log('  - No tienes contratos asociados');
        console.log('  - O hay un problema con las relaciones de datos');
      }
    }

    console.log('🎉 === DIAGNÓSTICO COMPLETADO ===');

  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
  }
})();

// ============================================================================
// RESULTADOS ESPERADOS:
// ============================================================================
// ✅ Usuario autenticado: [tu-user-id]
// ✅ Políticas UPDATE encontradas: 1 (contracts_update_related)
// ✅ Al menos un contrato donde "PUEDES EDITAR: SÍ"
// ✅ Información sobre qué columna tiene contenido (contract_html o contract_content)
// ✅ Edición exitosa de la columna correcta
//
// ============================================================================
// SI ALGO FALLA:
// ============================================================================
// ❌ No hay usuario autenticado → Inicia sesión en la aplicación
// ❌ No hay políticas UPDATE → Ejecuta SOLUCION_RAPIDA_EDICION_CONTRATOS.sql
// ❌ Todos los contratos muestran "PUEDES EDITAR: NO" → Verifica que seas owner/applicant
// ❌ Error "permission denied" → Políticas RLS bloqueando, ejecuta el script de solución
// ❌ Error en edición → Revisa permisos de tabla o problemas de RLS
//
// ============================================================================
// NOTA SOBRE FORMATOS:
// ============================================================================
// Tu sistema soporta dos formatos de contratos:
// - contract_html: HTML completo generado por N8N
// - contract_content: JSON estructurado editable
//
// El diagnóstico detectará automáticamente cuál usar y lo probará.
// ============================================================================
