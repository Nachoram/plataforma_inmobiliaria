-- 🔧 SOLUCIÓN DEFINITIVA: Arreglar función RPC
-- Ejecuta este script completo en Supabase SQL Editor

-- ========================================
-- PASO 1: Eliminar función problemática
-- ========================================
DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);

-- ========================================
-- PASO 2: Crear función corregida
-- ========================================
-- Esta versión usa JSONB y maneja correctamente los tipos

CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
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
    property_images jsonb,
    postulation_count bigint,
    postulations jsonb
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
        -- property_images como jsonb
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'image_url', pi.image_url,
                        'storage_path', pi.storage_path
                    )
                )
                FROM property_images pi
                WHERE pi.property_id = p.id
            ),
            '[]'::jsonb
        ) as property_images,
        -- postulation_count
        COALESCE(COUNT(a.id), 0)::bigint as postulation_count,
        -- postulations como jsonb
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', app.id,
                        'applicant_id', app.applicant_id,
                        'status', app.status,
                        'created_at', app.created_at,
                        'message', app.message,
                        'application_characteristic_id', app.application_characteristic_id,
                        'applicant_name', COALESCE(
                            prof.first_name || ' ' || 
                            prof.paternal_last_name || 
                            COALESCE(' ' || prof.maternal_last_name, ''),
                            'Sin nombre'
                        ),
                        'applicant_email', prof.email,
                        'applicant_phone', prof.phone,
                        'guarantor_name', CASE 
                            WHEN guar.first_name IS NOT NULL THEN
                                guar.first_name || ' ' || 
                                guar.paternal_last_name || 
                                COALESCE(' ' || guar.maternal_last_name, '')
                            ELSE NULL
                        END,
                        'guarantor_email', NULL,
                        'guarantor_phone', NULL,
                        'guarantor_characteristic_id', guar.guarantor_characteristic_id
                    )
                    ORDER BY app.created_at DESC
                )
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
$$;

-- ========================================
-- PASO 3: Otorgar permisos
-- ========================================
GRANT EXECUTE ON FUNCTION get_portfolio_with_postulations(uuid) TO authenticated;

-- ========================================
-- PASO 4: Agregar comentario
-- ========================================
COMMENT ON FUNCTION get_portfolio_with_postulations(uuid) IS 
'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval. Versión corregida con JSONB.';

-- ========================================
-- PASO 5: Probar la función
-- ========================================
-- Reemplaza 'TU_USER_ID' con tu ID real
-- SELECT * FROM get_portfolio_with_postulations('TU_USER_ID_AQUI');

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Verificar que la función existe
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_portfolio_with_postulations';

-- Si ves una fila con el nombre de la función, ¡está listo!

