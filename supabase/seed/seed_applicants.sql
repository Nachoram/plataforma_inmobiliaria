-- =====================================================
-- SEED APPLICANTS - Datos iniciales de postulantes detallados para desarrollo
-- =====================================================
-- Este archivo crea perfiles detallados de postulantes con diferentes características
-- Incluye broker types (independent/firm) e intentions (rent/buy)

-- =====================================================
-- PRIMERO: AGREGAR CAMPOS ADICIONALES NECESARIOS
-- =====================================================

-- Agregar campos broker_type e intention a application_applicants si no existen
ALTER TABLE application_applicants ADD COLUMN IF NOT EXISTS broker_type broker_type_enum;
ALTER TABLE application_applicants ADD COLUMN IF NOT EXISTS intention intention_enum;
ALTER TABLE application_applicants ADD COLUMN IF NOT EXISTS broker_firm_name text;
ALTER TABLE application_applicants ADD COLUMN IF NOT EXISTS broker_rut varchar(12);
ALTER TABLE application_applicants ADD COLUMN IF NOT EXISTS broker_email text;
ALTER TABLE application_applicants ADD COLUMN IF NOT EXISTS broker_phone varchar(20);

-- =====================================================
-- POSTULANTES PARA APLICACIÓN 1 (Juan Pérez - Independiente)
-- =====================================================

-- Postulante principal: Juan Pérez (Ingeniero Civil independiente)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440001'::uuid,
    '770e8400-e29b-41d4-a716-446655440001'::uuid, -- Aplicación 1
    'natural',
    'Juan',
    'Pérez',
    'López',
    '55555555-5',
    'Ingeniero Civil',
    2500000,
    35,
    'Chilena',
    'soltero',
    'Calle Santiago',
    '101',
    'Santiago',
    'Metropolitana',
    '+56955667788',
    'juan.perez@email.com',
    'independent',
    'rent',
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POSTULANTES PARA APLICACIÓN 2 (Ana Rodríguez - Firma)
-- =====================================================

-- Postulante principal: Ana Rodríguez (Médica con broker)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    broker_firm_name,
    broker_rut,
    broker_email,
    broker_phone,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440002'::uuid,
    '770e8400-e29b-41d4-a716-446655440002'::uuid, -- Aplicación 2
    'natural',
    'Ana',
    'Rodríguez',
    'Fernández',
    '66666666-6',
    'Médica Cirujana',
    3200000,
    42,
    'Chilena',
    'casada',
    'Avenida La Chascona',
    '234',
    'Ñuñoa',
    'Metropolitana',
    '+56999887766',
    'ana.rodriguez@email.com',
    'firm',
    'rent',
    'Propiedades Familiares Ltda.',
    '12121212-1',
    'contacto@propfam.cl',
    '+56911223344',
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    now()
) ON CONFLICT (id) DO NOTHING;

-- Segundo postulante: Carlos Rodríguez (esposo de Ana)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440003'::uuid,
    '770e8400-e29b-41d4-a716-446655440002'::uuid, -- Aplicación 2
    'natural',
    'Carlos',
    'Rodríguez',
    'Fernández',
    '77777777-7',
    'Abogado',
    2800000,
    45,
    'Chilena',
    'casado',
    'Avenida La Chascona',
    '234',
    'Ñuñoa',
    'Metropolitana',
    '+56988776655',
    'carlos.rodriguez@email.com',
    'firm',
    'rent',
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POSTULANTES PARA APLICACIÓN 3 (Constructora Moderna - Empresa)
-- =====================================================

-- Postulante principal: Constructora Moderna Ltda. (Empresa)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    company_name,
    company_rut,
    legal_representative_name,
    legal_representative_rut,
    constitution_type,
    constitution_date,
    constitution_notary,
    profession,
    monthly_income_clp,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    broker_firm_name,
    broker_rut,
    broker_email,
    broker_phone,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440004'::uuid,
    '770e8400-e29b-41d4-a716-446655440003'::uuid, -- Aplicación 3
    'juridica',
    'Constructora Moderna Ltda.',
    '88888888-8',
    'Pedro Sánchez Morales',
    '77777777-7',
    'empresa_un_dia',
    '2022-03-10',
    'Notaría Virtual N°1',
    'Constructora',
    15000000,
    'Calle Huérfanos',
    '567',
    'Santiago',
    'Metropolitana',
    '+56944332211',
    'contacto@constructora-moderna.cl',
    'firm',
    'buy',
    'Inmobiliaria Corporativa Ltda.',
    '99999999-9',
    'broker@corporativa.cl',
    '+56933445566',
    '550e8400-e29b-41d4-a716-446655440006'::uuid, -- applicant3@test.com
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POSTULANTES PARA APLICACIÓN 4 (Juan Pérez - Aprobada)
-- =====================================================

-- Postulante principal: Juan Pérez (versión aprobada)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440005'::uuid,
    '770e8400-e29b-41d4-a716-446655440004'::uuid, -- Aplicación 4 (aprobada)
    'natural',
    'Juan',
    'Pérez',
    'López',
    '55555555-5',
    'Ingeniero Civil',
    2500000,
    35,
    'Chilena',
    'soltero',
    'Calle Santiago',
    '101',
    'Santiago',
    'Metropolitana',
    '+56955667788',
    'juan.perez@email.com',
    'independent',
    'rent',
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com
    now() - interval '5 days'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POSTULANTES PARA APLICACIÓN 5 (Ana Rodríguez - Rechazada)
-- =====================================================

