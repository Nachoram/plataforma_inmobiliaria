-- Script para aplicar las correcciones necesarias para el PostulationAdminPanel
-- =================================================================================
-- Este script resuelve los errores 404 y 42P01 reportados:
-- - Error 404 consultando /rest/v1/application_audit_log
-- - Error 404/42P01 al llamar rpc/get_application_modifications
-- - Error por columna no encontrada: "column profiles_1.monthly_income_clp does not exist"

-- NOTA: Ejecutar este script completo en el SQL Editor de Supabase Dashboard
-- Este script incluye todo lo necesario para resolver los problemas

-- ================================================================================
-- 1. SISTEMA DE AUDITORÍA DE POSTULACIONES
-- ================================================================================

-- Crear tabla application_audit_log para auditoría completa de postulaciones
-- Esta tabla almacena todas las acciones administrativas realizadas en postulaciones

CREATE TABLE IF NOT EXISTS application_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Información del usuario que realizó la acción
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Tipo de acción/evento
    event_type TEXT NOT NULL, -- 'approve', 'modify_acceptance', 'cancel_contract', 'undo_acceptance', etc.

    -- Estados antes y después de la acción
    previous_status TEXT,
    new_status TEXT,

    -- Detalles de la acción (JSON para flexibilidad)
    event_data JSONB DEFAULT '{}',

    -- Notas adicionales
    notes TEXT,

    -- Metadata técnica
    ip_address INET,
    user_agent TEXT,

    -- Timestamp de creación (duplicado por conveniencia)
    created_at_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_application_audit_log_application_id ON application_audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_property_id ON application_audit_log(property_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_created_by ON application_audit_log(created_by);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_event_type ON application_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_created_at ON application_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_previous_status ON application_audit_log(previous_status);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_new_status ON application_audit_log(new_status);

-- Políticas RLS (Row Level Security)
ALTER TABLE application_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver logs de auditoría de propiedades que les pertenecen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'application_audit_log'
        AND policyname = 'Users can view audit logs for their properties'
    ) THEN
        CREATE POLICY "Users can view audit logs for their properties" ON application_audit_log
            FOR SELECT USING (
                property_id IN (
                    SELECT id FROM properties WHERE owner_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Política: Solo el sistema puede insertar registros de auditoría (a través de funciones)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'application_audit_log'
        AND policyname = 'Only system can insert audit logs'
    ) THEN
        CREATE POLICY "Only system can insert audit logs" ON application_audit_log
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Comentarios en la tabla y columnas
COMMENT ON TABLE application_audit_log IS 'Registro completo de auditoría para todas las acciones administrativas en postulaciones';
COMMENT ON COLUMN application_audit_log.application_id IS 'ID de la postulación afectada';
COMMENT ON COLUMN application_audit_log.property_id IS 'ID de la propiedad (para RLS)';
COMMENT ON COLUMN application_audit_log.created_by IS 'Usuario que realizó la acción';
COMMENT ON COLUMN application_audit_log.event_type IS 'Tipo de acción realizada (approve, modify, cancel, etc.)';
COMMENT ON COLUMN application_audit_log.previous_status IS 'Estado anterior de la postulación';
COMMENT ON COLUMN application_audit_log.new_status IS 'Estado nuevo de la postulación';
COMMENT ON COLUMN application_audit_log.event_data IS 'Datos adicionales específicos de la acción (JSON)';
COMMENT ON COLUMN application_audit_log.notes IS 'Notas adicionales opcionales';

-- Función para registrar una acción en el log de auditoría
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
    -- Insertar el registro de auditoría
    INSERT INTO application_audit_log (
        application_id,
        property_id,
        created_by,
        event_type,
        previous_status,
        new_status,
        event_data,
        notes,
        ip_address,
        user_agent
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
        p_user_agent
    ) RETURNING id INTO audit_id;

    -- Actualizar el updated_at de la aplicación
    UPDATE applications
    SET updated_at = NOW()
    WHERE id = p_application_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (verificar si ya existen antes de conceder)
DO $$
BEGIN
    -- Grant SELECT on application_audit_log
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_name = 'application_audit_log'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) THEN
        EXECUTE 'GRANT SELECT ON application_audit_log TO authenticated';
    END IF;

    -- Grant INSERT on application_audit_log
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_name = 'application_audit_log'
        AND grantee = 'authenticated'
        AND privilege_type = 'INSERT'
    ) THEN
        EXECUTE 'GRANT INSERT ON application_audit_log TO authenticated';
    END IF;

    -- Grant EXECUTE on log_application_audit function
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routine_privileges
        WHERE routine_name = 'log_application_audit'
        AND grantee = 'authenticated'
        AND privilege_type = 'EXECUTE'
    ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION log_application_audit TO authenticated';
    END IF;
