// 📦 COMPONENTES - RentalPublicationForm Refactoring

// Exportar todos los componentes principales
export { PropertyBasicInfo } from './PropertyBasicInfo/PropertyBasicInfo';
export { PropertyInternalFeatures } from './PropertyInternalFeatures/PropertyInternalFeatures';
export { PropertyOwners } from './PropertyOwners/PropertyOwners';
export { PropertyPhotos } from './PropertyPhotos/PropertyPhotos';
export { PropertyDocuments } from './PropertyDocuments/PropertyDocuments';

// Exportar tipos de props para cada componente
export type { PropertyBasicInfoProps } from '../types';
export type { PropertyInternalFeaturesProps } from '../types';
export type { PropertySpacesProps } from '../types';
export type { PropertyOwnersProps } from '../types';
export type { PropertyPhotosProps } from '../types';
export type { PropertyDocumentsProps } from '../types';

// Exportar tipos de datos específicos
export type {
  PropertyBasicInfoData,
  PropertyInternalFeaturesData
} from '../types';

// Re-exportar tipos comunes
export type {
  PropertyType,
  ValidationErrors,
  ComponentWithErrors,
  FieldChangeHandler,
  FileUploadHandler,
  FileRemoveHandler
} from '../types';
