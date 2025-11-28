import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  // Tiempos de carga
  offerLoadTime: number;
  documentsLoadTime: number;
  communicationsLoadTime: number;
  totalLoadTime: number;

  // Métricas de cache
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;

  // Contadores de operaciones
  apiCalls: number;
  errors: number;
  retries: number;

  // Métricas de usuario
  tabSwitches: number;
  refreshActions: number;

  // Timestamp
  sessionStart: number;
  lastActivity: number;
}

export interface PerformanceEvent {
  type: 'load' | 'cache' | 'error' | 'user_action' | 'api_call';
  action: string;
  duration?: number;
  success?: boolean;
  metadata?: Record<string, any>;
  timestamp: number;
}

class OfferPerformanceMonitor {
  private metrics: PerformanceMetrics;
  private events: PerformanceEvent[] = [];
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor() {
    this.metrics = {
      offerLoadTime: 0,
      documentsLoadTime: 0,
      communicationsLoadTime: 0,
      totalLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      apiCalls: 0,
      errors: 0,
      retries: 0,
      tabSwitches: 0,
      refreshActions: 0,
      sessionStart: Date.now(),
      lastActivity: Date.now()
    };
  }

  // Registrar tiempo de carga
  recordLoadTime(type: 'offer' | 'documents' | 'communications' | 'total', duration: number) {
    switch (type) {
      case 'offer':
        this.metrics.offerLoadTime = duration;
        break;
      case 'documents':
        this.metrics.documentsLoadTime = duration;
        break;
      case 'communications':
        this.metrics.communicationsLoadTime = duration;
        break;
      case 'total':
        this.metrics.totalLoadTime = duration;
        break;
    }

    this.addEvent('load', `load_${type}`, duration, true, { duration });
    this.notifyListeners();
  }

  // Registrar uso de cache
  recordCacheAccess(hit: boolean) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    this.metrics.cacheHitRate = this.metrics.cacheHits /
      (this.metrics.cacheHits + this.metrics.cacheMisses);

    this.addEvent('cache', hit ? 'cache_hit' : 'cache_miss', undefined, hit);
    this.notifyListeners();
  }

  // Registrar llamadas API
  recordApiCall(success: boolean = true) {
    this.metrics.apiCalls++;
    if (!success) {
      this.metrics.errors++;
    }

    this.addEvent('api_call', 'api_request', undefined, success);
    this.notifyListeners();
  }

  // Registrar errores
  recordError(error: Error, context?: string) {
    this.metrics.errors++;
    this.addEvent('error', 'error_occurred', undefined, false, {
      message: error.message,
      context,
      stack: error.stack
    });
    this.notifyListeners();
  }

  // Registrar reintentos
  recordRetry() {
    this.metrics.retries++;
    this.addEvent('user_action', 'retry_attempt');
    this.notifyListeners();
  }

  // Registrar cambio de pestaña
  recordTabSwitch(fromTab: string, toTab: string) {
    this.metrics.tabSwitches++;
    this.addEvent('user_action', 'tab_switch', undefined, true, { fromTab, toTab });
    this.updateLastActivity();
    this.notifyListeners();
  }

  // Registrar acción de refresh
  recordRefresh() {
    this.metrics.refreshActions++;
    this.addEvent('user_action', 'manual_refresh');
    this.updateLastActivity();
    this.notifyListeners();
  }

  // Actualizar última actividad
  private updateLastActivity() {
    this.metrics.lastActivity = Date.now();
  }

  // Agregar evento
  private addEvent(
    type: PerformanceEvent['type'],
    action: string,
    duration?: number,
    success: boolean = true,
    metadata?: Record<string, any>
  ) {
    this.events.push({
      type,
      action,
      duration,
      success,
      metadata,
      timestamp: Date.now()
    });

    // Mantener solo los últimos 100 eventos
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  // Obtener métricas actuales
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Obtener eventos recientes
  getRecentEvents(count: number = 10): PerformanceEvent[] {
    return this.events.slice(-count);
  }

  // Resetear métricas
  reset() {
    this.metrics = {
      offerLoadTime: 0,
      documentsLoadTime: 0,
      communicationsLoadTime: 0,
      totalLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      apiCalls: 0,
      errors: 0,
      retries: 0,
      tabSwitches: 0,
      refreshActions: 0,
      sessionStart: Date.now(),
      lastActivity: Date.now()
    };
    this.events = [];
    this.notifyListeners();
  }

  // Suscribirse a cambios de métricas
  subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }

  // Obtener estadísticas de rendimiento
  getPerformanceStats() {
    const metrics = this.getMetrics();
    const sessionDuration = Date.now() - metrics.sessionStart;

    return {
      ...metrics,
      sessionDuration,
      averageLoadTime: metrics.totalLoadTime > 0 ? metrics.totalLoadTime / 3 : 0,
      errorRate: metrics.apiCalls > 0 ? (metrics.errors / metrics.apiCalls) * 100 : 0,
      eventsCount: this.events.length
    };
  }
}

