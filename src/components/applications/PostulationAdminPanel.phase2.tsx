/**
 * PostulationAdminPanel.phase2.tsx
 *
 * FASE 2: Componente con lazy loading, useReducer, hooks especializados y optimizaciones de performance
 *
 * Incluye:
 * - Lazy loading de pestañas con skeletons
 * - useReducer para estado complejo
 * - Hooks especializados (tabs, performance, modals)
 * - Componentes memoizados
 * - Error boundaries específicos
 */

import React, { useMemo, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Custom hooks (Phase 2)
import { usePostulationData } from '../../hooks/usePostulationData';
import { useContractActions } from '../../hooks/useContractActions';
import { useDocumentManagement } from '../../hooks/useDocumentManagement';
import { usePostulationPanel } from '../../hooks/usePostulationPanel';
import { useTabNavigation } from '../../hooks/useTabNavigation';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

// Lazy loaded tab components
import {
  PostulationInfoTab,
  PostulationInfoTabSkeleton
} from './tabs/PostulationInfoTab.lazy';
import {
  PostulationDocumentsTab,
  PostulationDocumentsTabSkeleton
} from './tabs/PostulationDocumentsTab.lazy';
import {
  PostulationMessagesTab,
  PostulationMessagesTabSkeleton
} from './tabs/PostulationMessagesTab.lazy';

// Memoized components
import { MemoizedTabNavigation } from './memoized/MemoizedTabNavigation';
import { MemoizedAdminActionsPanel } from './memoized/MemoizedAdminActionsPanel';

// Error boundary
import { PostulationErrorBoundary } from '../common/misc/PostulationErrorBoundary';

// Lazy tab wrapper
import { createLazyTab } from './tabs/LazyTab';

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

export const PostulationAdminPanelPhase2: React.FC = () => {
  const { id: applicationId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Performance optimization hook
  const {
    trackRender,
    scrollState,
    scrollToTop
  } = usePerformanceOptimization({
    enableScrollTracking: true,
    enablePerformanceTracking: true,
    scrollThrottleMs: 16
  });

  // Track render for performance monitoring
  React.useEffect(() => {
    trackRender();
  });

  // Custom hooks for data management
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

  // Complex state management with useReducer
  const {
    state: panelState,
    setActiveTab,
    tabs: panelActions,
    errors: errorActions,
    loading: loadingActions
  } = usePostulationPanel('info');

  // Tab navigation with accessibility
  const tabItems = useMemo(() => [
    { id: 'info', label: 'Información y Acciones', icon: () => <span>📄</span> },
    {
      id: 'documents',
      label: 'Documentos',
      icon: () => <span>📎</span>,
      count: Object.values(applicantsDocuments).flat().length + Object.values(guarantorsDocuments).flat().length
    },
    { id: 'messages', label: 'Mensajes', icon: () => <span>💬</span> }
  ], [applicantsDocuments, guarantorsDocuments]);

  const {
    activeTab,
    setActiveTab: setTabNavigation,
    tabs: tabNavigationProps
  } = useTabNavigation({
    tabs: tabItems,
    onTabChange: setActiveTab,
    enableKeyboardNavigation: true,
    enableHistory: true
  });

  // Synchronize tab states
  React.useEffect(() => {
    if (panelState.activeTab !== activeTab) {
      setTabNavigation(panelState.activeTab as any);
    }
  }, [panelState.activeTab, activeTab, setTabNavigation]);

  // Memoized navigation handler
  const handleNavigateBack = useCallback(() => {
    navigate('/portfolio');
  }, [navigate]);

  // Memoized tab content renderer
  const renderTabContent = useCallback(() => {
    const tabContentMap = {
      info: createLazyTab({
        tabComponent: PostulationInfoTab,
        skeletonComponent: PostulationInfoTabSkeleton,
        props: {
          postulation,
          contractData,
          applicantsDocuments,
          guarantorsDocuments,
          showContractForm,
          onToggleContractForm: setShowContractForm,
          onDownloadContract: handleDownloadContract,
          onViewContract: handleViewContract,
          onEditContract: handleEditContract,
          onCancelContract: handleCancelContract,
          onOpenContractModal: handleOpenContractModal,
          onSaveContract: saveContract,
          onRefreshContract: refreshContractData,
          contractManuallyGenerated: false,
          isDownloadingContract,
          isViewingContract,
          isCancellingContract,
          loadingContract,
          savingContract
        },
        postulationId: applicationId,
        tabKey: 'info'
      }),

      documents: createLazyTab({
        tabComponent: PostulationDocumentsTab,
        skeletonComponent: PostulationDocumentsTabSkeleton,
        props: {
          applicationId: postulation?.id || '',
          applicants: postulation?.applicants || [],
          guarantors: postulation?.guarantors || [],
          applicantsDocuments,
          guarantorsDocuments,
          onDocumentsChange: loadDocuments
        },
        postulationId: applicationId,
        tabKey: 'documents'
      }),

      messages: createLazyTab({
        tabComponent: PostulationMessagesTab,
        skeletonComponent: PostulationMessagesTabSkeleton,
        props: {
          applicationId: postulation?.id || ''
        },
        postulationId: applicationId,
        tabKey: 'messages'
      })
    };

    return tabContentMap[activeTab as keyof typeof tabContentMap] || null;
  }, [
    activeTab,
    postulation,
    contractData,
    applicantsDocuments,
    guarantorsDocuments,
    showContractForm,
    setShowContractForm,
    handleDownloadContract,
    handleViewContract,
    handleEditContract,
    handleCancelContract,
    handleOpenContractModal,
    saveContract,
    refreshContractData,
    isDownloadingContract,
    isViewingContract,
    isCancellingContract,
    loadingContract,
    savingContract,
    loadDocuments,
    applicationId
  ]);

  // Memoized computed values
  const hasContractConditions = useMemo(() =>
    postulation?.has_contract_conditions || !!contractData,
    [postulation?.has_contract_conditions, contractData]
  );

  const totalDocuments = useMemo(() =>
    Object.values(applicantsDocuments).flat().length +
    Object.values(guarantorsDocuments).flat().length,
    [applicantsDocuments, guarantorsDocuments]
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bold text-xl">🚀 CARGANDO POSTULACIÓN (FASE 2)</p>
          <p className="mt-2 text-gray-500">Lazy loading + Optimizaciones activas</p>
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
            onClick={handleNavigateBack}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <PostulationErrorBoundary postulationId={applicationId}>
      <div className="min-h-screen bg-gray-50">

        {/* Admin Panel Indicator */}
        <div className="h-1 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600"></div>

        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-16 flex items-center justify-between">
              <button
                onClick={handleNavigateBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Volver al Portfolio</span>
              </button>
              <div className="text-sm text-gray-500">
                Postulación #{postulation.id.slice(-8)} | FASE 2 🚀
              </div>
            </div>

            {/* Memoized Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 pb-4">
              <MemoizedTabNavigation
                {...tabNavigationProps}
                tabs={tabItems}
              />
            </div>
          </div>
        </div>

        {/* Main Content with Lazy Loading */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {activeTab === 'info' ? (
            <div className="space-y-8">
              {/* Lazy loaded info tab content */}
              <Suspense fallback={<PostulationInfoTabSkeleton />}>
                <PostulationInfoTab
                  postulation={postulation}
                  contractData={contractData}
                  applicantsDocuments={applicantsDocuments}
                  guarantorsDocuments={guarantorsDocuments}
                  showContractForm={showContractForm}
                  onToggleContractForm={setShowContractForm}
                  onDownloadContract={handleDownloadContract}
                  onViewContract={handleViewContract}
                  onEditContract={handleEditContract}
                  onCancelContract={handleCancelContract}
                  onOpenContractModal={handleOpenContractModal}
                  onSaveContract={saveContract}
                  onRefreshContract={refreshContractData}
                  contractManuallyGenerated={false}
                  isDownloadingContract={isDownloadingContract}
                  isViewingContract={isViewingContract}
                  isCancellingContract={isCancellingContract}
                  loadingContract={loadingContract}
                  savingContract={savingContract}
                />
              </Suspense>

              {/* Memoized Admin Actions Panel */}
              <MemoizedAdminActionsPanel
                postulation={postulation}
                hasContractConditions={hasContractConditions}
                onShowContractForm={setShowContractForm}
                onOpenContractModal={handleOpenContractModal}
                onSetContractManuallyGenerated={setContractManuallyGenerated}
              />
            </div>
          ) : (
            renderTabContent()
          )}
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

        {/* Scroll to top button */}
        {scrollState.showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
            aria-label="Volver arriba"
          >
            ↑
          </button>
        )}
      </div>
    </PostulationErrorBoundary>
  );
};

// Temporary components (would be imported from actual modules)
const ContractModal: React.FC<any> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Contrato (FASE 2)</h2>
          <p className="text-gray-600 mb-4">Componente de contrato optimizado con lazy loading</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const RentalContractConditionsForm: React.FC<any> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Condiciones Contractuales (FASE 2)</h2>
        <p className="text-gray-600 mb-4">Formulario optimizado con React.memo</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
);

export default PostulationAdminPanelPhase2;