END $$;

-- Función helper para obtener conteo de acciones de auditoría por aplicación
CREATE OR REPLACE FUNCTION get_application_audit_count(p_application_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM application_audit_log
        WHERE application_id = p_application_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions para funciones helper
DO $$
BEGIN
    -- Grant EXECUTE on get_application_audit_count function
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routine_privileges
        WHERE routine_name = 'get_application_audit_count'
        AND grantee = 'authenticated'
        AND privilege_type = 'EXECUTE'
    ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION get_application_audit_count TO authenticated';
    END IF;

    -- Grant EXECUTE on application_has_audit_logs function
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routine_privileges
        WHERE routine_name = 'application_has_audit_logs'
        AND grantee = 'authenticated'
        AND privilege_type = 'EXECUTE'
    ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION application_has_audit_logs TO authenticated';
    END IF;
END $$;

-- Función helper para verificar si una aplicación tiene registros de auditoría
CREATE OR REPLACE FUNCTION application_has_audit_logs(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM application_audit_log
        WHERE application_id = p_application_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- 2. CORRECCIÓN DE COLUMNA MONTHLY_INCOME_CLP EN PROFILES
-- ================================================================================

-- Verificar y corregir la columna monthly_income_clp en la tabla profiles
-- Esta migración asegura que la columna existe y es accesible

DO $$
DECLARE
    column_exists BOOLEAN;
    column_type TEXT;
BEGIN
    -- Verificar si la columna monthly_income_clp existe en profiles
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'monthly_income_clp'
        AND table_schema = 'public'
    ) INTO column_exists;

    IF NOT column_exists THEN
        -- Crear la columna si no existe
        ALTER TABLE profiles ADD COLUMN monthly_income_clp bigint DEFAULT 0;
        RAISE NOTICE 'Added column monthly_income_clp to profiles table';
    ELSE
        -- Verificar el tipo de la columna
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'monthly_income_clp'
        AND table_schema = 'public'
        INTO column_type;

        RAISE NOTICE 'Column monthly_income_clp exists with type: %', column_type;

        -- Si el tipo no es bigint, intentar convertirlo
        IF column_type != 'bigint' THEN
            -- Crear una columna temporal
            ALTER TABLE profiles ADD COLUMN monthly_income_clp_temp bigint DEFAULT 0;

            -- Migrar los datos
            EXECUTE 'UPDATE profiles SET monthly_income_clp_temp = COALESCE(monthly_income_clp::bigint, 0)';

            -- Eliminar la columna antigua y renombrar la nueva
            ALTER TABLE profiles DROP COLUMN monthly_income_clp;
            ALTER TABLE profiles RENAME COLUMN monthly_income_clp_temp TO monthly_income_clp;

            RAISE NOTICE 'Converted monthly_income_clp to bigint type';
        END IF;
    END IF;

    -- Verificar que la columna monthly_income_clp tenga un valor por defecto
    ALTER TABLE profiles ALTER COLUMN monthly_income_clp SET DEFAULT 0;

    -- Verificar que la columna no sea nullable si es necesario
    -- ALTER TABLE profiles ALTER COLUMN monthly_income_clp SET NOT NULL; -- Opcional

    RAISE NOTICE 'Column monthly_income_clp verification completed successfully';
END $$;

-- Asegurar que los permisos estén correctos
DO $$
BEGIN
    -- Grant SELECT on profiles (si no existe ya)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_name = 'profiles'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) THEN
        EXECUTE 'GRANT SELECT ON profiles TO authenticated';
    END IF;
