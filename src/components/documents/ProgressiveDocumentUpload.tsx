import React, { useState, useEffect } from 'react';
import { 
  getPropertyDocuments, 
  getApplicationDocuments, 
  uploadPropertyDocument, 
  uploadApplicationDocument, 
  deletePropertyDocument, 
  deleteApplicationDocument,
  PropertyDocument,
  ApplicationDocument
} from '../../lib/documentManagement';

export interface DocumentType {
  id: string;
  label: string;
  type: string;
  optional: true; // All documents are now optional
  uploaded?: boolean;
  fileCount?: number;
}

interface ProgressiveDocumentUploadProps {
  entityType: 'property' | 'application';
  entityId: string;
  requiredDocuments: DocumentType[]; // Renamed to keep semantics, but they are technically "available" types
  onComplete?: () => void;
  onDocumentUploaded?: (doc: any) => void;
}

export const ProgressiveDocumentUpload: React.FC<ProgressiveDocumentUploadProps> = ({
  entityType,
  entityId,
  requiredDocuments: availableDocuments, // Alias for internal use
  onComplete,
  onDocumentUploaded,
}) => {
  const [uploadedDocs, setUploadedDocs] = useState<Map<string, (PropertyDocument | ApplicationDocument)[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing documents
  useEffect(() => {
    loadDocuments();
  }, [entityId, entityType]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let docs: (PropertyDocument | ApplicationDocument)[] = [];
      if (entityType === 'property') {
        docs = await getPropertyDocuments(entityId);
      } else {
        docs = await getApplicationDocuments(entityId);
      }

      // Group by document type
      const docsMap = new Map<string, (PropertyDocument | ApplicationDocument)[]>();
      docs.forEach(doc => {
        const current = docsMap.get(doc.document_type) || [];
        current.push(doc);
        docsMap.set(doc.document_type, current);
      });

      setUploadedDocs(docsMap);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Error al cargar documentos existentes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (docType: DocumentType, file: File) => {
    setUploading(docType.id);
    setError(null);
    try {
      let result;
      if (entityType === 'property') {
        result = await uploadPropertyDocument(entityId, file, docType.type, docType.label);
      } else {
        result = await uploadApplicationDocument(entityId, file, docType.type, docType.label);
      }

      // Update local state
      const currentDocs = uploadedDocs.get(docType.type) || [];
      setUploadedDocs(new Map(uploadedDocs.set(docType.type, [...currentDocs, result])));
      
      onDocumentUploaded?.({ docId: docType.id, fileName: file.name, result });
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(`Error al cargar ${docType.label}: ${err.message || 'Error desconocido'}`);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docId: string, docType: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    
    try {
      if (entityType === 'property') {
        await deletePropertyDocument(docId);
      } else {
        await deleteApplicationDocument(docId);
      }

      // Update local state
      const currentDocs = uploadedDocs.get(docType) || [];
      const newDocs = currentDocs.filter(d => d.id !== docId);
      const newMap = new Map(uploadedDocs);
      if (newDocs.length > 0) {
        newMap.set(docType, newDocs);
      } else {
        newMap.delete(docType);
      }
      setUploadedDocs(newMap);

    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(`Error al eliminar documento: ${err.message}`);
    }
  };

  // Calculate progress
  // Count how many "types" have at least one document
  const uploadedTypesCount = availableDocuments.reduce((count, doc) => {
    return count + (uploadedDocs.has(doc.type) ? 1 : 0);
  }, 0);
  
  const totalTypesCount = availableDocuments.length;
  const progressPercentage = totalTypesCount > 0 ? (uploadedTypesCount / totalTypesCount) * 100 : 0;

  if (loading) return <div>Cargando documentos...</div>;

  return (
    <div className="progressive-document-upload bg-white p-6 rounded-lg shadow-md">
      <div className="progress-header mb-6">
        <h3 className="text-lg font-semibold mb-2">Documentos ({uploadedTypesCount}/{totalTypesCount})</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Puedes subir tus documentos ahora o hacerlo más tarde. Ningún documento es obligatorio para continuar.
        </p>
      </div>

      <div className="space-y-4">
        {availableDocuments.map(doc => {
          const docsForType = uploadedDocs.get(doc.type) || [];
          const isUploaded = docsForType.length > 0;

          return (
            <div key={doc.id} className="document-item border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {isUploaded ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Cargado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Opcional
                    </span>
                  )}
                  <label className="font-medium text-gray-900">{doc.label}</label>
                </div>
              </div>

              {/* List of uploaded files for this type */}
              {isUploaded && (
                <ul className="mb-3 space-y-2">
                  {docsForType.map((file) => (
                    <li key={file.id} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                      <span className="truncate max-w-[200px]">{file.original_file_name}</span>
                      <button 
                        onClick={() => handleDelete(file.id, doc.type)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="document-actions">
                <div className="relative">
                  <input
                    type="file"
                    id={`file-${doc.id}`}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(doc, e.target.files[0]);
                      }
                      // Reset value so same file can be selected again if needed
                      e.target.value = '';
                    }}
                    disabled={uploading === doc.id}
                  />
                  <label 
                    htmlFor={`file-${doc.id}`}
                    className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      uploading === doc.id ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {uploading === doc.id ? 'Subiendo...' : (isUploaded ? 'Agregar otro archivo' : 'Subir archivo')}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-md bg-red-50">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button 
          onClick={onComplete} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continuar / Finalizar
        </button>
      </div>
    </div>
  );
};

