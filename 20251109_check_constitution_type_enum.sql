-- Ver los valores válidos del enum constitution_type_enum
SELECT
    enumtypid,
    enumlabel
FROM pg_enum
WHERE enumtypid = (
    SELECT oid
    FROM pg_type
    WHERE typname = 'constitution_type_enum'
)
ORDER BY enumsortorder;
