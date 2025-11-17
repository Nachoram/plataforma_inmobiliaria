-- =====================================================
-- SETUP: Tabla rental_contract_conditions y Trigger Automático
-- =====================================================

-- 1. Crear tabla rental_contract_conditions si no existe
CREATE TABLE IF NOT EXISTS public.rental_contract_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  application_id uuid NOT NULL,
  contract_duration_months integer NULL,
  monthly_payment_day integer NULL,
  official_communication_email text NULL,
  accepts_pets boolean NULL DEFAULT false,
  dicom_clause boolean NULL DEFAULT false,
  additional_conditions text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  rental_contract_conditions_characteristic_id text NULL,
  bank_account_info text NULL,
  automatic_renewal boolean NULL DEFAULT false,
  termination_clause_non_payment text NULL,
  contract_start_date date NULL,
  bank_name text NULL,
  account_type text NULL,
  account_number text NULL,
  account_holder_rut text NULL,
  account_holder_name text NULL,
  final_rent_price numeric(12, 2) NULL,
  brokerage_commission numeric(12, 2) NULL,
  guarantee_amount numeric(12, 2) NULL,
  payment_method character varying(50) NOT NULL DEFAULT 'transferencia_bancaria'::character varying,
  created_by uuid NULL,
  broker_name character varying(120) NOT NULL DEFAULT ''::character varying,
  broker_rut character varying(20) NOT NULL DEFAULT ''::character varying,
  contract_conditions_characteristic_id text NULL,
  notification_email text NULL,
  deleted_at timestamp with time zone NULL,
  deleted_by uuid NULL,
  deletion_reason text NULL,
  landlord_email text NULL,
  is_furnished boolean NULL DEFAULT false,

  CONSTRAINT rental_contract_conditions_pkey PRIMARY KEY (id),
  CONSTRAINT unique_application_conditions UNIQUE (application_id),
  CONSTRAINT rental_contract_conditions_rental_contract_conditions_chara_key UNIQUE (rental_contract_conditions_characteristic_id),
  CONSTRAINT rental_contract_conditions_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users (id),
  CONSTRAINT rental_contract_conditions_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
  CONSTRAINT rental_contract_conditions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT rental_contract_conditions_payment_day_check CHECK ((monthly_payment_day >= 1 AND monthly_payment_day <= 31)),
  CONSTRAINT check_monthly_payment_day CHECK ((monthly_payment_day >= 1 AND monthly_payment_day <= 31)),
  CONSTRAINT check_payment_method CHECK ((payment_method = ANY (ARRAY['transferencia_bancaria'::character varying, 'plataforma'::character varying])))
) TABLESPACE pg_default;

