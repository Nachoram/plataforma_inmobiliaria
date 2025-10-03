import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer variables de entorno
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// HTML de ejemplo del contrato
const contractHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 50px; font-size: 12pt; }
        h1 { text-align: center; font-size: 14pt; }
        h2 { text-align: left; font-size: 12pt; text-decoration: underline; }
        p { text-align: justify; line-height: 1.6; margin-bottom: 1.2em; }
        strong { font-weight: bold; }
        .signature-block { margin-top: 60px; page-break-inside: avoid; }
        .signature-line { margin-top: 70px; border-top: 1px solid black; width: 250px; margin-left: auto; margin-right: auto; }
        .signature-title { text-align: center; }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    <p>En Santiago de Chile, a 3 de octubre de 2025, entre <strong>Carolina Andrea Soto Rojas</strong>, cédula de identidad N° <strong>15.123.456-7</strong>, en adelante "el Arrendador"; y <strong>Martín Ignacio Pérez López</strong>, cédula de identidad N° <strong>20.456.789-1</strong>, en adelante "el Arrendatario", se ha convenido en el siguiente contrato de arrendamiento:</p>

    <h2>PRIMERO: PROPIEDAD ARRENDADA</h2>
    <p>El Arrendador da en arrendamiento al Arrendatario el inmueble ubicado en <strong>Suecia 1234 Casa A, Providencia</strong>. Se deja constancia que la propiedad se arrienda con sus servicios de luz, agua, gas y gastos comunes al día.</p>
    
    <h2>SEGUNDO: RENTA DE ARRENDAMIENTO</h2>
    <p>La renta mensual de arrendamiento será la suma de <strong>$1.600.000</strong>. El Arrendatario se obliga a pagar dicha renta por mesadas anticipadas, dentro de los primeros cinco días de cada mes, mediante transferencia electrónica a la cuenta que el Arrendador indique.</p>
    
    <h2>TERCERO: DURACIÓN DEL CONTRATO</h2>
    <p>El presente contrato de arrendamiento tendrá una duración de <strong>12 meses</strong>. Este contrato se renovará tácita y sucesivamente por períodos iguales si ninguna de las partes manifestare su voluntad de ponerle término mediante carta certificada con una anticipación de a lo menos 60 días al vencimiento del período respectivo.</p>
    
    <h2>CUARTO: GARANTÍA</h2>
    <p>A fin de garantizar la conservación de la propiedad, el Arrendatario entrega en este acto al Arrendador a título de garantía la suma de <strong>$1.600.000</strong>, equivalente a un mes de renta, la cual será devuelta dentro de los 30 días siguientes a la restitución del inmueble, una vez verificado el estado del mismo y el pago total de las cuentas de servicios y gastos.</p>
    
    <h2>QUINTO: OBLIGACIONES DEL ARRENDADOR</h2>
    <p>EL ARRENDADOR debe entregar la propiedad en buenas condiciones de habitación y uso. En caso de que se produzca algún desperfecto de naturaleza diferente a los que corresponde reparar a EL ARRENDATARIO, EL ARRENDADOR queda obligado a efectuarlos.</p>
    
    <h2>SEXTO: OBLIGACIONES DEL ARRENDATARIO</h2>
    <p>El Arrendatario se obliga a restituir la propiedad al término del contrato en el mismo estado en que la recibió, considerándose el desgaste natural por uso legítimo.</p>

    <div class="signature-block">
        <div class="signature-title"><div class="signature-line"></div><strong>Carolina Andrea Soto Rojas</strong><br>C.I. 15.123.456-7<br>ARRENDADOR</div>
    </div>
    <div class="signature-block">
        <div class="signature-title"><div class="signature-line"></div><strong>Martín Ignacio Pérez López</strong><br>C.I. 20.456.789-1<br>ARRENDATARIO</div>
    </div>
</body>
</html>`;

async function testInsertHTMLContract() {
  console.log('🧪 Probando inserción de contrato HTML...\n');

  // Primero, buscar una aplicación aprobada existente
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select('id, status')
    .eq('status', 'aprobada')
    .limit(1);

  if (appError) {
    console.error('❌ Error al buscar aplicaciones:', appError.message);
    return;
  }

  if (!applications || applications.length === 0) {
    console.log('⚠️  No se encontraron aplicaciones aprobadas');
    console.log('💡 Creando contrato de prueba sin application_id (solo para testing)...\n');
  }

  const applicationId = applications?.[0]?.id || null;

  // Primero aplicar la migración si no se ha aplicado
  console.log('📋 Verificando columnas de la tabla...');

  // Intentar insertar contrato con HTML
  const contractData = {
    application_id: applicationId,
    contract_html: contractHTML,
    contract_format: 'html',
    status: 'draft',
    contract_content: null // Permitir NULL ahora
  };

  console.log('📝 Insertando contrato con HTML...');
  const { data: contract, error: insertError } = await supabase
    .from('rental_contracts')
    .insert(contractData)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error al insertar contrato:', insertError.message);
    console.error('Detalles:', insertError);
    console.log('\n💡 Sugerencia: Ejecuta la migración primero:');
    console.log('   psql -U postgres -d plataforma_inmobiliaria -f supabase/migrations/20251003190000_add_contract_html_column.sql');
    return;
  }

  console.log('✅ Contrato insertado exitosamente!');
  console.log(`   ID: ${contract.id}`);
  console.log(`   Número: ${contract.contract_number}`);
  console.log(`   Formato: ${contract.contract_format}`);
  console.log(`   HTML length: ${contract.contract_html?.length || 0} caracteres`);
  console.log(`\n📱 Ahora puedes visualizar este contrato en:`);
  console.log(`   http://localhost:5173/contract/${contract.id}`);
  console.log(`\n🔍 Para verificar en la base de datos:`);
  console.log(`   SELECT id, contract_number, contract_format, LENGTH(contract_html) as html_length FROM rental_contracts WHERE id = '${contract.id}';`);
}

testInsertHTMLContract().catch(console.error);

