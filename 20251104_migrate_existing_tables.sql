-- Migración de tablas existentes para agregar columnas faltantes
-- Fecha: 4 de noviembre de 2025
-- PRE-REQUISITO: Ejecutar 20251104_investigate_tables.sql para diagnosticar

DO $$
DECLARE
    missing_columns_applicants text[];
    missing_columns_guarantors text[];
BEGIN
    -- Definir las columnas que deberían existir en application_applicants
    -- (según la definición completa del paso 2)
    missing_columns_applicants := ARRAY[
        'entity_type', 'first_name', 'paternal_last_name', 'maternal_last_name',
        'rut', 'profession', 'monthly_income_clp', 'age', 'nationality',
        'marital_status', 'address_street', 'address_number', 'address_department',
        'address_commune', 'address_region', 'phone', 'email', 'company_name',
        'company_rut', 'legal_representative_name', 'legal_representative_rut',
        'constitution_type', 'constitution_date', 'constitution_cve',
        'constitution_notary', 'created_at', 'updated_at', 'created_by'
    ];

    -- Definir las columnas que deberían existir en application_guarantors
    missing_columns_guarantors := ARRAY[
        'entity_type', 'first_name', 'paternal_last_name', 'maternal_last_name',
        'full_name', 'rut', 'profession', 'monthly_income', 'contact_email',
        'contact_phone', 'address_street', 'address_number', 'address_department',
        'address_commune', 'address_region', 'company_name', 'company_rut',
        'legal_representative_name', 'legal_representative_rut', 'constitution_type',
        'constitution_date', 'constitution_cve', 'constitution_notary',
        'created_at', 'updated_at', 'created_by'
    ];

    RAISE NOTICE 'Iniciando migración de tablas existentes...';
    RAISE NOTICE 'application_applicants tiene % registros', (SELECT COUNT(*) FROM application_applicants);
    RAISE NOTICE 'application_guarantors tiene % registros', (SELECT COUNT(*) FROM application_guarantors);
END $$;

-- ========================================
-- MIGRACIÓN DE application_applicants
-- ========================================

