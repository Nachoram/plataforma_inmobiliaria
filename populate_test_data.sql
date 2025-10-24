-- Script SQL para poblar datos de prueba
-- Ejecutar esto en Supabase SQL Editor

-- Primero crear un usuario de prueba (reemplaza con un UUID real si tienes uno)
-- Si no tienes usuarios, puedes usar este UUID de prueba
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, last_sign_in_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'test@example.com',
  crypt('test123456', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Crear perfil para el usuario
INSERT INTO profiles (id, first_name, paternal_last_name, rut, email)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Usuario',
  'Prueba',
  '12345678-9',
  'test@example.com'
) ON CONFLICT (id) DO NOTHING;

-- Crear propiedades de prueba con diferentes tipos_propiedad
INSERT INTO properties (
  id, owner_id, status, listing_type, tipo_propiedad, property_type,
  address_street, address_number, address_commune, address_region,
  price_clp, bedrooms, bathrooms, surface_m2, description, created_at
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440010'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'disponible',
  'venta',
  'Casa',
  'Casa',
  'Avenida Providencia',
  '1234',
  'Providencia',
  'Metropolitana',
  250000000,
  3,
  2,
  150,
  'Hermosa casa familiar de 3 dormitorios en Providencia',
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440011'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'disponible',
  'arriendo',
  'Departamento',
  'Departamento',
  'Calle Las Condes',
  '567',
  'Las Condes',
  'Metropolitana',
  650000,
  2,
  1,
  75,
  'Moderno departamento de 2 dormitorios con vista',
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440012'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'disponible',
  'venta',
  'Oficina',
  'Oficina',
  'Centro Empresarial',
  '890',
  'Santiago',
  'Metropolitana',
  180000000,
  0,
  2,
  120,
  'Oficina premium en edificio corporativo del centro',
  now()
),
(
  '550e8400-e29b-41d4-a716-446655440013'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'disponible',
  'arriendo',
  'Estacionamiento',
  'Estacionamiento',
  'Edificio Torre Norte',
  '111',
  'Providencia',
  'Metropolitana',
  120000,
  0,
  0,
  20,
  'Estacionamiento techado en edificio residencial',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon las propiedades
SELECT
  id,
  tipo_propiedad,
  property_type,
  address_street,
  price_clp
FROM properties
WHERE owner_id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

-- Probar la función RPC
SELECT id, tipo_propiedad, address_street
FROM get_portfolio_with_postulations('550e8400-e29b-41d4-a716-446655440001'::uuid);
