-- Verificar columnas exactas antes de la migración de datos
-- Fecha: 4 de noviembre de 2025

-- Columnas en application_applicants
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'application_applicants'
ORDER BY ordinal_position;

-- Columnas en application_guarantors
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'application_guarantors'
ORDER BY ordinal_position;

-- Verificar si existe columna "applicant_id" (que no debería existir)
DO $$
DECLARE
    applicant_id_exists boolean;
    application_id_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'application_applicants' AND column_name = 'applicant_id'
    ) INTO applicant_id_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'application_applicants' AND column_name = 'application_id'
    ) INTO application_id_exists;

    RAISE NOTICE 'application_applicants columns check:';
    RAISE NOTICE '  - applicant_id exists: %', applicant_id_exists;
    RAISE NOTICE '  - application_id exists: %', application_id_exists;

    IF applicant_id_exists AND application_id_exists THEN
        RAISE EXCEPTION 'ERROR: Ambas columnas applicant_id y application_id existen. Esto causará conflictos.';
    END IF;

    IF NOT application_id_exists THEN
        RAISE EXCEPTION 'ERROR: La columna application_id no existe. La tabla no está correctamente configurada.';
    END IF;
END $$;

