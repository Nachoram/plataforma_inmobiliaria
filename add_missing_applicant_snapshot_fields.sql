-- Agregar campos faltantes de snapshot del postulante en la tabla applications
-- Estos campos preservan la información del postulante al momento de la postulación

DO $$
BEGIN
  -- Agregar campos de nombre del postulante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'snapshot_applicant_first_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN snapshot_applicant_first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'snapshot_applicant_paternal_last_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN snapshot_applicant_paternal_last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'snapshot_applicant_maternal_last_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN snapshot_applicant_maternal_last_name text;
  END IF;

  -- Agregar campo de RUT del postulante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'snapshot_applicant_rut'
  ) THEN
    ALTER TABLE applications ADD COLUMN snapshot_applicant_rut varchar(12);
  END IF;

  -- Agregar campo de email del postulante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'snapshot_applicant_email'
  ) THEN
    ALTER TABLE applications ADD COLUMN snapshot_applicant_email text;
  END IF;

  -- Agregar campo de teléfono del postulante
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'snapshot_applicant_phone'
  ) THEN
    ALTER TABLE applications ADD COLUMN snapshot_applicant_phone text;
  END IF;
END $$;

-- Agregar comentarios para documentar los nuevos campos
COMMENT ON COLUMN applications.snapshot_applicant_first_name IS 'Nombre del postulante al momento de la postulación (preservado para precisión histórica)';
COMMENT ON COLUMN applications.snapshot_applicant_paternal_last_name IS 'Apellido paterno del postulante al momento de la postulación (preservado para precisión histórica)';
COMMENT ON COLUMN applications.snapshot_applicant_maternal_last_name IS 'Apellido materno del postulante al momento de la postulación (preservado para precisión histórica)';
COMMENT ON COLUMN applications.snapshot_applicant_rut IS 'RUT del postulante al momento de la postulación (preservado para precisión histórica)';
COMMENT ON COLUMN applications.snapshot_applicant_email IS 'Email del postulante al momento de la postulación (preservado para precisión histórica)';
COMMENT ON COLUMN applications.snapshot_applicant_phone IS 'Teléfono del postulante al momento de la postulación (preservado para precisión histórica)';