-- Agregar columnas faltantes una por una para evitar errores
DO $$
BEGIN
    -- Verificar y agregar cada columna faltante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'application_id') THEN
        ALTER TABLE application_applicants ADD COLUMN application_id uuid;
        RAISE NOTICE 'Agregada columna application_id a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'entity_type') THEN
        ALTER TABLE application_applicants ADD COLUMN entity_type entity_type_enum NOT NULL DEFAULT 'natural';
        RAISE NOTICE 'Agregada columna entity_type a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'first_name') THEN
        ALTER TABLE application_applicants ADD COLUMN first_name text;
        RAISE NOTICE 'Agregada columna first_name a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'paternal_last_name') THEN
        ALTER TABLE application_applicants ADD COLUMN paternal_last_name text;
        RAISE NOTICE 'Agregada columna paternal_last_name a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'maternal_last_name') THEN
        ALTER TABLE application_applicants ADD COLUMN maternal_last_name text;
        RAISE NOTICE 'Agregada columna maternal_last_name a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'rut') THEN
        ALTER TABLE application_applicants ADD COLUMN rut varchar(12);
        RAISE NOTICE 'Agregada columna rut a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'profession') THEN
        ALTER TABLE application_applicants ADD COLUMN profession text;
        RAISE NOTICE 'Agregada columna profession a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'monthly_income_clp') THEN
        ALTER TABLE application_applicants ADD COLUMN monthly_income_clp bigint;
        RAISE NOTICE 'Agregada columna monthly_income_clp a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'age') THEN
        ALTER TABLE application_applicants ADD COLUMN age integer;
        RAISE NOTICE 'Agregada columna age a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'nationality') THEN
        ALTER TABLE application_applicants ADD COLUMN nationality text DEFAULT 'Chilena';
        RAISE NOTICE 'Agregada columna nationality a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'marital_status') THEN
        ALTER TABLE application_applicants ADD COLUMN marital_status marital_status_enum;
        RAISE NOTICE 'Agregada columna marital_status a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'address_street') THEN
        ALTER TABLE application_applicants ADD COLUMN address_street text;
        RAISE NOTICE 'Agregada columna address_street a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'address_number') THEN
        ALTER TABLE application_applicants ADD COLUMN address_number varchar(10);
        RAISE NOTICE 'Agregada columna address_number a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'address_department') THEN
        ALTER TABLE application_applicants ADD COLUMN address_department varchar(10);
        RAISE NOTICE 'Agregada columna address_department a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'address_commune') THEN
        ALTER TABLE application_applicants ADD COLUMN address_commune text;
        RAISE NOTICE 'Agregada columna address_commune a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'address_region') THEN
        ALTER TABLE application_applicants ADD COLUMN address_region text;
        RAISE NOTICE 'Agregada columna address_region a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'phone') THEN
        ALTER TABLE application_applicants ADD COLUMN phone varchar(20);
        RAISE NOTICE 'Agregada columna phone a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'email') THEN
        ALTER TABLE application_applicants ADD COLUMN email text;
        RAISE NOTICE 'Agregada columna email a application_applicants';
    END IF;

    -- Columnas específicas para personas jurídicas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'company_name') THEN
        ALTER TABLE application_applicants ADD COLUMN company_name text;
        RAISE NOTICE 'Agregada columna company_name a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'company_rut') THEN
        ALTER TABLE application_applicants ADD COLUMN company_rut varchar(12);
        RAISE NOTICE 'Agregada columna company_rut a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'legal_representative_name') THEN
        ALTER TABLE application_applicants ADD COLUMN legal_representative_name text;
        RAISE NOTICE 'Agregada columna legal_representative_name a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'legal_representative_rut') THEN
        ALTER TABLE application_applicants ADD COLUMN legal_representative_rut varchar(12);
        RAISE NOTICE 'Agregada columna legal_representative_rut a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'constitution_type') THEN
        ALTER TABLE application_applicants ADD COLUMN constitution_type constitution_type_enum;
        RAISE NOTICE 'Agregada columna constitution_type a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'constitution_date') THEN
        ALTER TABLE application_applicants ADD COLUMN constitution_date date;
        RAISE NOTICE 'Agregada columna constitution_date a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'constitution_cve') THEN
        ALTER TABLE application_applicants ADD COLUMN constitution_cve varchar(50);
        RAISE NOTICE 'Agregada columna constitution_cve a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'constitution_notary') THEN
        ALTER TABLE application_applicants ADD COLUMN constitution_notary text;
        RAISE NOTICE 'Agregada columna constitution_notary a application_applicants';
    END IF;

    -- Columnas de control
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'created_at') THEN
        ALTER TABLE application_applicants ADD COLUMN created_at timestamptz DEFAULT now();
        RAISE NOTICE 'Agregada columna created_at a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'updated_at') THEN
        ALTER TABLE application_applicants ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Agregada columna updated_at a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_applicants' AND column_name = 'created_by') THEN
        ALTER TABLE application_applicants ADD COLUMN created_by uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Agregada columna created_by a application_applicants';
    END IF;

    RAISE NOTICE 'Migración de application_applicants completada';
END $$;

-- ========================================
-- MIGRACIÓN DE application_guarantors
-- ========================================

