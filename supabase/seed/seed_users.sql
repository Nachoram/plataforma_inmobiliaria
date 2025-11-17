-- =====================================================
-- SEED USERS - Datos iniciales de usuarios para desarrollo
-- =====================================================
-- Este archivo crea usuarios de prueba con diferentes roles
-- Emails: admin@test.com, owner@test.com, applicant@test.com

-- NOTA: En producción, los usuarios de auth.users se crean a través de la autenticación
-- Este seed es solo para desarrollo/testing

-- =====================================================
-- LIMPIEZA PREVIA (solo para desarrollo)
-- =====================================================

-- Limpiar datos existentes (solo en desarrollo)
-- DELETE FROM profiles WHERE id IN (
--     '550e8400-e29b-41d4-a716-446655440001'::uuid,
--     '550e8400-e29b-41d4-a716-446655440002'::uuid,
--     '550e8400-e29b-41d4-a716-446655440003'::uuid,
--     '550e8400-e29b-41d4-a716-446655440004'::uuid,
--     '550e8400-e29b-41d4-a716-446655440005'::uuid,
--     '550e8400-e29b-41d4-a716-446655440006'::uuid
-- );

-- =====================================================
-- ADMINISTRADOR
-- =====================================================

-- Usuario admin (ID específico para consistencia)
INSERT INTO profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    entity_type,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Admin',
    'Sistema',
    'PropAI',
    '11111111-1',
    'admin@test.com',
    '+56912345678',
    'Administrador de Sistema',
    'soltero',
    'Avenida Providencia',
    '123',
    'Providencia',
    'Metropolitana',
    'natural',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PROPIETARIOS (OWNERS)
-- =====================================================

-- Propietario 1 - Persona natural
INSERT INTO profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    marital_status,
    property_regime,
    address_street,
    address_number,
    address_commune,
    address_region,
    entity_type,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'María',
    'González',
    'Rodríguez',
    '22222222-2',
    'owner@test.com',
    '+56987654321',
    'Arquitecta',
    'casada',
    'sociedad conyugal',
    'Calle Las Condes',
    '456',
    'Las Condes',
    'Metropolitana',
    'natural',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propietario 2 - Empresa (persona jurídica)
INSERT INTO profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    address_street,
    address_number,
    address_commune,
    address_region,
    entity_type,
    company_name,
    company_rut,
    legal_representative_name,
    legal_representative_rut,
    constitution_type,
    constitution_date,
    constitution_notary,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Carlos',
    'Martínez',
    'Silva',
    '33333333-3',
    'owner2@test.com',
    '+56911223344',
    'Gerente General',
    'Avenida Apoquindo',
    '789',
    'Las Condes',
    'Metropolitana',
    'juridica',
    'Inmobiliaria Premium SPA',
    '44444444-4',
    'Carlos Martínez Silva',
    '33333333-3',
    'tradicional',
    '2020-01-15',
    'Notaría Metropolitana N°12',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POSTULANTES (APPLICANTS)
-- =====================================================

-- Postulante 1 - Persona natural
INSERT INTO profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    entity_type,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    'Juan',
    'Pérez',
    'López',
    '55555555-5',
    'applicant@test.com',
    '+56955667788',
    'Ingeniero Civil',
    'soltero',
    'Calle Santiago',
    '101',
    'Santiago',
    'Metropolitana',
    'natural',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Postulante 2 - Persona natural
INSERT INTO profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    entity_type,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440005'::uuid,
    'Ana',
    'Rodríguez',
    'Fernández',
    '66666666-6',
    'applicant2@test.com',
    '+56999887766',
    'Médica',
    'casada',
    'Avenida La Chascona',
    '234',
    'Ñuñoa',
    'Metropolitana',
    'natural',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Postulante 3 - Empresa (persona jurídica)
INSERT INTO profiles (
    id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    email,
    phone,
    profession,
    address_street,
    address_number,
    address_commune,
    address_region,
    entity_type,
    company_name,
    company_rut,
    legal_representative_name,
    legal_representative_rut,
    constitution_type,
    constitution_date,
    constitution_notary,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440006'::uuid,
    'Pedro',
    'Sánchez',
    'Morales',
    '77777777-7',
    'applicant3@test.com',
    '+56944332211',
    'Representante Legal',
    'Calle Huérfanos',
    '567',
    'Santiago',
    'Metropolitana',
    'juridica',
    'Constructora Moderna Ltda.',
    '88888888-8',
    'Pedro Sánchez Morales',
    '77777777-7',
    'empresa_un_dia',
    '2022-03-10',
    'Notaría Virtual N°1',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    user_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM profiles
    WHERE id IN (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        '550e8400-e29b-41d4-a716-446655440003'::uuid,
        '550e8400-e29b-41d4-a716-446655440004'::uuid,
        '550e8400-e29b-41d4-a716-446655440005'::uuid,
        '550e8400-e29b-41d4-a716-446655440006'::uuid
    );

    RAISE NOTICE 'Seed users completado exitosamente:';
    RAISE NOTICE '  - Usuarios creados: %', user_count;
    RAISE NOTICE '  - Admin: admin@test.com (ID: 550e8400-e29b-41d4-a716-446655440001)';
    RAISE NOTICE '  - Owner1: owner@test.com (ID: 550e8400-e29b-41d4-a716-446655440002)';
    RAISE NOTICE '  - Owner2: owner2@test.com (ID: 550e8400-e29b-41d4-a716-446655440003)';
    RAISE NOTICE '  - Applicant1: applicant@test.com (ID: 550e8400-e29b-41d4-a716-446655440004)';
    RAISE NOTICE '  - Applicant2: applicant2@test.com (ID: 550e8400-e29b-41d4-a716-446655440005)';
    RAISE NOTICE '  - Applicant3: applicant3@test.com (ID: 550e8400-e29b-41d4-a716-446655440006)';
END $$;
