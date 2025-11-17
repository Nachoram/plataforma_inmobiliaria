import React from 'react';
import { Upload, Paperclip, Trash2, FileText } from 'lucide-react';

interface DocumentData {
  type: string;
  label: string;
  required?: boolean;
  file?: File;
  url?: string;
  uploaded?: boolean;
}

interface DocumentUploaderProps {
  label: string;
  name: string;
  required?: boolean;
  uploaded?: boolean;
  fileName?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  className?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  label,
  name,
  required = false,
  uploaded = false,
  fileName,
  onUpload,
  onRemove,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  className = ""
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  };

  return (
    <div className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${className}`}>
      <div className="flex-shrink-0">
        <FileText className="h-5 w-5 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
          {required && (
            <span className="text-xs text-red-600 font-medium">*</span>
          )}
        </div>
        {uploaded && (
          <div className="flex items-center gap-2 mt-1">
            <Paperclip className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700 truncate">
              {fileName || 'Documento subido'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {uploaded ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            title="Remover documento"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Remover</span>
          </button>
        ) : (
          <label className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Subir</span>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              name={name}
            />
          </label>
        )}
      </div>
    </div>
  );
};

interface DocumentSectionProps {
  title: string;
  documents: DocumentData[];
  onUpload: (documentType: string, file: File) => void;
  onRemove: (documentType: string) => void;
  className?: string;
  icon?: React.ReactNode;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  title,
  documents,
  onUpload,
  onRemove,
  className = "",
  icon
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b pb-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          {icon}
          {title}
        </h2>
      </div>

      <div className="grid gap-4">
        {documents.map((doc) => {
          const isUploaded = doc.uploaded || (doc.file || doc.url);

          return (
            <DocumentUploader
              key={doc.type}
              label={doc.label}
              name={doc.type}
              required={doc.required}
              uploaded={isUploaded}
              fileName={doc.file?.name}
              onUpload={(file) => onUpload(doc.type, file)}
              onRemove={() => onRemove(doc.type)}
            />
          );
        })}
      </div>
    </div>
  );
};

