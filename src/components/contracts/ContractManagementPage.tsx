import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contract {
  id: string;
  status: string;
  created_at: string;
  approved_at: string;
  sent_to_signature_at: string;
  applications: {
    id: string;
    snapshot_applicant_first_name: string;
    snapshot_applicant_paternal_last_name: string;
    snapshot_applicant_email: string;
    properties: {
      id: string;
      title: string;
      address: string;
      owner_id: string;
      profiles: {
        first_name: string;
        paternal_last_name: string;
        email: string;
      };
    };
  };
}

const ContractManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);

      console.log('🔍 Loading contracts...');

      // First get contracts with applications data
      const { data: contractsData, error: contractsError } = await supabase
        .from('rental_contracts')
        .select(`
          *,
          applications (
            id,
            property_id,
            snapshot_applicant_first_name,
            snapshot_applicant_paternal_last_name,
            snapshot_applicant_email
          )
        `)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('❌ Error fetching contracts:', contractsError);
        throw new Error(`Error fetching contracts: ${contractsError.message || 'Unknown error'}`);
      }

      console.log('✅ Contracts loaded:', contractsData?.length || 0);

      // Then get property data for all contracts
      if (contractsData && contractsData.length > 0) {
        const propertyIds = contractsData.map(c => c.applications?.property_id).filter(Boolean);
        console.log('🔍 Property IDs to fetch:', propertyIds);

        if (propertyIds.length > 0) {
          const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select(`
              id,
              description,
              address_street,
              address_number,
              address_department,
              address_commune,
              address_region,
              owner_id,
              profiles!properties_owner_id_fkey (
                first_name,
                paternal_last_name,
                email
              )
            `)
            .in('id', propertyIds);

          if (propertiesError) {
            console.error('❌ Error fetching properties:', propertiesError);
            throw new Error(`Error fetching properties: ${propertiesError.message || 'Unknown error'}`);
          }

          console.log('✅ Properties loaded:', propertiesData?.length || 0);

          // Combine the data
          const contractsWithProperties = contractsData.map(contract => ({
            ...contract,
            applications: {
              ...contract.applications,
              properties: propertiesData?.find(p => p.id === contract.applications?.property_id) || null
            }
          }));

          setContracts(contractsWithProperties);
        } else {
          console.log('⚠️ No property IDs found, setting contracts without properties');
          setContracts(contractsData);
        }
      } else {
        console.log('ℹ️ No contracts found');
        setContracts([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading contracts:', error);

      // Mostrar error más específico
      const errorMessage = error?.message || 'Error desconocido al cargar contratos';
      alert(`Error al cargar los contratos:\n\n${errorMessage}\n\nRevisa la consola para más detalles.`);

      // Set empty contracts array on error
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit3 className="h-5 w-5 text-gray-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'sent_to_signature':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'partially_signed':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'fully_signed':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'approved':
        return 'Aprobado';
      case 'sent_to_signature':
        return 'En Firma';
      case 'partially_signed':
        return 'Parcialmente Firmado';
      case 'fully_signed':
        return 'Completado';
      default:
        return 'Cancelado';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 'approved':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'sent_to_signature':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'partially_signed':
        return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
      case 'fully_signed':
        return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white';
      default:
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
    }
  };

  const getPropertyTitle = (property: any) => {
    return property.description || `Propiedad en ${property.address_commune}`;
  };

  const filteredContracts = contracts.filter(contract => {
    const propertyTitle = getPropertyTitle(contract.applications.properties);
    const matchesSearch = searchTerm === '' ||
      propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications.snapshot_applicant_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications.snapshot_applicant_paternal_last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewContract = (contract: Contract) => {
    navigate(`/contract/${contract.id}`);
  };

  const handleViewWorkflowContract = (contract: Contract) => {
    // URL del webhook de N8N (esto debería venir de configuración o variables de entorno)
    const webhookUrl = import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL ||
                      'https://your-n8n-instance.com/webhook/contract-generator';

    // Construir la URL con parámetros para el workflow contract viewer
    const params = new URLSearchParams({
      webhookUrl,
      workflowId: 'contrato_arriendo',
      propertyId: contract.applications.properties.id,
      applicationId: contract.applications.id
    });

    navigate(`/workflow-contract/${contract.id}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando contratos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header mejorado con gradiente */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-lg border border-blue-100/50 p-5 sm:p-8 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Contratos</h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Gestiona tus contratos de arriendo
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
              <p className="text-3xl sm:text-4xl font-extrabold">{contracts.length}</p>
              <p className="text-xs sm:text-sm opacity-90 font-medium">Contratos activos</p>
            </div>
          </div>
        </div>

        {/* Filters con diseño mejorado */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search mejorado */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar contratos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Status Filter mejorado */}
            <div className="w-full sm:w-56">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 text-sm font-medium border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white cursor-pointer"
              >
                <option value="all">🔍 Todos los estados</option>
                <option value="draft">📝 Borrador</option>
                <option value="approved">✅ Aprobado</option>
                <option value="sent_to_signature">✍️ En Firma</option>
                <option value="partially_signed">📋 Parcialmente Firmado</option>
                <option value="fully_signed">🎉 Completado</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {contracts.length === 0 ? 'No tienes contratos aún' : 'No se encontraron contratos'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 px-4">
              {contracts.length === 0
                ? 'Los contratos se crearán automáticamente cuando apruebes postulantes con condiciones específicas.'
                : 'Intenta ajustar los filtros de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 transition-all duration-300 cursor-pointer touch-manipulation hover:-translate-y-1"
                onClick={() => handleViewContract(contract)}
              >
                <div className="p-5 sm:p-6">
                  {/* Status Badge mejorado */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm ${getStatusColor(contract.status)}`}>
                      {getStatusIcon(contract.status)}
                      <span className="hidden sm:inline">{getStatusText(contract.status)}</span>
                      <span className="sm:hidden">{getStatusText(contract.status).substring(0, 3)}</span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>

                  {/* Property Info mejorado */}
                  <div className="mb-4 bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 rounded-xl">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Building className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                          {getPropertyTitle(contract.applications.properties)}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {contract.applications.properties.address_street} {contract.applications.properties.address_number}
                          {contract.applications.properties.address_department ? `, ${contract.applications.properties.address_department}` : ''}
                          , {contract.applications.properties.address_commune}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Applicant Info mejorado */}
                  <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">Arrendatario</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                      {contract.applications.snapshot_applicant_first_name} {contract.applications.snapshot_applicant_paternal_last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{contract.applications.snapshot_applicant_email}</p>
                  </div>

                  {/* Dates mejorado */}
                  <div className="text-xs text-gray-600 space-y-1.5 mb-4 bg-gray-50 p-3 rounded-lg">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">📅 Creado:</span>
                      <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                    </p>
                    {contract.approved_at && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">✅ Aprobado:</span>
                        <span>{new Date(contract.approved_at).toLocaleDateString()}</span>
                      </p>
                    )}
                    {contract.sent_to_signature_at && (
                      <p className="flex items-center gap-2 truncate">
                        <span className="font-semibold">✍️ Enviado:</span>
                        <span>{new Date(contract.sent_to_signature_at).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions mejoradas */}
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewContract(contract);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Contrato</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ContractManagementPage;
