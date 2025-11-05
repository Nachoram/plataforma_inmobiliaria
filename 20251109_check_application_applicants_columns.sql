SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'application_applicants'
    AND table_schema = 'public'
ORDER BY ordinal_position;
