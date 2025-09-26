-- =====================================================
-- EJEMPLO DE USO DE FUNCIONES OPTIMIZADAS PARA N8N
-- =====================================================

-- Este archivo muestra cómo N8N puede obtener datos completos de contratos
-- de manera eficiente usando las nuevas funciones optimizadas.

-- =====================================================
-- EJEMPLO 1: Obtener datos de contrato usando Characteristic IDs
-- =====================================================

-- N8N recibe estos IDs del webhook:
-- application_characteristic_id: 'APP_1704067200_b2c3d4e5'
-- property_characteristic_id: 'PROP_1704067200_a1b2c3d4'
-- guarantor_characteristic_id: 'GUAR_1704067200_c3d4e5f6' (opcional)

-- Consulta optimizada que N8N puede ejecutar:
SELECT * FROM get_contract_data_by_characteristic_ids(
  'APP_1704067200_b2c3d4e5',     -- application_characteristic_id
  'PROP_1704067200_a1b2c3d4',    -- property_characteristic_id (opcional)
  'GUAR_1704067200_c3d4e5f6'    -- guarantor_characteristic_id (opcional)
);

-- =====================================================
-- EJEMPLO 2: Obtener datos de contrato usando UUIDs (fallback)
-- =====================================================

-- Si N8N necesita usar UUIDs por alguna razón:
SELECT * FROM get_contract_data_by_uuids(
  '123e4567-e89b-12d3-a456-426614174000', -- application_id
  '456e7890-e89b-12d3-a456-426614174001', -- property_id (opcional)
  '789e0123-e89b-12d3-a456-426614174002'  -- guarantor_id (opcional)
);

-- =====================================================
-- EJEMPLO 3: Vista rápida para contratos aprobados
-- =====================================================

-- Vista pre-filtrada para contratos aprobados (más rápida para listados):
SELECT * FROM contract_data_view
WHERE application_characteristic_id = 'APP_1704067200_b2c3d4e5';

-- =====================================================
-- EJEMPLO 4: Búsqueda eficiente por diferentes criterios
-- =====================================================

-- Buscar por application_characteristic_id (índice optimizado):
SELECT
  application_id,
  property_full_address,
  owner_full_name,
  applicant_full_name,
  guarantor_full_name
FROM contract_data_view
WHERE application_characteristic_id LIKE 'APP_1704067200_%';

-- Buscar por property_characteristic_id:
SELECT * FROM contract_data_view
WHERE property_characteristic_id = 'PROP_1704067200_a1b2c3d4';

-- =====================================================
-- EJEMPLO 5: Generación automática de contrato de arriendo
-- =====================================================

-- Query que N8N puede usar para generar el contrato automáticamente:
WITH contract_data AS (
  SELECT * FROM get_contract_data_by_characteristic_ids(
    'APP_1704067200_b2c3d4e5',
    'PROP_1704067200_a1b2c3d4',
    'GUAR_1704067200_c3d4e5f6'
  )
)
SELECT
  -- Datos del propietario
  json_build_object(
    'nombre_completo', owner_first_name || ' ' || owner_paternal_last_name || ' ' || COALESCE(owner_maternal_last_name, ''),
    'rut', owner_rut,
    'email', owner_email,
    'telefono', owner_phone
  ) as propietario,

  -- Datos del arrendatario (postulante aprobado)
  json_build_object(
    'nombre_completo', applicant_first_name || ' ' || applicant_paternal_last_name || ' ' || COALESCE(applicant_maternal_last_name, ''),
    'rut', applicant_rut,
    'email', applicant_email,
    'telefono', applicant_phone,
    'estado_civil', applicant_marital_status,
    'regimen_matrimonial', applicant_property_regime,
    'ingresos_mensuales', applicant_monthly_income_clp,
    'direccion_completa', applicant_full_address
  ) as arrendatario,

  -- Datos del aval (si existe)
  CASE WHEN guarantor_id IS NOT NULL THEN
    json_build_object(
      'nombre_completo', guarantor_first_name || ' ' || guarantor_paternal_last_name || ' ' || COALESCE(guarantor_maternal_last_name, ''),
      'rut', guarantor_rut,
      'profesion', guarantor_profession,
      'ingresos_mensuales', guarantor_monthly_income_clp,
      'direccion_completa', guarantor_full_address
    )
  ELSE NULL END as aval,

  -- Datos de la propiedad
  json_build_object(
    'direccion_completa', property_address_street || ' ' || property_address_number ||
                         CASE WHEN property_address_department IS NOT NULL THEN ' Depto. ' || property_address_department ELSE '' END ||
                         ', ' || property_address_commune || ', ' || property_address_region,
    'precio_arriendo', property_price_clp,
    'gastos_comunes', property_common_expenses_clp,
    'dormitorios', property_bedrooms,
    'banos', property_bathrooms,
    'superficie', property_surface_m2,
    'tipo_propiedad', property_listing_type,
    'descripcion', property_description,
    'imagenes', property_images
  ) as propiedad,

  -- Documentos asociados
  json_build_object(
    'documentos_propiedad', property_documents,
    'documentos_postulante', application_documents
  ) as documentos,

  -- Metadata del contrato
  json_build_object(
    'fecha_aprobacion', application_created_at,
    'id_aplicacion', application_characteristic_id,
    'id_propiedad', property_characteristic_id,
    'estado_aplicacion', application_status
  ) as metadata_contrato

