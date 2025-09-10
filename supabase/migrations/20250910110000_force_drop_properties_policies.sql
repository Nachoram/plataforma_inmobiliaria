-- 🚨 MIGRACIÓN DE EMERGENCIA: Forzar eliminación de todas las políticas RLS en properties
-- Ejecutar esta migración SOLO si las políticas existentes están causando conflictos

-- 1. PRIMERO: Eliminar TODAS las políticas existentes en properties
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== ELIMINANDO TODAS LAS POLÍTICAS EXISTENTES EN PROPERTIES ===';

    FOR policy_record IN
        SELECT policyname FROM pg_policies WHERE tablename = 'properties'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.properties';
        RAISE NOTICE '✓ Eliminada política: %', policy_record.policyname;
    END LOOP;

    RAISE NOTICE '=== TODAS LAS POLÍTICAS ELIMINADAS ===';
END $$;

-- 2. Verificar que se eliminaron correctamente
SELECT 'Políticas restantes en properties:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'properties';

-- 3. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '=== MIGRACIÓN DE LIMPIEZA COMPLETADA ===';
    RAISE NOTICE 'Ahora puedes ejecutar la migración principal sin conflictos';
    RAISE NOTICE 'Ejecuta: supabase/migrations/20250902210000_fix_properties_rls_policies.sql';
END $$;
