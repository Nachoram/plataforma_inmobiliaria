-- =====================================================
-- EJEMPLOS DE BÚSQUEDAS EN WEBHOOKS USANDO IDs CARACTERÍSTICOS
-- =====================================================

-- Este script muestra ejemplos de cómo usar los IDs característicos
-- para realizar búsquedas automáticas en webhooks.

-- =====================================================
-- EJEMPLO 1: BÚSQUEDA POR ID CARACTERÍSTICO DE PROPIEDAD
-- =====================================================

-- Buscar una propiedad específica usando su ID característico
-- (Útil cuando el webhook recibe un ID como "PROP_1704067200_a1b2c3d4")
SELECT 
    p.id,
    p.property_characteristic_id,
    p.owner_id,
    p.receiver_id,
    p.address_street,
    p.address_number,
    p.address_commune,
    p.price_clp,
    p.status,
    p.created_at
FROM properties p
WHERE p.property_characteristic_id = 'PROP_1704067200_a1b2c3d4';

-- =====================================================
-- EJEMPLO 2: BÚSQUEDA POR ID CARACTERÍSTICO DE APLICACIÓN
-- =====================================================

-- Buscar una aplicación específica usando su ID característico
-- (Útil cuando el webhook recibe un ID como "APP_1704067200_b2c3d4e5")
SELECT 
    a.id,
    a.application_characteristic_id,
    a.property_id,
    a.applicant_id,
    a.receiver_id,
    a.status,
    a.message,
    a.created_at,
    -- Información de la propiedad relacionada
    p.address_street,
    p.address_commune,
    p.price_clp
FROM applications a
JOIN properties p ON a.property_id = p.id
WHERE a.application_characteristic_id = 'APP_1704067200_b2c3d4e5';

-- =====================================================
-- EJEMPLO 3: BÚSQUEDA POR ID CARACTERÍSTICO DE OFERTA
-- =====================================================

-- Buscar una oferta específica usando su ID característico
-- (Útil cuando el webhook recibe un ID como "OFFER_1704067200_c3d4e5f6")
SELECT 
    o.id,
    o.offer_characteristic_id,
    o.property_id,
    o.offerer_id,
    o.receiver_id,
    o.offer_amount_clp,
    o.status,
    o.message,
    o.created_at,
    -- Información de la propiedad relacionada
    p.address_street,
    p.address_commune,
    p.price_clp
FROM offers o
JOIN properties p ON o.property_id = p.id
WHERE o.offer_characteristic_id = 'OFFER_1704067200_c3d4e5f6';

-- =====================================================
-- EJEMPLO 4: BÚSQUEDA POR ID CARACTERÍSTICO DE DOCUMENTO
-- =====================================================

-- Buscar un documento específico usando su ID característico
-- (Útil cuando el webhook recibe un ID como "DOC_1704067200_d4e5f6g7")
SELECT 
    d.id,
    d.document_characteristic_id,
    d.uploader_id,
    d.receiver_id,
    d.related_entity_id,
    d.related_entity_type,
    d.document_type,
    d.storage_path,
    d.file_name,
    d.created_at
FROM documents d
WHERE d.document_characteristic_id = 'DOC_1704067200_d4e5f6g7';

-- =====================================================
-- EJEMPLO 5: BÚSQUEDA POR ID CARACTERÍSTICO DE IMAGEN
-- =====================================================

-- Buscar una imagen específica usando su ID característico
-- (Útil cuando el webhook recibe un ID como "IMG_1704067200_e5f6g7h8")
SELECT 
    pi.id,
    pi.image_characteristic_id,
    pi.property_id,
    pi.receiver_id,
    pi.image_url,
    pi.storage_path,
    pi.created_at,
    -- Información de la propiedad relacionada
    p.address_street,
    p.address_commune
FROM property_images pi
JOIN properties p ON pi.property_id = p.id
WHERE pi.image_characteristic_id = 'IMG_1704067200_e5f6g7h8';

-- =====================================================
-- EJEMPLO 6: BÚSQUEDA POR ID CARACTERÍSTICO DE FAVORITO
-- =====================================================

-- Buscar un favorito específico usando su ID característico
-- (Útil cuando el webhook recibe un ID como "FAV_1704067200_f6g7h8i9")
SELECT 
    uf.user_id,
    uf.property_id,
    uf.favorite_characteristic_id,
    uf.receiver_id,
    uf.created_at,
    -- Información del usuario
    prof.first_name,
    prof.paternal_last_name,
    prof.email,
    -- Información de la propiedad
    p.address_street,
    p.address_commune,
    p.price_clp
FROM user_favorites uf
JOIN profiles prof ON uf.user_id = prof.id
JOIN properties p ON uf.property_id = p.id
WHERE uf.favorite_characteristic_id = 'FAV_1704067200_f6g7h8i9';

-- =====================================================
-- EJEMPLO 7: BÚSQUEDA POR ID CARACTERÍSTICO DE GARANTE
-- =====================================================