DO $$
BEGIN
    -- Verificar y agregar cada columna faltante
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'application_id') THEN
        ALTER TABLE application_guarantors ADD COLUMN application_id uuid;
        RAISE NOTICE 'Agregada columna application_id a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'entity_type') THEN
        ALTER TABLE application_guarantors ADD COLUMN entity_type entity_type_enum NOT NULL DEFAULT 'natural';
        RAISE NOTICE 'Agregada columna entity_type a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'first_name') THEN
        ALTER TABLE application_guarantors ADD COLUMN first_name text;
        RAISE NOTICE 'Agregada columna first_name a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'paternal_last_name') THEN
        ALTER TABLE application_guarantors ADD COLUMN paternal_last_name text;
        RAISE NOTICE 'Agregada columna paternal_last_name a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'maternal_last_name') THEN
        ALTER TABLE application_guarantors ADD COLUMN maternal_last_name text;
        RAISE NOTICE 'Agregada columna maternal_last_name a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'full_name') THEN
        ALTER TABLE application_guarantors ADD COLUMN full_name text;
        RAISE NOTICE 'Agregada columna full_name a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'rut') THEN
        ALTER TABLE application_guarantors ADD COLUMN rut varchar(12);
        RAISE NOTICE 'Agregada columna rut a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'profession') THEN
        ALTER TABLE application_guarantors ADD COLUMN profession text;
        RAISE NOTICE 'Agregada columna profession a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'monthly_income') THEN
        ALTER TABLE application_guarantors ADD COLUMN monthly_income bigint;
        RAISE NOTICE 'Agregada columna monthly_income a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'contact_email') THEN
        ALTER TABLE application_guarantors ADD COLUMN contact_email text;
        RAISE NOTICE 'Agregada columna contact_email a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'contact_phone') THEN
        ALTER TABLE application_guarantors ADD COLUMN contact_phone varchar(20);
        RAISE NOTICE 'Agregada columna contact_phone a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'address_street') THEN
        ALTER TABLE application_guarantors ADD COLUMN address_street text;
        RAISE NOTICE 'Agregada columna address_street a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'address_number') THEN
        ALTER TABLE application_guarantors ADD COLUMN address_number varchar(10);
        RAISE NOTICE 'Agregada columna address_number a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'address_department') THEN
        ALTER TABLE application_guarantors ADD COLUMN address_department varchar(10);
        RAISE NOTICE 'Agregada columna address_department a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'address_commune') THEN
        ALTER TABLE application_guarantors ADD COLUMN address_commune text;
        RAISE NOTICE 'Agregada columna address_commune a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'address_region') THEN
        ALTER TABLE application_guarantors ADD COLUMN address_region text;
        RAISE NOTICE 'Agregada columna address_region a application_guarantors';
    END IF;

    -- Columnas específicas para personas jurídicas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'company_name') THEN
        ALTER TABLE application_guarantors ADD COLUMN company_name text;
        RAISE NOTICE 'Agregada columna company_name a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'company_rut') THEN
        ALTER TABLE application_guarantors ADD COLUMN company_rut varchar(12);
        RAISE NOTICE 'Agregada columna company_rut a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'legal_representative_name') THEN
        ALTER TABLE application_guarantors ADD COLUMN legal_representative_name text;
        RAISE NOTICE 'Agregada columna legal_representative_name a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'legal_representative_rut') THEN
        ALTER TABLE application_guarantors ADD COLUMN legal_representative_rut varchar(12);
        RAISE NOTICE 'Agregada columna legal_representative_rut a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'constitution_type') THEN
        ALTER TABLE application_guarantors ADD COLUMN constitution_type constitution_type_enum;
        RAISE NOTICE 'Agregada columna constitution_type a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'constitution_date') THEN
        ALTER TABLE application_guarantors ADD COLUMN constitution_date date;
        RAISE NOTICE 'Agregada columna constitution_date a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'constitution_cve') THEN
        ALTER TABLE application_guarantors ADD COLUMN constitution_cve varchar(50);
        RAISE NOTICE 'Agregada columna constitution_cve a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'constitution_notary') THEN
        ALTER TABLE application_guarantors ADD COLUMN constitution_notary text;
        RAISE NOTICE 'Agregada columna constitution_notary a application_guarantors';
    END IF;

    -- Columnas de control
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'created_at') THEN
        ALTER TABLE application_guarantors ADD COLUMN created_at timestamptz DEFAULT now();
        RAISE NOTICE 'Agregada columna created_at a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'updated_at') THEN
        ALTER TABLE application_guarantors ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Agregada columna updated_at a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'application_guarantors' AND column_name = 'created_by') THEN
        ALTER TABLE application_guarantors ADD COLUMN created_by uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Agregada columna created_by a application_guarantors';
    END IF;

    RAISE NOTICE 'Migración de application_guarantors completada';
END $$;

-- ========================================
-- AGREGAR CONSTRAINTS FALTANTES
-- ========================================

DO $$
BEGIN
    -- Agregar constraints que faltan en application_applicants
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'application_applicants'
                   AND constraint_name = 'valid_age') THEN
        ALTER TABLE application_applicants ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 18 AND age <= 120));
        RAISE NOTICE 'Agregado constraint valid_age a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'application_applicants'
                   AND constraint_name = 'valid_income') THEN
        ALTER TABLE application_applicants ADD CONSTRAINT valid_income CHECK (monthly_income_clp IS NULL OR monthly_income_clp >= 0);
        RAISE NOTICE 'Agregado constraint valid_income a application_applicants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'application_applicants'
                   AND constraint_name = 'unique_rut_per_application') THEN
        ALTER TABLE application_applicants ADD CONSTRAINT unique_rut_per_application UNIQUE (application_id, rut);
        RAISE NOTICE 'Agregado constraint unique_rut_per_application a application_applicants';
    END IF;

    -- Agregar constraints que faltan en application_guarantors
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'application_guarantors'
                   AND constraint_name = 'valid_guarantor_income') THEN
        ALTER TABLE application_guarantors ADD CONSTRAINT valid_guarantor_income CHECK (monthly_income IS NULL OR monthly_income >= 0);
        RAISE NOTICE 'Agregado constraint valid_guarantor_income a application_guarantors';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'application_guarantors'
                   AND constraint_name = 'unique_guarantor_rut_per_application') THEN
        ALTER TABLE application_guarantors ADD CONSTRAINT unique_guarantor_rut_per_application UNIQUE (application_id, rut);
        RAISE NOTICE 'Agregado constraint unique_guarantor_rut_per_application a application_guarantors';
    END IF;

    RAISE NOTICE 'Constraints agregados exitosamente';
