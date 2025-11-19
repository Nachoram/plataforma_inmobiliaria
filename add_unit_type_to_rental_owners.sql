-- =====================================================
-- MIGRACIÓN: Agregar campo unit_type a rental_owners
-- =====================================================
-- Fecha: 2025-11-11
-- Descripción: Agregar selector de tipo de unidad al formulario de propietario
-- =====================================================

-- Agregar columna unit_type a rental_owners
ALTER TABLE rental_owners
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) NOT NULL DEFAULT 'Casa'
CHECK (unit_type IN ('Casa', 'Departamento', 'Oficina'));

-- Agregar comentario descriptivo
COMMENT ON COLUMN rental_owners.unit_type IS 'Tipo de unidad del propietario: Casa, Departamento u Oficina';

-- Crear índice para mejor performance en consultas
CREATE INDEX IF NOT EXISTS idx_rental_owners_unit_type ON rental_owners(unit_type);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columna agregada:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'rental_owners' AND column_name = 'unit_type';
--
-- 2. Verificar constraint CHECK:
-- SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- WHERE conrelid = 'rental_owners'::regclass AND conname LIKE '%unit_type%';
-- =====================================================







