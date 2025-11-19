import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { DocumentType, ValidationResult } from './types';
import {
  validateFileForType,
  isValidFileType,
  formatFileSize,
  getMaxSizeForDocument,
  getAllowedTypesForDocument,
  isDocumentExpired
} from './utils';

interface DocumentValidatorProps {
  file: File;
  documentType: DocumentType;
  onValidationComplete?: (result: ValidationResult) => void;
  showResults?: boolean;
  className?: string;
}

export const DocumentValidator: React.FC<DocumentValidatorProps> = ({
  file,
  documentType,
  onValidationComplete,
  showResults = true,
  className = ''
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateDocument = useCallback(() => {
    const result = validateFileForType(file, documentType);
    setValidationResult(result);

    if (onValidationComplete) {
      onValidationComplete(result);
    }

    return result;
  }, [file, documentType, onValidationComplete]);

  // Auto-validate when file or type changes
  React.useEffect(() => {
    validateDocument();
  }, [validateDocument]);

  if (!showResults || !validationResult) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {validationResult.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Errores de validación</h4>
              <ul className="mt-1 text-sm text-red-700 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validationResult.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">Advertencias</h4>
              <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validationResult.isValid && validationResult.errors.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">Documento válido</h4>
              <p className="mt-1 text-sm text-green-700">
                El archivo cumple con todos los requisitos para este tipo de documento.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook version for programmatic validation
export const useDocumentValidator = () => {
  const validateFile = useCallback((file: File, documentType: DocumentType): ValidationResult => {
    return validateFileForType(file, documentType);
  }, []);

  const validateMultipleFiles = useCallback((
    files: File[],
    documentType: DocumentType
  ): ValidationResult[] => {
    return files.map(file => validateFileForType(file, documentType));
  }, []);

  const getValidationSummary = useCallback((results: ValidationResult[]) => {
    const total = results.length;
    const valid = results.filter(r => r.isValid).length;
    const invalid = total - valid;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      total,
      valid,
      invalid,
      totalErrors,
      totalWarnings,
      isAllValid: invalid === 0
    };
  }, []);

  return {
    validateFile,
    validateMultipleFiles,
    getValidationSummary
  };
};

// Utility component for displaying file info during validation
export const FileInfoDisplay: React.FC<{
  file: File;
  documentType: DocumentType;
  className?: string;
}> = ({ file, documentType, className = '' }) => {
  const maxSize = getMaxSizeForDocument(documentType);
  const allowedTypes = getAllowedTypesForDocument(documentType);

  const isValidSize = file.size <= maxSize;
  const isValidType = isValidFileType(file, allowedTypes);

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3">Información del archivo</h4>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Nombre:</span>
          <span className="font-medium">{file.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Tamaño:</span>
          <span className={`font-medium ${isValidSize ? 'text-green-600' : 'text-red-600'}`}>
            {formatFileSize(file.size)}
            {!isValidSize && ` (máx: ${formatFileSize(maxSize)})`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Tipo:</span>
          <span className={`font-medium ${isValidType ? 'text-green-600' : 'text-red-600'}`}>
            {file.type || 'Desconocido'}
            {!isValidType && ` (permitidos: ${allowedTypes.map(t => t.split('/')[1]).join(', ')})`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Última modificación:</span>
          <span className="font-medium">
            {new Date(file.lastModified).toLocaleDateString('es-CL')}
          </span>
        </div>
      </div>
    </div>
  );
};

// Export types for external use
export type { ValidationResult } from './types';






