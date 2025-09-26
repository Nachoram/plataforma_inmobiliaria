-- =====================================================
-- FLUJO COMPLETO DE IDs EN WEBHOOK PARA N8N
-- =====================================================

/*
Este documento explica exactamente qué IDs se envían en el webhook
cuando se aprueba una postulación de arriendo, y cómo N8N debe usarlos.
*/

-- =====================================================
-- 1. ESTRUCTURA DE DATOS ENVIADA POR EL WEBHOOK
-- =====================================================

/*
Cuando se aprueba una aplicación, el webhook envía esta estructura a N8N:

{
  "application_characteristic_id": "APP_1704067200_b2c3d4e5",  // ID único de la aplicación
  "property_characteristic_id": "PROP_1704067200_a1b2c3d4",   // ID único de la propiedad
  "applicant_characteristic_id": "uuid-del-applicant",        // UUID (no tiene characteristic_id)
  "owner_characteristic_id": "RENTAL_OWNER_1704067200_xyz",   // ID específico según tipo
  "guarantor_characteristic_id": "GUAR_1704067200_c3d4e5f6",  // ID único del garante (si existe)
  "action": "application_approved",
  "timestamp": "2024-01-01T12:00:00.000Z",

  // Fallback con UUIDs por compatibilidad
  "application_uuid": "uuid-de-la-aplicacion",
  "property_uuid": "uuid-de-la-propiedad",
  "applicant_uuid": "uuid-del-applicant",
  "owner_uuid": "uuid-del-owner",
  "guarantor_uuid": "uuid-del-garante"
}
*/

-- =====================================================
-- 2. LÓGICA DE SELECCIÓN DE OWNER_CHARACTERISTIC_ID
-- =====================================================

/*
El frontend determina qué owner_characteristic_id enviar basado en:

1. Tipo de propiedad (listing_type):
   - 'arriendo' → usa rental_owner_characteristic_id
   - 'venta' → usa sale_owner_characteristic_id
   - otros → usa owner_id (UUID)

2. Disponibilidad de datos:
   - Si existe rental_owner con characteristic_id → usar ese
   - Si existe sale_owner con characteristic_id → usar ese
   - Si no existe ninguno → usar owner_id (UUID del perfil)
*/

-- Ejemplo de lógica en el frontend:
DO $$
BEGIN
    RAISE NOTICE '📋 LÓGICA DE SELECCIÓN DE OWNER_CHARACTERISTIC_ID:';
    RAISE NOTICE '';
    RAISE NOTICE '1. SI property.listing_type = "arriendo" Y existe rental_owner_characteristic_id:';
    RAISE NOTICE '   → owner_characteristic_id = rental_owner_characteristic_id';
    RAISE NOTICE '';
    RAISE NOTICE '2. SI property.listing_type = "venta" Y existe sale_owner_characteristic_id:';
    RAISE NOTICE '   → owner_characteristic_id = sale_owner_characteristic_id';
    RAISE NOTICE '';
    RAISE NOTICE '3. SI NO existe characteristic_id específico:';
    RAISE NOTICE '   → owner_characteristic_id = owner_id (UUID del perfil)');
    RAISE NOTICE '';
END $$;

-- =====================================================
-- 3. CÓMO N8N DEBE USAR ESTOS IDs
-- =====================================================

/*
N8N debe usar esta consulta para obtener TODOS los datos del contrato:
*/

SELECT * FROM get_contract_data_by_characteristic_ids(
  '{{ $json.application_characteristic_id }}',  -- ID único de la aplicación
  '{{ $json.property_characteristic_id }}',     -- ID único de la propiedad
  '{{ $json.guarantor_characteristic_id }}'     -- ID único del garante (puede ser null)
);

-- =====================================================
-- 4. DATOS QUE N8N RECIBE DE LA CONSULTA
-- =====================================================

/*
La función devuelve TODOS estos datos estructurados:

📋 APLICACIÓN:
- application_id, application_characteristic_id, application_status
- application_message, application_created_at

🏠 PROPIEDAD:
- property_id, property_characteristic_id, property_full_address
- property_price_clp, property_listing_type, property_bedrooms, etc.
- property_images (array JSON)

👤 PROPIETARIO (según tipo):
- Para arriendos: rental_owner_full_name, rental_owner_rut, rental_owner_email, etc.
- Para ventas: sale_owner_full_name, sale_owner_rut, sale_owner_email, etc.
- Información legal completa (estado civil, régimen matrimonial)

👨‍💼 ARRENDATARIO:
- applicant_full_name, applicant_rut, applicant_email, applicant_phone
- applicant_profession, applicant_monthly_income_clp, applicant_full_address
- applicant_marital_status, applicant_property_regime

🤝 GARANTE (opcional):
- guarantor_full_name, guarantor_rut, guarantor_profession
- guarantor_monthly_income_clp, guarantor_full_address

📄 DOCUMENTOS:
- application_documents (documentos del applicant)
- property_documents (documentos legales de la propiedad)
*/

-- =====================================================
-- 5. EJEMPLOS DE USO EN N8N
-- =====================================================

