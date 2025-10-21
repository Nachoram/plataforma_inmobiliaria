// Script de diagnóstico para el error 500 Internal Server Error
// Ejecutar con: node debug_500_error.js

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDatabase() {
  console.log('🔍 === DIAGNÓSTICO DE BASE DE DATOS ===');
  console.log('URL de Supabase:', supabaseUrl);
  console.log('Key presente:', !!supabaseAnonKey);
  console.log('');

  try {
    // Autenticar como usuario demo para acceder a propiedades
    console.log('🔐 Autenticando como usuario demo...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo123456'
    });

    if (signInError) {
      console.error('❌ Error autenticando:', signInError);
      console.log('⚠️ Continuando sin autenticación (puede afectar resultados)');
    } else {
      console.log('✅ Autenticado como usuario demo');
    }
    // 1. Probar conexión básica
    console.log('1️⃣ Probando conexión básica...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('properties')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError);
      return;
    }
    console.log('✅ Conexión exitosa');

    // 2. Verificar estructura de tabla properties
    console.log('\n2️⃣ Verificando estructura de tabla properties...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'properties' });

    if (tableError) {
      console.log('⚠️ No se pudo obtener info de columnas vía RPC, probando query directa...');

      // Query directa para verificar columnas
      const { data: sampleData, error: sampleError } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ Error obteniendo datos de properties:', sampleError);
        return;
      }

      if (sampleData && sampleData.length > 0) {
        console.log('✅ Columnas disponibles en properties:');
        console.log(Object.keys(sampleData[0]));
      } else {
        console.log('⚠️ Tabla properties está vacía');
      }
    }

    // 3. Probar la query específica del AdminPropertyDetailView
    console.log('\n3️⃣ Probando query específica del AdminPropertyDetailView...');

    // Intentar acceder a la propiedad demo que acabamos de crear
    const demoPropertyId = '550e8400-e29b-41d4-a716-446655440004';
    console.log('Probando con propiedad demo ID:', demoPropertyId);

    // Probar la query exacta del componente
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        owner_id,
        status,
        listing_type,
        address_street,
        address_number,
        address_department,
        address_commune,
        address_region,
        price_clp,
        common_expenses_clp,
        bedrooms,
        bathrooms,
        estacionamientos,
        metros_utiles,
        metros_totales,
        ano_construccion,
        created_at,
        property_images (
          image_url,
          storage_path
        )
      `)
      .eq('id', demoPropertyId)
      .single();

    if (propertyError) {
      console.error('❌ Error en query específica:', propertyError);
      console.error('Código de error:', propertyError.code);
      console.error('Mensaje detallado:', propertyError.message);
      console.error('Detalles:', propertyError.details);
      return;
    }

    console.log('✅ Query ejecutada exitosamente');
    console.log('Datos obtenidos:', {
      id: propertyData.id,
      status: propertyData.status,
      listing_type: propertyData.listing_type,
      address: `${propertyData.address_street} ${propertyData.address_number}`,
      price: propertyData.price_clp,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      estacionamientos: propertyData.estacionamientos,
      metros_utiles: propertyData.metros_utiles,
      metros_totales: propertyData.metros_totales,
      ano_construccion: propertyData.ano_construccion,
      images_count: propertyData.property_images?.length || 0
    });

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'properties' });

    if (rlsError) {
      console.log('⚠️ No se pudo verificar RLS vía RPC');
    } else {
      console.log('✅ Políticas RLS obtenidas');
    }

    console.log('\n🎉 === DIAGNÓSTICO COMPLETADO ===');
    console.log('Si llegaste aquí, la base de datos funciona correctamente.');
    console.log('El error 500 podría estar relacionado con:');
    console.log('1. Autenticación del usuario en el frontend');
    console.log('2. ID de propiedad inválido en la URL');
    console.log('3. Problemas de CORS o configuración del servidor de desarrollo');

  } catch (error) {
    console.error('❌ Error inesperado en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
debugDatabase();
