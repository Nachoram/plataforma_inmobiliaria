/**
 * useOptimisticUpdates.ts
 *
 * Hook para implementar optimistic updates con rollback automático
 * Mejora la UX mostrando cambios inmediatos y manejando fallos gracefully
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

interface OptimisticOperation<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  rollbackData?: any;
}

interface OptimisticState<T = any> {
  data: T;
  pendingOperations: OptimisticOperation[];
  failedOperations: OptimisticOperation[];
  lastSync: number;
}

interface UseOptimisticUpdatesOptions<T> {
  initialData: T;
  onSync?: (operations: OptimisticOperation[]) => Promise<void>;
  onConflict?: (operation: OptimisticOperation, serverData: T) => T;
  autoSync?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  enableOfflineQueue?: boolean;
}

interface UseOptimisticUpdatesReturn<T> {
  // Estado
  data: T;
  isPending: boolean;
  hasFailedOperations: boolean;
  pendingCount: number;
  failedCount: number;

  // Operaciones optimistas
  optimisticUpdate: (
    operation: Omit<OptimisticOperation, 'id' | 'timestamp'>,
    rollbackFn?: () => void
  ) => Promise<void>;

  // Sincronización
  syncNow: () => Promise<void>;
  retryFailed: (operationId: string) => Promise<void>;
  clearFailed: (operationId?: string) => void;

  // Utilidades
  reset: () => void;
  isOperationPending: (operationId: string) => boolean;
  getPendingOperations: () => OptimisticOperation[];
  getFailedOperations: () => OptimisticOperation[];
}

/**
 * Hook principal para optimistic updates
 */
