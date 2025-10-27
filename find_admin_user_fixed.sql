-- ============================================================================
-- ENCONTRAR USUARIO ADMINISTRADOR (Versión Corregida)
-- Busca usuarios sin depender de campos específicos que pueden no existir
-- ============================================================================

-- Opción 1: Buscar por email que contenga términos administrativos
SELECT
  p.id,
  p.email,
  p.first_name,
  p.paternal_last_name,
  u.created_at,
  CASE
    WHEN p.email LIKE '%admin%' THEN 'ADMIN_EMAIL'
    WHEN p.email LIKE '%root%' THEN 'ROOT_EMAIL'
    WHEN p.email LIKE '%super%' THEN 'SUPER_EMAIL'
    WHEN p.email LIKE '%system%' THEN 'SYSTEM_EMAIL'
    ELSE 'REGULAR_USER'
  END as user_type
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY
  CASE
    WHEN p.email LIKE '%admin%' THEN 1
    WHEN p.email LIKE '%root%' THEN 2
    WHEN p.email LIKE '%super%' THEN 3
    ELSE 4
  END,
  u.created_at ASC;

-- Opción 2: Si hay tabla de roles separada, buscar ahí
-- SELECT * FROM user_roles WHERE role = 'admin' LIMIT 5;

-- Opción 3: Usuario más antiguo (probablemente el creador del sistema)
SELECT
  u.id,
  p.email,
  p.first_name,
  p.paternal_last_name,
  u.created_at,
  'OLDEST_USER' as user_type
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at ASC
LIMIT 5;

-- Opción 4: Buscar usuarios con más actividad (más avales creados)
SELECT
  p.id,
  p.email,
  p.first_name,
  p.paternal_last_name,
  COUNT(g.id) as guarantors_created,
  'MOST_ACTIVE' as user_type
FROM profiles p
LEFT JOIN guarantors g ON g.created_by = p.id
WHERE g.created_by IS NOT NULL
GROUP BY p.id, p.email, p.first_name, p.paternal_last_name
ORDER BY guarantors_created DESC
LIMIT 5;

-- RESUMEN: Copia el UUID del usuario que quieres usar como administrador
-- Ejemplo de resultado esperado:
-- id: 3910eba1-4ab6-4229-a65b-0b89423a8533
-- email: admin@tusistema.com
-- user_type: ADMIN_EMAIL

-- Una vez identificado el UUID, úsalo en el siguiente script
