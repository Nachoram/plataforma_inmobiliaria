import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  User,
  Settings,
  Send
} from 'lucide-react';
import { SaleOffer, CounterOfferFormData } from '../types';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface SellerOfferActionsProps {
  offer: SaleOffer;
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const SellerOfferActions: React.FC<SellerOfferActionsProps> = ({
  offer,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData
}) => {
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [counterOfferData, setCounterOfferData] = useState<CounterOfferFormData>({
    counter_offer_amount: offer.offer_amount,
    counter_offer_terms: '',
    seller_response: ''
  });

  const [rejectReason, setRejectReason] = useState('');
  const [documentRequest, setDocumentRequest] = useState({
    document_name: '',
    description: ''
  });

  // ========================================================================
  // ACTION HANDLERS
  // ========================================================================

  const handleAcceptOffer = async () => {
    if (!confirm('¿Estás seguro de que deseas aceptar esta oferta? Esta acción no se puede deshacer.')) return;

    setLoading(true);
    try {
      await onUpdateOffer('aceptada');
      await onAddTimelineEvent({
        event_type: 'oferta_aceptada',
        event_title: 'Oferta Aceptada',
        event_description: 'La oferta ha sido aceptada por el vendedor'
      });
      toast.success('Oferta aceptada exitosamente');
    } catch (error) {
      toast.error('Error al aceptar la oferta');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!rejectReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo');
      return;
    }

    setLoading(true);
    try {
      await onUpdateOffer('rechazada', { seller_response: rejectReason });
      await onAddTimelineEvent({
        event_type: 'oferta_rechazada',
        event_title: 'Oferta Rechazada',
        event_description: `Oferta rechazada: ${rejectReason}`
      });
      toast.success('Oferta rechazada exitosamente');
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      toast.error('Error al rechazar la oferta');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!counterOfferData.counter_offer_amount || counterOfferData.counter_offer_amount <= 0) {
      toast.error('Debes ingresar un monto válido para la contraoferta');
      return;
    }

    setLoading(true);
    try {
      await onUpdateOffer('contraoferta', {
        counter_offer_amount: counterOfferData.counter_offer_amount,
        counter_offer_terms: counterOfferData.counter_offer_terms,
        seller_response: counterOfferData.seller_response
      });

      await onAddTimelineEvent({
        event_type: 'contraoferta_enviada',
        event_title: 'Contraoferta Enviada',
        event_description: `Contraoferta por $${counterOfferData.counter_offer_amount.toLocaleString('es-CL')}`,
        related_data: {
          counter_amount: counterOfferData.counter_offer_amount,
          terms: counterOfferData.counter_offer_terms
        }
      });

      toast.success('Contraoferta enviada exitosamente');
      setShowCounterModal(false);
      resetCounterOfferForm();
    } catch (error) {
      toast.error('Error al enviar la contraoferta');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDocumentation = async () => {
    if (!documentRequest.document_name.trim()) {
      toast.error('Debes especificar qué documento solicitar');
      return;
    }

    setLoading(true);
    try {
      // Crear tarea de documentación
      const { error } = await supabase
        .from('offer_tasks')
        .insert({
          offer_id: offer.id,
          task_type: 'documentación',
          description: documentRequest.description || `Solicitar: ${documentRequest.document_name}`,
          priority: 'alta',
          due_date: null // Sin fecha límite específica
        });

      if (error) throw error;

      await onAddTimelineEvent({
        event_type: 'documentacion_solicitada',
        event_title: 'Documentación Solicitada',
        event_description: `Se solicitó: ${documentRequest.document_name}`,
        related_data: { document_name: documentRequest.document_name }
      });

      toast.success('Solicitud de documentación enviada');
      setShowRequestModal(false);
      setDocumentRequest({ document_name: '', description: '' });
    } catch (error) {
      toast.error('Error al solicitar documentación');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExecutive = async () => {
    // TODO: Implementar asignación de ejecutivo bancario
    toast.info('Funcionalidad de asignación de ejecutivo próximamente disponible');
    setShowAssignModal(false);
  };

  // ========================================================================
  // FORM HELPERS
  // ========================================================================

  const resetCounterOfferForm = () => {
    setCounterOfferData({
      counter_offer_amount: offer.offer_amount,
      counter_offer_terms: '',
      seller_response: ''
    });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const canTakeActions = ['pendiente', 'en_revision', 'contraoferta'].includes(offer.status);

  if (!canTakeActions) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 text-sm">
          Esta oferta ya ha sido gestionada ({offer.status.replace('_', ' ').toUpperCase()})
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleAcceptOffer}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Aceptar Oferta
        </button>

        <button
          onClick={() => setShowCounterModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          Contraoferta
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Rechazar
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowRequestModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4 mr-2" />
          Pedir Documentación
        </button>

        <button
          onClick={() => setShowAssignModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <User className="w-4 h-4 mr-2" />
          Asignar Ejecutivo
        </button>
      </div>

      {/* Modals */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
              Realizar Contraoferta
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Propuesto (CLP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="number"
                    value={counterOfferData.counter_offer_amount}
                    onChange={(e) => setCounterOfferData({
                      ...counterOfferData,
                      counter_offer_amount: Number(e.target.value)
                    })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa monto..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos de la Contraoferta
                </label>
                <textarea
                  value={counterOfferData.counter_offer_terms}
                  onChange={(e) => setCounterOfferData({
                    ...counterOfferData,
                    counter_offer_terms: e.target.value
                  })}
                  placeholder="Describe las condiciones de tu contraoferta..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje al Comprador
                </label>
                <textarea
                  value={counterOfferData.seller_response}
                  onChange={(e) => setCounterOfferData({
                    ...counterOfferData,
                    seller_response: e.target.value
                  })}
                  placeholder="Explica por qué propones esta contraoferta..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCounterModal(false);
                  resetCounterOfferForm();
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCounterOffer}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Contraoferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Rechazar Oferta</h3>
            <p className="text-gray-500 text-center mb-4">
              ¿Estás seguro de que deseas rechazar esta oferta? Esta acción notificará al comprador.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón del rechazo (obligatorio)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica brevemente por qué rechazas esta oferta..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectOffer}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 text-gray-600 mr-2" />
              Solicitar Documentación
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento requerido
                </label>
                <input
                  type="text"
                  value={documentRequest.document_name}
                  onChange={(e) => setDocumentRequest({
                    ...documentRequest,
                    document_name: e.target.value
                  })}
                  placeholder="Ej: Certificado de dominio, Cédula de identidad..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={documentRequest.description}
                  onChange={(e) => setDocumentRequest({
                    ...documentRequest,
                    description: e.target.value
                  })}
                  placeholder="Proporciona detalles adicionales sobre el documento requerido..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setDocumentRequest({ document_name: '', description: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestDocumentation}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Solicitando...' : 'Solicitar Documento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-6 h-6 text-purple-600 mr-2" />
              Asignar Ejecutivo Bancario
            </h3>

            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Funcionalidad de asignación de ejecutivo bancario próximamente disponible
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOfferActions;
