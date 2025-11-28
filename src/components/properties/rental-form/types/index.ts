// 🏗️ INTERFACES TYPESCRIPT - RentalPublicationForm Refactoring

export type PropertyType =
  | 'Casa'
  | 'Departamento'
  | 'Oficina'
  | 'Local Comercial'
  | 'Bodega'
  | 'Estacionamiento'
  | 'Parcela';

// ============================================================================
// INTERFACES COMUNES
// ============================================================================

export interface ValidationErrors {
  [field: string]: string;
}

export interface ComponentWithErrors {
  errors: ValidationErrors;
  onErrorChange?: (field: string, error: string) => void;
}

// Event Handlers estandarizados
export type FieldChangeHandler = (field: string, value: any) => void;
export type FileUploadHandler = (type: string, file: File) => Promise<void>;
export type FileRemoveHandler = (type: string) => void;

// ============================================================================
// COMPONENTE 1: PropertyBasicInfo
// ============================================================================

export interface PropertyBasicInfoData {
  tipoPropiedad: PropertyType;
  address_street: string;
  address_number: string;
  address_department?: string;
  region: string;
  commune: string;
  price: string;
  common_expenses: string;
  description: string;
}

export interface PropertyBasicInfoProps extends ComponentWithErrors {
  data: PropertyBasicInfoData;
  onChange: FieldChangeHandler;
  onPropertyTypeChange: (type: PropertyType) => void;
}

// ============================================================================
// COMPONENTE 2: PropertyInternalFeatures
// ============================================================================

export interface PropertyInternalFeaturesData {
  sistemaAguaCaliente: string;
  tipoCocina: string;
  tieneSalaEstar: string;
  parkingSpaces?: ParkingSpace[];
  storageSpaces?: StorageSpace[];
}

export interface PropertyInternalFeaturesProps extends ComponentWithErrors {
  data: PropertyInternalFeaturesData;
  onChange: FieldChangeHandler;
  propertyType: PropertyType;
  showSection: boolean;
}

// ============================================================================
// COMPONENTE 3: PropertySpaces
// ============================================================================

// Re-export desde componentes existentes
export type { ParkingSpace } from '../ParkingSpaceForm';
export type { StorageSpace } from '../StorageSpaceForm';

export interface PropertySpacesProps extends ComponentWithErrors {
  parkingSpaces: ParkingSpace[];
  storageSpaces: StorageSpace[];
  onParkingChange: (spaces: ParkingSpace[]) => void;
  onStorageChange: (spaces: StorageSpace[]) => void;
  propertyType: PropertyType;
}

// ============================================================================
// COMPONENTE 4: PropertyOwners
// ============================================================================

// Re-export de la interface Owner existente
export type { Owner } from '../../RentalPublicationForm';

export interface PropertyOwnersProps extends ComponentWithErrors {
  owners: Owner[];
  onOwnersChange: (owners: Owner[]) => void;
  onDocumentUpload: (ownerId: string, docType: string, file: File) => Promise<void>;
  onDocumentRemove: (ownerId: string, docType: string) => void;
}

// ============================================================================
// COMPONENTE 5: PropertyPhotos
// ============================================================================

export interface PropertyPhotosProps extends ComponentWithErrors {
  photoFiles: File[];
  photoPreviews: string[];
  onPhotosChange: (files: File[], previews: string[]) => void;
  maxPhotos?: number;
  uploading?: boolean;
}

// ============================================================================
// COMPONENTE 6: PropertyDocuments
// ============================================================================

export interface PropertyDocumentsProps extends ComponentWithErrors {
  propertyType: PropertyType;
  owners: Owner[];
  onDocumentUpload: FileUploadHandler;
  onDocumentRemove: FileRemoveHandler;
  isEditing?: boolean;
  entityId?: string;
}

// ============================================================================
// FORM DATA PRINCIPAL (para compatibilidad durante migración)
// ============================================================================

export interface RentalFormData {
  // Información básica
  tipoPropiedad: PropertyType;
  address_street: string;
  address_number: string;
  address_department?: string;
  region: string;
  commune: string;
  price: string;
  common_expenses: string;
  description: string;

  // Características internas
  metrosUtiles: string;
  metrosTotales: string;
  bedrooms: string;
  bathrooms: string;
  anoConstruccion: string;
  tieneTerraza: string;
  tieneSalaEstar: string;

  // Campos específicos por tipo
  numeroBodega?: string;
  ubicacionBodega?: string;
  metrosBodega?: string;
  ubicacionEstacionamiento?: string;
  parcela_number?: string;

  // Estado derivado
  propertyType: PropertyType;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface FormSectionProps {
  isVisible: boolean;
  isValid?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export interface LoadingStates {
  initializing: boolean;
  loading: boolean;
  uploading: boolean;
}

export interface FormActions {
  onSuccess?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
  warnings?: string[];
}

export interface SectionValidationResult extends ValidationResult {
  sectionId: string;
  completedFields: number;
  totalFields: number;
}

// ============================================================================
// MIGRATION HELPERS (para compatibilidad temporal)
// ============================================================================

export interface LegacyFormData {
  [key: string]: any; // Para compatibilidad durante migración
}

export type MigrationStatus =
  | 'pending'
  | 'extracting'
  | 'testing'
  | 'completed'
  | 'deprecated';
