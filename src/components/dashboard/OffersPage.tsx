import React, { useState, useEffect } from 'react';
import { Check, X, Clock, DollarSign, Calendar, MapPin, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface OfferWithDetails {
  id: string;
  property_id: string;
  offerer_id: string;
  offer_amount: number;
  message: string | null;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  created_at: string;
  property: {
    address_street: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
    photos_urls?: string[];
  };
  buyer?: {
    full_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null;
}

export const OffersPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedOffers, setReceivedOffers] = useState<OfferWithDetails[]>([]);
  const [sentOffers, setSentOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  // Función para obtener ofertas recibidas (como propietario)
  const fetchReceivedOffers = async () => {
    try {
      // First, get properties owned by the user
      const { data: userProperties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user?.id);

      if (propertiesError) throw propertiesError;

      if (!userProperties || userProperties.length === 0) {
        return [];
      }

      const propertyIds = userProperties.map(p => p.id);

      // Then get offers for those properties
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          property:properties!inner(address_street, address_commune, price_clp, listing_type, photos_urls),
          buyer:profiles!offers_offerer_id_fkey(full_name, contact_email, contact_phone)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching received offers:', error);
      return [];
    }
  };

  // Función para obtener ofertas enviadas (como comprador)
  const fetchSentOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          property:properties!inner(address_street, address_commune, price_clp, listing_type, photos_urls)
        `)
        .eq('offerer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sent offers:', error);
      return [];
    }
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const [received, sent] = await Promise.all([
        fetchReceivedOffers(),
        fetchSentOffers()
      ]);
      
      setReceivedOffers(received);
      setSentOffers(sent);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOfferStatus = async (offerId: string, status: 'aceptada' | 'rechazada') => {
    setUpdating(offerId);
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status })
        .eq('id', offerId);

      if (error) throw error;

      setReceivedOffers(receivedOffers.map(offer =>
        offer.id === offerId ? { ...offer, status } : offer
      ));
    } catch (error) {
      console.error('Error updating offer:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aceptada': return <Check className="h-4 w-4" />;
      case 'rechazada': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateOfferPercentage = (offerAmount: number, askingPrice: number) => {
    return ((offerAmount / askingPrice) * 100).toFixed(1);
  };

  // Componente de pestañas
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('received')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'received'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Ofertas Recibidas
          {receivedOffers.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {receivedOffers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'sent'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Ofertas Realizadas
          {sentOffers.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {sentOffers.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );

  // Componente para ofertas recibidas (vista actual)
  const ReceivedOffersView = () => (
    <div className="space-y-4">
      {receivedOffers.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ofertas recibidas</h3>
          <p className="text-gray-500">
            Las ofertas de compra aparecerán aquí cuando alguien se interese en tus propiedades en venta.
          </p>
        </div>
      ) : (
        receivedOffers.map((offer) => {
          const offerPercentage = calculateOfferPercentage(offer.offer_amount, offer.property.price_clp);
          const isGoodOffer = parseFloat(offerPercentage) >= 95;
          const isReasonableOffer = parseFloat(offerPercentage) >= 85;

          return (
            <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {offer.property.address_street}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{offer.property.address_commune}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(offer.status)}`}>
                      {getStatusIcon(offer.status)}
                      <span>{offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Precio de Venta</h4>
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(offer.property.price_clp)}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isGoodOffer ? 'bg-green-50 border border-green-200' :
                    isReasonableOffer ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <h4 className="font-medium text-gray-900 mb-2">Oferta del Comprador</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(offer.offer_amount)}
                      </div>
                      <div className={`text-sm font-medium ${
                        isGoodOffer ? 'text-green-700' :
                        isReasonableOffer ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {offerPercentage}% del precio
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Comprador</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre: </span>
                      <span className="font-medium">{offer.buyer?.full_name || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email: </span>
                      <span className="font-medium">{offer.buyer?.contact_email || 'No especificado'}</span>
                    </div>
                    {offer.buyer?.contact_phone && (
                      <div>
                        <span className="text-gray-500">Teléfono: </span>
                        <span className="font-medium">{offer.buyer.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {offer.message && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Mensaje del Comprador</h4>
                    <p className="text-blue-700 text-sm whitespace-pre-wrap">
                      {offer.message}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Recibida el {formatDate(offer.created_at)}</span>
                  </div>

                  {offer.status === 'pendiente' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateOfferStatus(offer.id, 'rechazada')}
                        disabled={updating === offer.id}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => updateOfferStatus(offer.id, 'aceptada')}
                        disabled={updating === offer.id}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {updating === offer.id ? 'Procesando...' : 'Aceptar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Componente para ofertas enviadas (nueva vista)
  const SentOffersView = () => (
    <div className="space-y-4">
      {sentOffers.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No has realizado ofertas</h3>
          <p className="text-gray-500">
            Las ofertas que hagas en propiedades aparecerán aquí para que puedas seguir su estado.
          </p>
        </div>
      ) : (
        sentOffers.map((offer) => {
          const offerPercentage = calculateOfferPercentage(offer.offer_amount, offer.property.price_clp);

          return (
            <div key={offer.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {offer.property.address_street}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{offer.property.address_commune}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(offer.status)}`}>
                      {getStatusIcon(offer.status)}
                      <span>{offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Imagen de la propiedad */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {offer.property.photos_urls.length > 0 ? (
                      <img
                        src={offer.property.photos_urls[0]}
                        alt={offer.property.address_street}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Precio de venta</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(offer.property.price_clp)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Tu oferta ({offerPercentage}%)</div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(offer.offer_amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {offer.message && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tu mensaje</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {offer.message}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Enviada el {formatDate(offer.created_at)}</span>
                  </div>
                  
                  {offer.status === 'pendiente' && (
                    <div className="text-sm text-gray-500">
                      Esperando respuesta del vendedor
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Ofertas</h1>
        <p className="text-gray-600">
          Administra las ofertas de compra recibidas y revisa el estado de las ofertas que has realizado
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <TabNavigation />
        
        {activeTab === 'received' ? (
          <ReceivedOffersView />
        ) : (
          <SentOffersView />
        )}
      </div>
    </div>
  );
};