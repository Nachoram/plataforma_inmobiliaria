import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function checkOffers() {
  try {
    console.log('🔍 Verificando ofertas en la base de datos...');

    // Primero verificar estructura de la tabla
    console.log('🔍 Verificando estructura de property_sale_offers...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'property_sale_offers')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log('❌ Error obteniendo columnas:', columnsError.message);
    } else {
      console.log('📋 Columnas disponibles:', columns?.map(c => c.column_name).join(', '));
    }

    // Intentar obtener ofertas sin la columna problemática
    const { data, error } = await supabase
      .from('property_sale_offers')
      .select('id, property_id, buyer_id, status')
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('✅ Conexión exitosa');
    console.log('📊 Ofertas encontradas:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('📋 Primeras ofertas:');
      data.forEach((offer, index) => {
        console.log(`${index + 1}. ID: ${offer.id}, Estado: ${offer.status}`);
      });

      // Tomar el primer ID para usar en la URL
      console.log(`\n🌐 Usa este ID en la URL: http://localhost:5173/sales/offer/${data[0].id}`);
    } else {
      console.log('⚠️ No hay ofertas. Creando una oferta de prueba...');

      // Crear oferta de prueba usando IDs existentes o genéricos
      try {
        console.log('🏗️ Intentando crear oferta de prueba...');

        // Usar IDs genéricos que podrían funcionar
        const testPropertyId = '073bb955-71dc-457b-8404-0100d370608e'; // El ID que mencionó el usuario
        const testUserId = '00000000-0000-0000-0000-000000000000';

        // Verificar si la propiedad existe primero
        const { data: existingProperty, error: checkError } = await supabase
          .from('properties')
          .select('id')
          .eq('id', testPropertyId)
          .single();

        let propertyIdToUse = testPropertyId;

        if (checkError || !existingProperty) {
          console.log('⚠️ La propiedad específica no existe. Buscando cualquier propiedad...');

          // Buscar cualquier propiedad existente
          const { data: anyProperty, error: anyError } = await supabase
            .from('properties')
            .select('id')
            .limit(1)
            .single();

          if (anyError || !anyProperty) {
            console.log('❌ No hay propiedades disponibles en la base de datos');
            console.log('💡 Necesitas crear una propiedad primero desde la interfaz de usuario');
            return;
          }

          propertyIdToUse = anyProperty.id;
          console.log(`✅ Usando propiedad existente: ${propertyIdToUse}`);
        }

        // Crear oferta de prueba
        const { data: newOffer, error: offerError } = await supabase
          .from('property_sale_offers')
          .insert({
            property_id: propertyIdToUse,
            buyer_id: testUserId,
            status: 'pendiente',
            offered_price: 180000000,
            currency: 'CLP',
            conditions: 'Pago al contado, escritura inmediata'
          })
          .select()
          .single();

        if (offerError) {
          console.log('❌ Error creando oferta de prueba:', offerError.message);
          console.log('🔍 Detalles del error:', JSON.stringify(offerError, null, 2));
        } else {
          console.log('✅ Oferta de prueba creada exitosamente!');
          console.log(`🆔 ID de la oferta: ${newOffer.id}`);
          console.log(`🌐 URL para probar: http://localhost:5173/sales/offer/${newOffer.id}`);
          console.log('\n📋 Resumen:');
          console.log(`   Propiedad: ${propertyIdToUse}`);
          console.log(`   Oferta: ${newOffer.id} (Estado: ${newOffer.status})`);
          console.log(`   Precio ofrecido: ${newOffer.offered_price} ${newOffer.currency}`);
        }
      } catch (createError) {
        console.log('❌ Error creando datos de prueba:', createError.message);
      }
    }
  } catch (err) {
    console.log('❌ Error de conexión:', err.message);
  }
}

checkOffers();
