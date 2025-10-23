import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestProperties() {
  try {
    console.log('🏗️ Creando propiedades de prueba con diferentes tipos...\n');

    // Función para generar UUID
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // Propiedades de prueba con diferentes tipos
    const testProperties = [
      {
        id: generateUUID(),
        owner_id: generateUUID(), // Usar un owner_id válido
        status: 'disponible',
        listing_type: 'venta',
        property_type: 'Casa',
        address_street: 'Avenida Providencia',
        address_number: '123',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 150000000,
        bedrooms: 3,
        bathrooms: 2,
        surface_m2: 120,
        description: 'Hermosa casa familiar en Providencia'
      },
      {
        id: generateUUID(),
        owner_id: generateUUID(),
        status: 'disponible',
        listing_type: 'arriendo',
        property_type: 'Departamento',
        address_street: 'Calle Las Condes',
        address_number: '456',
        address_commune: 'Las Condes',
        address_region: 'Metropolitana',
        price_clp: 800000,
        bedrooms: 2,
        bathrooms: 1,
        surface_m2: 65,
        description: 'Moderno departamento en Las Condes'
      },
      {
        id: generateUUID(),
        owner_id: generateUUID(),
        status: 'disponible',
        listing_type: 'venta',
        property_type: 'Parcela',
        address_street: 'Camino Rural',
        address_number: '789',
        address_commune: 'Colina',
        address_region: 'Metropolitana',
        price_clp: 50000000,
        bedrooms: 0,
        bathrooms: 0,
        surface_m2: 5000,
        description: 'Gran parcela en zona rural'
      },
      {
        id: generateUUID(),
        owner_id: generateUUID(),
        status: 'disponible',
        listing_type: 'venta',
        property_type: 'Oficina',
        address_street: 'Avenida Apoquindo',
        address_number: '1010',
        address_commune: 'Las Condes',
        address_region: 'Metropolitana',
        price_clp: 200000000,
        bedrooms: 0,
        bathrooms: 2,
        surface_m2: 150,
        description: 'Oficina corporativa con excelente ubicación'
      },
      {
        id: generateUUID(),
        owner_id: generateUUID(),
        status: 'disponible',
        listing_type: 'arriendo',
        property_type: 'Estacionamiento',
        address_street: 'Subterráneo Mall',
        address_number: 'S1-15',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 150000,
        bedrooms: 0,
        bathrooms: 0,
        surface_m2: 15,
        description: 'Estacionamiento cubierto en mall'
      }
    ];

    console.log('📝 Insertando propiedades de prueba...\n');

    for (const property of testProperties) {
      try {
        const { error } = await supabase
          .from('properties')
          .insert(property);

        if (error) {
          console.log(`⚠️ Error insertando ${property.property_type}: ${error.message}`);
        } else {
          console.log(`✅ Insertada propiedad tipo: ${property.property_type}`);
        }
      } catch (err) {
        console.log(`❌ Error general insertando ${property.property_type}:`, err.message);
      }
    }

    console.log('\n🎉 ¡Propiedades de prueba creadas!');
    console.log('Ahora puedes verificar en el frontend que se muestran los tipos correctos.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createTestProperties();
