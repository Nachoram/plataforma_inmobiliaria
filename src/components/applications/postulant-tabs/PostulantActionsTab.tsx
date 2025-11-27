/**
 * PostulantActionsTab.tsx - Acciones Disponibles para Postulantes
 *
 * Componente que centraliza todas las acciones administrativas
 * disponibles para los postulantes en su panel de administración.
 */

import React from 'react';
import {
  Eye,
  FileText,
  TrendingUp,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContractData {
  id?: string;
  signed_contract_url?: string;
  contract_html?: string;
}

interface ApplicationData {
  id: string;
  status: string;
  properties?: any;
}

interface PostulantActionsTabProps {
  application: ApplicationData;
  contractData: ContractData | null;
  onViewContract: () => void;
  onDownloadContract: () => void;
  isDownloadingContract?: boolean;
  isViewingContract?: boolean;
}

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulantActionsTab: React.FC<PostulantActionsTabProps> = ({
  application,
  contractData,
  onViewContract,
  onDownloadContract,
  isDownloadingContract = false,
  isViewingContract = false
}) => {
  const navigate = useNavigate();

  const canViewContract = () => {
    return application?.status === 'aprobada' || application?.status === 'finalizada' || application?.status === 'modificada';
  };

  return (
    <div className="space-y-8">
      {/* Acciones Administrativas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 text-purple-600 mr-2" />
          Acciones Disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onViewContract}
            disabled={!contractData || isViewingContract}
            className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              !contractData
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            }`}
            title={!contractData ? 'No hay contrato disponible' : 'Ver contrato generado'}
          >
            <Eye className="h-5 w-5" />
            <span>{isViewingContract ? 'Cargando...' : 'Ver Contrato'}</span>
          </button>

          <button
            onClick={onDownloadContract}
            disabled={!contractData || isDownloadingContract}
            className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              !contractData
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
            }`}
            title={!contractData ? 'No hay contrato disponible' : 'Descargar contrato generado'}
          >
            <FileText className="h-5 w-5" />
            <span>{isDownloadingContract ? 'Descargando...' : 'Descargar Contrato'}</span>
          </button>

          <button
            onClick={() => {
              // TODO: Implement commercial report generation
              console.log('🔄 Generando informe comercial...');
              // toast.info('Funcionalidad de generar informe comercial en desarrollo');
            }}
            className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
            title="Generar un informe comercial detallado"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Informe Comercial</span>
          </button>

          <button
            onClick={() => navigate('/my-applications')}
            className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            title="Volver a la lista de postulaciones"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver a Postulaciones</span>
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Estado de tu Postulación
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Estado actual: <span className="font-semibold capitalize">{application.status.replace('_', ' ')}</span>
              </p>
              {canViewContract() && contractData && (
                <p className="mt-1">
                  ✅ Tienes acceso al contrato generado para esta propiedad.
                </p>
              )}
              {!canViewContract() && (
                <p className="mt-1">
                  ⏳ El contrato estará disponible una vez que tu postulación sea aprobada.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
