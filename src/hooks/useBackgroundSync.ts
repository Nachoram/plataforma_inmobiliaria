/**
 * useBackgroundSync.ts
 *
 * Hook para manejar sincronización en background de operaciones offline
 * Integra con Service Worker y IndexedDB para persistencia
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: SyncOperation[];
  lastSyncTime: number | null;
  failedOperations: SyncOperation[];
  syncQueueLength: number;
}

interface UseBackgroundSyncOptions {
  onSyncSuccess?: (operation: SyncOperation) => void;
  onSyncError?: (operation: SyncOperation, error: Error) => void;
  onQueueChange?: (queueLength: number) => void;
  autoSync?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  enableServiceWorker?: boolean;
}

interface UseBackgroundSyncReturn {
  // Estado
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime: number | null;

  // Operaciones
  addToQueue: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  syncNow: () => Promise<void>;
  retryFailed: (operationId: string) => Promise<void>;
  clearFailed: (operationId?: string) => void;
  clearQueue: () => Promise<void>;

  // Utilidades
  getQueueStatus: () => Promise<{
    pending: SyncOperation[];
    failed: SyncOperation[];
    total: number;
  }>;
  isOperationPending: (endpoint: string, type: string) => boolean;
}

/**
 * Hook principal para background sync
 */