-- 2. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_characteristic_id ON public.rental_contract_conditions USING btree (rental_contract_conditions_characteristic_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_application_id ON public.rental_contract_conditions USING btree (application_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_start_date ON public.rental_contract_conditions USING btree (contract_start_date) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_created_by ON public.rental_contract_conditions USING btree (created_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rcc_final_rent_price ON public.rental_contract_conditions USING btree (final_rent_price) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rcc_broker_rut ON public.rental_contract_conditions USING btree (broker_rut) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_application ON public.rental_contract_conditions USING btree (application_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_characteristic ON public.rental_contract_conditions USING btree (contract_conditions_characteristic_id) TABLESPACE pg_default;

-- 3. Función para generar characteristic_id si no existe
CREATE OR REPLACE FUNCTION generate_rental_contract_conditions_characteristic_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rental_contract_conditions_characteristic_id IS NULL THEN
    NEW.rental_contract_conditions_characteristic_id := 'RCC_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_rental_contract_conditions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear triggers si no existen
DROP TRIGGER IF EXISTS trigger_generate_rental_contract_conditions_characteristic_id ON rental_contract_conditions;
CREATE TRIGGER trigger_generate_rental_contract_conditions_characteristic_id
  BEFORE INSERT ON rental_contract_conditions
  FOR EACH ROW EXECUTE FUNCTION generate_rental_contract_conditions_characteristic_id();

DROP TRIGGER IF EXISTS trigger_update_rental_contract_conditions_updated_at ON rental_contract_conditions;
CREATE TRIGGER trigger_update_rental_contract_conditions_updated_at
  BEFORE UPDATE ON rental_contract_conditions
  FOR EACH ROW EXECUTE FUNCTION update_rental_contract_conditions_updated_at();

-- 6. Función que crea contrato automáticamente cuando se crean condiciones
CREATE OR REPLACE FUNCTION create_contract_from_conditions()
RETURNS TRIGGER AS $$
DECLARE
    contract_id UUID;
    tenant_email TEXT;
    landlord_email TEXT;
    existing_contract_count INTEGER;
BEGIN
    -- Verificar que no existe ya un contrato para esta aplicación
    SELECT COUNT(*) INTO existing_contract_count
    FROM rental_contracts
    WHERE application_id = NEW.application_id;

    IF existing_contract_count > 0 THEN
        RAISE EXCEPTION 'Ya existe un contrato para la aplicación %', NEW.application_id;
    END IF;

    -- Obtener email del arrendatario
    SELECT p.email INTO tenant_email
    FROM applications a
    JOIN profiles p ON a.applicant_id = p.id
    WHERE a.id = NEW.application_id;

    -- Usar el email del landlord desde las condiciones, o buscarlo en rental_owners
    IF NEW.landlord_email IS NOT NULL AND NEW.landlord_email != '' THEN
        landlord_email := NEW.landlord_email;
    ELSE
        SELECT ro.email INTO landlord_email
        FROM applications a
        JOIN rental_owners ro ON a.property_id = ro.property_id
        WHERE a.id = NEW.application_id
        LIMIT 1;
    END IF;

    -- Crear el contrato automáticamente
    INSERT INTO rental_contracts (
        application_id,
        status,
        start_date,
        validity_period_months,
        final_amount,
        guarantee_amount,
        final_amount_currency,
        guarantee_amount_currency,
        payment_day,
        account_holder_name,
        account_number,
        account_bank,
        account_type,
        has_brokerage_commission,
        broker_name,
        broker_amount,
        broker_rut,
        allows_pets,
        is_furnished,
        has_dicom_clause,
        tenant_email,
        landlord_email,
        created_by,
        notes,
        contract_content,
        contract_html
    ) VALUES (
        NEW.application_id,
        'draft',
        NEW.contract_start_date,
        NEW.contract_duration_months,
        NEW.final_rent_price,
        COALESCE(NEW.guarantee_amount, NEW.final_rent_price),
        'clp',
        'clp',
        NEW.monthly_payment_day,
        NEW.account_holder_name,
        NEW.account_number,
        NEW.bank_name,
        CASE
            WHEN NEW.account_type = 'Cuenta Corriente' THEN 'corriente'
            WHEN NEW.account_type = 'Cuenta Vista' THEN 'vista'
            WHEN NEW.account_type = 'Cuenta de Ahorro' THEN 'ahorro'
            ELSE 'corriente'
        END,
        CASE WHEN NEW.brokerage_commission > 0 THEN true ELSE false END,
        NULLIF(TRIM(NEW.broker_name), ''),
        NEW.brokerage_commission,
        NULLIF(TRIM(NEW.broker_rut), ''),
        COALESCE(NEW.accepts_pets, false),
        COALESCE(NEW.is_furnished, false),
        COALESCE(NEW.dicom_clause, false),
        tenant_email,
        landlord_email,
        NEW.created_by,
        'Contrato creado automáticamente desde condiciones contractuales el ' || NOW()::TEXT,
        NULL,  -- contract_content
        NULL   -- contract_html
    )
    RETURNING id INTO contract_id;

    -- Log del contrato creado
    RAISE NOTICE 'Contrato creado automáticamente: % para aplicación: %', contract_id, NEW.application_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear el trigger que se ejecuta DESPUÉS de INSERTAR en rental_contract_conditions
DROP TRIGGER IF EXISTS trigger_create_contract_from_conditions ON rental_contract_conditions;
CREATE TRIGGER trigger_create_contract_from_conditions
    AFTER INSERT ON rental_contract_conditions
    FOR EACH ROW
    EXECUTE FUNCTION create_contract_from_conditions();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Verificar tabla
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rental_contract_conditions'
    ) INTO table_exists;

    -- Verificar función
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'create_contract_from_conditions'
    ) INTO function_exists;

    -- Verificar trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_create_contract_from_conditions'
    ) INTO trigger_exists;

    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ VERIFICACIÓN DEL SETUP AUTOMÁTICO';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 Tabla rental_contract_conditions: %', CASE WHEN table_exists THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END;
    RAISE NOTICE '🔧 Función create_contract_from_conditions: %', CASE WHEN function_exists THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END;
    RAISE NOTICE '⚡ Trigger trigger_create_contract_from_conditions: %', CASE WHEN trigger_exists THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END;

    IF table_exists AND function_exists AND trigger_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ¡SETUP COMPLETADO EXITOSAMENTE!';
        RAISE NOTICE '🚀 El sistema creará contratos automáticamente al guardar condiciones';
        RAISE NOTICE '';
        RAISE NOTICE '💡 PRUEBA: Inserta en rental_contract_conditions y verifica que se crea automáticamente en rental_contracts';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ SETUP INCOMPLETO - Revisa los componentes faltantes';
    END IF;

    RAISE NOTICE '==================================================';
END $$;


