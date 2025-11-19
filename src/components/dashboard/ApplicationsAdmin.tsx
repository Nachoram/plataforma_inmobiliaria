import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Building,
  Calendar,
  Filter,
  FileText,
  Shield,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';
import EditorButton from './EditorButton';

interface Application {
  id: string;
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'finalizada';
  message: string;
  created_at: string;
  updated_at: string;
  properties: {
    id: string;
    address_street: string;
    address_number: string;
    address_commune: string;
    address_region: string;
    owner_id: string;
    profiles: {
      first_name: string;
      paternal_last_name: string;
      email: string;
    };
  };
  profiles: {
    first_name: string;
    paternal_last_name: string;
    email: string;
  };
}

const ApplicationsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Application['status'] | 'all'>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadApplications();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(profile?.role === 'admin' || profile?.role === 'owner');
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);

      console.log('🔍 Loading applications for admin...');

      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          properties (
            id,
            address_street,
            address_number,
            address_commune,
            address_region,
            owner_id,
            profiles!properties_owner_id_fkey (
              first_name,
              paternal_last_name,
              email
            )
          ),
          profiles (
            first_name,
            paternal_last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching applications:', error);
        toast.error('Error al cargar aplicaciones');
        return;
      }

      console.log('✅ Applications loaded:', applicationsData?.length || 0);
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Error al cargar aplicaciones');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_revision':
        return 'bg-blue-100 text-blue-800';
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      case 'finalizada':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'en_revision':
        return <Eye className="h-4 w-4" />;
      case 'aprobada':
        return <CheckCircle className="h-4 w-4" />;
      case 'rechazada':
        return <AlertTriangle className="h-4 w-4" />;
      case 'finalizada':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: Application['status']) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_revision':
        return 'En Revisión';
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'finalizada':
        return 'Finalizada';
      default:
        return status;
    }
  };

  const handleViewApplication = (applicationId: string) => {
    navigate(`/dashboard/admin/applications/${applicationId}`);
  };

  const handleViewContract = (application: Application) => {
    // Check if there's an associated contract
    // For now, navigate to contract creation or detail
    navigate(`/dashboard/admin/contracts?application=${application.id}`);
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(application => {
    const matchesSearch =
      application.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.profiles?.paternal_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.properties?.address_street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.properties?.address_commune?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-red-600">
            No tienes permisos para acceder a la gestión de aplicaciones.
            Esta sección es exclusiva para administradores.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
              Gestión de Aplicaciones
            </h1>
            <p className="text-gray-600 mt-2">
              Administra todas las postulaciones de la plataforma
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <CustomButton
              onClick={() => navigate('/dashboard/admin/contracts')}
              variant="outline"
              className="flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Contratos
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por postulante, propiedad o mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Application['status'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="finalizada">Finalizadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay aplicaciones
            </h3>
            <p className="text-gray-600">
              {applications.length === 0
                ? 'Aún no se han recibido postulaciones en la plataforma.'
                : 'No se encontraron aplicaciones que coincidan con los filtros aplicados.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Postulante
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensaje
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.profiles?.first_name} {application.profiles?.paternal_last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.properties?.address_street} {application.properties?.address_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.properties?.address_commune}, {application.properties?.address_region}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">{getStatusLabel(application.status)}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(application.created_at).toLocaleDateString('es-CL')}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {application.message || 'Sin mensaje'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewApplication(application.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <EditorButton
                          applicationId={application.id}
                          propertyId={application.properties?.id}
                          variant="ghost"
                          size="sm"
                          showText={false}
                        />

                        <button
                          onClick={() => handleViewContract(application)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Ver contrato"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Mostrando {filteredApplications.length} de {applications.length} aplicaciones
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Pendientes: {applications.filter(a => a.status === 'pendiente').length}
              </span>
              <span className="text-gray-600">
                En revisión: {applications.filter(a => a.status === 'en_revision').length}
              </span>
              <span className="text-gray-600">
                Aprobadas: {applications.filter(a => a.status === 'aprobada').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsAdmin;





