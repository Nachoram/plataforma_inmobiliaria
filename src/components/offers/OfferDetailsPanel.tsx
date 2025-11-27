import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy, memo } from 'react';
import { FileText, Paperclip, MessageSquare, Zap, ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import { SaleOffer, OfferDocument, OfferCommunication } from './types';
import { supabase } from '../../lib/supabase';
import { useOfferDataCache, useOfferDocumentsCache, useOfferCommunicationsCache } from '../../hooks/useOfferCache';
import { useOfferAuth } from '../../hooks/useOfferAuth';
import { useOfferNotifications } from '../../hooks/useOfferNotifications';
import { useOfferPerformance, usePerformanceTimer } from '../../hooks/useOfferPerformance';
import { TabErrorBoundary, useErrorHandler } from './errorBoundaries/OfferErrorBoundary';
import { useDocumentAuthorization } from '../../hooks/useDocumentAuthorization';
import BuyerOfferHeader from './BuyerOfferHeader';

// Lazy loaded components (SalesOfferDetailView pattern)
const BuyerOfferSummaryTab = lazy(() => import('./tabs/BuyerOfferSummaryTab'));
const OfferDocumentsTab = lazy(() => import('./OfferDocumentsTab'));
const OfferMessagesTab = lazy(() => import('./OfferMessagesTab'));
const OfferActionsTab = lazy(() => import('./OfferActionsTab'));

// ========================================================================
// TIPOS Y INTERFACES
// ========================================================================

export type BuyerTabType = 'info' | 'documents' | 'messages' | 'actions';

export interface BuyerOfferDetailsState {
  offerId: string;
  offer: SaleOffer | null;
  documents: OfferDocument[];
  communications: OfferCommunication[];
  activeTab: BuyerTabType;
  loading: boolean;
  error: string | null;
  currentUserRole: 'buyer' | 'seller' | 'admin';
}

export interface OfferDetailsPanelProps {
  offerId: string;
  onBack: () => void;
}

// ========================================================================
// COMPONENTE HEADER SIMPLIFICADO PARA BUYERS
// ========================================================================

interface BuyerOfferHeaderProps {
  offer: SaleOffer | null;
  activeTab: BuyerTabType;
  buyerTabs: any[];
  onBack: () => void;
  onTabChange: (tab: BuyerTabType) => void;
}

// ========================================================================
// COMPONENTES DE CARGA Y ERROR
// ========================================================================

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar los datos</h3>
    <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Reintentar
    </button>
  </div>
);


// ========================================================================
// COMPONENTE PRINCIPAL: BUYER OFFER DETAILS PANEL (MEMOIZADO)
// ========================================================================

