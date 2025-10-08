import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, MessageSquare, Clock, CheckCircle, XCircle, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface OfferWithProperty {
  id: string;
  property_id: string;
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
    property_images: { image_url: string }[];
  };
}

interface ApplicationWithProperty {
  id: string;
  property_id: string;
  message: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  properties: {
    address_street: string;
    address_commune: string;
    address_region: string;
    price_clp: number;
    listing_type: string;
    property_images: { image_url: string }[];
  };
}

export const MyActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'offers'>('applications');
  const [offers, setOffers] = useState<OfferWithProperty[]>([]);
  const [applications, setApplications] = useState<ApplicationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyActivity();
    }
  }, [user]);

  const fetchMyActivity = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch my offers using getSentOffers API
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select(`
          *,
          properties (address_street, address_commune, address_region, price_clp, listing_type, property_images(image_url))
        `)
        .eq('offerer_id', user?.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      // Fetch my applications using getSentApplications API
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          properties (address_street, address_commune, address_region, price_clp, listing_type, property_images(image_url))
        `)
        .eq('applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      setOffers(offersData || []);
      setApplications(appsData || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      case 'aprobada': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rechazada': return <XCircle className="h-4 w-4 text-red-600" />;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Mi Actividad</h1>
        <p className="text-gray-600">Revisa todas las acciones que has iniciado: postulaciones y ofertas que has enviado</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex">
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
                <span>Mis Postulaciones ({applications.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'offers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Mis Ofertas Realizadas ({offers.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No has postulado a ninguna propiedad aún</p>
                  <Link 
                    to="/"
                    className="text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    Explorar propiedades en arriendo
                  </Link>
                </div>
              ) : (
                applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {application.properties.address_street}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {application.properties.address_commune}, {application.properties.address_region}
                        </p>
                        
                        <div className="flex items-center text-sm mb-3">
                          <DollarSign className="h-4 w-4 mr-1 text-emerald-600" />
                          <span>Arriendo: {formatPrice(application.properties.price_clp)}/mes</span>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Mensaje:</strong> {application.message}
                        </p>

                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Postulada: {formatDate(application.created_at)}</span>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(application.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                        <Link
                          to={`/property/${application.property_id}`}
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                        >
                          Ver propiedad →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="space-y-4">
              {offers.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No has hecho ninguna oferta aún</p>
                  <Link 
                    to="/"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Explorar propiedades en venta
                  </Link>
                </div>
              ) : (
                offers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {offer.properties.address_street}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {offer.properties.address_commune}, {offer.properties.address_region}
                        </p>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            <span>Precio: {formatPrice(offer.properties.price_clp)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
                            <span>Tu oferta: {formatPrice(offer.amount_clp)}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Mensaje:</strong> {offer.message}
                        </p>

                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Enviada: {formatDate(offer.created_at)}</span>
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
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver propiedad →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
