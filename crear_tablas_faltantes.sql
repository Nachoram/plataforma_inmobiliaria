-- =====================================================
-- CREAR TABLAS FALTANTES PARA EL SISTEMA DE CONTRATOS
-- =====================================================

-- PASO 1: Crear enums necesarios
-- =====================================================

DO $$ BEGIN
    CREATE TYPE contract_status_enum AS ENUM (
        'draft',           -- Borrador, puede ser editado
        'approved',        -- Aprobado por el propietario, listo para enviar a firma
        'sent_to_signature', -- Enviado al proceso de firma electrónica
        'partially_signed', -- Alguna firma completada pero no todas
        'fully_signed',    -- Todas las firmas completadas
        'cancelled'        -- Contrato cancelado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signer_type_enum AS ENUM (
        'owner',      -- Propietario del inmueble
        'tenant',     -- Arrendatario (postulante)
        'guarantor'   -- Aval o garante
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signature_status_enum AS ENUM (
        'pending',   -- Firma pendiente de envío
        'sent',      -- Enlace de firma enviado al firmante
        'viewed',    -- Firmante accedió al enlace pero no firmó
        'signed',    -- Firma completada exitosamente
        'rejected',  -- Firma rechazada por el firmante
        'expired',   -- Enlace de firma expiró
        'cancelled'  -- Proceso de firma cancelado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PASO 2: Crear tabla rental_contracts
-- =====================================================

CREATE TABLE IF NOT EXISTS rental_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status contract_status_enum DEFAULT 'draft',
    contract_content JSONB NOT NULL DEFAULT '{}',
    owner_signed_at TIMESTAMP WITH TIME ZONE,
    tenant_signed_at TIMESTAMP WITH TIME ZONE,
    guarantor_signed_at TIMESTAMP WITH TIME ZONE,
    signed_contract_url TEXT,
    owner_signature_url TEXT,
    tenant_signature_url TEXT,
    guarantor_signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_to_signature_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    notes TEXT,
    version INTEGER DEFAULT 1,
    CONSTRAINT unique_contract_per_application UNIQUE (application_id),
    CONSTRAINT valid_status_transitions CHECK (
        status IN ('draft', 'approved', 'sent_to_signature', 'partially_signed', 'fully_signed', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_rental_contracts_application_id ON rental_contracts(application_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts(status);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_created_by ON rental_contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_approved_by ON rental_contracts(approved_by);

-- PASO 3: Crear tabla contract_clauses
-- =====================================================

CREATE TABLE IF NOT EXISTS contract_clauses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES rental_contracts(id) ON DELETE CASCADE,
    clause_number VARCHAR(50) NOT NULL,
    clause_title TEXT NOT NULL,
    clause_content TEXT NOT NULL,
    canvas_section VARCHAR(50) DEFAULT 'obligations',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_system VARCHAR(100) DEFAULT 'n8n',
    sort_order INTEGER DEFAULT 0,
    CONSTRAINT valid_canvas_section CHECK (
        canvas_section IN ('header', 'conditions', 'obligations', 'termination', 'signatures')
    )
);

CREATE INDEX IF NOT EXISTS idx_contract_clauses_contract_id ON contract_clauses(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_canvas_section ON contract_clauses(canvas_section);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_clause_number ON contract_clauses(clause_number);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_sort_order ON contract_clauses(sort_order);

-- PASO 4: Crear tabla rental_contract_conditions
-- =====================================================

CREATE TABLE IF NOT EXISTS rental_contract_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    lease_term_months INTEGER,
    payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
    final_price_clp INTEGER,
    broker_commission_clp INTEGER,
    guarantee_amount_clp INTEGER,
    official_communication_email TEXT,
    accepts_pets BOOLEAN DEFAULT FALSE,
    dicom_clause BOOLEAN DEFAULT FALSE,
    additional_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_application_conditions UNIQUE (application_id),
    CONSTRAINT valid_payment_day CHECK (payment_day >= 1 AND payment_day <= 31)
);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_application_id
ON rental_contract_conditions(application_id);

-- PASO 5: Crear funciones y triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_rental_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rental_contracts_updated_at ON rental_contracts;
CREATE TRIGGER trigger_update_rental_contracts_updated_at
    BEFORE UPDATE ON rental_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_rental_contracts_updated_at();

CREATE OR REPLACE FUNCTION update_contract_clauses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contract_clauses_updated_at ON contract_clauses;
CREATE TRIGGER trigger_update_contract_clauses_updated_at
    BEFORE UPDATE ON contract_clauses
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_clauses_updated_at();

CREATE OR REPLACE FUNCTION update_rental_contract_conditions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rental_contract_conditions_updated_at ON rental_contract_conditions;
CREATE TRIGGER trigger_update_rental_contract_conditions_updated_at
    BEFORE UPDATE ON rental_contract_conditions
    FOR EACH ROW
    EXECUTE FUNCTION update_rental_contract_conditions_updated_at();

-- PASO 6: Verificación final
-- =====================================================

SELECT
  '✅ rental_contracts:' as tabla,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contracts') THEN 'CREADA' ELSE 'FALTA' END as estado
UNION ALL
SELECT '✅ contract_clauses:', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_clauses') THEN 'CREADA' ELSE 'FALTA' END
UNION ALL
SELECT '✅ rental_contract_conditions:', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_contract_conditions') THEN 'CREADA' ELSE 'FALTA' END
UNION ALL
SELECT '✅ contract_status_enum:', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_enum') THEN 'CREADO' ELSE 'FALTA' END
UNION ALL
SELECT '✅ signer_type_enum:', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signer_type_enum') THEN 'CREADO' ELSE 'FALTA' END
UNION ALL
SELECT '✅ signature_status_enum:', CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signature_status_enum') THEN 'CREADO' ELSE 'FALTA' END;
