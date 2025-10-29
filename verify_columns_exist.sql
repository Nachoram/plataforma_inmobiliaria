-- Verificar que las columnas de ingreso mensual existen en las tablas correctas
-- Esto nos ayudará a diagnosticar el error 'column profiles_1.monthly_income_clp does not exist'

-- Verificar columnas en tabla profiles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('monthly_income_clp', 'monthly_income', 'job_seniority')
ORDER BY column_name;

-- Verificar columnas en tabla guarantors
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'guarantors'
    AND column_name IN ('monthly_income_clp', 'monthly_income', 'contact_email', 'contact_phone')
ORDER BY column_name;

-- Verificar si hay datos en profiles
SELECT
    COUNT(*) as total_profiles,
    COUNT(monthly_income_clp) as profiles_with_income_clp,
    COUNT(job_seniority) as profiles_with_job_seniority
FROM profiles;

-- Verificar si hay datos en guarantors
SELECT
    COUNT(*) as total_guarantors,
    COUNT(monthly_income) as guarantors_with_income,
    COUNT(contact_email) as guarantors_with_email,
    COUNT(contact_phone) as guarantors_with_phone
FROM guarantors;
