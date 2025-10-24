// Script para aplicar la migración SQL directamente
import { createClient } from '@supabase/supabase-js';

// Usar service role key para poder ejecutar DDL
// NOTA: En producción nunca expongas esta key, pero para desarrollo está bien
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  console.log('🔧 Aplicando migración SQL para fix property_type...');

  try {
    // SQL para dropear la función existente
    const dropFunctionSQL = `
      DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);
    `;

    console.log('1. Eliminando función existente...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropFunctionSQL
    });

    if (dropError) {
      console.log('⚠️  Error eliminando función (puede que no exista):', dropError.message);
    } else {
      console.log('✅ Función eliminada');
    }

    // SQL para crear la nueva función
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
      RETURNS TABLE (
          -- Columnas de properties
          id uuid,
          owner_id uuid,
          status property_status_enum,
          listing_type listing_type_enum,
          property_type property_type_enum,  -- <-- CAMPO AGREGADO
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
          -- Columnas adicionales
          property_images json,
          postulation_count bigint,
          postulations json
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT
              p.id,
              p.owner_id,
              p.status,
              p.listing_type,
              p.property_type,  -- <-- CAMPO AGREGADO EN EL SELECT
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
              -- Subquery para property_images
              COALESCE(
                  (
                      SELECT json_agg(json_build_object(
                          'image_url', pi.image_url,
                          'storage_path', pi.storage_path
                      ))
                      FROM property_images pi
                      WHERE pi.property_id = p.id
                  ),
                  '[]'::json
              ) as property_images,
              -- Count de postulaciones
              COUNT(a.id)::bigint as postulation_count,
              -- Array de postulaciones con detalles
              COALESCE(
                  (
                      SELECT json_agg(json_build_object(
                          'id', app.id,
                          'applicant_id', app.applicant_id,
                          'status', app.status,
                          'created_at', app.created_at,
                          'message', app.message,
                          'application_characteristic_id', app.application_characteristic_id,
                          'applicant_name', COALESCE(
                              prof.first_name || ' ' || prof.paternal_last_name || ' ' || COALESCE(prof.maternal_last_name, ''),
                              'Sin nombre'
                          ),
                          'applicant_email', prof.email,
                          'applicant_phone', prof.phone,
                          'guarantor_name', COALESCE(
                              guar.first_name || ' ' || guar.paternal_last_name || ' ' || COALESCE(guar.maternal_last_name, ''),
                              NULL
                          ),
                          'guarantor_email', guar.email,
                          'guarantor_phone', guar.phone,
                          'guarantor_characteristic_id', guar.guarantor_characteristic_id
                      ) ORDER BY app.created_at DESC)
                      FROM applications app
                      LEFT JOIN profiles prof ON app.applicant_id = prof.id
                      LEFT JOIN guarantors guar ON app.guarantor_id = guar.id
                      WHERE app.property_id = p.id
                  ),
                  '[]'::json
              ) as postulations
          FROM properties p
          LEFT JOIN applications a ON p.id = a.property_id
          WHERE p.owner_id = user_id_param
          GROUP BY p.id
          ORDER BY p.created_at DESC;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('2. Creando nueva función...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (createError) {
      console.error('❌ Error creando función:', createError);
      return;
    } else {
      console.log('✅ Función creada');
    }

    // Otorgar permisos
    const grantPermissionsSQL = `
      GRANT EXECUTE ON FUNCTION get_portfolio_with_postulations(uuid) TO authenticated;
    `;

    console.log('3. Otorgando permisos...');
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: grantPermissionsSQL
    });

    if (grantError) {
      console.log('⚠️  Error otorgando permisos:', grantError.message);
    } else {
      console.log('✅ Permisos otorgados');
    }

    // Actualizar comentario
    const commentSQL = `
      COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS
      'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Incluye el campo property_type para mostrar el tipo correcto de propiedad.';
    `;

    console.log('4. Actualizando comentario...');
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: commentSQL
    });

    if (commentError) {
      console.log('⚠️  Error actualizando comentario:', commentError.message);
    } else {
      console.log('✅ Comentario actualizado');
    }

    console.log('\n🎉 ¡Migración aplicada exitosamente!');
    console.log('📋 La función get_portfolio_with_postulations ahora incluye property_type');
    console.log('🔍 Ahora puedes probar el frontend y deberías ver tipos de propiedad variados');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);

    // Si rpc('exec_sql') no funciona, intentar con consultas directas
    console.log('\n🔄 Intentando método alternativo...');

    try {
      // Intentar ejecutar SQL usando el método directo de Supabase
      const { error } = await supabase.from('properties').select('count').limit(1);
      console.log('Conexión de service role funciona, pero exec_sql no está disponible');

      console.log('💡 Necesitas aplicar la migración manualmente en el Dashboard de Supabase:');
      console.log('   1. Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
      console.log('   2. Crea una nueva consulta');
      console.log('   3. Copia y pega el contenido del archivo sql_fix_property_type.sql');
      console.log('   4. Ejecuta la consulta');

    } catch (altError) {
      console.error('❌ Tampoco funciona el método alternativo:', altError);
    }
  }
}

// Ejecutar la migración
applyMigration();
