import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import {
  SaleOffer,
  OfferTask,
  OfferDocument,
  OfferTimeline,
  OfferFormalRequest,
  OfferCommunication,
  UserRole,
  TabType
} from '../components/sales/types';

// Importar sistema de comandos
import { useCommandManager, Command, UpdateOfferStatusCommand, CreateTaskCommand, UpdateDocumentCommand, SendCommunicationCommand } from './useCommandManager';

// ========================================================================
// INTERFACES Y TIPOS
// ========================================================================

export interface OfferContextState {
  // Datos principales
  offerId: string;
  offer: SaleOffer | null;
  tasks: OfferTask[];
  documents: OfferDocument[];
  timeline: OfferTimeline[];
  formalRequests: OfferFormalRequest[];
  communications: OfferCommunication[];

  // Estado de UI
  currentUserRole: UserRole | null;
  activeTab: TabType;
  loading: boolean;
  error: string | null;

  // Estado de carga individual
  loadingStates: {
    offer: boolean;
    tasks: boolean;
    documents: boolean;
    timeline: boolean;
    formalRequests: boolean;
    communications: boolean;
  };

  // Estadísticas calculadas
  stats: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    totalDocuments: number;
    pendingDocuments: number;
    validatedDocuments: number;
    totalCommunications: number;
    unreadCommunications: number;
    totalFormalRequests: number;
    pendingFormalRequests: number;
  };
}

export interface OfferContextActions {
  // Acciones de carga de datos
  setOffer: (offer: SaleOffer) => void;
  setTasks: (tasks: OfferTask[]) => void;
  setDocuments: (documents: OfferDocument[]) => void;
  setTimeline: (timeline: OfferTimeline[]) => void;
  setFormalRequests: (requests: OfferFormalRequest[]) => void;
  setCommunications: (communications: OfferCommunication[]) => void;

  // Acciones de UI
  setActiveTab: (tab: TabType) => void;
  setCurrentUserRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones de carga individual
  setLoadingState: (key: keyof OfferContextState['loadingStates'], loading: boolean) => void;

  // Acciones complejas
  updateOfferStatus: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  addTimelineEvent: (eventData: any) => Promise<void>;
  createFormalRequest: (requestData: any) => Promise<void>;

