-- =====================================================
-- EJEMPLO COMPLETO: N8N con Rental & Sale Owners
-- =====================================================

-- Ahora las funciones incluyen datos completos de propietarios específicos
-- para alquileres y ventas, además de los datos de garantes.

-- =====================================================
-- EJEMPLO 1: Consulta completa con propietarios específicos
-- =====================================================

-- Para una propiedad en alquiler:
SELECT
  -- Datos de la aplicación
  application_id,
  application_characteristic_id,
  application_status,

  -- Datos de la propiedad
  property_listing_type,
  property_address_street,
  property_address_number,
  property_address_commune,

  -- Datos del PROPIETARIO ESPECÍFICO DE ALQUILER
  rental_owner_full_name,
  rental_owner_rut,
  rental_owner_email,
  rental_owner_phone,
  rental_owner_marital_status,
  rental_owner_property_regime,
  rental_owner_full_address as rental_owner_address,

  -- Datos del arrendatario (postulante)
  applicant_full_name,
  applicant_rut,
  applicant_email,
  applicant_phone,
  applicant_monthly_income_clp,
  applicant_full_address,

  -- Datos del garante (si existe)
  guarantor_full_name,
  guarantor_rut,
  guarantor_profession,
  guarantor_monthly_income_clp,
  guarantor_full_address,

  -- Documentos e imágenes
  property_images,
  application_documents,
  property_documents

FROM get_contract_data_by_characteristic_ids(
  'APP_1704067200_b2c3d4e5',    -- application_characteristic_id
  'PROP_1704067200_a1b2c3d4',   -- property_characteristic_id
  'GUAR_1704067200_c3d4e5f6'    -- guarantor_characteristic_id (opcional)
);

-- =====================================================
-- EJEMPLO 2: Para propiedad en venta
-- =====================================================

SELECT
  -- Para ventas, usa sale_owner data
  sale_owner_full_name,
  sale_owner_rut,
  sale_owner_email,
  sale_owner_marital_status,
  sale_owner_property_regime,

  -- Offer data (si existe)
  offer_amount_clp,
  offer_message,

  -- Resto de datos igual...
  property_listing_type,
  applicant_full_name,
  property_images

FROM get_contract_data_by_characteristic_ids(
  'APP_1704067200_x7y8z9w0',    -- application_characteristic_id
  'PROP_1704067200_v5w6x7y8',   -- property_characteristic_id
  NULL                          -- sin garante
);

-- =====================================================
-- EJEMPLO 3: Generación automática de contrato de arriendo
-- =====================================================

-- N8N puede usar esta consulta para generar contratos automáticamente:
WITH contract_data AS (
  SELECT * FROM get_contract_data_by_characteristic_ids(
    '{{ $json.application_characteristic_id }}',
    '{{ $json.property_characteristic_id }}',
    '{{ $json.guarantor_characteristic_id }}'
  )
)
SELECT
  -- Determinar el propietario correcto basado en el tipo de propiedad
  CASE
    WHEN property_listing_type = 'arriendo' THEN
      json_build_object(
        'tipo', 'rental_owner',
        'nombre_completo', rental_owner_full_name,
        'rut', rental_owner_rut,
        'email', rental_owner_email,
        'telefono', rental_owner_phone,
        'estado_civil', rental_owner_marital_status,
        'regimen_matrimonial', rental_owner_property_regime,
        'direccion_completa', rental_owner_full_address
      )
    WHEN property_listing_type = 'venta' THEN
      json_build_object(
        'tipo', 'sale_owner',
        'nombre_completo', sale_owner_full_name,
        'rut', sale_owner_rut,
        'email', sale_owner_email,
        'telefono', sale_owner_phone,
        'estado_civil', sale_owner_marital_status,
        'regimen_matrimonial', sale_owner_property_regime,
        'direccion_completa', sale_owner_full_address
      )
    ELSE
      json_build_object(
        'tipo', 'profile_owner',
        'nombre_completo', owner_full_name,
        'rut', owner_rut,
        'email', owner_email,
        'telefono', owner_phone,
        'profesion', owner_profession
      )
  END as propietario,

  -- Arrendatario (siempre igual)
  json_build_object(
    'nombre_completo', applicant_full_name,
    'rut', applicant_rut,
    'email', applicant_email,
    'telefono', applicant_phone,
    'profesion', applicant_profession,
    'ingresos_mensuales', applicant_monthly_income_clp,
    'estado_civil', applicant_marital_status,
    'regimen_matrimonial', applicant_property_regime,
    'direccion_completa', applicant_full_address
  ) as arrendatario,

  -- Garante (si existe)
  CASE WHEN guarantor_id IS NOT NULL THEN
    json_build_object(
      'nombre_completo', guarantor_full_name,
      'rut', guarantor_rut,
      'profesion', guarantor_profession,
      'ingresos_mensuales', guarantor_monthly_income_clp,
      'direccion_completa', guarantor_full_address
    )
  ELSE NULL END as garante,

  -- Propiedad
  json_build_object(
    'direccion_completa', property_full_address,
    'precio_arriendo', property_price_clp,
    'gastos_comunes', property_common_expenses_clp,
    'dormitorios', property_bedrooms,
    'banos', property_bathrooms,
    'superficie', property_surface_m2,
    'tipo_propiedad', property_listing_type,
    'descripcion', property_description,
    'imagenes', property_images
  ) as propiedad,

  -- Metadata del contrato
  json_build_object(
    'fecha_aprobacion', application_created_at,
    'id_aplicacion', application_characteristic_id,
    'id_propiedad', property_characteristic_id,
    'estado_aplicacion', application_status,
    'tipo_contrato', CASE
      WHEN property_listing_type = 'arriendo' THEN 'CONTRATO DE ARRIENDO'
      WHEN property_listing_type = 'venta' THEN 'PROMESA DE COMPRAVENTA'
      ELSE 'CONTRATO INDEFINIDO'
    END
  ) as metadata_contrato

