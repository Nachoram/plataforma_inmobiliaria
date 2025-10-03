import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer .env
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY);

const htmlContrato = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 50px; font-size: 12pt; }
        h1 { text-align: center; font-size: 14pt; font-weight: bold; }
        h2 { text-align: left; font-size: 12pt; text-decoration: underline; margin-top: 20px; }
        p { text-align: justify; line-height: 1.6; margin-bottom: 1.2em; }
        strong { font-weight: bold; }
        .signature-block { margin-top: 60px; page-break-inside: avoid; }
        .signature-line { margin-top: 70px; border-top: 1px solid black; width: 250px; margin-left: auto; margin-right: auto; }
        .signature-title { text-align: center; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    <p>En Santiago de Chile, a 3 de octubre de 2025, entre <strong>Carolina Andrea Soto Rojas</strong>, cédula de identidad N° <strong>15.123.456-7</strong>, en adelante "el Arrendador"; y <strong>Martín Ignacio Pérez López</strong>, cédula de identidad N° <strong>20.456.789-1</strong>, en adelante "el Arrendatario", se ha convenido en el siguiente contrato de arrendamiento:</p>

    <h2>PRIMERO: PROPIEDAD ARRENDADA</h2>
    <p>El Arrendador da en arrendamiento al Arrendatario el inmueble ubicado en <strong>Suecia 1234 Casa A, Providencia</strong>. Se deja constancia que la propiedad se arrienda con sus servicios de luz, agua, gas y gastos comunes al día.</p>
    
    <h2>SEGUNDO: RENTA DE ARRENDAMIENTO</h2>
    <p>La renta mensual de arrendamiento será la suma de <strong>$1.600.000</strong>. El Arrendatario se obliga a pagar dicha renta por mesadas anticipadas, dentro de los primeros cinco días de cada mes.</p>
    
    <h2>TERCERO: DURACIÓN DEL CONTRATO</h2>
    <p>El presente contrato de arrendamiento tendrá una duración de <strong>12 meses</strong>.</p>

    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">
            <strong>Carolina Andrea Soto Rojas</strong><br>
            C.I. 15.123.456-7<br>
            ARRENDADOR
        </div>
    </div>
    
    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">
            <strong>Martín Ignacio Pérez López</strong><br>
            C.I. 20.456.789-1<br>
            ARRENDATARIO
        </div>
    </div>
</body>
</html>`;

async function insertarContratoPrueba() {
  console.log('📝 Insertando contrato de prueba...\n');
  
  const { data, error } = await supabase
    .from('rental_contracts')
    .insert({
      application_id: '69a4f2d5-e08b-4c8e-a748-7e4de3e2d8fb', // La aplicación aprobada
      contract_html: htmlContrato,
      contract_format: 'html',
      status: 'draft',
      contract_content: null
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Si el error es de permisos, asegúrate de tener VITE_SUPABASE_SERVICE_ROLE_KEY en tu .env');
    return;
  }
  
  console.log('✅ Contrato insertado exitosamente!\n');
  console.log('📋 Detalles:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Número: ${data.contract_number}`);
  console.log(`   Formato: ${data.contract_format}`);
  console.log(`   Estado: ${data.status}`);
  console.log(`   HTML length: ${data.contract_html?.length} caracteres`);
  
  console.log('\n🌐 Visualizar en:');
  console.log(`   http://localhost:5173/contract/${data.id}`);
  console.log('\n💡 Asegúrate de que el frontend esté corriendo (npm run dev)');
}

insertarContratoPrueba();