  // Utilidades
  refreshAllData: () => Promise<void>;
  refreshDataSection: (section: keyof OfferContextState['loadingStates']) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export interface OfferContextType extends OfferContextState, OfferContextActions {
  // Command Manager
  commandManager: {
    canUndo: boolean;
    canRedo: boolean;
    isExecuting: boolean;
    lastCommandName?: string;
    commandHistoryLength: number;
    executeCommand: (command: Command) => Promise<void>;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    clearHistory: () => void;
    exportHistory: () => string;
  };
}

// ========================================================================
// ACCIONES DEL REDUCER
// ========================================================================

type OfferAction =
  | { type: 'SET_OFFER'; payload: SaleOffer }
  | { type: 'SET_TASKS'; payload: OfferTask[] }
  | { type: 'SET_DOCUMENTS'; payload: OfferDocument[] }
  | { type: 'SET_TIMELINE'; payload: OfferTimeline[] }
  | { type: 'SET_FORMAL_REQUESTS'; payload: OfferFormalRequest[] }
  | { type: 'SET_COMMUNICATIONS'; payload: OfferCommunication[] }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_CURRENT_USER_ROLE'; payload: UserRole }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING_STATE'; payload: { key: keyof OfferContextState['loadingStates']; loading: boolean } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

// ========================================================================
// ESTADO INICIAL
// ========================================================================

const initialState: OfferContextState = {
  offerId: '',
  offer: null,
  tasks: [],
  documents: [],
  timeline: [],
  formalRequests: [],
  communications: [],
  currentUserRole: null,
  activeTab: 'summary',
  loading: true,
  error: null,
  loadingStates: {
    offer: false,
    tasks: false,
    documents: false,
    timeline: false,
    formalRequests: false,
    communications: false
  },
  stats: {
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    validatedDocuments: 0,
    totalCommunications: 0,
    unreadCommunications: 0,
    totalFormalRequests: 0,
    pendingFormalRequests: 0
  }
};

// ========================================================================
// REDUCER
// ========================================================================

function offerReducer(state: OfferContextState, action: OfferAction): OfferContextState {
  switch (action.type) {
    case 'SET_OFFER':
      return {
        ...state,
        offer: action.payload,
        offerId: action.payload.id,
        error: null
      };

    case 'SET_TASKS':
      const taskStats = calculateTaskStats(action.payload);
      return {
        ...state,
        tasks: action.payload,
        stats: { ...state.stats, ...taskStats }
      };

    case 'SET_DOCUMENTS':
      const documentStats = calculateDocumentStats(action.payload);
      return {
        ...state,
        documents: action.payload,
        stats: { ...state.stats, ...documentStats }
      };

    case 'SET_TIMELINE':
      return {
        ...state,
        timeline: action.payload
      };

    case 'SET_FORMAL_REQUESTS':
      const formalRequestStats = calculateFormalRequestStats(action.payload);
      return {
        ...state,
        formalRequests: action.payload,
        stats: { ...state.stats, ...formalRequestStats }
      };

    case 'SET_COMMUNICATIONS':
      const communicationStats = calculateCommunicationStats(action.payload);
      return {
        ...state,
        communications: action.payload,
        stats: { ...state.stats, ...communicationStats }
      };

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      };

    case 'SET_CURRENT_USER_ROLE':
      return {
        ...state,
        currentUserRole: action.payload
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.loading
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ========================================================================
// FUNCIONES DE CÁLCULO DE ESTADÍSTICAS
// ========================================================================

function calculateTaskStats(tasks: OfferTask[]) {
  return {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pendiente').length,
    completedTasks: tasks.filter(t => t.status === 'completada').length
  };
}

function calculateDocumentStats(documents: OfferDocument[]) {
  return {
    totalDocuments: documents.length,
    pendingDocuments: documents.filter(d => d.status === 'pendiente').length,
    validatedDocuments: documents.filter(d => d.status === 'validado').length
  };
}

function calculateFormalRequestStats(requests: OfferFormalRequest[]) {
  return {
    totalFormalRequests: requests.length,
    pendingFormalRequests: requests.filter(r => r.status === 'solicitada' || r.status === 'en_proceso').length
  };
}

function calculateCommunicationStats(communications: OfferCommunication[]) {
  return {
    totalCommunications: communications.length,
    unreadCommunications: communications.filter(c => !c.is_read).length
  };
}

// ========================================================================
// CONTEXTO Y PROVIDER
// ========================================================================

const OfferContext = createContext<OfferContextType | null>(null);

export const useOfferContext = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOfferContext must be used within an OfferProvider');
  }
  return context;
};

interface OfferProviderProps {
  children: React.ReactNode;
  initialOfferId?: string;
}

export const OfferProvider: React.FC<OfferProviderProps> = ({
  children,
  initialOfferId = ''
}) => {
  const [state, dispatch] = useReducer(offerReducer, {
    ...initialState,
    offerId: initialOfferId
  });

  const { user } = useAuth();

  // ========================================================================
  // CARGA DE DATOS INICIALES
  // ========================================================================

  const loadOfferData = useCallback(async (offerId: string) => {
    if (!offerId || !user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Cargar oferta principal
      const { data: offerData, error: offerError } = await supabase
        .from('property_sale_offers')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('id', offerId)
        .single();

      // Si la carga fue exitosa, intentar cargar datos del buyer por separado
      if (offerData && !offerError) {
        try {
          const { data: buyerData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', offerData.buyer_id)
            .single();

          if (buyerData) {
            offerData.buyer = buyerData;
          }
        } catch (buyerError) {
          console.warn('Could not load buyer data:', buyerError);
          // No fallar la carga completa por esto
        }
      }

      if (offerError) {
        throw new Error(`Error loading offer: ${offerError.message}`);
      }

      if (!offerData) {
        throw new Error('Offer not found');
      }

      // Verificar permisos de acceso
      const hasAccess = offerData.buyer_id === user.id ||
                       offerData.property?.owner_id === user.id;

      if (!hasAccess) {
        throw new Error('You do not have permission to view this offer');
      }

      dispatch({ type: 'SET_OFFER', payload: offerData });

      // Determinar rol del usuario actual
      const userRole: UserRole = offerData.buyer_id === user.id ? 'buyer' :
                                offerData.property?.owner_id === user.id ? 'seller' : 'admin';
      dispatch({ type: 'SET_CURRENT_USER_ROLE', payload: userRole });

      // Cargar datos relacionados en paralelo
      await Promise.allSettled([
        loadTasks(offerId),
        loadDocuments(offerId),
        loadTimeline(offerId),
        loadFormalRequests(offerId),
        loadCommunications(offerId)
      ]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error loading offer data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const loadTasks = useCallback(async (offerId: string) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'tasks', loading: true } });

    try {
      // Tabla offer_tasks no existe aún, usar datos mock por ahora
      const mockTasks: OfferTask[] = [
        {
          id: 'task_1',
          offer_id: offerId,
          title: 'Revisar documentos de propiedad',
          description: 'Verificar que todos los documentos estén completos y válidos',
          status: 'pending',
          priority: 'high',
          assigned_to: user?.id || '',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'task_2',
          offer_id: offerId,
          title: 'Contactar al comprador',
          description: 'Llamar al comprador para discutir términos de la oferta',
          status: 'completed',
          priority: 'medium',
          assigned_to: user?.id || '',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      dispatch({ type: 'SET_TASKS', payload: mockTasks });
    } catch (error) {
      console.error('Error loading tasks:', error);
      // En caso de error, usar array vacío
      dispatch({ type: 'SET_TASKS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'tasks', loading: false } });
    }
  }, [user]);

  const loadDocuments = useCallback(async (offerId: string) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'documents', loading: true } });

    try {
      // Usar la tabla real property_sale_offer_documents
      const { data, error } = await supabase
        .from('property_sale_offer_documents')
        .select('*')
        .eq('offer_id', offerId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Transformar datos al formato esperado
      const transformedDocuments: OfferDocument[] = (data || []).map(doc => ({
        id: doc.id,
        offer_id: doc.offer_id,
        document_type: doc.doc_type,
        file_name: doc.file_name,
        file_url: doc.file_url,
        storage_path: doc.storage_path,
        file_size_bytes: doc.file_size_bytes,
        uploaded_at: doc.uploaded_at,
        notes: doc.notes,
        uploaded_by: doc.uploaded_by,
        created_at: doc.created_at,
        mime_type: doc.mime_type,
        status: 'validated' // Asumir validado por ahora
      }));

      dispatch({ type: 'SET_DOCUMENTS', payload: transformedDocuments });
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'documents', loading: false } });
    }
  }, []);

