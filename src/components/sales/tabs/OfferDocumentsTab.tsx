import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Clock,
  Trash2
} from 'lucide-react';
import { SaleOffer, OfferDocument, UserRole, DocumentRequestFormData, DOCUMENT_TYPES, STATUS_COLORS } from '../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

interface OfferDocumentsTabProps {
  offer: SaleOffer;
  userRole: UserRole | null;
  documents: OfferDocument[];
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onDocumentsChange: () => Promise<void>;
  viewMode?: 'buyer' | 'seller';
}

const OfferDocumentsTab: React.FC<OfferDocumentsTabProps> = ({
  offer,
  userRole,
  documents,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData,
  onDocumentsChange,
  viewMode = 'seller'
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<OfferDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [requestFormData, setRequestFormData] = useState<DocumentRequestFormData>({
    document_name: '',
    document_type: 'cedula',
    description: '',
    is_required: false,
    due_date: ''
  });

  // ========================================================================
  // FILTERS AND SEARCH
  // ========================================================================

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         DOCUMENT_TYPES[doc.document_type].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // ========================================================================
  // FILE UPLOAD FUNCTIONS
  // ========================================================================

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !offer.id) return;

    const file = files[0];
    setUploading(true);

    try {
      // Determinar tipo de documento basado en el nombre del archivo
      const documentType = determineDocumentType(file.name);

      // Subir archivo a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${offer.id}/${Date.now()}.${fileExt}`;
      const filePath = `offer-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error('No se pudo obtener la URL del archivo');

      // Crear registro en la base de datos
      const { error: dbError } = await supabase
        .from('offer_documents')
        .insert({
          offer_id: offer.id,
          document_name: file.name,
          document_type: documentType,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          status: 'recibido'
        });

      if (dbError) throw dbError;

      toast.success('Documento subido exitosamente');
      await onDocumentsChange();

      await onAddTimelineEvent({
        event_type: 'documento_subido',
        event_title: 'Documento subido',
        event_description: `Se subió el documento: ${file.name}`,
        related_data: { document_type: documentType, file_size: file.size }
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const determineDocumentType = (fileName: string): OfferDocument['document_type'] => {
    const name = fileName.toLowerCase();

    if (name.includes('cedula') || name.includes('id')) return 'cedula';
    if (name.includes('ingresos') || name.includes('sueldo')) return 'comprobante_ingresos';
    if (name.includes('dominio') || name.includes('titulo')) return 'certificado_dominio';
    if (name.includes('agua')) return 'boleta_agua';
    if (name.includes('luz') || name.includes('electricidad')) return 'boleta_luz';
    if (name.includes('gas')) return 'boleta_gas';
    if (name.includes('arriendo') || name.includes('alquiler')) return 'contrato_arriendo';
    if (name.includes('renta')) return 'declaracion_renta';
    if (name.includes('matrimonio')) return 'certificado_matrimonio';
    if (name.includes('poder')) return 'poder_notarial';

    return 'otro';
  };

  // ========================================================================
  // DOCUMENT MANAGEMENT FUNCTIONS
  // ========================================================================

  const handleRequestDocument = async () => {
    if (!user || !offer.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_documents')
        .insert({
          offer_id: offer.id,
          document_name: requestFormData.document_name,
          document_type: requestFormData.document_type,
          status: 'pendiente',
          is_required: requestFormData.is_required,
          notes: requestFormData.description,
          requested_by: user.id
        });

      if (error) throw error;

      toast.success('Documento solicitado exitosamente');
      setShowRequestModal(false);
      resetRequestForm();
      await onDocumentsChange();

      await onAddTimelineEvent({
        event_type: 'documento_solicitado',
        event_title: 'Documento solicitado',
        event_description: `Se solicitó: ${requestFormData.document_name}`,
        related_data: { document_type: requestFormData.document_type, is_required: requestFormData.is_required }
      });

    } catch (error: any) {
      console.error('Error requesting document:', error);
      toast.error('Error al solicitar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateDocument = async (documentId: string, isValid: boolean, notes?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_documents')
        .update({
          status: isValid ? 'validado' : 'rechazado',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      toast.success(`Documento ${isValid ? 'validado' : 'rechazado'} exitosamente`);
      await onDocumentsChange();

      await onAddTimelineEvent({
        event_type: 'documento_validado',
        event_title: `Documento ${isValid ? 'aprobado' : 'rechazado'}`,
        event_description: `Validación: ${isValid ? 'Aprobado' : 'Rechazado'}`,
        related_data: { document_id: documentId, is_valid: isValid }
      });

    } catch (error: any) {
      console.error('Error validating document:', error);
      toast.error('Error al validar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (document: OfferDocument) => {
    try {
      // En una implementación real, esto descargaría el archivo
      window.open(document.file_url, '_blank');
    } catch (error) {
      toast.error('Error al descargar el documento');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Documento eliminado exitosamente');
      await onDocumentsChange();

    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar el documento');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // FORM HANDLERS
  // ========================================================================

  const resetRequestForm = () => {
    setRequestFormData({
      document_name: '',
      document_type: 'cedula',
      description: '',
      is_required: false,
      due_date: ''
    });
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getDocumentStatusIcon = (status: OfferDocument['status']) => {
    switch (status) {
      case 'validado': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'recibido': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rechazado': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'buyer' ? 'Mis Documentos' : 'Gestión de Documentos'}
          </h2>
          <p className="text-gray-600">
            {viewMode === 'buyer'
              ? 'Sube los documentos solicitados para completar tu oferta'
              : 'Administra los documentos requeridos para esta oferta'
            }
          </p>
        </div>

        <div className="flex gap-3">
          {(viewMode === 'seller' || userRole === 'admin') && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Solicitar Documento
            </button>
          )}

          {viewMode === 'buyer' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Upload className="w-4 h-4" />
              Subir Documento
            </button>
          )}
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'pendiente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Recibidos</p>
              <p className="text-xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'recibido').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Validados</p>
              <p className="text-xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'validado').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rechazados</p>
              <p className="text-xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'rechazado').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="recibido">Recibido</option>
              <option value="validado">Validado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          <div className="w-full lg:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No se encontraron documentos</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {document.document_name}
                          </div>
                          {document.notes && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {document.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {DOCUMENT_TYPES[document.document_type]}
                      </span>
                      {document.is_required && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Requerido
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getDocumentStatusIcon(document.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[document.status] || STATUS_COLORS.pendiente}`}>
                          {document.status.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {document.file_size ? formatFileSize(document.file_size) : 'N/A'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(document.created_at).toLocaleDateString('es-CL')}
                      </div>
                      {document.expires_at && (
                        <div className={`text-xs ${isExpired(document.expires_at) ? 'text-red-600' : 'text-gray-500'}`}>
                          Expira: {new Date(document.expires_at).toLocaleDateString('es-CL')}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {document.file_url && (
                          <>
                            <button
                              onClick={() => handleDownloadDocument(document)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Descargar"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(document.file_url, '_blank')}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Ver"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {(userRole === 'seller' || userRole === 'admin') && document.status === 'recibido' && (
                          <>
                            <button
                              onClick={() => handleValidateDocument(document.id, true)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleValidateDocument(document.id, false)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {(userRole === 'seller' || userRole === 'admin') && (
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900">Subir Documento</h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona el archivo que deseas subir
              </p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />

              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Subiendo documento...</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Document Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Solicitar Documento</h3>
              <p className="text-sm text-gray-600 mt-1">
                Solicita un documento específico al comprador
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRequestDocument(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Documento
                </label>
                <input
                  type="text"
                  value={requestFormData.document_name}
                  onChange={(e) => setRequestFormData({ ...requestFormData, document_name: e.target.value })}
                  placeholder="Ej: Cédula de Identidad de Juan Pérez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={requestFormData.document_type}
                  onChange={(e) => setRequestFormData({ ...requestFormData, document_type: e.target.value as OfferDocument['document_type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={requestFormData.description}
                  onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                  placeholder="Describe por qué necesitas este documento..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={requestFormData.is_required}
                  onChange={(e) => setRequestFormData({ ...requestFormData, is_required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_required" className="text-sm font-medium text-gray-700">
                  Documento obligatorio
                </label>
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  resetRequestForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestDocument}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? 'Solicitando...' : 'Solicitar Documento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferDocumentsTab;
