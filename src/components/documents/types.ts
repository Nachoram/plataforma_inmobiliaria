// Document types and status enums
export type DocumentType =
  | 'applicant_id'
  | 'applicant_proof_address'
  | 'guarantor_id'
  | 'guarantor_proof_address'
  | 'title_study'
  | 'property_doc'
  | 'income_proof'
  | 'bank_statement'
  | 'employment_letter'
  | 'tax_return'
  | 'other';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

// Main document interface
export interface IDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: number;
  mimeType?: string;
  // Additional metadata
  description?: string;
  expiresAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

// Document upload state
export interface DocumentUploadState {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// Document validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Document upload options
export interface DocumentUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
  required?: boolean;
}

// Document query filters
export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Document list response
export interface DocumentListResponse {
  documents: IDocument[];
  total: number;
  page: number;
  limit: number;
}

// Document categories for better organization
export enum DocumentCategory {
  APPLICANT = 'applicant',
  GUARANTOR = 'guarantor',
  PROPERTY = 'property',
  FINANCIAL = 'financial',
  LEGAL = 'legal'
}

// Document type configuration
export interface DocumentTypeConfig {
  type: DocumentType;
  label: string;
  category: DocumentCategory;
  description: string;
  maxSize: number; // in bytes
  allowedTypes: string[];
  required: boolean;
  expiresAfter?: number; // days
  helpText?: string;
}

// Predefined document configurations
export const DOCUMENT_TYPE_CONFIGS: Record<DocumentType, DocumentTypeConfig> = {
  applicant_id: {
    type: 'applicant_id',
    label: 'Cédula de Identidad - Postulante',
    category: DocumentCategory.APPLICANT,
    description: 'Cédula de identidad del postulante',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: true,
    expiresAfter: 365, // 1 year
    helpText: 'Documento de identidad válido y vigente'
  },
  applicant_proof_address: {
    type: 'applicant_proof_address',
    label: 'Comprobante de Domicilio - Postulante',
    category: DocumentCategory.APPLICANT,
    description: 'Comprobante de domicilio del postulante',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: false,
    expiresAfter: 90, // 3 months
    helpText: 'Boleta de servicios, cuenta de servicios públicos, etc.'
  },
  guarantor_id: {
    type: 'guarantor_id',
    label: 'Cédula de Identidad - Garante',
    category: DocumentCategory.GUARANTOR,
    description: 'Cédula de identidad del garante',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: true,
    expiresAfter: 365,
    helpText: 'Documento de identidad válido del garante'
  },
  guarantor_proof_address: {
    type: 'guarantor_proof_address',
    label: 'Comprobante de Domicilio - Garante',
    category: DocumentCategory.GUARANTOR,
    description: 'Comprobante de domicilio del garante',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: false,
    expiresAfter: 90,
    helpText: 'Comprobante de domicilio del garante'
  },
  title_study: {
    type: 'title_study',
    label: 'Estudio de Título',
    category: DocumentCategory.LEGAL,
    description: 'Estudio de título de la propiedad',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    required: true,
    helpText: 'Documento legal que certifica la propiedad del inmueble'
  },
  property_doc: {
    type: 'property_doc',
    label: 'Documento de Propiedad',
    category: DocumentCategory.PROPERTY,
    description: 'Documento legal de la propiedad',
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf'],
    required: true,
    helpText: 'Escritura, contrato de compraventa, etc.'
  },
  income_proof: {
    type: 'income_proof',
    label: 'Comprobante de Ingresos',
    category: DocumentCategory.FINANCIAL,
    description: 'Comprobante de ingresos del postulante',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: true,
    expiresAfter: 30, // 1 month
    helpText: 'Liquidación de sueldo, declaración jurada de ingresos, etc.'
  },
  bank_statement: {
    type: 'bank_statement',
    label: 'Extracto Bancario',
    category: DocumentCategory.FINANCIAL,
    description: 'Extracto bancario del postulante',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: false,
    expiresAfter: 30,
    helpText: 'Últimos 3 meses de movimientos bancarios'
  },
  employment_letter: {
    type: 'employment_letter',
    label: 'Carta de Empleo',
    category: DocumentCategory.APPLICANT,
    description: 'Carta o certificado de empleo',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    required: false,
    helpText: 'Documento que certifique la situación laboral'
  },
  tax_return: {
    type: 'tax_return',
    label: 'Declaración de Impuestos',
    category: DocumentCategory.FINANCIAL,
    description: 'Declaración de impuestos o renta',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf'],
    required: false,
    expiresAfter: 365,
    helpText: 'Última declaración de impuestos presentada'
  },
  other: {
    type: 'other',
    label: 'Otro Documento',
    category: DocumentCategory.APPLICANT,
    description: 'Documento adicional',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    required: false,
    helpText: 'Cualquier otro documento relevante'
  }
};

// Status colors for UI
export const DOCUMENT_STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  verified: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  }
} as const;

// Category colors for UI
export const DOCUMENT_CATEGORY_COLORS = {
  [DocumentCategory.APPLICANT]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800'
  },
  [DocumentCategory.GUARANTOR]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800'
  },
  [DocumentCategory.PROPERTY]: {
    bg: 'bg-green-100',
    text: 'text-green-800'
  },
  [DocumentCategory.FINANCIAL]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800'
  },
  [DocumentCategory.LEGAL]: {
    bg: 'bg-red-100',
    text: 'text-red-800'
  }
} as const;




