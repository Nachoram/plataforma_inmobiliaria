import fetch from 'node-fetch';

const verifySystem = async () => {
  console.log('🔍 VERIFICANDO SISTEMA COMPLETO\n');

  // 1. Verificar que el servidor local esté corriendo
  console.log('1️⃣ Verificando servidor local...');
  try {
    const localResponse = await fetch('http://localhost:5173');
    if (localResponse.ok) {
      console.log('✅ Servidor local corriendo en http://localhost:5173');
    } else {
      console.log('⚠️ Servidor local responde pero con status:', localResponse.status);
    }
  } catch (error) {
    console.log('❌ Servidor local NO está corriendo');
    console.log('💡 Ejecuta: npm run dev');
    return;
  }

  // 2. Verificar webhook de n8n
  console.log('\n2️⃣ Verificando webhook de n8n...');
  try {
    const testParams = new URLSearchParams({
      application_characteristic_id: 'test-verification',
      property_characteristic_id: 'test-prop',
      rental_owner_characteristic_id: 'test-owner',
      contract_conditions_characteristic_id: 'test-contract',
      guarantor_characteristic_id: 'test-guarantor',
      timestamp: new Date().toISOString(),
      platform: 'plataforma_inmobiliaria',
      action: 'system_verification'
    });

    const webhookUrl = `https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb?${testParams.toString()}`;

    console.log('🌐 Probando URL:', webhookUrl.replace(/&/g, '&\n    '));

    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 segundos timeout
    });
    const endTime = Date.now();

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);

    if (response.ok) {
      console.log('✅ Webhook responde correctamente');
    } else {
      console.log('❌ Webhook responde con error');
      const errorText = await response.text();
      console.log('📋 Error details:', errorText);
    }

  } catch (error) {
    console.log('❌ Error conectando al webhook:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS Error - Verifica tu conexión a internet');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - El servidor podría estar caído');
    }
  }

  // 3. Verificar archivos del proyecto
  console.log('\n3️⃣ Verificando archivos del proyecto...');
  const fs = await import('fs');

  const requiredFiles = [
    'src/components/properties/AdminPropertyDetailView.tsx',
    'supabase/migrations/20251025180000_add_contract_characteristics.sql'
  ];

  for (const file of requiredFiles) {
    try {
      await fs.promises.access(file);
      console.log(`✅ ${file} existe`);
    } catch {
      console.log(`❌ ${file} NO existe`);
    }
  }

  // 4. Verificar que handleSendToWebhook fue eliminada
  console.log('\n4️⃣ Verificando código actualizado...');
  try {
    const adminFile = await fs.promises.readFile('src/components/properties/AdminPropertyDetailView.tsx', 'utf8');

    if (adminFile.includes('handleSendToWebhook')) {
      console.log('❌ handleSendToWebhook AÚN existe en el código');
      console.log('💡 Esto significa que hay código antiguo que debe ser eliminado');
    } else {
      console.log('✅ handleSendToWebhook fue correctamente eliminada');
    }

    if (adminFile.includes('handleGenerateContract')) {
      console.log('✅ handleGenerateContract existe en el código');
    } else {
      console.log('❌ handleGenerateContract NO existe - hay un problema');
    }

    if (adminFile.includes('primary-production-bafdc.up.railway.app')) {
      console.log('✅ URL correcta del webhook está en el código');
    } else {
      console.log('❌ URL del webhook NO está en el código');
    }

  } catch (error) {
    console.log('❌ Error leyendo archivo AdminPropertyDetailView.tsx:', error.message);
  }

  console.log('\n🎯 RESUMEN:');
  console.log('Si ves algún ❌ arriba, resuélvelo antes de probar el frontend.');
  console.log('Si todo está ✅, entonces el problema es de cache del navegador.');
  console.log('\n💡 SOLUCIÓN PARA CACHE:');
  console.log('1. Presiona Ctrl+Shift+R (o Cmd+Shift+R en Mac)');
  console.log('2. O abre DevTools (F12) → Network → marca "Disable cache"');
  console.log('3. O borra el storage del navegador para localhost:5173');
};

verifySystem();

