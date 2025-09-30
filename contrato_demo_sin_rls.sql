-- =====================================================
-- CONTRATO DE DEMOSTRACIÓN - SIN POLÍTICAS RLS
-- =====================================================

-- Este script temporalmente desactiva las políticas RLS para insertar datos de demostración,
-- luego las reactiva. Usa con cuidado en producción.

-- =====================================================
-- 1. DESACTIVAR POLÍTICAS RLS TEMPORALMENTE
-- =====================================================

-- Desactivar RLS para las tablas que necesitamos
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses DISABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contract_conditions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. INSERTAR DATOS DE DEMOSTRACIÓN
-- =====================================================

-- Perfil de Carolina (arrendadora) - usando un ID fijo para demo
INSERT INTO profiles (id, first_name, paternal_last_name, maternal_last_name, rut, email, phone, profession, marital_status, address_street, address_number, address_commune, address_region)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Carolina', 'Soto', 'Rojas', '15.123.456-7', 'carolina.soto@example.com', '+56912345678', 'Profesora', 'casado'::marital_status_enum, 'Eliodoro Yáñez', '1890', 'Providencia', 'Metropolitana')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  paternal_last_name = EXCLUDED.paternal_last_name,
  maternal_last_name = EXCLUDED.maternal_last_name,
  rut = EXCLUDED.rut,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  profession = EXCLUDED.profession,
  marital_status = EXCLUDED.marital_status,
  address_street = EXCLUDED.address_street,
  address_number = EXCLUDED.address_number,
  address_commune = EXCLUDED.address_commune,
  address_region = EXCLUDED.address_region;

-- Perfil de Carlos (arrendatario) - usando un ID fijo para demo
INSERT INTO profiles (id, first_name, paternal_last_name, maternal_last_name, rut, email, phone, profession, marital_status, address_street, address_number, address_commune, address_region)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Carlos', 'Soto', 'Vega', '33.333.333-3', 'carlos.soto@example.com', '+56987654321', 'Ingeniero', 'soltero'::marital_status_enum, 'Los Leones', '567', 'Providencia', 'Metropolitana')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  paternal_last_name = EXCLUDED.paternal_last_name,
  maternal_last_name = EXCLUDED.maternal_last_name,
  rut = EXCLUDED.rut,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  profession = EXCLUDED.profession,
  marital_status = EXCLUDED.marital_status,
  address_street = EXCLUDED.address_street,
  address_number = EXCLUDED.address_number,
  address_commune = EXCLUDED.address_commune,
  address_region = EXCLUDED.address_region;

-- Aval
INSERT INTO guarantors (id, first_name, paternal_last_name, maternal_last_name, rut, profession, monthly_income_clp, address_street, address_number, address_department, address_commune, address_region)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Rodolfo', 'Rrrrrrrr', 'Mmmmmm', '44.444.444-4', 'Abogado', 3500000, 'Irarrazaval', '5350', '22', 'Ñuñoa', 'Metropolitana')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  paternal_last_name = EXCLUDED.paternal_last_name,
  maternal_last_name = EXCLUDED.maternal_last_name,
  rut = EXCLUDED.rut,
  profession = EXCLUDED.profession,
  monthly_income_clp = EXCLUDED.monthly_income_clp,
  address_street = EXCLUDED.address_street,
  address_number = EXCLUDED.address_number,
  address_department = EXCLUDED.address_department,
  address_commune = EXCLUDED.address_commune,
  address_region = EXCLUDED.address_region;

-- Propiedad
INSERT INTO properties (
  id, owner_id, status, listing_type, address_street, address_number, address_department,
  address_commune, address_region, price_clp, common_expenses_clp, bedrooms, bathrooms,
  surface_m2, description
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440004',
   '550e8400-e29b-41d4-a716-446655440001', -- owner_id
   'disponible',
   'arriendo',
   'Suecia',
   '1234',
   'Casa A',
   'Providencia',
   'Metropolitana',
   1600000, -- precio de arriendo
   80000,   -- gastos comunes
   3,       -- dormitorios
   2,       -- baños
   120,     -- superficie
   'Hermosa casa en Providencia, ideal para familia. Incluye estacionamiento y bodega.'
  )
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  status = EXCLUDED.status,
  listing_type = EXCLUDED.listing_type,
  address_street = EXCLUDED.address_street,
  address_number = EXCLUDED.address_number,
  address_department = EXCLUDED.address_department,
  address_commune = EXCLUDED.address_commune,
  address_region = EXCLUDED.address_region,
  price_clp = EXCLUDED.price_clp,
  common_expenses_clp = EXCLUDED.common_expenses_clp,
  bedrooms = EXCLUDED.bedrooms,
  bathrooms = EXCLUDED.bathrooms,
  surface_m2 = EXCLUDED.surface_m2,
  description = EXCLUDED.description;

