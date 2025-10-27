-- ============================================================================
-- ENCONTRAR USUARIO ADMINISTRADOR PARA ASIGNAR AVALES HUÉRFANOS
-- ============================================================================

-- Buscar usuarios con rol de administrador (ajusta según tu esquema)
SELECT
  p.id,
  p.email,
  p.first_name,
  p.paternal_last_name,
  u.created_at,
  CASE
    WHEN p.role = 'admin' THEN 'ADMIN_ROLE'
    WHEN p.email LIKE '%admin%' THEN 'ADMIN_EMAIL'
    WHEN p.email LIKE '%root%' THEN 'ROOT_EMAIL'
    ELSE 'REGULAR_USER'
  END as user_type
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY
  CASE
    WHEN p.role = 'admin' THEN 1
    WHEN p.email LIKE '%admin%' THEN 2
    ELSE 3
  END,
  u.created_at ASC
LIMIT 10;

-- Si no hay usuarios con rol admin, buscar el usuario más antiguo (probablemente creador del sistema)
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at ASC LIMIT 1;

-- O buscar por email específico si sabes cuál es
-- SELECT id, email FROM auth.users WHERE email = 'tu-email-admin@dominio.com';
