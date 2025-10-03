-- Script para verificar que el sistema de tracking de aprobaciones funciona
-- Ejecutar después de aprobar una postulación

-- Verificar las últimas aplicaciones aprobadas con tracking
SELECT
  a.id as application_id,
  a.status,
  a.approved_by,
  a.approved_at,
  a.applicant_id as created_by,
  p.first_name || ' ' || p.paternal_last_name as created_by_name,
  approver.first_name || ' ' || approver.paternal_last_name as approved_by_name,
  a.created_at
FROM applications a
LEFT JOIN profiles p ON a.applicant_id = p.id
LEFT JOIN profiles approver ON a.approved_by = approver.id
WHERE a.status = 'aprobada'
  AND a.approved_at IS NOT NULL
ORDER BY a.approved_at DESC
LIMIT 5;

-- Si no hay aplicaciones aprobadas aún, mostrar todas las aplicaciones para verificar estructura
SELECT
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'aprobada' THEN 1 END) as approved_applications,
  COUNT(CASE WHEN approved_by IS NOT NULL THEN 1 END) as applications_with_approver,
  COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as applications_with_approval_date
FROM applications;

-- Verificar que los campos existen en la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'applications'
  AND column_name IN ('approved_by', 'approved_at', 'applicant_id', 'created_at')
ORDER BY column_name;

-- Ver todas las columnas de la tabla applications para debugging
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;
