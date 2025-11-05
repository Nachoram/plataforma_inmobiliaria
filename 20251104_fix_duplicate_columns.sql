-- Corregir columnas duplicadas antes de la migración de datos
-- Fecha: 4 de noviembre de 2025
-- Descripción: Eliminar columna applicant_id incorrecta y mantener application_id correcta

-- ========================================
-- DIAGNOSTICO: Verificar estado actual
-- ========================================

DO $$
DECLARE
    applicants_applicant_id_exists boolean;
    applicants_application_id_exists boolean;
    guarantors_applicant_id_exists boolean;
    guarantors_guarantor_id_exists boolean;
    guarantors_application_id_exists boolean;
BEGIN
    -- Verificar application_applicants
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'applicant_id')
    INTO applicants_applicant_id_exists;

    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'application_id')
    INTO applicants_application_id_exists;

    -- Verificar application_guarantors
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'applicant_id')
    INTO guarantors_applicant_id_exists;

    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'guarantor_id')
    INTO guarantors_guarantor_id_exists;

    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'application_id')
    INTO guarantors_application_id_exists;

    RAISE NOTICE '=== DIAGNÓSTICO DE COLUMNAS DUPLICADAS ===';
    RAISE NOTICE 'application_applicants:';
    RAISE NOTICE '  - applicant_id existe: %', applicants_applicant_id_exists;
    RAISE NOTICE '  - application_id existe: %', applicants_application_id_exists;
    RAISE NOTICE 'application_guarantors:';
    RAISE NOTICE '  - applicant_id existe: %', guarantors_applicant_id_exists;
    RAISE NOTICE '  - guarantor_id existe: %', guarantors_guarantor_id_exists;
    RAISE NOTICE '  - application_id existe: %', guarantors_application_id_exists;
END $$;

-- ========================================
-- CORRECCIÓN: Limpiar políticas RLS que referencian la columna incorrecta
-- ========================================

-- Eliminar políticas RLS problemáticas en application_applicants
DROP POLICY IF EXISTS "Applicants can view their own application applicants" ON application_applicants;
DROP POLICY IF EXISTS "Property owners can view applicants for their properties" ON application_applicants;
DROP POLICY IF EXISTS "Users can insert applicants for their applications" ON application_applicants;
DROP POLICY IF EXISTS "Applicants can update their own application applicants" ON application_applicants;

-- Eliminar políticas RLS problemáticas en application_guarantors
DROP POLICY IF EXISTS "Applicants can view their own application guarantors" ON application_guarantors;
DROP POLICY IF EXISTS "Property owners can view guarantors for their properties" ON application_guarantors;
DROP POLICY IF EXISTS "Users can insert guarantors for their applications" ON application_guarantors;
DROP POLICY IF EXISTS "Applicants can update their own application guarantors" ON application_guarantors;

DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS problemáticas eliminadas';
END $$;

-- ========================================
-- CORRECCIÓN: Eliminar columnas incorrectas
-- ========================================

-- Eliminar applicant_id de application_applicants si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'application_applicants' AND column_name = 'applicant_id') THEN
        ALTER TABLE application_applicants DROP COLUMN IF EXISTS applicant_id CASCADE;
        RAISE NOTICE 'Eliminada columna applicant_id incorrecta de application_applicants';
    ELSE
        RAISE NOTICE 'La columna applicant_id no existe en application_applicants (ya está correcto)';
    END IF;
END $$;

-- Eliminar applicant_id de application_guarantors si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'application_guarantors' AND column_name = 'applicant_id') THEN
        ALTER TABLE application_guarantors DROP COLUMN IF EXISTS applicant_id CASCADE;
        RAISE NOTICE 'Eliminada columna applicant_id incorrecta de application_guarantors';
    ELSE
        RAISE NOTICE 'La columna applicant_id no existe en application_guarantors (ya está correcto)';
    END IF;
END $$;

-- Eliminar guarantor_id de application_guarantors si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'application_guarantors' AND column_name = 'guarantor_id') THEN
        ALTER TABLE application_guarantors DROP COLUMN IF EXISTS guarantor_id CASCADE;
        RAISE NOTICE 'Eliminada columna guarantor_id incorrecta de application_guarantors';
    ELSE
        RAISE NOTICE 'La columna guarantor_id no existe en application_guarantors (ya está correcto)';
    END IF;
END $$;

-- ========================================
-- RECREAR POLÍTICAS RLS CORRECTAS
-- ========================================
-- Nota: Después de ejecutar este script, debes ejecutar el Paso 3 nuevamente
-- para recrear las políticas RLS correctas con application_id

-- ========================================
-- VERIFICACIÓN: Asegurar que application_id existe y es correcta
-- ========================================

DO $$
DECLARE
    applicants_app_id_exists boolean;
    guarantors_app_id_exists boolean;
BEGIN
    -- Verificar que application_id existe en ambas tablas
    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'application_id')
    INTO applicants_app_id_exists;

    SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'application_id')
    INTO guarantors_app_id_exists;

    IF NOT applicants_app_id_exists THEN
        RAISE EXCEPTION 'ERROR: La columna application_id no existe en application_applicants después de la corrección';
    END IF;

    IF NOT guarantors_app_id_exists THEN
        RAISE EXCEPTION 'ERROR: La columna application_id no existe en application_guarantors después de la corrección';
    END IF;

    RAISE NOTICE '=== VERIFICACIÓN COMPLETADA ===';
    RAISE NOTICE 'Columnas corregidas exitosamente:';
    RAISE NOTICE '  - application_applicants.application_id: ✅';
    RAISE NOTICE '  - application_guarantors.application_id: ✅';
    RAISE NOTICE 'Ahora puedes proceder con la migración de datos.';
END $$;
