-- =====================================================
-- CONTRATO DE DEMOSTRACIÓN - VERSIÓN FINAL ULTRA SIMPLE
-- =====================================================

-- INSTRUCCIONES:
-- 1. Crea estos usuarios en Supabase Auth (si no existen):
--    - carolina.soto@example.com / password: demo123456
--    - carlos.soto@example.com / password: demo123456
--
-- 2. Obtén sus IDs reales ejecutando:
--    SELECT id, email FROM auth.users WHERE email LIKE '%@example.com';
--
-- 3. Reemplaza los IDs en las líneas marcadas con [REEMPLAZA_ID_AQUI]
--    con los IDs reales que obtuviste
--
-- 4. Ejecuta todo el script de una vez

-- =====================================================
-- IDs QUE DEBES REEMPLAZAR (obtenlos de auth.users)
-- =====================================================

-- Reemplaza estos valores con los IDs reales de auth.users:
-- Ejemplo: Si obtuviste 'abc123-def456-ghi789' para carolina.soto@example.com,
-- reemplaza '[ID_CAROLINA]' con 'abc123-def456-ghi789'

-- IDs de ejemplo (reemplaza con IDs reales si es necesario):
-- ID de Carolina Soto (arrendadora): 12345678-1234-1234-1234-123456789abc
-- ID de Carlos Soto (arrendatario): 87654321-4321-4321-4321-cba987654321

-- =====================================================
-- 1. INSERTAR PERFILES (reemplaza los IDs)
-- =====================================================

-- Perfil de Carolina (arrendadora)
INSERT INTO profiles (id, first_name, paternal_last_name, maternal_last_name, rut, email, phone, profession, marital_status, address_street, address_number, address_commune, address_region)
VALUES
  ('[ID_CAROLINA]', 'Carolina', 'Soto', 'Rojas', '15.123.456-7', 'carolina.soto@example.com', '+56912345678', 'Profesora', 'casado', 'Eliodoro Yáñez', '1890', 'Providencia', 'Metropolitana');

-- Perfil de Carlos (arrendatario)
INSERT INTO profiles (id, first_name, paternal_last_name, maternal_last_name, rut, email, phone, profession, marital_status, address_street, address_number, address_commune, address_region)
VALUES
  ('[ID_CARLOS]', 'Carlos', 'Soto', 'Vega', '33.333.333-3', 'carlos.soto@example.com', '+56987654321', 'Ingeniero', 'soltero', 'Los Leones', '567', 'Providencia', 'Metropolitana');

-- =====================================================
-- 2. INSERTAR AVAL
-- =====================================================

INSERT INTO guarantors (id, first_name, paternal_last_name, maternal_last_name, rut, profession, monthly_income_clp, address_street, address_number, address_department, address_commune, address_region)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Rodolfo', 'Rrrrrrrr', 'Mmmmmm', '44.444.444-4', 'Abogado', 3500000, 'Irarrazaval', '5350', '22', 'Ñuñoa', 'Metropolitana');

-- =====================================================
-- 3. INSERTAR PROPIEDAD
-- =====================================================

INSERT INTO properties (
  id, owner_id, status, listing_type, address_street, address_number, address_department,
  address_commune, address_region, price_clp, common_expenses_clp, bedrooms, bathrooms,
  surface_m2, description
)
VALUES
  ('550e8400-e29b-41d4-a716-446655440004',
   '[ID_CAROLINA]', -- owner_id
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
  );

-- =====================================================
-- 4. INSERTAR APLICACIÓN
-- =====================================================

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
   '[ID_CARLOS]', -- applicant_id
   '550e8400-e29b-41d4-a716-446655440003', -- guarantor_id
   'aprobada',
   'Excelente postulante, recomendado por conocidos. Tiene ingresos estables y referencias positivas.',
   'Carlos', 'Soto', 'Vega', '33.333.333-3', 'carlos.soto@example.com', '+56987654321', 'Ingeniero',
   4500000, 35, 'Chilena', 'soltero', 'Los Leones', '567', NULL, 'Providencia', 'Metropolitana'
  );

-- =====================================================
-- 5. INSERTAR CONTRATO
-- =====================================================

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
  '[ID_CAROLINA]', -- created_by
  '[ID_CAROLINA]', -- approved_by
   'Contrato generado automáticamente para demostración del sistema de contratos.'
  );

-- =====================================================
-- 6. INSERTAR CLÁUSULAS DEL CONTRATO
-- =====================================================

DO $$
DECLARE
    contract_id_var UUID := '550e8400-e29b-41d4-a716-446655440006';
BEGIN

    DELETE FROM contract_clauses WHERE contract_id = contract_id_var;

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
  ('550e8400-e29b-41d4-a716-446655440005',
   12, 5, 1600000, 0, 3200000, 'carlos.soto@example.com', false, true,
   'El arrendatario se compromete a mantener el jardín en buen estado. No se permiten mascotas sin autorización expresa del arrendador.'
  );

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT
  '✅ Perfiles:' as status,
  COUNT(*) as total
FROM profiles
WHERE email LIKE '%@example.com'

UNION ALL

SELECT '✅ Aval:', COUNT(*) FROM guarantors WHERE rut = '44.444.444-4'
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
