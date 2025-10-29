-- Script para corregir el error 'column profiles_1.monthly_income_clp does not exist'
-- Ejecutar este script en Supabase SQL Editor o mediante CLI

-- 1. Verificar estado actual de las columnas en profiles
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Agregar las columnas faltantes si no existen
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monthly_income_clp bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_seniority text,
ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Chilena',
ADD COLUMN IF NOT EXISTS date_of_birth date;

-- 3. Verificar que las columnas se agregaron correctamente
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('monthly_income_clp', 'job_seniority', 'nationality', 'date_of_birth')
ORDER BY column_name;

-- 4. Verificar datos existentes
SELECT
    COUNT(*) as total_profiles,
    COUNT(monthly_income_clp) as with_monthly_income_clp,
    COUNT(job_seniority) as with_job_seniority,
    COUNT(nationality) as with_nationality,
    COUNT(date_of_birth) as with_date_of_birth
FROM profiles;

-- 5. Probar una consulta similar a la que usa PostulationAdminPanel
SELECT
    a.id,
    a.status,
    p.first_name,
    p.email,
    p.monthly_income_clp,
    p.job_seniority
FROM applications a
LEFT JOIN profiles p ON a.applicant_id = p.id
LIMIT 5;

-- 6. Verificar que la función get_portfolio_with_postulations funciona
-- (Esta función podría estar causando conflictos)
SELECT get_portfolio_with_postulations('00000000-0000-0000-0000-000000000000'::uuid);
