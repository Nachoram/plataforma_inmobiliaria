-- Crear enums necesarios para el sistema de contratos y firmas electrónicas

-- Enum para estados del contrato
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

-- Enum para tipos de firmante
DO $$ BEGIN
    CREATE TYPE signer_type_enum AS ENUM (
        'owner',      -- Propietario del inmueble
        'tenant',     -- Arrendatario (postulante)
        'guarantor'   -- Aval o garante
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para estados de firma
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

-- Comentarios para documentación
COMMENT ON TYPE contract_status_enum IS 'Estados posibles de un contrato de arriendo';
COMMENT ON TYPE signer_type_enum IS 'Tipos de firmantes en un contrato de arriendo';
COMMENT ON TYPE signature_status_enum IS 'Estados posibles del proceso de firma electrónica';