-- Postulante principal: Ana Rodríguez (versión rechazada)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    profession,
    monthly_income_clp,
    age,
    nationality,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440006'::uuid,
    '770e8400-e29b-41d4-a716-446655440005'::uuid, -- Aplicación 5 (rechazada)
    'natural',
    'Ana',
    'Rodríguez',
    'Fernández',
    '66666666-6',
    'Médica Cirujana',
    1800000, -- Ingresos insuficientes para la propiedad premium
    42,
    'Chilena',
    'casada',
    'Avenida La Chascona',
    '234',
    'Ñuñoa',
    'Metropolitana',
    '+56999887766',
    'ana.rodriguez@email.com',
    'independent',
    'rent',
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POSTULANTES PARA APLICACIÓN 6 (Constructora Moderna - Info solicitada)
-- =====================================================

-- Postulante principal: Constructora Moderna Ltda. (versión con info solicitada)
INSERT INTO application_applicants (
    id,
    application_id,
    entity_type,
    company_name,
    company_rut,
    legal_representative_name,
    legal_representative_rut,
    constitution_type,
    constitution_date,
    constitution_notary,
    profession,
    monthly_income_clp,
    address_street,
    address_number,
    address_commune,
    address_region,
    phone,
    email,
    broker_type,
    intention,
    broker_firm_name,
    broker_rut,
    broker_email,
    broker_phone,
    created_by,
    created_at
) VALUES (
    '880e8400-e29b-41d4-a716-446655440007'::uuid,
    '770e8400-e29b-41d4-a716-446655440006'::uuid, -- Aplicación 6 (info solicitada)
    'juridica',
    'Constructora Moderna Ltda.',
    '88888888-8',
    'Pedro Sánchez Morales',
    '77777777-7',
    'empresa_un_dia',
    '2022-03-10',
    'Notaría Virtual N°1',
    'Constructora',
    15000000,
    'Calle Huérfanos',
    '567',
    'Santiago',
    'Metropolitana',
    '+56944332211',
    'contacto@constructora-moderna.cl',
    'firm',
    'buy',
    'Inmobiliaria Moderna SPA',
    '10101010-1',
    'contacto@moderna.cl',
    '+56977889900',
    '550e8400-e29b-41d4-a716-446655440006'::uuid, -- applicant3@test.com
    now() - interval '1 day'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    applicant_count integer;
    natural_count integer;
    juridica_count integer;
    independent_count integer;
    firm_count integer;
    rent_count integer;
    buy_count integer;
BEGIN
    SELECT COUNT(*) INTO applicant_count FROM application_applicants
    WHERE id IN (
        '880e8400-e29b-41d4-a716-446655440001'::uuid,
        '880e8400-e29b-41d4-a716-446655440002'::uuid,
        '880e8400-e29b-41d4-a716-446655440003'::uuid,
        '880e8400-e29b-41d4-a716-446655440004'::uuid,
        '880e8400-e29b-41d4-a716-446655440005'::uuid,
        '880e8400-e29b-41d4-a716-446655440006'::uuid,
        '880e8400-e29b-41d4-a716-446655440007'::uuid
    );

    SELECT COUNT(*) INTO natural_count FROM application_applicants
    WHERE id IN (
        '880e8400-e29b-41d4-a716-446655440001'::uuid,
        '880e8400-e29b-41d4-a716-446655440002'::uuid,
        '880e8400-e29b-41d4-a716-446655440003'::uuid,
        '880e8400-e29b-41d4-a716-446655440005'::uuid,
        '880e8400-e29b-41d4-a716-446655440006'::uuid
    ) AND entity_type = 'natural';

    SELECT COUNT(*) INTO juridica_count FROM application_applicants
    WHERE id IN (
        '880e8400-e29b-41d4-a716-446655440004'::uuid,
        '880e8400-e29b-41d4-a716-446655440007'::uuid
    ) AND entity_type = 'juridica';

    SELECT COUNT(*) INTO independent_count FROM application_applicants
    WHERE id IN (
        '880e8400-e29b-41d4-a716-446655440001'::uuid,
        '880e8400-e29b-41d4-a716-446655440005'::uuid,
        '880e8400-e29b-41d4-a716-446655440006'::uuid
    ) AND broker_type = 'independent';

    SELECT COUNT(*) INTO firm_count FROM application_applicants
    WHERE id IN (
        '880e8400-e29b-41d4-a716-446655440002'::uuid,
        '880e8400-e29b-41d4-a716-446655440003'::uuid,
        '880e8400-e29b-41d4-a716-446655440004'::uuid,
        '880e8400-e29b-41d4-a716-446655440007'::uuid
    ) AND broker_type = 'firm';

    SELECT COUNT(*) INTO rent_count FROM application_applicants
    WHERE intention = 'rent';

    SELECT COUNT(*) INTO buy_count FROM application_applicants
    WHERE intention = 'buy';

    RAISE NOTICE 'Seed applicants completado exitosamente:';
    RAISE NOTICE '  - Total postulantes creados: %', applicant_count;
    RAISE NOTICE '  - Personas naturales: %', natural_count;
    RAISE NOTICE '  - Personas jurídicas: %', juridica_count;
    RAISE NOTICE '  - Brokers independientes: %', independent_count;
    RAISE NOTICE '  - Brokers de firma: %', firm_count;
    RAISE NOTICE '  - Intención arriendo: %', rent_count;
    RAISE NOTICE '  - Intención compra: %', buy_count;
    RAISE NOTICE '  - Ingresos: $1.8M - $15M';
END $$;
