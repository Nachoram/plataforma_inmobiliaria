import React, { memo } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { PropertyDocumentsProps } from '../../types';
import { ProgressiveDocumentUpload, DocumentType } from '../../../../documents/ProgressiveDocumentUpload';

// Documentos requeridos para arriendo (extraídos del componente padre)
const RENTAL_DOCUMENTS: DocumentType[] = [
  { id: 'dom_vigente', label: 'Certificado de Dominio Vigente', type: 'certificado_dominio', optional: true },
  { id: 'avaluo', label: 'Certificado de Avalúo Fiscal', type: 'avaluo_fiscal', optional: true },
  { id: 'hipotecas', label: 'Certificado de Hipoteca y Gravamen', type: 'certificado_hipotecas', optional: true },
  { id: 'owner_id', label: 'Fotocopia de Cédula de Identidad del Propietario', type: 'cedula_identidad', optional: true },
  { id: 'poder', label: 'Poder (si aplica)', type: 'poder_notarial', optional: true },
  { id: 'evaluacion', label: 'Evaluación Comercial de la Propiedad', type: 'evaluacion_comercial', optional: true },
  { id: 'personeria', label: 'Certificado de Personería', type: 'certificado_personeria', optional: true },
];

/**
 * Componente PropertyDocuments - Gestión de documentos legales
 *
 * Responsabilidades:
 * - Mostrar documentos requeridos para arriendo
 * - Gestionar carga progresiva en modo edición
 * - Mostrar lista informativa en modo creación
 * - Manejar errores de documentos
 */
export const PropertyDocuments: React.FC<PropertyDocumentsProps> = memo(({
  propertyType,
  owners,
  onDocumentUpload,
  onDocumentRemove,
  errors,
  isEditing = false,
  entityId
}) => {
  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documentos Legales</h2>
          <p className="text-sm text-gray-600">
            Estos documentos son necesarios para el arriendo, pero puedes cargarlos después de publicar la propiedad.
          </p>
        </div>
      </div>

      {/* Modo Edición - Carga Progresiva */}
      {isEditing && entityId ? (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              <strong>Modo Edición:</strong> Puedes gestionar los documentos directamente aquí.
            </p>
          </div>
          <ProgressiveDocumentUpload
            entityType="property"
            entityId={entityId}
            requiredDocuments={RENTAL_DOCUMENTS}
          />
        </div>
      ) : (
        /* Modo Creación - Lista Informativa */
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Carga Progresiva de Documentos</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    No es necesario que tengas todos los documentos ahora. Podrás subirlos en cualquier momento desde tu panel de control
                    o después de crear la publicación.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {/* Lista de documentos para display */}
            {RENTAL_DOCUMENTS.map(doc => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    OPCIONAL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mostrar errores de documentos si existen */}
      {errors?.documents && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          {errors.documents}
        </div>
      )}
    </div>
  );
});

PropertyDocuments.displayName = 'PropertyDocuments';
