-- =====================================================
-- SCRIPT FINAL PARA POBLAR DATOS DE DEMOSTRACIÓN DEL CONTRATO
-- =====================================================

-- INSTRUCCIONES:
-- 1. Crea los usuarios primero en Supabase Dashboard con estos emails:
--    - carolina.soto@example.com (password: demo123456)
--    - carlos.soto@example.com (password: demo123456)
-- 2. Ejecuta este script completo

-- =====================================================
-- OBTENER IDs REALES DE LOS USUARIOS
-- =====================================================

-- Crear una tabla temporal para almacenar los IDs
CREATE TEMP TABLE temp_user_ids AS
SELECT
  CASE
    WHEN email = 'carolina.soto@example.com' THEN 'owner_id'
    WHEN email = 'carlos.soto@example.com' THEN 'tenant_id'
  END as user_type,
  id
FROM auth.users
WHERE email IN ('carolina.soto@example.com', 'carlos.soto@example.com');

-- =====================================================
-- 1. INSERTAR PERFILES USANDO IDs REALES
-- =====================================================

-- Crear tabla con IDs finales (existentes o nuevos)
CREATE TEMP TABLE final_user_ids AS
SELECT
  CASE
    WHEN t.user_type = 'owner_id' THEN 'owner_id'
    WHEN t.user_type = 'tenant_id' THEN 'tenant_id'
  END as user_type,
  COALESCE(p.id, t.id) as final_id
FROM temp_user_ids t
LEFT JOIN profiles p ON p.rut = CASE
  WHEN t.user_type = 'owner_id' THEN '15.123.456-7'
  WHEN t.user_type = 'tenant_id' THEN '33.333.333-3'
END;

-- Insertar o actualizar perfiles solo si no existen
INSERT INTO profiles (id, first_name, paternal_last_name, maternal_last_name, rut, email, phone, profession, marital_status, address_street, address_number, address_commune, address_region)
SELECT
  f.final_id,
  CASE WHEN f.user_type = 'owner_id' THEN 'Carolina' ELSE 'Carlos' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'Soto' ELSE 'Soto' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'Rojas' ELSE 'Vega' END,
  CASE WHEN f.user_type = 'owner_id' THEN '15.123.456-7' ELSE '33.333.333-3' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'carolina.soto@example.com' ELSE 'carlos.soto@example.com' END,
  CASE WHEN f.user_type = 'owner_id' THEN '+56912345678' ELSE '+56987654321' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'Profesora' ELSE 'Ingeniero' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'casado'::marital_status_enum ELSE 'soltero'::marital_status_enum END,
  CASE WHEN f.user_type = 'owner_id' THEN 'Eliodoro Yáñez' ELSE 'Los Leones' END,
  CASE WHEN f.user_type = 'owner_id' THEN '1890' ELSE '567' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'Providencia' ELSE 'Providencia' END,
  CASE WHEN f.user_type = 'owner_id' THEN 'Metropolitana' ELSE 'Metropolitana' END
FROM final_user_ids f
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.rut = CASE WHEN f.user_type = 'owner_id' THEN '15.123.456-7' ELSE '33.333.333-3' END
);

-- Actualizar perfiles existentes (sin cambiar IDs)
UPDATE profiles
SET
  first_name = CASE WHEN rut = '15.123.456-7' THEN 'Carolina' WHEN rut = '33.333.333-3' THEN 'Carlos' END,
  paternal_last_name = 'Soto',
  maternal_last_name = CASE WHEN rut = '15.123.456-7' THEN 'Rojas' WHEN rut = '33.333.333-3' THEN 'Vega' END,
  email = CASE WHEN rut = '15.123.456-7' THEN 'carolina.soto@example.com' WHEN rut = '33.333.333-3' THEN 'carlos.soto@example.com' END,
  phone = CASE WHEN rut = '15.123.456-7' THEN '+56912345678' WHEN rut = '33.333.333-3' THEN '+56987654321' END,
  profession = CASE WHEN rut = '15.123.456-7' THEN 'Profesora' WHEN rut = '33.333.333-3' THEN 'Ingeniero' END,
  marital_status = CASE WHEN rut = '15.123.456-7' THEN 'casado'::marital_status_enum WHEN rut = '33.333.333-3' THEN 'soltero'::marital_status_enum END,
  address_street = CASE WHEN rut = '15.123.456-7' THEN 'Eliodoro Yáñez' WHEN rut = '33.333.333-3' THEN 'Los Leones' END,
  address_number = CASE WHEN rut = '15.123.456-7' THEN '1890' WHEN rut = '33.333.333-3' THEN '567' END,
  address_commune = 'Providencia',
  address_region = 'Metropolitana'
WHERE rut IN ('15.123.456-7', '33.333.333-3');

-- =====================================================
-- 2. INSERTAR AVAL (GUARANTOR)
-- =====================================================

