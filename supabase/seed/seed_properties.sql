-- =====================================================
-- SEED PROPERTIES - Datos iniciales de propiedades para desarrollo
-- =====================================================
-- Este archivo crea propiedades de prueba con diferentes características
-- Mix de arriendo/venta, diferentes ciudades y tipos de propiedad

-- =====================================================
-- PROPIEDADES DE ARRIENDO (RENTAL)
-- =====================================================

-- Propiedad 1 - Departamento en Santiago Centro
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid, -- owner@test.com
    'disponible',
    'arriendo',
    'Calle Estado',
    '360',
    '1201',
    'Santiago',
    'Metropolitana',
    450000,
    80000,
    2,
    1,
    65,
    'Hermoso departamento en pleno centro de Santiago. Excelente ubicación cerca del metro, supermercados y servicios. Renovado recientemente con cocina moderna y baño completo.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 2 - Casa en Las Condes
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid, -- owner@test.com
    'disponible',
    'arriendo',
    'Avenida Vitacura',
    '7890',
    'Las Condes',
    'Metropolitana',
    1200000,
    150000,
    3,
    2,
    180,
    'Amplia casa familiar en sector residencial exclusivo. Jardín privado, estacionamiento para 2 autos, piscina y quincho. Cercano a colegios, malls y centros comerciales.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 3 - Departamento en Ñuñoa
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid, -- owner2@test.com (empresa)
    'disponible',
    'arriendo',
    'Irarrázaval',
    '2345',
    '403',
    'Ñuñoa',
    'Metropolitana',
    650000,
    120000,
    3,
    2,
    85,
    'Moderno departamento en Ñuñoa con vista a la ciudad. Cocina integrada, walking closet, logia con vista panorámica. Edificio con gimnasio y áreas verdes.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PROPIEDADES EN VENTA (SALE)
-- =====================================================

-- Propiedad 4 - Casa en Viña del Mar
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid, -- owner@test.com
    'disponible',
    'venta',
    'Avenida San Martín',
    '456',
    'Viña del Mar',
    'Valparaíso',
    95000000,
    4,
    3,
    220,
    'Espectacular casa en Viña del Mar con vista al mar. 4 habitaciones, 3 baños, living comedor amplio, cocina equipada. Jardín con piscina y terraza con vista panorámica.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 5 - Departamento en Providencia
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_department,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440005'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid, -- owner2@test.com (empresa)
    'disponible',
    'venta',
    'Providencia',
    '1234',
    '801',
    'Providencia',
    'Metropolitana',
    180000000,
    200000,
    3,
    2,
    95,
    'Penthouse en edificio moderno de Providencia. Terraza privada de 30m2 con vista a la cordillera. Acabados de lujo, cocina italiana, piso radiante. Estacionamiento subterráneo.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 6 - Oficina en Santiago Centro
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440006'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid, -- owner2@test.com (empresa)
    'disponible',
    'venta',
    'Huérfanos',
    '987',
    'Santiago',
    'Metropolitana',
    250000000,
    180000,
    0, -- oficina, no bedrooms
    2,
    150,
    'Oficina corporativa en pleno centro financiero de Santiago. 150m2 divididos en sala de reuniones, escritorios individuales y área de recepción. Excelente iluminación natural.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 7 - Local comercial en La Chascona
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440007'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid, -- owner@test.com
    'disponible',
    'venta',
    'Avenida La Chascona',
    '3456',
    'La Reina',
    'Metropolitana',
    120000000,
    120,
    'Local comercial en sector de alto flujo peatonal. Ideal para restaurante, tienda o servicios. Incluye trastienda y baño. Buena visibilidad desde la calle.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 8 - Propiedad en Concepción
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440008'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid, -- owner@test.com
    'disponible',
    'arriendo',
    'Barros Arana',
    '567',
    'Concepción',
    'Biobío',
    380000,
    60000,
    2,
    1,
    55,
    'Cómodo departamento en el centro de Concepción. Cerca de la Universidad de Concepción y servicios básicos. Incluye amoblado básico y conexión a internet.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PROPIEDADES CON DIFERENTES ESTADOS
-- =====================================================

-- Propiedad 9 - Arrendada
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    common_expenses_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440009'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid, -- owner2@test.com
    'arrendada',
    'arriendo',
    'Nueva Providencia',
    '890',
    'Providencia',
    'Metropolitana',
    550000,
    95000,
    2,
    2,
    75,
    'Departamento moderno actualmente arrendado. Contrato hasta diciembre 2025. Excelente inquilino pagador.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- Propiedad 10 - Vendida
INSERT INTO properties (
    id,
    owner_id,
    status,
    listing_type,
    address_street,
    address_number,
    address_commune,
    address_region,
    price_clp,
    bedrooms,
    bathrooms,
    surface_m2,
    description,
    created_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440010'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid, -- owner@test.com
    'vendida',
    'venta',
    'Isidora Goyenechea',
    '3456',
    'Las Condes',
    'Metropolitana',
    200000000,
    4,
    3,
    160,
    'Casa premium vendida recientemente. Propiedad de lujo con acabados premium, jardín y piscina.',
    now()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    property_count integer;
    rental_count integer;
    sale_count integer;
BEGIN
    SELECT COUNT(*) INTO property_count FROM properties
    WHERE id IN (
        '660e8400-e29b-41d4-a716-446655440001'::uuid,
        '660e8400-e29b-41d4-a716-446655440002'::uuid,
        '660e8400-e29b-41d4-a716-446655440003'::uuid,
        '660e8400-e29b-41d4-a716-446655440004'::uuid,
        '660e8400-e29b-41d4-a716-446655440005'::uuid,
        '660e8400-e29b-41d4-a716-446655440006'::uuid,
        '660e8400-e29b-41d4-a716-446655440007'::uuid,
        '660e8400-e29b-41d4-a716-446655440008'::uuid,
        '660e8400-e29b-41d4-a716-446655440009'::uuid,
        '660e8400-e29b-41d4-a716-446655440010'::uuid
    );

    SELECT COUNT(*) INTO rental_count FROM properties
    WHERE id IN (
        '660e8400-e29b-41d4-a716-446655440001'::uuid,
        '660e8400-e29b-41d4-a716-446655440002'::uuid,
        '660e8400-e29b-41d4-a716-446655440003'::uuid,
        '660e8400-e29b-41d4-a716-446655440008'::uuid
    ) AND listing_type = 'arriendo';

    SELECT COUNT(*) INTO sale_count FROM properties
    WHERE id IN (
        '660e8400-e29b-41d4-a716-446655440004'::uuid,
        '660e8400-e29b-41d4-a716-446655440005'::uuid,
        '660e8400-e29b-41d4-a716-446655440006'::uuid,
        '660e8400-e29b-41d4-a716-446655440007'::uuid
    ) AND listing_type = 'venta';

    RAISE NOTICE 'Seed properties completado exitosamente:';
    RAISE NOTICE '  - Total propiedades creadas: %', property_count;
    RAISE NOTICE '  - Propiedades de arriendo: %', rental_count;
    RAISE NOTICE '  - Propiedades en venta: %', sale_count;
    RAISE NOTICE '  - Ubicaciones: Santiago, Las Condes, Ñuñoa, Providencia, Viña del Mar, Concepción';
    RAISE NOTICE '  - Estados: disponible (8), arrendada (1), vendida (1)';
END $$;
