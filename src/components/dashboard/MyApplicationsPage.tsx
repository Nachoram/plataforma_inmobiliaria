import React, { useState, useEffect } from 'react';
import { Plus, Mail, Calendar, MapPin, Building, AlertTriangle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CustomButton from '../common/CustomButton';

interface ApplicationWithDetails {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  application_characteristic_id?: string | null;
  properties: {
    id: string;
    address_street: string;
    address_number?: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
  };
}

const MyApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [sentApplications, setSentApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSentApplications();
    }
  }, [user]);

  const fetchSentApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
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
        .eq('applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSentApplications(data || []);
    } catch (error) {
      console.error('Error fetching sent applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando tus postulaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Postulaciones</h1>
            <p className="text-gray-600">Gestiona las postulaciones que has enviado a propiedades de arriendo</p>
          </div>
          
          <Link to="/panel">
            <CustomButton variant="primary" className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Crear Nueva Postulación</span>
            </CustomButton>
          </Link>
        </div>
      </div>

      {/* Lista de Postulaciones Enviadas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Postulaciones Enviadas ({sentApplications.length})
          </h2>
        </div>

        <div className="p-6">
          {sentApplications.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No has enviado postulaciones aún</h3>
              <p className="text-gray-500 mb-6">
                Comienza a explorar propiedades disponibles y postula a las que te interesen.
              </p>
              <Link to="/panel">
                <CustomButton variant="primary" className="flex items-center space-x-2 mx-auto">
                  <Plus className="h-5 w-5" />
                  <span>Explorar Propiedades</span>
                </CustomButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sentApplications.map((application) => (
                <div 
                  key={application.id} 
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <Building className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
                              {application.properties.address_street} {application.properties.address_number || ''}
                            </h3>
                            <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2">
                              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                <span>{application.properties.address_commune}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                                <span className="font-semibold text-emerald-700">
                                  {formatPrice(application.properties.price_clp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {new Date(application.created_at).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {application.message && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-700 italic">"{application.message}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={`/my-applications/${application.id}/admin`}>
                        <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                          <Settings className="h-3 w-3" />
                          Administrar
                        </button>
                      </Link>

                      <Link to={`/property/${application.property_id}`}>
                        <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          Ver Propiedad
                        </button>
                      </Link>
                      
                      {application.status === 'pendiente' && (
                        <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
                          <AlertTriangle className="h-3 w-3" />
                          En espera de respuesta
                        </button>
                      )}

                      {application.status === 'aprobada' && (
                        <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                          Ver Contrato
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplicationsPage;

