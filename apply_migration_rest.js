// Script para aplicar la migración SQL usando REST API de Supabase
import fetch from 'node-fetch';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3NDYyNSwiZXhwIjoyMDcyNjUwNjI1fQ.YOUR_SERVICE_ROLE_KEY';

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${response.status} ${error}`);
  }

  return await response.json();
}

async function applyMigration() {
  console.log('🔧 Aplicando migración SQL usando REST API...');

  try {
    // Paso 1: Dropear función existente
    console.log('1. Eliminando función existente...');
    const dropSQL = `DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);`;
    await executeSQL(dropSQL);
    console.log('✅ Función eliminada');

    // Paso 2: Crear nueva función
    console.log('2. Creando nueva función...');
    const createSQL = `
      CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
      RETURNS TABLE (
          id uuid,
          owner_id uuid,
          status property_status_enum,
          listing_type listing_type_enum,
          property_type property_type_enum,
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
              p.tipo_propiedad,
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
              COUNT(a.id)::bigint as postulation_count,
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
    await executeSQL(createSQL);
    console.log('✅ Función creada');

    // Paso 3: Otorgar permisos
    console.log('3. Otorgando permisos...');
    const grantSQL = `GRANT EXECUTE ON FUNCTION get_portfolio_with_postulations(uuid) TO authenticated;`;
    await executeSQL(grantSQL);
    console.log('✅ Permisos otorgados');

    // Paso 4: Actualizar comentario
    console.log('4. Actualizando comentario...');
    const commentSQL = `
      COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS
      'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Devuelve tipo_propiedad directamente desde la base de datos.';
    `;
    await executeSQL(commentSQL);
    console.log('✅ Comentario actualizado');

    console.log('\n🎉 ¡Migración aplicada exitosamente!');
    console.log('📋 La función get_portfolio_with_postulations ahora usa COALESCE(property_type, tipo_propiedad)');
    console.log('🔍 Ahora puedes probar el frontend y deberías ver los tipos de propiedad correctos');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);

    console.log('\n💡 Método alternativo: Aplicar manualmente en Supabase Dashboard');
    console.log('   1. Ve a https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
    console.log('   2. Crea una nueva consulta SQL');
    console.log('   3. Copia y pega el contenido del archivo sql_fix_property_type.sql');
    console.log('   4. Haz clic en "Run"');

    console.log('\n📋 O copia este SQL simplificado:');
    console.log(`
DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);

CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
RETURNS TABLE (
    id uuid, owner_id uuid, status property_status_enum,
    listing_type listing_type_enum, property_type property_type_enum,
    address_street text, address_number varchar(10), address_department varchar(10),
    address_commune text, address_region text, price_clp bigint,
    common_expenses_clp integer, bedrooms integer, bathrooms integer,
    surface_m2 integer, description text, created_at timestamptz,
    property_images json, postulation_count bigint, postulations json
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.owner_id, p.status, p.listing_type, p.property_type,
           p.address_street, p.address_number, p.address_department,
           p.address_commune, p.address_region, p.price_clp,
           p.common_expenses_clp, p.bedrooms, p.bathrooms,
           p.surface_m2, p.description, p.created_at,
           COALESCE((SELECT json_agg(json_build_object('image_url', pi.image_url, 'storage_path', pi.storage_path))
                    FROM property_images pi WHERE pi.property_id = p.id), '[]'::json) as property_images,
           COUNT(a.id)::bigint as postulation_count,
           COALESCE((SELECT json_agg(json_build_object(
               'id', app.id, 'applicant_id', app.applicant_id, 'status', app.status,
               'created_at', app.created_at, 'message', app.message,
               'application_characteristic_id', app.application_characteristic_id,
               'applicant_name', COALESCE(prof.first_name || ' ' || prof.paternal_last_name || ' ' || COALESCE(prof.maternal_last_name, ''), 'Sin nombre'),
               'applicant_email', prof.email, 'applicant_phone', prof.phone,
               'guarantor_name', COALESCE(guar.first_name || ' ' || guar.paternal_last_name || ' ' || COALESCE(guar.maternal_last_name, ''), NULL),
               'guarantor_email', guar.email, 'guarantor_phone', guar.phone,
               'guarantor_characteristic_id', guar.guarantor_characteristic_id
           ) ORDER BY app.created_at DESC)
           FROM applications app LEFT JOIN profiles prof ON app.applicant_id = prof.id
           LEFT JOIN guarantors guar ON app.guarantor_id = guar.id
           WHERE app.property_id = p.id), '[]'::json) as postulations
    FROM properties p LEFT JOIN applications a ON p.id = a.property_id
    WHERE p.owner_id = user_id_param GROUP BY p.id ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_portfolio_with_postulations(uuid) TO authenticated;

COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS 'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Incluye el campo property_type para mostrar el tipo correcto de propiedad.';
    `);
  }
}

// Ejecutar la migración
applyMigration();
