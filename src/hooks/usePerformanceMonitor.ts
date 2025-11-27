import { useEffect, useCallback, useRef } from 'react';
import { getPerformanceMonitor, measureFunction, measureAsyncFunction } from '../lib/performanceMonitor';

interface UsePerformanceMonitorOptions {
  trackRenders?: boolean;
  trackInteractions?: boolean;
  componentName?: string;
}

/**
 * Hook personalizado para integrar performance monitoring en componentes
 */
export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    trackRenders = true,
    trackInteractions = true,
    componentName = 'UnknownComponent'
  } = options;

  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(0);
  const componentMountTimeRef = useRef<number>(performance.now());

  // Track component mount
  useEffect(() => {
    const mountTime = performance.now();
    componentMountTimeRef.current = mountTime;

    if (trackRenders) {
      console.log(`🎯 Component ${componentName} mounted`);
    }

    // Track component unmount
    return () => {
      const unmountTime = performance.now();
      const lifetime = unmountTime - componentMountTimeRef.current;

      if (trackRenders) {
        console.log(`💀 Component ${componentName} unmounted after ${lifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName, trackRenders]);

  // Track renders
  useEffect(() => {
    if (!trackRenders) return;

    renderCountRef.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTimeRef.current;

    // Skip first render
    if (lastRenderTimeRef.current > 0) {
      // Alert on rapid re-renders (less than 16ms apart at 60fps)
      if (timeSinceLastRender < 16.67) {
        console.warn(`⚡ Rapid re-render in ${componentName}: ${timeSinceLastRender.toFixed(2)}ms since last render`);
      }
    }

    lastRenderTimeRef.current = currentTime;

    if (renderCountRef.current % 10 === 0) { // Log every 10 renders
      console.log(`🔄 Component ${componentName} rendered ${renderCountRef.current} times`);
    }
  });

  // Función para medir operaciones síncronas
  const measureSync = useCallback(<T>(
    operationName: string,
    operation: () => T,
    context?: Record<string, any>
  ): T => {
    return measureFunction(`${componentName}_${operationName}`, operation, {
      ...context,
      renderCount: renderCountRef.current
    });
  }, [componentName]);

  // Función para medir operaciones asíncronas
  const measureAsync = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return measureAsyncFunction(`${componentName}_${operationName}`, operation, {
      ...context,
      renderCount: renderCountRef.current
    });
  }, [componentName]);

  // Track tiempo de navegación entre rutas
  const trackRouteChange = useCallback((from: string, to: string) => {
    const routeChangeTime = performance.now();

    console.log(`🛣️ Route changed: ${from} → ${to} (${routeChangeTime.toFixed(2)}ms)`);

    // Medir el tiempo que tomó cambiar de ruta
    getPerformanceMonitor().recordMetric(
      'route_change_time',
      routeChangeTime,
      'custom',
      {
        from,
        to,
        component: componentName
      }
    );
  }, [componentName]);

  // Track interacciones del usuario
  const trackInteraction = useCallback((
    interactionType: string,
    target: string,
    details?: Record<string, any>
  ) => {
    if (!trackInteractions) return;

    const interactionTime = performance.now();

    getPerformanceMonitor().recordMetric(
      `interaction_${interactionType}`,
      interactionTime,
      'custom',
      {
        target,
        component: componentName,
        ...details
      }
    );

    console.log(`👆 Interaction: ${interactionType} on ${target} in ${componentName}`);
  }, [componentName, trackInteractions]);

  // Track estado de loading
  const trackLoadingState = useCallback((
    state: 'start' | 'end',
    operation: string,
    context?: Record<string, any>
  ) => {
    const timestamp = performance.now();

    getPerformanceMonitor().recordMetric(
      `loading_${state}`,
      timestamp,
      'custom',
      {
        operation,
        component: componentName,
        ...context
      }
    );

    if (state === 'end') {
      console.log(`✅ Loading completed: ${operation} in ${componentName}`);
    } else {
      console.log(`⏳ Loading started: ${operation} in ${componentName}`);
    }
  }, [componentName]);

  // Obtener estadísticas de performance del componente
  const getComponentStats = useCallback(() => {
    return getPerformanceMonitor().getComponentPerformance(componentName);
  }, [componentName]);

  // Obtener métricas recientes
  const getRecentMetrics = useCallback((limit = 20) => {
    return getPerformanceMonitor().getMetrics(undefined, limit);
  }, []);

  // Obtener alertas recientes
  const getRecentAlerts = useCallback((limit = 10) => {
    return getPerformanceMonitor().getAlerts(limit);
  }, []);

  // Forzar garbage collection (solo en desarrollo)
  const forceGC = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
      console.log('🗑️ Forced garbage collection');
    }
  }, []);

  // Medir memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };

      getPerformanceMonitor().recordMetric(
        'memory_snapshot',
        usage.used,
        'memory',
        {
          ...usage,
          component: componentName
        }
      );

      console.log(`💾 Memory usage in ${componentName}: ${(usage.percentage).toFixed(1)}%`);

      return usage;
    }

    return null;
  }, [componentName]);

  return {
    // Funciones de medición
    measureSync,
    measureAsync,

    // Tracking
    trackRouteChange,
    trackInteraction,
    trackLoadingState,

    // Estadísticas
    getComponentStats,
    getRecentMetrics,
    getRecentAlerts,

    // Utilidades
    forceGC,
    measureMemoryUsage,

    // Información del componente
    renderCount: renderCountRef.current,
    componentName,
    isTrackingRenders: trackRenders,
    isTrackingInteractions: trackInteractions
  };
};