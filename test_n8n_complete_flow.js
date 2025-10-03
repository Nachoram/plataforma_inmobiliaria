// Script de prueba para verificar el flujo completo N8N
// Simula lo que N8N haría al recibir datos y crear contrato completo

const { createClient } = require('@supabase/supabase-js');

// Configuración (reemplaza con tus credenciales reales)
const supabaseUrl = process.env.SUPABASE_URL || 'https://tu-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tu-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simular datos que vendrían del webhook de la plataforma
const mockWebhookData = {
  action: 'generate_contract',
  timestamp: new Date().toISOString(),
  data: {
    contractId: 'test-contract-' + Date.now(),
    userId: 'test-user-id', // Reemplaza con un user_id real
    propertyId: 'test-property-id', // Reemplaza con un property_id real
    applicationId: 'test-application-id',
    tenantName: 'Juan',
    tenantLastName: 'Pérez',
    propertyAddress: 'Calle Falsa 123, Santiago',
    propertyCommune: 'Santiago',
    propertyRegion: 'Metropolitana'
  }
};

async function simulateN8NContractCreation() {
  console.log('🚀 Simulando creación completa de contrato por N8N...');

  try {
    const contractData = mockWebhookData.data;

    // 1. Generar HTML (como lo haría N8N)
    const html = generateContractHTML(contractData);
    console.log(`📝 HTML generado: ${html.length} caracteres`);

    // 2. Subir a Storage (como lo haría N8N)
    const fileName = `n8n-contracts/${contractData.contractId}-${Date.now()}.html`;

    console.log(`📁 Subiendo archivo: ${fileName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('workflow-outputs')
      .upload(fileName, html, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError);
      return;
    }

    console.log('✅ Archivo subido exitosamente');

    // 3. Insertar fila completa (como lo haría N8N)
    const { data: insertData, error: insertError } = await supabase
      .from('workflow_outputs')
      .insert({
        user_id: contractData.userId,
        property_id: contractData.propertyId,
        workflow_type: 'contrato_arriendo_n8n',
        output_storage_path: fileName,
        file_size_bytes: html.length,
        metadata: {
          contract_id: contractData.contractId,
          application_id: contractData.applicationId,
          source: 'n8n_complete',
          generated_at: new Date().toISOString(),
          tenant_name: contractData.tenantName,
          tenant_lastname: contractData.tenantLastName,
          property_address: contractData.propertyAddress,
          property_commune: contractData.propertyCommune,
          property_region: contractData.propertyRegion,
          status: 'completed'
        }
      })
      .select();

    if (insertError) {
      console.error('❌ Error insertando contrato:', insertError);
      return;
    }

    console.log('✅ Contrato insertado exitosamente');
    console.log('📊 Resumen:');
    console.log(`   - ID del contrato: ${insertData[0].id}`);
    console.log(`   - Archivo: ${fileName}`);
    console.log(`   - Tamaño: ${html.length} bytes`);
    console.log(`   - Tipo: ${insertData[0].workflow_type}`);
    console.log(`   - Fuente: ${insertData[0].metadata.source}`);

    console.log('\n🔍 Verificación:');
    console.log('Ejecuta esta query en Supabase:');
    console.log(`SELECT * FROM workflow_outputs WHERE metadata->>'contract_id' = '${contractData.contractId}';`);

    console.log('\n🎉 ¡Simulación completada!');
    console.log('El contrato debería aparecer en la plataforma bajo "Contratos N8N"');

  } catch (error) {
    console.error('❌ Error en simulación:', error);
  }
}

function generateContractHTML(contractData) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Arriendo - ${contractData.tenantName}</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .contract-title { font-size: 24px; font-weight: bold; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="contract-title">CONTRATO DE ARRIENDO</h1>
        <p>ID: ${contractData.contractId}</p>
        <p>Generado por N8N - ${new Date().toLocaleDateString('es-ES')}</p>
    </div>

    <div class="section">
        <h2>Arrendatario</h2>
        <p>Nombre: ${contractData.tenantName} ${contractData.tenantLastName}</p>
        <p>ID Aplicación: ${contractData.applicationId}</p>
    </div>

    <div class="section">
        <h2>Propiedad</h2>
        <p>Dirección: ${contractData.propertyAddress}</p>
        <p>Comuna: ${contractData.propertyCommune}</p>
        <p>Región: ${contractData.propertyRegion}</p>
    </div>

    <div class="section">
        <h2>Firmas</h2>
        <p>___________________ Arrendador</p>
        <br>
        <p>___________________ Arrendatario</p>
    </div>

    <p style="text-align: center; font-size: 12px; color: #666;">
        Contrato generado automáticamente por N8N Workflow
    </p>
</body>
</html>`;
}

// Ejecutar simulación
simulateN8NContractCreation();
