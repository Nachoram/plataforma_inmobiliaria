-- =====================================================
-- VISTA: completed_processes_characteristics
-- =====================================================
-- Esta vista consolida todos los characteristic_ids de procesos completados
-- Un proceso se considera completado cuando existe un contrato de arriendo
-- =====================================================

CREATE OR REPLACE VIEW completed_processes_characteristics AS
SELECT
    -- Información del contrato (entidad central del proceso completado)
    rc.id as contract_id,
    rc.contract_characteristic_id,
    rc.contract_number,
    rc.status as contract_status,
    rc.created_at as contract_created_at,

    -- Información de la propiedad
    p.id as property_id,
    p.property_characteristic_id,
    p.address_street || ' ' || p.address_number || ', ' || p.address_commune || ', ' || p.address_region as property_address,
    p.price_clp as property_price,
    p.listing_type,

    -- Información de la aplicación
    a.id as application_id,
    a.application_characteristic_id,
    a.status as application_status,
    a.created_at as application_created_at,

    -- Información del propietario
    ro.id as rental_owner_id,
    ro.rental_owner_characteristic_id,
    ro.first_name as owner_first_name,
    ro.paternal_last_name as owner_last_name,
    ro.email as owner_email,

    -- Información del arrendatario (applicant)
    prof.id as tenant_id,
    prof.first_name as tenant_first_name,
    prof.paternal_last_name as tenant_last_name,
    prof.email as tenant_email,
    prof.rut as tenant_rut,

    -- Información del aval (si existe)
    g.id as guarantor_id,
    a.guarantor_characteristic_id,
    g.first_name as guarantor_first_name,
    g.paternal_last_name as guarantor_last_name,
    g.rut as guarantor_rut,
    g.profession as guarantor_profession,

    -- Información de las condiciones del contrato
    rcc.id as contract_conditions_id,
    rcc.rental_contract_conditions_characteristic_id,
    rcc.final_rent_price,
    rcc.contract_duration_months,
    rcc.additional_conditions

FROM rental_contracts rc
-- Join con la aplicación
INNER JOIN applications a ON rc.application_id = a.id
-- Join con la propiedad
INNER JOIN properties p ON a.property_id = p.id
-- Join con el perfil del arrendatario
INNER JOIN profiles prof ON a.applicant_id = prof.id
-- Join con el propietario de la propiedad
INNER JOIN rental_owners ro ON p.id = ro.property_id
-- Join con las condiciones del contrato (left join porque podría no existir)
LEFT JOIN rental_contract_conditions rcc ON rcc.application_id = rc.application_id
-- Join con el aval (left join porque es opcional)
LEFT JOIN guarantors g ON a.guarantor_id = g.id

ORDER BY rc.created_at DESC;

-- =====================================================
-- COMENTARIOS Y PERMISOS
-- =====================================================

COMMENT ON VIEW completed_processes_characteristics IS 'Vista que consolida todos los characteristic_ids de procesos de arriendo completados (con contrato generado)';

-- Otorgar permisos de lectura
GRANT SELECT ON completed_processes_characteristics TO authenticated;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Nota: Los índices ya existen en las tablas base, pero podríamos crear índices específicos si es necesario
-- CREATE INDEX IF NOT EXISTS idx_completed_processes_contract_created_at ON rental_contracts(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_completed_processes_contract_status ON rental_contracts(status);

-- =====================================================
-- VERIFICACIÓN DE LA VISTA
-- =====================================================

-- Verificar que la vista se creó correctamente
DO $$
DECLARE
    view_exists boolean;
    record_count bigint;
BEGIN
    -- Verificar que la vista existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name = 'completed_processes_characteristics'
    ) INTO view_exists;

    IF view_exists THEN
        RAISE NOTICE '✅ Vista completed_processes_characteristics creada correctamente';

        -- Contar registros
        SELECT COUNT(*) INTO record_count FROM completed_processes_characteristics;

        RAISE NOTICE '📊 Número de procesos completados: %', record_count;

        -- Mostrar columnas disponibles
        RAISE NOTICE '📋 Columnas disponibles:';
        RAISE NOTICE '   • contract_characteristic_id';
        RAISE NOTICE '   • property_characteristic_id';
        RAISE NOTICE '   • application_characteristic_id';
        RAISE NOTICE '   • rental_owner_characteristic_id';
        RAISE NOTICE '   • guarantor_characteristic_id (si existe)';
        RAISE NOTICE '   • rental_contract_conditions_characteristic_id (si existe)';
        RAISE NOTICE '   • Información adicional: precios, duración, condiciones';
        RAISE NOTICE '   • Información adicional del proceso (direcciones, nombres, fechas, etc.)';

    ELSE
        RAISE EXCEPTION '❌ Error: La vista completed_processes_characteristics no se creó';
    END IF;
END $$;
