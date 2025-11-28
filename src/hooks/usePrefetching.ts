import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface PrefetchConfig {
  enabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
  cacheTime?: number; // tiempo en ms para mantener en cache
  staleTime?: number; // tiempo en ms antes de considerar stale
}

interface PrefetchItem<T = any> {
  key: string;
  fetcher: () => Promise<T>;
  config: PrefetchConfig;
  data?: T;
  error?: Error;
  timestamp?: number;
  isLoading: boolean;
  isStale: boolean;
}

/**
 * Hook personalizado para prefetching inteligente de datos
 * Implementa estrategia de cache inteligente con invalidación automática
 */
export const usePrefetching = () => {
  const cacheRef = useRef<Map<string, PrefetchItem>>(new Map());
  const prefetchQueueRef = useRef<PrefetchItem[]>([]);
  const isProcessingRef = useRef(false);

  // Función para verificar si los datos están frescos
  const isDataFresh = useCallback((item: PrefetchItem, config: PrefetchConfig): boolean => {
    if (!item.timestamp) return false;

    const now = Date.now();
    const cacheTime = config.cacheTime || 5 * 60 * 1000; // 5 minutos por defecto
    const staleTime = config.staleTime || 30 * 1000; // 30 segundos por defecto

    const age = now - item.timestamp;
    item.isStale = age > staleTime;

    return age < cacheTime;
  }, []);

  // Función para obtener datos del cache
  const getCachedData = useCallback(<T>(key: string): PrefetchItem<T> | undefined => {
    return cacheRef.current.get(key) as PrefetchItem<T> | undefined;
  }, []);

  // Función para guardar datos en cache
  const setCachedData = useCallback(<T>(key: string, item: PrefetchItem<T>) => {
    cacheRef.current.set(key, item);
  }, []);

  // Función para limpiar cache expirado
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    cacheRef.current.forEach((item, key) => {
      const cacheTime = item.config.cacheTime || 5 * 60 * 1000;
      if (item.timestamp && (now - item.timestamp) > cacheTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => cacheRef.current.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Prefetch cache cleanup: removed ${keysToDelete.length} expired items`);
    }
  }, []);

  // Función para procesar la cola de prefetching
  const processPrefetchQueue = useCallback(async () => {
    if (isProcessingRef.current || prefetchQueueRef.current.length === 0) return;

    isProcessingRef.current = true;

    // Ordenar por prioridad
    const sortedQueue = [...prefetchQueueRef.current].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.config.priority || 'medium'] - priorityOrder[a.config.priority || 'medium'];
    });

    prefetchQueueRef.current = [];

    // Procesar items de alta prioridad primero
    const highPriorityItems = sortedQueue.filter(item => item.config.priority === 'high');
    const otherItems = sortedQueue.filter(item => item.config.priority !== 'high');

    // Procesar alta prioridad en paralelo
    await Promise.allSettled(
      highPriorityItems.map(async (item) => {
        try {
          item.isLoading = true;
          const data = await item.fetcher();
          item.data = data;
          item.timestamp = Date.now();
          item.isLoading = false;
          item.error = undefined;
          setCachedData(item.key, item);
          console.log(`✅ Prefetched (high priority): ${item.key}`);
        } catch (error) {
          item.error = error as Error;
          item.isLoading = false;
          console.warn(`❌ Prefetch failed: ${item.key}`, error);
        }
      })
    );

    // Procesar otros items secuencialmente para no sobrecargar
    for (const item of otherItems) {
      try {
        item.isLoading = true;
        const data = await item.fetcher();
        item.data = data;
        item.timestamp = Date.now();
        item.isLoading = false;
        item.error = undefined;
        setCachedData(item.key, item);
        console.log(`✅ Prefetched: ${item.key}`);
      } catch (error) {
        item.error = error as Error;
        item.isLoading = false;
        console.warn(`❌ Prefetch failed: ${item.key}`, error);
      }
    }

    isProcessingRef.current = false;
  }, [setCachedData]);

  // Función principal para prefetching
  const prefetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    config: PrefetchConfig = {}
  ): Promise<T | undefined> => {
    const { enabled = true } = config;

    if (!enabled) return undefined;

    // Verificar si ya está en cache y es fresco
    const cachedItem = getCachedData<T>(key);
    if (cachedItem && isDataFresh(cachedItem, config)) {
      console.log(`📋 Using cached data: ${key}`);
      return cachedItem.data;
    }

    // Si está cargando, esperar
    if (cachedItem?.isLoading) {
      console.log(`⏳ Waiting for prefetch: ${key}`);
      // En una implementación real, usaríamos un sistema de promesas
      return undefined;
    }

    // Crear item de prefetch
    const prefetchItem: PrefetchItem<T> = {
      key,
      fetcher,
      config,
      isLoading: false,
      isStale: false
    };

    // Agregar a cola para procesamiento
    prefetchQueueRef.current.push(prefetchItem);

    // Procesar cola
    setTimeout(() => processPrefetchQueue(), 0);

    return undefined;
  }, [getCachedData, isDataFresh, processPrefetchQueue]);

  // Función para obtener datos (con fallback a fetch si no está en cache)
  const getData = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    config: PrefetchConfig = {}
  ): Promise<T | undefined> => {
    // Intentar obtener del cache primero
    const cachedItem = getCachedData<T>(key);
    if (cachedItem && isDataFresh(cachedItem, config)) {
      return cachedItem.data;
    }

    // Si no está en cache o está stale, hacer fetch
    try {
      console.log(`🔄 Fetching fresh data: ${key}`);
      const data = await fetcher();

      // Guardar en cache
      const cacheItem: PrefetchItem<T> = {
        key,
        fetcher,
        config,
        data,
        timestamp: Date.now(),
        isLoading: false,
        isStale: false
      };
      setCachedData(key, cacheItem);

      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch: ${key}`, error);
      return undefined;
    }
  }, [getCachedData, isDataFresh, setCachedData]);

  // Función para invalidar cache específico
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
      console.log(`🗑️ Cache invalidated: ${key}`);
    } else {
      cacheRef.current.clear();
      console.log('🗑️ All cache invalidated');
    }
  }, []);

  // Función para precargar rutas críticas
  const prefetchCriticalRoutes = useCallback(async (offerId: string) => {
    console.log('🚀 Starting critical route prefetching for offer:', offerId);

    // Prefetch datos críticos de la oferta
    await prefetch(
      `offer-${offerId}`,
      async () => {
        const { data, error } = await supabase
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
        return data;
      },
      { priority: 'high', cacheTime: 10 * 60 * 1000 } // 10 minutos
    );

    // Prefetch estadísticas básicas
    await prefetch(
      `offer-stats-${offerId}`,
      async () => {
        const [tasksResult, documentsResult, communicationsResult] = await Promise.all([
          supabase.from('offer_tasks').select('status').eq('offer_id', offerId),
          supabase.from('offer_documents').select('status').eq('offer_id', offerId),
          supabase.from('offer_communications').select('id').eq('offer_id', offerId)
        ]);

        return {
          tasks: tasksResult.data?.length || 0,
          documents: documentsResult.data?.length || 0,
          communications: communicationsResult.data?.length || 0,
          pendingTasks: tasksResult.data?.filter(t => t.status === 'pendiente').length || 0,
          pendingDocuments: documentsResult.data?.filter(d => d.status === 'pendiente').length || 0
        };
      },
      { priority: 'high', cacheTime: 5 * 60 * 1000 } // 5 minutos
    );

    // Prefetch timeline reciente (últimos 10 eventos)
    await prefetch(
      `timeline-recent-${offerId}`,
      async () => {
        const { data, error } = await supabase
          .from('offer_timeline')
          .select('*')
          .eq('offer_id', offerId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return data;
      },
      { priority: 'medium', cacheTime: 2 * 60 * 1000 } // 2 minutos
    );

    console.log('✅ Critical route prefetching completed');
  }, [prefetch]);

  // Cleanup automático del cache
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupExpiredCache, 60 * 1000); // Cada minuto
    return () => clearInterval(cleanupInterval);
  }, [cleanupExpiredCache]);

  return {
    prefetch,
    getData,
    invalidateCache,
    prefetchCriticalRoutes,
    getCacheStats: () => ({
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys())
    })
  };
};



