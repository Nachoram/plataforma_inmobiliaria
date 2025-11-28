-- Verificar qué valores permite el enum property_status_enum
SELECT
    n.nspname AS schema_name,
    t.typname AS type_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'property_status_enum'
GROUP BY n.nspname, t.typname;

-- Ver status actual de las propiedades
SELECT DISTINCT status, COUNT(*) as count
FROM properties
GROUP BY status
ORDER BY count DESC;


