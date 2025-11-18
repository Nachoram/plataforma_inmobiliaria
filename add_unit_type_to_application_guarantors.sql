-- =====================================================
-- MIGRACIÓN: Agregar campo unit_type a application_guarantors
-- =====================================================
-- Fecha: 2025-11-11
-- Descripción: Agregar selector de tipo de unidad al formulario de aval
-- =====================================================

-- Agregar columna unit_type a application_guarantors
ALTER TABLE application_guarantors
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) NOT NULL DEFAULT 'Casa'
CHECK (unit_type IN ('Casa', 'Departamento', 'Oficina'));

-- Agregar comentario descriptivo
COMMENT ON COLUMN application_guarantors.unit_type IS 'Tipo de unidad del aval: Casa, Departamento u Oficina';

-- Crear índice para mejor performance en consultas
CREATE INDEX IF NOT EXISTS idx_application_guarantors_unit_type ON application_guarantors(unit_type);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar columna agregada:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'application_guarantors' AND column_name = 'unit_type';
--
-- 2. Verificar constraint CHECK:
-- SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- WHERE conrelid = 'application_guarantors'::regclass AND conname LIKE '%unit_type%';
-- =====================================================





