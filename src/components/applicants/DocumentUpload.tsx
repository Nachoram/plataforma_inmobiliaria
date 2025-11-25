import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  File
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ApplicantDocument } from './types';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  applicantId: string;
  documents: ApplicantDocument[];
  onDocumentsChange: (documents: ApplicantDocument[]) => void;
  maxFileSize?: number; // en bytes, default 5MB
  allowedTypes?: string[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  applicantId,
  documents,
  onDocumentsChange,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'id', label: 'Cédula de Identidad', required: true },
    { value: 'income_proof', label: 'Comprobante de Ingresos', required: true },
    { value: 'bank_statement', label: 'Extracto Bancario', required: false },
    { value: 'guarantor_id', label: 'Cédula del Garante', required: false },
    { value: 'guarantor_income', label: 'Comprobante de Ingresos del Garante', required: false },
    { value: 'other', label: 'Otro Documento', required: false }
  ];

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Solo se aceptan: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }

    if (file.size > maxFileSize) {
      return `El archivo es demasiado grande. Tamaño máximo: ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File, documentType: string): Promise<ApplicantDocument | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${applicantId}/${documentType}/${Date.now()}.${fileExt}`;
      const filePath = `applicant-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      // Crear registro en la base de datos (si existe la tabla)
      const documentData: ApplicantDocument = {
        id: Date.now().toString(), // temporal, debería venir de la DB
        applicant_id: applicantId,
        document_type: documentType as any,
        file_name: file.name,
        file_url: filePath,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      };

      return documentData;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Mostrar selector de tipo de documento
    const documentType = prompt(
      'Selecciona el tipo de documento:\n' +
      documentTypes.map(type => `${type.value}: ${type.label}`).join('\n')
    );

    if (!documentType || !documentTypes.find(t => t.value === documentType)) {
      toast.error('Tipo de documento inválido');
      return;
    }

    setUploading(true);
    try {
      const document = await uploadFile(file, documentType);
      if (document) {
        const newDocuments = [...documents, document];
        onDocumentsChange(newDocuments);
        toast.success('Documento subido exitosamente');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeDocument = async (documentId: string) => {
    try {
      const document = documents.find(d => d.id === documentId);
      if (!document) return;

      // Eliminar del storage
      const { error } = await supabase.storage
        .from('documents')
        .remove([document.file_url]);

      if (error) {
        console.error('Error deleting file:', error);
        toast.error('Error al eliminar el documento');
        return;
      }

      // Actualizar lista local
      const newDocuments = documents.filter(d => d.id !== documentId);
      onDocumentsChange(newDocuments);
      toast.success('Documento eliminado');
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  const downloadDocument = async (document: ApplicantDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_url);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error('Error al descargar el documento');
        return;
      }

      // Crear URL de descarga
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar el documento');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType ? docType.label : type;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return FileText;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return File;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2" />
        Documentos
      </h3>

      {/* Área de subida */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className={`mx-auto h-12 w-12 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Arrastra y suelta archivos aquí, o{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500 font-medium"
              disabled={uploading}
            >
              selecciona archivos
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            PDF, JPG, PNG hasta {Math.round(maxFileSize / 1024 / 1024)}MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Subiendo documento...</span>
        </div>
      )}

      {/* Lista de documentos */}
      {documents.length > 0 && (
        <div className="mt-6">
          <h4 className="text-base font-medium text-gray-900 mb-3">
            Documentos Subidos ({documents.length})
          </h4>
          <div className="space-y-3">
            {documents.map((document) => {
              const FileIcon = getFileIcon(document.file_name);
              const docType = documentTypes.find(t => t.value === document.document_type);
              const isRequired = docType?.required;

              return (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {document.file_name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{getDocumentTypeLabel(document.document_type)}</span>
                        <span>•</span>
                        <span>{formatFileSize(document.file_size)}</span>
                        {isRequired && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-medium">Requerido</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadDocument(document)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeDocument(document.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado de documentos requeridos */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-900 mb-2">
          Estado de Documentos Requeridos
        </h5>
        <div className="space-y-2">
          {documentTypes.filter(type => type.required).map((type) => {
            const hasDocument = documents.some(doc => doc.document_type === type.value);
            return (
              <div key={type.value} className="flex items-center text-sm">
                {hasDocument ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                )}
                <span className={hasDocument ? 'text-green-800' : 'text-red-800'}>
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;








