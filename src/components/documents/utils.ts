import {
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_CONFIGS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_CATEGORY_COLORS,
  DocumentCategory
} from './types';

/**
 * Get human-readable label for document type
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_CONFIGS[type]?.label || type;
}

/**
 * Get color classes for document status
 */
export function getDocumentStatusColor(status: DocumentStatus): string {
  return DOCUMENT_STATUS_COLORS[status]?.bg || 'bg-gray-100';
}

/**
 * Get text color classes for document status
 */
export function getDocumentStatusTextColor(status: DocumentStatus): string {
  return DOCUMENT_STATUS_COLORS[status]?.text || 'text-gray-800';
}

/**
 * Get border color classes for document status
 */
export function getDocumentStatusBorderColor(status: DocumentStatus): string {
  return DOCUMENT_STATUS_COLORS[status]?.border || 'border-gray-200';
}

/**
 * Get color classes for document category
 */
export function getDocumentCategoryColor(category: DocumentCategory): string {
  return DOCUMENT_CATEGORY_COLORS[category]?.bg || 'bg-gray-100';
}

/**
 * Get text color classes for document category
 */
export function getDocumentCategoryTextColor(category: DocumentCategory): string {
  return DOCUMENT_CATEGORY_COLORS[category]?.text || 'text-gray-800';
}

/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file type is valid for allowed types
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Check if file is a document (PDF, Word, etc.)
 */
export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  return documentTypes.includes(file.type);
}

/**
 * Get appropriate icon for file type
 */
export function getFileTypeIcon(file: File): string {
  if (isPDFFile(file)) return '📄';
  if (isImageFile(file)) return '🖼️';
  if (isDocumentFile(file)) return '📝';
  return '📎';
}

/**
 * Generate unique file name for storage
 */
export function generateUniqueFileName(originalName: string, userId: string, documentType: DocumentType): string {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  return `${userId}/${documentType}/${timestamp}.${extension}`;
}

/**
 * Get document configuration by type
 */
export function getDocumentConfig(type: DocumentType) {
  return DOCUMENT_TYPE_CONFIGS[type];
}

/**
 * Check if document is required
 */
export function isDocumentRequired(type: DocumentType): boolean {
  return DOCUMENT_TYPE_CONFIGS[type]?.required || false;
}

/**
 * Get allowed file types for document type
 */
export function getAllowedTypesForDocument(type: DocumentType): string[] {
  return DOCUMENT_TYPE_CONFIGS[type]?.allowedTypes || [];
}

/**
 * Get maximum file size for document type
 */
export function getMaxSizeForDocument(type: DocumentType): number {
  return DOCUMENT_TYPE_CONFIGS[type]?.maxSize || 5 * 1024 * 1024; // 5MB default
}

/**
 * Check if document expires
 */
export function doesDocumentExpire(type: DocumentType): boolean {
  return DOCUMENT_TYPE_CONFIGS[type]?.expiresAfter !== undefined;
}

/**
 * Get expiration days for document type
 */
export function getDocumentExpirationDays(type: DocumentType): number | undefined {
  return DOCUMENT_TYPE_CONFIGS[type]?.expiresAfter;
}

/**
 * Calculate expiration date for document
 */
export function calculateExpirationDate(uploadedAt: string, type: DocumentType): Date | null {
  const expirationDays = getDocumentExpirationDays(type);
  if (!expirationDays) return null;

  const uploadDate = new Date(uploadedAt);
  uploadDate.setDate(uploadDate.getDate() + expirationDays);
  return uploadDate;
}

/**
 * Check if document is expired
 */
export function isDocumentExpired(uploadedAt: string, type: DocumentType): boolean {
  const expirationDate = calculateExpirationDate(uploadedAt, type);
  if (!expirationDate) return false;

  return new Date() > expirationDate;
}

/**
 * Get documents by category
 */
export function getDocumentsByCategory(documents: any[], category: DocumentCategory) {
  return documents.filter(doc => DOCUMENT_TYPE_CONFIGS[doc.type]?.category === category);
}

/**
 * Get required documents for a user/application
 */
export function getRequiredDocuments(): DocumentType[] {
  return Object.values(DOCUMENT_TYPE_CONFIGS)
    .filter(config => config.required)
    .map(config => config.type);
}

/**
 * Validate file against document type requirements
 */
export function validateFileForType(file: File, type: DocumentType): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const config = getDocumentConfig(type);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size > config.maxSize) {
    errors.push(`El archivo es demasiado grande. Tamaño máximo: ${formatFileSize(config.maxSize)}`);
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    errors.push(`Tipo de archivo no permitido. Tipos permitidos: ${config.allowedTypes.map(type => type.split('/')[1]).join(', ')}`);
  }

  // Warning for large files
  if (file.size > config.maxSize * 0.8) {
    warnings.push('El archivo es bastante grande, puede tardar en subir');
  }

  // Warning for expiration
  if (config.expiresAfter) {
    warnings.push(`Este documento expirará en ${config.expiresAfter} días`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get status badge text
 */
export function getStatusBadgeText(status: DocumentStatus): string {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'verified': return 'Verificado';
    case 'rejected': return 'Rechazado';
    default: return status;
  }
}

/**
 * Get category badge text
 */
export function getCategoryBadgeText(category: DocumentCategory): string {
  switch (category) {
    case DocumentCategory.APPLICANT: return 'Postulante';
    case DocumentCategory.GUARANTOR: return 'Garante';
    case DocumentCategory.PROPERTY: return 'Propiedad';
    case DocumentCategory.FINANCIAL: return 'Financiero';
    case DocumentCategory.LEGAL: return 'Legal';
    default: return category;
  }
}

/**
 * Sort documents by priority (required first, then by type)
 */
export function sortDocumentsByPriority(documents: any[]): any[] {
  return documents.sort((a, b) => {
    const aRequired = isDocumentRequired(a.type);
    const bRequired = isDocumentRequired(b.type);

    if (aRequired && !bRequired) return -1;
    if (!aRequired && bRequired) return 1;

    return getDocumentTypeLabel(a.type).localeCompare(getDocumentTypeLabel(b.type));
  });
}

/**
 * Get document statistics
 */
export function getDocumentStatistics(documents: any[]) {
  const total = documents.length;
  const verified = documents.filter(doc => doc.status === 'verified').length;
  const pending = documents.filter(doc => doc.status === 'pending').length;
  const rejected = documents.filter(doc => doc.status === 'rejected').length;
  const expired = documents.filter(doc => isDocumentExpired(doc.uploadedAt, doc.type)).length;
  const required = documents.filter(doc => isDocumentRequired(doc.type)).length;
  const requiredVerified = documents.filter(doc => isDocumentRequired(doc.type) && doc.status === 'verified').length;

  return {
    total,
    verified,
    pending,
    rejected,
    expired,
    required,
    requiredVerified,
    completionRate: required > 0 ? (requiredVerified / required) * 100 : 100
  };
}
