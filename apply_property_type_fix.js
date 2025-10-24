// Script to apply the property_type fix to the get_portfolio_with_postulations function
// Run this script to fix the bug where all properties show as "Casa"

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
RETURNS TABLE (
    -- Columnas de properties
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
        p.property_type,
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

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION get_portfolio_with_postulations(uuid) TO authenticated;

-- Comentario actualizado
COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS
'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Incluye el campo property_type para mostrar el tipo correcto de propiedad.';
`;

async function applyMigration() {
  try {
    console.log('🚀 Applying property_type fix migration...');

    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error applying migration via RPC:', error);

      // Try direct SQL execution
      console.log('🔄 Trying direct SQL execution...');
      const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);

      // Since we can't execute DDL directly, let's try a different approach
      console.log('📋 Migration SQL to execute manually in Supabase Dashboard:');
      console.log('='.repeat(80));
      console.log(migrationSQL);
      console.log('='.repeat(80));
      console.log('');
      console.log('📝 Instructions:');
      console.log('1. Go to https://supabase.com/dashboard/project/[your-project-ref]/sql');
      console.log('2. Create a new query');
      console.log('3. Paste the SQL above');
      console.log('4. Click "Run"');
      console.log('');
      console.log('✅ After applying the migration, refresh your portfolio page to see the fix!');

      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('🔄 Refresh your portfolio page to see the property types displayed correctly.');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

applyMigration();

