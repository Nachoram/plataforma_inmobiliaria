/**
 * useAdvancedCaching.ts
 *
 * Hook avanzado para estrategias de caching inteligente
 * Incluye cache predictivo, stale-while-revalidate, y gestión automática
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  etag?: string;
  version: string;
  metadata?: {
    size?: number;
    dependencies?: string[];
    priority?: 'low' | 'medium' | 'high';
  };
}

interface CacheConfig {
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
  ttl?: number; // Time to live in milliseconds
  maxAge?: number; // Max age for stale-while-revalidate
  enableBackgroundRefresh?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[]; // Other cache keys this depends on
  enableCompression?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

interface UseAdvancedCachingOptions {
  namespace?: string;
  defaultStrategy?: CacheConfig['strategy'];
  maxSize?: number; // Max cache size in bytes
  enableStats?: boolean;
  enableCompression?: boolean;
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
  onEviction?: (key: string) => void;
}

interface UseAdvancedCachingReturn {
  // Cache operations
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, data: T, config?: Partial<CacheConfig>) => Promise<void>;
  invalidate: (key: string) => Promise<void>;
  invalidatePattern: (pattern: string) => Promise<void>;
  clear: () => Promise<void>;

  // Bulk operations
  getMultiple: <T>(keys: string[]) => Promise<Record<string, T>>;
  setMultiple: (entries: Record<string, { data: any; config?: Partial<CacheConfig> }>) => Promise<void>;

  // Cache management
  preload: (keys: string[]) => Promise<void>;
  prefetch: (keys: string[], priority?: 'low' | 'medium' | 'high') => void;
  warm: (key: string, fetcher: () => Promise<any>) => Promise<void>;

  // Stats and monitoring
  stats: CacheStats;
  resetStats: () => void;
  getCacheInfo: () => Promise<{
    entries: number;
    size: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  }>;

  // Reactive cache
  subscribe: (key: string, callback: (data: any) => void) => () => void;
  notifySubscribers: (key: string, data: any) => void;
}

/**
 * Hook principal para caching avanzado
 */
