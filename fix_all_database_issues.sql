-- =====================================================
-- FIX ALL DATABASE ISSUES FOR POSTULATION PANEL
-- =====================================================
-- Ejecutar este archivo completo en Supabase SQL Editor
-- Fecha: October 29, 2025
-- =====================================================

-- 1. AGREGAR COLUMNAS FALTANTES EN PROFILES
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'monthly_income_clp'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN monthly_income_clp bigint DEFAULT 0;
        RAISE NOTICE '✅ Added column monthly_income_clp to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ Column monthly_income_clp already exists in profiles table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'job_seniority'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN job_seniority text;
        RAISE NOTICE '✅ Added column job_seniority to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ Column job_seniority already exists in profiles table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'nationality'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN nationality text DEFAULT 'Chilena';
        RAISE NOTICE '✅ Added column nationality to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ Column nationality already exists in profiles table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN date_of_birth date;
        RAISE NOTICE '✅ Added column date_of_birth to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ Column date_of_birth already exists in profiles table';
    END IF;
END $$;

-- 2. CREAR FUNCIONES RPC FALTANTES
-- =====================================================

-- Función log_application_audit
CREATE OR REPLACE FUNCTION log_application_audit(
    p_application_id UUID,
    p_property_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_previous_status TEXT DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_action_details JSONB DEFAULT '{}',
    p_notes TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO application_audit_log (
        application_id,
        property_id,
        user_id,
        action_type,
        previous_status,
        new_status,
        action_details,
        notes,
        ip_address,
        user_agent,
        created_by
    ) VALUES (
        p_application_id,
        p_property_id,
        p_user_id,
        p_action_type,
        p_previous_status,
        p_new_status,
        p_action_details,
        p_notes,
        p_ip_address,
        p_user_agent,
        p_user_id
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función get_application_modifications
CREATE OR REPLACE FUNCTION get_application_modifications(p_application_id UUID)
RETURNS TABLE (
    id UUID,
    modified_by UUID,
    modified_at TIMESTAMPTZ,
    comments TEXT,
    adjusted_score INTEGER,
    additional_documents TEXT,
    special_conditions TEXT,
    modification_reason TEXT,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        am.id,
        am.modified_by,
        am.modified_at,
        am.comments,
        am.adjusted_score,
        am.additional_documents,
        am.special_conditions,
        am.modification_reason,
        am.version
    FROM application_modifications am
    WHERE am.application_id = p_application_id
    ORDER BY am.version DESC, am.modified_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función log_application_modification
CREATE OR REPLACE FUNCTION log_application_modification(
    p_application_id UUID,
    p_property_id UUID,
    p_modified_by UUID,
    p_comments TEXT,
    p_adjusted_score INTEGER DEFAULT NULL,
    p_additional_documents TEXT DEFAULT NULL,
    p_special_conditions TEXT DEFAULT NULL,
    p_modification_reason TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    modification_id UUID;
    current_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO current_version
    FROM application_modifications
    WHERE application_id = p_application_id;

    INSERT INTO application_modifications (
        application_id,
        property_id,
        modified_by,
        comments,
        adjusted_score,
        additional_documents,
        special_conditions,
        modification_reason,
        ip_address,
        user_agent,
        version
    ) VALUES (
        p_application_id,
        p_property_id,
        p_modified_by,
        p_comments,
        p_adjusted_score,
        p_additional_documents,
        p_special_conditions,
        p_modification_reason,
        p_ip_address,
        p_user_agent,
        current_version
    ) RETURNING id INTO modification_id;

    UPDATE applications
    SET status = 'modificada'::application_status_enum,
        updated_at = NOW()
    WHERE id = p_application_id
    AND status = 'aprobada';

    RETURN modification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. OTORGAR PERMISOS
-- =====================================================

GRANT EXECUTE ON FUNCTION log_application_audit TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_modifications TO authenticated;
GRANT EXECUTE ON FUNCTION log_application_modification TO authenticated;

-- 4. VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas existen
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('monthly_income_clp', 'job_seniority', 'nationality', 'date_of_birth')
ORDER BY column_name;

-- Verificar que las funciones existen
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN ('log_application_audit', 'get_application_modifications', 'log_application_modification')
    AND routine_schema = 'public'
ORDER BY routine_name;

-- Verificar que las tablas existen
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name IN ('application_audit_log', 'application_modifications')
    AND table_schema = 'public'
ORDER BY table_name;

-- 5. MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 CORRECCIONES APLICADAS EXITOSAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE 'Columnas agregadas en profiles:';
    RAISE NOTICE '  - monthly_income_clp';
    RAISE NOTICE '  - job_seniority';
    RAISE NOTICE '  - nationality';
    RAISE NOTICE '  - date_of_birth';
    RAISE NOTICE '';
    RAISE NOTICE 'Funciones RPC creadas:';
    RAISE NOTICE '  - log_application_audit';
    RAISE NOTICE '  - get_application_modifications';
    RAISE NOTICE '  - log_application_modification';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ahora puedes probar el panel de postulaciones sin errores 400/404.';
END $$;
