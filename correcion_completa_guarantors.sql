-- =====================================================
-- CORRECCIÓN COMPLETA DE LA TABLA GUARANTORS
-- Fecha: 29 de octubre, 2025
-- =====================================================

-- PASO 1: HACER BACKUP DE DATOS CRÍTICOS ANTES DE MODIFICACIONES
CREATE TEMP TABLE guarantors_backup AS
SELECT * FROM guarantors;

DO $$
DECLARE
    record_count integer;
BEGIN
    SELECT COUNT(*) INTO record_count FROM guarantors_backup;
    RAISE NOTICE 'Backup creado con % registros de guarantors', record_count;
END $$;

-- PASO 2: ELIMINAR TRIGGERS PROBLEMÁTICOS TEMPORALMENTE
DROP TRIGGER IF EXISTS guarantors_updated_at_trigger ON guarantors;
DROP TRIGGER IF EXISTS trigger_generate_guarantor_characteristic_id ON guarantors;

-- PASO 3: CORREGIR CAMPOS DUPLICADOS Y PROBLEMÁTICOS

-- 3.1: Migrar datos de monthly_income_clp a monthly_income si monthly_income está vacío
UPDATE guarantors
SET monthly_income = monthly_income_clp
WHERE monthly_income IS NULL AND monthly_income_clp IS NOT NULL;

-- 3.2: Hacer que full_name sea calculado automáticamente desde first_name, paternal_last_name, maternal_last_name
UPDATE guarantors
SET full_name = TRIM(
    COALESCE(first_name, '') || ' ' ||
    COALESCE(paternal_last_name, '') || ' ' ||
    COALESCE(maternal_last_name, '')
)
WHERE full_name IS NULL OR full_name = '' OR full_name = 'Nombre no especificado';

-- 3.3: Corregir emails por defecto
UPDATE guarantors
SET contact_email = NULL
WHERE contact_email = 'email@no-especificado.com' OR contact_email IS NULL;

-- PASO 4: CREAR FUNCIONES AUXILIARES SI NO EXISTEN

-- 4.1: Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_guarantors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2: Función para generar IDs característicos (corregida)
CREATE OR REPLACE FUNCTION generate_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix text := 'GUAR_';
    timestamp_part text;
    id_part text;
BEGIN
    -- Generar ID solo si no existe
    IF NEW.guarantor_characteristic_id IS NULL THEN
        timestamp_part := LPAD(EXTRACT(EPOCH FROM NOW())::text, 10, '0');
        id_part := SUBSTRING(NEW.id::text, 1, 8);
        NEW.guarantor_characteristic_id := prefix || timestamp_part || '_' || id_part;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.3: Función para calcular full_name automáticamente
CREATE OR REPLACE FUNCTION calculate_guarantor_full_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular full_name desde los componentes si no está establecido
    IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
        NEW.full_name := TRIM(
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.paternal_last_name, '') || ' ' ||
            COALESCE(NEW.maternal_last_name, '')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: MODIFICAR LA ESTRUCTURA DE LA TABLA

-- 5.1: Hacer full_name nullable temporalmente para evitar conflictos
ALTER TABLE guarantors ALTER COLUMN full_name DROP NOT NULL;

-- 5.2: Hacer contact_email nullable temporalmente
ALTER TABLE guarantors ALTER COLUMN contact_email DROP NOT NULL;

-- 5.3: Agregar campos faltantes si no existen
ALTER TABLE guarantors
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS address_id uuid;

-- PASO 6: LIMPIAR DATOS INCONSISTENTES

-- 6.1: Asegurar que todos los registros tengan full_name válido
UPDATE guarantors
SET full_name = TRIM(
    COALESCE(first_name, '') || ' ' ||
    COALESCE(paternal_last_name, '') || ' ' ||
    COALESCE(maternal_last_name, '')
)
WHERE full_name IS NULL OR full_name = '' OR full_name = 'Nombre no especificado';

