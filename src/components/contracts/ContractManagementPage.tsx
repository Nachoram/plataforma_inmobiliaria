import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Eye,
  Edit3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';
import ContractApprovalWorkflow from './ContractApprovalWorkflow';

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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
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

      if (contractsError) throw contractsError;

      // Then get property data for all contracts
      if (contractsData && contractsData.length > 0) {
        const propertyIds = contractsData.map(c => c.applications?.property_id).filter(Boolean);

        if (propertyIds.length > 0) {
          const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select(`
              id,
              title,
              address,
              owner_id,
              profiles (
                first_name,
                paternal_last_name,
                email
              )
            `)
            .in('id', propertyIds);

          if (propertiesError) throw propertiesError;

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
          setContracts(contractsData);
        }
      } else {
        setContracts([]);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      alert('Error al cargar los contratos');
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
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'sent_to_signature':
        return 'bg-blue-100 text-blue-800';
      case 'partially_signed':
        return 'bg-yellow-100 text-yellow-800';
      case 'fully_signed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' ||
      contract.applications.properties.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications.snapshot_applicant_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.applications.snapshot_applicant_paternal_last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowWorkflow(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando contratos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 mr-3 text-blue-600" />
                Gestión de Contratos
              </h1>
              <p className="text-gray-600 mt-1">
                Administra los contratos de arriendo de tus propiedades
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
              <p className="text-sm text-gray-500">Contratos totales</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por propiedad o postulante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="approved">Aprobado</option>
                <option value="sent_to_signature">En Firma</option>
                <option value="partially_signed">Parcialmente Firmado</option>
                <option value="fully_signed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sample Contract Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Contrato de Ejemplo
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Visualiza un contrato de arriendo residencial de ejemplo para orientarte
              </p>
            </div>
            <div className="flex space-x-2">
              <CustomButton
                variant="outline"
                className="flex items-center space-x-2 opacity-50 cursor-not-allowed"
                disabled
              >
                <Eye className="h-4 w-4" />
                <span>Canvas (Próximamente)</span>
              </CustomButton>
              <CustomButton
                onClick={async () => {
                  if (confirm('¿Quieres poblar la base de datos con datos de ejemplo para el contrato? Esto insertará usuarios, propiedades, aplicaciones y contratos de demostración.')) {
                    try {
                      setLoading(true);
                      alert('Ejecutando seed de datos... Esto puede tomar unos segundos.');

                      // Crear perfil del arrendador de demostración
                      await supabase.from('profiles').upsert({
                        id: '550e8400-e29b-41d4-a716-446655440001',
                        first_name: 'Carolina',
                        paternal_last_name: 'Soto',
                        maternal_last_name: 'Rojas',
                        rut: '15.123.456-7',
                        email: 'carolina.soto@example.com',
                        phone: '+56912345678',
                        profession: 'Profesora',
                        marital_status: 'casado',
                        address_street: 'Eliodoro Yáñez',
                        address_number: '1890',
                        address_commune: 'Providencia',
                        address_region: 'Metropolitana'
                      });

                      // Insertar/actualizar arrendatario
                      await supabase.from('profiles').upsert({
                        id: '550e8400-e29b-41d4-a716-446655440002',
                        first_name: 'Carlos',
                        paternal_last_name: 'Soto',
                        maternal_last_name: 'Vega',
                        rut: '33.333.333-3',
                        email: 'carlos.soto@example.com',
                        phone: '+56987654321',
                        profession: 'Ingeniero',
                        marital_status: 'soltero',
                        address_street: 'Los Leones',
                        address_number: '567',
                        address_commune: 'Providencia',
                        address_region: 'Metropolitana'
                      });

                      // Insertar guarantor
                      await supabase.from('guarantors').upsert({
                        id: '550e8400-e29b-41d4-a716-446655440003',
                        first_name: 'Rodolfo',
                        paternal_last_name: 'Rrrrrrrr',
                        maternal_last_name: 'Mmmmmm',
                        rut: '44.444.444-4',
                        profession: 'Abogado',
                        monthly_income_clp: 3500000,
                        address_street: 'Irarrazaval',
                        address_number: '5350',
                        address_department: '22',
                        address_commune: 'Ñuñoa',
                        address_region: 'Metropolitana'
                      });

                      // Insertar propiedad
                      await supabase.from('properties').upsert({
                        id: '550e8400-e29b-41d4-a716-446655440004',
                        owner_id: '550e8400-e29b-41d4-a716-446655440001', // ID del arrendador de demostración
                        status: 'disponible',
                        listing_type: 'casa',
                        address_street: 'Suecia',
                        address_number: '1234',
                        address_department: 'Casa A',
                        address_commune: 'Providencia',
                        address_region: 'Metropolitana',
                        price_clp: 1600000,
                        common_expenses_clp: 80000,
                        bedrooms: 3,
                        bathrooms: 2,
                        surface_m2: 120,
                        description: 'Hermosa casa en Providencia, ideal para familia. Incluye estacionamiento y bodega.'
                      });

                      // Insertar aplicación
                      await supabase.from('applications').upsert({
                        id: '550e8400-e29b-41d4-a716-446655440005',
                        property_id: '550e8400-e29b-41d4-a716-446655440004',
                        applicant_id: '550e8400-e29b-41d4-a716-446655440002',
                        guarantor_id: '550e8400-e29b-41d4-a716-446655440003',
                        status: 'aprobada',
                        message: 'Excelente postulante, recomendado por conocidos. Tiene ingresos estables y referencias positivas.',
                        snapshot_applicant_first_name: 'Carlos',
                        snapshot_applicant_paternal_last_name: 'Soto',
                        snapshot_applicant_maternal_last_name: 'Vega',
                        snapshot_applicant_rut: '33.333.333-3',
                        snapshot_applicant_email: 'carlos.soto@example.com',
                        snapshot_applicant_phone: '+56987654321',
                        snapshot_applicant_profession: 'Ingeniero',
                        snapshot_applicant_monthly_income_clp: 4500000,
                        snapshot_applicant_age: 35,
                        snapshot_applicant_nationality: 'Chilena',
                        snapshot_applicant_marital_status: 'soltero',
                        snapshot_applicant_address_street: 'Los Leones',
                        snapshot_applicant_address_number: '567',
                        snapshot_applicant_address_commune: 'Providencia',
                        snapshot_applicant_address_region: 'Metropolitana'
                      });

                      // Insertar contrato
                      await supabase.from('rental_contracts').upsert({
                        id: '550e8400-e29b-41d4-a716-446655440006',
                        application_id: '550e8400-e29b-41d4-a716-446655440005',
                        status: 'approved',
                        contract_content: {
                          header: {
                            title: 'Encabezado del Contrato',
                            content: '## CONTRATO DE ARRENDAMIENTO RESIDENCIAL\n\nEn Santiago de Chile, a 29 de septiembre de 2025, comparecen:\n\n**Carolina Andrea Soto Rojas**, con RUT N° 15.123.456-7, domiciliada en Eliodoro Yáñez 1890, Providencia, en adelante "el Arrendador"; y\n\n**Carlos Alberto Soto Vega**, con RUT N° 33.333.333-3, domiciliado en Los Leones 567 Depto. 56, Providencia, en adelante "el Arrendatario".\n\nAmbas partes convienen en celebrar el presente contrato de arrendamiento residencial, el que se regirá por las siguientes cláusulas.'
                          },
                          conditions: {
                            title: 'Condiciones del Arriendo',
                            content: '## CLÁUSULA SEGUNDA: OBJETO\n\nEl Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en Suecia 1234 Casa A, Providencia, con ROL de avalúo N° [ROL no especificado].\n\nEl inmueble arrendado se destina exclusivamente para fines residenciales, para la habitación del Arrendatario y su familia.\n\nSe deja constancia que el inmueble no incluye estacionamiento ni bodega.\n\n## CLÁUSULA TERCERA: RENTA\n\nLa renta mensual de arrendamiento será la suma de $1.600.000 (un millón seiscientos mil pesos chilenos).\n\nEl Arrendatario se obliga a pagar dicha suma por adelantado dentro de los primeros cinco (5) días de cada mes, en la forma y lugar que las partes convengan o determinen posteriormente.\n\n## CLÁUSULA CUARTA: DURACIÓN\n\nEl presente contrato tendrá una duración de 12 meses a contar del 1 de octubre de 2025, pudiendo renovarse previo acuerdo expreso entre las partes.\n\nEl Arrendatario podrá poner término al contrato notificando al Arrendador con al menos 30 días de anticipación, en conformidad con la legislación vigente.\n\nAsimismo, el Arrendador podrá poner término conforme a los plazos y causales legales aplicables.'
                          },
                          obligations: {
                            title: 'Obligaciones de las Partes',
                            content: '## CLÁUSULA QUINTA: GARANTÍA, AVAL Y CODEUDOR SOLIDARIO\n\nPara garantía del fiel cumplimiento de todas las obligaciones emanadas del presente contrato, comparece y se constituye en aval y codeudor solidario:\n\n**Don Rodolfo Rrrrrrrr Mmmmmm**, con RUT N° 44.444.444-4, domiciliado en Irarrazaval 5350 Depto. 22, Ñuñoa, quien responde solidariamente con el Arrendatario por todas las obligaciones presentes y futuras derivadas del presente contrato.\n\n## OBLIGACIONES DEL ARRENDATARIO\n- Pagar puntualmente la renta y gastos comunes\n- Mantener el inmueble en buen estado\n- Permitir inspecciones con previo aviso\n- No subarrendar sin autorización\n\n## OBLIGACIONES DEL ARRENDADOR\n- Entregar el inmueble en perfectas condiciones\n- Realizar reparaciones necesarias\n- Respetar el uso pacífico del inmueble\n- Cumplir con las normativas vigentes'
                          },
                          termination: {
                            title: 'Terminación del Contrato',
                            content: '## CLÁUSULA DE TERMINACIÓN\n\nEl contrato podrá terminarse por:\n\n1. **Mutuo acuerdo** entre las partes\n2. **Incumplimiento** de cualquiera de las obligaciones contractuales\n3. **Necesidades propias** del arrendador (con preaviso de 90 días)\n4. **Pérdida del empleo** del arrendatario (con preaviso de 60 días)\n\nEn caso de terminación anticipada, se aplicarán las multas correspondientes según la legislación vigente.'
                          },
                          signatures: {
                            title: 'Firmas Digitales',
                            content: '## ESPACIOS PARA FIRMAS\n\nFirmado en dos ejemplares de un mismo tenor y a un solo efecto, en Santiago de Chile a 29 de septiembre de 2025.\n\n_____________________________\nCarolina Andrea Soto Rojas\nRUT: 15.123.456-7\nARRENDADOR\n\n_____________________________\nCarlos Alberto Soto Vega\nRUT: 33.333.333-3\nARRENDATARIO\n\n_____________________________\nRodolfo Rrrrrrrr Mmmmmm\nRUT: 44.444.444-4\nAVAL Y CODEUDOR SOLIDARIO'
                          }
                        },
                        created_by: '550e8400-e29b-41d4-a716-446655440001',
                        approved_by: '550e8400-e29b-41d4-a716-446655440001',
                        notes: 'Contrato generado automáticamente para demostración del sistema de contratos.'
                      });

                      // Recargar contratos
                      await loadContracts();

                      alert('✅ Datos de ejemplo insertados correctamente. Ahora puedes ver el contrato en la lista.');
                    } catch (error) {
                      console.error('Error seeding data:', error);
                      alert('❌ Error al poblar datos de ejemplo: ' + (error as Error).message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                variant="secondary"
                className="flex items-center space-x-2"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? 'Poblando...' : 'Poblar Datos de Ejemplo'}</span>
              </CustomButton>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-medium text-gray-900 mb-2">Contrato de Arriendo Residencial</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Arrendador:</strong> Carolina Andrea Soto Rojas (RUT: 15.123.456-7)</p>
              <p><strong>Arrendatario:</strong> Carlos Alberto Soto Vega (RUT: 33.333.333-3)</p>
              <p><strong>Aval:</strong> Rodolfo Rrrrrrrr Mmmmmm (RUT: 44.444.444-4)</p>
              <p><strong>Propiedad:</strong> Suecia 1234 Casa A, Providencia</p>
              <p><strong>Renta mensual:</strong> $1.600.000 CLP</p>
            </div>
          </div>
        </div>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {contracts.length === 0 ? 'No tienes contratos aún' : 'No se encontraron contratos'}
            </h3>
            <p className="text-gray-500">
              {contracts.length === 0
                ? 'Los contratos se crearán automáticamente cuando apruebes postulantes con condiciones específicas.'
                : 'Intenta ajustar los filtros de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewContract(contract)}
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                      {getStatusIcon(contract.status)}
                      <span>{getStatusText(contract.status)}</span>
                    </div>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Property Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-gray-500" />
                      {contract.applications.properties.title}
                    </h3>
                    <p className="text-sm text-gray-600">{contract.applications.properties.address}</p>
                  </div>

                  {/* Applicant Info */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Arrendatario
                    </h4>
                    <p className="text-sm text-gray-600">
                      {contract.applications.snapshot_applicant_first_name} {contract.applications.snapshot_applicant_paternal_last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contract.applications.snapshot_applicant_email}</p>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Creado: {new Date(contract.created_at).toLocaleDateString()}</p>
                    {contract.approved_at && (
                      <p>Aprobado: {new Date(contract.approved_at).toLocaleDateString()}</p>
                    )}
                    {contract.sent_to_signature_at && (
                      <p>Enviado a firma: {new Date(contract.sent_to_signature_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-4 border-t">
                    <CustomButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewContract(contract);
                      }}
                      variant="outline"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Detalles</span>
                    </CustomButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contract Approval Workflow Modal */}
        {showWorkflow && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <ContractApprovalWorkflow
                contractId={selectedContract.id}
                onContractUpdated={loadContracts}
                onClose={() => {
                  setShowWorkflow(false);
                  setSelectedContract(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagementPage;
