const testWebhookURL = async () => {
  const webhookUrl = 'https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb';

  console.log('🧪 Probando conectividad al webhook...');
  console.log('📡 URL:', webhookUrl);

  const testPayload = {
    test: true,
    timestamp: new Date().toISOString(),
    message: 'Test webhook connection'
  };

  try {
    console.log('📤 Enviando petición de prueba (GET)...');

    // Convertir payload a query parameters para GET
    const queryParams = new URLSearchParams({
      test: testPayload.test.toString(),
      timestamp: testPayload.timestamp,
      message: testPayload.message
    });

    const fullUrl = `${webhookUrl}?${queryParams.toString()}`;
    console.log('🌐 URL completa:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook responde correctamente');
      console.log('📋 Respuesta:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Error del webhook:', errorText);
    }

  } catch (error) {
    console.log('❌ Error de conexión:', error.message);

    // Verificar si es un problema de DNS
    if (error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('ENOTFOUND')) {
      console.log('💡 Posibles causas:');
      console.log('   - El dominio no existe o está caído');
      console.log('   - Problema de DNS');
      console.log('   - Firewall o restricciones de red');
    }

    // Verificar si es un problema de CORS
    if (error.message.includes('CORS')) {
      console.log('💡 CORS error - El webhook no permite requests desde este origen');
    }
  }
};

testWebhookURL();