-- Buscar un garante específico usando su ID característico
-- (Útil cuando el webhook recibe un ID como "GUAR_1704067200_g7h8i9j0")
SELECT 
    g.id,
    g.guarantor_characteristic_id,
    g.first_name,
    g.paternal_last_name,
    g.maternal_last_name,
    g.rut,
    g.profession,
    g.monthly_income_clp,
    g.created_at
FROM guarantors g
WHERE g.guarantor_characteristic_id = 'GUAR_1704067200_g7h8i9j0';

-- =====================================================
-- EJEMPLO 8: BÚSQUEDA MÚLTIPLE POR PREFIJO
-- =====================================================

-- Buscar todos los registros que empiecen con un prefijo específico
-- (Útil para búsquedas por tipo de entidad)
SELECT 
    'properties' as tabla,
    id,
    property_characteristic_id as characteristic_id,
    created_at
FROM properties 
WHERE property_characteristic_id LIKE 'PROP_%'
UNION ALL
SELECT 
    'applications' as tabla,
    id,
    application_characteristic_id as characteristic_id,
    created_at
FROM applications 
WHERE application_characteristic_id LIKE 'APP_%'
UNION ALL
SELECT 
    'offers' as tabla,
    id,
    offer_characteristic_id as characteristic_id,
    created_at
FROM offers 
WHERE offer_characteristic_id LIKE 'OFFER_%'
ORDER BY created_at DESC;

-- =====================================================
-- EJEMPLO 9: BÚSQUEDA POR RANGO DE TIEMPO
-- =====================================================

-- Buscar registros creados en un rango de tiempo específico
-- usando el timestamp en el ID característico
SELECT 
    'properties' as tabla,
    id,
    property_characteristic_id,
    created_at
FROM properties 
WHERE property_characteristic_id LIKE 'PROP_1704067200_%'
   OR property_characteristic_id LIKE 'PROP_1704067300_%'
UNION ALL
SELECT 
    'applications' as tabla,
    id,
    application_characteristic_id,
    created_at
FROM applications 
WHERE application_characteristic_id LIKE 'APP_1704067200_%'
   OR application_characteristic_id LIKE 'APP_1704067300_%'
ORDER BY created_at DESC;

-- =====================================================
-- EJEMPLO 10: FUNCIÓN HELPER PARA WEBHOOKS
-- =====================================================

-- Crear una función helper para búsquedas automáticas en webhooks
CREATE OR REPLACE FUNCTION find_record_by_characteristic_id(characteristic_id text)
RETURNS TABLE (
    table_name text,
    record_id uuid,
    characteristic_id text,
    created_at timestamptz
) AS $$
BEGIN
  -- Buscar en properties
  IF characteristic_id LIKE 'PROP_%' THEN
    RETURN QUERY
    SELECT 
        'properties'::text,
        p.id,
        p.property_characteristic_id,
        p.created_at
    FROM properties p
    WHERE p.property_characteristic_id = characteristic_id;
  END IF;
  
  -- Buscar en applications
  IF characteristic_id LIKE 'APP_%' THEN
    RETURN QUERY
    SELECT 
        'applications'::text,
        a.id,
        a.application_characteristic_id,
        a.created_at
    FROM applications a
    WHERE a.application_characteristic_id = characteristic_id;
  END IF;
  
  -- Buscar en offers
  IF characteristic_id LIKE 'OFFER_%' THEN
    RETURN QUERY
    SELECT 
        'offers'::text,
        o.id,
        o.offer_characteristic_id,
        o.created_at
    FROM offers o
    WHERE o.offer_characteristic_id = characteristic_id;
  END IF;
  
  -- Buscar en guarantors
  IF characteristic_id LIKE 'GUAR_%' THEN
    RETURN QUERY
    SELECT 
        'guarantors'::text,
        g.id,
        g.guarantor_characteristic_id,
        g.created_at
    FROM guarantors g
    WHERE g.guarantor_characteristic_id = characteristic_id;
  END IF;
  
  -- Buscar en documents
  IF characteristic_id LIKE 'DOC_%' THEN
    RETURN QUERY
    SELECT 
        'documents'::text,
        d.id,
        d.document_characteristic_id,
        d.created_at
    FROM documents d
    WHERE d.document_characteristic_id = characteristic_id;
  END IF;
  
  -- Buscar en property_images
  IF characteristic_id LIKE 'IMG_%' THEN
    RETURN QUERY
    SELECT 
        'property_images'::text,
        pi.id,
        pi.image_characteristic_id,
        pi.created_at
    FROM property_images pi
    WHERE pi.image_characteristic_id = characteristic_id;
  END IF;
  
  -- Buscar en user_favorites
  IF characteristic_id LIKE 'FAV_%' THEN
    RETURN QUERY
    SELECT 
        'user_favorites'::text,
        uf.user_id,
        uf.favorite_characteristic_id,
        uf.created_at
    FROM user_favorites uf
    WHERE uf.favorite_characteristic_id = characteristic_id;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso de la función helper:
-- SELECT * FROM find_record_by_characteristic_id('PROP_1704067200_a1b2c3d4');
