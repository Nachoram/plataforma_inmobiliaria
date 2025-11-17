-- =====================================================
-- SEED APPLICATIONS - Datos iniciales de aplicaciones para desarrollo
-- =====================================================
-- Este archivo crea aplicaciones/postulaciones de prueba con diferentes estados

-- =====================================================
-- PRIMERO: CREAR CAMPOS ADICIONALES NECESARIOS
-- =====================================================

-- Agregar campos broker_type e intention a applications si no existen
DO $$ BEGIN
    -- Crear enum para broker_type si no existe
    CREATE TYPE broker_type_enum AS ENUM ('independent', 'firm');

    -- Crear enum para intention si no existe
    CREATE TYPE intention_enum AS ENUM ('rent', 'buy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas a applications si no existen
ALTER TABLE applications ADD COLUMN IF NOT EXISTS broker_type broker_type_enum;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS intention intention_enum;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS broker_firm_name text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS broker_rut varchar(12);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS broker_email text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS broker_phone varchar(20);

-- =====================================================
-- APLICACIONES PENDIENTES
-- =====================================================

-- Aplicación 1 - Pendiente (Juan Pérez postulando al departamento en Santiago)
INSERT INTO applications (
    id,
    property_id,
    applicant_id,
    status,
    message,
    broker_type,
    intention,
    created_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440001'::uuid,
    '660e8400-e29b-41d4-a716-446655440001'::uuid, -- Departamento en Santiago Centro
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com (Juan Pérez)
    'pendiente',
    'Estoy muy interesado en este departamento. Tengo ingresos estables y referencias laborales. Me gustaría coordinar una visita lo antes posible.',
    'independent',
    'rent',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Aplicación 2 - Pendiente (Ana Rodríguez postulando a la casa en Las Condes)
INSERT INTO applications (
    id,
    property_id,
    applicant_id,
    status,
    message,
    broker_type,
    intention,
    created_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440002'::uuid,
    '660e8400-e29b-41d4-a716-446655440002'::uuid, -- Casa en Las Condes
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com (Ana Rodríguez)
    'pendiente',
    'Somos una familia responsable buscando una casa espaciosa. Mi esposo y yo trabajamos en el sector financiero y tenemos excelentes referencias.',
    'firm',
    'rent',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Aplicación 3 - Pendiente (Constructora Moderna postulando a oficina en Santiago)
INSERT INTO applications (
    id,
    property_id,
    applicant_id,
    status,
    message,
    broker_type,
    intention,
    broker_firm_name,
    broker_rut,
    broker_email,
    broker_phone,
    created_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440003'::uuid,
    '660e8400-e29b-41d4-a716-446655440006'::uuid, -- Oficina en Santiago Centro
    '550e8400-e29b-41d4-a716-446655440006'::uuid, -- applicant3@test.com (Constructora Moderna)
    'pendiente',
    'Buscamos expandir nuestras oficinas centrales. Necesitamos un espacio corporativo representativo en el centro financiero.',
    'firm',
    'buy',
    'Inmobiliaria Corporativa Ltda.',
    '99999999-9',
    'broker@corporativa.cl',
    '+56933445566',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- APLICACIONES APROBADAS
-- =====================================================

-- Aplicación 4 - Aprobada (Juan Pérez postulando al departamento en Ñuñoa)
INSERT INTO applications (
    id,
    property_id,
    applicant_id,
    status,
    message,
    broker_type,
    intention,
    created_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440004'::uuid,
    '660e8400-e29b-41d4-a716-446655440003'::uuid, -- Departamento en Ñuñoa
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com (Juan Pérez)
    'aprobada',
    'Excelente postulante con solvencia económica comprobada. Recomiendo aprobar la solicitud.',
    'independent',
    'rent',
    now() - interval '5 days'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- APLICACIONES RECHAZADAS
-- =====================================================

-- Aplicación 5 - Rechazada (Ana Rodríguez postulando al departamento en Providencia)
INSERT INTO applications (
    id,
    property_id,
    applicant_id,
    status,
    message,
    broker_type,
    intention,
    created_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440005'::uuid,
    '660e8400-e29b-41d4-a716-446655440005'::uuid, -- Penthouse en Providencia
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com (Ana Rodríguez)
    'rechazada',
    'Postulante no cumple con los requisitos de ingresos mínimos para esta propiedad premium.',
    'independent',
    'rent',
    now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Aplicación 6 - Información solicitada (Constructora Moderna postulando al local comercial)
INSERT INTO applications (
    id,
    property_id,
    applicant_id,
    status,
    message,
    broker_type,
    intention,
    broker_firm_name,
    broker_rut,
    broker_email,
    broker_phone,
    created_at
) VALUES (
    '770e8400-e29b-41d4-a716-446655440006'::uuid,
    '660e8400-e29b-41d4-a716-446655440007'::uuid, -- Local comercial en La Chascona
    '550e8400-e29b-41d4-a716-446655440006'::uuid, -- applicant3@test.com (Constructora Moderna)
    'info_solicitada',
    'Necesitamos más información sobre permisos municipales y estado de las instalaciones.',
    'firm',
    'buy',
    'Inmobiliaria Moderna SPA',
    '10101010-1',
    'contacto@moderna.cl',
    '+56977889900',
    now() - interval '1 day'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    app_count integer;
    pending_count integer;
    approved_count integer;
    rejected_count integer;
    info_requested_count integer;
BEGIN
    SELECT COUNT(*) INTO app_count FROM applications
    WHERE id IN (
        '770e8400-e29b-41d4-a716-446655440001'::uuid,
        '770e8400-e29b-41d4-a716-446655440002'::uuid,
        '770e8400-e29b-41d4-a716-446655440003'::uuid,
        '770e8400-e29b-41d4-a716-446655440004'::uuid,
        '770e8400-e29b-41d4-a716-446655440005'::uuid,
        '770e8400-e29b-41d4-a716-446655440006'::uuid
    );

    SELECT COUNT(*) INTO pending_count FROM applications
    WHERE id IN (
        '770e8400-e29b-41d4-a716-446655440001'::uuid,
        '770e8400-e29b-41d4-a716-446655440002'::uuid,
        '770e8400-e29b-41d4-a716-446655440003'::uuid
    ) AND status = 'pendiente';

    SELECT COUNT(*) INTO approved_count FROM applications
    WHERE id = '770e8400-e29b-41d4-a716-446655440004'::uuid AND status = 'aprobada';

    SELECT COUNT(*) INTO rejected_count FROM applications
    WHERE id = '770e8400-e29b-41d4-a716-446655440005'::uuid AND status = 'rechazada';

    SELECT COUNT(*) INTO info_requested_count FROM applications
    WHERE id = '770e8400-e29b-41d4-a716-446655440006'::uuid AND status = 'info_solicitada';

    RAISE NOTICE 'Seed applications completado exitosamente:';
    RAISE NOTICE '  - Total aplicaciones creadas: %', app_count;
    RAISE NOTICE '  - Pendientes: %', pending_count;
    RAISE NOTICE '  - Aprobadas: %', approved_count;
    RAISE NOTICE '  - Rechazadas: %', rejected_count;
    RAISE NOTICE '  - Información solicitada: %', info_requested_count;
    RAISE NOTICE '  - Broker types: independent (3), firm (3)';
    RAISE NOTICE '  - Intentions: rent (5), buy (1)';
END $$;
