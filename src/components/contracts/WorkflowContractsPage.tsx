import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';
import { HTMLCanvasViewer } from '../common/HTMLCanvasViewer';

interface WorkflowOutput {
  id: string;
  user_id: string;
  property_id?: string;
  workflow_type: string;
  output_storage_path: string;
  file_size_bytes?: number;
  created_at: string;
  metadata?: {
    contract_id?: string;
    application_id?: string;
    source?: string;
    received_at?: string;
  };
}

const WorkflowContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<WorkflowOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<WorkflowOutput | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [contractHtml, setContractHtml] = useState<string>('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('workflow_outputs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContracts(data || []);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      alert(`Error al cargar contratos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const viewContract = async (contract: WorkflowOutput) => {
    try {
      setSelectedContract(contract);
      setShowViewer(true);

      // Descargar el HTML desde Storage
      const { data, error } = await supabase.storage
        .from('workflow-outputs')
        .download(contract.output_storage_path);

      if (error) throw error;

      const htmlText = await data.text();
      setContractHtml(htmlText);
    } catch (error: any) {
      console.error('Error loading contract HTML:', error);
      alert(`Error al cargar el contrato: ${error.message}`);
    }
  };

  const downloadContract = async (contract: WorkflowOutput) => {
    try {
      const { data, error } = await supabase.storage
        .from('workflow-outputs')
        .download(contract.output_storage_path);

      if (error) throw error;

      const htmlText = await data.text();
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${contract.workflow_type}-${contract.id.slice(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      alert(`Error al descargar el contrato: ${error.message}`);
    }
  };

  const printContract = () => {
    if (contractHtml) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(contractHtml);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.workflow_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' ||
                         (filterType === 'n8n' && contract.metadata?.source === 'n8n_complete') ||
                         (filterType === 'local' && (!contract.metadata?.source || contract.metadata.source !== 'n8n_complete'));

    return matchesSearch && matchesFilter;
  });

  const getContractType = (contract: WorkflowOutput) => {
    if (contract.metadata?.source === 'n8n_complete') {
      return { type: 'N8N Complete', color: 'bg-green-100 text-green-800', icon: Zap };
    }
    return { type: 'Local', color: 'bg-blue-100 text-blue-800', icon: FileText };
  };

  const getWorkflowTypeDisplay = (workflowType: string) => {
    const types: Record<string, string> = {
      'contrato_arriendo': 'Contrato de Arriendo',
      'contrato_venta': 'Contrato de Venta',
      'contrato_n8n': 'Contrato N8N',
      'informe_mensual_propiedad': 'Informe Mensual',
      'reporte_financiero': 'Reporte Financiero',
      'analisis_mercado': 'Análisis de Mercado'
    };
    return types[workflowType] || workflowType;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando contratos workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Contratos Workflow
              </h1>
              <p className="text-gray-600 mt-1">
                Documentos generados por workflows y webhooks externos
              </p>
            </div>
            <CustomButton
              onClick={loadContracts}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </CustomButton>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por tipo o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los contratos</option>
                  <option value="n8n">Solo N8N Direct</option>
                  <option value="local">Solo Locales</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de contratos */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron contratos
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Los contratos generados por workflows aparecerán aquí'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredContracts.map((contract) => {
                const contractType = getContractType(contract);

                return (
                  <div key={contract.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getWorkflowTypeDisplay(contract.workflow_type)}
                          </h3>
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${contractType.color}`}>
                            <contractType.icon className="h-4 w-4" />
                            <span>{contractType.type}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">ID:</span> {contract.id.slice(0, 8)}...
                          </div>
                          <div>
                            <span className="font-medium">Tamaño:</span> {contract.file_size_bytes ? `${(contract.file_size_bytes / 1024).toFixed(1)} KB` : 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Fecha:</span> {new Date(contract.created_at).toLocaleDateString('es-CL')}
                          </div>
                        </div>

                        {contract.metadata?.contract_id && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Contrato relacionado:</span> {contract.metadata.contract_id}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 ml-6">
                        <CustomButton
                          onClick={() => viewContract(contract)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver</span>
                        </CustomButton>

                        <CustomButton
                          onClick={() => downloadContract(contract)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Descargar</span>
                        </CustomButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal del visualizador de contratos */}
        {showViewer && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
            <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white rounded-lg">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <div>
                  <h2 className="text-xl font-bold flex items-center">
                    <Eye className="h-6 w-6 mr-2" />
                    {getWorkflowTypeDisplay(selectedContract.workflow_type)}
                  </h2>
                  <p className="text-green-100 mt-1">
                    ID: {selectedContract.id.slice(0, 8)}... • {new Date(selectedContract.created_at).toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <CustomButton
                    onClick={printContract}
                    variant="outline"
                    size="sm"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
                  >
                    🖨️ Imprimir
                  </CustomButton>
                  <button
                    onClick={() => setShowViewer(false)}
                    className="text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[85vh] overflow-y-auto">
                <div className="border rounded-lg overflow-hidden">
                  <HTMLCanvasViewer htmlString={contractHtml} />
                </div>
              </div>
              <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                <CustomButton
                  onClick={() => setShowViewer(false)}
                  variant="outline"
                >
                  Cerrar
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowContractsPage;
