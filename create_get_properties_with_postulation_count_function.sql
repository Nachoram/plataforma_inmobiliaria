-- Función RPC para obtener propiedades con conteo de postulaciones
-- Versión simplificada que usa solo columnas básicas que definitivamente existen

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
        p.created_at
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para que los usuarios autenticados puedan ejecutar la función
GRANT EXECUTE ON FUNCTION get_properties_with_postulation_count(uuid) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION get_properties_with_postulation_count(uuid) IS 'Obtiene todas las propiedades de un usuario junto con el conteo de postulaciones para cada propiedad. Optimizada con LEFT JOIN y GROUP BY para mejor rendimiento.';
