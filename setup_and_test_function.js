// Script completo para crear la función y probarla con datos de ejemplo

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'setup-script'
    }
  }
});

// Función para crear la función RPC
async function createFunction() {
  console.log('🔧 Creando función get_properties_with_postulation_count...\n');

  const functionSQL = `
CREATE OR REPLACE FUNCTION get_properties_with_postulation_count(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    owner_id uuid,
    status property_status_enum,
    listing_type listing_type_enum,
    address_street text,
    address_number varchar(10),
    address_department varchar(10),
    address_commune text,
    address_region text,
    price_clp bigint,
    common_expenses_clp integer,
    bedrooms integer,
    bathrooms integer,
    surface_m2 integer,
    description text,
    created_at timestamptz,
    updated_at timestamptz,
    is_visible boolean,
    is_featured boolean,
    address_id uuid,
    apartment_number text,
    region text,
    commune text,
    owner_apartment_number text,
    owner_region text,
    owner_commune text,
    owner_full_name text,
    owner_address text,
    owner_email text,
    owner_phone text,
    marital_status text,
    property_regime text,
    receiver_id uuid,
    property_characteristic_id text,
    available_days text[],
    available_time_slots text[],
    metros_utiles numeric(8,2),
    metros_totales numeric(8,2),
    tiene_terraza boolean,
    ano_construccion integer,
    tiene_sala_estar boolean,
    sistema_agua_caliente tipo_agua_caliente,
    tipo_cocina tipo_cocina,
    asesor_id uuid,
    tiene_bodega boolean,
    metros_bodega integer,
    estacionamientos integer,
    postulation_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.owner_id,
        p.status,
        p.listing_type,
        p.address_street,
        p.address_number,
        p.address_department,
        p.address_commune,
        p.address_region,
        p.price_clp,
        p.common_expenses_clp,
        p.bedrooms,
        p.bathrooms,
        p.surface_m2,
        p.description,
        p.created_at,
        p.updated_at,
        p.is_visible,
        p.is_featured,
        p.address_id,
        p.apartment_number,
        p.region,
        p.commune,
        p.owner_apartment_number,
        p.owner_region,
        p.owner_commune,
        p.owner_full_name,
        p.owner_address,
        p.owner_email,
        p.owner_phone,
        p.marital_status,
        p.property_regime,
        p.receiver_id,
        p.property_characteristic_id,
        p.available_days,
        p.available_time_slots,
        p.metros_utiles,
        p.metros_totales,
        p.tiene_terraza,
        p.ano_construccion,
        p.tiene_sala_estar,
        p.sistema_agua_caliente,
        p.tipo_cocina,
        p.asesor_id,
        p.tiene_bodega,
        p.metros_bodega,
        p.estacionamientos,
        COUNT(a.id)::bigint as postulation_count
    FROM properties p
    LEFT JOIN applications a ON p.id = a.property_id
    WHERE p.owner_id = user_id_param
    GROUP BY
        p.id,
        p.owner_id,
        p.status,
        p.listing_type,
        p.address_street,
        p.address_number,
        p.address_department,
        p.address_commune,
        p.address_region,
        p.price_clp,
        p.common_expenses_clp,
        p.bedrooms,
        p.bathrooms,
        p.surface_m2,
        p.description,
        p.created_at,
        p.updated_at,
        p.is_visible,
        p.is_featured,
        p.address_id,
        p.apartment_number,
        p.region,
        p.commune,
        p.owner_apartment_number,
        p.owner_region,
        p.owner_commune,
        p.owner_full_name,
        p.owner_address,
        p.owner_email,
        p.owner_phone,
        p.marital_status,
        p.property_regime,
        p.receiver_id,
        p.property_characteristic_id,
        p.available_days,
        p.available_time_slots,
        p.metros_utiles,
        p.metros_totales,
        p.tiene_terraza,
        p.ano_construccion,
        p.tiene_sala_estar,
        p.sistema_agua_caliente,
        p.tipo_cocina,
        p.asesor_id,
        p.tiene_bodega,
        p.metros_bodega,
        p.estacionamientos
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: functionSQL });

    if (error) {
      // Si exec_sql no funciona, intentar crear directamente con una consulta
      console.log('⚠️ exec_sql no disponible, intentando método alternativo...');
      throw error;
    }

    console.log('✅ Función creada exitosamente');
    return true;
  } catch (error) {
    console.log('⚠️ No se pudo crear la función automáticamente. Necesitas ejecutarla manualmente.');
    console.log('💡 Ejecuta el archivo create_get_properties_with_postulation_count_function.sql en el SQL Editor de Supabase Dashboard.');
    return false;
  }
}

// Función para crear datos de prueba
async function createTestData() {
  console.log('📝 Creando datos de prueba...\n');

  try {
    // Crear usuario de prueba (esto normalmente se haría con auth)
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';

    // Crear perfil de prueba
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        first_name: 'Juan',
        paternal_last_name: 'Pérez',
        maternal_last_name: 'González',
        rut: '12345678-9',
        email: 'juan.perez@example.com',
        phone: '+56912345678',
        profession: 'Ingeniero',
        marital_status: 'casado',
        address_street: 'Avenida Principal',
        address_number: '123',
        address_commune: 'Santiago',
        address_region: 'Metropolitana',
        monthly_income_clp: 2500000
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creando perfil:', profileError);
      return null;
    }

    console.log('✅ Perfil creado:', profile.email);

    // Crear propiedades de prueba
    const propertiesData = [
      {
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'venta',
        address_street: 'Calle Las Flores',
        address_number: '456',
        address_commune: 'Providencia',
        address_region: 'Metropolitana',
        price_clp: 150000000,
        bedrooms: 3,
        bathrooms: 2,
        surface_m2: 80,
        description: 'Hermosa casa en barrio residencial',
        owner_full_name: 'Juan Pérez González',
        owner_email: 'juan.perez@example.com',
        owner_phone: '+56912345678'
      },
      {
        owner_id: testUserId,
        status: 'disponible',
        listing_type: 'arriendo',
        address_street: 'Avenida Libertador',
        address_number: '789',
        address_commune: 'Las Condes',
        address_region: 'Metropolitana',
        price_clp: 800000,
        common_expenses_clp: 150000,
        bedrooms: 2,
        bathrooms: 1,
        surface_m2: 65,
        description: 'Departamento moderno con vista a la ciudad',
        owner_full_name: 'Juan Pérez González',
        owner_email: 'juan.perez@example.com',
        owner_phone: '+56912345678'
      },
      {
        owner_id: testUserId,
        status: 'arrendada',
        listing_type: 'arriendo',
        address_street: 'Pasaje Tranquilo',
        address_number: '321',
        address_commune: 'Ñuñoa',
        address_region: 'Metropolitana',
        price_clp: 600000,
        bedrooms: 1,
        bathrooms: 1,
        surface_m2: 45,
        description: 'Estudio acogedor cerca del metro',
        owner_full_name: 'Juan Pérez González',
        owner_email: 'juan.perez@example.com',
        owner_phone: '+56912345678'
      }
    ];

    const createdProperties = [];
    for (const propertyData of propertiesData) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (propertyError) {
        console.error('❌ Error creando propiedad:', propertyError);
        continue;
      }

      createdProperties.push(property);
      console.log(`✅ Propiedad creada: ${property.address_street} ${property.address_number}`);
    }

    // Crear postulaciones de prueba para algunas propiedades
    if (createdProperties.length >= 2) {
      const applicantId = '660e8400-e29b-41d4-a716-446655440001';

      // Crear perfil de postulante
      await supabase
        .from('profiles')
        .upsert({
          id: applicantId,
          first_name: 'María',
          paternal_last_name: 'Rodríguez',
          maternal_last_name: 'Silva',
          rut: '98765432-1',
          email: 'maria.rodriguez@example.com',
          phone: '+56987654321',
          profession: 'Profesora',
          marital_status: 'soltera',
          address_street: 'Calle Secundaria',
          address_number: '456',
          address_commune: 'Santiago',
          address_region: 'Metropolitana',
          monthly_income_clp: 1200000
        });

      // Crear postulaciones
      const applicationsData = [
        {
          property_id: createdProperties[0].id,
          applicant_id: applicantId,
          status: 'pendiente',
          message: 'Estoy muy interesado en esta propiedad',
          snapshot_applicant_profession: 'Profesora',
          snapshot_applicant_monthly_income_clp: 1200000,
          snapshot_applicant_age: 35,
          snapshot_applicant_nationality: 'Chilena',
          snapshot_applicant_marital_status: 'soltera',
          snapshot_applicant_address_street: 'Calle Secundaria',
          snapshot_applicant_address_number: '456',
          snapshot_applicant_address_commune: 'Santiago',
          snapshot_applicant_address_region: 'Metropolitana'
        },
        {
          property_id: createdProperties[0].id,
          applicant_id: applicantId,
          status: 'aprobada',
          message: 'Esta propiedad me encanta',
          snapshot_applicant_profession: 'Profesora',
          snapshot_applicant_monthly_income_clp: 1200000,
          snapshot_applicant_age: 35,
          snapshot_applicant_nationality: 'Chilena',
          snapshot_applicant_marital_status: 'soltera',
          snapshot_applicant_address_street: 'Calle Secundaria',
          snapshot_applicant_address_number: '456',
          snapshot_applicant_address_commune: 'Santiago',
          snapshot_applicant_address_region: 'Metropolitana'
        },
        {
          property_id: createdProperties[1].id,
          applicant_id: applicantId,
          status: 'pendiente',
          message: 'Busco un lugar para vivir',
          snapshot_applicant_profession: 'Profesora',
          snapshot_applicant_monthly_income_clp: 1200000,
          snapshot_applicant_age: 35,
          snapshot_applicant_nationality: 'Chilena',
          snapshot_applicant_marital_status: 'soltera',
          snapshot_applicant_address_street: 'Calle Secundaria',
          snapshot_applicant_address_number: '456',
          snapshot_applicant_address_commune: 'Santiago',
          snapshot_applicant_address_region: 'Metropolitana'
        }
      ];

      for (const applicationData of applicationsData) {
        const { data: application, error: applicationError } = await supabase
          .from('applications')
          .insert(applicationData)
          .select()
          .single();

        if (applicationError) {
          console.error('❌ Error creando postulación:', applicationError);
        } else {
          console.log(`✅ Postulación creada para propiedad ${application.property_id}`);
        }
      }
    }

    console.log('\n📊 Datos de prueba creados exitosamente');
    return testUserId;

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    return null;
  }
}

// Función para probar la función
async function testFunction(testUserId) {
  console.log('\n🧪 Probando función get_properties_with_postulation_count...\n');

  try {
    const { data: result, error } = await supabase
      .rpc('get_properties_with_postulation_count', {
        user_id_param: testUserId
      });

    if (error) {
      console.error('❌ Error ejecutando función:', error);
      console.log('\n💡 Asegúrate de que la función esté creada ejecutando:');
      console.log('   create_get_properties_with_postulation_count_function.sql');
      return;
    }

    console.log('✅ Función ejecutada exitosamente!\n');

    if (!result || result.length === 0) {
      console.log('📭 No se encontraron propiedades para este usuario.');
      return;
    }

    console.log(`📊 Resultados encontrados: ${result.length} propiedad(es)\n`);

    result.forEach((property, index) => {
      console.log(`🏠 Propiedad ${index + 1}:`);
      console.log(`   📍 ${property.address_street} ${property.address_number}, ${property.address_commune}`);
      console.log(`   💰 $${property.price_clp.toLocaleString('es-CL')} CLP (${property.listing_type})`);
      console.log(`   🛏️ ${property.bedrooms} hab | 🛁 ${property.bathrooms} baños | 📐 ${property.surface_m2}m²`);
      console.log(`   📊 Postulaciones: ${property.postulation_count}`);
      console.log(`   📝 Estado: ${property.status}`);
      console.log('');
    });

    // Estadísticas
    const totalProperties = result.length;
    const totalPostulations = result.reduce((sum, prop) => sum + parseInt(prop.postulation_count), 0);
    const propertiesWithPostulations = result.filter(prop => prop.postulation_count > 0).length;

    console.log('📈 === ESTADÍSTICAS ===');
    console.log(`🏠 Total de propiedades: ${totalProperties}`);
    console.log(`📧 Total de postulaciones: ${totalPostulations}`);
    console.log(`📊 Propiedades con postulaciones: ${propertiesWithPostulations}`);
    console.log(`📊 Propiedades sin postulaciones: ${totalProperties - propertiesWithPostulations}`);

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función principal
async function main() {
  console.log('🚀 === SETUP Y PRUEBA DE FUNCIÓN ===\n');

  // Paso 1: Intentar crear la función
  const functionCreated = await createFunction();

  // Paso 2: Crear datos de prueba
  const testUserId = await createTestData();

  if (!testUserId) {
    console.log('❌ No se pudieron crear datos de prueba');
    return;
  }

  // Paso 3: Probar la función
  await testFunction(testUserId);

  console.log('\n🎉 Proceso completado!');
  console.log('\n💡 Para usar la función en tu aplicación:');
  console.log(`
import { supabase } from './supabaseClient';

const properties = await supabase
  .rpc('get_properties_with_postulation_count', {
    user_id_param: userId
  });
  `);
}

// Ejecutar
main();
