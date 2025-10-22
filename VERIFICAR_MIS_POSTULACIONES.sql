-- 🔍 Queries específicas para tu usuario: demo@example.com
-- User ID: c14fe4b0-2204-4e30-800e-7d2c12c8aa9d

-- ========================================
-- PASO 1: Ver tus propiedades
-- ========================================
SELECT 
  id as property_id,
  owner_id,
  address_street,
  address_number,
  address_commune,
  status,
  listing_type,
  created_at
FROM properties
WHERE owner_id = 'c14fe4b0-2204-4e30-800e-7d2c12c8aa9d'
ORDER BY created_at DESC;

-- ========================================
-- PASO 2: Ver postulaciones de tus propiedades
-- ========================================
SELECT 
  a.id as application_id,
  a.property_id,
  p.address_street,
  a.applicant_id,
  a.status,
  a.created_at,
  prof.first_name,
  prof.paternal_last_name,
  prof.email
FROM applications a
JOIN properties p ON a.property_id = p.id
LEFT JOIN profiles prof ON a.applicant_id = prof.id
WHERE p.owner_id = 'c14fe4b0-2204-4e30-800e-7d2c12c8aa9d'
ORDER BY a.created_at DESC;

-- ========================================
-- PASO 3: Contar postulaciones por propiedad tuya
-- ========================================
SELECT 
  p.id as property_id,
  p.address_street,
  COUNT(a.id) as postulation_count
FROM properties p
LEFT JOIN applications a ON p.id = a.property_id
WHERE p.owner_id = 'c14fe4b0-2204-4e30-800e-7d2c12c8aa9d'
GROUP BY p.id, p.address_street
ORDER BY postulation_count DESC;

-- ========================================
-- PASO 4: Ver TODAS las postulaciones que existen
-- ========================================
-- (para ver a qué propiedades pertenecen)
SELECT 
  a.id as application_id,
  a.property_id,
  p.address_street,
  p.owner_id,
  CASE 
    WHEN p.owner_id = 'c14fe4b0-2204-4e30-800e-7d2c12c8aa9d' THEN '✅ TU PROPIEDAD'
    ELSE '❌ De otro usuario'
  END as es_tuya,
  a.status,
  a.created_at
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
ORDER BY a.created_at DESC;

