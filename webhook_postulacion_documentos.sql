-- WEBHOOK PARA POSTULACIONES - ENVÍO DE DOCUMENTOS AL WEBHOOK
-- Se ejecuta automáticamente cuando se crea una nueva postulación

-- =====================================================
-- FUNCIÓN PARA ENVIAR WEBHOOK DE POSTULACIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION send_application_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT := 'https://producción-primaria-bafdc.up.railway.app/prueba-de-webhook/8bde2b16-4ff9-41ec-aa62-95f5f289e41d';
  application_data JSONB;
  documents_data JSONB;
  guarantor_documents_data JSONB;
  payload JSONB;
BEGIN
  -- Construir datos de la postulación
  SELECT jsonb_build_object(
    'application_id', NEW.id,
    'application_characteristic_id', NEW.application_characteristic_id,
    'property_id', NEW.property_id,
    'applicant_id', NEW.applicant_id,
    'status', NEW.status,
    'message', NEW.message,
    'created_at', NEW.created_at,
    'updated_at', NEW.updated_at,
    'structured_applicant_id', NEW.structured_applicant_id,
    'structured_guarantor_id', NEW.structured_guarantor_id,
    'approved_by', NEW.approved_by,
    'approved_at', NEW.approved_at
  ) INTO application_data;

  -- Construir datos de documentos asociados del postulante
  -- (Incluye tanto documentos existentes como tipos requeridos)
  SELECT jsonb_agg(
    jsonb_build_object(
      'document_owner', 'applicant',
      'document_id', COALESCE(d.id::text, 'no-subido'),
      'document_type_code', COALESCE(d.applicant_document_type_code, adt.code),
      'document_type_name', adt.name,
      'document_category', adt.category,
      'is_required', adt.is_required,
      'file_url', d.file_url,
      'processing_status', d.processing_status,
      'uploaded_at', d.uploaded_at,
      'file_size_bytes', d.file_size_bytes,
      'mime_type', d.mime_type
    )
  ) INTO documents_data
  FROM applicant_document_types adt
  LEFT JOIN documents d ON d.applicant_document_type_code = adt.code
    AND d.applicant_id = NEW.applicant_id
    AND d.application_id = NEW.id
  WHERE adt.is_active = true
  ORDER BY adt.processing_priority;

  -- Agregar documentos del garante si existe
  IF NEW.structured_guarantor_id IS NOT NULL THEN
    -- Obtener documentos del garante
    SELECT jsonb_agg(
      jsonb_build_object(
        'document_owner', 'guarantor',
        'document_id', COALESCE(d.id::text, 'no-subido'),
        'document_type_code', COALESCE(d.applicant_document_type_code, adt.code),
        'document_type_name', adt.name,
        'document_category', adt.category,
        'is_required', adt.is_required,
        'file_url', d.file_url,
        'processing_status', d.processing_status,
        'uploaded_at', d.uploaded_at,
        'file_size_bytes', d.file_size_bytes,
        'mime_type', d.mime_type
      )
    )
    INTO guarantor_documents_data
    FROM applicant_document_types adt
    LEFT JOIN documents d ON d.applicant_document_type_code = adt.code
      AND d.guarantor_id = NEW.structured_guarantor_id
      AND d.application_id = NEW.id
    WHERE adt.is_active = true
    ORDER BY adt.processing_priority;

    -- Combinar documentos del postulante y garante
    IF guarantor_documents_data IS NOT NULL AND jsonb_array_length(guarantor_documents_data) > 0 THEN
      documents_data := COALESCE(documents_data, '[]'::jsonb) || guarantor_documents_data;
    END IF;
  END IF;

  -- Si no hay documentos, crear array vacío
  IF documents_data IS NULL THEN
    documents_data := '[]'::jsonb;
  END IF;

  -- Construir payload completo
  payload := jsonb_build_object(
    'event_type', 'application_created',
    'timestamp', extract(epoch from now())::bigint,
    'application', application_data,
    'documents', documents_data,
    'metadata', jsonb_build_object(
      'total_documents', jsonb_array_length(documents_data),
      'documents_uploaded', (
        SELECT COUNT(*)
        FROM jsonb_array_elements(documents_data) AS doc
        WHERE doc->>'document_id' != 'no-subido'
      ),
      'documents_pending', (
        SELECT COUNT(*)
        FROM jsonb_array_elements(documents_data) AS doc
        WHERE doc->>'document_id' = 'no-subido' AND (doc->>'is_required')::boolean = true
      )
    )
  );

  -- Intentar enviar webhook con pg_net (si está disponible)
  BEGIN
    PERFORM pg_net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json", "User-Agent": "Supabase-Webhook/1.0"}'::jsonb,
      body := payload
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- Si pg_net no está disponible, intentar con net.http_post
      BEGIN
        PERFORM net.http_post(
          url := webhook_url,
          headers := '{"Content-Type": "application/json", "User-Agent": "Supabase-Webhook/1.0"}'::jsonb,
          body := payload
        );
      EXCEPTION
        WHEN undefined_function THEN
          -- Si tampoco está disponible, solo loggear (no fallar)
          RAISE WARNING 'pg_net y net extensions no disponibles - webhook no enviado: %', payload;
      END;
  END;

  -- Log del envío (opcional, para debugging)
  RAISE NOTICE '📤 Webhook enviado para postulación % - Documentos: %', NEW.id, jsonb_array_length(documents_data);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no fallar la transacción
    RAISE WARNING 'Error enviando webhook para postulación %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER PARA ENVIAR WEBHOOK AL CREAR POSTULACIÓN
