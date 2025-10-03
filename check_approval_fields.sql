-- Verificar aplicaciones aprobadas con campos de tracking
SELECT
  a.id as application_id,
  a.status,
  a.approved_by,
  a.approved_at,
  a.applicant_id as created_by,
  a.created_at
FROM applications a
WHERE a.status = 'aprobada'
  AND a.approved_at IS NOT NULL
ORDER BY a.approved_at DESC
LIMIT 5;

-- Estadísticas generales
SELECT
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'aprobada' THEN 1 END) as approved_applications,
  COUNT(CASE WHEN approved_by IS NOT NULL THEN 1 END) as with_approver,
  COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as with_approval_date
FROM applications;

-- Verificar que los campos existen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
  AND column_name IN ('approved_by', 'approved_at', 'applicant_id');
