-- Verificar si existe el enum contract_status_enum
SELECT 
    n.nspname as schema,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'contract_status_enum'
ORDER BY e.enumsortorder;

-- Si está vacío, necesitamos crear el enum

