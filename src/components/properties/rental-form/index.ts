// 🏗️ MÓDULO RENTAL FORM - Refactoring Plan

// ============================================================================
// COMPONENTES PRINCIPALES
// ============================================================================

export {
  PropertyBasicInfo,
  PropertyInternalFeatures,
  PropertySpaces,
  PropertyOwners,
  PropertyPhotos,
  PropertyDocuments,
  type PropertyBasicInfoProps,
  type PropertyInternalFeaturesProps,
  type PropertySpacesProps,
  type PropertyOwnersProps,
  type PropertyPhotosProps,
  type PropertyDocumentsProps,
  type PropertyBasicInfoData,
  type PropertyInternalFeaturesData,
  type PropertyType,
  type ValidationErrors,
  type ComponentWithErrors,
  type FieldChangeHandler,
  type FileUploadHandler,
  type FileRemoveHandler
} from './components';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export type {
  RentalFormData,
  FormSectionProps,
  LoadingStates,
  FormActions,
  ValidationResult,
  SectionValidationResult,
  LegacyFormData,
  MigrationStatus
} from './types';

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

export { default as useFormValidation } from './hooks/useFormValidation';
export { default as usePropertyType } from './hooks/usePropertyType';
export { default as useFileUpload } from './hooks/useFileUpload';

// ============================================================================
// UTILIDADES
// ============================================================================

export * from './utils/validation';
export * from './utils/propertyHelpers';
export * from './utils/fileHelpers';

// ============================================================================
// CONSTANTES
// ============================================================================

export * from './constants/propertyTypes';
export * from './constants/validationRules';
export * from './constants/fieldMappings';

// ============================================================================
// LEGACY SUPPORT (durante migración)
// ============================================================================

export { default as RentalPublicationForm } from '../RentalPublicationForm';

// ============================================================================
// METADATA DEL MÓDULO
// ============================================================================

export const RENTAL_FORM_MODULE = {
  version: '0.1.0',
  status: 'analysis' as const,
  components: 6,
  migrationPhase: 1,
  estimatedCompletion: '2025-12-15',
  author: 'Optimization System',
  description: 'Refactored RentalPublicationForm with modular architecture'
} as const;
