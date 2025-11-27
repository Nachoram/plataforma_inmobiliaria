/**
 * PostulantAdminPanel.tsx - Panel de Administración para Postulantes
 *
 * Componente principal refactorizado siguiendo el patrón de PostulationAdminPanel.
 * Arquitectura modular con componentes separados, lazy loading y hook personalizado.
 */

import React, { useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Paperclip,
  MessageSquare,
  Zap
} from 'lucide-react';

// Core dependencies
import { useAuth } from '../../hooks/useAuth';

// Custom hooks
import { usePostulantData } from '../../hooks/usePostulantData';

// Lazy load tab components for better performance
const PostulantInfoTab = React.lazy(() => import('./postulant-tabs/PostulantInfoTab').then(module => ({ default: module.PostulantInfoTab })));
const PostulantDocumentsTab = React.lazy(() => import('./postulant-tabs/PostulantDocumentsTab').then(module => ({ default: module.PostulantDocumentsTab })));
const PostulantMessagesTab = React.lazy(() => import('./postulant-tabs/PostulantMessagesTab').then(module => ({ default: module.PostulantMessagesTab })));
const PostulantActionsTab = React.lazy(() => import('./postulant-tabs/PostulantActionsTab').then(module => ({ default: module.PostulantActionsTab })));

// Modal components
import { ContractModal } from './postulant-modals/ContractModal';

// Types
type TabType = 'info' | 'documents' | 'messages' | 'actions';

// Loading component for lazy loaded tabs
const TabLoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600 text-sm">Cargando pestaña...</span>
  </div>
);

export const PostulantAdminPanel: React.FC = () => {
  console.log('🏠 [PostulantAdminPanel] Component mounted');

  // URL parameters and navigation
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('📋 [PostulantAdminPanel] applicationId:', applicationId);
  console.log('👤 [PostulantAdminPanel] user:', user?.id);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // Modal States
  const [showContractModal, setShowContractModal] = useState(false);

  // Contract state
  const [savingContract, setSavingContract] = useState(false);

  // ========================================================================
  // CUSTOM HOOK FOR DATA MANAGEMENT
  // ========================================================================

  const {
    // Data
    postulation: application,
    messages,
    documents,
    contractData,

    // Loading states
    loading,
    loadingMessages,
    loadingDocuments,
    loadingContract,

    // Error states
    error,

    // Statistics
    unreadMessages,
    pendingRequests,

    // Actions
    refreshData,
    refreshMessages,
    refreshDocuments,
    refreshContract
  } = usePostulantData(applicationId, user);

  // ========================================================================
  // CONTRACT MANAGEMENT FUNCTIONS
  // ========================================================================

  const handleViewContract = async () => {
    if (!contractData?.signed_contract_url && !contractData?.contract_html) {
      console.warn('No hay archivo de contrato disponible para visualizar');
      return;
    }

    console.log('👁️ Viewing contract...');
    // Contract viewing logic would go here
  };

  const handleDownloadContract = async () => {
    if (!contractData?.id) {
      console.warn('No hay contrato disponible para descargar');
      return;
    }

    setSavingContract(true);
    console.log('📥 Downloading contract...');
    // Contract download logic would go here
    setTimeout(() => setSavingContract(false), 2000); // Mock delay
  };

  const saveContract = async (data: any) => {
    console.log('💾 Saving contract...', data);
    setSavingContract(true);
    // Contract saving logic would go here
    setTimeout(() => {
      setSavingContract(false);
      setShowContractModal(false);
    }, 2000); // Mock delay
  };

  // ========================================================================
  // TAB CONTENT RENDERER
  // ========================================================================

  const renderTabContent = () => {
    console.log('🎯 renderTabContent: Renderizando pestaña:', activeTab);

    switch (activeTab) {
      case 'info':
        return (
          <Suspense fallback={<TabLoadingSpinner />}>
            <PostulantInfoTab
              postulation={application}
              contractData={contractData}
              applicantsDocuments={[]}
              guarantorsDocuments={[]}
              showContractForm={false}
              onToggleContractForm={() => {}}
              onDownloadContract={handleDownloadContract}
              onViewContract={handleViewContract}
              onEditContract={() => setShowContractModal(true)}
              onCancelContract={() => {}}
              onOpenContractModal={() => setShowContractModal(true)}
              onSaveContract={saveContract}
              onRefreshContract={refreshContract}
              contractManuallyGenerated={false}
              isDownloadingContract={false}
              isViewingContract={false}
              isCancellingContract={false}
              loadingContract={loadingContract}
              savingContract={savingContract}
            />
          </Suspense>
        );
      case 'documents':
        return (
          <Suspense fallback={<TabLoadingSpinner />}>
            <PostulantDocumentsTab
              applicationId={application?.id || ''}
              postulants={application?.application_applicants || []}
              guarantors={application?.application_guarantors || []}
              property={application?.properties}
              documents={documents}
              onDocumentUploaded={() => refreshDocuments()}
              onDocumentDeleted={() => refreshDocuments()}
            />
          </Suspense>
        );
      case 'messages':
        return (
          <Suspense fallback={<TabLoadingSpinner />}>
            <PostulantMessagesTab
              messages={messages}
              application={application}
              onRefresh={refreshMessages}
            />
          </Suspense>
        );
      case 'actions':
        return (
          <Suspense fallback={<TabLoadingSpinner />}>
            <PostulantActionsTab
              application={application}
              contractData={contractData}
              onViewContract={handleViewContract}
              onDownloadContract={handleDownloadContract}
              isDownloadingContract={false}
              isViewingContract={false}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  // ========================================================================
  // LOADING & ERROR STATES
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/my-applications')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver a Mis Postulaciones
          </button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Postulación no encontrada</h2>
          <p className="text-gray-600">La postulación que buscas no existe o ha sido eliminada.</p>
          <button
            onClick={() => navigate('/my-applications')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver a Mis Postulaciones
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  const tabs = [
    { id: 'info', label: 'Información', icon: FileText },
    { id: 'documents', label: 'Documentos', icon: Paperclip, count: documents.length },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, count: unreadMessages },
    { id: 'actions', label: 'Acciones', icon: Zap }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Panel Indicator */}
      <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-700"></div>

      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <button
              onClick={() => navigate('/my-applications')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Volver a Mis Postulaciones</span>
            </button>
            <div className="text-sm text-gray-500">
              Postulación #{application.id.slice(-8)}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {renderTabContent()}
      </main>

      {/* Modals */}
      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onSave={saveContract}
        initialData={contractData}
        isSaving={savingContract}
        mode="edit"
      />
    </div>
  );
};