/**
 * PostulationAdminPanel.tsx - VERSION REFACTORIZADA
 *
 * Versión mejorada del panel de administración de postulaciones usando:
 * - Custom hooks para separación de responsabilidades
 * - Componentes más pequeños y reutilizables
 * - Mejor manejo de errores
 * - Arquitectura más mantenible
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Paperclip, MessageSquare, ArrowLeft } from 'lucide-react';

// Import custom hooks
import { usePostulationData } from '../../hooks/usePostulationData';
import { useContractActions } from '../../hooks/useContractActions';
import { useDocumentManagement } from '../../hooks/useDocumentManagement';

// Import components
import { PostulationInfoTab } from './PostulationInfoTab';
import { PostulationDocumentsTab } from './PostulationDocumentsTab';
import { PostulationMessagesTab } from './PostulationMessagesTab';
import { AdminActionsPanel } from './admin-actions/AdminActionsPanel';
import ContractSummaryCard from '../dashboard/ContractSummaryCard';
import RentalContractConditionsForm from '../dashboard/RentalContractConditionsForm';

// Import error boundary
import { PostulationErrorBoundary } from '../common/misc/PostulationErrorBoundary';

// Interfaces
interface ContractFormData {
  start_date: string;
  validity_period_months: number;
  final_amount: number;
  final_amount_currency: 'clp' | 'uf';
  guarantee_amount: number;
  guarantee_amount_currency: 'clp' | 'uf';
  has_dicom_clause: boolean;
  has_auto_renewal_clause: boolean;
  tenant_email: string;
  landlord_email: string;
  account_holder_name: string;
  account_number: string;
  account_bank: string;
  account_type: string;
  account_holder_rut?: string;
  has_brokerage_commission: boolean;
  broker_name?: string;
  broker_amount?: number;
  broker_rut?: string;
  allows_pets: boolean;
  is_furnished: boolean;
}

export const PostulationAdminPanel: React.FC = () => {
  const { id: applicationId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados locales para UI
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'messages'>('info');

  // Custom hooks para lógica de negocio
  const {
    postulation,
    contractData,
    loading,
    error,
    hasRealScore,
    refetch
  } = usePostulationData(applicationId);

  const {
    showContractForm,
    setShowContractForm,
    showContractModal,
    setShowContractModal,
    setContractManuallyGenerated,
    contractModalKey,
    handleOpenContractModal,
    handleViewContract,
    handleDownloadContract,
    handleEditContract,
    handleCancelContract,
    saveContract,
    fetchContractData,
    refreshContractData,
    loadingContract,
    savingContract,
    isDownloadingContract,
    isViewingContract,
    isCancellingContract
  } = useContractActions(applicationId, postulation);

  const {
    documentsLoading,
    applicantsDocuments,
    guarantorsDocuments,
    loadDocuments,
    setApplicantsDocuments,
    setGuarantorsDocuments
  } = useDocumentManagement(applicationId);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bold text-xl text-red-600">🔴 CARGANDO POSTULACIÓN</p>
          <p className="mt-2 text-gray-500">Cargando datos de la postulación...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Portfolio
          </button>
        </div>
      </div>
    );
  }

  // No postulation found
  if (!postulation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Postulación no encontrada</h2>
          <p className="text-gray-600">La postulación que buscas no existe o ha sido eliminada.</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Portfolio
          </button>
        </div>
      </div>
    );
  }

  // Determinar si hay condiciones contractuales
  const hasContractConditions = postulation.has_contract_conditions || !!contractData;

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-8">
            {/* Información de la Postulación */}
            <PostulationInfoTab
              postulation={postulation}
              contractData={contractData}
              applicantsDocuments={applicantsDocuments}
              guarantorsDocuments={guarantorsDocuments}
              showContractForm={showContractForm}
              onToggleContractForm={() => setShowContractForm(!showContractForm)}
              onDownloadContract={handleDownloadContract}
              onViewContract={handleViewContract}
              onEditContract={handleEditContract}
              onCancelContract={handleCancelContract}
              onOpenContractModal={handleOpenContractModal}
              onSaveContract={saveContract}
              onRefreshContract={refreshContractData}
              contractManuallyGenerated={false} // TODO: Implementar estado
              isDownloadingContract={isDownloadingContract}
              isViewingContract={isViewingContract}
              isCancellingContract={isCancellingContract}
              loadingContract={loadingContract}
              savingContract={savingContract}
            />

            {/* Acciones Administrativas */}
            <AdminActionsPanel
              postulation={postulation}
              hasContractConditions={hasContractConditions}
              onShowContractForm={setShowContractForm}
              onOpenContractModal={handleOpenContractModal}
              onSetContractManuallyGenerated={setContractManuallyGenerated}
            />
          </div>
        );

      case 'documents':
        return (
          <PostulationDocumentsTab
            applicationId={postulation.id}
            applicants={postulation.applicants}
            guarantors={postulation.guarantors}
            applicantsDocuments={applicantsDocuments}
            guarantorsDocuments={guarantorsDocuments}
            onDocumentsChange={loadDocuments}
          />
        );

      case 'messages':
        return (
          <PostulationMessagesTab
            applicationId={postulation.id}
          />
        );

      default:
        return null;
    }
  };

  // Calcular total de documentos para el contador
  const totalDocuments = Object.values(applicantsDocuments).flat().length +
                        Object.values(guarantorsDocuments).flat().length;

  return (
    <PostulationErrorBoundary postulationId={applicationId}>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Panel Indicator */}
        <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-700"></div>

        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-16 flex items-center justify-between">
              <button
                onClick={() => navigate('/portfolio')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Volver al Portfolio</span>
              </button>
              <div className="text-sm text-gray-500">
                Postulación #{postulation.id.slice(-8)}
              </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex space-x-8 overflow-x-auto">
                {[
                  { id: 'info', label: 'Información y Acciones', icon: FileText },
                  { id: 'documents', label: 'Documentos', icon: Paperclip, count: totalDocuments },
                  { id: 'messages', label: 'Mensajes', icon: MessageSquare }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {tab.label}
                    {tab.count && tab.count > 0 && (
                      <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {renderTabContent()}
        </main>

        {/* Modals */}
        {showContractModal && (
          <ContractModal
            key={contractModalKey}
            isOpen={showContractModal}
            onClose={() => setShowContractModal(false)}
            onSave={saveContract}
            initialData={contractData}
            isSaving={savingContract}
            mode="create"
          />
        )}

        {showContractForm && (
          <RentalContractConditionsForm
            applicationId={applicationId!}
            onClose={() => setShowContractForm(false)}
            onSuccess={() => {
              setShowContractForm(false);
              refreshContractData();
            }}
          />
        )}
      </div>
    </PostulationErrorBoundary>
  );
};

// Componente Modal para Contrato (simplificado, puede ser extraído)
const ContractModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContractFormData) => Promise<void>;
  initialData?: any;
  isSaving: boolean;
  mode: 'create' | 'edit';
}> = ({ isOpen, onClose, onSave, initialData, isSaving, mode }) => {
  // Implementación simplificada - en producción usar un componente más completo
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {mode === 'create' ? 'Crear Contrato' : 'Editar Contrato'}
          </h2>
          {/* Formulario simplificado */}
          <p className="text-gray-600 mb-4">
            Formulario de contrato - Implementación pendiente
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostulationAdminPanel;


