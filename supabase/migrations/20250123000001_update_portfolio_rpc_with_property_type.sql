-- Update get_portfolio_with_postulations to include property_type field
-- This migration assumes 20250123000000_add_property_type.sql has been applied first

-- Drop the existing function
DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);

-- Recreate the function with property_type included
CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
RETURNS TABLE (
    -- Columnas de properties
    id uuid,
    owner_id uuid,
    status property_status_enum,
    listing_type listing_type_enum,
    property_type property_type_enum,  -- NUEVO CAMPO
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
    -- Columnas adicionales (usando jsonb)
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
        p.property_type,  -- NUEVO CAMPO
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
                    'guarantor_name', COALESCE(
                        guar.first_name || ' ' || guar.paternal_last_name || ' ' || COALESCE(guar.maternal_last_name, ''),
                        NULL
                    ),
                    'guarantor_email', NULL,  -- guarantors table doesn't have email column
                    'guarantor_phone', NULL,  -- guarantors table doesn't have phone column
                    'guarantor_characteristic_id', guar.guarantor_characteristic_id
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

-- Comentario
COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS
'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Incluye el campo property_type agregado en la migración 20250123000000.';

