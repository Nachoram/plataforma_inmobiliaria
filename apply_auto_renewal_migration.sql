-- Script para aplicar la migración de cláusula de renovación automática
-- Ejecutar en SQL Editor de Supabase Dashboard

-- 1. Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rental_contracts'
        AND column_name = 'has_auto_renewal_clause'
    ) THEN
        -- Agregar la columna si no existe
        ALTER TABLE rental_contracts
        ADD COLUMN has_auto_renewal_clause boolean NOT NULL DEFAULT false;

        -- Agregar comentario a la columna
        COMMENT ON COLUMN rental_contracts.has_auto_renewal_clause IS 'Indicates if the contract includes an automatic renewal clause that allows renewal for the same period under the same conditions unless otherwise notified';

        RAISE NOTICE '✅ Columna has_auto_renewal_clause agregada exitosamente a rental_contracts';
    ELSE
        RAISE NOTICE 'ℹ️ La columna has_auto_renewal_clause ya existe en rental_contracts';
    END IF;
END $$;

-- 2. Verificar que la columna existe y mostrar su estructura
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
AND column_name = 'has_auto_renewal_clause';