-- =====================================================

DROP TRIGGER IF EXISTS trigger_send_application_webhook ON applications;
CREATE TRIGGER trigger_send_application_webhook
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION send_application_webhook();

-- =====================================================
-- FUNCIÓN PARA REENVIAR WEBHOOK MANUALMENTE (DEBUGGING)
-- =====================================================

CREATE OR REPLACE FUNCTION resend_application_webhook(
  application_uuid uuid
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT := 'https://producción-primaria-bafdc.up.railway.app/prueba-de-webhook/8bde2b16-4ff9-41ec-aa62-95f5f289e41d';
  application_record RECORD;
  documents_data JSONB;
  guarantor_documents_data JSONB;
  payload JSONB;
  response_status INTEGER;
BEGIN
  -- Obtener datos de la postulación
  SELECT * INTO application_record
  FROM applications
  WHERE id = application_uuid;

  IF NOT FOUND THEN
    RETURN 'ERROR: Postulación no encontrada';
  END IF;

  -- Construir datos de documentos del postulante
  SELECT jsonb_agg(
    jsonb_build_object(
      'document_owner', 'applicant',
      'document_id', COALESCE(d.id::text, 'no-subido'),
      'document_type_code', COALESCE(d.applicant_document_type_code, adt.code),
      'document_type_name', adt.name,
      'document_category', adt.category,
      'is_required', adt.is_required,
      'file_url', d.file_url,
      'processing_status', d.processing_status,
      'uploaded_at', d.uploaded_at
    )
  ) INTO documents_data
  FROM applicant_document_types adt
  LEFT JOIN documents d ON d.applicant_document_type_code = adt.code
    AND d.applicant_id = application_record.applicant_id
    AND d.application_id = application_record.id
  WHERE adt.is_active = true
  ORDER BY adt.processing_priority;

  -- Agregar documentos del garante si existe
  IF application_record.structured_guarantor_id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'document_owner', 'guarantor',
        'document_id', COALESCE(d.id::text, 'no-subido'),
        'document_type_code', COALESCE(d.applicant_document_type_code, adt.code),
        'document_type_name', adt.name,
        'document_category', adt.category,
        'is_required', adt.is_required,
        'file_url', d.file_url,
        'processing_status', d.processing_status,
        'uploaded_at', d.uploaded_at
      )
    )
    INTO guarantor_documents_data
    FROM applicant_document_types adt
    LEFT JOIN documents d ON d.applicant_document_type_code = adt.code
      AND d.guarantor_id = application_record.structured_guarantor_id
      AND d.application_id = application_record.id
    WHERE adt.is_active = true
    ORDER BY adt.processing_priority;

    -- Combinar documentos del postulante y garante
    IF guarantor_documents_data IS NOT NULL AND jsonb_array_length(guarantor_documents_data) > 0 THEN
      documents_data := COALESCE(documents_data, '[]'::jsonb) || guarantor_documents_data;
    END IF;
  END IF;

  IF documents_data IS NULL THEN
    documents_data := '[]'::jsonb;
  END IF;

  -- Construir payload
  payload := jsonb_build_object(
    'event_type', 'application_created_manual',
    'timestamp', extract(epoch from now())::bigint,
    'application', jsonb_build_object(
      'application_id', application_record.id,
      'application_characteristic_id', application_record.application_characteristic_id,
      'status', application_record.status
    ),
    'documents', documents_data
  );

  -- Intentar enviar webhook
  BEGIN
    SELECT status INTO response_status
    FROM pg_net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- Si pg_net no está disponible, intentar con net.http_post
      BEGIN
        SELECT status INTO response_status
        FROM net.http_post(
          url := webhook_url,
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := payload
        );
      EXCEPTION
        WHEN undefined_function THEN
          -- Si tampoco está disponible, devolver error
          RETURN 'ERROR: Extensiones HTTP no disponibles en esta instancia de Supabase';
      END;
  END;

  RETURN 'SUCCESS: Webhook reenviado (HTTP ' || response_status || ') - Documentos: ' || jsonb_array_length(documents_data);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- =====================================================
