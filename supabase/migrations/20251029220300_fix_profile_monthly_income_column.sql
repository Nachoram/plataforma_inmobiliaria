-- Verificar y corregir la columna monthly_income_clp en la tabla profiles
-- Esta migración asegura que la columna existe y es accesible

DO $$
DECLARE
    column_exists BOOLEAN;
    column_type TEXT;
BEGIN
    -- Verificar si la columna monthly_income_clp existe en profiles
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'monthly_income_clp'
        AND table_schema = 'public'
    ) INTO column_exists;

    IF NOT column_exists THEN
        -- Crear la columna si no existe
        ALTER TABLE profiles ADD COLUMN monthly_income_clp bigint DEFAULT 0;
        RAISE NOTICE 'Added column monthly_income_clp to profiles table';
    ELSE
        -- Verificar el tipo de la columna
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'monthly_income_clp'
        AND table_schema = 'public'
        INTO column_type;

        RAISE NOTICE 'Column monthly_income_clp exists with type: %', column_type;

        -- Si el tipo no es bigint, intentar convertirlo
        IF column_type != 'bigint' THEN
            -- Crear una columna temporal
            ALTER TABLE profiles ADD COLUMN monthly_income_clp_temp bigint DEFAULT 0;

            -- Migrar los datos
            EXECUTE 'UPDATE profiles SET monthly_income_clp_temp = COALESCE(monthly_income_clp::bigint, 0)';

            -- Eliminar la columna antigua y renombrar la nueva
            ALTER TABLE profiles DROP COLUMN monthly_income_clp;
            ALTER TABLE profiles RENAME COLUMN monthly_income_clp_temp TO monthly_income_clp;

            RAISE NOTICE 'Converted monthly_income_clp to bigint type';
        END IF;
    END IF;

    -- Verificar que la columna monthly_income_clp tenga un valor por defecto
    ALTER TABLE profiles ALTER COLUMN monthly_income_clp SET DEFAULT 0;

    -- Verificar que la columna no sea nullable si es necesario
    -- ALTER TABLE profiles ALTER COLUMN monthly_income_clp SET NOT NULL; -- Opcional

    RAISE NOTICE 'Column monthly_income_clp verification completed successfully';
END $$;

-- Asegurar que los permisos estén correctos
GRANT SELECT ON profiles TO authenticated;

-- Verificar que las políticas RLS permitan acceso a monthly_income_clp
-- Si hay problemas de RLS, las políticas existentes deberían permitir acceso

-- Agregar comentario a la columna
COMMENT ON COLUMN profiles.monthly_income_clp IS 'Ingreso mensual del perfil en pesos chilenos (CLP)';

-- Verificar que la columna sea accesible en consultas
DO $$
BEGIN
    -- Probar una consulta simple para verificar acceso
    PERFORM COUNT(*) FROM profiles WHERE monthly_income_clp >= 0 LIMIT 1;
    RAISE NOTICE 'Column monthly_income_clp is accessible and working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error accessing monthly_income_clp column: %', SQLERRM;
END $$;












