// ============================================================================
// PRUEBA DE LA INTERFAZ HTML EDITOR
// ============================================================================
// Script para probar la nueva funcionalidad de edición HTML
//
// Para probar:
// 1. Ejecuta npm run dev
// 2. Ve a http://localhost:5173/
// 3. Inicia sesión
// 4. Ve a un contrato que tenga contract_html (formato 'html' o 'hybrid')
// 5. Deberías ver el botón "Editar HTML" en la barra de acciones
// ============================================================================

console.log('🎯 === PRUEBA INTERFAZ HTML EDITOR ===');
console.log('📋 Pasos para probar:');
console.log('1. Ve a http://localhost:5173/');
console.log('2. Inicia sesión en la aplicación');
console.log('3. Busca un contrato con formato HTML');
console.log('4. Haz clic en "Editar HTML"');
console.log('5. Prueba editar el contenido HTML');
console.log('6. Guarda los cambios');
console.log('');
console.log('✅ Si funciona: ¡La interfaz HTML Editor está lista!');
console.log('❌ Si no funciona: Revisa la consola del navegador (F12)');
console.log('');
console.log('💡 Para contratos JSON tradicionales, sigue usando "Editar"');
console.log('💡 Para contratos HTML, usa "Editar HTML"');
console.log('');

// Función auxiliar para verificar si un contrato tiene HTML
window.checkContractFormat = async (contractId) => {
  try {
    const supabase = window.supabase || (await import('./src/lib/supabase.js')).supabase;
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('contract_format, contract_html')
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📄 Formato del contrato ${contractId}:`, data.contract_format);
    console.log(`📝 Tiene contract_html:`, !!data.contract_html);

    if (data.contract_format === 'html' || data.contract_format === 'hybrid') {
      console.log('✅ Este contrato debería mostrar "Editar HTML"');
    } else {
      console.log('ℹ️ Este contrato usa el editor tradicional (JSON)');
    }
  } catch (e) {
    console.error('Error verificando contrato:', e);
  }
};

console.log('💡 Función auxiliar disponible: checkContractFormat("contract-id")');