-- Ejemplo 1: Contrato de arriendo con garante
DO $$
BEGIN
    RAISE NOTICE '🏠 EJEMPLO 1: CONTRATO DE ARRIENDO CON GARANTE';
    RAISE NOTICE 'Webhook recibe:';
    RAISE NOTICE '  - application_characteristic_id: APP_1704067200_b2c3d4e5';
    RAISE NOTICE '  - property_characteristic_id: PROP_1704067200_a1b2c3d4';
    RAISE NOTICE '  - owner_characteristic_id: RENTAL_OWNER_1704067200_xyz';
    RAISE NOTICE '  - guarantor_characteristic_id: GUAR_1704067200_c3d4e5f6';
    RAISE NOTICE '';
    RAISE NOTICE 'N8N obtiene datos completos para generar contrato con:';
    RAISE NOTICE '  ✅ Propietario específico de arriendo';
    RAISE NOTICE '  ✅ Arrendatario con ingresos económicos';
    RAISE NOTICE '  ✅ Garante con información financiera';
    RAISE NOTICE '  ✅ Propiedad con imágenes y documentos';
END $$;

-- Ejemplo 2: Venta sin garante
DO $$
BEGIN
    RAISE NOTICE '🏠 EJEMPLO 2: VENTA SIN GARANTE';
    RAISE NOTICE 'Webhook recibe:';
    RAISE NOTICE '  - application_characteristic_id: APP_1704067200_x7y8z9w0';
    RAISE NOTICE '  - property_characteristic_id: PROP_1704067200_v5w6x7y8';
    RAISE NOTICE '  - owner_characteristic_id: SALE_OWNER_1704067200_abc';
    RAISE NOTICE '  - guarantor_characteristic_id: null';
    RAISE NOTICE '';
    RAISE NOTICE 'N8N obtiene datos completos para promesa de compraventa con:';
    RAISE NOTICE '  ✅ Propietario específico de venta';
    RAISE NOTICE '  ✅ Comprador (sin garante)';
    RAISE NOTICE '  ✅ Propiedad con documentos legales';
END $$;

-- =====================================================
-- 6. FALLBACK PARA COMPATIBILIDAD
-- =====================================================

/*
Si N8N necesita usar UUIDs por alguna razón, el webhook también envía:

application_uuid, property_uuid, applicant_uuid, owner_uuid, guarantor_uuid

Para usar con la función alternativa:
*/

SELECT * FROM get_contract_data_by_uuids(
  '{{ $json.application_uuid }}',
  '{{ $json.property_uuid }}',
  '{{ $json.guarantor_uuid }}'
);

-- =====================================================
-- 7. VERIFICACIÓN DE FUNCIONAMIENTO
-- =====================================================

-- Verificar que las funciones existen y funcionan
DO $$
DECLARE
    func_count integer := 0;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('get_contract_data_by_characteristic_ids', 'get_contract_data_by_uuids');

    IF func_count = 2 THEN
        RAISE NOTICE '✅ FUNCIONES OPTIMIZADAS DISPONIBLES PARA N8N';
    ELSE
        RAISE NOTICE '❌ FALTAN FUNCIONES OPTIMIZADAS');
    END IF;
END $$;

-- Verificar que los characteristic_id están disponibles
DO $$
DECLARE
    app_count integer := 0;
    prop_count integer := 0;
    owner_count integer := 0;
    guarantor_count integer := 0;
BEGIN
    SELECT COUNT(*) INTO app_count FROM applications WHERE application_characteristic_id IS NOT NULL;
    SELECT COUNT(*) INTO prop_count FROM properties WHERE property_characteristic_id IS NOT NULL;
    SELECT COUNT(*) INTO owner_count FROM rental_owners WHERE rental_owner_characteristic_id IS NOT NULL;
    SELECT COUNT(*) INTO guarantor_count FROM guarantors WHERE guarantor_characteristic_id IS NOT NULL;

    RAISE NOTICE '📊 REGISTROS CON CHARACTERISTIC_ID:';
    RAISE NOTICE '  - Aplicaciones: %', app_count;
    RAISE NOTICE '  - Propiedades: %', prop_count;
    RAISE NOTICE '  - Propietarios: %', owner_count;
    RAISE NOTICE '  - Garantes: %', guarantor_count;
END $$;

-- =====================================================
-- 🎯 RESUMEN EJECUTIVO
-- =====================================================

/*
✅ WEBHOOK ENVÍA:
   - application_characteristic_id (único por aplicación)
   - property_characteristic_id (único por propiedad)
   - owner_characteristic_id (específico: rental/sale owner)
   - guarantor_characteristic_id (único por garante)
   - Fallback con UUIDs por compatibilidad

✅ N8N CONSULTA:
   SELECT * FROM get_contract_data_by_characteristic_ids(
     application_id, property_id, guarantor_id
   );

✅ N8N RECIBE:
   - Datos completos del propietario específico
   - Información legal completa
   - Datos económicos del arrendatario y garante
   - Imágenes y documentos de la propiedad
   - Todo lo necesario para generar contratos automáticamente

🚀 ¡FLUJO COMPLETO OPTIMIZADO PARA AUTOMATIZACIÓN!
*/
