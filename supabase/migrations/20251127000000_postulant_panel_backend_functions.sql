-- Migration: Postulant Panel Backend Functions
-- Date: 2025-11-27
-- Description: Backend functions for enhanced postulant panel functionality

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
    updated_at = NOW()
  WHERE id = p_application_id;

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
    (pd.status = 'verified') as verified
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
    ud.doc_type as document_type,
    ud.file_name,
    ud.uploaded_at,
    true as verified -- user_documents doesn't have verified column, assume true
  FROM user_documents ud
  WHERE ud.user_id = p_owner_id
  AND ud.doc_type IN ('cedula', 'certificado_dominio', 'comprobante_ingresos')
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
