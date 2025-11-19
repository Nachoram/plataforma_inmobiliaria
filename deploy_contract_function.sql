-- Script para crear la función create-rental-contract directamente en Supabase
-- Si no puedes usar el CLI, ejecuta este script en el SQL Editor de Supabase

-- Primero verificar que la función no existe
SELECT
  proname as function_name,
  obj_description(oid, 'pg_proc') as description
FROM pg_proc
WHERE proname = 'create-rental-contract'
  AND pg_function_is_visible(oid);

-- Si existe, eliminarla primero
DROP FUNCTION IF EXISTS create_rental_contract(uuid, jsonb);

-- Crear la función (esto es un placeholder - necesitarías el código completo)
-- NOTA: Este script es solo para referencia. La función debe desplegarse como Edge Function.

-- Para verificar que la Edge Function está desplegada:
SELECT
  name,
  created_at,
  updated_at,
  'Edge Function' as type
FROM edge_functions
WHERE name = 'create-rental-contract';

-- Si no aparece, necesitas desplegarla desde el dashboard o CLI







