import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  DollarSign,
  CheckCircle,
  X,
  MessageSquare,
  MapPin,
  XCircle,
  Shield,
  Send,
  Edit,
  Eye,
  Clock,
  Settings
} from 'lucide-react';
import { supabase, SaleOfferStatus } from '../../lib/supabase';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

interface Offer {
  id: string;
  buyer_id: string;
  property_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  offer_amount: number;
  offer_amount_currency: string;
  financing_type?: string;
  message?: string;
  status: SaleOfferStatus;
  created_at: string;
  updated_at: string;
  requests_title_study: boolean;
  requests_property_inspection: boolean;
  seller_response?: string;
  seller_notes?: string;
  counter_offer_amount?: number;
  counter_offer_terms?: string;
  responded_at?: string;
  property?: {
    address_street: string;
    address_number: string;
    address_commune: string;
    address_region: string;
  };
}

// ========================================================================
// MAIN COMPONENT
// ========================================================================

const SaleOfferManagementPage: React.FC = () => {
  const { id: offerId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState<string>('');

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (offerId) {
      loadOfferData();
    } else {
      toast.error('ID de oferta no válido');
      navigate('/dashboard');
    }
  }, [offerId]);

  // ========================================================================
  // DATA FETCHING FUNCTIONS
  // ========================================================================

  const loadOfferData = async () => {
    if (!offerId) return;

    setLoading(true);
    try {
      const { data: offerData, error } = await supabase
        .from('property_sale_offers')
        .select(`
          *,
          property:property_id (
            address_street,
            address_number,
            address_commune,
            address_region
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) throw error;

      setOffer(offerData);
      if (offerData) setCounterPrice(offerData.offer_amount.toString());
    } catch (error: any) {
      console.error('Error loading offer:', error);
      toast.error('Error al cargar los datos de la oferta');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // ACTION FUNCTIONS
  // ========================================================================

  const updateOfferStatus = async (newStatus: SaleOfferStatus, extraData?: any) => {
    if (!offer) return;

    try {
      const { error } = await supabase
        .from('property_sale_offers')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...extraData
        })
        .eq('id', offer.id);

      if (error) throw error;

      toast.success(`Oferta ${newStatus === 'aceptada' ? 'aceptada' : newStatus === 'rechazada' ? 'rechazada' : 'actualizada'} correctamente`);
      loadOfferData();
      setShowRejectModal(false);
      setShowCounterModal(false);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getStatusColor = (status: SaleOfferStatus) => {
    switch (status) {
      case 'aceptada': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
      case 'contraoferta': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: SaleOfferStatus) => {
    const labels: Record<SaleOfferStatus, string> = {
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
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600">
        Oferta no encontrada
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb / Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
        >
          <span className="mr-1">←</span> Volver
        </button>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 md:p-6 text-white mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white`}>
                    {getStatusLabel(offer.status)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {offer.offer_amount.toLocaleString('es-CL')}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">Oferta #{offer.id.substring(0, 8)}</h1>
                <p className="text-blue-100 text-lg">
                  {offer.property?.address_street} {offer.property?.address_number}, {offer.property?.address_commune}
                </p>
                <p className="text-blue-200 text-sm mt-2 opacity-80">
                  Recibida el {new Date(offer.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Comprador</p>
              <p className="font-semibold text-gray-900">{offer.buyer_name.split(' ')[0]}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto Oferta</p>
              <p className="font-semibold text-gray-900">${(offer.offer_amount / 1000000).toFixed(1)}M</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Financiamiento</p>
              <p className="font-semibold text-gray-900">{offer.financing_type || 'No especificado'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-semibold text-gray-900">{getStatusLabel(offer.status)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-3 mb-6">
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center shadow-sm">
            <Eye className="w-4 h-4 mr-2 text-blue-600" /> Ver Publicación
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center shadow-sm">
            <Clock className="w-4 h-4 mr-2 text-gray-500" /> Ver Historial
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Offer Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-800">Detalles de la Oferta</h3>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Principal</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Monto Ofertado</p>
                    <p className="text-2xl font-bold text-gray-900">${offer.offer_amount.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-gray-400 mt-1">Moneda: {offer.offer_amount_currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo de Financiamiento</p>
                    <p className="font-medium text-gray-900">{offer.financing_type || 'No especificado'}</p>
                  </div>
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                      Mensaje del Comprador
                    </p>
                    <p className="text-sm text-gray-600 italic">"{offer.message || 'Sin mensaje adjunto'}"</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Solicitudes Adicionales</h4>
                  <div className="flex flex-wrap gap-3">
                    <div className={`px-3 py-2 rounded-lg border text-sm flex items-center ${offer.requests_title_study ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      <CheckCircle className={`w-4 h-4 mr-2 ${offer.requests_title_study ? 'text-blue-600' : 'text-gray-300'}`} />
                      Estudio de Títulos
                    </div>
                    <div className={`px-3 py-2 rounded-lg border text-sm flex items-center ${offer.requests_property_inspection ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      <CheckCircle className={`w-4 h-4 mr-2 ${offer.requests_property_inspection ? 'text-orange-600' : 'text-gray-300'}`} />
                      Inspección Técnica
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprador Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-800">Información del Comprador</h3>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                    {offer.buyer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">{offer.buyer_name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {offer.buyer_email}
                      </div>
                      {offer.buyer_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {offer.buyer_phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            
            {/* Administrative Actions Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-800">Acciones Administrativas</h3>
              </div>
              
              <div className="p-5 space-y-3">
                
                {/* Primary Actions */}
                {(offer.status === 'pendiente' || offer.status === 'en_revision' || offer.status === 'contraoferta') && (
                  <>
                    <button 
                      onClick={() => updateOfferStatus('aceptada')}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-md flex items-center justify-center transition-all transform hover:-translate-y-0.5"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Aprobar Oferta
                    </button>
                    
                    <button 
                      onClick={() => setShowCounterModal(true)}
                      className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50 rounded-lg font-semibold flex items-center justify-center transition-all"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Realizar Contraoferta
                    </button>

                    <button 
                      onClick={() => setShowRejectModal(true)}
                      className="w-full py-3 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center transition-all mt-4"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Rechazar Oferta
                    </button>
                  </>
                )}

                {/* Secondary Actions */}
                <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gestión Documental</p>
                  <button className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium flex items-center justify-between transition-colors group">
                    <span className="flex items-center"><FileText className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-500" /> Aprobar Envío Documentación</span>
                    <span className="text-gray-300 group-hover:text-gray-500">→</span>
                  </button>
                  <button className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium flex items-center justify-between transition-colors group">
                    <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-500" /> Complementar Documentación</span>
                    <span className="text-gray-300 group-hover:text-gray-500">→</span>
                  </button>
                  <button className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium flex items-center justify-between transition-colors group">
                    <span className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-500" /> Solicitar Info Adicional</span>
                    <span className="text-gray-300 group-hover:text-gray-500">→</span>
                  </button>
                </div>

                {/* Offer Status Display if closed */}
                {offer.status !== 'pendiente' && offer.status !== 'en_revision' && offer.status !== 'contraoferta' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500 text-sm">Oferta gestionada</p>
                    <p className="font-bold text-gray-800 text-lg mt-1 uppercase">{getStatusLabel(offer.status)}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-6 h-6 text-blue-600 mr-2" />
              Realizar Contraoferta
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Propuesto (CLP)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input 
                  type="number" 
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ingresa monto..."
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (Opcional)</label>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows={3}
                placeholder="Explica las razones de tu contraoferta..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowCounterModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => updateOfferStatus('contraoferta', { 
                  counter_offer_amount: Number(counterPrice),
                  seller_response: responseMessage 
                })}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-colors"
              >
                Enviar Contraoferta
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Rechazar Oferta</h3>
            <p className="text-gray-500 text-center mb-6">
              ¿Estás seguro de que deseas rechazar esta oferta? Esta acción notificará al comprador y no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => updateOfferStatus('rechazada')}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium shadow-md transition-colors"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleOfferManagementPage;