FROM contract_data;

-- =====================================================
-- EJEMPLO 4: Workflow N8N Optimizado
-- =====================================================

/*
Configuración recomendada para N8N:

1. **Webhook Trigger**:
   - Recibe: application_characteristic_id, property_characteristic_id, guarantor_characteristic_id
   - Formato: {"application_characteristic_id": "APP_...", "property_characteristic_id": "PROP_...", "guarantor_characteristic_id": "GUAR_..."}

2. **PostgreSQL Query Node**:
   ```sql
   SELECT * FROM get_contract_data_by_characteristic_ids(
     '{{ $json.application_characteristic_id }}',
     '{{ $json.property_characteristic_id }}',
     '{{ $json.guarantor_characteristic_id }}'
   );
   ```

3. **Switch Node** (basado en property_listing_type):
   - Si "arriendo" → Usar rental_owner_* campos
   - Si "venta" → Usar sale_owner_* campos
   - Default → Usar owner_* campos (backward compatibility)

4. **Document Generation Node**:
   - Usar campos específicos del propietario según el tipo
   - Incluir datos completos del garante si existe
   - Generar contrato apropiado (arriendo vs venta)

5. **Email/Signature Nodes**:
   - Enviar a propietario correcto (rental_owner o sale_owner)
   - Incluir garante en copia si existe

Beneficios:
- ✅ **Propietarios específicos** por tipo de propiedad
- ✅ **Datos legales completos** (estado civil, régimen matrimonial)
- ✅ **Direcciones completas** de todos los involucrados
- ✅ **Garante opcional** pero completo cuando existe
- ✅ **Un solo query** obtiene TODO lo necesario
*/

-- =====================================================
-- EJEMPLO 5: Verificación de datos disponibles
-- =====================================================

-- Ver qué tipos de propietarios tienes en tu base de datos:
SELECT
  p.listing_type,
  COUNT(*) as propiedades,
  COUNT(ro.id) as rental_owners,
  COUNT(so.id) as sale_owners,
  COUNT(CASE WHEN ro.id IS NULL AND so.id IS NULL THEN 1 END) as sin_owner_especifico
FROM properties p
LEFT JOIN rental_owners ro ON p.id = ro.property_id
LEFT JOIN sale_owners so ON p.id = so.property_id
GROUP BY p.listing_type;

-- Ver aplicaciones con garantes:
SELECT
  COUNT(*) as total_applications,
  COUNT(g.id) as with_guarantors,
  COUNT(CASE WHEN g.id IS NULL THEN 1 END) as without_guarantors
FROM applications a
LEFT JOIN guarantors g ON a.guarantor_id = g.id;

-- =====================================================
-- EJEMPLO 6: Testing con datos reales
-- =====================================================

-- Si tienes aplicaciones aprobadas, prueba con una real:
SELECT application_characteristic_id
FROM applications
WHERE status = 'aprobada'
LIMIT 1;

-- Luego usa ese ID:
-- SELECT * FROM get_contract_data_by_characteristic_ids('TU_ID_REAL_AQUI');

-- =====================================================
-- ¡AHORA N8N TIENE ACCESO COMPLETO!
-- =====================================================

/*
✅ **Datos de propietarios específicos**:
   - rental_owners para propiedades en arriendo
   - sale_owners para propiedades en venta
   - Información legal completa (estado civil, régimen matrimonial)
   - Direcciones completas de contacto

✅ **Datos de garantes**:
   - Información completa cuando existe garante
   - Null cuando no hay garante
   - Datos económicos y de contacto

✅ **Un solo query** obtiene TODO para el contrato:
   - Propietario correcto según tipo de propiedad
   - Arrendatario con datos económicos
   - Garante opcional pero completo
   - Propiedad con imágenes y documentos
   - Metadata del contrato

¡Tu automatización de contratos de arriendo ahora está 100% completa! 🎉
*/
