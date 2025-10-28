-- =====================================================
-- COMPLETE FIX FOR PROPERTY_TYPE ISSUE
-- =====================================================
-- This script:
-- 1. Updates the RPC function to use tipo_propiedad instead of property_type
-- 2. Removes the property_type column from properties table
-- 3. Applies all necessary fixes
-- =====================================================

-- 1. Update the RPC function to use tipo_propiedad
DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);

CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
RETURNS TABLE (
    -- Columnas de properties
    id uuid,
    owner_id uuid,
    status property_status_enum,
    listing_type listing_type_enum,
    tipo_propiedad tipo_propiedad_enum,
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

-- Comentario
COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS
'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Usa tipo_propiedad directamente.';

-- 2. Remove the property_type column
DO $$ BEGIN
    RAISE NOTICE '🗑️  REMOVING property_type COLUMN FROM properties TABLE...';
END $$;

-- Eliminar el trigger que sincroniza property_type con tipo_propiedad (si existe)
DROP TRIGGER IF EXISTS sync_property_type_trigger ON public.properties;

-- Eliminar la función que sincroniza los campos (si existe)
DROP FUNCTION IF EXISTS public.sync_property_type_fields();

-- Eliminar la columna property_type
ALTER TABLE public.properties DROP COLUMN IF EXISTS property_type;

DO $$ BEGIN
    RAISE NOTICE '✅ PROPERTY_TYPE COLUMN REMOVED SUCCESSFULLY';
    RAISE NOTICE '✅ TRIGGER sync_property_type_trigger REMOVED';
    RAISE NOTICE '✅ FUNCTION sync_property_type_fields() REMOVED';
END $$;

-- 3. Verification
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the function
-- SELECT id, tipo_propiedad, postulation_count FROM get_portfolio_with_postulations('00000000-0000-0000-0000-000000000000') LIMIT 1;