export const useBackgroundSync = (options: UseBackgroundSyncOptions = {}): UseBackgroundSyncReturn => {
  const {
    onSyncSuccess,
    onSyncError,
    onQueueChange,
    autoSync = true,
    syncInterval = 60000, // 1 minuto
    maxRetries = 5,
    enableServiceWorker = true
  } = options;

  const [state, setState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: [],
    lastSyncTime: null,
    failedOperations: [],
    syncQueueLength: 0
  });

  // Refs
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  /**
   * Inicializar el hook
   */
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      // Cargar operaciones pendientes desde almacenamiento local
      const storedOperations = await loadStoredOperations();
      const storedFailed = await loadStoredFailedOperations();

      setState(prevState => ({
        ...prevState,
        pendingOperations: storedOperations,
        failedOperations: storedFailed,
        syncQueueLength: storedOperations.length + storedFailed.length
      }));

      onQueueChange?.(storedOperations.length + storedFailed.length);

    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }, [onQueueChange]);

  /**
   * Agregar operación a la cola
   */
  const addToQueue = useCallback(async (
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    const fullOperation: SyncOperation = {
      ...operation,
      id: generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    try {
      // Agregar a estado local
      setState(prevState => ({
        ...prevState,
        pendingOperations: [...prevState.pendingOperations, fullOperation],
        syncQueueLength: prevState.syncQueueLength + 1
      }));

      // Persistir en almacenamiento local
      await storeOperation(fullOperation);

      // Notificar cambio en cola
      onQueueChange?.(state.syncQueueLength + 1);

      // Intentar sync inmediato si está online
      if (state.isOnline && autoSync) {
        setTimeout(() => syncNow(), 1000);
      }

      console.log('✅ Operation added to sync queue:', fullOperation.id);

    } catch (error) {
      console.error('Failed to add operation to queue:', error);
      toast.error('Error al agregar operación a la cola de sincronización');
    }
  }, [state.isOnline, autoSync, maxRetries, onQueueChange, state.syncQueueLength]);

  /**
   * Ejecutar sincronización ahora
   */
  const syncNow = useCallback(async () => {
    if (state.isSyncing || (!state.isOnline && !enableServiceWorker)) {
      return;
    }

    setState(prevState => ({ ...prevState, isSyncing: true }));

    try {
      console.log('🔄 Starting background sync...');

      // Obtener operaciones pendientes
      const operationsToSync = [...state.pendingOperations];

      if (operationsToSync.length === 0) {
        console.log('✅ No operations to sync');
        setState(prevState => ({ ...prevState, isSyncing: false }));
        return;
      }

      // Procesar operaciones por lotes para mejor rendimiento
      const batchSize = 5;
      const results = [];

      for (let i = 0; i < operationsToSync.length; i += batchSize) {
        const batch = operationsToSync.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(operation => processOperation(operation))
        );
        results.push(...batchResults);
      }

      // Procesar resultados
      const successful: SyncOperation[] = [];
      const failed: SyncOperation[] = [];

      results.forEach((result, index) => {
        const operation = operationsToSync[index];

        if (result.status === 'fulfilled') {
          successful.push(operation);
          onSyncSuccess?.(operation);
        } else {
          const failedOperation = {
            ...operation,
            retryCount: operation.retryCount + 1
          };

          if (failedOperation.retryCount < failedOperation.maxRetries) {
            // Re-agregar para reintento
            failed.push(failedOperation);
          } else {
            // Máximo de reintentos alcanzado
            setState(prevState => ({
              ...prevState,
              failedOperations: [...prevState.failedOperations, failedOperation]
            }));
          }

          onSyncError?.(operation, result.reason);
        }
      });

      // Actualizar estado
      const newPendingOperations = state.pendingOperations.filter(
        op => !successful.some(successOp => successOp.id === op.id) &&
             !failed.some(failedOp => failedOp.id === op.id)
      );

      // Re-agregar operaciones que fallaron pero pueden reintentarse
      const retryOperations = failed.filter(op => op.retryCount < op.maxRetries);

      const finalPendingOperations = [...newPendingOperations, ...retryOperations];

      setState(prevState => ({
        ...prevState,
        pendingOperations: finalPendingOperations,
        lastSyncTime: Date.now(),
        isSyncing: false,
        syncQueueLength: finalPendingOperations.length + prevState.failedOperations.length + failed.length
      }));

      // Persistir cambios
      await Promise.all([
        ...successful.map(op => removeStoredOperation(op.id)),
        ...retryOperations.map(op => updateStoredOperation(op)),
        ...failed.filter(op => op.retryCount >= op.maxRetries).map(op => storeFailedOperation(op))
      ]);

      // Notificar resultados
      if (successful.length > 0) {
        toast.success(`${successful.length} operaciones sincronizadas correctamente`);
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} operaciones fallaron y serán reintentadas`);
      }

      onQueueChange?.(finalPendingOperations.length + state.failedOperations.length);

      console.log(`✅ Sync completed: ${successful.length} success, ${failed.length} failed`);

    } catch (error) {
      console.error('Background sync failed:', error);
      setState(prevState => ({ ...prevState, isSyncing: false }));
      toast.error('Error en la sincronización en background');
    }
  }, [state.isSyncing, state.isOnline, state.pendingOperations, enableServiceWorker, onSyncSuccess, onSyncError, onQueueChange, state.failedOperations.length]);

  /**
   * Procesar una operación individual
   */
  const processOperation = useCallback(async (operation: SyncOperation): Promise<void> => {
    const { endpoint, type, payload } = operation;

    let method: string;
    let url = endpoint;
    let body: any = null;

    // Determinar método HTTP basado en tipo de operación
    switch (type) {
      case 'create':
        method = 'POST';
        body = payload;
        break;
      case 'update':
        method = 'PUT';
        url = `${endpoint}/${payload.id}`;
        body = payload;
        break;
      case 'delete':
        method = 'DELETE';
        url = `${endpoint}/${payload.id}`;
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }

    // Ejecutar petición
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  /**
   * Reintentar operación fallida
   */
  const retryFailed = useCallback(async (operationId: string) => {
    const failedOp = state.failedOperations.find(op => op.id === operationId);
    if (!failedOp) return;

    // Mover de failed a pending
    setState(prevState => ({
      ...prevState,
      failedOperations: prevState.failedOperations.filter(op => op.id !== operationId),
      pendingOperations: [...prevState.pendingOperations, { ...failedOp, retryCount: 0 }]
    }));

    // Remover de failed storage y agregar a pending
    await Promise.all([
      removeStoredFailedOperation(operationId),
      storeOperation({ ...failedOp, retryCount: 0 })
    ]);

    // Intentar sync
    setTimeout(() => syncNow(), 1000);
  }, [state.failedOperations, syncNow]);

  /**
   * Limpiar operaciones fallidas
   */
  const clearFailed = useCallback(async (operationId?: string) => {
    if (operationId) {
      setState(prevState => ({
        ...prevState,
        failedOperations: prevState.failedOperations.filter(op => op.id !== operationId)
      }));
      await removeStoredFailedOperation(operationId);
    } else {
      setState(prevState => ({
        ...prevState,
        failedOperations: []
      }));
      await clearStoredFailedOperations();
    }
  }, []);

  /**
   * Limpiar cola de operaciones pendientes
   */
  const clearQueue = useCallback(async () => {
    setState(prevState => ({
      ...prevState,
      pendingOperations: [],
      syncQueueLength: prevState.failedOperations.length
    }));

    await clearStoredOperations();
    onQueueChange?.(state.failedOperations.length);
  }, [onQueueChange, state.failedOperations.length]);

  /**
   * Obtener estado de la cola
   */
  const getQueueStatus = useCallback(async () => {
    const pending = await loadStoredOperations();
    const failed = await loadStoredFailedOperations();

    return {
      pending,
      failed,
      total: pending.length + failed.length
    };
  }, []);

  /**
   * Verificar si una operación está pendiente
   */
  const isOperationPending = useCallback((endpoint: string, type: string) => {
    return state.pendingOperations.some(
      op => op.endpoint === endpoint && op.type === type
    );
  }, [state.pendingOperations]);

  // Efectos
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-sync periódico
  useEffect(() => {
    if (autoSync && state.isOnline) {
      const scheduleSync = () => {
        syncTimeoutRef.current = setTimeout(() => {
          if (state.pendingOperations.length > 0) {
            syncNow();
          }
          scheduleSync();
        }, syncInterval);
      };

      scheduleSync();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [autoSync, state.isOnline, state.pendingOperations.length, syncNow, syncInterval]);

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setState(prevState => ({ ...prevState, isOnline: true }));
      // Intentar sync cuando vuelva la conexión
      if (state.pendingOperations.length > 0) {
        setTimeout(() => syncNow(), 2000);
      }
    };

    const handleOffline = () => {
      setState(prevState => ({ ...prevState, isOnline: false }));
      toast('Conexión perdida. Los cambios se sincronizarán cuando vuelvas online.', {
        duration: 4000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.pendingOperations.length, syncNow]);

  return {
    // Estado
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    pendingCount: state.pendingOperations.length,
    failedCount: state.failedOperations.length,
    lastSyncTime: state.lastSyncTime,

    // Operaciones
    addToQueue,
    syncNow,
    retryFailed,
    clearFailed,
    clearQueue,

    // Utilidades
    getQueueStatus,
    isOperationPending
  };
};

/**
 * Utilidades de almacenamiento (simuladas - en producción usar IndexedDB)
 */
const generateOperationId = (): string => {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getAuthToken = (): string => {
  return localStorage.getItem('auth_token') || '';
};

// Funciones de almacenamiento (simuladas)
const loadStoredOperations = async (): Promise<SyncOperation[]> => {
  try {
    const stored = localStorage.getItem('sync_pending_operations');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeOperation = async (operation: SyncOperation): Promise<void> => {
  const operations = await loadStoredOperations();
  operations.push(operation);
  localStorage.setItem('sync_pending_operations', JSON.stringify(operations));
};

const updateStoredOperation = async (operation: SyncOperation): Promise<void> => {
  const operations = await loadStoredOperations();
  const index = operations.findIndex(op => op.id === operation.id);
  if (index !== -1) {
    operations[index] = operation;
    localStorage.setItem('sync_pending_operations', JSON.stringify(operations));
  }
};

const removeStoredOperation = async (id: string): Promise<void> => {
  const operations = await loadStoredOperations();
  const filtered = operations.filter(op => op.id !== id);
  localStorage.setItem('sync_pending_operations', JSON.stringify(filtered));
};

const clearStoredOperations = async (): Promise<void> => {
  localStorage.removeItem('sync_pending_operations');
};

const loadStoredFailedOperations = async (): Promise<SyncOperation[]> => {
  try {
    const stored = localStorage.getItem('sync_failed_operations');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeFailedOperation = async (operation: SyncOperation): Promise<void> => {
  const operations = await loadStoredFailedOperations();
  operations.push(operation);
  localStorage.setItem('sync_failed_operations', JSON.stringify(operations));
};

const removeStoredFailedOperation = async (id: string): Promise<void> => {
  const operations = await loadStoredFailedOperations();
  const filtered = operations.filter(op => op.id !== id);
  localStorage.setItem('sync_failed_operations', JSON.stringify(filtered));
};

const clearStoredFailedOperations = async (): Promise<void> => {
  localStorage.removeItem('sync_failed_operations');
};