INSERT INTO guarantors (id, first_name, paternal_last_name, maternal_last_name, rut, profession, monthly_income_clp, address_street, address_number, address_department, address_commune, address_region)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Rodolfo', 'Rrrrrrrr', 'Mmmmmm', '44.444.444-4', 'Abogado', 3500000, 'Irarrazaval', '5350', '22', 'Ñuñoa', 'Metropolitana')

ON CONFLICT (rut) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  paternal_last_name = EXCLUDED.paternal_last_name,
  maternal_last_name = EXCLUDED.maternal_last_name,
  profession = EXCLUDED.profession,
  monthly_income_clp = EXCLUDED.monthly_income_clp,
  address_street = EXCLUDED.address_street,
  address_number = EXCLUDED.address_number,
  address_department = EXCLUDED.address_department,
  address_commune = EXCLUDED.address_commune,
  address_region = EXCLUDED.address_region;

-- =====================================================
-- 3. INSERTAR PROPIEDAD
-- =====================================================

INSERT INTO properties (
  id, owner_id, status, listing_type, address_street, address_number, address_department,
  address_commune, address_region, price_clp, common_expenses_clp, bedrooms, bathrooms,
  surface_m2, description
)
SELECT
  '550e8400-e29b-41d4-a716-446655440004',
  t.final_id, -- owner_id (usuario real)
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
FROM final_user_ids t
WHERE t.user_type = 'owner_id'

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

-- =====================================================
-- 4. INSERTAR APLICACIÓN (APPLICATION)
-- =====================================================

INSERT INTO applications (
  id, property_id, applicant_id, guarantor_id, status, message,
  -- Campos de snapshot del postulante
  snapshot_applicant_first_name, snapshot_applicant_paternal_last_name, snapshot_applicant_maternal_last_name,
  snapshot_applicant_rut, snapshot_applicant_email, snapshot_applicant_phone, snapshot_applicant_profession,
  snapshot_applicant_monthly_income_clp, snapshot_applicant_age, snapshot_applicant_nationality,
  snapshot_applicant_marital_status, snapshot_applicant_address_street, snapshot_applicant_address_number,
  snapshot_applicant_address_department, snapshot_applicant_address_commune, snapshot_applicant_address_region
)
SELECT
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440004', -- property_id
  t.final_id, -- applicant_id
  '550e8400-e29b-41d4-a716-446655440003', -- guarantor_id
  'aprobada',
  'Excelente postulante, recomendado por conocidos. Tiene ingresos estables y referencias positivas.',
  -- Snapshot data
  'Carlos', 'Soto', 'Vega', '33.333.333-3', 'carlos.soto@example.com', '+56987654321', 'Ingeniero',
  4500000, 35, 'Chilena', 'soltero', 'Los Leones', '567', NULL, 'Providencia', 'Metropolitana'
FROM final_user_ids t
WHERE t.user_type = 'tenant_id'

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

-- =====================================================
-- 5. INSERTAR CONTRATO DE ARRIENDO
-- =====================================================

INSERT INTO rental_contracts (
  id, application_id, status, contract_content,
  created_by, approved_by, notes
)
SELECT
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440005', -- application_id
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
  t.final_id, -- created_by (owner)
  t.final_id, -- approved_by (owner)
  'Contrato generado automáticamente para demostración del sistema de contratos.'
FROM final_user_ids t
WHERE t.user_type = 'owner_id'

ON CONFLICT (application_id) DO UPDATE SET
  status = EXCLUDED.status,
  contract_content = EXCLUDED.contract_content,
  created_by = EXCLUDED.created_by,
  approved_by = EXCLUDED.approved_by,
  notes = EXCLUDED.notes,
  approved_at = NOW();

-- =====================================================
-- 6. INSERTAR CLÁUSULAS DEL CONTRATO
-- =====================================================

DO $$
DECLARE
    contract_id_var UUID := '550e8400-e29b-41d4-a716-446655440006';
