// Script de prueba para simular inserción de contrato desde N8N
// Ejecutar con: node test_n8n_contract_insertion.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usar tus credenciales reales)
const supabaseUrl = 'https://tu-project.supabase.co';
const supabaseServiceKey = 'tu-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContractInsertion() {
  console.log('🧪 Probando inserción de contrato desde N8N...');

  try {
    // 1. Generar HTML del contrato
    const contractHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Prueba - N8N</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .contract-title {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }
        .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            text-align: center;
            padding-top: 20px;
            margin-top: 20px;
            display: inline-block;
            margin-right: 50px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="contract-title">CONTRATO DE ARRIENDO DE PRUEBA</h1>
        <p><strong>ID del Contrato:</strong> TEST-001</p>
        <p><strong>Generado por:</strong> N8N Workflow</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
    </div>

    <div class="section">
        <h2 class="section-title">📋 Información de las Partes</h2>
        <p><strong>Arrendador:</strong> Propietario Test S.A.</p>
        <p><strong>RUT Arrendador:</strong> 12.345.678-9</p>
        <p><strong>Arrendatario:</strong> Juan Pérez González</p>
        <p><strong>RUT Arrendatario:</strong> 9.876.543-2</p>
    </div>

    <div class="section">
        <h2 class="section-title">🏠 Información de la Propiedad</h2>
        <p><strong>Dirección:</strong> Calle Ficticia 123, Santiago</p>
        <p><strong>Tipo:</strong> Departamento 2 dormitorios</p>
        <p><strong>Rol de Avalúo:</strong> 123-456</p>
    </div>

    <div class="section">
        <h2 class="section-title">💰 Términos del Contrato</h2>
        <p><strong>Plazo:</strong> 12 meses</p>
        <p><strong>Fecha de Inicio:</strong> 1 de enero de 2025</p>
        <p><strong>Renta Mensual:</strong> $450.000 CLP</p>
        <p><strong>Garantía:</strong> 1 mes de renta</p>
    </div>

    <div class="section">
        <h2 class="section-title">📜 Obligaciones</h2>
        <ul>
            <li>El arrendatario pagará puntualmente la renta mensual</li>
            <li>El arrendador mantendrá la propiedad en buen estado</li>
            <li>Ambas partes cumplirán con las normativas vigentes</li>
        </ul>
    </div>

    <div class="section">
        <h2 class="section-title">✍️ Firmas</h2>
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div class="signature-box">
                <p><strong>Arrendador</strong></p>
                <p>Propietario Test S.A.</p>
                <p>RUT: 12.345.678-9</p>
            </div>
            <div class="signature-box">
                <p><strong>Arrendatario</strong></p>
                <p>Juan Pérez González</p>
                <p>RUT: 9.876.543-2</p>
            </div>
        </div>
    </div>

    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        <p>Este contrato fue generado automáticamente por N8N Workflow</p>
        <p>Fecha de generación: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;

    // 2. Subir HTML a Storage
    const fileName = `test-user/contracto-test-n8n-${Date.now()}.html`;

    console.log(`📁 Subiendo archivo a: ${fileName}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('workflow-outputs')
      .upload(fileName, contractHtml, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError);
      return;
    }

    console.log('✅ Archivo subido exitosamente:', uploadData);

    // 3. Insertar registro en la base de datos
    // NOTA: Necesitas usar un user_id real de tu base de datos
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Reemplaza con un ID real

    const { data: insertData, error: insertError } = await supabase
      .from('workflow_outputs')
      .insert({
        user_id: testUserId,
        property_id: null, // Opcional
        workflow_type: 'contrato_arriendo',
        output_storage_path: fileName,
        file_size_bytes: contractHtml.length,
        metadata: {
          contract_id: 'TEST-001',
          source: 'n8n_direct',
          generated_at: new Date().toISOString(),
          tenant_name: 'Juan Pérez González',
          test_data: true
        }
      })
      .select();

    if (insertError) {
      console.error('❌ Error insertando registro:', insertError);
      return;
    }

    console.log('✅ Registro insertado exitosamente:', insertData);

    // 4. Verificación final
    console.log('\n🎉 ¡Inserción de contrato completada!');
    console.log('📊 Resumen:');
    console.log(`   - Archivo: ${fileName}`);
    console.log(`   - Tamaño: ${contractHtml.length} bytes`);
    console.log(`   - ID del registro: ${insertData[0].id}`);
    console.log(`   - Tipo: ${insertData[0].workflow_type}`);
    console.log(`   - Fuente: ${insertData[0].metadata.source}`);

    console.log('\n🔍 Para verificar en la plataforma:');
    console.log('1. Ve a "Contratos N8N" en la navegación');
    console.log('2. Busca el contrato con ID que termina en TEST-001');
    console.log('3. Debería aparecer como "N8N Direct"');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testContractInsertion();
