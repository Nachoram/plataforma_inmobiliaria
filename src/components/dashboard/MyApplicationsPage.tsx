import React, { useState, useEffect } from 'react';
import { Plus, Mail, Calendar, MapPin, Building, AlertTriangle, Settings, Send, Inbox, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';

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

interface ReceivedApplicationWithDetails {
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
  applicant_profile: {
    id: string;
    first_name: string;
    paternal_last_name: string;
    maternal_last_name?: string;
    email: string;
  };
}

type ViewType = 'sent' | 'received';

const MyApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('sent');
  const [sentApplications, setSentApplications] = useState<ApplicationWithDetails[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentSearchTerm, setSentSearchTerm] = useState('');
  const [receivedSearchTerm, setReceivedSearchTerm] = useState('');
  const [sentStatusFilter, setSentStatusFilter] = useState<string>('todos');
  const [receivedStatusFilter, setReceivedStatusFilter] = useState<string>('todos');

  useEffect(() => {
    if (user) {
      fetchSentApplications();
      fetchReceivedApplications();
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

  const fetchReceivedApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          properties!inner(
            id,
            address_street,
            address_number,
            address_commune,
            price_clp,
            listing_type
          ),
          applicant_profile:profiles(
            id,
            first_name,
            paternal_last_name,
            maternal_last_name,
            email
          )
        `)
        .eq('properties.owner_id', user?.id)
        .neq('applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceivedApplications(data || []);
    } catch (error) {
      console.error('Error fetching received applications:', error);
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

  // Filter functions
  const filterSentApplications = () => {
    return sentApplications.filter(app => {
      const matchesSearch = sentSearchTerm === '' ||
        app.properties.address_street.toLowerCase().includes(sentSearchTerm.toLowerCase()) ||
        app.properties.address_commune.toLowerCase().includes(sentSearchTerm.toLowerCase());

      const matchesStatus = sentStatusFilter === 'todos' || app.status === sentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filterReceivedApplications = () => {
    return receivedApplications.filter(app => {
      const matchesSearch = receivedSearchTerm === '' ||
        app.properties.address_street.toLowerCase().includes(receivedSearchTerm.toLowerCase()) ||
        app.properties.address_commune.toLowerCase().includes(receivedSearchTerm.toLowerCase()) ||
        (app.applicant_profile &&
          (`${app.applicant_profile.first_name} ${app.applicant_profile.paternal_last_name}`.toLowerCase().includes(receivedSearchTerm.toLowerCase()) ||
           app.applicant_profile.email.toLowerCase().includes(receivedSearchTerm.toLowerCase())));

      const matchesStatus = receivedStatusFilter === 'todos' || app.status === receivedStatusFilter;

      return matchesSearch && matchesStatus;
    });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Postulaciones de Arriendo</h1>
            <p className="text-gray-600">
              {activeView === 'sent'
                ? 'Gestiona las postulaciones que has realizado a propiedades de arriendo'
                : 'Gestiona las postulaciones que has recibido como propietario'
              }
            </p>
          </div>

          {activeView === 'sent' && (
            <Link to="/panel">
              <CustomButton variant="primary" className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Buscar Arriendo</span>
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
              <span>Postulaciones Realizadas ({sentApplications.length})</span>
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
              <span>Postulaciones Recibidas ({receivedApplications.length})</span>
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
              placeholder={activeView === 'sent' ? "Buscar postulaciones por dirección o comuna..." : "Buscar postulaciones por dirección, comuna, nombre o email..."}
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
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Postulaciones */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6">
          {activeView === 'sent' ? (
            <>
              {filterSentApplications().length === 0 ? (
                <div className="text-center py-12">
                  {sentApplications.length === 0 ? (
                    <>
                      <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No has realizado postulaciones aún</h3>
                      <p className="text-gray-500 mb-6">
                        Comienza a explorar propiedades de arriendo disponibles y postula a las que te interesen.
                      </p>
                      <Link to="/panel">
                        <CustomButton variant="primary" className="flex items-center space-x-2 mx-auto">
                          <Plus className="h-5 w-5" />
                          <span>Buscar Propiedades</span>
                        </CustomButton>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron postulaciones</h3>
                      <p className="text-gray-500">
                        No hay postulaciones que coincidan con los filtros aplicados.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filterSentApplications().map((application) => (
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
            </>
          ) : (
            <>
              {filterReceivedApplications().length === 0 ? (
                <div className="text-center py-12">
                  {receivedApplications.length === 0 ? (
                    <>
                      <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No has recibido postulaciones aún</h3>
                      <p className="text-gray-500">
                        Cuando otros usuarios hagan postulaciones a tus propiedades de arriendo, aparecerán aquí.
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron postulaciones</h3>
                      <p className="text-gray-500">
                        No hay postulaciones que coincidan con los filtros aplicados.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filterReceivedApplications().map((application) => (
                    <div
                      key={application.id}
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
                                  {application.properties.address_street} {application.properties.address_number || ''}
                                </h3>
                                <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2 mb-2">
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
                                {/* Applicant Info */}
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                                    <span className="text-xs font-bold text-white">
                                      {application.applicant_profile
                                        ? `${application.applicant_profile.first_name[0]}${application.applicant_profile.paternal_last_name[0]}`
                                        : 'N/A'
                                      }
                                    </span>
                                  </div>
                                  <span className="font-medium">
                                    {application.applicant_profile
                                      ? `${application.applicant_profile.first_name} ${application.applicant_profile.paternal_last_name}${application.applicant_profile.maternal_last_name ? ` ${application.applicant_profile.maternal_last_name}` : ''}`
                                      : 'Perfil no disponible'
                                    }
                                  </span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">
                                    {application.applicant_profile?.email || 'Email no disponible'}
                                  </span>
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
                            <>
                              <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                                ✓ Aprobar
                              </button>
                              <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                                ✕ Rechazar
                              </button>
                            </>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplicationsPage;

