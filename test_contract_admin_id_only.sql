-- VERIFICAR QUE EL USUARIO EXISTE EN auth.users Y profiles
-- Ejecuta esta consulta para verificar el ID correcto

SELECT
    'VERIFICACIÓN_DE_USUARIO' as tipo_verificacion,
    p.id as profiles_id,
    au.id as auth_users_id,
    p.id = au.id as ids_iguales,
    p.first_name || ' ' || p.paternal_last_name as nombre,
    p.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'ignacioram.mol@gmail.com';

-- Si no aparece resultado, el usuario no existe en auth.users
-- En ese caso, busca todos los usuarios disponibles:
-- SELECT p.id, p.first_name || ' ' || p.paternal_last_name as nombre, p.email FROM profiles p LIMIT 10;