-- Aplicación
INSERT INTO applications (
  id, property_id, applicant_id, guarantor_id, status, message,
  snapshot_applicant_first_name, snapshot_applicant_paternal_last_name, snapshot_applicant_maternal_last_name,
  snapshot_applicant_rut, snapshot_applicant_email, snapshot_applicant_phone, snapshot_applicant_profession,
  snapshot_applicant_monthly_income_clp, snapshot_applicant_age, snapshot_applicant_nationality,
  snapshot_applicant_marital_status, snapshot_applicant_address_street, snapshot_applicant_address_number,
  snapshot_applicant_address_department, snapshot_applicant_address_commune, snapshot_applicant_address_region
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005',
   '550e8400-e29b-41d4-a716-446655440004', -- property_id
   '550e8400-e29b-41d4-a716-446655440002', -- applicant_id
   '550e8400-e29b-41d4-a716-446655440003', -- guarantor_id
   'aprobada',
   'Excelente postulante, recomendado por conocidos. Tiene ingresos estables y referencias positivas.',
   'Carlos', 'Soto', 'Vega', '33.333.333-3', 'carlos.soto@example.com', '+56987654321', 'Ingeniero',
   4500000, 35, 'Chilena', 'soltero'::marital_status_enum, 'Los Leones', '567', NULL, 'Providencia', 'Metropolitana'
  )
ON CONFLICT (id) DO UPDATE SET
  property_id = EXCLUDED.property_id,
  applicant_id = EXCLUDED.applicant_id,
  guarantor_id = EXCLUDED.guarantor_id,
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  snapshot_applicant_first_name = EXCLUDED.snapshot_applicant_first_name,
  snapshot_applicant_paternal_last_name = EXCLUDED.snapshot_applicant_paternal_last_name,
  snapshot_applicant_maternal_last_name = EXCLUDED.snapshot_applicant_maternal_last_name,
  snapshot_applicant_rut = EXCLUDED.snapshot_applicant_rut,
  snapshot_applicant_email = EXCLUDED.snapshot_applicant_email,
  snapshot_applicant_phone = EXCLUDED.snapshot_applicant_phone,
  snapshot_applicant_profession = EXCLUDED.snapshot_applicant_profession,
  snapshot_applicant_monthly_income_clp = EXCLUDED.snapshot_applicant_monthly_income_clp,
  snapshot_applicant_age = EXCLUDED.snapshot_applicant_age,
  snapshot_applicant_nationality = EXCLUDED.snapshot_applicant_nationality,
  snapshot_applicant_marital_status = EXCLUDED.snapshot_applicant_marital_status,
  snapshot_applicant_address_street = EXCLUDED.snapshot_applicant_address_street,
  snapshot_applicant_address_number = EXCLUDED.snapshot_applicant_address_number,
  snapshot_applicant_address_department = EXCLUDED.snapshot_applicant_address_department,
  snapshot_applicant_address_commune = EXCLUDED.snapshot_applicant_address_commune,
  snapshot_applicant_address_region = EXCLUDED.snapshot_applicant_address_region;

