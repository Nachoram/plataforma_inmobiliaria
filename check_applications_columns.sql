-- Check if structured_applicant_id and structured_guarantor_id columns exist in applications table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'applications'
  AND table_schema = 'public'
  AND column_name IN ('structured_applicant_id', 'structured_guarantor_id', 'applicant_id', 'guarantor_id')
ORDER BY column_name;
