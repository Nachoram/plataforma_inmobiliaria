// Script to apply the guarantor email column fix to the get_portfolio_with_postulations function
// Run this script to fix the "column guar.email does not exist" error

import { createClient } from '@supabase/supabase-js';

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
// Fix get_portfolio_with_postulations RPC function to use correct column names
// Fix both property column (tipo_propiedad) and guarantor columns (contact_email, contact_phone)

// Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);

// Create the corrected function
CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
RETURNS TABLE (
    -- Columnas de properties
    id uuid,
    owner_id uuid,
    status property_status_enum,
    listing_type listing_type_enum,
    tipo_propiedad tipo_propiedad_enum,  -- Correct column name
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
    property_images jsonb,
    postulation_count bigint,
    postulations jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.owner_id,
        p.status,
        p.listing_type,
        p.tipo_propiedad,  -- Correct column name
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
                SELECT jsonb_agg(jsonb_build_object(
                    'image_url', pi.image_url,
                    'storage_path', pi.storage_path
                ))
                FROM property_images pi
                WHERE pi.property_id = p.id
            ),
            '[]'::jsonb
        ) as property_images,
        -- Count de postulaciones
        COUNT(a.id)::bigint as postulation_count,
        -- Array de postulaciones con detalles
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
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
                    -- FIXED: Use correct guarantor column names
                    'guarantor_name', guar.full_name,
                    'guarantor_email', guar.contact_email,
                    'guarantor_phone', guar.contact_phone,
                    'guarantor_characteristic_id', app.guarantor_characteristic_id
                ) ORDER BY app.created_at DESC)
                FROM applications app
                LEFT JOIN profiles prof ON app.applicant_id = prof.id
                LEFT JOIN guarantors guar ON app.guarantor_id = guar.id
                WHERE app.property_id = p.id
            ),
            '[]'::jsonb
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
'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Usa las columnas correctas: tipo_propiedad para propiedades y full_name, contact_email, contact_phone para garantes.';
`;

async function applyMigration() {
  try {
    console.log('🔄 Checking current function status...');

    // First, try to call the current function to see if it fails
    const { data: testData, error: testError } = await supabase
      .rpc('get_portfolio_with_postulations', {
        user_id_param: '00000000-0000-0000-0000-000000000000' // Dummy UUID for testing
      });

    if (testError) {
      if (testError.message.includes('column guar.email does not exist')) {
        console.log('🚨 CONFIRMED: The function is using the wrong column name "guar.email"');
        console.log('📋 Current error:', testError.message);
      } else {
        console.log('⚠️ Different error found:', testError.message);
      }
    } else {
      console.log('✅ Function seems to work, but let\'s check if it\'s using correct columns...');
      if (testData && testData.length > 0) {
        const sample = testData[0];
        if (sample.postulations && sample.postulations.length > 0) {
          const postulation = sample.postulations[0];
          if (postulation.guarantor_email) {
            console.log('✅ Function is returning guarantor_email field');
          } else {
            console.log('⚠️ Function is not returning guarantor_email field');
          }
        }
      }
    }

    // Since we can't execute DDL directly, output the SQL for manual execution
    console.log('\n📋 Migration SQL to execute manually in Supabase Dashboard:');
    console.log('='.repeat(80));
    console.log(migrationSQL.trim());
    console.log('='.repeat(80));
    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql');
    console.log('2. Create a new query');
    console.log('3. Paste the SQL above');
    console.log('4. Click "Run"');
    console.log('');
    console.log('✅ After applying the migration:');
    console.log('- The "column guar.email does not exist" error should be fixed');
    console.log('- Portfolio loading should work correctly');
    console.log('- Guarantor information should display properly');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
