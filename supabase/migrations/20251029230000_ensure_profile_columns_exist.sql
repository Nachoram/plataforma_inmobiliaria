-- Asegurar que las columnas necesarias existan en la tabla profiles
-- Esta migración corrige el error 'column profiles_1.monthly_income_clp does not exist'

BEGIN;

-- Agregar columna monthly_income_clp si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'monthly_income_clp'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN monthly_income_clp bigint DEFAULT 0;
        RAISE NOTICE 'Added column monthly_income_clp to profiles table';
    ELSE
        RAISE NOTICE 'Column monthly_income_clp already exists in profiles table';
    END IF;
END $$;

-- Agregar columna job_seniority si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'job_seniority'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN job_seniority text;
        RAISE NOTICE 'Added column job_seniority to profiles table';
    ELSE
        RAISE NOTICE 'Column job_seniority already exists in profiles table';
    END IF;
END $$;

-- Agregar columna nationality si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'nationality'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN nationality text DEFAULT 'Chilena';
        RAISE NOTICE 'Added column nationality to profiles table';
    ELSE
        RAISE NOTICE 'Column nationality already exists in profiles table';
    END IF;
END $$;

-- Agregar columna date_of_birth si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN date_of_birth date;
        RAISE NOTICE 'Added column date_of_birth to profiles table';
    ELSE
        RAISE NOTICE 'Column date_of_birth already exists in profiles table';
    END IF;
END $$;

COMMIT;

-- Verificar que las columnas existan
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('monthly_income_clp', 'job_seniority', 'nationality', 'date_of_birth')
ORDER BY column_name;
