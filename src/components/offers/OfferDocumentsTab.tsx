import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileText, RefreshCw, Plus, UserCheck, UserX, Shield, Home, FileCheck } from 'lucide-react';
import { SaleOffer, OfferDocument, DOCUMENT_TYPES } from './types';
import { supabase } from '../../lib/supabase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useDocumentAuthorization } from '../../hooks/useDocumentAuthorization';
import { usePropertyDocuments, getPropertyDocumentTypeLabel } from '../../hooks/usePropertyDocuments';
import toast from 'react-hot-toast';

interface OfferDocumentsTabProps {
  offer: SaleOffer;
  documents: OfferDocument[];
  onDocumentsChange: () => Promise<void>;
  viewMode?: 'buyer' | 'seller' | 'admin';
  userRole?: 'buyer' | 'seller' | 'admin';
  onRefreshData?: () => Promise<void>;
  // Nuevos props para autorización
  canAuthorize?: boolean;
  sellerCanViewDocuments?: boolean;
  onAuthorizeSeller?: (authorizedUserId: string, permissionType?: string, specificDocuments?: string[], expiresAt?: string) => Promise<any>;
  onRevokeAuthorization?: (authorizationId: string) => Promise<void>;
}

export const OfferDocumentsTab: React.FC<OfferDocumentsTabProps> = ({
  offer,
  documents,
  onDocumentsChange,
  userRole = 'buyer',
  canAuthorize = false,
  sellerCanViewDocuments = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAuthorizeSeller,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRevokeAuthorization
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Estado para tipo de documento seleccionado (usado en futuras funcionalidades de autorización)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  // Cargar documentos de la propiedad
  const {
    documents: propertyDocuments,
    isLoading: propertyDocsLoading,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error: propertyDocsError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    refetch: refetchPropertyDocs
  } = usePropertyDocuments(offer.property_id);

  // Group documents
  const uploadedDocs = documents.filter(d => d.status !== 'pendiente' || d.file_url);
  const missingDocs = documents.filter(d => d.status === 'pendiente' && !d.file_url);

  // Calculate progress
  const totalRequired = documents.filter(d => d.is_required).length;
  const totalUploaded = documents.filter(d => d.is_required && (d.status === 'recibido' || d.status === 'validado')).length;
  const progressPercentage = totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

  // Determinar permisos de visualización
  const canViewDocuments = userRole === 'buyer' || (userRole === 'seller' && sellerCanViewDocuments) || userRole === 'admin';
  const canUploadDocuments = userRole === 'buyer' || userRole === 'admin';
  const canAuthorizeOthers = canAuthorize && userRole === 'buyer';

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

  // Función para disparar carga de archivos (usada en futuras funcionalidades de autorización)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const triggerUpload = (docType?: string, docId?: string) => { // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      {/* Authorization Section - Only for buyers */}
      {canAuthorizeOthers && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Autorización de Documentos</h3>
            {!sellerCanViewDocuments && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Sistema en mantenimiento
              </span>
            )}
          </div>

          {sellerCanViewDocuments ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Vendedor autorizado</p>
                  <p className="text-xs text-green-600">El vendedor puede ver tus documentos</p>
                </div>
              </div>
              <button
                onClick={() => onRevokeAuthorization?.('current')} // TODO: implementar ID real
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Revocar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Vendedor no autorizado</p>
                  <p className="text-xs text-gray-600">El vendedor no puede ver tus documentos</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Sistema de autorizaciones en mantenimiento.</strong> Actualmente, los vendedores no pueden acceder a los documentos hasta que se complete la actualización del sistema.
                </p>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white text-sm rounded-lg cursor-not-allowed flex items-center gap-2 opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                Autorizar (No disponible)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Access Denied Section - For unauthorized sellers */}
      {!canViewDocuments && userRole === 'seller' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-700 mb-4">
            El comprador aún no te ha autorizado para ver los documentos de esta oferta.
          </p>
          <p className="text-sm text-yellow-600">
            Una vez que el comprador te autorice, podrás acceder a todos los documentos aquí.
          </p>
        </div>
      )}

      {/* Property Documents Section - Always visible for buyers */}
      {canViewDocuments && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-blue-50">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Documentos de la Propiedad</h3>
                <p className="text-sm text-blue-700">Documentos oficiales de la propiedad que estás comprando</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {propertyDocsLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p>Cargando documentos de la propiedad...</p>
              </div>
            ) : propertyDocuments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No hay documentos disponibles</p>
                <p className="text-sm text-gray-400 mt-1">
                  Los documentos de la propiedad estarán disponibles próximamente
                </p>
              </div>
            ) : (
              propertyDocuments.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getPropertyDocumentTypeLabel(doc.doc_type)}
                          </h4>
                          {doc.file_name && (
                            <p className="text-sm text-gray-600">{doc.file_name}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Subido el {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                            {doc.file_size_bytes && (
                              <span className="ml-2">
                                ({(doc.file_size_bytes / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            )}
                          </p>
                          {doc.notes && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{doc.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {doc.file_url && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver documento"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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

      {/* Buyer's Offer Documents - Only show if user can view documents */}
      {canViewDocuments && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-green-50">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Tus Documentos de Oferta</h3>
                <p className="text-sm text-green-700">Documentos que debes proporcionar para tu oferta</p>
              </div>
            </div>
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
                                {canUploadDocuments && (
                                  <button
                                      onClick={() => startUpload(doc.document_type, doc.id)}
                                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Recargar"
                                  >
                                      <RefreshCw className="w-4 h-4" />
                                  </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
      )}

      {/* Missing Documents - Only show if user can view documents */}
      {canViewDocuments && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-orange-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-orange-900">Documentos Faltantes</h3>
                <p className="text-sm text-orange-700">Documentos requeridos que aún no has subido</p>
              </div>
            </div>
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
      )}
    </div>
  );
};

export default OfferDocumentsTab;

