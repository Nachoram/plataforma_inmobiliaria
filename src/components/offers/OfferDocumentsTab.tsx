import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { SaleOffer, OfferDocument, DOCUMENT_TYPES } from './types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface OfferDocumentsTabProps {
  offer: SaleOffer;
  documents: OfferDocument[];
  onDocumentsChange: () => Promise<void>;
}

export const OfferDocumentsTab: React.FC<OfferDocumentsTabProps> = ({
  offer,
  documents,
  onDocumentsChange
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  // Group documents
  const uploadedDocs = documents.filter(d => d.status !== 'pendiente' || d.file_url);
  const missingDocs = documents.filter(d => d.status === 'pendiente' && !d.file_url);

  // Calculate progress
  const totalRequired = documents.filter(d => d.is_required).length;
  const totalUploaded = documents.filter(d => d.is_required && (d.status === 'recibido' || d.status === 'validado')).length;
  const progressPercentage = totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

  const handleFileUpload = async (files: FileList | null, docType?: string, docId?: string) => {
    if (!files || files.length === 0 || !offer.id) return;

    const file = files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${offer.id}/${Date.now()}.${fileExt}`;
      const filePath = `offer-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (docId) {
        // Update existing document request or re-upload
        const { error: dbError } = await supabase
          .from('offer_documents')
          .update({
            document_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            status: 'recibido',
            uploaded_at: new Date().toISOString()
          })
          .eq('id', docId);

        if (dbError) throw dbError;
      } else {
        // New document upload
        const { error: dbError } = await supabase
          .from('offer_documents')
          .insert({
            offer_id: offer.id,
            document_name: file.name,
            document_type: docType || 'otro',
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            status: 'recibido',
            uploaded_at: new Date().toISOString()
          });

        if (dbError) throw dbError;
      }

      toast.success('Documento subido exitosamente');
      await onDocumentsChange();

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedDocType(null);
    }
  };

  const triggerUpload = (docType?: string, docId?: string) => {
    setSelectedDocType(docType || null);
    // Store docId in a way handleFileUpload can access it, or wrap handleFileUpload
    // Simplified: we'll just use the ref click and assume the state is set? 
    // Actually, handleFileUpload receives the file event. 
    // We need to pass docType/docId to the change handler.
    // Let's change how we attach the handler.
    
    if (fileInputRef.current) {
        // We'll attach a one-time listener or use a closure if we were rendering the input per button.
        // Better: store the target context in state.
        // But since file input is hidden, we can't easily pass args.
        // We will store the "target" in state before clicking.
        // See 'activeUploadTarget' below.
    }
  };
  
  const [activeUploadTarget, setActiveUploadTarget] = useState<{type?: string, id?: string} | null>(null);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (activeUploadTarget) {
          handleFileUpload(e.target.files, activeUploadTarget.type, activeUploadTarget.id);
          setActiveUploadTarget(null);
      } else {
          // Generic upload?
          handleFileUpload(e.target.files);
      }
  };

  const startUpload = (type?: string, id?: string) => {
      setActiveUploadTarget({ type, id });
      setTimeout(() => fileInputRef.current?.click(), 0);
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {/* Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso de Documentación</h3>
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
                {totalUploaded} de {totalRequired} documentos requeridos cargados
            </span>
            <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
            ></div>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Tus Documentos</h3>
        </div>
        <div className="divide-y divide-gray-100">
            {uploadedDocs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No has cargado documentos aún</p>
                </div>
            ) : (
                uploadedDocs.map(doc => (
                    <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <div className="mt-1">
                                    {doc.status === 'validado' ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : doc.status === 'rechazado' ? (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{doc.document_name}</h4>
                                    <p className="text-sm text-gray-500">{DOCUMENT_TYPES[doc.document_type] || doc.document_type}</p>
                                    
                                    <div className="mt-1 flex items-center gap-2 text-xs">
                                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                                            doc.status === 'validado' ? 'bg-green-100 text-green-800' :
                                            doc.status === 'rechazado' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {doc.status === 'validado' ? 'Verificado' : 
                                             doc.status === 'rechazado' ? 'Rechazado' : 'Cargado'}
                                        </span>
                                        <span className="text-gray-400">
                                            {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {doc.status === 'rechazado' && doc.notes && (
                                        <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-100 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>Motivo: {doc.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {doc.file_url && (
                                    <a 
                                        href={doc.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Descargar"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}
                                <button 
                                    onClick={() => startUpload(doc.document_type, doc.id)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Recargar"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Missing Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-900">Documentos Faltantes</h3>
        </div>
        <div className="divide-y divide-gray-100">
            {missingDocs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                    <p>¡Estás al día! No tienes documentos pendientes.</p>
                </div>
            ) : (
                missingDocs.map(doc => (
                    <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 rounded border-2 border-gray-300"></div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{doc.document_name || DOCUMENT_TYPES[doc.document_type]}</h4>
                                    {doc.requested_by && (
                                        <p className="text-xs text-orange-600 font-medium flex items-center gap-1 mt-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Vendedor solicitó este documento
                                        </p>
                                    )}
                                    {doc.notes && (
                                        <p className="text-sm text-gray-500 mt-1">{doc.notes}</p>
                                    )}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => startUpload(doc.document_type, doc.id)}
                                disabled={uploading}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Subiendo...' : 'Cargar Documento'}
                            </button>
                        </div>
                    </div>
                ))
            )}
            
            {/* Generic upload for other documents */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                    onClick={() => startUpload()}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Cargar otro documento
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// Import Plus icon which I missed
import { Plus } from 'lucide-react';