-- Contrato
INSERT INTO rental_contracts (
  id, application_id, status, contract_content,
  created_by, approved_by, notes
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440006',
   '550e8400-e29b-41d4-a716-446655440005',
   'approved',
   '{
     "header": {
       "title": "Encabezado del Contrato",
       "content": "## CONTRATO DE ARRENDAMIENTO RESIDENCIAL\\n\\nEn Santiago de Chile, a 29 de septiembre de 2025, comparecen:\\n\\n**Carolina Andrea Soto Rojas**, con RUT N° 15.123.456-7, domiciliada en Eliodoro Yáñez 1890, Providencia, en adelante \\"el Arrendador\\"; y\\n\\n**Carlos Alberto Soto Vega**, con RUT N° 33.333.333-3, domiciliado en Los Leones 567 Depto. 56, Providencia, en adelante \\"el Arrendatario\\".\\n\\nAmbas partes convienen en celebrar el presente contrato de arrendamiento residencial, el que se regirá por las siguientes cláusulas."
     },
     "conditions": {
       "title": "Condiciones del Arriendo",
       "content": "## CLÁUSULA SEGUNDA: OBJETO\\n\\nEl Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en Suecia 1234 Casa A, Providencia, con ROL de avalúo N° [ROL no especificado].\\n\\nEl inmueble arrendado se destina exclusivamente para fines residenciales, para la habitación del Arrendatario y su familia.\\n\\nSe deja constancia que el inmueble no incluye estacionamiento ni bodega.\\n\\n## CLÁUSULA TERCERA: RENTA\\n\\nLa renta mensual de arrendamiento será la suma de $1.600.000 (un millón seiscientos mil pesos chilenos).\\n\\nEl Arrendatario se obliga a pagar dicha suma por adelantado dentro de los primeros cinco (5) días de cada mes, en la forma y lugar que las partes convengan o determinen posteriormente.\\n\\n## CLÁUSULA CUARTA: DURACIÓN\\n\\nEl presente contrato tendrá una duración de 12 meses a contar del 1 de octubre de 2025, pudiendo renovarse previo acuerdo expreso entre las partes.\\n\\nEl Arrendatario podrá poner término al contrato notificando al Arrendador con al menos 30 días de anticipación, en conformidad con la legislación vigente.\\n\\nAsimismo, el Arrendador podrá poner término conforme a los plazos y causales legales aplicables."
     },
     "obligations": {
       "title": "Obligaciones de las Partes",
       "content": "## CLÁUSULA QUINTA: GARANTÍA, AVAL Y CODEUDOR SOLIDARIO\\n\\nPara garantía del fiel cumplimiento de todas las obligaciones emanadas del presente contrato, comparece y se constituye en aval y codeudor solidario:\\n\\n**Don Rodolfo Rrrrrrrr Mmmmmm**, con RUT N° 44.444.444-4, domiciliado en Irarrazaval 5350 Depto. 22, Ñuñoa, quien responde solidariamente con el Arrendatario por todas las obligaciones presentes y futuras derivadas del presente contrato.\\n\\n## OTRAS OBLIGACIONES\\n\\n**Obligaciones del Arrendatario:**\\n- Pagar puntualmente la renta y gastos comunes\\n- Mantener el inmueble en buen estado\\n- Permitir inspecciones con previo aviso\\n- No subarrendar sin autorización\\n\\n**Obligaciones del Arrendador:**\\n- Entregar el inmueble en perfectas condiciones\\n- Realizar reparaciones necesarias\\n- Respetar el uso pacífico del inmueble\\n- Cumplir con las normativas vigentes"
     },
     "termination": {
       "title": "Terminación del Contrato",
       "content": "## CLÁUSULA DE TERMINACIÓN\\n\\nEl contrato podrá terminarse por:\\n\\n1. **Mutuo acuerdo** entre las partes\\n2. **Incumplimiento** de cualquiera de las obligaciones contractuales\\n3. **Necesidades propias** del arrendador (con preaviso de 90 días)\\n4. **Pérdida del empleo** del arrendatario (con preaviso de 60 días)\\n\\nEn caso de terminación anticipada, se aplicarán las multas correspondientes según la legislación vigente."
     },
     "signatures": {
       "title": "Firmas Digitales",
       "content": "## ESPACIOS PARA FIRMAS\\n\\nFirmado en dos ejemplares de un mismo tenor y a un solo efecto, en Santiago de Chile a 29 de septiembre de 2025.\\n\\n_____________________________\\nCarolina Andrea Soto Rojas\\nRUT: 15.123.456-7\\nARRENDADOR\\n\\n_____________________________\\nCarlos Alberto Soto Vega\\nRUT: 33.333.333-3\\nARRENDATARIO\\n\\n_____________________________\\nRodolfo Rrrrrrrr Mmmmmm\\nRUT: 44.444.444-4\\nAVAL Y CODEUDOR SOLIDARIO"
     }
   }'::jsonb,
  '550e8400-e29b-41d4-a716-446655440001', -- created_by
  '550e8400-e29b-41d4-a716-446655440001', -- approved_by
   'Contrato generado automáticamente para demostración del sistema de contratos.'
  )
