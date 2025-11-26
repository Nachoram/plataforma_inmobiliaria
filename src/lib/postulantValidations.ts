/**
 * Postulant Validations
 *
 * Utility functions for validating permissions, application states,
 * and file uploads in the postulant panel.
 */

import { supabase } from './supabase';

// ========================================================================
// APPLICATION STATE VALIDATIONS
// ========================================================================

/**
 * Check if an application can be cancelled by the applicant
 */
export const canCancelApplication = (status: string): boolean => {
  return ['pendiente', 'en_revision'].includes(status);
};

/**
 * Check if documents can be edited/uploaded for an application
 */
export const canEditDocuments = (status: string): boolean => {
  return ['pendiente', 'en_revision', 'aprobada'].includes(status);
};

/**
 * Check if contract can be viewed
 */
export const canViewContract = (status: string): boolean => {
  return ['aprobada', 'finalizada', 'modificada'].includes(status);
};

/**
 * Check if application can be edited
 */
export const canEditApplication = (status: string): boolean => {
  return ['pendiente', 'en_revision'].includes(status);
};

/**
 * Check if property documents can be viewed (always true for valid applications)
 */
export const canViewPropertyDocuments = (): boolean => {
  return true;
};

// ========================================================================
// FILE VALIDATION UTILITIES
// ========================================================================

/**
 * Validate file type for document uploads
 */
export const validateFileType = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de archivo no permitido. Solo se permiten PDF, JPG, PNG, DOC y DOCX.'
    };
  }

  return { isValid: true };
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `El archivo supera el tamaño máximo de ${maxSizeMB}MB.`
    };
  }

  return { isValid: true };
};

/**
 * Validate multiple files
 */
export const validateFiles = (files: File[], maxFiles: number = 5, maxSizeMB: number = 5): { isValid: boolean; error?: string } => {
  if (files.length > maxFiles) {
    return {
      isValid: false,
      error: `Máximo ${maxFiles} archivos permitidos.`
    };
  }

  for (const file of files) {
    const typeValidation = validateFileType(file);
    if (!typeValidation.isValid) {
      return typeValidation;
    }

    const sizeValidation = validateFileSize(file, maxSizeMB);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }
  }

  return { isValid: true };
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ========================================================================
// PERMISSION VALIDATIONS
// ========================================================================

/**
 * Check if user owns the application
 */
export const validateApplicationOwnership = async (applicationId: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const { data: application, error } = await supabase
      .from('applications')
      .select('applicant_id')
      .eq('id', applicationId)
      .single();

    if (error) {
      return { isValid: false, error: 'Error al verificar la aplicación' };
    }

    if (!application) {
      return { isValid: false, error: 'Aplicación no encontrada' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isValid: false, error: 'Usuario no autenticado' };
    }

    if (application.applicant_id !== user.id) {
      return { isValid: false, error: 'No tienes permisos para acceder a esta aplicación' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating application ownership:', error);
    return { isValid: false, error: 'Error de validación' };
  }
};

/**
 * Check if user can access property documents
 */
export const validatePropertyDocumentAccess = async (propertyId: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isValid: false, error: 'Usuario no autenticado' };
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select('id, status')
      .eq('property_id', propertyId)
      .eq('applicant_id', user.id)
      .in('status', ['pendiente', 'en_revision', 'aprobada', 'finalizada'])
      .single();

    if (error || !application) {
      return { isValid: false, error: 'No tienes acceso a los documentos de esta propiedad' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating property document access:', error);
    return { isValid: false, error: 'Error de validación' };
  }
};

/**
 * Check if user can access owner documents
 */
export const validateOwnerDocumentAccess = async (ownerId: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isValid: false, error: 'Usuario no autenticado' };
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select('a.id, a.status')
      .from('applications a')
      .join('properties p', 'a.property_id', 'p.id')
      .eq('p.owner_id', ownerId)
      .eq('a.applicant_id', user.id)
      .in('a.status', ['pendiente', 'en_revision', 'aprobada', 'finalizada'])
      .single();

    if (error || !application) {
      return { isValid: false, error: 'No tienes acceso a los documentos de este propietario' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating owner document access:', error);
    return { isValid: false, error: 'Error de validación' };
  }
};

// ========================================================================
// BUSINESS RULE VALIDATIONS
// ========================================================================

/**
 * Validate document replacement
 */
export const validateDocumentReplacement = async (
  documentId: string
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isValid: false, error: 'Usuario no autenticado' };
    }

    const { data: document, error } = await supabase
      .from('application_documents')
      .select('uploaded_by')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return { isValid: false, error: 'Documento no encontrado' };
    }

    if (document.uploaded_by !== user.id) {
      return { isValid: false, error: 'Solo puedes modificar tus propios documentos' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating document replacement:', error);
    return { isValid: false, error: 'Error de validación' };
  }
};

/**
 * Validate application cancellation
 */
export const validateApplicationCancellation = async (
  applicationId: string,
  reason: string
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    if (!reason.trim()) {
      return { isValid: false, error: 'Debes proporcionar una razón para cancelar' };
    }

    if (reason.trim().length < 10) {
      return { isValid: false, error: 'La razón debe tener al menos 10 caracteres' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isValid: false, error: 'Usuario no autenticado' };
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select('status, applicant_id')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      return { isValid: false, error: 'Aplicación no encontrada' };
    }

    if (application.applicant_id !== user.id) {
      return { isValid: false, error: 'No tienes permisos para cancelar esta aplicación' };
    }

    if (!canCancelApplication(application.status)) {
      return {
        isValid: false,
        error: `No se puede cancelar una aplicación en estado "${application.status}"`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating application cancellation:', error);
    return { isValid: false, error: 'Error de validación' };
  }
};

// ========================================================================
// SECURITY UTILITIES
// ========================================================================

/**
 * Sanitize filename for storage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase();
};

/**
 * Generate secure filename with timestamp
 */
export const generateSecureFilename = (originalName: string, prefix: string = ''): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const sanitizedName = sanitizeFilename(originalName.split('.')[0]);

  return `${prefix}${timestamp}_${random}_${sanitizedName}.${extension}`;
};

/**
 * Validate and sanitize user input
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
};

// ========================================================================
// EXPORT ALL VALIDATIONS
// ========================================================================

export const postulantValidations = {
  // State validations
  canCancelApplication,
  canEditDocuments,
  canViewContract,
  canEditApplication,
  canViewPropertyDocuments,

  // File validations
  validateFileType,
  validateFileSize,
  validateFiles,
  getFileExtension,
  formatFileSize,

  // Permission validations
  validateApplicationOwnership,
  validatePropertyDocumentAccess,
  validateOwnerDocumentAccess,

  // Business rule validations
  validateDocumentReplacement,
  validateApplicationCancellation,

  // Security utilities
  sanitizeFilename,
  generateSecureFilename,
  sanitizeInput
};
