-- Script para corregir problemas con guarantor_characteristic_id duplicados
-- Este script identifica y corrige guarantors que tienen characteristic_ids duplicados

-- 1. Identificar guarantors con characteristic_ids duplicados
SELECT
    guarantor_characteristic_id,
    COUNT(*) as count,
    ARRAY_AGG(id ORDER BY created_at) as guarantor_ids,
    ARRAY_AGG(rut ORDER BY created_at) as ruts,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL
GROUP BY guarantor_characteristic_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Para guarantors con IDs duplicados, actualizar todos menos el más antiguo
-- para que tengan IDs únicos basados en su propio created_at e id
DO $$
DECLARE
    duplicate_record RECORD;
    new_characteristic_id TEXT;
BEGIN
    -- Iterar sobre cada grupo de guarantors duplicados
    FOR duplicate_record IN
        SELECT
            g.id,
            g.guarantor_characteristic_id,
            g.created_at,
            ROW_NUMBER() OVER (PARTITION BY g.guarantor_characteristic_id ORDER BY g.created_at) as rn
        FROM guarantors g
        WHERE g.guarantor_characteristic_id IS NOT NULL
        AND g.guarantor_characteristic_id IN (
            SELECT guarantor_characteristic_id
            FROM guarantors
            WHERE guarantor_characteristic_id IS NOT NULL
            GROUP BY guarantor_characteristic_id
            HAVING COUNT(*) > 1
        )
        ORDER BY g.guarantor_characteristic_id, g.created_at
    LOOP
        -- Solo actualizar los registros que no son el primero (rn > 1)
        IF duplicate_record.rn > 1 THEN
            -- Generar nuevo ID único
            new_characteristic_id := 'GUAR_' || LPAD(EXTRACT(EPOCH FROM duplicate_record.created_at)::text, 10, '0') || '_' || SUBSTRING(duplicate_record.id::text, 1, 8);

            -- Actualizar el registro
            UPDATE guarantors
            SET guarantor_characteristic_id = new_characteristic_id
            WHERE id = duplicate_record.id;

            RAISE NOTICE 'Updated guarantor %: % -> %', duplicate_record.id, duplicate_record.guarantor_characteristic_id, new_characteristic_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Duplicate guarantor_characteristic_id fix completed';
END $$;

-- 3. Verificar que ya no hay duplicados
SELECT
    guarantor_characteristic_id,
    COUNT(*) as count
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL
GROUP BY guarantor_characteristic_id
HAVING COUNT(*) > 1;

-- 4. Verificar que todos los guarantors tienen characteristic_id
SELECT
    COUNT(*) as total_guarantors,
    COUNT(CASE WHEN guarantor_characteristic_id IS NOT NULL THEN 1 END) as with_characteristic_id,
    COUNT(CASE WHEN guarantor_characteristic_id IS NULL THEN 1 END) as without_characteristic_id
FROM guarantors;

-- 5. Para los guarantors que aún no tienen characteristic_id, asignar uno
UPDATE guarantors
SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE guarantor_characteristic_id IS NULL;

-- 6. Verificación final
SELECT
    'Final verification: All guarantors have unique characteristic_ids' as status,
    COUNT(DISTINCT guarantor_characteristic_id) as unique_ids,
    COUNT(*) as total_guarantors,
    CASE WHEN COUNT(DISTINCT guarantor_characteristic_id) = COUNT(*) THEN '✓ SUCCESS' ELSE '✗ FAILED' END as result
FROM guarantors
WHERE guarantor_characteristic_id IS NOT NULL;
