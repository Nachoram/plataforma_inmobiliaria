import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, MapPin, Building, Settings, Send, Inbox, Search, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';

interface OfferWithDetails {
  id: string;
  property_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  offer_amount: number;
  offer_amount_currency: string;
  financing_type: string | null;
  message: string | null;
  status: string;
  requests_title_study: boolean;
  requests_property_inspection: boolean;
  seller_response: string | null;
  counter_offer_amount: number | null;
  counter_offer_terms: string | null;
  created_at: string;
  responded_at: string | null;
  properties: {
    id: string;
    address_street: string;
    address_number?: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
  };
}

interface ReceivedOfferWithDetails extends OfferWithDetails {
  buyer_profile: {
    id: string;
    first_name: string;
    paternal_last_name: string;
    maternal_last_name?: string;
    email: string;
  };
}

type ViewType = 'sent' | 'received';

const MyOffersPage: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('sent');
  const [sentOffers, setSentOffers] = useState<OfferWithDetails[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentSearchTerm, setSentSearchTerm] = useState('');
  const [receivedSearchTerm, setReceivedSearchTerm] = useState('');
  const [sentStatusFilter, setSentStatusFilter] = useState<string>('todos');
  const [receivedStatusFilter, setReceivedStatusFilter] = useState<string>('todos');

  useEffect(() => {
    if (user) {
      fetchSentOffers();
      fetchReceivedOffers();
    }
  }, [user]);

  const fetchSentOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_sale_offers')
        .select(`
          *,
          properties(
            id,
            address_street,
            address_number,
            address_commune,
            price_clp,
            listing_type
          )
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSentOffers(data || []);
    } catch (error) {
      console.error('Error fetching sent offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedOffers = async () => {
    try {
      // First, get the offers with property data
      const { data: offersData, error: offersError } = await supabase
        .from('property_sale_offers')
        .select(`
          *,
          properties!inner(
            id,
            address_street,
            address_number,
            address_commune,
            price_clp,
            listing_type
          )
        `)
        .eq('properties.owner_id', user?.id)
        .neq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      // Then, fetch buyer profiles for each offer
      const offersWithProfiles = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, paternal_last_name, maternal_last_name, email')
            .eq('id', offer.buyer_id)
            .single();

          return {
            ...offer,
            buyer_profile: profileError ? null : profile
          };
        })
      );

      setReceivedOffers(offersWithProfiles);
    } catch (error) {
      console.error('Error fetching received offers:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'UF') {
      return `${amount.toLocaleString('es-CL')} UF`;
    }
    return formatPrice(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      case 'contraoferta': return 'bg-purple-100 text-purple-800';
      case 'en_revision': return 'bg-blue-100 text-blue-800';
      case 'info_solicitada': return 'bg-orange-100 text-orange-800';
      case 'estudio_titulo': return 'bg-indigo-100 text-indigo-800';
      case 'finalizada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en_revision': return 'En Revisión';
      case 'info_solicitada': return 'Info Solicitada';
      case 'aceptada': return 'Aceptada';
      case 'rechazada': return 'Rechazada';
      case 'contraoferta': return 'Contraoferta';
      case 'estudio_titulo': return 'Estudio de Título';
      case 'finalizada': return 'Finalizada';
      default: return status;
    }
  };

  // Filter functions
  const filterSentOffers = () => {
    return sentOffers.filter(offer => {
      const matchesSearch = sentSearchTerm === '' ||
        offer.properties.address_street.toLowerCase().includes(sentSearchTerm.toLowerCase()) ||
        offer.properties.address_commune.toLowerCase().includes(sentSearchTerm.toLowerCase());

      const matchesStatus = sentStatusFilter === 'todos' || offer.status === sentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filterReceivedOffers = () => {
    return receivedOffers.filter(offer => {
      const matchesSearch = receivedSearchTerm === '' ||
        offer.properties.address_street.toLowerCase().includes(receivedSearchTerm.toLowerCase()) ||
        offer.properties.address_commune.toLowerCase().includes(receivedSearchTerm.toLowerCase()) ||
        (offer.buyer_profile &&
          (`${offer.buyer_profile.first_name} ${offer.buyer_profile.paternal_last_name}`.toLowerCase().includes(receivedSearchTerm.toLowerCase()) ||
           offer.buyer_profile.email.toLowerCase().includes(receivedSearchTerm.toLowerCase())));

      const matchesStatus = receivedStatusFilter === 'todos' || offer.status === receivedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando tus ofertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Ofertas de Compra</h1>
            <p className="text-gray-600">
              {activeView === 'sent'
                ? 'Gestiona las ofertas de compra que has realizado sobre propiedades en venta'
                : 'Gestiona las ofertas de compra que has recibido sobre tus propiedades en venta'
              }
            </p>
          </div>

          {activeView === 'sent' && (
            <Link to="/panel">
              <CustomButton variant="primary" className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Buscar Propiedades</span>
              </CustomButton>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveView('sent')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeView === 'sent'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Ofertas Realizadas ({sentOffers.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('received')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeView === 'received'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Inbox className="h-5 w-5" />
              <span>Ofertas Recibidas ({receivedOffers.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeView === 'sent' ? "Buscar por dirección o comuna..." : "Buscar por dirección, comuna, nombre o email..."}
              value={activeView === 'sent' ? sentSearchTerm : receivedSearchTerm}
              onChange={(e) => activeView === 'sent' ? setSentSearchTerm(e.target.value) : setReceivedSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={activeView === 'sent' ? sentStatusFilter : receivedStatusFilter}
              onChange={(e) => activeView === 'sent' ? setSentStatusFilter(e.target.value) : setReceivedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="info_solicitada">Info Solicitada</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
              <option value="contraoferta">Contraoferta</option>
              <option value="estudio_titulo">Estudio de Título</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Ofertas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6">
          {activeView === 'sent' ? (
            <>
              {filterSentOffers().length === 0 ? (
                <div className="text-center py-12">
                  {sentOffers.length === 0 ? (
                    <>
                      <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No has realizado ofertas de compra aún</h3>
                      <p className="text-gray-500 mb-6">
                        Comienza a explorar propiedades en venta y haz ofertas a las que te interesen.
                      </p>
                      <Link to="/panel">
                        <CustomButton variant="primary" className="flex items-center space-x-2 mx-auto">
                          <Plus className="h-5 w-5" />
                          <span>Buscar Propiedades en Venta</span>
                        </CustomButton>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron ofertas</h3>
                      <p className="text-gray-500">
                        No hay ofertas que coincidan con los filtros aplicados.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filterSentOffers().map((offer) => (
                    <div
                      key={offer.id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-5 sm:p-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                <Building className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-green-600 transition-colors">
                                  {offer.properties.address_street} {offer.properties.address_number || ''}
                                </h3>
                                <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2">
                                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                    <span>{offer.properties.address_commune}</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                    <span className="text-gray-600 text-xs">Precio publicado:</span>
                                    <span className="font-semibold text-blue-700">
                                      {formatPrice(offer.properties.price_clp)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                              {getStatusLabel(offer.status)}
                            </span>
                            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
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

                        {/* Offer Details */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Tu oferta:</span>
                            <span className="text-xl font-bold text-green-700">
                              {formatCurrency(offer.offer_amount, offer.offer_amount_currency)}
                            </span>
                          </div>
                          {offer.financing_type && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="font-medium">Financiamiento:</span>
                              <span>{offer.financing_type}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {offer.requests_title_study && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                <FileText className="h-3 w-3" />
                                Estudio de título solicitado
                              </span>
                            )}
                            {offer.requests_property_inspection && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                <Settings className="h-3 w-3" />
                                Inspección solicitada
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Counter Offer */}
                        {offer.counter_offer_amount && (
                          <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-900">Contraoferta del vendedor:</span>
                              </div>
                              <span className="text-lg font-bold text-purple-700">
                                {formatCurrency(offer.counter_offer_amount, offer.offer_amount_currency)}
                              </span>
                            </div>
                            {offer.counter_offer_terms && (
                              <p className="text-sm text-purple-800 mt-2">{offer.counter_offer_terms}</p>
                            )}
                          </div>
                        )}

                        {/* Message */}
                        {offer.message && (
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-gray-700 italic">"{offer.message}"</p>
                          </div>
                        )}

                        {/* Seller Response */}
                        {offer.seller_response && (
                          <div className="mt-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs font-medium text-amber-900 mb-1">Respuesta del vendedor:</p>
                            <p className="text-sm text-gray-700">{offer.seller_response}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link to={`/my-offers/${offer.id}/details`}>
                            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                              <Settings className="h-3 w-3" />
                              Ver Detalles
                            </button>
                          </Link>

                          <Link to={`/property/${offer.property_id}`}>
                            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                              Ver Propiedad
                            </button>
                          </Link>

                          {offer.status === 'pendiente' && (
                            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
                              En espera de respuesta
                            </button>
                          )}

                          {offer.status === 'aceptada' && (
                            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                              Continuar proceso
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filterReceivedOffers().length === 0 ? (
                <div className="text-center py-12">
                  {receivedOffers.length === 0 ? (
                    <>
                      <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No has recibido ofertas de compra aún</h3>
                      <p className="text-gray-500">
                        Cuando otros usuarios hagan ofertas sobre tus propiedades en venta, aparecerán aquí.
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron ofertas</h3>
                      <p className="text-gray-500">
                        No hay ofertas que coincidan con los filtros aplicados.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filterReceivedOffers().map((offer) => (
                    <div
                      key={offer.id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-5 sm:p-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                <Building className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
                                  {offer.properties.address_street} {offer.properties.address_number || ''}
                                </h3>
                                <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2 mb-2">
                                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                    <span>{offer.properties.address_commune}</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                                    <span className="text-gray-600 text-xs">Precio publicado:</span>
                                    <span className="font-semibold text-blue-700">
                                      {formatPrice(offer.properties.price_clp)}
                                    </span>
                                  </div>
                                </div>
                                {/* Buyer Info */}
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                    <span className="text-xs font-bold text-white">
                                      {offer.buyer_profile
                                        ? `${offer.buyer_profile.first_name[0]}${offer.buyer_profile.paternal_last_name[0]}`
                                        : offer.buyer_name[0]
                                      }
                                    </span>
                                  </div>
                                  <span className="font-medium">
                                    {offer.buyer_profile
                                      ? `${offer.buyer_profile.first_name} ${offer.buyer_profile.paternal_last_name}${offer.buyer_profile.maternal_last_name ? ` ${offer.buyer_profile.maternal_last_name}` : ''}`
                                      : offer.buyer_name
                                    }
                                  </span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">
                                    {offer.buyer_profile?.email || offer.buyer_email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                              {getStatusLabel(offer.status)}
                            </span>
                            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
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

                        {/* Offer Details */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Monto ofertado:</span>
                            <span className="text-xl font-bold text-green-700">
                              {formatCurrency(offer.offer_amount, offer.offer_amount_currency)}
                            </span>
                          </div>
                          {offer.financing_type && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="font-medium">Financiamiento:</span>
                              <span>{offer.financing_type}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {offer.requests_title_study && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                <FileText className="h-3 w-3" />
                                Solicita estudio de título
                              </span>
                            )}
                            {offer.requests_property_inspection && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                <Settings className="h-3 w-3" />
                                Solicita inspección
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        {offer.message && (
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-medium text-blue-900 mb-1">Mensaje del comprador:</p>
                            <p className="text-sm text-gray-700 italic">"{offer.message}"</p>
                          </div>
                        )}

                        {/* Counter Offer (if exists) */}
                        {offer.counter_offer_amount && (
                          <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-purple-900">Tu contraoferta:</span>
                              <span className="text-lg font-bold text-purple-700">
                                {formatCurrency(offer.counter_offer_amount, offer.offer_amount_currency)}
                              </span>
                            </div>
                            {offer.counter_offer_terms && (
                              <p className="text-sm text-purple-800 mt-2">{offer.counter_offer_terms}</p>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link to={`/my-offers/${offer.id}/seller-admin`}>
                            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                              <Settings className="h-3 w-3" />
                              Gestionar Oferta
                            </button>
                          </Link>

                          <Link to={`/property/${offer.property_id}`}>
                            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                              Ver Propiedad
                            </button>
                          </Link>

                          {offer.status === 'pendiente' && (
                            <>
                              <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                                ✓ Aceptar
                              </button>
                              <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                                Contraoferta
                              </button>
                              <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                                ✕ Rechazar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOffersPage;




