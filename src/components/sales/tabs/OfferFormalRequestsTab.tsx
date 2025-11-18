import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Send,
  Eye,
  MessageSquare,
  User,
  Paperclip,
  Settings
} from 'lucide-react';
import { SaleOffer, OfferFormalRequest, UserRole, FormalRequestFormData, FORMAL_REQUEST_TYPES, STATUS_COLORS } from '../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

interface OfferFormalRequestsTabProps {
  offer: SaleOffer;
  userRole: UserRole | null;
  formalRequests: OfferFormalRequest[];
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onRequestsChange: () => Promise<void>;
  viewMode?: 'buyer' | 'seller';
}

const OfferFormalRequestsTab: React.FC<OfferFormalRequestsTabProps> = ({
  offer,
  userRole,
  formalRequests,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData,
  onRequestsChange,
  viewMode = 'seller'
}) => {
  const { user } = useAuth();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OfferFormalRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormalRequestFormData>({
    request_type: 'promesa_compraventa',
    request_title: '',
    request_description: '',
    required_documents: [],
    due_date: ''
  });

  const [responseData, setResponseData] = useState({
    response_text: '',
    response_documents: [] as string[]
  });

  // ========================================================================
  // FORMAL REQUEST CRUD FUNCTIONS
  // ========================================================================

  const handleCreateFormalRequest = async () => {
    if (!user || !offer.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_formal_requests')
        .insert({
          offer_id: offer.id,
          request_type: formData.request_type,
          request_title: formData.request_title,
          request_description: formData.request_description,
          required_documents: formData.required_documents,
          requested_by: user.id,
          requested_to: userRole === 'seller' ? offer.buyer_id : offer.property?.owner_id,
          due_date: formData.due_date || null
        });

      if (error) throw error;

      toast.success('Solicitud formal creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      await onRequestsChange();

      await onAddTimelineEvent({
        event_type: 'solicitud_formal_creada',
        event_title: 'Nueva solicitud formal',
        event_description: `Se creó: ${formData.request_title}`,
        related_data: { request_type: formData.request_type }
      });

    } catch (error: any) {
      console.error('Error creating formal request:', error);
      toast.error('Error al crear la solicitud formal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: OfferFormalRequest['status'], responseData?: any) => {
    if (!user) return;

    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (responseData) {
        updateData.response_text = responseData.response_text;
        updateData.response_documents = responseData.response_documents;
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('offer_formal_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Estado de solicitud actualizado exitosamente');
      await onRequestsChange();

      await onAddTimelineEvent({
        event_type: 'solicitud_formal_actualizada',
        event_title: `Solicitud ${newStatus}`,
        event_description: `Estado cambiado a: ${newStatus}`,
        related_data: { request_id: requestId, new_status: newStatus }
      });

    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setLoading(false);
      setShowResponseModal(false);
      setSelectedRequest(null);
      resetResponseForm();
    }
  };

  const handleRespondToRequest = (request: OfferFormalRequest) => {
    setSelectedRequest(request);
    setResponseData({
      response_text: request.response_text || '',
      response_documents: request.response_documents || []
    });
    setShowResponseModal(true);
  };

  // ========================================================================
  // FORM HANDLERS
  // ========================================================================

  const resetForm = () => {
    setFormData({
      request_type: 'promesa_compraventa',
      request_title: '',
      request_description: '',
      required_documents: [],
      due_date: ''
    });
  };

  const resetResponseForm = () => {
    setResponseData({
      response_text: '',
      response_documents: []
    });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateFormalRequest();
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    await handleUpdateRequestStatus(selectedRequest.id, 'completada', responseData);
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getRequestStatusIcon = (status: OfferFormalRequest['status']) => {
    switch (status) {
      case 'completada': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'en_proceso': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'rechazada': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getRequestTypeIcon = (requestType: OfferFormalRequest['request_type']) => {
    switch (requestType) {
      case 'promesa_compraventa': return '📄';
      case 'inspección_precompra': return '🔍';
      case 'modificación_título': return '📋';
      case 'información_adicional': return 'ℹ️';
      default: return '📋';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
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
            {viewMode === 'buyer' ? 'Mis Solicitudes' : 'Solicitudes Formales'}
          </h2>
          <p className="text-gray-600">
            {viewMode === 'buyer'
              ? 'Gestiona las solicitudes que has enviado al vendedor'
              : 'Gestiona solicitudes formales como promesa de compraventa, inspecciones, etc.'
            }
          </p>
        </div>

        {(viewMode === 'seller' || userRole === 'admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </button>
        )}
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {formalRequests.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay solicitudes formales</h3>
            <p className="text-gray-600 mb-6">
              Crea tu primera solicitud formal para gestionar aspectos importantes de la oferta
            </p>
            {(userRole === 'seller' || userRole === 'admin') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Crear Primera Solicitud
              </button>
            )}
          </div>
        ) : (
          formalRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getRequestTypeIcon(request.request_type)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.request_title}</h3>
                      <p className="text-sm text-gray-500">{FORMAL_REQUEST_TYPES[request.request_type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRequestStatusIcon(request.status)}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[request.status] || STATUS_COLORS.solicitada}`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-4">{request.request_description}</p>

                {/* Required Documents */}
                {request.required_documents && request.required_documents.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Documentos Requeridos
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {request.required_documents.map((doc, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Creada: {new Date(request.created_at).toLocaleDateString('es-CL')}</span>
                  </div>
                  {request.due_date && (
                    <div className={`flex items-center gap-2 ${isOverdue(request.due_date) ? 'text-red-600' : ''}`}>
                      <Clock className="w-4 h-4" />
                      <span>Vence: {new Date(request.due_date).toLocaleDateString('es-CL')}</span>
                    </div>
                  )}
                </div>

                {/* Response */}
                {request.response_text && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Respuesta</h4>
                    <p className="text-sm text-gray-700">{request.response_text}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {userRole === request.requested_to && request.status === 'solicitada' && (
                    <>
                      <button
                        onClick={() => handleRespondToRequest(request)}
                        className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Responder
                      </button>
                      <button
                        onClick={() => handleUpdateRequestStatus(request.id, 'rechazada')}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </>
                  )}

                  {request.status === 'en_proceso' && userRole === request.requested_by && (
                    <button
                      onClick={() => handleUpdateRequestStatus(request.id, 'completada')}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Completada
                    </button>
                  )}

                  <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 ml-auto">
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Crear Solicitud Formal</h3>
              <p className="text-sm text-gray-600 mt-1">
                Crea una solicitud formal para aspectos importantes del proceso
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Solicitud
                </label>
                <select
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value as OfferFormalRequest['request_type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(FORMAL_REQUEST_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la Solicitud
                </label>
                <input
                  type="text"
                  value={formData.request_title}
                  onChange={(e) => setFormData({ ...formData, request_title: e.target.value })}
                  placeholder="Ej: Promesa de Compraventa - Condiciones Especiales"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.request_description}
                  onChange={(e) => setFormData({ ...formData, request_description: e.target.value })}
                  placeholder="Describe los detalles de la solicitud..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documentos Requeridos (uno por línea)
                </label>
                <textarea
                  value={formData.required_documents.join('\n')}
                  onChange={(e) => setFormData({
                    ...formData,
                    required_documents: e.target.value.split('\n').filter(doc => doc.trim() !== '')
                  })}
                  placeholder="Cédula de identidad&#10;Comprobante de ingresos&#10;Certificado de dominio"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmitRequest}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  'Crear Solicitud'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Responder Solicitud</h3>
              <p className="text-sm text-gray-600 mt-1">
                Responde a: {selectedRequest.request_title}
              </p>
            </div>

            <form onSubmit={handleSubmitResponse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respuesta
                </label>
                <textarea
                  value={responseData.response_text}
                  onChange={(e) => setResponseData({ ...responseData, response_text: e.target.value })}
                  placeholder="Escribe tu respuesta..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documentos Adjuntos (URLs separadas por comas)
                </label>
                <textarea
                  value={responseData.response_documents.join(', ')}
                  onChange={(e) => setResponseData({
                    ...responseData,
                    response_documents: e.target.value.split(',').map(url => url.trim()).filter(url => url !== '')
                  })}
                  placeholder="https://ejemplo.com/documento1.pdf, https://ejemplo.com/documento2.pdf"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedRequest(null);
                  resetResponseForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmitResponse}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? 'Enviando...' : 'Enviar Respuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferFormalRequestsTab;