// Singleton instance
const performanceMonitor = new OfferPerformanceMonitor();

// Hook personalizado para monitoreo de rendimiento
export const useOfferPerformance = () => {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  const loadStartRef = useRef<Record<string, number>>({});

  // Suscribirse a cambios de métricas
  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  // Funciones para medir tiempos de carga
  const startLoadTimer = useCallback((type: string) => {
    loadStartRef.current[type] = Date.now();
  }, []);

  const endLoadTimer = useCallback((type: 'offer' | 'documents' | 'communications' | 'total') => {
    const startTime = loadStartRef.current[type];
    if (startTime) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordLoadTime(type, duration);
      delete loadStartRef.current[type];
    }
  }, []);

  // Funciones para registrar eventos
  const recordCacheAccess = useCallback((hit: boolean) => {
    performanceMonitor.recordCacheAccess(hit);
  }, []);

  const recordApiCall = useCallback((success: boolean = true) => {
    performanceMonitor.recordApiCall(success);
  }, []);

  const recordError = useCallback((error: Error, context?: string) => {
    performanceMonitor.recordError(error, context);
  }, []);

  const recordTabSwitch = useCallback((fromTab: string, toTab: string) => {
    performanceMonitor.recordTabSwitch(fromTab, toTab);
  }, []);

  const recordRefresh = useCallback(() => {
    performanceMonitor.recordRefresh();
  }, []);

  const recordRetry = useCallback(() => {
    performanceMonitor.recordRetry();
  }, []);

  return {
    // Estado actual
    metrics,
    stats: performanceMonitor.getPerformanceStats(),
    recentEvents: performanceMonitor.getRecentEvents(),

    // Funciones de medición
    startLoadTimer,
    endLoadTimer,

    // Funciones de registro
    recordCacheAccess,
    recordApiCall,
    recordError,
    recordTabSwitch,
    recordRefresh,
    recordRetry,

    // Utilidades
    reset: () => performanceMonitor.reset()
  };
};

// Hook para medir tiempo de ejecución de funciones
export const usePerformanceTimer = (label: string, autoLog: boolean = true) => {
  const { recordApiCall, recordError } = useOfferPerformance();
  const startTimeRef = useRef<number>();

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const end = useCallback((success: boolean = true) => {
    if (startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;
      recordApiCall(success);

      if (autoLog) {
        console.log(`⏱️ ${label}: ${duration}ms`);
      }

      startTimeRef.current = undefined;
      return duration;
    }
    return 0;
  }, [label, autoLog, recordApiCall]);

  const measure = useCallback(async <T,>(
    fn: () => Promise<T> | T,
    onError?: (error: Error) => void
  ): Promise<T> => {
    start();
    try {
      const result = await fn();
      end(true);
      return result;
    } catch (error) {
      end(false);
      if (error instanceof Error) {
        recordError(error, label);
        onError?.(error);
      }
      throw error;
    }
  }, [start, end, recordError, label]);

  return { start, end, measure };
};

// Hook para lazy loading con métricas
export const useLazyWithMetrics = (importFn: () => Promise<any>, componentName: string) => {
  const { startLoadTimer, endLoadTimer, recordError } = useOfferPerformance();
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    startLoadTimer(`lazy_${componentName}`);

    try {
      const module = await importFn();
      setComponent(() => module.default || module);
      endLoadTimer('total' as any);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Lazy load failed');
      setError(error);
      recordError(error, `lazy_load_${componentName}`);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, componentName, startLoadTimer, endLoadTimer, recordError]);

  return { Component, loading, error, load };
};

export default useOfferPerformance;



