import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestContract() {
  try {
    console.log('Creando contrato de prueba para edición visual...');

    // HTML de contrato simple de prueba
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato de Prueba</title>
        </head>
        <body>
          <h1>CONTRATO DE ARRENDAMIENTO</h1>

          <h2>I. COMPARECIENTES</h2>
          <p>En Santiago, a 15 de octubre de 2025, comparecen:</p>
          <p>De una parte, el Sr. Juan Pérez, arrendador.</p>
          <p>De la otra parte, la Sra. María González, arrendataria.</p>

          <h2>II. BIEN ARRENDADO</h2>
          <p>El arrendador da en arriendo la propiedad ubicada en Av. Providencia 1234, Santiago.</p>

          <h2>III. CONDICIONES</h2>
          <p>La renta mensual será de $500.000, pagadera los primeros 5 días de cada mes.</p>

          <h2>IV. OBLIGACIONES</h2>
          <p>El arrendatario se obliga a pagar la renta y mantener la propiedad en buen estado.</p>

          <h2>V. TÉRMINO</h2>
          <p>El contrato tendrá una duración de 12 meses, renovable por acuerdo de partes.</p>

          <h2>VI. DISPOSICIONES LEGALES</h2>
          <p>Este contrato se rige por la Ley 18.101 sobre Arrendamiento de Bienes Raíces.</p>

          <p>Firmado por ambas partes.</p>
        </body>
      </html>
    `;

    // Crear contrato de prueba
    const { data, error } = await supabase
      .from('rental_contracts')
      .insert({
        contract_html: testHtml,
        contract_format: 'html',
        contract_number: 'TEST-001',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Contrato de prueba creado exitosamente!');
    console.log('ID del contrato:', data.id);
    console.log('Número del contrato:', data.contract_number);

    return data;

  } catch (error) {
    console.error('❌ Error al crear contrato de prueba:', error);
    throw error;
  }
}

// Ejecutar siempre
createTestContract().then(() => {
  console.log('Script completado.');
  process.exit(0);
}).catch((error) => {
  console.error('Error en el script:', error);
  process.exit(1);
});

export { createTestContract };
