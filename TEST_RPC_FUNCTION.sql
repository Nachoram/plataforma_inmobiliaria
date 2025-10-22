-- 🔍 Script de Diagnóstico: Test de Función RPC
-- Ejecuta estos comandos en Supabase SQL Editor paso por paso

-- ========================================
-- PASO 1: Verificar que la función existe
-- ========================================
SELECT 
  routine_name, 
  routine_type,
  routine_schema
FROM information_schema.routines 
WHERE routine_name = 'get_portfolio_with_postulations';

-- Resultado esperado: Debe aparecer 1 fila con el nombre de la función
-- Si no aparece nada, la función NO fue creada


-- ========================================
-- PASO 2: Ver tu user_id
-- ========================================
SELECT 
  id as user_id, 
  email,
  created_at
FROM auth.users 
WHERE email = 'TU_EMAIL_AQUI@example.com';  -- ⚠️ REEMPLAZA CON TU EMAIL

-- Copia el user_id que aparezca aquí


-- ========================================
-- PASO 3: Verificar tus propiedades
-- ========================================
SELECT 
  id,
  owner_id,
  address_street,
  address_number,
  status,
  listing_type,
  created_at
FROM properties
WHERE owner_id = 'PEGA_TU_USER_ID_AQUI';  -- ⚠️ REEMPLAZA CON TU USER_ID

-- ¿Cuántas propiedades tienes? Anota el número


-- ========================================
-- PASO 4: Probar la función RPC directamente
-- ========================================
SELECT * FROM get_portfolio_with_postulations('PEGA_TU_USER_ID_AQUI');  -- ⚠️ REEMPLAZA CON TU USER_ID

-- ¿Devuelve tus propiedades?
-- Si devuelve error, copia el mensaje completo


-- ========================================
-- PASO 5: Si hay error, verificar permisos
-- ========================================
SELECT 
  proname as function_name,
  proacl as permissions
FROM pg_proc 
WHERE proname = 'get_portfolio_with_postulations';

-- Debe incluir "authenticated" en los permisos


-- ========================================
-- SOLUCIÓN ALTERNATIVA: Si la función da error
-- ========================================
-- Elimina la función actual y créala de nuevo con esta versión mejorada:

DROP FUNCTION IF EXISTS get_portfolio_with_postulations(uuid);

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
        -- property_images como jsonb
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
        -- postulation_count
        COUNT(a.id)::bigint as postulation_count,
        -- postulations como jsonb
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
                    'guarantor_email', guar.email,
                    'guarantor_phone', guar.phone,
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
'Obtiene todas las propiedades de un usuario con el conteo de postulaciones y detalles completos de cada postulación incluyendo datos del postulante y aval.';

-- Ahora prueba de nuevo:
SELECT * FROM get_portfolio_with_postulations('PEGA_TU_USER_ID_AQUI');  -- ⚠️ REEMPLAZA CON TU USER_ID

