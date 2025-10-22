-- 🔍 Script de Verificación: ¿Tienes postulaciones reales en la base de datos?
-- Ejecuta estos comandos en Supabase SQL Editor paso por paso

-- ========================================
-- PASO 1: Ver tu user_id
-- ========================================
SELECT 
  id as user_id, 
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- Copia tu user_id de aquí


-- ========================================
-- PASO 2: Ver tus propiedades
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
WHERE owner_id = 'PEGA_TU_USER_ID_AQUI'  -- ⚠️ REEMPLAZA CON TU USER_ID
ORDER BY created_at DESC;

-- ¿Ves tus propiedades? Copia algunos property_id


-- ========================================
-- PASO 3: Ver TODAS las postulaciones (applications) en la base de datos
-- ========================================
SELECT 
  id as application_id,
  property_id,
  applicant_id,
  status,
  created_at,
  message
FROM applications
ORDER BY created_at DESC
LIMIT 20;

-- ¿Hay alguna application en la base de datos?


-- ========================================
-- PASO 4: Ver postulaciones específicas de tus propiedades
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
WHERE p.owner_id = 'PEGA_TU_USER_ID_AQUI'  -- ⚠️ REEMPLAZA CON TU USER_ID
ORDER BY a.created_at DESC;

-- ¿Aparecen postulaciones aquí?


-- ========================================
-- PASO 5: Contar postulaciones por propiedad
-- ========================================
SELECT 
  p.id as property_id,
  p.address_street,
  COUNT(a.id) as postulation_count
FROM properties p
LEFT JOIN applications a ON p.id = a.property_id
WHERE p.owner_id = 'PEGA_TU_USER_ID_AQUI'  -- ⚠️ REEMPLAZA CON TU USER_ID
GROUP BY p.id, p.address_street
ORDER BY postulation_count DESC;

-- ¿Qué números ves en postulation_count?


-- ========================================
-- DIAGNÓSTICO DEL RESULTADO:
-- ========================================

-- Si NO hay ninguna fila en el PASO 3:
-- → No tienes postulaciones en la base de datos
-- → Es normal que no aparezcan en el frontend
-- → Necesitas crear postulaciones primero

-- Si SÍ hay filas en el PASO 3 pero NO en el PASO 4:
-- → Las postulaciones existen pero no están vinculadas a tus propiedades
-- → Puede que el property_id o applicant_id sean incorrectos

-- Si SÍ aparecen en el PASO 4:
-- → Las postulaciones están correctamente vinculadas
-- → El problema está en el frontend o en las políticas RLS

-- Si el PASO 5 muestra count = 0:
-- → Las propiedades existen pero sin postulaciones
-- → Es normal que no aparezcan en el frontend


-- ========================================
-- CREAR POSTULACIÓN DE PRUEBA (OPCIONAL)
-- ========================================
-- Si quieres crear una postulación de prueba para verificar:

INSERT INTO applications (
  property_id,
  applicant_id,
  status,
  message,
  created_at
) VALUES (
  'PEGA_UN_PROPERTY_ID_AQUI',  -- ⚠️ REEMPLAZA con uno de tus property_id del PASO 2
  'PEGA_TU_USER_ID_AQUI',       -- ⚠️ REEMPLAZA con tu user_id del PASO 1
  'pendiente',
  'Esta es una postulación de prueba',
  NOW()
);

-- Luego verifica de nuevo con el PASO 4