  const loadTimeline = useCallback(async (offerId: string) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'timeline', loading: true } });

    try {
      // Tabla offer_timeline no existe aún, usar datos mock por ahora
      const mockTimeline: OfferTimeline[] = [
        {
          id: 'timeline_1',
          offer_id: offerId,
          event_type: 'offer_created',
          title: 'Oferta creada',
          description: 'La oferta ha sido creada y enviada al vendedor',
          metadata: { offer_price: 150000000 },
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'timeline_2',
          offer_id: offerId,
          event_type: 'document_uploaded',
          title: 'Documento subido',
          description: 'Se ha subido el comprobante de fondos',
          metadata: { document_type: 'proof_of_funds' },
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'timeline_3',
          offer_id: offerId,
          event_type: 'status_changed',
          title: 'Estado actualizado',
          description: 'La oferta ha sido marcada como en revisión',
          metadata: { old_status: 'pendiente', new_status: 'aceptada' },
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      dispatch({ type: 'SET_TIMELINE', payload: mockTimeline });
    } catch (error) {
      console.error('Error loading timeline:', error);
      // En caso de error, usar array vacío
      dispatch({ type: 'SET_TIMELINE', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'timeline', loading: false } });
    }
  }, []);

  const loadFormalRequests = useCallback(async (offerId: string) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'formalRequests', loading: true } });

    try {
      // Tabla offer_formal_requests no existe aún, usar datos mock por ahora
      const mockFormalRequests: OfferFormalRequest[] = [
        {
          id: 'request_1',
          offer_id: offerId,
          request_type: 'document_verification',
          title: 'Verificación de documentos',
          description: 'Se requiere verificación adicional de documentos de identidad',
          status: 'pending',
          priority: 'high',
          requested_by: user?.id || '',
          assigned_to: user?.id || '',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      dispatch({ type: 'SET_FORMAL_REQUESTS', payload: mockFormalRequests });
    } catch (error) {
      console.error('Error loading formal requests:', error);
      // En caso de error, usar array vacío
      dispatch({ type: 'SET_FORMAL_REQUESTS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'formalRequests', loading: false } });
    }
  }, [user]);

  const loadCommunications = useCallback(async (offerId: string) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'communications', loading: true } });

    try {
      // Usar la tabla real offer_communications
      const { data, error } = await supabase
        .from('offer_communications')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_COMMUNICATIONS', payload: data || [] });
    } catch (error) {
      console.error('Error loading communications:', error);
      // En caso de error, usar datos mock
      const mockCommunications: OfferCommunication[] = [
        {
          id: 'comm_1',
          offer_id: offerId,
          sender_id: user?.id || '',
          sender_name: 'Sistema',
          sender_role: 'admin',
          message_type: 'status_update',
          subject: 'Oferta actualizada',
          content: 'La oferta ha sido aceptada y está en proceso de revisión.',
          is_read: true,
          read_at: new Date().toISOString(),
          attachments: [],
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      dispatch({ type: 'SET_COMMUNICATIONS', payload: mockCommunications });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { key: 'communications', loading: false } });
    }
  }, [user]);

  // Cargar datos cuando cambia initialOfferId
  useEffect(() => {
    if (initialOfferId && user) {
      loadOfferData(initialOfferId);
    }
  }, [initialOfferId, user, loadOfferData]);

  // Command Manager
  const commandManager = useCommandManager({
    maxHistorySize: 50,
    enableLogging: true,
    onCommandExecuted: (command) => {
      console.log('✅ Comando ejecutado:', command.name);
    },
    onCommandUndone: (command) => {
      console.log('↩️ Comando deshecho:', command.name);
    },
    onError: (error, command) => {
      console.error('❌ Error en comando:', command?.name, error);
    }
  });

  // ========================================================================
  // ACCIONES MEMOIZADAS
  // ========================================================================

  const setOffer = useCallback((offer: SaleOffer) => {
    dispatch({ type: 'SET_OFFER', payload: offer });
  }, []);

  const setTasks = useCallback((tasks: OfferTask[]) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, []);

  const setDocuments = useCallback((documents: OfferDocument[]) => {
    dispatch({ type: 'SET_DOCUMENTS', payload: documents });
  }, []);

  const setTimeline = useCallback((timeline: OfferTimeline[]) => {
    dispatch({ type: 'SET_TIMELINE', payload: timeline });
  }, []);

  const setFormalRequests = useCallback((requests: OfferFormalRequest[]) => {
    dispatch({ type: 'SET_FORMAL_REQUESTS', payload: requests });
  }, []);

  const setCommunications = useCallback((communications: OfferCommunication[]) => {
    dispatch({ type: 'SET_COMMUNICATIONS', payload: communications });
  }, []);

  const setActiveTab = useCallback((tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setCurrentUserRole = useCallback((role: UserRole) => {
    dispatch({ type: 'SET_CURRENT_USER_ROLE', payload: role });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setLoadingState = useCallback((key: keyof OfferContextState['loadingStates'], loading: boolean) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key, loading } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ========================================================================
  // ACCIONES ASÍNCRONAS (IMPLEMENTACIÓN PLACEHOLDER)
  // ========================================================================

  const updateOfferStatus = useCallback(async (status: SaleOffer['status'], extraData?: any) => {
    if (!state.offer) return;

    const command = new UpdateOfferStatusCommand(
      state.offer.id,
      state.offer.status,
      status,
      extraData,
      'current-user-id', // TODO: Obtener del contexto de auth
      state.currentUserRole || undefined
    );

    await commandManager.executeCommand(command);
  }, [state.offer, state.currentUserRole, commandManager]);

  const addTimelineEvent = useCallback(async (eventData: any) => {
    // Esta función será implementada con la lógica real
    console.log('Adding timeline event:', eventData);
    // TODO: Implementar lógica real
  }, []);

  const createFormalRequest = useCallback(async (requestData: any) => {
    // Esta función será implementada con la lógica real
    console.log('Creating formal request:', requestData);
    // TODO: Implementar lógica real
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!state.offerId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await Promise.allSettled([
        loadTasks(state.offerId),
        loadDocuments(state.offerId),
        loadTimeline(state.offerId),
        loadFormalRequests(state.offerId),
        loadCommunications(state.offerId)
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.offerId, loadTasks, loadDocuments, loadTimeline, loadFormalRequests, loadCommunications]);

  const refreshDataSection = useCallback(async (section: keyof OfferContextState['loadingStates']) => {
    if (!state.offerId) return;

    dispatch({ type: 'SET_LOADING_STATE', payload: { key: section, loading: true } });

    try {
      switch (section) {
        case 'tasks':
          await loadTasks(state.offerId);
          break;
        case 'documents':
          await loadDocuments(state.offerId);
          break;
        case 'timeline':
          await loadTimeline(state.offerId);
          break;
        case 'formalRequests':
          await loadFormalRequests(state.offerId);
          break;
        case 'communications':
          await loadCommunications(state.offerId);
          break;
        default:
          console.warn(`Unknown section: ${section}`);
      }
    } catch (error) {
      console.error(`Error refreshing ${section}:`, error);
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { key: section, loading: false } });
    }
  }, [state.offerId, loadTasks, loadDocuments, loadTimeline, loadFormalRequests, loadCommunications]);

  // ========================================================================
  // CONTEXTO MEMOIZADO
  // ========================================================================

  const contextValue = useMemo<OfferContextType>(() => ({
    // Estado
    ...state,

    // Acciones
    setOffer,
    setTasks,
    setDocuments,
    setTimeline,
    setFormalRequests,
    setCommunications,
    setActiveTab,
    setCurrentUserRole,
    setLoading,
    setError,
    setLoadingState,
    updateOfferStatus,
    addTimelineEvent,
    createFormalRequest,
    refreshAllData,
    refreshDataSection,
    clearError,
    reset,

    // Command Manager
    commandManager: {
      canUndo: commandManager.canUndo,
      canRedo: commandManager.canRedo,
      isExecuting: commandManager.isExecuting,
      lastCommandName: commandManager.getLastCommand()?.name,
      commandHistoryLength: commandManager.getCommandHistory().length,
      executeCommand: commandManager.executeCommand,
      undo: commandManager.undo,
      redo: commandManager.redo,
      clearHistory: commandManager.clearHistory,
      exportHistory: commandManager.exportHistory
    }
  }), [
    state,
    setOffer,
    setTasks,
    setDocuments,
    setTimeline,
    setFormalRequests,
    setCommunications,
    setActiveTab,
    setCurrentUserRole,
    setLoading,
    setError,
    setLoadingState,
    updateOfferStatus,
    addTimelineEvent,
    createFormalRequest,
    refreshAllData,
    refreshDataSection,
    clearError,
    reset,
    commandManager
  ]);

  return (
    <OfferContext.Provider value={contextValue}>
      {children}
    </OfferContext.Provider>
  );
};
