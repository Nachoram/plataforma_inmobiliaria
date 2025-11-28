import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBasicTestData() {
  console.log('🎯 Creando datos básicos de prueba...\n');

  try {
    // 1. Crear un perfil de usuario básico si no existe
    console.log('👤 Verificando/creando perfil de usuario...');
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    let userId = '550e8400-e29b-41d4-a716-446655440000'; // UUID dummy

    if (profileError) {
      console.log('⚠️ Error verificando perfiles:', profileError.message);
    } else if (existingProfiles && existingProfiles.length > 0) {
      userId = existingProfiles[0].id;
      console.log('✅ Usando perfil existente:', userId);
    } else {
      // Intentar crear un perfil básico
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: 'test@example.com',
          full_name: 'Usuario de Prueba',
          role: 'user'
        })
        .select()
        .single();

      if (createProfileError) {
        console.log('⚠️ Error creando perfil:', createProfileError.message);
        console.log('🔄 Continuando con ID dummy...');
      } else {
        console.log('✅ Perfil creado:', newProfile.id);
      }
    }

    // 2. Crear una propiedad básica
    console.log('\n🏠 Creando propiedad básica...');
    const propertyData = {
      title: 'Casa Moderna Santiago Centro',
      description: 'Hermosa casa moderna de 3 dormitorios con vista panorámica al centro de Santiago.',
      property_type: 'casa',
      transaction_type: 'venta',
      owner_id: userId
    };

    // Agregar campos opcionales si existen
    const optionalFields = {
      price: 250000000,
      address_city: 'Santiago',
      address_region: 'Metropolitana',
      bedrooms: 3,
      bathrooms: 2,
      area: 150
    };

    // Intentar con campos opcionales uno por uno
    let finalPropertyData = { ...propertyData };
    for (const [key, value] of Object.entries(optionalFields)) {
      try {
        const testData = { ...finalPropertyData, [key]: value };
        const { error } = await supabase
          .from('properties')
          .insert(testData)
          .select()
          .single();

        if (!error) {
          finalPropertyData = testData;
          console.log(`✅ Campo '${key}' agregado exitosamente`);
        } else {
          console.log(`⚠️ Campo '${key}' no soportado, omitiendo...`);
        }
      } catch (err) {
        console.log(`⚠️ Error probando campo '${key}':`, err.message);
      }
    }

    // Crear la propiedad final
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert(finalPropertyData)
      .select()
      .single();

    if (propertyError) {
      console.error('❌ Error creando propiedad:', propertyError.message);
      return;
    }

    console.log('✅ Propiedad creada exitosamente:', property.id);

    // 3. Crear una oferta de venta
    console.log('\n💰 Creando oferta de venta...');
    const offerData = {
      property_id: property.id,
      buyer_id: userId,
      status: 'pendiente'
    };

    // Agregar campos opcionales si existen
    const optionalOfferFields = {
      offered_price: 240000000,
      currency: 'CLP',
      conditions: 'Pago al contado, escritura inmediata'
    };

    let finalOfferData = { ...offerData };
    for (const [key, value] of Object.entries(optionalOfferFields)) {
      try {
        const testData = { ...finalOfferData, [key]: value };
        const { error } = await supabase
          .from('property_sale_offers')
          .insert(testData)
          .select()
          .single();

        if (!error) {
          finalOfferData = testData;
          console.log(`✅ Campo de oferta '${key}' agregado exitosamente`);
        } else {
          console.log(`⚠️ Campo de oferta '${key}' no soportado, omitiendo...`);
        }
      } catch (err) {
        console.log(`⚠️ Error probando campo de oferta '${key}':`, err.message);
      }
    }

    // Crear la oferta final
    const { data: offer, error: offerError } = await supabase
      .from('property_sale_offers')
      .insert(finalOfferData)
      .select()
      .single();

    if (offerError) {
      console.error('❌ Error creando oferta:', offerError.message);
      return;
    }

    console.log('✅ Oferta creada exitosamente:', offer.id);
    console.log('\n🌐 URLs para probar:');
    console.log(`   Propiedad: http://localhost:5173/properties/${property.id}`);
    console.log(`   Oferta: http://localhost:5173/sales/offer/${offer.id}`);
    console.log('\n💡 Nota: Las tablas tasks, timeline, formal_requests y communications usarán datos mock hasta que se apliquen las migraciones completas.');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createBasicTestData();