BEGIN

    -- Limpiar cláusulas existentes para este contrato
    DELETE FROM contract_clauses WHERE contract_id = contract_id_var;

    -- Insertar cláusulas del contrato
    INSERT INTO contract_clauses (contract_id, clause_type, content, sort_order) VALUES
    (contract_id_var, 'header', '## CONTRATO DE ARRENDAMIENTO RESIDENCIAL

En Santiago de Chile, a 29 de septiembre de 2025, comparecen:

**Carolina Andrea Soto Rojas**, con RUT N° 15.123.456-7, domiciliada en Eliodoro Yáñez 1890, Providencia, en adelante "el Arrendador"; y

**Carlos Alberto Soto Vega**, con RUT N° 33.333.333-3, domiciliado en Los Leones 567 Depto. 56, Providencia, en adelante "el Arrendatario".

Ambas partes convienen en celebrar el presente contrato de arrendamiento residencial, el que se regirá por las siguientes cláusulas.', 1),

    (contract_id_var, 'conditions', '## CLÁUSULA SEGUNDA: OBJETO

El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en Suecia 1234 Casa A, Providencia, con ROL de avalúo N° [ROL no especificado].

El inmueble arrendado se destina exclusivamente para fines residenciales, para la habitación del Arrendatario y su familia.

Se deja constancia que el inmueble no incluye estacionamiento ni bodega.

## CLÁUSULA TERCERA: RENTA

La renta mensual de arrendamiento será la suma de $1.600.000 (un millón seiscientos mil pesos chilenos).

El Arrendatario se obliga a pagar dicha suma por adelantado dentro de los primeros cinco (5) días de cada mes, en la forma y lugar que las partes convengan o determinen posteriormente.

## CLÁUSULA CUARTA: DURACIÓN

El presente contrato tendrá una duración de 12 meses a contar del 1 de octubre de 2025, pudiendo renovarse previo acuerdo expreso entre las partes.

El Arrendatario podrá poner término al contrato notificando al Arrendador con al menos 30 días de anticipación, en conformidad con la legislación vigente.

Asimismo, el Arrendador podrá poner término conforme a los plazos y causales legales aplicables.', 2),

    (contract_id_var, 'obligations', '## CLÁUSULA QUINTA: GARANTÍA, AVAL Y CODEUDOR SOLIDARIO

Para garantía del fiel cumplimiento de todas las obligaciones emanadas del presente contrato, comparece y se constituye en aval y codeudor solidario:

**Don Rodolfo Rrrrrrrr Mmmmmm**, con RUT N° 44.444.444-4, domiciliado en Irarrazaval 5350 Depto. 22, Ñuñoa, quien responde solidariamente con el Arrendatario por todas las obligaciones presentes y futuras derivadas del presente contrato.

## OBLIGACIONES DEL ARRENDATARIO
- Pagar puntualmente la renta y gastos comunes
- Mantener el inmueble en buen estado
- Permitir inspecciones con previo aviso
- No subarrendar sin autorización

## OBLIGACIONES DEL ARRENDADOR
- Entregar el inmueble en perfectas condiciones
- Realizar reparaciones necesarias
- Respetar el uso pacífico del inmueble
- Cumplir con las normativas vigentes', 3),

    (contract_id_var, 'termination', '## CLÁUSULA DE TERMINACIÓN

El contrato podrá terminarse por:

1. **Mutuo acuerdo** entre las partes
2. **Incumplimiento** de cualquiera de las obligaciones contractuales
3. **Necesidades propias** del arrendador (con preaviso de 90 días)
4. **Pérdida del empleo** del arrendatario (con preaviso de 60 días)

En caso de terminación anticipada, se aplicarán las multas correspondientes según la legislación vigente.

## LEGISLACIÓN APLICABLE

Este contrato se rige por las disposiciones de la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos y demás normas complementarias.', 4),

    (contract_id_var, 'signatures', '## ESPACIOS PARA FIRMAS

Firmado en dos ejemplares de un mismo tenor y a un solo efecto, en Santiago de Chile a 29 de septiembre de 2025.

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
AVAL Y CODEUDOR SOLIDARIO', 5);

END $$;

-- =====================================================
-- 7. INSERTAR CONDICIONES DEL CONTRATO
-- =====================================================

INSERT INTO rental_contract_conditions (
  application_id, lease_term_months, payment_day, final_price_clp, broker_commission_clp,
  guarantee_amount_clp, official_communication_email, accepts_pets, dicom_clause, additional_conditions
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005', -- application_id
   12,     -- lease_term_months
   5,      -- payment_day (primeros 5 días del mes)
   1600000, -- final_price_clp (renta mensual)
   0,      -- broker_commission_clp (sin corredor)
   3200000, -- guarantee_amount_clp (2 meses de garantía)
   'carlos.soto@example.com', -- official_communication_email
   false,  -- accepts_pets
   true,   -- dicom_clause
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
-- LIMPIEZA: Eliminar tabla temporal
-- =====================================================

DROP TABLE temp_user_ids;
DROP TABLE final_user_ids;

-- =====================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================

SELECT
  'Perfiles procesados:' as info,
  COUNT(*) as count
FROM profiles
WHERE email IN ('carolina.soto@example.com', 'carlos.soto@example.com')

UNION ALL

SELECT
  'Aval insertado:',
  COUNT(*)
FROM guarantors
WHERE rut = '44.444.444-4'

UNION ALL

SELECT
  'Propiedad insertada:',
  COUNT(*)
FROM properties
WHERE id = '550e8400-e29b-41d4-a716-446655440004'

UNION ALL

SELECT
  'Aplicación insertada:',
  COUNT(*)
FROM applications
WHERE id = '550e8400-e29b-41d4-a716-446655440005'

UNION ALL

SELECT
  'Contrato insertado:',
  COUNT(*)
FROM rental_contracts
WHERE id = '550e8400-e29b-41d4-a716-446655440006'

UNION ALL

SELECT
  'Cláusulas del contrato:',
  COUNT(*)
FROM contract_clauses
WHERE contract_id = '550e8400-e29b-41d4-a716-446655440006'

UNION ALL

SELECT
  'Condiciones del contrato:',
  COUNT(*)
FROM rental_contract_conditions
WHERE application_id = '550e8400-e29b-41d4-a716-446655440005';
