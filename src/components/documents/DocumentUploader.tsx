import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { DocumentType, DocumentUploadState } from './types';
import {
  validateFileForType,
  generateUniqueFileName,
  getDocumentTypeLabel,
  formatFileSize,
  getFileTypeIcon
} from './utils';
import { DocumentValidator } from './DocumentValidator';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface DocumentUploaderProps {
  documentType: DocumentType;
  onUploadComplete?: (document: any) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  className = '',
  disabled = false,
  showValidation = true
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStates, setUploadStates] = useState<DocumentUploadState[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFilesSelected(files);
  }, [disabled]);

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;

    // Limit number of files
    const filesToProcess = files.slice(0, maxFiles);

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    filesToProcess.forEach(file => {
      const validation = validateFileForType(file, documentType);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      toast.error(`Errores en archivos:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      initializeUploadStates(validFiles);
    }
  };

  const initializeUploadStates = (files: File[]) => {
    const states: DocumentUploadState[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    setUploadStates(states);
  };

  const uploadFile = async (file: File, index: number) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      // Generate unique filename
      const fileName = generateUniqueFileName(file.name, user.id, documentType);
      const filePath = `documents/${fileName}`;

      // Update progress
      setUploadStates(prev => prev.map((state, i) =>
        i === index ? { ...state, progress: 10 } : state
      ));

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Update progress
      setUploadStates(prev => prev.map((state, i) =>
        i === index ? { ...state, progress: 70 } : state
      ));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save document metadata to database
      const documentData = {
        name: file.name,
        type: documentType,
        url: publicUrl,
        uploaded_by: user.id,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending' as const,
        uploaded_at: new Date().toISOString()
      };

      // Here you would save to your applicant_documents table
      // For now, we'll just simulate success
      const savedDocument = {
        id: Date.now().toString(),
        ...documentData
      };

      // Update progress to complete
      setUploadStates(prev => prev.map((state, i) =>
        i === index ? { ...state, progress: 100, status: 'completed' } : state
      ));

      if (onUploadComplete) {
        onUploadComplete(savedDocument);
      }

      toast.success(`Documento "${file.name}" subido exitosamente`);

    } catch (error: any) {
      console.error('Upload error:', error);

      setUploadStates(prev => prev.map((state, i) =>
        i === index ? {
          ...state,
          status: 'error',
          error: error.message || 'Error al subir el archivo'
        } : state
      ));

      if (onUploadError) {
        onUploadError(error.message || 'Error al subir el archivo');
      }

      toast.error(`Error al subir "${file.name}": ${error.message}`);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Upload all files
    const uploadPromises = selectedFiles.map((file, index) =>
      uploadFile(file, index)
    );

    await Promise.allSettled(uploadPromises);

    // Clear selected files after upload
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadStates([]);
    }, 2000);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStates(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver
            ? 'border-blue-500 bg-blue-50'
            : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))}
          className="hidden"
          disabled={disabled}
        />

        <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {isDragOver
              ? 'Suelta los archivos aquí'
              : 'Arrastra y suelta archivos aquí, o haz clic para seleccionar'
            }
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {getDocumentTypeLabel(documentType)} • PDF, JPG, PNG hasta 5MB
          </p>
        </div>

        {disabled && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center">
            <p className="text-sm text-gray-500">Subida deshabilitada</p>
          </div>
        )}
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Archivos seleccionados ({selectedFiles.length})
          </h4>

          {selectedFiles.map((file, index) => {
            const uploadState = uploadStates[index];
            const isUploading = uploadState?.status === 'uploading';
            const isCompleted = uploadState?.status === 'completed';
            const hasError = uploadState?.status === 'error';

            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{getFileTypeIcon(file)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isUploading && (
                    <div className="flex items-center space-x-2">
                      <Loader className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-xs text-blue-600">
                        {uploadState.progress}%
                      </span>
                    </div>
                  )}

                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}

                  {hasError && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}

                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Validation Results */}
          {showValidation && selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <DocumentValidator
                  key={index}
                  file={file}
                  documentType={documentType}
                  showResults={true}
                />
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end pt-2">
            <CustomButton
              onClick={handleUpload}
              disabled={uploadStates.some(state => state.status === 'uploading')}
              loading={uploadStates.some(state => state.status === 'uploading')}
            >
              {uploadStates.some(state => state.status === 'uploading')
                ? 'Subiendo...'
                : `Subir ${selectedFiles.length} archivo${selectedFiles.length > 1 ? 's' : ''}`
              }
            </CustomButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;








