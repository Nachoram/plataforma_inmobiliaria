-- =====================================================
-- INIT SEED DATABASE - Script maestro para inicializar datos de desarrollo
-- =====================================================
-- Este script ejecuta todos los seeds en el orden correcto
-- Incluye limpieza previa y verificación final

-- =====================================================
-- LIMPIEZA PREVIA (SOLO PARA DESARROLLO)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🧹 Iniciando limpieza de datos existentes...';

    -- Limpiar tablas en orden inverso de dependencias
    -- DELETE FROM documents WHERE uploader_id IN (
    --     '550e8400-e29b-41d4-a716-446655440001'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440002'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440003'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440004'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440005'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440006'::uuid
    -- );

    -- DELETE FROM application_applicants WHERE created_by IN (
    --     '550e8400-e29b-41d4-a716-446655440004'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440005'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440006'::uuid
    -- );

    -- DELETE FROM applications WHERE applicant_id IN (
    --     '550e8400-e29b-41d4-a716-446655440004'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440005'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440006'::uuid
    -- );

    -- DELETE FROM properties WHERE owner_id IN (
    --     '550e8400-e29b-41d4-a716-446655440002'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440003'::uuid
    -- );

    -- DELETE FROM profiles WHERE id IN (
    --     '550e8400-e29b-41d4-a716-446655440001'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440002'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440003'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440004'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440005'::uuid,
    --     '550e8400-e29b-41d4-a716-446655440006'::uuid
    -- );

    RAISE NOTICE '✅ Limpieza completada (comentada por seguridad)';
END $$;

-- =====================================================
-- EJECUCIÓN DE SEEDS EN ORDEN
-- =====================================================

-- 1. USUARIOS (base de todo)
\i supabase/seed/seed_users.sql

-- 2. PROPIEDADES (depende de usuarios propietarios)
\i supabase/seed/seed_properties.sql

-- 3. APLICACIONES (depende de propiedades y usuarios postulantes)
\i supabase/seed/seed_applications.sql

-- 4. POSTULANTES DETALLADOS (depende de aplicaciones)
\i supabase/seed/seed_applicants.sql

-- 5. DOCUMENTOS (depende de postulantes)
\i supabase/seed/seed_documents.sql

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    total_users integer;
    total_properties integer;
    total_applications integer;
    total_applicants integer;
    total_documents integer;
BEGIN
    SELECT COUNT(*) INTO total_users FROM profiles WHERE id LIKE '550e8400-e29b-41d4-a716-44665544%';
    SELECT COUNT(*) INTO total_properties FROM properties WHERE id LIKE '660e8400-e29b-41d4-a716-44665544%';
    SELECT COUNT(*) INTO total_applications FROM applications WHERE id LIKE '770e8400-e29b-41d4-a716-44665544%';
    SELECT COUNT(*) INTO total_applicants FROM application_applicants WHERE id LIKE '880e8400-e29b-41d4-a716-44665544%';
    SELECT COUNT(*) INTO total_documents FROM documents WHERE id LIKE '990e8400-e29b-41d4-a716-44665544%';

    RAISE NOTICE '🎉 Inicialización de base de datos completada exitosamente!';
    RAISE NOTICE '📊 Resumen de datos creados:';
    RAISE NOTICE '   👥 Usuarios: %', total_users;
    RAISE NOTICE '   🏠 Propiedades: %', total_properties;
    RAISE NOTICE '   📋 Aplicaciones: %', total_applications;
    RAISE NOTICE '   👤 Postulantes detallados: %', total_applicants;
    RAISE NOTICE '   📄 Documentos: %', total_documents;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Credenciales de prueba:';
    RAISE NOTICE '   Admin: admin@test.com';
    RAISE NOTICE '   Propietario 1: owner@test.com';
    RAISE NOTICE '   Propietario 2: owner2@test.com (empresa)';
    RAISE NOTICE '   Postulante 1: applicant@test.com';
    RAISE NOTICE '   Postulante 2: applicant2@test.com';
    RAISE NOTICE '   Postulante 3: applicant3@test.com (empresa)';
    RAISE NOTICE '';
    RAISE NOTICE '✨ La base de datos está lista para desarrollo y testing!';
END $$;
