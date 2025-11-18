// Main Components
export { default as DocumentUploader } from './DocumentUploader';
export { default as DocumentViewer, DocumentPreview } from './DocumentViewer';
export { default as DocumentList } from './DocumentList';
export { DocumentValidator, useDocumentValidator, FileInfoDisplay } from './DocumentValidator';

// Types
export type {
  DocumentType,
  DocumentStatus,
  IDocument,
  DocumentUploadState,
  ValidationResult,
  DocumentUploadOptions,
  DocumentFilters,
  DocumentListResponse,
  DocumentCategory,
  DocumentTypeConfig
} from './types';

// Utils
export {
  getDocumentTypeLabel,
  getDocumentStatusColor,
  getDocumentStatusTextColor,
  getDocumentStatusBorderColor,
  getDocumentCategoryColor,
  getDocumentCategoryTextColor,
  formatFileSize,
  isValidFileType,
  getFileExtension,
  isImageFile,
  isPDFFile,
  isDocumentFile,
  getFileTypeIcon,
  generateUniqueFileName,
  getDocumentConfig,
  isDocumentRequired,
  getAllowedTypesForDocument,
  getMaxSizeForDocument,
  doesDocumentExpire,
  getDocumentExpirationDays,
  calculateExpirationDate,
  isDocumentExpired,
  getDocumentsByCategory,
  getRequiredDocuments,
  validateFileForType,
  getStatusBadgeText,
  getCategoryBadgeText,
  sortDocumentsByPriority,
  getDocumentStatistics
} from './utils';

// Constants
export {
  DOCUMENT_TYPE_CONFIGS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_CATEGORY_COLORS
} from './types';

