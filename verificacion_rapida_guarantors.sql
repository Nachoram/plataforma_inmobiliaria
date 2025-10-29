-- =====================================================
-- VERIFICACIÓN RÁPIDA DE LA TABLA GUARANTORS
-- Ejecutar antes y después de la corrección
-- =====================================================

-- 1. CONTEO GENERAL
SELECT
    'ESTADÍSTICAS GENERALES' as categoria,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as con_full_name,
    COUNT(CASE WHEN contact_email IS NOT NULL THEN 1 END) as con_email,
    COUNT(CASE WHEN guarantor_characteristic_id IS NOT NULL THEN 1 END) as con_id_caracteristico
FROM guarantors

UNION ALL

-- 2. REGISTROS PROBLEMÁTICOS
SELECT
    'REGISTROS PROBLEMÁTICOS' as categoria,
    COUNT(CASE WHEN full_name IS NULL THEN 1 END) as sin_full_name,
    COUNT(CASE WHEN contact_email IS NULL THEN 1 END) as sin_email,
    COUNT(CASE WHEN guarantor_characteristic_id IS NULL THEN 1 END) as sin_id_caracteristico,
    COUNT(CASE WHEN full_name = 'Nombre no especificado' THEN 1 END) as nombre_default
FROM guarantors

UNION ALL

-- 3. CAMPOS DUPLICADOS
SELECT
    'CAMPOS DUPLICADOS' as categoria,
    COUNT(CASE WHEN monthly_income_clp IS NOT NULL AND monthly_income IS NOT NULL THEN 1 END) as ingresos_duplicados,
    COUNT(CASE WHEN monthly_income_clp IS NOT NULL AND monthly_income IS NULL THEN 1 END) as solo_income_clp,
    COUNT(CASE WHEN monthly_income_clp IS NULL AND monthly_income IS NOT NULL THEN 1 END) as solo_income,
    COUNT(CASE WHEN monthly_income_clp IS NULL AND monthly_income IS NULL THEN 1 END) as sin_ingresos
FROM guarantors;

-- 4. ÚLTIMOS 5 REGISTROS PARA REVISAR
SELECT
    'ÚLTIMOS REGISTROS' as info,
    id,
    rut,
    LEFT(full_name, 30) as full_name_preview,
    LEFT(contact_email, 25) as email_preview,
    LEFT(guarantor_characteristic_id, 20) as id_caracteristico_preview,
    created_at::date as fecha_creacion
FROM guarantors
ORDER BY created_at DESC
LIMIT 5;

-- 5. VERIFICACIÓN DE TRIGGERS
SELECT
    'TRIGGERS ACTIVOS' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'guarantors'
ORDER BY trigger_name;