export const useAdvancedCaching = (options: UseAdvancedCachingOptions = {}): UseAdvancedCachingReturn => {
  const {
    namespace = 'app-cache',
    defaultStrategy = 'stale-while-revalidate',
    maxSize = 50 * 1024 * 1024, // 50MB
    enableStats = true,
    enableCompression = false,
    onCacheHit,
    onCacheMiss,
    onEviction
  } = options;

  // Estado del cache
  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0
  });

  // Refs para gestión interna
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const prefetchQueueRef = useRef<Map<string, { priority: number; timestamp: number }>>(new Map());

  // Versionado del cache
  const cacheVersion = useMemo(() => `v${Date.now()}`, []);

  /**
   * Generar clave de cache con namespace
   */
  const getCacheKey = useCallback((key: string) => `${namespace}:${key}`, [namespace]);

  /**
   * Comprimir datos si está habilitado
   */
  const compressData = useCallback(async (data: any): Promise<any> => {
    if (!enableCompression) return data;

    try {
      // Simple compression using JSON.stringify + base64
      const jsonString = JSON.stringify(data);
      const compressed = btoa(jsonString);
      return { __compressed: true, data: compressed };
    } catch {
      return data;
    }
  }, [enableCompression]);

  /**
   * Descomprimir datos
   */
  const decompressData = useCallback((data: any): any => {
    if (data?.__compressed) {
      try {
        const decompressed = atob(data.data);
        return JSON.parse(decompressed);
      } catch {
        return data;
      }
    }
    return data;
  }, []);

  /**
   * Calcular tamaño de entrada
   */
  const calculateSize = useCallback((data: any): number => {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate in bytes
    } catch {
      return 0;
    }
  }, []);

  /**
   * Verificar si entrada está expirada
   */
  const isExpired = useCallback((entry: CacheEntry): boolean => {
    if (!entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }, []);

  /**
   * Evitar entradas expiradas del cache
   */
  const evictExpiredEntries = useCallback(async () => {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of cacheRef.current) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      cacheRef.current.delete(key);
      onEviction?.(key);
    });

    if (expiredKeys.length > 0) {
      setStats(prev => ({
        ...prev,
        evictions: prev.evictions + expiredKeys.length
      }));
    }
  }, [onEviction]);

  /**
   * Gestionar tamaño del cache (LRU eviction)
   */
  const enforceSizeLimit = useCallback(async () => {
    let totalSize = 0;
    const entries: Array<{ key: string; entry: CacheEntry; lastAccessed: number }> = [];

    // Calcular tamaño total y ordenar por último acceso
    for (const [key, entry] of cacheRef.current) {
      const size = calculateSize(entry);
      totalSize += size;
      entries.push({
        key,
        entry,
        lastAccessed: entry.metadata?.lastAccessed || entry.timestamp
      });
    }

    // Evict entries if over limit (LRU)
    if (totalSize > maxSize) {
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

      let evictedSize = 0;
      const toEvict: string[] = [];

      for (const { key, entry } of entries) {
        if (totalSize - evictedSize <= maxSize * 0.8) break; // Keep 80% of max size

        const size = calculateSize(entry);
        evictedSize += size;
        toEvict.push(key);
      }

      toEvict.forEach(key => {
        cacheRef.current.delete(key);
        onEviction?.(key);
      });

      setStats(prev => ({
        ...prev,
        evictions: prev.evictions + toEvict.length,
        size: Math.max(0, prev.size - evictedSize)
      }));
    }
  }, [maxSize, calculateSize, onEviction]);

  /**
   * Obtener entrada del cache
   */
  const get = useCallback(async <T>(key: string): Promise<T | null> => {
    const cacheKey = getCacheKey(key);
    const entry = cacheRef.current.get(cacheKey);

    if (!entry) {
      if (enableStats) {
        setStats(prev => ({
          ...prev,
          misses: prev.misses + 1,
          hitRate: prev.hits / (prev.hits + prev.misses + 1)
        }));
      }
      onCacheMiss?.(key);
      return null;
    }

    if (isExpired(entry)) {
      cacheRef.current.delete(cacheKey);
      if (enableStats) {
        setStats(prev => ({
          ...prev,
          misses: prev.misses + 1,
          evictions: prev.evictions + 1,
          hitRate: prev.hits / (prev.hits + prev.misses + 1)
        }));
      }
      onCacheMiss?.(key);
      return null;
    }

    // Update last accessed
    entry.metadata = { ...entry.metadata, lastAccessed: Date.now };

    if (enableStats) {
      setStats(prev => ({
        ...prev,
        hits: prev.hits + 1,
        hitRate: (prev.hits + 1) / (prev.hits + prev.misses + 1)
      }));
    }

    onCacheHit?.(key);
    return decompressData(entry.data) as T;
  }, [getCacheKey, isExpired, enableStats, decompressData, onCacheHit, onCacheMiss]);

  /**
   * Establecer entrada en cache
   */
  const set = useCallback(async <T>(
    key: string,
    data: T,
    config: Partial<CacheConfig> = {}
  ): Promise<void> => {
    const cacheKey = getCacheKey(key);
    const compressedData = await compressData(data);
    const size = calculateSize(compressedData);

    const entry: CacheEntry<T> = {
      data: compressedData,
      timestamp: Date.now(),
      version: cacheVersion,
      metadata: {
        size,
        dependencies: config.dependencies,
        priority: config.priority || 'medium',
        lastAccessed: Date.now()
      }
    };

    // Set expiration
    if (config.ttl) {
      entry.expiresAt = Date.now() + config.ttl;
    }

    cacheRef.current.set(cacheKey, entry);

    // Update stats
    if (enableStats) {
      setStats(prev => ({
        ...prev,
        size: prev.size + size
      }));
    }

    // Enforce size limits
    await enforceSizeLimit();

    // Notify subscribers
    notifySubscribers(key, data);
  }, [getCacheKey, compressData, calculateSize, cacheVersion, enableStats, enforceSizeLimit]);

  /**
   * Invalidar entrada específica
   */
  const invalidate = useCallback(async (key: string): Promise<void> => {
    const cacheKey = getCacheKey(key);
    const entry = cacheRef.current.get(cacheKey);

    if (entry) {
      cacheRef.current.delete(cacheKey);

      if (enableStats) {
        setStats(prev => ({
          ...prev,
          size: Math.max(0, prev.size - (entry.metadata?.size || 0))
        }));
      }
    }
  }, [getCacheKey, enableStats]);

  /**
   * Invalidar entradas por patrón
   */
  const invalidatePattern = useCallback(async (pattern: string): Promise<void> => {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    let sizeFreed = 0;

    for (const [key, entry] of cacheRef.current) {
      if (regex.test(key)) {
        keysToDelete.push(key);
        sizeFreed += entry.metadata?.size || 0;
      }
    }

    keysToDelete.forEach(key => {
      cacheRef.current.delete(key);
    });

    if (enableStats && keysToDelete.length > 0) {
      setStats(prev => ({
        ...prev,
        size: Math.max(0, prev.size - sizeFreed)
      }));
    }
  }, [enableStats]);

  /**
   * Limpiar todo el cache
   */
  const clear = useCallback(async (): Promise<void> => {
    cacheRef.current.clear();
    setStats(prev => ({ ...prev, size: 0, evictions: prev.evictions + prev.hits + prev.misses }));
  }, []);

  /**
   * Obtener múltiples entradas
   */
  const getMultiple = useCallback(async <T>(keys: string[]): Promise<Record<string, T>> => {
    const results: Record<string, T> = {};

    await Promise.all(
      keys.map(async (key) => {
        const value = await get<T>(key);
        if (value !== null) {
          results[key] = value;
        }
      })
    );

    return results;
  }, [get]);

  /**
   * Establecer múltiples entradas
   */
  const setMultiple = useCallback(async (
    entries: Record<string, { data: any; config?: Partial<CacheConfig> }>
  ): Promise<void> => {
    await Promise.all(
      Object.entries(entries).map(([key, { data, config }]) =>
        set(key, data, config)
      )
    );
  }, [set]);

  /**
   * Precargar entradas
   */
  const preload = useCallback(async (keys: string[]): Promise<void> => {
    // Implementation would fetch and cache data for given keys
    console.log('Preloading keys:', keys);
  }, []);

  /**
   * Prefetch con prioridad
   */
  const prefetch = useCallback((
    keys: string[],
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void => {
    const priorityValue = { low: 1, medium: 2, high: 3 }[priority];
    const timestamp = Date.now();

    keys.forEach(key => {
      prefetchQueueRef.current.set(key, { priority: priorityValue, timestamp });
    });
  }, []);

  /**
   * Warm up cache entry
   */
  const warm = useCallback(async (
    key: string,
    fetcher: () => Promise<any>
  ): Promise<void> => {
    try {
      const data = await fetcher();
      await set(key, data);
    } catch (error) {
      console.warn('Failed to warm cache for key:', key, error);
    }
  }, [set]);

  /**
   * Reset stats
   */
  const resetStats = useCallback(() => {
    setStats({
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0
    });
  }, []);

  /**
   * Obtener información del cache
   */
  const getCacheInfo = useCallback(async () => {
    const entries = cacheRef.current.size;
    let oldestEntry = Infinity;
    let newestEntry = 0;

    for (const entry of cacheRef.current.values()) {
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    }

    return {
      entries,
      size: stats.size,
      hitRate: stats.hitRate,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
      newestEntry
    };
  }, [stats.size, stats.hitRate]);

  /**
   * Sistema de suscripción reactivo
   */
  const subscribe = useCallback((
    key: string,
    callback: (data: any) => void
  ): (() => void) => {
    const cacheKey = getCacheKey(key);

    if (!subscribersRef.current.has(cacheKey)) {
      subscribersRef.current.set(cacheKey, new Set());
    }

    subscribersRef.current.get(cacheKey)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(cacheKey);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(cacheKey);
        }
      }
    };
  }, [getCacheKey]);

  /**
   * Notificar a suscriptores
   */
  const notifySubscribers = useCallback((key: string, data: any) => {
    const cacheKey = getCacheKey(key);
    const subscribers = subscribersRef.current.get(cacheKey);

    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in cache subscriber:', error);
        }
      });
    }
  }, [getCacheKey]);

  // Cleanup periódico
  useEffect(() => {
    const cleanup = async () => {
      await evictExpiredEntries();
      await enforceSizeLimit();
    };

    // Cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);

    // Initial cleanup
    cleanup();

    return () => clearInterval(interval);
  }, [evictExpiredEntries, enforceSizeLimit]);

  return {
    // Cache operations
    get,
    set,
    invalidate,
    invalidatePattern,
    clear,

    // Bulk operations
    getMultiple,
    setMultiple,

    // Cache management
    preload,
    prefetch,
    warm,

    // Stats and monitoring
    stats,
    resetStats,
    getCacheInfo,

    // Reactive cache
    subscribe,
    notifySubscribers
  };
};

