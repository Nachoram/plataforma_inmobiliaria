import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestProperty() {
  console.log('🏗️ Creando propiedad de prueba...');

  try {
    // Intentar obtener un usuario existente para usar como owner_id
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    let ownerId = '00000000-0000-0000-0000-000000000000'; // ID dummy por defecto

    if (userError) {
      console.warn('⚠️ Error obteniendo usuarios, usando ID dummy:', userError.message);
    } else if (users && users.length > 0) {
      ownerId = users[0].id;
      console.log('✅ Usando owner_id existente:', ownerId);
    } else {
      console.warn('⚠️ No hay usuarios en profiles, usando ID dummy para owner_id.');
    }

    // Crear propiedad de prueba
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        title: 'Casa Moderna en Santiago Centro',
        description: 'Hermosa casa moderna de 3 dormitorios con vista panorámica',
        property_type: 'casa',
        transaction_type: 'venta',
        price: 250000000,
        currency: 'CLP',
        address_street: 'Avenida Providencia 123',
        address_city: 'Santiago',
        address_region: 'Metropolitana',
        address_country: 'Chile',
        bedrooms: 3,
        bathrooms: 2,
        area: 150,
        area_unit: 'm2',
        owner_id: ownerId,
        status: 'activa',
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (propertyError) {
      console.error('❌ Error creando propiedad:', propertyError.message);
      return;
    }

    console.log('✅ Propiedad de prueba creada exitosamente:', property.id);
    console.log('🏠 Detalles:', {
      id: property.id,
      title: property.title,
      price: property.price,
      address: `${property.address_street}, ${property.address_city}`
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createTestProperty();