-- 6.2: Generar IDs característicos faltantes
UPDATE guarantors
SET guarantor_characteristic_id = 'GUAR_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE guarantor_characteristic_id IS NULL;

-- PASO 7: RECREAR CONSTRAINTS CORRECTOS

-- 7.1: Hacer full_name NOT NULL nuevamente (ahora que todos tienen valor)
ALTER TABLE guarantors ALTER COLUMN full_name SET NOT NULL;

-- 7.2: Hacer contact_email NOT NULL con valor por defecto para registros existentes sin email
UPDATE guarantors
SET contact_email = COALESCE(contact_email, 'sin-email@ejemplo.com')
WHERE contact_email IS NULL;

ALTER TABLE guarantors ALTER COLUMN contact_email SET NOT NULL;

-- PASO 8: RECREAR TRIGGERS CORRECTOS

-- 8.1: Trigger para actualizar updated_at
CREATE TRIGGER guarantors_updated_at_trigger
    BEFORE UPDATE ON guarantors
    FOR EACH ROW
    EXECUTE FUNCTION update_guarantors_updated_at();

-- 8.2: Trigger para generar ID característico
CREATE TRIGGER trigger_generate_guarantor_characteristic_id
    BEFORE INSERT ON guarantors
    FOR EACH ROW
    EXECUTE FUNCTION generate_characteristic_id();

-- 8.3: Trigger para calcular full_name automáticamente
CREATE TRIGGER trigger_calculate_guarantor_full_name
    BEFORE INSERT OR UPDATE ON guarantors
    FOR EACH ROW
    EXECUTE FUNCTION calculate_guarantor_full_name();

-- PASO 9: OPTIMIZAR ÍNDICES

-- 9.1: Recrear índices importantes
CREATE INDEX IF NOT EXISTS idx_guarantors_characteristic_id ON guarantors(guarantor_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_guarantors_contact_email ON guarantors(contact_email);
CREATE INDEX IF NOT EXISTS idx_guarantors_rut ON guarantors(rut);
CREATE INDEX IF NOT EXISTS idx_guarantors_created_by ON guarantors(created_by);
CREATE INDEX IF NOT EXISTS idx_guarantors_updated_at ON guarantors(updated_at);

-- PASO 10: VERIFICACIÓN FINAL

-- 10.1: Verificar que no hay datos corruptos
DO $$
DECLARE
    null_full_name_count integer;
    null_email_count integer;
    null_characteristic_count integer;
BEGIN
    SELECT COUNT(*) INTO null_full_name_count FROM guarantors WHERE full_name IS NULL;
    SELECT COUNT(*) INTO null_email_count FROM guarantors WHERE contact_email IS NULL;
    SELECT COUNT(*) INTO null_characteristic_count FROM guarantors WHERE guarantor_characteristic_id IS NULL;

    RAISE NOTICE 'Verificación final:';
    RAISE NOTICE '  - full_name NULL: %', null_full_name_count;
    RAISE NOTICE '  - contact_email NULL: %', null_email_count;
    RAISE NOTICE '  - guarantor_characteristic_id NULL: %', null_characteristic_count;

    IF null_full_name_count = 0 AND null_email_count = 0 AND null_characteristic_count = 0 THEN
        RAISE NOTICE '✅ CORRECCIÓN COMPLETADA EXITOSAMENTE';
    ELSE
        RAISE NOTICE '⚠️  Aún hay problemas pendientes. Revisar datos.';
    END IF;
END $$;

-- PASO 11: LIMPIEZA FINAL
DROP TABLE IF EXISTS guarantors_backup;

-- MOSTRAR RESULTADO FINAL
SELECT
    COUNT(*) as total_guarantors,
    COUNT(CASE WHEN guarantor_characteristic_id IS NOT NULL THEN 1 END) as with_characteristic_id,
    COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as with_full_name,
    COUNT(CASE WHEN contact_email IS NOT NULL THEN 1 END) as with_email
FROM guarantors;