ON CONFLICT (application_id) DO UPDATE SET
  status = EXCLUDED.status,
  contract_content = EXCLUDED.contract_content,
  created_by = EXCLUDED.created_by,
  approved_by = EXCLUDED.approved_by,
  notes = EXCLUDED.notes,
  approved_at = NOW();

-- Cláusulas del contrato
INSERT INTO contract_clauses (contract_id, clause_number, clause_title, clause_content, canvas_section, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440006', 'PRIMERA', 'COMPARECIENCIA', 'En Santiago de Chile, a 29 de septiembre de 2025, comparecen:

**Carolina Andrea Soto Rojas**, con RUT N° 15.123.456-7, domiciliada en Eliodoro Yáñez 1890, Providencia, en adelante "el Arrendador"; y

**Carlos Alberto Soto Vega**, con RUT N° 33.333.333-3, domiciliado en Los Leones 567 Depto. 56, Providencia, en adelante "el Arrendatario".

Ambas partes convienen en celebrar el presente contrato de arrendamiento residencial, el que se regirá por las siguientes cláusulas.', 'header', 1),

('550e8400-e29b-41d4-a716-446655440006', 'SEGUNDA', 'OBJETO', 'El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en Suecia 1234 Casa A, Providencia, con ROL de avalúo N° [ROL no especificado].

El inmueble arrendado se destina exclusivamente para fines residenciales, para la habitación del Arrendatario y su familia.

Se deja constancia que el inmueble no incluye estacionamiento ni bodega.', 'conditions', 2),

('550e8400-e29b-41d4-a716-446655440006', 'TERCERA', 'RENTA', 'La renta mensual de arrendamiento será la suma de $1.600.000 (un millón seiscientos mil pesos chilenos).

El Arrendatario se obliga a pagar dicha suma por adelantado dentro de los primeros cinco (5) días de cada mes, en la forma y lugar que las partes convengan o determinen posteriormente.', 'conditions', 3),

('550e8400-e29b-41d4-a716-446655440006', 'CUARTA', 'DURACIÓN', 'El presente contrato tendrá una duración de 12 meses a contar del 1 de octubre de 2025, pudiendo renovarse previo acuerdo expreso entre las partes.

El Arrendatario podrá poner término al contrato notificando al Arrendador con al menos 30 días de anticipación, en conformidad con la legislación vigente.

Asimismo, el Arrendador podrá poner término conforme a los plazos y causales legales aplicables.', 'conditions', 4),

('550e8400-e29b-41d4-a716-446655440006', 'QUINTA', 'GARANTÍA, AVAL Y CODEUDOR SOLIDARIO', 'Para garantía del fiel cumplimiento de todas las obligaciones emanadas del presente contrato, comparece y se constituye en aval y codeudor solidario:

**Don Rodolfo Rrrrrrrr Mmmmmm**, con RUT N° 44.444.444-4, domiciliado en Irarrazaval 5350 Depto. 22, Ñuñoa, quien responde solidariamente con el Arrendatario por todas las obligaciones presentes y futuras derivadas del presente contrato.', 'obligations', 5),

('550e8400-e29b-41d4-a716-446655440006', 'SEXTA', 'OBLIGACIONES DEL ARRENDATARIO', '- Pagar puntualmente la renta y gastos comunes
- Mantener el inmueble en buen estado
- Permitir inspecciones con previo aviso
- No subarrendar sin autorización', 'obligations', 6),

('550e8400-e29b-41d4-a716-446655440006', 'SÉPTIMA', 'OBLIGACIONES DEL ARRENDADOR', '- Entregar el inmueble en perfectas condiciones
- Realizar reparaciones necesarias
- Respetar el uso pacífico del inmueble
- Cumplir con las normativas vigentes', 'obligations', 7),

('550e8400-e29b-41d4-a716-446655440006', 'OCTAVA', 'TERMINACIÓN', 'El contrato podrá terminarse por:

1. **Mutuo acuerdo** entre las partes
2. **Incumplimiento** de cualquiera de las obligaciones contractuales
3. **Necesidades propias** del arrendador (con preaviso de 90 días)
4. **Pérdida del empleo** del arrendatario (con preaviso de 60 días)

En caso de terminación anticipada, se aplicarán las multas correspondientes según la legislación vigente.', 'termination', 8),

('550e8400-e29b-41d4-a716-446655440006', 'NOVENA', 'LEGISLACIÓN APLICABLE', 'Este contrato se rige por las disposiciones de la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos y demás normas complementarias.', 'termination', 9),

('550e8400-e29b-41d4-a716-446655440006', 'DÉCIMA', 'FIRMAS', 'Firmado en dos ejemplares de un mismo tenor y a un solo efecto, en Santiago de Chile a 29 de septiembre de 2025.

_____________________________
Carolina Andrea Soto Rojas
RUT: 15.123.456-7
ARRENDADOR

_____________________________
Carlos Alberto Soto Vega
RUT: 33.333.333-3
ARRENDATARIO

_____________________________
Rodolfo Rrrrrrrr Mmmmmm
RUT: 44.444.444-4
AVAL Y CODEUDOR SOLIDARIO', 'signatures', 10)
ON CONFLICT (contract_id, clause_number) DO UPDATE SET
  clause_title = EXCLUDED.clause_title,
  clause_content = EXCLUDED.clause_content,
  canvas_section = EXCLUDED.canvas_section,
  sort_order = EXCLUDED.sort_order;

-- Condiciones del contrato
INSERT INTO rental_contract_conditions (
  application_id, lease_term_months, payment_day, final_price_clp, broker_commission_clp,
  guarantee_amount_clp, official_communication_email, accepts_pets, dicom_clause, additional_conditions
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005',
   12, 5, 1600000, 0, 3200000, 'carlos.soto@example.com', false, true,
   'El arrendatario se compromete a mantener el jardín en buen estado. No se permiten mascotas sin autorización expresa del arrendador.'
  )
ON CONFLICT (application_id) DO UPDATE SET
  lease_term_months = EXCLUDED.lease_term_months,
  payment_day = EXCLUDED.payment_day,
  final_price_clp = EXCLUDED.final_price_clp,
  broker_commission_clp = EXCLUDED.broker_commission_clp,
  guarantee_amount_clp = EXCLUDED.guarantee_amount_clp,
  official_communication_email = EXCLUDED.official_communication_email,
  accepts_pets = EXCLUDED.accepts_pets,
  dicom_clause = EXCLUDED.dicom_clause,
  additional_conditions = EXCLUDED.additional_conditions;

-- =====================================================
-- 3. REACTIVAR POLÍTICAS RLS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contract_conditions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT
  '✅ Perfiles:' as status,
  COUNT(*) as total
FROM profiles
WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002')

UNION ALL

SELECT '✅ Aval:', COUNT(*) FROM guarantors WHERE id = '550e8400-e29b-41d4-a716-446655440003'
UNION ALL
SELECT '✅ Propiedad:', COUNT(*) FROM properties WHERE id = '550e8400-e29b-41d4-a716-446655440004'
UNION ALL
SELECT '✅ Aplicación:', COUNT(*) FROM applications WHERE id = '550e8400-e29b-41d4-a716-446655440005'
UNION ALL
SELECT '✅ Contrato:', COUNT(*) FROM rental_contracts WHERE id = '550e8400-e29b-41d4-a716-446655440006'
UNION ALL
SELECT '✅ Cláusulas:', COUNT(*) FROM contract_clauses WHERE contract_id = '550e8400-e29b-41d4-a716-446655440006'
UNION ALL
SELECT '✅ Condiciones:', COUNT(*) FROM rental_contract_conditions WHERE application_id = '550e8400-e29b-41d4-a716-446655440005';