-- VISTA PARA MONITOREAR WEBHOOKS ENVIADOS
-- =====================================================

CREATE OR REPLACE VIEW applications_with_webhook_status AS
SELECT
  a.id,
  a.application_characteristic_id,
  a.status,
  a.created_at,
  a.applicant_id,
  p.full_name as applicant_name,
  prop.address_street || ' ' || prop.address_number as property_address,
  COUNT(d.id) as documents_uploaded,
  COUNT(adt.code) as document_types_required,
  CASE
    WHEN COUNT(d.id) = COUNT(adt.code) THEN 'completo'
    WHEN COUNT(d.id) > 0 THEN 'parcial'
    ELSE 'sin_documentos'
  END as document_status
FROM applications a
JOIN applicants p ON a.applicant_id = p.id
JOIN properties prop ON a.property_id = prop.id
LEFT JOIN documents d ON d.application_id = a.id AND (
  (d.applicant_document_type_code IS NOT NULL AND d.applicant_id IS NOT NULL) OR
  (d.applicant_document_type_code IS NOT NULL AND d.guarantor_id IS NOT NULL)
)
LEFT JOIN applicant_document_types adt ON adt.is_active = true
GROUP BY a.id, a.application_characteristic_id, a.status, a.created_at, a.applicant_id, p.full_name, prop.address_street, prop.address_number
ORDER BY a.created_at DESC;

-- =====================================================
-- PERMISOS PARA FUNCIONES
-- =====================================================

GRANT EXECUTE ON FUNCTION resend_application_webhook(uuid) TO authenticated;
GRANT SELECT ON applications_with_webhook_status TO authenticated;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 WEBHOOK DE POSTULACIONES CONFIGURADO!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 FUNCIONALIDAD IMPLEMENTADA:';
  RAISE NOTICE '   ✅ Trigger automático en creación de postulaciones';
  RAISE NOTICE '   ✅ Envío de IDs y denominaciones de documentos';
  RAISE NOTICE '   ✅ Incluye documentos del POSTULANTE y del GARANTE';
  RAISE NOTICE '   ✅ Webhook: https://producción-primaria-bafdc.up.railway.app/...';
  RAISE NOTICE '   ✅ Función manual para reenvío: resend_application_webhook(uuid)';
  RAISE NOTICE '   ✅ Vista de monitoreo: applications_with_webhook_status';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTRUCTURA DEL WEBHOOK:';
  RAISE NOTICE '   {';
  RAISE NOTICE '     "event_type": "application_created",';
  RAISE NOTICE '     "application": {...},';
  RAISE NOTICE '     "documents": [{';
  RAISE NOTICE '       "document_owner": "applicant",';
  RAISE NOTICE '       "document_id": "uuid",';
  RAISE NOTICE '       "document_type_name": "Cédula de Identidad",';
  RAISE NOTICE '       "is_required": true';
  RAISE NOTICE '     }, {';
  RAISE NOTICE '       "document_owner": "guarantor",';
  RAISE NOTICE '       "document_id": "uuid",';
  RAISE NOTICE '       "document_type_name": "Informe Comercial",';
  RAISE NOTICE '       "is_required": true';
  RAISE NOTICE '     }],';
  RAISE NOTICE '     "metadata": {...}';
  RAISE NOTICE '   }';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PRUEBA MANUAL:';
  RAISE NOTICE '   SELECT resend_application_webhook(''application-uuid-aqui'');';
  RAISE NOTICE '';
  RAISE NOTICE '📈 MONITOREO:';
  RAISE NOTICE '   SELECT * FROM applications_with_webhook_status LIMIT 5;';
END $$;
