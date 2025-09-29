-- Script para asegurar que todos los guarantors tengan guarantor_characteristic_id únicos

-- 1. Primero, verificar el estado actual
SELECT 'ESTADO ACTUAL DE GUARANTORS' as info;

SELECT
    COUNT(*) as total_guarantors,
    COUNT(CASE WHEN guarantor_characteristic_id IS NULL THEN 1 END) as sin_id,
    COUNT(CASE WHEN guarantor_characteristic_id IS NOT NULL THEN 1 END) as con_id
FROM guarantors;

-- 2. Verificar duplicados actuales
SELECT 'VERIFICANDO DUPLICADOS' as info;

SELECT
    guarantor_characteristic_id,
    COUNT(*) as cantidad,
    ARRAY_AGG(id ORDER BY created_at) as ids_afectados
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL
GROUP BY guarantor_characteristic_id
HAVING COUNT(*) > 1;

-- 3. Corregir guarantors que no tienen ID (usando el trigger manualmente)
SELECT 'ASIGNANDO IDS A GUARANTORS SIN ID' as info;

UPDATE guarantors
SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE guarantor_characteristic_id IS NULL;

-- 4. Para los duplicados, regenerar IDs únicos para todos menos el primero
SELECT 'CORRIGIENDO DUPLICADOS' as info;

DO $$
DECLARE
    dup_record RECORD;
    new_id TEXT;
BEGIN
    -- Para cada grupo de duplicados
    FOR dup_record IN
        SELECT
            g.id,
            g.guarantor_characteristic_id,
            ROW_NUMBER() OVER (PARTITION BY g.guarantor_characteristic_id ORDER BY g.created_at) as rn
        FROM guarantors g
        WHERE g.guarantor_characteristic_id IN (
            SELECT guarantor_characteristic_id
            FROM guarantors
            GROUP BY guarantor_characteristic_id
            HAVING COUNT(*) > 1
        )
        ORDER BY g.guarantor_characteristic_id, g.created_at
    LOOP
        -- Solo actualizar los que no son el primero (rn > 1)
        IF dup_record.rn > 1 THEN
            -- Generar nuevo ID único
            SELECT 'GUAR_' || LPAD(EXTRACT(EPOCH FROM g.created_at)::text, 10, '0') || '_' || SUBSTRING(g.id::text, 1, 8)
            INTO new_id
            FROM guarantors g
            WHERE g.id = dup_record.id;

            -- Actualizar
            UPDATE guarantors
            SET guarantor_characteristic_id = new_id
            WHERE id = dup_record.id;

            RAISE NOTICE 'Corregido garante %: % -> %', dup_record.id, dup_record.guarantor_characteristic_id, new_id;
        END IF;
    END LOOP;
END $$;

-- 5. Verificación final
SELECT 'VERIFICACIÓN FINAL' as info;

SELECT
    COUNT(*) as total_guarantors,
    COUNT(DISTINCT guarantor_characteristic_id) as ids_unicos,
    CASE
        WHEN COUNT(*) = COUNT(DISTINCT guarantor_characteristic_id) THEN '✓ TODOS LOS IDS SON ÚNICOS'
        ELSE '✗ HAY DUPLICADOS PENDIENTES'
    END as estado
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL;

-- 6. Mostrar los primeros 10 guarantors con sus IDs
SELECT 'MUESTRA DE GUARANTORS' as info;

SELECT
    id,
    rut,
    first_name,
    paternal_last_name,
    guarantor_characteristic_id,
    created_at
FROM guarantors
ORDER BY created_at DESC
LIMIT 10;