const OfferDetailsPanelComponent: React.FC<OfferDetailsPanelProps> = ({
  offerId,
  onBack
}) => {
  // ========================================================================
  // ESTADO PRINCIPAL SIMPLIFICADO
  // ========================================================================

  const [state, setState] = useState<BuyerOfferDetailsState>({
    offerId,
    offer: null,
    documents: [],
    communications: [],
    activeTab: 'info',
    loading: false,
    error: null,
    currentUserRole: 'buyer'
  });

  // ========================================================================
  // AUTORIZACIÓN DE DOCUMENTOS
  // ========================================================================

  const {
    canViewDocuments: sellerCanViewDocuments,
    canAuthorize: buyerCanAuthorize,
    authorizeUser,
    revokeAuthorization,
    isLoading: authLoading,
    error: authError
  } = useDocumentAuthorization(offerId);

  // ========================================================================
  // CARGA DE DATOS SIMPLIFICADA
  // ========================================================================

  // Función simplificada para cargar datos de ejemplo
  const loadSampleData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Simular carga de datos de oferta
      await new Promise(resolve => setTimeout(resolve, 500));

      const sampleOffer: SaleOffer = {
        id: offerId,
        property_id: 'sample-property-id',
        buyer_id: 'sample-buyer-id',
        status: 'active',
        offer_amount: 150000000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        property: {
          id: 'sample-property-id',
          address_street: 'Calle Ejemplo 123',
          address_number: '123',
          address_commune: 'Providencia',
          address_region: 'Metropolitana',
          price: 180000000,
          property_type: 'departamento',
          description: 'Hermoso departamento con vista a la ciudad'
        }
      };

      const sampleDocuments: OfferDocument[] = [
        {
          id: 'doc-1',
          offer_id: offerId,
          name: 'Contrato de compraventa',
          type: 'contract',
          status: 'pendiente',
          url: '#',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const sampleCommunications: OfferCommunication[] = [
        {
          id: 'comm-1',
          offer_id: offerId,
          message: 'Bienvenido a su proceso de oferta inmobiliaria',
          type: 'system_message',
          created_at: new Date().toISOString()
        }
      ];

      setState(prev => ({
        ...prev,
        offer: sampleOffer,
        documents: sampleDocuments,
        communications: sampleCommunications,
        loading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error cargando datos de muestra',
        loading: false
      }));
    }
  }, [offerId]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadSampleData();
  }, [loadSampleData]);

  // ========================================================================
  // FUNCIONES DE ACCIÓN SIMPLIFICADAS PARA COMPRADORES
  // ========================================================================

  // Función para actualizar el estado de la oferta (simplificada para buyers)
  const updateOfferStatus = useCallback(async (status: SaleOffer['status']) => {
    if (!state.offer) return;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const { error } = await supabase
        .from('property_sale_offers')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (error) throw error;

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        offer: prev.offer ? { ...prev.offer, status } : null,
        loading: false
      }));

      // Mostrar notificación de éxito
      console.log('✅ Estado de oferta actualizado:', status);

    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al actualizar el estado de la oferta',
        loading: false
      }));
    }
  }, [offerId, state.offer]);

  // Función para enviar mensaje (integración con OfferMessagesTab)
  const sendMessage = useCallback(async (message: string) => {
    if (!state.offer || !message.trim()) return;

    try {
      const { data, error } = await supabase
        .from('offer_communications')
        .insert({
          offer_id: offerId,
          message: message.trim(),
          type: 'buyer_message',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setState(prev => ({
        ...prev,
        communications: [...prev.communications, data]
      }));

      console.log('✅ Mensaje enviado');

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al enviar el mensaje',
        loading: false
      }));
    }
  }, [offerId, state.offer]);

  // Función de refresh simplificada
  const handleRefresh = useCallback(() => {
    console.log('🔄 Refrescando datos...');
    loadSampleData();
  }, [loadSampleData]);

  // ========================================================================
  // SISTEMA DE RENDERIZADO CON SUSPENSE
  // ========================================================================

  const buyerTabs = useMemo(() => [
    { id: 'info' as BuyerTabType, label: 'Información', icon: FileText },
    { id: 'documents' as BuyerTabType, label: 'Documentos', icon: Paperclip, badge: state.documents.filter(d => d.status === 'pendiente').length },
    { id: 'messages' as BuyerTabType, label: 'Mensajes', icon: MessageSquare, badge: state.communications.length },
    { id: 'actions' as BuyerTabType, label: 'Acciones', icon: Zap }
  ], [state.documents, state.communications]);

  const commonProps = useMemo(() => ({
    offer: state.offer,
    userRole: state.currentUserRole,
    onRefreshData: handleRefresh
  }), [state.offer, state.currentUserRole, handleRefresh]);

  const renderTabContent = useCallback(() => {
    const tabProps = {
      ...commonProps,
      documents: state.documents,
      communications: state.communications,
      onDocumentsChange: handleRefresh,
      onSendMessage: sendMessage,
      onUpdateOfferStatus: updateOfferStatus
    };

    // Props específicos para documentos con autorización
    const documentTabProps = {
      ...tabProps,
      viewMode: state.currentUserRole === 'seller' && sellerCanViewDocuments ? 'seller' : 'buyer',
      userRole: state.currentUserRole,
      // Información de autorización para compradores
      canAuthorize: buyerCanAuthorize && state.currentUserRole === 'buyer',
      sellerCanViewDocuments,
      onAuthorizeSeller: authorizeUser,
      onRevokeAuthorization: revokeAuthorization
    };

    switch (state.activeTab) {
      case 'info':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <BuyerOfferSummaryTab {...tabProps} />
          </Suspense>
        );
      case 'documents':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <OfferDocumentsTab {...documentTabProps} />
          </Suspense>
        );
      case 'messages':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <OfferMessagesTab {...tabProps} />
          </Suspense>
        );
      case 'actions':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <OfferActionsTab {...tabProps} />
          </Suspense>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pestaña no encontrada</h3>
            <p className="text-gray-600">
              La pestaña "{state.activeTab}" no existe.
            </p>
          </div>
        );
    }
  }, [
    state.activeTab,
    commonProps,
    state.documents,
    state.communications,
    state.currentUserRole,
    sellerCanViewDocuments,
    buyerCanAuthorize,
    handleRefresh,
    sendMessage,
    updateOfferStatus,
    authorizeUser,
    revokeAuthorization
  ]);

  const handleTabChange = useCallback((tab: BuyerTabType) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header profesional */}
      <BuyerOfferHeader
        offer={state.offer}
        activeTab={state.activeTab}
        buyerTabs={buyerTabs}
        onBack={onBack}
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {state.loading ? (
          <LoadingSpinner />
        ) : state.error ? (
          <ErrorDisplay error={state.error} onRetry={handleRefresh} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {renderTabContent()}
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================================================
// EXPORT MEMOIZADO PARA OPTIMIZACIÓN DE RENDERS
// ========================================================================

export const OfferDetailsPanel = memo(OfferDetailsPanelComponent);