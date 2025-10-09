-- ============================================================================
-- Script de Verificación: Integración ContractCanvasEditor
-- ============================================================================
-- Este script verifica que la integración del nuevo editor esté funcionando
-- correctamente y muestra contratos de ejemplo.
-- ============================================================================

\echo '🔍 VERIFICACIÓN DE INTEGRACIÓN CONTRACTCANVASEDITOR'
\echo '=================================================='
\echo ''

-- 1. Verificar estructura de la tabla
\echo '1️⃣ Verificando estructura de rental_contracts...'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
AND column_name IN ('id', 'contract_content', 'contract_html', 'contract_format', 'contract_number', 'status')
ORDER BY ordinal_position;

\echo ''
\echo '2️⃣ Estadísticas de contratos por formato...'
SELECT 
    CASE 
        WHEN contract_content ? 'titulo' THEN 'Canvas (Nuevo)'
        WHEN contract_content ? 'sections' THEN 'Sections (Antiguo)'
        WHEN contract_html IS NOT NULL THEN 'HTML Puro'
        ELSE 'Sin formato'
    END as formato_contrato,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rental_contracts), 2) as porcentaje
FROM rental_contracts
GROUP BY formato_contrato
ORDER BY total DESC;

\echo ''
\echo '3️⃣ Contratos con estructura Canvas (listos para editar)...'
SELECT 
    rc.id,
    rc.contract_number,
    rc.status,
    rc.contract_content->>'titulo' as titulo,
    jsonb_array_length(COALESCE(rc.contract_content->'clausulas', '[]'::jsonb)) as num_clausulas,
    jsonb_array_length(COALESCE(rc.contract_content->'firmantes', '[]'::jsonb)) as num_firmantes,
    rc.created_at,
    rc.updated_at
FROM rental_contracts rc
WHERE rc.contract_content ? 'titulo'
ORDER BY rc.created_at DESC
LIMIT 5;

\echo ''
\echo '4️⃣ Verificar permisos RLS para actualización...'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'rental_contracts'
AND cmd = 'UPDATE'
ORDER BY policyname;

\echo ''
\echo '5️⃣ Ejemplo de estructura Canvas de un contrato...'
SELECT 
    id,
    contract_number,
    jsonb_pretty(contract_content) as estructura_canvas
FROM rental_contracts
WHERE contract_content ? 'titulo'
LIMIT 1;

\echo ''
\echo '6️⃣ Verificar URLs del editor para cada contrato...'
SELECT 
    rc.id,
    rc.contract_number,
    rc.status,
    -- URL para ver el contrato
    '/contract/' || rc.id as url_vista,
    -- URL para editar el contrato
    '/contracts/' || rc.id || '/canvas-editor' as url_editor,
    -- Tipo de editor detectado
    CASE 
        WHEN rc.contract_content ? 'titulo' THEN 'canvas'
        WHEN rc.contract_content ? 'sections' THEN 'sections'
        WHEN rc.contract_html IS NOT NULL THEN 'html'
        ELSE 'unknown'
    END as tipo_editor
FROM rental_contracts rc
ORDER BY rc.created_at DESC
LIMIT 10;

\echo ''
\echo '7️⃣ Verificar integridad de datos en contratos Canvas...'
SELECT 
    COUNT(*) as total_canvas,
    COUNT(CASE WHEN contract_content ? 'titulo' THEN 1 END) as con_titulo,
    COUNT(CASE WHEN contract_content ? 'comparecencia' THEN 1 END) as con_comparecencia,
    COUNT(CASE WHEN contract_content ? 'clausulas' THEN 1 END) as con_clausulas,
    COUNT(CASE WHEN contract_content ? 'cierre' THEN 1 END) as con_cierre,
    COUNT(CASE WHEN contract_content ? 'firmantes' THEN 1 END) as con_firmantes
FROM rental_contracts
WHERE contract_content ? 'titulo';

\echo ''
\echo '8️⃣ Últimas actualizaciones de contratos...'
SELECT 
    rc.id,
    rc.contract_number,
    rc.status,
    rc.updated_at,
    rc.version,
    EXTRACT(EPOCH FROM (NOW() - rc.updated_at))/60 as minutos_desde_actualizacion
FROM rental_contracts rc
ORDER BY rc.updated_at DESC
LIMIT 5;

\echo ''
\echo '✅ VERIFICACIÓN COMPLETADA'
\echo ''
\echo '📋 Resumen de Acciones Disponibles:'
\echo '   1. Ver contratos: /contracts'
\echo '   2. Editar contrato: /contracts/{id}/canvas-editor'
\echo '   3. Ver contrato: /contract/{id}'
\echo ''
\echo '🔧 Para probar la integración:'
\echo '   1. Navega a /contracts en tu aplicación'
\echo '   2. Click en "Editar Contrato" en cualquier tarjeta'
\echo '   3. Edita el contenido del contrato'
\echo '   4. Click en "Guardar Cambios"'
\echo '   5. Verifica que contract_content se actualizó'
\echo ''
\echo '💡 Tip: Usa el siguiente query para ver cambios en tiempo real:'
\echo '   SELECT id, contract_number, updated_at FROM rental_contracts ORDER BY updated_at DESC LIMIT 5;'
\echo ''

