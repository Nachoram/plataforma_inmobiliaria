import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { IDocument } from './types';
import { isImageFile, isPDFFile, formatFileSize } from './utils';
import { supabase } from '../../lib/supabase';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface DocumentViewerProps {
  document: IDocument;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      loadDocument();
    }
  }, [isOpen, document]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      setImageData(null);

      // For images, we can display them directly
      if (document.mimeType?.startsWith('image/')) {
        setImageData(document.url);
      } else if (document.mimeType === 'application/pdf') {
        // For PDFs, we'll show a placeholder for now
        // In a real implementation, you'd use a PDF viewer library
        setError('Vista previa de PDF no disponible. Use el botón de descarga.');
      } else {
        setError('Tipo de archivo no soportado para vista previa');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error('Error al descargar el documento');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className={`
        relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4
        ${isFullscreen ? 'h-screen max-w-none mx-0 rounded-none' : 'max-h-[90vh]'}
        ${className}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            {document.mimeType?.startsWith('image/') ? (
              <ImageIcon className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {document.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.fileSize || 0)} •
                Subido: {new Date(document.uploadedAt).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Image controls */}
            {imageData && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Alejar"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Acercar"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Rotar"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Pantalla completa"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </>
            )}

            <CustomButton
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </CustomButton>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`
          ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'max-h-[600px]'}
          overflow-auto bg-gray-50
        `}>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando documento...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error al cargar el documento
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <CustomButton onClick={handleDownload}>
                Descargar archivo
              </CustomButton>
            </div>
          )}

          {imageData && !loading && !error && (
            <div className="flex items-center justify-center p-8">
              <div className="relative overflow-hidden">
                <img
                  src={imageData}
                  alt={document.name}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onDoubleClick={resetView}
                />
              </div>
            </div>
          )}

          {!imageData && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vista previa no disponible
              </h3>
              <p className="text-gray-600 mb-4">
                Este tipo de archivo no puede mostrarse como vista previa.
              </p>
              <CustomButton onClick={handleDownload}>
                Descargar archivo
              </CustomButton>
            </div>
          )}
        </div>

        {/* Footer with document info */}
        <div className="border-t p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Tipo:</span>
              <p className="text-gray-600">{document.type}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Estado:</span>
              <p className="text-gray-600 capitalize">{document.status}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Subido por:</span>
              <p className="text-gray-600">{document.uploadedBy}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Fecha:</span>
              <p className="text-gray-600">
                {new Date(document.uploadedAt).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick preview component (smaller, inline)
interface DocumentPreviewProps {
  document: IDocument;
  onViewFull?: () => void;
  className?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onViewFull,
  className = ''
}) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (document.mimeType?.startsWith('image/')) {
      setImageData(document.url);
    }
    setLoading(false);
  }, [document]);

  return (
    <div className={`relative border rounded-lg overflow-hidden bg-gray-50 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : imageData ? (
        <div className="relative group">
          <img
            src={imageData}
            alt={document.name}
            className="w-full h-32 object-cover"
          />
          {onViewFull && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
              <button
                onClick={onViewFull}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2"
              >
                <Eye className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <FileText className="h-8 w-8 mb-2" />
          <span className="text-xs">Vista previa no disponible</span>
        </div>
      )}

      <div className="p-2 bg-white">
        <p className="text-xs font-medium text-gray-900 truncate">
          {document.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(document.fileSize || 0)}
        </p>
      </div>
    </div>
  );
};

export default DocumentViewer;



