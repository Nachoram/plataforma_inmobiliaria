import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMinimalTestData() {
  console.log('🎯 Creando datos de prueba mínimos...\n');

  try {
    // 1. Intentar crear una propiedad con campos mínimos
    console.log('🏠 Intentando crear propiedad básica...');
    const propertyData = {
      title: 'Casa de Prueba',
      price: 100000000,
      owner_id: '00000000-0000-0000-0000-000000000000' // ID dummy
    };

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (propertyError) {
      console.log('❌ Error creando propiedad básica:', propertyError.message);
      console.log('💡 Intentando con campos diferentes...');

      // Intentar con diferentes combinaciones de campos
      const minimalPropertyData = {
        title: 'Casa de Prueba'
      };

      const { data: minimalProperty, error: minimalError } = await supabase
        .from('properties')
        .insert(minimalPropertyData)
        .select()
        .single();

      if (minimalError) {
        console.log('❌ Error incluso con campo mínimo:', minimalError.message);
        console.log('🔍 Parece que la tabla properties no existe o tiene restricciones.');
        return;
      } else {
        console.log('✅ Propiedad mínima creada:', minimalProperty.id);
        property = minimalProperty;
      }
    } else {
      console.log('✅ Propiedad creada:', property.id);
    }

    // 2. Intentar crear una oferta de venta
    console.log('\n💰 Intentando crear oferta de venta...');
    const offerData = {
      property_id: property.id,
      buyer_id: '00000000-0000-0000-0000-000000000000', // ID dummy
      status: 'pendiente',
      offered_price: 95000000
    };

    const { data: offer, error: offerError } = await supabase
      .from('property_sale_offers')
      .insert(offerData)
      .select()
      .single();

    if (offerError) {
      console.log('❌ Error creando oferta:', offerError.message);

      // Intentar con campos mínimos para oferta
      const minimalOfferData = {
        property_id: property.id,
        status: 'pendiente'
      };

      const { data: minimalOffer, error: minimalOfferError } = await supabase
        .from('property_sale_offers')
        .insert(minimalOfferData)
        .select()
        .single();

      if (minimalOfferError) {
        console.log('❌ Error incluso con oferta mínima:', minimalOfferError.message);
        console.log('🔍 Parece que la tabla property_sale_offers no existe o tiene restricciones.');
        return;
      } else {
        console.log('✅ Oferta mínima creada:', minimalOffer.id);
        console.log('🌐 URL para ver la oferta:', `http://localhost:5173/sales/offer/${minimalOffer.id}`);
      }
    } else {
      console.log('✅ Oferta creada:', offer.id);
      console.log('🌐 URL para ver la oferta:', `http://localhost:5173/sales/offer/${offer.id}`);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createMinimalTestData();
