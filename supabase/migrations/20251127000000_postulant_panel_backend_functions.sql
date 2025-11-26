-- Migration: Postulant Panel Backend Functions
-- Date: 2025-11-27
-- Description: Backend functions for enhanced postulant panel functionality

-- ========================================================================
-- FUNCTION: replace_application_document
-- Description: Replace an existing application document with a new one
-- ========================================================================

CREATE OR REPLACE FUNCTION replace_application_document(
  p_document_id UUID,
  p_new_file_name TEXT,
  p_new_file_path TEXT,
  p_new_file_size BIGINT
) RETURNS JSON AS $$
DECLARE
  v_old_document RECORD;
  v_application_id UUID;
  v_result JSON;
BEGIN
  -- Get the old document details
  SELECT * INTO v_old_document
  FROM application_documents
  WHERE id = p_document_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Document not found');
  END IF;

  -- Verify the user owns this document
  IF v_old_document.uploaded_by != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Store application_id for later use
  v_application_id := v_old_document.application_id;

  -- Delete the old file from storage (optional, can be handled by cleanup job)
  -- Note: Supabase storage doesn't have direct delete via SQL functions

  -- Update the document record
  UPDATE application_documents
  SET
    file_name = p_new_file_name,
    file_path = p_new_file_path,
    file_size = p_new_file_size,
    uploaded_at = NOW(),
    verified = false -- Reset verification status
  WHERE id = p_document_id;

  -- Create audit log entry
  INSERT INTO application_audit_log (
    application_id,
    user_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    v_application_id,
    auth.uid(),
    'document_replaced',
    json_build_object(
      'document_id', p_document_id,
      'old_file_name', v_old_document.file_name,
      'new_file_name', p_new_file_name,
      'document_type', v_old_document.document_type
    ),
    NULL,
    NULL
  );

  v_result := json_build_object(
    'success', true,
    'document_id', p_document_id,
    'message', 'Document replaced successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- FUNCTION: request_specific_documents
-- Description: Create a request for specific document types from landlord
-- ========================================================================

CREATE OR REPLACE FUNCTION request_specific_documents(
  p_application_id UUID,
  p_requested_document_types TEXT[],
  p_reason TEXT
) RETURNS UUID AS $$
DECLARE
  v_application RECORD;
  v_request_id UUID;
  v_request_details JSON;
BEGIN
  -- Verify the application exists and user has access
  SELECT * INTO v_application
  FROM applications
  WHERE id = p_application_id AND applicant_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or access denied';
  END IF;

  -- Verify application is in valid state for document requests
  IF v_application.status NOT IN ('pendiente', 'en_revision', 'aprobada') THEN
    RAISE EXCEPTION 'Cannot request documents for application in status: %', v_application.status;
  END IF;

  -- Create request details
  v_request_details := json_build_object(
    'requested_types', p_requested_document_types,
    'reason', p_reason,
    'request_type', 'specific_documents'
  );

  -- Create the request
  INSERT INTO application_requests (
    application_id,
    applicant_id,
    landlord_id,
    request_type,
    subject,
    description,
    requested_changes,
    status,
    priority,
    ip_address,
    user_agent
  ) VALUES (
    p_application_id,
    auth.uid(),
    v_application.owner_id,
    'document_request',
    'Solicitud de Documentos Específicos',
    format('Solicitud de documentos específicos: %s. Razón: %s',
           array_to_string(p_requested_document_types, ', '), p_reason),
    v_request_details,
    'pending',
    'normal',
    NULL,
    NULL
  ) RETURNING id INTO v_request_id;

  -- Create audit log entry
  INSERT INTO application_audit_log (
    application_id,
    user_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_application_id,
    auth.uid(),
    'document_request_created',
    json_build_object(
      'request_id', v_request_id,
      'requested_types', p_requested_document_types,
      'reason', p_reason
    ),
    NULL,
    NULL
  );

  RETURN v_request_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating document request: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- FUNCTION: cancel_application_by_applicant
-- Description: Allow applicant to cancel their application with reason
-- ========================================================================

CREATE OR REPLACE FUNCTION cancel_application_by_applicant(
  p_application_id UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_application RECORD;
  v_old_status TEXT;
BEGIN
  -- Verify the application exists and user has access
  SELECT * INTO v_application
  FROM applications
  WHERE id = p_application_id AND applicant_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or access denied';
  END IF;

  -- Check if cancellation is allowed
  IF v_application.status NOT IN ('pendiente', 'en_revision') THEN
    RAISE EXCEPTION 'Cannot cancel application with status: %', v_application.status;
  END IF;

  -- Store old status for audit
  v_old_status := v_application.status;

  -- Update application status
  UPDATE applications
  SET
    status = 'rechazada',
    updated_at = NOW(),
    cancellation_reason = p_reason,
    cancelled_by = auth.uid(),
    cancelled_at = NOW()
  WHERE id = p_application_id;

  -- Cancel any pending contracts
  UPDATE rental_contracts
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE application_id = p_application_id AND status IN ('draft', 'pending');

  -- Create audit log entry
  INSERT INTO application_audit_log (
    application_id,
    user_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_application_id,
    auth.uid(),
    'application_cancelled_by_applicant',
    json_build_object(
      'old_status', v_old_status,
      'new_status', 'rechazada',
      'reason', p_reason
    ),
    NULL,
    NULL
  );

  -- Send notification to landlord (this could be enhanced with actual notifications)
  INSERT INTO application_messages (
    application_id,
    sender_id,
    sender_type,
    sender_name,
    recipient_id,
    recipient_type,
    recipient_name,
    subject,
    message,
    message_type,
    conversation_id,
    ip_address,
    user_agent
  ) VALUES (
    p_application_id,
    auth.uid(),
    'applicant',
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()), 'Postulante'),
    v_application.owner_id,
    'landlord',
    'Arrendador',
    'Postulación Cancelada',
    format('La postulación ha sido cancelada por el postulante. Razón: %s', p_reason),
    'status_update',
    gen_random_uuid(),
    NULL,
    NULL
  );

  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error cancelling application: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- FUNCTION: get_property_documents
