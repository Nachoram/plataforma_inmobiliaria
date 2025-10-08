import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building, MessageSquare, DollarSign, Check, X, Clock, Calendar } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CustomButton from '../common/CustomButton';
import PropertyCard from '../PropertyCard';

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

interface ReceivedApplication {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  properties: {
    address_street: string;
    address_commune: string;
    address_region: string;
    price_clp: number;
    listing_type: string;
  };
  profiles: {
    first_name: string;
    paternal_last_name: string;
    email: string;
    phone: string;
  };
}

interface ReceivedOffer {
  id: string;
  property_id: string;
  offerer_id: string;
  amount_clp: number;
  message: string;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  created_at: string;
  properties: {
    address_street: string;
    address_commune: string;
    address_region: string;
    price_clp: number;
    listing_type: string;
  };
  profiles: {
    first_name: string;
    paternal_last_name: string;
    email: string;
    phone: string;
  };
}

const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'applications' | 'offers'>('properties');
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplication[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolioData = useCallback(async () => {
    // Verify user is authenticated before making any database queries
    if (!user || !user.id) {
      console.warn('User not authenticated, cannot fetch portfolio data');
      setProperties([]);
      setReceivedApplications([]);
      setReceivedOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            image_url,
            storage_path
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        if (propertiesError.message.includes('permission denied') || propertiesError.message.includes('RLS')) {
          console.error('RLS Policy violation: User does not have permission to view properties');
          setProperties([]);
        } else {
          throw propertiesError;
        }
      } else {
        setProperties(propertiesData || []);
      }

      // Fetch received applications using explicit nested select
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          properties!inner (*),
          profiles!applicant_id (*)
        `)
        .eq('properties.owner_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Fetched Applications:', applicationsData);

      if (applicationsError) {
        console.error('Error fetching received applications:', applicationsError);
        setReceivedApplications([]);
      } else {
        setReceivedApplications(applicationsData || []);
      }

      // Fetch received offers using getReceivedOffers API
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select(`
          *,
          properties!inner (
            id,
            address_street,
            address_commune,
            address_region,
            price_clp,
            listing_type
          ),
          profiles!offers_offerer_id_fkey (
            first_name,
            paternal_last_name,
            email,
            phone
          )
        `)
        .eq('properties.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (offersError) {
        console.error('Error fetching received offers:', offersError);
        setReceivedOffers([]);
      } else {
        setReceivedOffers(offersData || []);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setProperties([]);
      setReceivedApplications([]);
      setReceivedOffers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user, fetchPortfolioData]);

  const deleteProperty = async (id: string) => {
    // Verify user is authenticated
    if (!user || !user.id) {
      console.error('User not authenticated, cannot delete property');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Additional RLS check - ensure user owns the property

      if (error) {
        // Handle RLS policy violations
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: User does not have permission to delete this property');
          alert('No tienes permisos para eliminar esta propiedad');
        } else {
          throw error;
        }
      } else {
        // Update local state only if deletion was successful
        setProperties(properties.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad. Por favor, intenta nuevamente.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'aceptada':
      case 'aprobada': return <Check className="h-4 w-4 text-green-600" />;
      case 'rechazada': return <X className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aceptada':
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente': return 'En Revisión';
      case 'aceptada': return 'Aceptada';
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      default: return status;
    }
  };


  // Check authentication before showing any content
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Acceso Restringido
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Necesitas iniciar sesión para ver tu portafolio de propiedades.
          </p>
          <div className="mt-6">
            <CustomButton
              onClick={() => window.location.href = '/auth'}
              variant="primary"
            >
              Ir a Iniciar Sesión
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando tus propiedades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Portafolio</h1>
        <p className="text-gray-600 mb-6">Gestiona tus propiedades y las interacciones relacionadas</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/property/new?type=venta"
            className="flex items-center justify-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Propiedad en Venta</span>
          </Link>
          <Link
            to="/property/new/rental"
            className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Propiedad en Arriendo</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Mis Propiedades ({properties.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'applications'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Postulaciones Recibidas ({receivedApplications.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'offers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Ofertas Recibidas ({receivedOffers.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'properties' && (
            <>
              {/* Properties Grid */}
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes propiedades aún</h3>
                  <p className="text-gray-500 mb-6">Comienza publicando tu primera propiedad</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/property/new?type=venta"
                      className="flex items-center justify-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Publicar en Venta</span>
                    </Link>
                    <Link
                      to="/property/new/rental"
                      className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Publicar en Arriendo</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      context="portfolio"
                      onEdit={(property) => {
                        // Navigate to edit page
                        window.location.href = `/property/edit/${property.id}`;
                      }}
                      onDelete={deleteProperty}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              {receivedApplications.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No has recibido postulaciones</h3>
                  <p className="text-gray-500">
                    Las postulaciones de arriendo aparecerán aquí cuando alguien se interese en tus propiedades.
                  </p>
                </div>
              ) : (
                receivedApplications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {application.properties?.address_street || 'Dirección no disponible'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Postulante: {application.profiles?.first_name || 'Usuario Anónimo'}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => {}}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => {}}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-4">
              {receivedOffers.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No has recibido ofertas</h3>
                  <p className="text-gray-500">
                    Las ofertas de compra aparecerán aquí cuando alguien se interese en tus propiedades en venta.
                  </p>
                </div>
              ) : (
                receivedOffers
                  .filter((offer) => offer.profiles !== null)
                  .map((offer) => {
                  const offerPercentage = ((offer.amount_clp / offer.properties.price_clp) * 100).toFixed(1);
                  const isGoodOffer = parseFloat(offerPercentage) >= 95;
                  const isReasonableOffer = parseFloat(offerPercentage) >= 85;

                  return (
                    <div key={offer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {offer.properties.address_street}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {offer.properties.address_commune}, {offer.properties.address_region}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-1">Precio de Venta</h4>
                              <div className="text-lg font-bold text-gray-900">
                                {formatPrice(offer.properties.price_clp)}
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg ${
                              isGoodOffer ? 'bg-green-50 border border-green-200' :
                              isReasonableOffer ? 'bg-yellow-50 border border-yellow-200' :
                              'bg-red-50 border border-red-200'
                            }`}>
                              <h4 className="font-medium text-gray-900 mb-1">Oferta del Comprador</h4>
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatPrice(offer.amount_clp)}
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

                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <h4 className="font-medium text-gray-900 mb-2">Información del Comprador</h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-gray-500">Nombre: </span>
                                <span className="font-medium">{offer.profiles?.first_name ?? 'Usuario Anónimo'} {offer.profiles?.paternal_last_name ?? ''}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Email: </span>
                                <span className="font-medium">{offer.profiles?.email ?? 'No disponible'}</span>
                              </div>
                              {offer.profiles?.phone && (
                                <div>
                                  <span className="text-gray-500">Teléfono: </span>
                                  <span className="font-medium">{offer.profiles.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {offer.message && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3">
                              <h4 className="font-medium text-blue-900 mb-2">Mensaje del Comprador</h4>
                              <p className="text-blue-700 text-sm whitespace-pre-wrap">
                                {offer.message}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Recibida: {formatDate(offer.created_at)}</span>
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(offer.status)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                              {getStatusText(offer.status)}
                            </span>
                          </div>
                          <Link
                            to={`/property/${offer.property_id}`}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Ver propiedad →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;