export const useOptimisticUpdates = <T,>({
  initialData,
  onSync,
  onConflict,
  autoSync = true,
  syncInterval = 30000, // 30 segundos
  maxRetries = 3,
  enableOfflineQueue = true
}: UseOptimisticUpdatesOptions<T>): UseOptimisticUpdatesReturn<T> => {

  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    pendingOperations: [],
    failedOperations: [],
    lastSync: Date.now()
  });

  // Refs para manejar timeouts y operaciones
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const operationCounterRef = useRef(0);

  /**
   * Generar ID único para operaciones
   */
  const generateOperationId = useCallback(() => {
    return `op_${Date.now()}_${++operationCounterRef.current}`;
  }, []);

  /**
   * Aplicar operación optimista al estado
   */
  const applyOptimisticUpdate = useCallback((operation: OptimisticOperation) => {
    setState(prevState => {
      let newData = prevState.data;

      // Aplicar la operación al data según el tipo
      switch (operation.type) {
        case 'update':
          newData = { ...prevState.data, ...operation.payload };
          break;

        case 'add':
          if (Array.isArray(prevState.data)) {
            newData = [...prevState.data, operation.payload] as T;
          }
          break;

        case 'remove':
          if (Array.isArray(prevState.data)) {
            newData = (prevState.data as any[]).filter(
              item => item.id !== operation.payload.id
            ) as T;
          }
          break;

        case 'replace':
          newData = operation.payload;
          break;

        default:
          console.warn('Unknown operation type:', operation.type);
      }

      return {
        ...prevState,
        data: newData,
        pendingOperations: [...prevState.pendingOperations, operation]
      };
    });
  }, []);

  /**
   * Actualizar operación optimista
   */
  const optimisticUpdate = useCallback(async (
    operation: Omit<OptimisticOperation, 'id' | 'timestamp'>,
    rollbackFn?: () => void
  ) => {
    const fullOperation: OptimisticOperation = {
      ...operation,
      id: generateOperationId(),
      timestamp: Date.now(),
      rollbackData: state.data // Guardar estado actual para rollback
    };

    // Aplicar cambio optimista inmediatamente
    applyOptimisticUpdate(fullOperation);

    // Mostrar feedback al usuario
    toast.loading(`Aplicando cambios...`, { id: fullOperation.id });

    try {
      // Intentar sincronizar inmediatamente
      if (onSync) {
        await onSync([fullOperation]);
      }

      // Remover de operaciones pendientes
      setState(prevState => ({
        ...prevState,
        pendingOperations: prevState.pendingOperations.filter(
          op => op.id !== fullOperation.id
        ),
        lastSync: Date.now()
      }));

      toast.success('Cambios aplicados correctamente', { id: fullOperation.id });

    } catch (error) {
      console.error('Optimistic update failed:', error);

      // Mover a operaciones fallidas
      setState(prevState => ({
        ...prevState,
        pendingOperations: prevState.pendingOperations.filter(
          op => op.id !== fullOperation.id
        ),
        failedOperations: [...prevState.failedOperations, {
          ...fullOperation,
          retryCount: 0
        }]
      }));

      // Rollback si hay función de rollback
      if (rollbackFn) {
        try {
          rollbackFn();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      toast.error(
        enableOfflineQueue
          ? 'Error al sincronizar. Los cambios se reintentarán automáticamente.'
          : 'Error al aplicar cambios. Por favor, inténtalo de nuevo.',
        { id: fullOperation.id }
      );
    }
  }, [state.data, generateOperationId, applyOptimisticUpdate, onSync, enableOfflineQueue]);

  /**
   * Sincronizar operaciones pendientes
   */
  const syncNow = useCallback(async () => {
    if (!onSync || state.pendingOperations.length === 0) return;

    try {
      await onSync(state.pendingOperations);

      setState(prevState => ({
        ...prevState,
        pendingOperations: [],
        lastSync: Date.now()
      }));

      toast.success('Sincronización completada');

    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Error al sincronizar cambios');

      // Mover operaciones fallidas
      setState(prevState => ({
        ...prevState,
        pendingOperations: [],
        failedOperations: [
          ...prevState.failedOperations,
          ...prevState.pendingOperations.map(op => ({ ...op, retryCount: 0 }))
        ]
      }));
    }
  }, [state.pendingOperations, onSync]);

  /**
   * Reintentar operación fallida
   */
  const retryFailed = useCallback(async (operationId: string) => {
    const failedOp = state.failedOperations.find(op => op.id === operationId);
    if (!failedOp || !onSync) return;

    try {
      await onSync([failedOp]);

      // Remover de operaciones fallidas
      setState(prevState => ({
        ...prevState,
        failedOperations: prevState.failedOperations.filter(
          op => op.id !== operationId
        ),
        lastSync: Date.now()
      }));

      toast.success('Operación sincronizada correctamente');

    } catch (error) {
      console.error('Retry failed:', error);

      // Incrementar contador de reintentos
      setState(prevState => ({
        ...prevState,
        failedOperations: prevState.failedOperations.map(op =>
          op.id === operationId
            ? { ...op, retryCount: (op.retryCount || 0) + 1 }
            : op
        )
      }));

      const newRetryCount = (failedOp.retryCount || 0) + 1;
      if (newRetryCount >= maxRetries) {
        toast.error('Máximo número de reintentos alcanzado');
      } else {
        toast.error(`Reintento fallido (${newRetryCount}/${maxRetries})`);
      }
    }
  }, [state.failedOperations, onSync, maxRetries]);

  /**
   * Limpiar operaciones fallidas
   */
  const clearFailed = useCallback((operationId?: string) => {
    setState(prevState => ({
      ...prevState,
      failedOperations: operationId
        ? prevState.failedOperations.filter(op => op.id !== operationId)
        : []
    }));
  }, []);

  /**
   * Resetear estado
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      pendingOperations: [],
      failedOperations: [],
      lastSync: Date.now()
    });
  }, [initialData]);

  /**
   * Verificar si operación está pendiente
   */
  const isOperationPending = useCallback((operationId: string) => {
    return state.pendingOperations.some(op => op.id === operationId);
  }, [state.pendingOperations]);

  /**
   * Obtener operaciones pendientes
   */
  const getPendingOperations = useCallback(() => {
    return state.pendingOperations;
  }, [state.pendingOperations]);

  /**
   * Obtener operaciones fallidas
   */
  const getFailedOperations = useCallback(() => {
    return state.failedOperations;
  }, [state.failedOperations]);

  // Auto-sync periódico
  useEffect(() => {
    if (autoSync && onSync) {
      const scheduleSync = () => {
        syncTimeoutRef.current = setTimeout(async () => {
          if (state.pendingOperations.length > 0) {
            await syncNow();
          }
          scheduleSync(); // Re-schedule
        }, syncInterval);
      };

      scheduleSync();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [autoSync, syncInterval, state.pendingOperations.length, syncNow, onSync]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    data: state.data,
    isPending: state.pendingOperations.length > 0,
    hasFailedOperations: state.failedOperations.length > 0,
    pendingCount: state.pendingOperations.length,
    failedCount: state.failedOperations.length,

    // Operaciones
    optimisticUpdate,

    // Sincronización
    syncNow,
    retryFailed,
    clearFailed,

    // Utilidades
    reset,
    isOperationPending,
    getPendingOperations,
    getFailedOperations
  };
};

/**
 * Hook específico para formularios con optimistic updates
 */
export const useOptimisticForm = <T extends { id?: string }>(
  initialData: T,
  options: {
    onSubmit?: (data: T) => Promise<T>;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    debounceMs?: number;
  } = {}
) => {
  const { onSubmit, onSuccess, onError, debounceMs = 500 } = options;

  const optimistic = useOptimisticUpdates({
    initialData,
    onSync: async (operations) => {
      if (onSubmit) {
        // Ejecutar la operación real
        const result = await onSubmit(operations[0].payload);
        onSuccess?.(result);
      }
    },
    autoSync: false, // Manual sync for forms
    enableOfflineQueue: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = useCallback(async (formData: T) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await optimistic.optimisticUpdate({
        type: 'update',
        payload: formData
      });

      // Ejecutar sync manual para forms
      await optimistic.syncNow();

    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [optimistic, isSubmitting, onError]);

  return {
    ...optimistic,
    isSubmitting,
    submitForm
  };
};

/**
 * Hook para listas con optimistic updates
 */
export const useOptimisticList = <T extends { id: string }>(
  initialItems: T[],
  options: {
    onAdd?: (item: Omit<T, 'id'>) => Promise<T>;
    onUpdate?: (id: string, updates: Partial<T>) => Promise<T>;
    onDelete?: (id: string) => Promise<void>;
    onReorder?: (items: T[]) => Promise<T[]>;
  } = {}
) => {
  const { onAdd, onUpdate, onDelete, onReorder } = options;

  const optimistic = useOptimisticUpdates({
    initialData: initialItems,
    onSync: async (operations) => {
      for (const operation of operations) {
        switch (operation.type) {
          case 'add':
            if (onAdd) await onAdd(operation.payload);
            break;
          case 'update':
            if (onUpdate && operation.payload.id) {
              await onUpdate(operation.payload.id, operation.payload);
            }
            break;
          case 'remove':
            if (onDelete && operation.payload.id) {
              await onDelete(operation.payload.id);
            }
            break;
          case 'reorder':
            if (onReorder) await onReorder(operation.payload);
            break;
        }
      }
    },
    enableOfflineQueue: true
  });

  const addItem = useCallback(async (item: Omit<T, 'id'>) => {
    await optimistic.optimisticUpdate({
      type: 'add',
      payload: item
    });
  }, [optimistic]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    await optimistic.optimisticUpdate({
      type: 'update',
      payload: { id, ...updates }
    });
  }, [optimistic]);

  const removeItem = useCallback(async (id: string) => {
    await optimistic.optimisticUpdate({
      type: 'remove',
      payload: { id }
    });
  }, [optimistic]);

  const reorderItems = useCallback(async (items: T[]) => {
    await optimistic.optimisticUpdate({
      type: 'reorder',
      payload: items
    });
  }, [optimistic]);

  return {
    ...optimistic,
    items: optimistic.data,
    addItem,
    updateItem,
    removeItem,
    reorderItems
  };
};