-- Description: Get documents associated with a property (for applicants)
-- ========================================================================

CREATE OR REPLACE FUNCTION get_property_documents(
  p_property_id UUID
) RETURNS TABLE (
  id UUID,
  document_type TEXT,
  file_name TEXT,
  uploaded_at TIMESTAMPTZ,
  verified BOOLEAN
) AS $$
BEGIN
  -- Check if user has an application for this property
  IF NOT EXISTS (
    SELECT 1 FROM applications
    WHERE property_id = p_property_id
    AND applicant_id = auth.uid()
    AND status IN ('pendiente', 'en_revision', 'aprobada', 'finalizada')
  ) THEN
    RAISE EXCEPTION 'Access denied: No valid application found for this property';
  END IF;

  RETURN QUERY
  SELECT
    pd.id,
    pd.document_type,
    pd.file_name,
    pd.uploaded_at,
    pd.verified
  FROM property_documents pd
  WHERE pd.property_id = p_property_id
  ORDER BY pd.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- FUNCTION: get_owner_documents
-- Description: Get owner identification documents (for applicants)
-- ========================================================================

CREATE OR REPLACE FUNCTION get_owner_documents(
  p_owner_id UUID
) RETURNS TABLE (
  id UUID,
  document_type TEXT,
  file_name TEXT,
  uploaded_at TIMESTAMPTZ,
  verified BOOLEAN
) AS $$
BEGIN
  -- Check if user has an application for a property owned by this owner
  IF NOT EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE p.owner_id = p_owner_id
    AND a.applicant_id = auth.uid()
    AND a.status IN ('pendiente', 'en_revision', 'aprobada', 'finalizada')
  ) THEN
    RAISE EXCEPTION 'Access denied: No valid application found for properties owned by this user';
  END IF;

  RETURN QUERY
  SELECT
    ud.id,
    ud.document_type,
    ud.file_name,
    ud.uploaded_at,
    ud.verified
  FROM user_documents ud
  WHERE ud.user_id = p_owner_id
  AND ud.document_type IN ('cedula', 'certificado_dominio', 'comprobante_ingresos')
  ORDER BY ud.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- GRANTS AND PERMISSIONS
-- ========================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION replace_application_document(UUID, TEXT, TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION request_specific_documents(UUID, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_application_by_applicant(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_documents(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_owner_documents(UUID) TO authenticated;

-- ========================================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================================

-- Index for faster document replacement queries
CREATE INDEX IF NOT EXISTS idx_application_documents_uploaded_by
ON application_documents(uploaded_by);

-- Index for faster property document access
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id
ON property_documents(property_id);

-- Index for faster owner document access
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id_type
ON user_documents(user_id, document_type);

-- ========================================================================
-- COMMENTS
-- ========================================================================

COMMENT ON FUNCTION replace_application_document(UUID, TEXT, TEXT, BIGINT) IS
'Replaces an existing application document with a new file. Only the document owner can perform this action.';

COMMENT ON FUNCTION request_specific_documents(UUID, TEXT[], TEXT) IS
'Creates a formal request for specific document types from the landlord to the applicant.';

COMMENT ON FUNCTION cancel_application_by_applicant(UUID, TEXT) IS
'Allows an applicant to cancel their application with a reason. Only works for applications in pending or under_review status.';

COMMENT ON FUNCTION get_property_documents(UUID) IS
'Returns property documents that an applicant can access (only if they have a valid application for that property).';

COMMENT ON FUNCTION get_owner_documents(UUID) IS
'Returns owner identification documents that an applicant can access (only if they have a valid application for a property owned by that user).';

-- Migration completed successfully
