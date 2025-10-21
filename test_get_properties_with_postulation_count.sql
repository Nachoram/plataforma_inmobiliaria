-- Script para probar la función get_properties_with_postulation_count
-- Este script debe ejecutarse después de crear la función

-- Ejemplo de uso de la función:
-- SELECT * FROM get_properties_with_postulation_count('some-user-uuid'::uuid);

-- Para probar con datos existentes, primero obtenemos un user_id de la tabla profiles:
SELECT id, email FROM profiles LIMIT 1;

-- Una vez que tengamos un user_id, podemos probar:
-- SELECT * FROM get_properties_with_postulation_count('user-uuid-here'::uuid);

-- Verificar que la función existe:
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as parameters,
    obj_description(oid, 'pg_proc') as description
FROM pg_proc
WHERE proname = 'get_properties_with_postulation_count';
