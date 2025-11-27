// ========================================================================
// SALESOFFERDETAILVIEW - COMPONENTE OPTIMIZADO COMPLETO
// ========================================================================

import React, { useState, useEffect, Suspense, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  MessageSquare,
  Paperclip,
  Settings,
  User,
  AlertCircle,
  Loader,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Importar tipos
import {
  SaleOffer,
  OfferTask,
  OfferDocument,
  OfferTimeline,
  OfferFormalRequest,
  OfferCommunication,
  TabType,
  OfferManagementState,
  UserRole
} from './types';

// Componentes virtualizados para listas grandes
import { VirtualizedList, useVirtualizedList } from '../common/VirtualizedList';
import { ErrorBoundary } from '../common/misc/ErrorBoundary';

// Sistema de búsqueda y filtros avanzados
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { AdvancedSearchFilters } from '../common/AdvancedSearchFilters';

// Sistema de comandos y contexto
import { useOfferContext, OfferProvider } from '../../hooks/useOfferContext';
import { CommandControls } from '../common/CommandControls';

// Hook personalizado para notificaciones en tiempo real
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

// ========================================================================
// COMPONENTES OPTIMIZADOS Y VIRTUALIZADOS
// ========================================================================

// Componente de carga optimizado
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
));

// Componente de error optimizado
const ErrorDisplay = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar los datos</h3>
    <p className="text-gray-600 text-center mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Reintentar
    </button>
  </div>
));