END $$;

-- ========================================
-- AGREGAR FOREIGN KEYS FALTANTES
-- ========================================

DO $$
BEGIN
    -- Verificar si ya existe la foreign key para application_id en application_applicants
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints tc
                   JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                   WHERE tc.table_name = 'application_applicants'
                   AND tc.constraint_type = 'FOREIGN KEY'
                   AND kcu.column_name = 'application_id') THEN
        ALTER TABLE application_applicants ADD CONSTRAINT application_applicants_application_id_fkey
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
        RAISE NOTICE 'Agregada foreign key application_id a application_applicants';
    END IF;

    -- Verificar si ya existe la foreign key para application_id en application_guarantors
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints tc
                   JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                   WHERE tc.table_name = 'application_guarantors'
                   AND tc.constraint_type = 'FOREIGN KEY'
                   AND kcu.column_name = 'application_id') THEN
        ALTER TABLE application_guarantors ADD CONSTRAINT application_guarantors_application_id_fkey
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
        RAISE NOTICE 'Agregada foreign key application_id a application_guarantors';
    END IF;

    RAISE NOTICE 'Foreign keys verificadas/agregadas exitosamente';
END $$;

-- ========================================
-- HACER COLUMNAS NOT NULL (DESPUÉS DE AGREGARLAS)
-- ========================================

DO $$
BEGIN
    -- Hacer NOT NULL las columnas que deben serlo en application_applicants
    BEGIN
        ALTER TABLE application_applicants ALTER COLUMN rut SET NOT NULL;
        RAISE NOTICE 'Columna rut en application_applicants ahora es NOT NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'No se pudo hacer rut NOT NULL en application_applicants (posiblemente ya lo es)';
    END;

    BEGIN
        ALTER TABLE application_applicants ALTER COLUMN created_at SET NOT NULL;
        RAISE NOTICE 'Columna created_at en application_applicants ahora es NOT NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'No se pudo hacer created_at NOT NULL en application_applicants (posiblemente ya lo es)';
    END;

    BEGIN
        ALTER TABLE application_applicants ALTER COLUMN updated_at SET NOT NULL;
        RAISE NOTICE 'Columna updated_at en application_applicants ahora es NOT NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'No se pudo hacer updated_at NOT NULL en application_applicants (posiblemente ya lo es)';
    END;

    -- Hacer NOT NULL las columnas que deben serlo en application_guarantors
    BEGIN
        ALTER TABLE application_guarantors ALTER COLUMN rut SET NOT NULL;
        RAISE NOTICE 'Columna rut en application_guarantors ahora es NOT NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'No se pudo hacer rut NOT NULL en application_guarantors (posiblemente ya lo es)';
    END;

    BEGIN
        ALTER TABLE application_guarantors ALTER COLUMN created_at SET NOT NULL;
        RAISE NOTICE 'Columna created_at en application_guarantors ahora es NOT NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'No se pudo hacer created_at NOT NULL en application_guarantors (posiblemente ya lo es)';
    END;

    BEGIN
        ALTER TABLE application_guarantors ALTER COLUMN updated_at SET NOT NULL;
        RAISE NOTICE 'Columna updated_at en application_guarantors ahora es NOT NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'No se pudo hacer updated_at NOT NULL en application_guarantors (posiblemente ya lo es)';
    END;

    RAISE NOTICE 'Constraints NOT NULL aplicadas exitosamente';
END $$;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

DO $$
DECLARE
    applicants_columns_count integer;
    guarantors_columns_count integer;
BEGIN
    SELECT COUNT(*) INTO applicants_columns_count
    FROM information_schema.columns
    WHERE table_name = 'application_applicants';

    SELECT COUNT(*) INTO guarantors_columns_count
    FROM information_schema.columns
    WHERE table_name = 'application_guarantors';

    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
    RAISE NOTICE 'application_applicants ahora tiene % columnas', applicants_columns_count;
    RAISE NOTICE 'application_guarantors ahora tiene % columnas', guarantors_columns_count;
    RAISE NOTICE 'Datos preservados: % registros en applicants, % registros en guarantors',
        (SELECT COUNT(*) FROM application_applicants),
        (SELECT COUNT(*) FROM application_guarantors);
    RAISE NOTICE '';
    RAISE NOTICE 'Ahora puedes ejecutar el Paso 3 (RLS e índices)';
END $$;
