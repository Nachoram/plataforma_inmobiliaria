import React from 'react';
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Settings
} from 'lucide-react';
import { SaleOffer, OfferTask, OfferDocument, OfferTimeline, OfferFormalRequest, UserRole } from '../types';
import { formatPriceCLP } from '../../../lib/supabase';

interface OfferSummaryTabProps {
  offer: SaleOffer;
  userRole: UserRole | null;
  tasks: OfferTask[];
  documents: OfferDocument[];
  timeline: OfferTimeline[];
  formalRequests: OfferFormalRequest[];
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const OfferSummaryTab: React.FC<OfferSummaryTabProps> = ({
  offer,
  userRole,
  tasks,
  documents,
  timeline,
  formalRequests,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData
}) => {

  // ========================================================================
  // HELPERS
  // ========================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptada': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
      case 'contraoferta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_revision: 'En Revisión',
      info_solicitada: 'Info Solicitada',
      aceptada: 'Aceptada',
      rechazada: 'Rechazada',
      contraoferta: 'Contraoferta',
      estudio_titulo: 'Estudio de Título',
      finalizada: 'Finalizada',
    };
    return labels[status] || status;
  };

  // ========================================================================
  // CÁLCULOS DE MÉTRICAS
  // ========================================================================

  const pendingTasks = tasks.filter(t => t.status === 'pendiente').length;
  const pendingDocuments = documents.filter(d => d.status === 'pendiente').length;
  const activeRequests = formalRequests.filter(r => r.status === 'solicitada' || r.status === 'en_proceso').length;
  const recentTimeline = timeline.slice(0, 5); // Últimas 5 actividades

  const completionRate = tasks.length > 0 ? (tasks.filter(t => t.status === 'completada').length / tasks.length) * 100 : 0;

  // ========================================================================
  // HANDLERS DE ACCIONES RÁPIDAS
  // ========================================================================

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'accept':
        if (userRole === 'seller') {
          await onUpdateOffer('aceptada');
          await onAddTimelineEvent({
            event_type: 'oferta_aceptada',
            event_title: 'Oferta Aceptada',
            event_description: 'La oferta ha sido aceptada por el vendedor'
          });
        }
        break;
      case 'reject':
        if (userRole === 'seller') {
          await onUpdateOffer('rechazada');
          await onAddTimelineEvent({
            event_type: 'oferta_rechazada',
            event_title: 'Oferta Rechazada',
            event_description: 'La oferta ha sido rechazada por el vendedor'
          });
        }
        break;
      case 'counteroffer':
        // Esta acción se manejará en un modal separado
        break;
      case 'accept_counteroffer':
        if (userRole === 'buyer' && offer.counter_offer_amount) {
          await onUpdateOffer('aceptada', {
            offer_amount: offer.counter_offer_amount,
            seller_response: 'Contraoferta aceptada por el comprador'
          });
          await onAddTimelineEvent({
            event_type: 'contraoferta_aceptada',
            event_title: 'Contraoferta Aceptada',
            event_description: `El comprador aceptó la contraoferta de $${offer.counter_offer_amount.toLocaleString('es-CL')}`
          });
        }
        break;
      case 'new_offer':
        // Esta acción se manejará en un modal separado para compradores
        break;
      default:
        break;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-8">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 text-white relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-white/30 ${
                  offer.status === 'aceptada' ? 'bg-green-500/20' :
                  offer.status === 'rechazada' ? 'bg-red-500/20' :
                  offer.status === 'contraoferta' ? 'bg-blue-500/20' :
                  'bg-white/10'
                }`}>
                  {getStatusLabel(offer.status)}
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-bold bg-white/10 border border-white/20 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formatPriceCLP(offer.offer_amount)}
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Oferta #{offer.id.substring(0, 8)}
              </h1>
              <p className="text-blue-100 text-lg mb-4">
                {offer.property?.address_street} {offer.property?.address_number}, {offer.property?.address_commune}
              </p>

              <div className="flex items-center text-blue-200 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                Recibida el {new Date(offer.created_at).toLocaleDateString('es-CL', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>

            {/* Acciones rápidas para vendedores */}
            {userRole === 'seller' && (offer.status === 'pendiente' || offer.status === 'en_revision' || offer.status === 'contraoferta') && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleQuickAction('accept')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Aceptar Oferta
                </button>
                <button
                  onClick={() => handleQuickAction('counteroffer')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Contraoferta
                </button>
                <button
                  onClick={() => handleQuickAction('reject')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rechazar
                </button>
              </div>
            )}

            {/* Acciones para compradores */}
            {userRole === 'buyer' && offer.status === 'contraoferta' && offer.counter_offer_amount && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleQuickAction('accept_counteroffer')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Aceptar Contraoferta
                </button>
                <button
                  onClick={() => handleQuickAction('new_offer')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Hacer Nueva Oferta
                </button>
              </div>
            )}
          </div>

          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Información del comprador y oferta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comprador */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Comprador</h3>
              <p className="text-sm text-gray-500">Información del interesado</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nombre:</span>
              <span className="font-medium text-gray-900">{offer.buyer_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="font-medium text-gray-900 text-sm">{offer.buyer_email}</span>
            </div>
            {offer.buyer_phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Teléfono:</span>
                <span className="font-medium text-gray-900">{offer.buyer_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalles de la oferta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Detalles de la Oferta</h3>
              <p className="text-sm text-gray-500">Información financiera</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monto ofertado:</span>
              <span className="font-bold text-gray-900 text-lg">{formatPriceCLP(offer.offer_amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Moneda:</span>
              <span className="font-medium text-gray-900">{offer.offer_amount_currency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Financiamiento:</span>
              <span className="font-medium text-gray-900">{offer.financing_type || 'No especificado'}</span>
            </div>
            {offer.counter_offer_amount && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Contraoferta:</span>
                  <span className="font-bold text-blue-900">{formatPriceCLP(offer.counter_offer_amount)}</span>
                </div>
                {offer.counter_offer_terms && (
                  <p className="text-xs text-blue-700 mt-1">{offer.counter_offer_terms}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Estado y progreso */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Estado del Proceso</h3>
              <p className="text-sm text-gray-500">Progreso y métricas</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completitud de tareas</span>
                <span className="font-medium">{Math.round(completionRate)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingTasks}</div>
                <div className="text-xs text-gray-500">Tareas pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pendingDocuments}</div>
                <div className="text-xs text-gray-500">Documentos pendientes</div>
              </div>
            </div>

            {activeRequests > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">{activeRequests} solicitud(es) activa(s)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje del comprador y solicitudes especiales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mensaje del comprador */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Mensaje del Comprador</h3>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-gray-700 italic">
              {offer.message || 'No se incluyó mensaje adicional con la oferta.'}
            </p>
          </div>
        </div>

        {/* Solicitudes especiales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Solicitudes Especiales</h3>
          </div>

          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              offer.requests_title_study
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <CheckCircle className={`w-5 h-5 ${
                offer.requests_title_study ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                offer.requests_title_study ? 'text-blue-800' : 'text-gray-500'
              }`}>
                Estudio de Títulos
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              offer.requests_property_inspection
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <CheckCircle className={`w-5 h-5 ${
                offer.requests_property_inspection ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                offer.requests_property_inspection ? 'text-orange-800' : 'text-gray-500'
              }`}>
                Inspección de la Propiedad
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline reciente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Actividad Reciente</h3>
          <span className="text-sm text-gray-500">Últimos eventos</span>
        </div>

        {recentTimeline.length > 0 ? (
          <div className="space-y-4">
            {recentTimeline.map((event) => (
              <div key={event.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{event.event_title}</p>
                  {event.event_description && (
                    <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(event.created_at).toLocaleDateString('es-CL', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay actividad registrada aún</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferSummaryTab;