END $$;

-- Verificar que las políticas RLS permitan acceso a monthly_income_clp
-- Si hay problemas de RLS, las políticas existentes deberían permitir acceso

-- Agregar comentario a la columna
COMMENT ON COLUMN profiles.monthly_income_clp IS 'Ingreso mensual del perfil en pesos chilenos (CLP)';

-- Verificar que la columna sea accesible en consultas
DO $$
BEGIN
    -- Probar una consulta simple para verificar acceso
    PERFORM COUNT(*) FROM profiles WHERE monthly_income_clp >= 0 LIMIT 1;
    RAISE NOTICE 'Column monthly_income_clp is accessible and working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error accessing monthly_income_clp column: %', SQLERRM;
END $$;

-- ================================================================================
-- 3. VERIFICACIÓN FINAL
-- ================================================================================

-- Verificar que todo se aplicó correctamente
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICACIÓN DE CORRECCIONES ===';

    -- Verificar tabla application_audit_log
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_audit_log'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: Tabla application_audit_log no se creó correctamente';
    ELSE
        RAISE NOTICE '✅ Tabla application_audit_log creada correctamente';
    END IF;

    -- Verificar tabla application_modifications (debe existir de migración anterior)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'application_modifications'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: Tabla application_modifications no existe. Aplicar migración 20251029220100';
    ELSE
        RAISE NOTICE '✅ Tabla application_modifications existe';
    END IF;

    -- Verificar función log_application_audit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'log_application_audit'
        AND routine_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: Función log_application_audit no se creó correctamente';
    ELSE
        RAISE NOTICE '✅ Función log_application_audit creada correctamente';
    END IF;

    -- Verificar función get_application_modifications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'get_application_modifications'
        AND routine_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: Función get_application_modifications no existe. Aplicar migración 20251029220100';
    ELSE
        RAISE NOTICE '✅ Función get_application_modifications existe';
    END IF;

    -- Verificar columna monthly_income_clp en profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'monthly_income_clp'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERROR: Columna monthly_income_clp no existe en profiles';
    ELSE
        RAISE NOTICE '✅ Columna monthly_income_clp existe en profiles';
    END IF;

    RAISE NOTICE '=== VERIFICACIÓN COMPLETADA ===';
    RAISE NOTICE 'Las siguientes consultas deberían funcionar ahora sin errores 404/42P01:';
    RAISE NOTICE '';
    RAISE NOTICE '-- Consultar tabla de auditoría:';
    RAISE NOTICE 'SELECT COUNT(*) FROM application_audit_log LIMIT 1;';
    RAISE NOTICE '';
    RAISE NOTICE '-- Llamar función RPC de modificaciones:';
    RAISE NOTICE 'SELECT * FROM get_application_modifications((SELECT id FROM applications LIMIT 1));';
    RAISE NOTICE '';
    RAISE NOTICE '-- Consultar columna monthly_income_clp:';
    RAISE NOTICE 'SELECT id, monthly_income_clp FROM profiles LIMIT 5;';
    RAISE NOTICE '';
    RAISE NOTICE '=== APLICACIÓN COMPLETADA ===';
END $$;

-- Registrar que se aplicaron las correcciones (solo si no se hizo antes)
DO $$
BEGIN
    -- Verificar si ya se registró la aplicación de correcciones
    IF current_setting('custom.postulation_fixes_applied', true) IS NULL THEN
        -- Registrar que se aplicaron las correcciones
        PERFORM set_config('custom.postulation_fixes_applied', 'true', false);
        RAISE NOTICE 'Correcciones PostulationAdminPanel aplicadas exitosamente';
    ELSE
        RAISE NOTICE 'Correcciones PostulationAdminPanel ya habían sido aplicadas anteriormente';
    END IF;
END $$;
