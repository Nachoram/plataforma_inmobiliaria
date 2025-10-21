-- Fix the get_properties_with_postulation_count function
-- Execute this in Supabase SQL Editor

-- First, drop the existing function with incorrect return type
DROP FUNCTION IF EXISTS get_properties_with_postulation_count(uuid);

-- Now create the corrected function
CREATE FUNCTION get_properties_with_postulation_count(user_id_param uuid)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_properties_with_postulation_count(uuid) TO authenticated;
