import React, { useState, useEffect, Suspense } from 'react';
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
  Loader
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, formatPriceCLP } from '../../lib/supabase';
import toast from 'react-hot-toast';

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

// Importar componentes de tabs
const OfferSummaryTab = React.lazy(() => import('./tabs/OfferSummaryTab'));
const OfferTasksTab = React.lazy(() => import('./tabs/OfferTasksTab'));
const OfferDocumentsTab = React.lazy(() => import('./tabs/OfferDocumentsTab'));
const OfferFormalRequestsTab = React.lazy(() => import('./tabs/OfferFormalRequestsTab'));
const OfferTimelineTab = React.lazy(() => import('./tabs/OfferTimelineTab'));
const OfferCommunicationTab = React.lazy(() => import('./tabs/OfferCommunicationTab'));

// Componente de carga para Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

// Componente de error
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
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
);

const SalesOfferDetailView: React.FC = () => {
  const { id: offerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();


  // Estado principal
  const [state, setState] = useState<OfferManagementState>({
    offerId: offerId || '',
    offer: null,
    tasks: [],
    documents: [],
    timeline: [],
    formalRequests: [],
    communications: [],
    currentUserRole: null,
    activeTab: 'summary',
    loading: true,
    error: null
  });

  // ========================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ========================================================================

  const loadOfferData = async () => {
    if (!offerId) return;

    try {
      const { data: offerData, error } = await supabase
        .from('property_sale_offers')
        .select(`
          *,
          property:property_id (
            id,
            address_street,
            address_number,
            address_commune,
            address_region,
            price_clp
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) throw error;

      // Determinar el rol del usuario actual
      const isSeller = offerData.property?.owner_id === user?.id;
      const isBuyer = offerData.buyer_id === user?.id;
      const userRole: UserRole = isSeller ? 'seller' : isBuyer ? 'buyer' : 'admin';

      setState(prev => ({
        ...prev,
        offer: offerData,
        currentUserRole: userRole,
        error: null
      }));

      return offerData;
    } catch (error: any) {
      console.error('Error loading offer:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar los datos de la oferta'
      }));
      throw error;
    }
  };

  const loadOfferTasks = async () => {
    if (!offerId) return;

    try {
      const { data, error } = await supabase
        .from('offer_tasks')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe aún, no es un error crítico
        if (error.code === '42P01') {
          console.warn('Tabla offer_tasks no existe aún');
          setState(prev => ({ ...prev, tasks: [] }));
          return;
        }
        throw error;
      }

      setState(prev => ({
        ...prev,
        tasks: data || []
      }));
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      // No lanzar error para no detener la carga completa
      setState(prev => ({ ...prev, tasks: [] }));
    }
  };

  const loadOfferDocuments = async () => {
    if (!offerId) return;

    try {
      const { data, error } = await supabase
        .from('offer_documents')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe aún, no es un error crítico
        if (error.code === '42P01') {
          console.warn('Tabla offer_documents no existe aún');
          setState(prev => ({ ...prev, documents: [] }));
          return;
        }
        throw error;
      }

      setState(prev => ({
        ...prev,
        documents: data || []
      }));
    } catch (error: any) {
      console.error('Error loading documents:', error);
      // No lanzar error para no detener la carga completa
      setState(prev => ({ ...prev, documents: [] }));
    }
  };

  const loadOfferTimeline = async () => {
    if (!offerId) return;

    try {
      const { data, error } = await supabase
        .from('offer_timeline')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe aún, no es un error crítico
        if (error.code === '42P01') {
          console.warn('Tabla offer_timeline no existe aún');
          setState(prev => ({ ...prev, timeline: [] }));
          return;
        }
        throw error;
      }

      setState(prev => ({
        ...prev,
        timeline: data || []
      }));
    } catch (error: any) {
      console.error('Error loading timeline:', error);
      // No lanzar error para no detener la carga completa
      setState(prev => ({ ...prev, timeline: [] }));
    }
  };

  const loadOfferFormalRequests = async () => {
    if (!offerId) return;

    try {
      const { data, error } = await supabase
        .from('offer_formal_requests')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe aún, no es un error crítico
        if (error.code === '42P01') {
          console.warn('Tabla offer_formal_requests no existe aún');
          setState(prev => ({ ...prev, formalRequests: [] }));
          return;
        }
        throw error;
      }

      setState(prev => ({
        ...prev,
        formalRequests: data || []
      }));
    } catch (error: any) {
      console.error('Error loading formal requests:', error);
      // No lanzar error para no detener la carga completa
      setState(prev => ({ ...prev, formalRequests: [] }));
    }
  };

  const loadOfferCommunications = async () => {
    if (!offerId) return;

    try {
      const { data, error } = await supabase
        .from('offer_communications')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla no existe aún, no es un error crítico
        if (error.code === '42P01') {
          console.warn('Tabla offer_communications no existe aún');
          setState(prev => ({ ...prev, communications: [] }));
          return;
        }
        throw error;
      }

      setState(prev => ({
        ...prev,
        communications: data || []
      }));
    } catch (error: any) {
      console.error('Error loading communications:', error);
      // No lanzar error para no detener la carga completa
      setState(prev => ({ ...prev, communications: [] }));
    }
  };

  // Función principal para cargar todos los datos
  const loadAllData = async () => {
    if (!offerId) {
      setState(prev => ({
        ...prev,
        error: 'ID de oferta no válido',
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await Promise.all([
        loadOfferData(),
        loadOfferTasks(),
        loadOfferDocuments(),
        loadOfferTimeline(),
        loadOfferFormalRequests(),
        loadOfferCommunications()
      ]);
    } catch (error) {
      console.error('Error loading offer data:', error);
      // Error ya manejado en las funciones individuales
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // ========================================================================
  // FUNCIONES DE ACCIONES
  // ========================================================================

  const updateOfferStatus = async (newStatus: SaleOffer['status'], extraData?: any) => {
    if (!state.offer) return;

    try {
      const { error } = await supabase
        .from('property_sale_offers')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...extraData
        })
        .eq('id', state.offer.id);

      if (error) throw error;

      toast.success('Estado de la oferta actualizado correctamente');
      await loadAllData(); // Recargar todos los datos
    } catch (error: any) {
      console.error('Error updating offer status:', error);
      toast.error('Error al actualizar el estado de la oferta');
    }
  };

  const addTimelineEvent = async (eventData: {
    event_type: string;
    event_title: string;
    event_description?: string;
    related_data?: Record<string, any>;
  }) => {
    if (!user || !offerId) return;

    try {
      const { error } = await supabase
        .from('offer_timeline')
        .insert({
          offer_id: offerId,
          event_type: eventData.event_type,
          event_title: eventData.event_title,
          event_description: eventData.event_description,
          triggered_by: user.id,
          triggered_by_role: state.currentUserRole,
          related_data: eventData.related_data
        });

      if (error) throw error;

      // Recargar timeline
      await loadOfferTimeline();
    } catch (error: any) {
      console.error('Error adding timeline event:', error);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  };

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (offerId) {
      loadAllData();
    }
  }, [offerId, user]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleTabChange = (tab: TabType) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const handleRetry = () => {
    loadAllData();
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles de la oferta...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </button>
        <ErrorDisplay error={state.error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!state.offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Oferta no encontrada</p>
        </div>
      </div>
    );
  }

  // Definir tabs según el rol del usuario
  const getTabsByRole = () => {
    const baseTabs = [
      { id: 'summary' as TabType, label: 'Resumen', icon: FileText },
      { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
      { id: 'communication' as TabType, label: 'Comunicación', icon: MessageSquare, badge: state.communications.length }
    ];

    if (state.currentUserRole === 'seller' || state.currentUserRole === 'admin') {
      // Tabs para vendedores/administradores
      return [
        ...baseTabs,
        { id: 'tasks' as TabType, label: 'Tareas', icon: CheckCircle, badge: state.tasks.filter(t => t.status === 'pendiente').length },
        { id: 'documents' as TabType, label: 'Documentos', icon: Paperclip, badge: state.documents.filter(d => d.status === 'pendiente').length },
        { id: 'requests' as TabType, label: 'Solicitudes', icon: Settings, badge: state.formalRequests.filter(r => r.status === 'solicitada').length }
      ];
    } else if (state.currentUserRole === 'buyer') {
      // Tabs para compradores
      return [
        ...baseTabs,
        { id: 'documents' as TabType, label: 'Mis Documentos', icon: Paperclip, badge: state.documents.filter(d => d.status === 'pendiente').length },
        { id: 'requests' as TabType, label: 'Mis Solicitudes', icon: Settings, badge: state.formalRequests.filter(r => r.status === 'solicitada').length }
      ];
    }

    return baseTabs;
  };

  const tabs = getTabsByRole();

  const renderTabContent = () => {
    const commonProps = {
      offer: state.offer,
      userRole: state.currentUserRole,
      onUpdateOffer: updateOfferStatus,
      onAddTimelineEvent: addTimelineEvent,
      onRefreshData: loadAllData
    };

    // Componente de fallback para errores de carga
    const TabErrorFallback = ({ tabName }: { tabName: string }) => (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error al cargar {tabName}
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Hubo un problema al cargar el contenido de esta sección.
        </p>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );

    try {
      switch (state.activeTab) {
        case 'summary':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OfferSummaryTab
                {...commonProps}
                tasks={state.tasks}
                documents={state.documents}
                timeline={state.timeline}
                formalRequests={state.formalRequests}
              />
            </Suspense>
          );
        case 'tasks':
          // Solo para vendedores/administradores
          if (state.currentUserRole === 'seller' || state.currentUserRole === 'admin') {
            return (
              <Suspense fallback={<LoadingSpinner />}>
                <OfferTasksTab
                  {...commonProps}
                  tasks={state.tasks}
                  onTasksChange={loadOfferTasks}
                />
              </Suspense>
            );
          }
          return <TabErrorFallback tabName="Tareas" />;

        case 'documents':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OfferDocumentsTab
                {...commonProps}
                documents={state.documents}
                onDocumentsChange={loadOfferDocuments}
                viewMode={state.currentUserRole === 'buyer' ? 'buyer' : 'seller'}
              />
            </Suspense>
          );

        case 'requests':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OfferFormalRequestsTab
                {...commonProps}
                formalRequests={state.formalRequests}
                onRequestsChange={loadOfferFormalRequests}
                viewMode={state.currentUserRole === 'buyer' ? 'buyer' : 'seller'}
              />
            </Suspense>
          );

        case 'timeline':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OfferTimelineTab
                {...commonProps}
                timeline={state.timeline}
              />
            </Suspense>
          );

        case 'communication':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OfferCommunicationTab
                {...commonProps}
                communications={state.communications}
                onCommunicationsChange={loadOfferCommunications}
              />
            </Suspense>
          );

        default:
          // Vista básica para cuando no hay funcionalidades avanzadas
          return (
            <div className="space-y-8">
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-8 text-white relative">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-white/30 ${
                          state.offer?.status === 'aceptada' ? 'bg-green-500/20' :
                          state.offer?.status === 'rechazada' ? 'bg-red-500/20' :
                          state.offer?.status === 'contraoferta' ? 'bg-blue-500/20' :
                          'bg-white/10'
                        }`}>
                          {state.offer?.status ? state.offer.status.replace('_', ' ').toUpperCase() : 'Cargando...'}
                        </div>
                        <div className="px-4 py-2 rounded-full text-sm font-bold bg-white/10 border border-white/20 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {state.offer ? formatPriceCLP(state.offer.offer_amount) : 'Cargando...'}
                        </div>
                      </div>

                      <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                        Oferta #{state.offer?.id.substring(0, 8) || 'Cargando...'}
                      </h1>
                      <p className="text-blue-100 text-lg mb-4">
                        {state.offer?.property?.address_street} {state.offer?.property?.address_number}, {state.offer?.property?.address_commune}
                      </p>

                      <div className="flex items-center text-blue-200 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Recibida el {state.offer ? new Date(state.offer.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Cargando...'}
                      </div>
                    </div>
                  </div>

                  {/* Elementos decorativos */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información del usuario actual */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Tu Rol</h3>
                      <p className="text-sm text-gray-500">Tipo de acceso</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Acceso actual:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        state.currentUserRole === 'seller' ? 'bg-purple-100 text-purple-800' :
                        state.currentUserRole === 'buyer' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {state.currentUserRole === 'seller' ? 'Vendedor' :
                         state.currentUserRole === 'buyer' ? 'Comprador' : 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles de la oferta */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Detalles de la Oferta</h3>
                      <p className="text-sm text-gray-500">Información financiera</p>
                    </div>
                  </div>

                  {state.offer && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Monto ofertado:</span>
                        <span className="font-bold text-gray-900 text-lg">{formatPriceCLP(state.offer.offer_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Moneda:</span>
                        <span className="font-medium text-gray-900">{state.offer.offer_amount_currency}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Financiamiento:</span>
                        <span className="font-medium text-gray-900">{state.offer.financing_type || 'No especificado'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mensaje del comprador */}
              {state.offer && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Mensaje del Comprador</h3>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-gray-700 italic">
                      {state.offer.message || 'No se incluyó mensaje adicional con la oferta.'}
                    </p>
                  </div>

                  {/* Solicitudes adicionales */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-800 mb-3">Solicitudes Adicionales</h4>
                    <div className="flex flex-wrap gap-3">
                      <div className={`px-3 py-2 rounded-lg border text-sm flex items-center ${
                        state.offer.requests_title_study ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        <CheckCircle className={`w-4 h-4 mr-2 ${
                          state.offer.requests_title_study ? 'text-blue-600' : 'text-gray-300'
                        }`} />
                        Estudio de Títulos
                      </div>
                      <div className={`px-3 py-2 rounded-lg border text-sm flex items-center ${
                        state.offer.requests_property_inspection ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        <CheckCircle className={`w-4 h-4 mr-2 ${
                          state.offer.requests_property_inspection ? 'text-orange-600' : 'text-gray-300'
                        }`} />
                        Inspección Técnica
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering tab content:', error);
      return <TabErrorFallback tabName={state.activeTab} />;
    }
  };


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
                  Oferta #{state.offer?.id.substring(0, 8) || 'N/A'}
                </h1>
                <p className="text-sm text-gray-500">
                  {state.offer?.property?.address_street} {state.offer?.property?.address_number}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Rol actual</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {state.currentUserRole === 'seller' ? 'Vendedor' :
                   state.currentUserRole === 'buyer' ? 'Comprador' : 'Admin'}
                </p>
              </div>

              {state.offer && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  state.offer.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                  state.offer.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                  state.offer.status === 'contraoferta' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {state.offer.status.replace('_', ' ').toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = state.activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
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
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SalesOfferDetailView;
