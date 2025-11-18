import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  MessageSquare,
  FileText,
  Send
} from 'lucide-react';
import { SaleOffer, CounterOfferFormData } from '../types';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface BuyerOfferActionsProps {
  offer: SaleOffer;
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const BuyerOfferActions: React.FC<BuyerOfferActionsProps> = ({
  offer,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData
}) => {
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [counterOfferData, setCounterOfferData] = useState<CounterOfferFormData>({
    counter_offer_amount: offer.counter_offer_amount || offer.offer_amount,
    counter_offer_terms: '',
    seller_response: ''
  });

  const [rejectReason, setRejectReason] = useState('');
  const [inspectionRequest, setInspectionRequest] = useState({
    description: '',
    preferred_date: ''
  });

  const [infoRequest, setInfoRequest] = useState({
    subject: '',
    message: ''
  });

  // ========================================================================
  // ACTION HANDLERS
  // ========================================================================

  const handleAcceptCounterOffer = async () => {
    if (!offer.counter_offer_amount) {
      toast.error('No hay contraoferta disponible para aceptar');
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas aceptar la contraoferta de $${offer.counter_offer_amount.toLocaleString('es-CL')}?`)) return;

    setLoading(true);
    try {
      await onUpdateOffer('aceptada', {
        offer_amount: offer.counter_offer_amount,
        seller_response: 'Contraoferta aceptada por el comprador'
      });

      await onAddTimelineEvent({
        event_type: 'contraoferta_aceptada',
        event_title: 'Contraoferta Aceptada',
        event_description: `El comprador aceptó la contraoferta de $${offer.counter_offer_amount.toLocaleString('es-CL')}`
      });

      toast.success('Contraoferta aceptada exitosamente');
    } catch (error) {
      toast.error('Error al aceptar la contraoferta');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCounterOffer = async () => {
    if (!counterOfferData.counter_offer_amount || counterOfferData.counter_offer_amount <= 0) {
      toast.error('Debes ingresar un monto válido');
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
        event_type: 'nueva_contraoferta',
        event_title: 'Nueva Contraoferta',
        event_description: `Contraoferta del comprador: $${counterOfferData.counter_offer_amount.toLocaleString('es-CL')}`,
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

  const handleRejectOffer = async () => {
    if (!rejectReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo');
      return;
    }

    setLoading(true);
    try {
      await onUpdateOffer('rechazada', { seller_response: rejectReason });

      await onAddTimelineEvent({
        event_type: 'oferta_rechazada_comprador',
        event_title: 'Oferta Rechazada por Comprador',
        event_description: `El comprador rechazó la oferta: ${rejectReason}`
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

  const handleRequestInspection = async () => {
    if (!inspectionRequest.description.trim()) {
      toast.error('Debes proporcionar detalles sobre la inspección solicitada');
      return;
    }

    setLoading(true);
    try {
      // Crear solicitud formal de inspección
      const { error } = await supabase
        .from('offer_formal_requests')
        .insert({
          offer_id: offer.id,
          request_type: 'inspección_precompra',
          request_title: 'Solicitud de Inspección Precompra',
          request_description: inspectionRequest.description,
          status: 'solicitada',
          due_date: inspectionRequest.preferred_date || null
        });

      if (error) throw error;

      await onAddTimelineEvent({
        event_type: 'inspeccion_solicitada',
        event_title: 'Inspección Solicitada',
        event_description: `Solicitud de inspección precompra: ${inspectionRequest.description}`,
        related_data: { preferred_date: inspectionRequest.preferred_date }
      });

      toast.success('Solicitud de inspección enviada exitosamente');
      setShowInspectionModal(false);
      setInspectionRequest({ description: '', preferred_date: '' });
    } catch (error) {
      toast.error('Error al solicitar la inspección');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAdditionalInfo = async () => {
    if (!infoRequest.subject.trim() || !infoRequest.message.trim()) {
      toast.error('Debes completar todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Crear solicitud formal de información adicional
      const { error } = await supabase
        .from('offer_formal_requests')
        .insert({
          offer_id: offer.id,
          request_type: 'información_adicional',
          request_title: infoRequest.subject,
          request_description: infoRequest.message,
          status: 'solicitada'
        });

      if (error) throw error;

      await onAddTimelineEvent({
        event_type: 'informacion_adicional_solicitada',
        event_title: 'Información Adicional Solicitada',
        event_description: `Asunto: ${infoRequest.subject}`,
        related_data: { subject: infoRequest.subject }
      });

      toast.success('Solicitud de información enviada exitosamente');
      setShowInfoModal(false);
      setInfoRequest({ subject: '', message: '' });
    } catch (error) {
      toast.error('Error al solicitar información adicional');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // FORM HELPERS
  // ========================================================================

  const resetCounterOfferForm = () => {
    setCounterOfferData({
      counter_offer_amount: offer.counter_offer_amount || offer.offer_amount,
      counter_offer_terms: '',
      seller_response: ''
    });
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const hasCounterOffer = offer.status === 'contraoferta' && offer.counter_offer_amount;

  return (
    <div className="space-y-4">
      {/* Counter Offer Actions */}
      {hasCounterOffer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">Contraoferta Recibida</h4>
          <p className="text-blue-800 text-sm mb-3">
            El vendedor ha respondido con una contraoferta de ${offer.counter_offer_amount?.toLocaleString('es-CL')}
            {offer.counter_offer_terms && (
              <span className="block mt-1 italic">"{offer.counter_offer_terms}"</span>
            )}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleAcceptCounterOffer}
              disabled={loading}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4 mr-1 inline" />
              Aceptar Contraoferta
            </button>
            <button
              onClick={() => setShowCounterModal(true)}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-4 h-4 mr-1 inline" />
              Hacer Nueva Oferta
            </button>
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowCounterModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          {hasCounterOffer ? 'Nueva Contraoferta' : 'Hacer Contraoferta'}
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Rechazar Oferta
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowInspectionModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-4 h-4 mr-2" />
          Solicitar Inspección
        </button>

        <button
          onClick={() => setShowInfoModal(true)}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Pedir Más Info
        </button>
      </div>

      {/* Modals */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
              {hasCounterOffer ? 'Hacer Nueva Contraoferta' : 'Hacer Contraoferta'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tu Oferta (CLP)
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
                    placeholder="Ingresa tu oferta..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos Especiales (Opcional)
                </label>
                <textarea
                  value={counterOfferData.counter_offer_terms}
                  onChange={(e) => setCounterOfferData({
                    ...counterOfferData,
                    counter_offer_terms: e.target.value
                  })}
                  placeholder="Describe condiciones especiales, plazos, etc..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje al Vendedor
                </label>
                <textarea
                  value={counterOfferData.seller_response}
                  onChange={(e) => setCounterOfferData({
                    ...counterOfferData,
                    seller_response: e.target.value
                  })}
                  placeholder="Explica por qué ofreces este monto..."
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
                onClick={handleNewCounterOffer}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Oferta'}
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
              ¿Estás seguro de que deseas rechazar esta oferta?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón del rechazo (opcional pero recomendado)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ayuda al vendedor a entender tu decisión..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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

      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Search className="w-6 h-6 text-orange-600 mr-2" />
              Solicitar Inspección Precompra
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalles de la Inspección
                </label>
                <textarea
                  value={inspectionRequest.description}
                  onChange={(e) => setInspectionRequest({
                    ...inspectionRequest,
                    description: e.target.value
                  })}
                  placeholder="Describe qué tipo de inspección necesitas (estructural, eléctrica, etc.)..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Preferida (Opcional)
                </label>
                <input
                  type="date"
                  value={inspectionRequest.preferred_date}
                  onChange={(e) => setInspectionRequest({
                    ...inspectionRequest,
                    preferred_date: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInspectionModal(false);
                  setInspectionRequest({ description: '', preferred_date: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestInspection}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Solicitando...' : 'Solicitar Inspección'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-6 h-6 text-gray-600 mr-2" />
              Solicitar Información Adicional
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  value={infoRequest.subject}
                  onChange={(e) => setInfoRequest({
                    ...infoRequest,
                    subject: e.target.value
                  })}
                  placeholder="Ej: Información sobre contribuciones, estado del título..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  value={infoRequest.message}
                  onChange={(e) => setInfoRequest({
                    ...infoRequest,
                    message: e.target.value
                  })}
                  placeholder="Describe qué información necesitas específicamente..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setInfoRequest({ subject: '', message: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestAdditionalInfo}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOfferActions;
