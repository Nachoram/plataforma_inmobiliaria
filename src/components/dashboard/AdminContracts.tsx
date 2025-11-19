import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Eye,
  Edit3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Building,
  Filter,
  Plus,
  Shield,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface Contract {
  id: string;
  status: 'borrador' | 'en_revision' | 'aprobado' | 'firmado' | 'activo' | 'completado' | 'cancelado';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  signed_at?: string;
  start_date?: string;
  end_date?: string;
  monthly_rent_clp?: number;
  deposit_amount_clp?: number;
  applications: {
    id: string;
    property_id: string;
    snapshot_applicant_first_name: string;
    snapshot_applicant_paternal_last_name: string;
    snapshot_applicant_email: string;
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
  };
}

type ContractStatus = Contract['status'];

const AdminContracts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadContracts();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      // Check if user has admin role in profiles
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

      // Allow admin or owner roles
      setIsAdmin(profile?.role === 'admin' || profile?.role === 'owner');
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  const loadContracts = async () => {
    try {
      setLoading(true);

      console.log('🔍 Loading contracts for admin...');

      // Get contracts with applications and property data
      const { data: contractsData, error: contractsError } = await supabase
        .from('rental_contracts')
        .select(`
          *,
          applications (
            id,
            property_id,
            snapshot_applicant_first_name,
            snapshot_applicant_paternal_last_name,
            snapshot_applicant_email,
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
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('❌ Error fetching contracts:', contractsError);
        toast.error('Error al cargar contratos');
        return;
      }

      console.log('✅ Contracts loaded:', contractsData?.length || 0);
      setContracts(contractsData || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      case 'en_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprobado':
        return 'bg-blue-100 text-blue-800';
      case 'firmado':
        return 'bg-purple-100 text-purple-800';
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'completado':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'borrador':
        return <FileText className="h-4 w-4" />;
      case 'en_revision':
        return <Clock className="h-4 w-4" />;
      case 'aprobado':
        return <CheckCircle className="h-4 w-4" />;
      case 'firmado':
        return <Shield className="h-4 w-4" />;
      case 'activo':
        return <CheckCircle className="h-4 w-4" />;
      case 'completado':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelado':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: ContractStatus) => {
    switch (status) {
      case 'borrador':
        return 'Borrador';
      case 'en_revision':
        return 'En Revisión';
      case 'aprobado':
        return 'Aprobado';
      case 'firmado':
        return 'Firmado';
      case 'activo':
        return 'Activo';
      case 'completado':
        return 'Completado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Filter contracts based on search and status
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.applications?.snapshot_applicant_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications?.snapshot_applicant_paternal_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications?.properties?.address_street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications?.properties?.address_commune?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewContract = (contractId: string) => {
    navigate(`/dashboard/admin/contracts/${contractId}`);
  };

  const handleEditContract = (contractId: string) => {
    navigate(`/dashboard/admin/contracts/${contractId}/edit`);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-red-600">
            No tienes permisos para acceder a la gestión de contratos.
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
              Gestión de Contratos
            </h1>
            <p className="text-gray-600 mt-2">
              Administra todos los contratos de arrendamiento de la plataforma
            </p>
          </div>
          <CustomButton className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Contrato
          </CustomButton>
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
                placeholder="Buscar por arrendatario o propiedad..."
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
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobado">Aprobado</option>
              <option value="firmado">Firmado</option>
              <option value="activo">Activo</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay contratos
            </h3>
            <p className="text-gray-600">
              {contracts.length === 0
                ? 'Aún no se han creado contratos en la plataforma.'
                : 'No se encontraron contratos que coincidan con los filtros aplicados.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrendatario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.applications?.snapshot_applicant_first_name} {contract.applications?.snapshot_applicant_paternal_last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.applications?.snapshot_applicant_email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.applications?.properties?.address_street} {contract.applications?.properties?.address_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.applications?.properties?.address_commune}, {contract.applications?.properties?.address_region}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        <span className="ml-1">{getStatusLabel(contract.status)}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Creado: {new Date(contract.created_at).toLocaleDateString('es-CL')}</div>
                        {contract.start_date && (
                          <div>Inicio: {new Date(contract.start_date).toLocaleDateString('es-CL')}</div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.monthly_rent_clp && (
                        <div className="font-medium">
                          ${contract.monthly_rent_clp.toLocaleString('es-CL')} CLP/mes
                        </div>
                      )}
                      {contract.deposit_amount_clp && (
                        <div className="text-gray-500">
                          Garantía: ${contract.deposit_amount_clp.toLocaleString('es-CL')} CLP
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewContract(contract.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditContract(contract.id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Editar contrato"
                        >
                          <Edit3 className="h-4 w-4" />
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
              Mostrando {filteredContracts.length} de {contracts.length} contratos
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Activos: {contracts.filter(c => c.status === 'activo').length}
              </span>
              <span className="text-gray-600">
                En revisión: {contracts.filter(c => c.status === 'en_revision').length}
              </span>
              <span className="text-gray-600">
                Completados: {contracts.filter(c => c.status === 'completado').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContracts;