/**
 * Hook para estrategias específicas de cache
 */
export const useCacheStrategy = (
  strategy: CacheConfig['strategy'],
  options?: UseAdvancedCachingOptions
) => {
  const cache = useAdvancedCaching(options);

  const executeStrategy = useCallback(async (
    key: string,
    fetcher: () => Promise<any>,
    config?: Partial<CacheConfig>
  ) => {
    const finalConfig = { strategy, ...config };

    switch (strategy) {
      case 'cache-first':
        let cached = await cache.get(key);
        if (cached !== null) return cached;

        cached = await fetcher();
        await cache.set(key, cached, finalConfig);
        return cached;

      case 'network-first':
        try {
          const fresh = await fetcher();
          await cache.set(key, fresh, finalConfig);
          return fresh;
        } catch (error) {
          const cached = await cache.get(key);
          if (cached !== null) return cached;
          throw error;
        }

      case 'stale-while-revalidate':
        const cached = await cache.get(key);
        if (cached !== null) {
          // Revalidate in background
          fetcher().then(fresh => cache.set(key, fresh, finalConfig)).catch(console.warn);
          return cached;
        }

        const fresh = await fetcher();
        await cache.set(key, fresh, finalConfig);
        return fresh;

      case 'cache-only':
        const cachedOnly = await cache.get(key);
        if (cachedOnly === null) {
          throw new Error('Cache miss in cache-only mode');
        }
        return cachedOnly;

      case 'network-only':
        const networkOnly = await fetcher();
        await cache.set(key, networkOnly, finalConfig);
        return networkOnly;

      default:
        throw new Error(`Unknown cache strategy: ${strategy}`);
    }
  }, [strategy, cache]);

  return {
    ...cache,
    executeStrategy
  };
};



