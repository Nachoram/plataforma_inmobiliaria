-- Extender enum application_status_enum para gestión avanzada de postulaciones
-- Esta migración agrega nuevos estados para el sistema de gestión de postulaciones

-- Agregar nuevos valores al enum application_status_enum si no existen
DO $$ BEGIN
    -- Estado para postulaciones con contrato firmado
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'con_contrato_firmado' AND enumtypid = 'application_status_enum'::regtype) THEN
        ALTER TYPE application_status_enum ADD VALUE 'con_contrato_firmado';
    END IF;

    -- Estado para postulaciones anuladas
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'anulada' AND enumtypid = 'application_status_enum'::regtype) THEN
        ALTER TYPE application_status_enum ADD VALUE 'anulada';
    END IF;

    -- Estado para postulaciones modificadas (tras una modificación administrativa)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'modificada' AND enumtypid = 'application_status_enum'::regtype) THEN
        ALTER TYPE application_status_enum ADD VALUE 'modificada';
    END IF;
END $$;

-- Actualizar comentario del enum para reflejar los nuevos estados
COMMENT ON TYPE application_status_enum IS 'Estados de postulaciones: pendiente, aprobada, rechazada, info_solicitada, con_contrato_firmado, anulada, modificada';

-- Agregar comentario explicativo de los nuevos estados
COMMENT ON TYPE application_status_enum IS E'Estados de postulaciones:\n- pendiente: Postulación inicial\n- aprobada: Aprobada por propietario\n- rechazada: Rechazada por propietario\n- info_solicitada: Se solicitó información adicional\n- con_contrato_firmado: Postulación con contrato firmado\n- anulada: Postulación anulada por propietario\n- modificada: Postulación modificada tras aprobación';
