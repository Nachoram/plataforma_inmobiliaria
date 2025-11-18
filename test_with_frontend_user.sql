-- TEST: Probar la función con el usuario del frontend
-- Reemplaza el USER_ID_PLACEHOLDER con el ID que aparece en los logs del navegador

-- PASO 1: Copia el ID del usuario desde la consola del navegador
-- Busca en los logs del frontend: "👤 Usuario actual: [ID_AQUI]"
-- Reemplaza el valor abajo:

DO $$
DECLARE
    frontend_user_id UUID := 'USER_ID_PLACEHOLDER'; -- ← PEGA EL ID DEL USUARIO AQUI
    application_id UUID := 'd7c5dde9-cf2d-432d-8c8c-7dd15603d868';
    contract_result UUID;
BEGIN
    RAISE NOTICE '🔍 Verificando usuario del frontend: %', frontend_user_id;

    -- Verificar si el usuario existe en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = frontend_user_id) THEN
        RAISE EXCEPTION '❌ El usuario % no existe en auth.users. Este es el problema.', frontend_user_id;
    END IF;

    RAISE NOTICE '✅ Usuario existe en auth.users';

    -- Verificar si existe perfil
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = frontend_user_id) THEN
        RAISE EXCEPTION '❌ El usuario % no tiene perfil en profiles.', frontend_user_id;
    END IF;

    RAISE NOTICE '✅ Usuario tiene perfil';

    -- Intentar crear el contrato
    RAISE NOTICE '🏗️ Creando contrato...';
    SELECT create_rental_contract_on_approval(application_id, frontend_user_id) INTO contract_result;

    RAISE NOTICE '✅ Contrato creado exitosamente: %', contract_result;

END $$;

-- Si el script falla con "usuario no existe en auth.users",
-- entonces ese es el problema del frontend.

-- SOLUCIÓN: El frontend debe usar un usuario que exista en auth.users
-- Para testear, usa uno de estos usuarios válidos:

SELECT
    'USUARIOS_VALIDOS' as tipo,
    p.id as user_id_para_frontend,
    p.first_name || ' ' || p.paternal_last_name as nombre,
    p.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 3;