// Componente de timeline virtualizado para listas grandes con búsqueda
const VirtualizedTimelineTab = memo(({
  timeline,
  offer,
  userRole,
  onUpdateOffer,
  onAddTimelineEvent
}: {
  timeline: OfferTimeline[];
  offer: SaleOffer;
  userRole: UserRole | null;
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
}) => {
  // Sistema de búsqueda y filtros para timeline
  const {
    filteredData: filteredTimeline,
    filters,
    updateSearchTerm,
    updateDateRange,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    totalItems,
    filteredItems
  } = useAdvancedSearch({
    data: timeline,
    searchFields: ['event_title', 'event_description', 'triggered_by_name'],
    initialFilters: { sortBy: 'date_desc' }
  });

  const { renderList } = useVirtualizedList(filteredTimeline, {
    containerHeight: 600,
    itemHeight: 120,
    overscan: 3
  });

  const renderTimelineItem = useCallback((event: OfferTimeline, index: number) => (
    <div key={event.id} className="flex space-x-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">{event.event_title}</h4>
          <span className="text-xs text-gray-500">
            {new Date(event.created_at).toLocaleDateString('es-CL')}
          </span>
        </div>
        {event.event_description && (
          <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
        )}
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <User className="w-3 h-3 mr-1" />
          {event.triggered_by_name || 'Usuario'}
          {event.triggered_by_role && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {event.triggered_by_role}
            </span>
          )}
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="space-y-4">
      {/* Sistema de búsqueda y filtros */}
      <AdvancedSearchFilters
        filters={filters}
        onUpdateSearchTerm={updateSearchTerm}
        onUpdateDateRange={updateDateRange}
        onUpdateFilter={updateFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        totalItems={totalItems}
        filteredItems={filteredItems}
        placeholder="Buscar en timeline..."
        availableFilters={{
          type: [
            { label: 'Oferta', value: 'oferta', color: 'bg-blue-100 text-blue-800' },
            { label: 'Documento', value: 'documento', color: 'bg-green-100 text-green-800' },
            { label: 'Tarea', value: 'tarea', color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Solicitud', value: 'solicitud', color: 'bg-purple-100 text-purple-800' },
            { label: 'Comunicación', value: 'comunicacion', color: 'bg-indigo-100 text-indigo-800' }
          ],
          userRole: [
            { label: 'Vendedor', value: 'seller', color: 'bg-blue-100 text-blue-800' },
            { label: 'Comprador', value: 'buyer', color: 'bg-green-100 text-green-800' },
            { label: 'Admin', value: 'admin', color: 'bg-purple-100 text-purple-800' }
          ]
        }}
      />

      {/* Lista virtualizada */}
      {filteredTimeline.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {hasActiveFilters ? 'No se encontraron eventos con los filtros aplicados' : 'No hay eventos en el timeline'}
        </div>
      ) : (
        renderList(renderTimelineItem)
      )}
    </div>
  );
});

// Componente de comunicaciones virtualizado con búsqueda
const VirtualizedCommunicationTab = memo(({
  communications,
  offer,
  userRole,
  onCommunicationsChange
}: {
  communications: OfferCommunication[];
  offer: SaleOffer;
  userRole: UserRole | null;
  onCommunicationsChange: () => Promise<void>;
}) => {
  // Sistema de búsqueda y filtros para comunicaciones
  const {
    filteredData: filteredCommunications,
    filters,
    updateSearchTerm,
    updateDateRange,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    totalItems,
    filteredItems
  } = useAdvancedSearch({
    data: communications,
    searchFields: ['message', 'author_name', 'subject'],
    initialFilters: { sortBy: 'date_desc' }
  });

  const { renderList } = useVirtualizedList(filteredCommunications, {
    containerHeight: 500,
    itemHeight: 100,
    overscan: 2
  });

  const renderCommunicationItem = useCallback((comm: OfferCommunication, index: number) => (
    <div key={comm.id} className="flex space-x-4 p-4 border-b border-gray-100">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">
            {comm.author_name || 'Usuario'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(comm.created_at).toLocaleDateString('es-CL')}
          </span>
        </div>
        {comm.subject && (
          <div className="text-xs text-blue-600 font-medium mb-1">
            {comm.subject}
          </div>
        )}
        <p className="text-sm text-gray-700">{comm.message}</p>
        <div className="flex items-center gap-2 mt-2">
          {comm.is_private && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
              Privado
            </span>
          )}
          {comm.message_type && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
              {comm.message_type.replace('_', ' ')}
            </span>
          )}
          {comm.author_role && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-600">
              {comm.author_role}
            </span>
          )}
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="space-y-4">
      {/* Sistema de búsqueda y filtros */}
      <AdvancedSearchFilters
        filters={filters}
        onUpdateSearchTerm={updateSearchTerm}
        onUpdateDateRange={updateDateRange}
        onUpdateFilter={updateFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        totalItems={totalItems}
        filteredItems={filteredItems}
        placeholder="Buscar en comunicaciones..."
        availableFilters={{
          type: [
            { label: 'Mensaje', value: 'message', color: 'bg-blue-100 text-blue-800' },
            { label: 'Nota Interna', value: 'nota_interna', color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Actualización', value: 'status_update', color: 'bg-green-100 text-green-800' },
            { label: 'Seguimiento', value: 'seguimiento', color: 'bg-purple-100 text-purple-800' }
          ],
          userRole: [
            { label: 'Vendedor', value: 'seller', color: 'bg-blue-100 text-blue-800' },
            { label: 'Comprador', value: 'buyer', color: 'bg-green-100 text-green-800' },
            { label: 'Admin', value: 'admin', color: 'bg-purple-100 text-purple-800' }
          ]
        }}
      />

      {/* Lista virtualizada */}
      {filteredCommunications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {hasActiveFilters ? 'No se encontraron comunicaciones con los filtros aplicados' : 'No hay comunicaciones'}
        </div>
      ) : (
        <>
          {renderList(renderCommunicationItem)}

          {/* Formulario de nuevo mensaje */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Enviar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

// Componente de pestañas lazy-loaded con Error Boundaries
const LazyTabContent = memo(({
  tabId,
  commonProps
}: {
  tabId: TabType;
  commonProps: any;
}) => {
  const TabComponent = useMemo(() => {
    switch (tabId) {
      case 'summary':
        return React.lazy(() => import('./tabs/OfferSummaryTab'));
      case 'tasks':
        return React.lazy(() => import('./tabs/OfferTasksTab'));
      case 'documents':
        return React.lazy(() => import('./tabs/OfferDocumentsTab'));
      case 'requests':
        return React.lazy(() => import('./tabs/OfferFormalRequestsTab'));
      case 'timeline':
        return VirtualizedTimelineTab;
      case 'communication':
        return VirtualizedCommunicationTab;
      default:
        return null;
    }
  }, [tabId]);

  if (!TabComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pestaña no disponible
        </h3>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error al cargar la pestaña
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Ha ocurrido un error al cargar el contenido de esta sección.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Recargar página
          </button>
        </div>
      }
    >
      <Suspense fallback={<LoadingSpinner />}>
        <TabComponent {...commonProps} />
      </Suspense>
    </ErrorBoundary>
  );
});

// ========================================================================
// HOOKS PERSONALIZADOS OPTIMIZADOS
// ========================================================================

// Hook para determinar si usar virtualización
const useShouldVirtualize = (items: any[], threshold: number = 50) => {
  return useMemo(() => items.length > threshold, [items.length, threshold]);
};

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

// Componente interno que usa el contexto
const SalesOfferDetailViewInner = memo(() => {
  const { id: offerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Usar contexto en lugar de estado local
  const {
    // Estado
    offer,
    tasks,
    documents,
    timeline,
    formalRequests,
    communications,
    currentUserRole,
    activeTab,
    loading,
    error,

    // Acciones
    setActiveTab,
    clearError,

    // Command Manager
    commandManager
  } = useOfferContext();

  // ========================================================================
  // HOOKS - Deben estar antes de cualquier return condicional
  // ========================================================================

  // Determinar si usar virtualización
  const shouldVirtualizeTimeline = useShouldVirtualize(timeline, 30);
  const shouldVirtualizeCommunications = useShouldVirtualize(communications, 25);

  // Callbacks para actualizaciones en tiempo real
  const handleOfferUpdate = useCallback((update: any) => {
    console.log('🔄 Oferta actualizada en tiempo real:', update);
    // TODO: Implementar recarga de datos desde contexto
  }, []);

  const handleTaskUpdate = useCallback((update: any) => {
    console.log('🔄 Tarea actualizada en tiempo real:', update);
    // TODO: Implementar recarga de datos desde contexto
  }, []);

  const handleDocumentUpdate = useCallback((update: any) => {
    console.log('🔄 Documento actualizado en tiempo real:', update);
    // TODO: Implementar recarga de datos desde contexto
  }, []);

  const handleTimelineUpdate = useCallback((update: any) => {
    console.log('🔄 Timeline actualizado en tiempo real:', update);
    // TODO: Implementar recarga de datos desde contexto
  }, []);

  const handleCommunicationUpdate = useCallback((update: any) => {
    console.log('🔄 Comunicación actualizada en tiempo real:', update);
    // TODO: Implementar recarga de datos desde contexto
  }, []);

  const handleFormalRequestUpdate = useCallback((update: any) => {
    console.log('🔄 Solicitud formal actualizada en tiempo real:', update);
    // TODO: Implementar recarga de datos desde contexto
  }, []);

  // Hook de notificaciones en tiempo real - DEBE estar antes de cualquier return condicional
  useRealTimeUpdates(offerId, {
    onOfferUpdate: handleOfferUpdate,
    onTaskUpdate: handleTaskUpdate,
    onDocumentUpdate: handleDocumentUpdate,
    onTimelineUpdate: handleTimelineUpdate,
    onCommunicationUpdate: handleCommunicationUpdate,
    onFormalRequestUpdate: handleFormalRequestUpdate,
    enabled: !!offerId && !!offer
  });

  // Memoizar tabs por rol para evitar recálculos - DEBE estar antes de cualquier return condicional
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'summary' as TabType, label: 'Resumen', icon: FileText },
      { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
      { id: 'communication' as TabType, label: 'Comunicación', icon: MessageSquare, badge: communications.length }
    ];

    if (currentUserRole === 'seller' || currentUserRole === 'admin') {
      // Tabs para vendedores/administradores
      return [
        ...baseTabs,
        { id: 'tasks' as TabType, label: 'Tareas', icon: CheckCircle, badge: tasks.filter(t => t.status === 'pendiente').length },
        { id: 'documents' as TabType, label: 'Documentos', icon: Paperclip, badge: documents.filter(d => d.status === 'pendiente').length },
        { id: 'requests' as TabType, label: 'Solicitudes', icon: Settings, badge: formalRequests.filter(r => r.status === 'solicitada').length }
      ];
    } else if (currentUserRole === 'buyer') {
      // Tabs para compradores
      return [
        ...baseTabs,
        { id: 'documents' as TabType, label: 'Mis Documentos', icon: Paperclip, badge: documents.filter(d => d.status === 'pendiente').length },
        { id: 'requests' as TabType, label: 'Mis Solicitudes', icon: Settings, badge: formalRequests.filter(r => r.status === 'solicitada').length }
      ];
    }

    return baseTabs;
  }, [currentUserRole, tasks, documents, formalRequests, communications]);

  // Función para cambiar de tab
  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  // Props comunes memoizadas para mejor performance - DEBE estar antes de cualquier return condicional
  const commonProps = useMemo(() => ({
    offer,
    userRole: currentUserRole,
    onUpdateOffer: () => {}, // TODO: Implement from context
    onAddTimelineEvent: () => {}, // TODO: Implement from context
    onCreateFormalRequest: () => {}, // TODO: Implement from context
    onRefreshData: () => {}, // TODO: Implement from context
    tasks,
    documents,
    timeline,
    formalRequests,
    communications,
    onTasksChange: () => {}, // TODO: Implement from context
    onDocumentsChange: () => {}, // TODO: Implement from context
    onRequestsChange: () => {}, // TODO: Implement from context
    onCommunicationsChange: () => {} // TODO: Implement from context
  }), [offer, currentUserRole, tasks, documents, timeline, formalRequests, communications]);

  // ========================================================================
  // MANEJO DE ESTADOS DE ERROR Y CARGA
  // ========================================================================

  // Manejar estados de error y carga
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al Cargar la Oferta
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                clearError();
                window.location.reload();
              }}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver Atrás
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar loading inicial
  if (loading && !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Cargando oferta...</h3>
          <p className="text-gray-600 mt-2">Obteniendo detalles de la oferta</p>
        </div>
      </div>
    );
  }

  // Mostrar not found si terminó de cargar pero no hay oferta
  if (!loading && !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oferta No Encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo encontrar la oferta solicitada. Puede que haya sido eliminada o que no tengas permisos para verla.
          </p>
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg mb-4">
            <strong>ID solicitado:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{offerId}</code>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver Atrás
            </button>
            <a
              href="/sales"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
            >
              Ver Ofertas Disponibles
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER OPTIMIZADO
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles de la oferta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Oferta no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Volver</span>
              </button>

              <div className="h-6 w-px bg-gray-300"></div>

              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Oferta #{offer?.id.substring(0, 8) || 'N/A'}
                </h1>
                <p className="text-sm text-gray-500">
                  {offer?.property?.address_street} {offer?.property?.address_number}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Rol actual</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {currentUserRole === 'seller' ? 'Vendedor' :
                   currentUserRole === 'buyer' ? 'Comprador' : 'Admin'}
                </p>
              </div>

              {offer && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  offer.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                  offer.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                  offer.status === 'contraoferta' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status.replace('_', ' ').toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Command Controls */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <CommandControls
              canUndo={commandManager.canUndo}
              canRedo={commandManager.canRedo}
              isExecuting={commandManager.isExecuting}
              lastCommandName={commandManager.lastCommandName}
              commandHistoryLength={commandManager.commandHistoryLength}
              onUndo={commandManager.undo}
              onRedo={commandManager.redo}
              onClearHistory={commandManager.clearHistory}
              onExportHistory={() => {
                const historyData = commandManager.exportHistory();
                const blob = new Blob([historyData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                a.href = url;
                a.download = `offer-${offerId}-command-history.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        tab.id === 'documents' ? 'bg-orange-500 text-white' :
                        tab.id === 'tasks' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LazyTabContent tabId={activeTab} commonProps={commonProps} />
      </div>
    </div>
  );
});

SalesOfferDetailViewInner.displayName = 'SalesOfferDetailViewInner';

// Componente de diagnóstico cuando no hay datos
const OfferNotFound: React.FC<{ offerId: string }> = ({ offerId }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oferta No Encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            La oferta con ID <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              {offerId}
            </code> no existe o no tienes permisos para verla.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
            <strong>Posibles causas:</strong>
            <ul className="mt-1 text-left list-disc list-inside">
              <li>El ID de la oferta es incorrecto</li>
              <li>La oferta fue eliminada</li>
              <li>No tienes permisos para ver esta oferta</li>
              <li>No hay ofertas en la base de datos</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver Atrás
            </button>
            <a
              href="/sales"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block text-center"
            >
              Ver Todas las Ofertas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal con OfferProvider
const SalesOfferDetailView = memo(() => {
  const { id: offerId } = useParams<{ id: string }>();

  if (!offerId) {
    return <OfferNotFound offerId="sin-id" />;
  }

  return (
    <OfferProvider initialOfferId={offerId}>
      <SalesOfferDetailViewInner />
    </OfferProvider>
  );
});

SalesOfferDetailView.displayName = 'SalesOfferDetailView';

export default SalesOfferDetailView;