import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function createTestData() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');

    // Verificar qué columnas existen en properties
    const { data: sampleProperty, error: sampleError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (sampleError && !sampleError.message.includes('No rows')) {
      console.log('❌ Error obteniendo estructura de properties:', sampleError.message);
      return;
    }

    console.log('📋 Columnas disponibles en properties:', sampleProperty ? Object.keys(sampleProperty[0] || {}) : 'ninguna');

    // Verificar si hay propiedades
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (propError || !properties || properties.length === 0) {
      console.log('❌ No hay propiedades. Necesitas crear una desde la interfaz de usuario.');
      return;
    }

    const property = properties[0];
    console.log('📋 Usando propiedad existente:', property.id);

    // Crear oferta de prueba
    const { data: newOffer, error: offerError } = await supabase
      .from('property_sale_offers')
      .insert({
        property_id: property.id,
        buyer_id: '00000000-0000-0000-0000-000000000000',
        status: 'pendiente',
        offered_price: 180000000,
        currency: 'CLP',
        conditions: 'Pago al contado, escritura inmediata'
      })
      .select()
      .single();

    if (offerError) {
      console.log('❌ Error creando oferta:', offerError.message);
      return;
    }

    console.log('✅ Oferta de prueba creada exitosamente!');
    console.log('🆔 ID de la oferta:', newOffer.id);
    console.log('🌐 URL para probar:', `http://localhost:5173/sales/offer/${newOffer.id}`);

  } catch (err) {
    console.log('❌ Error general:', err.message);
  }
}

createTestData();
