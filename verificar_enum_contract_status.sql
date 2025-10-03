-- Verificar los valores del enum contract_status_enum
SELECT 
  enumlabel as valor_permitido
FROM pg_enum
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'contract_status_enum'
)
ORDER BY enumsortorder;

