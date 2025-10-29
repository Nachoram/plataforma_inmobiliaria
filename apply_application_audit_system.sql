-- Script para aplicar el sistema de auditoría de postulaciones
-- =================================================================

-- Ejecutar el script principal de auditoría
\i create_application_audit_system.sql

-- Verificar que se creó correctamente
SELECT
    'Tabla application_audit_log creada' as status,
    COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_name = 'application_audit_log'
    AND table_schema = 'public';

-- Verificar funciones
SELECT
    'Función log_application_audit existe' as status,
    COUNT(*) as functions_created
FROM information_schema.routines
WHERE routine_name = 'log_application_audit'
    AND routine_schema = 'public';

-- Verificar permisos
SELECT
    'Permisos aplicados correctamente' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.table_privileges
    WHERE table_name = 'application_audit_log'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
);

-- Ejemplo de consulta para ver logs de auditoría
-- SELECT * FROM application_audit_log
-- WHERE application_id = 'your-application-uuid'
-- ORDER BY created_at DESC;

COMMENT ON DATABASE CURRENT_DATABASE IS 'Sistema de auditoría de postulaciones aplicado - ' || NOW();