FROM contract_data;

-- =====================================================
-- EJEMPLO 6: Optimización de costos - Comparación
-- =====================================================

-- Consulta antigua (múltiples queries separadas - COSTOSA):
-- 1. SELECT * FROM applications WHERE id = 'uuid'
-- 2. SELECT * FROM properties WHERE id = 'uuid'
-- 3. SELECT * FROM profiles WHERE id = 'uuid' (owner)
-- 4. SELECT * FROM profiles WHERE id = 'uuid' (applicant)
-- 5. SELECT * FROM guarantors WHERE id = 'uuid' (opcional)
-- 6. SELECT * FROM property_images WHERE property_id = 'uuid'
-- 7. SELECT * FROM documents WHERE related_entity_id = 'uuid'
-- = 7 queries separadas

-- Consulta nueva (una sola query optimizada - ECONÓMICA):
-- SELECT * FROM get_contract_data_by_characteristic_ids('APP_...', 'PROP_...', 'GUAR_...')
-- = 1 query optimizada con índices específicos

-- =====================================================
-- EJEMPLO 7: Monitoreo de performance
-- =====================================================

-- Verificar que los índices están siendo usados correctamente:
EXPLAIN ANALYZE
SELECT * FROM get_contract_data_by_characteristic_ids(
  'APP_1704067200_b2c3d4e5',
  'PROP_1704067200_a1b2c3d4',
  NULL
);

-- Verificar estadísticas de uso de índices:
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('applications', 'properties', 'guarantors')
AND attname LIKE '%characteristic_id'
ORDER BY tablename, attname;

-- =====================================================
-- CONFIGURACIÓN RECOMENDADA PARA N8N
-- =====================================================

/*
Configuración recomendada para N8N:

1. Webhook Trigger:
   - Recibe: application_characteristic_id, property_characteristic_id, guarantor_characteristic_id
   - Método: GET (compatible con Railway)

2. PostgreSQL Query Node:
   ```sql
   SELECT * FROM get_contract_data_by_characteristic_ids(
     '{{ $json.application_characteristic_id }}',
     '{{ $json.property_characteristic_id }}',
     '{{ $json.guarantor_characteristic_id }}'
   );
   ```

3. Document Generation Node:
   - Usar los campos JSON retornados para popular plantillas de contrato
   - Imágenes disponibles en el array property_images
   - Documentos disponibles en application_documents y property_documents

4. Error Handling:
   - Si characteristic_id no existe, usar fallback con UUIDs
   - get_contract_data_by_uuids() como función alternativa

Beneficios:
- ✅ Una sola query obtiene todos los datos necesarios
- ✅ Índices optimizados reducen costos de búsqueda
- ✅ Estructura JSON facilita el mapeo en N8N
- ✅ Compatible con Railway (GET requests)
- ✅ Fallback automático si faltan characteristic_ids
*/
