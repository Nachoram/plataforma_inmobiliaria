import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Building, MapPin, DollarSign, Calendar, User, Mail, Phone,
  FileText, CheckCircle, XCircle, AlertCircle, MessageSquare, Clock,
  TrendingUp, Edit, Eye, Download, Upload, Send
} from 'lucide-react';
import {
  supabase,
  Property,
  PropertySaleOffer,
  getPropertySaleOffers,
  updateSaleOfferStatus,
  formatPriceCLP,
  SaleOfferStatus
} from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CustomButton from '../common/CustomButton';
import toast from 'react-hot-toast';

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

const SaleOfferAdminPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [offers, setOffers] = useState<PropertySaleOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<PropertySaleOffer | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({
    status: 'en_revision' as SaleOfferStatus,
    seller_response: '',
    seller_notes: '',
    counter_offer_amount: '',
    counter_offer_terms: '',
  });

  useEffect(() => {
    if (id) {
      fetchPropertyData();
      fetchOffers();
    }
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            image_url,
            storage_path
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Verify ownership
      if (data.owner_id !== user?.id) {
        toast.error('No tienes permiso para ver esta propiedad');
        navigate('/my-sales');
        return;
      }

      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Error al cargar la propiedad');
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      if (!id) return;
      const data = await getPropertySaleOffers(id);
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferClick = (offer: PropertySaleOffer) => {
    setSelectedOffer(offer);
    setResponseData({
      status: offer.status,
      seller_response: offer.seller_response || '',
      seller_notes: offer.seller_notes || '',
      counter_offer_amount: offer.counter_offer_amount?.toString() || '',
      counter_offer_terms: offer.counter_offer_terms || '',
    });
    setShowResponseModal(true);
  };

  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;

    try {
      const updateData: any = {
        seller_response: responseData.seller_response,
        seller_notes: responseData.seller_notes,
      };

      if (responseData.status === 'contraoferta') {
        if (!responseData.counter_offer_amount) {
          toast.error('Debes ingresar un monto para la contraoferta');
          return;
        }
        updateData.counter_offer_amount = parseInt(responseData.counter_offer_amount);
        updateData.counter_offer_terms = responseData.counter_offer_terms;
      }

      await updateSaleOfferStatus(selectedOffer.id, responseData.status, updateData);
      
      toast.success('Oferta actualizada exitosamente');
      setShowResponseModal(false);
      setSelectedOffer(null);
      fetchOffers();
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error('Error al actualizar la oferta');
    }
  };

  const getStatusColor = (status: SaleOfferStatus) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info_solicitada': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'aceptada': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
      case 'contraoferta': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'estudio_titulo': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    return labels[status];
  };

  if (loading || !property) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <button
          onClick={() => navigate('/my-sales')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Volver a Mis Ventas</span>
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Property Image */}
          <div className="w-full md:w-64 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {property.property_images && property.property_images.length > 0 ? (
              <img
                src={property.property_images[0].image_url}
                alt={property.address_street}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                <Building className="h-16 w-16 text-blue-400" />
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {property.address_street} {property.address_number}
            </h1>
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{property.address_commune}, {property.address_region}</span>
            </div>
            <div className="flex items-center text-2xl font-bold text-blue-600 mb-4">
              <DollarSign className="h-6 w-6" />
              <span>{formatPriceCLP(property.price_clp)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to={`/property/edit/${property.id}`}>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
              </Link>
              <Link to={`/property/${property.id}`}>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  <Eye className="h-4 w-4" />
                  <span>Ver Publicación</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
              <p className="text-sm text-gray-600">Ofertas Totales</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {offers.filter(o => o.status === 'pendiente').length}
              </p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {offers.filter(o => o.status === 'aceptada').length}
              </p>
              <p className="text-sm text-gray-600">Aceptadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {offers.length > 0
                  ? formatPriceCLP(Math.max(...offers.map(o => o.offer_amount)))
                  : '$0'}
              </p>
              <p className="text-sm text-gray-600">Oferta Máxima</p>
            </div>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Ofertas Recibidas</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las ofertas de compra para esta propiedad
          </p>
        </div>

        <div className="p-6">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No has recibido ofertas aún
              </h3>
              <p className="text-gray-500">
                Las ofertas que recibas aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="group bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 p-6 transition-all cursor-pointer"
                  onClick={() => handleOfferClick(offer)}
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{offer.buyer_name}</h3>
                          <p className="text-sm text-gray-600">{offer.buyer_email}</p>
                        </div>
                      </div>
                      {offer.buyer_phone && (
                        <div className="flex items-center text-sm text-gray-600 ml-13">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>{offer.buyer_phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(offer.status)}`}>
                        {getStatusLabel(offer.status)}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(offer.created_at).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Offer Amount */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700 font-medium mb-1">Monto Ofertado:</p>
                    <div className="flex items-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPriceCLP(offer.offer_amount)}
                      </span>
                      {offer.offer_amount_currency !== 'CLP' && (
                        <span className="ml-2 text-sm text-blue-600">({offer.offer_amount_currency})</span>
                      )}
                    </div>
                    {offer.financing_type && (
                      <p className="text-xs text-blue-600 mt-2">
                        Financiamiento: {offer.financing_type}
                      </p>
                    )}
                  </div>

                  {/* Counter Offer */}
                  {offer.counter_offer_amount && (
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-purple-700 font-medium mb-1">Tu Contraoferta:</p>
                      <div className="flex items-center">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">
                          {formatPriceCLP(offer.counter_offer_amount)}
                        </span>
                      </div>
                      {offer.counter_offer_terms && (
                        <p className="text-sm text-purple-600 mt-2">{offer.counter_offer_terms}</p>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  {offer.message && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Mensaje del comprador:</p>
                          <p className="text-sm text-gray-600 italic">"{offer.message}"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {offer.requests_title_study && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        <span>Solicita estudio de título</span>
                      </div>
                    )}
                    {offer.requests_property_inspection && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                        <Eye className="h-3 w-3" />
                        <span>Solicita inspección</span>
                      </div>
                    )}
                  </div>

                  {/* Seller Response */}
                  {offer.seller_response && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-1">Tu respuesta:</p>
                      <p className="text-sm text-green-600">{offer.seller_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Responder Oferta</h2>
              <p className="text-sm text-gray-600 mt-1">
                Oferta de {selectedOffer.buyer_name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de la oferta
                </label>
                <select
                  value={responseData.status}
                  onChange={(e) => setResponseData({ ...responseData, status: e.target.value as SaleOfferStatus })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="info_solicitada">Solicitar Más Información</option>
                  <option value="aceptada">Aceptar Oferta</option>
                  <option value="rechazada">Rechazar Oferta</option>
                  <option value="contraoferta">Hacer Contraoferta</option>
                  <option value="estudio_titulo">Iniciar Estudio de Título</option>
                </select>
              </div>

              {/* Counter Offer Fields */}
              {responseData.status === 'contraoferta' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto de Contraoferta (CLP)
                    </label>
                    <input
                      type="number"
                      value={responseData.counter_offer_amount}
                      onChange={(e) => setResponseData({ ...responseData, counter_offer_amount: e.target.value })}
                      placeholder="Ej: 150000000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Términos de la Contraoferta
                    </label>
                    <textarea
                      value={responseData.counter_offer_terms}
                      onChange={(e) => setResponseData({ ...responseData, counter_offer_terms: e.target.value })}
                      placeholder="Describe los términos de tu contraoferta..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Seller Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respuesta al Comprador
                </label>
                <textarea
                  value={responseData.seller_response}
                  onChange={(e) => setResponseData({ ...responseData, seller_response: e.target.value })}
                  placeholder="Escribe tu respuesta..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Internas (no visibles para el comprador)
                </label>
                <textarea
                  value={responseData.seller_notes}
                  onChange={(e) => setResponseData({ ...responseData, seller_notes: e.target.value })}
                  placeholder="Notas privadas..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedOffer(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateOffer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Enviar Respuesta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleOfferAdminPanel;

