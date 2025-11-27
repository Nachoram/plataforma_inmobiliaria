// Sistema de Performance Monitoring
// Monitorea Core Web Vitals, componentes React, y métricas personalizadas

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
  type: 'web-vital' | 'component' | 'custom' | 'network' | 'memory';
}

export interface PerformanceConfig {
  enabled: boolean;
  reportToAnalytics: boolean;
  alertThresholds: {
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    ttfb: number; // Time to First Byte
  };
  sampling: {
    webVitals: number; // 0-1, porcentaje de sesiones a trackear
    components: number;
    network: number;
  };
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private componentMetrics: Map<string, number[]> = new Map();
  private alerts: Array<{ type: string; message: string; timestamp: number }> = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
      reportToAnalytics: true,
      alertThresholds: {
        cls: 0.1,
        fid: 100,
        fcp: 1800,
        lcp: 2500,
        ttfb: 800
      },
      sampling: {
        webVitals: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev
        components: 1.0,
        network: 0.5
      },
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize() {
    console.log('📊 Performance Monitor initialized');

    this.setupWebVitalsTracking();
    this.setupComponentTracking();
    this.setupNetworkTracking();
    this.setupMemoryTracking();

    // Reporte automático cada 30 segundos
    setInterval(() => {
      this.reportMetrics();
    }, 30000);
  }

  // ========================================================================
  // CORE WEB VITALS TRACKING
  // ========================================================================

  private setupWebVitalsTracking() {
    if (!this.shouldSample('webVitals')) return;

    // CLS - Cumulative Layout Shift
    this.observePerformance('layout-shift', (entry) => {
      const value = (entry as any).value;
      this.recordMetric('CLS', value, 'web-vital', { entry });

      if (value > this.config.alertThresholds.cls) {
        this.alert('CLS_TOO_HIGH', `CLS is ${value.toFixed(3)} (threshold: ${this.config.alertThresholds.cls})`);
      }
    });

    // FID - First Input Delay
    this.observePerformance('first-input', (entry) => {
      const value = (entry as any).processingStart - entry.startTime;
      this.recordMetric('FID', value, 'web-vital', { entry });

      if (value > this.config.alertThresholds.fid) {
        this.alert('FID_TOO_HIGH', `FID is ${value.toFixed(2)}ms (threshold: ${this.config.alertThresholds.fid}ms)`);
      }
    });

    // FCP - First Contentful Paint
    this.observePerformance('paint', (entry) => {
      if ((entry as any).name === 'first-contentful-paint') {
        const value = entry.startTime;
        this.recordMetric('FCP', value, 'web-vital', { entry });

        if (value > this.config.alertThresholds.fcp) {
          this.alert('FCP_TOO_HIGH', `FCP is ${value.toFixed(2)}ms (threshold: ${this.config.alertThresholds.fcp}ms)`);
        }
      }
    });

    // LCP - Largest Contentful Paint
    this.observePerformance('largest-contentful-paint', (entry) => {
      const value = entry.startTime;
      this.recordMetric('LCP', value, 'web-vital', { entry });

      if (value > this.config.alertThresholds.lcp) {
        this.alert('LCP_TOO_HIGH', `LCP is ${value.toFixed(2)}ms (threshold: ${this.config.alertThresholds.lcp}ms)`);
      }
    });

    // TTFB - Time to First Byte (Navigation Timing)
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.recordMetric('TTFB', ttfb, 'web-vital', { navigation });

        if (ttfb > this.config.alertThresholds.ttfb) {
          this.alert('TTFB_TOO_HIGH', `TTFB is ${ttfb.toFixed(2)}ms (threshold: ${this.config.alertThresholds.ttfb}ms)`);
        }
      }
    }
  }

  // ========================================================================
  // COMPONENT PERFORMANCE TRACKING
  // ========================================================================

  private setupComponentTracking() {
    if (!this.shouldSample('components')) return;

    // Monkey patch React's render method to track component performance
    const originalCreateElement = React.createElement;

    React.createElement = (...args) => {
      const element = originalCreateElement.apply(null, args);

      if (typeof args[0] === 'function' && args[0].name) {
        const componentName = args[0].name;

        // Wrap component to track render time
        const WrappedComponent = args[0];
        const trackedComponent = (...props: any[]) => {
          const startTime = performance.now();

          try {
            const result = WrappedComponent(...props);

            const renderTime = performance.now() - startTime;

            // Record component render time
            this.recordComponentMetric(componentName, renderTime, {
              propsCount: props.length,
              hasChildren: !!props[0]?.children
            });

            // Alert if render time is too high
            if (renderTime > 16.67) { // More than one frame at 60fps
              this.alert('SLOW_RENDER', `Component ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
            }

            return result;
          } catch (error) {
            // Record error metric
            this.recordMetric(`${componentName}_error`, 1, 'component', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
          }
        };

        // Copy component properties
        Object.assign(trackedComponent, WrappedComponent);

        return originalCreateElement(trackedComponent, ...args.slice(1));
      }

      return element;
    };
  }

  // ========================================================================
  // NETWORK PERFORMANCE TRACKING
  // ========================================================================

  private setupNetworkTracking() {
    if (!this.shouldSample('network')) return;

    // Track fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] instanceof Request ? args[0].url : String(args[0]);

      try {
        const response = await originalFetch.apply(window, args);
        const duration = performance.now() - startTime;

        this.recordMetric('fetch_request', duration, 'network', {
          url,
          method: args[0] instanceof Request ? args[0].method : 'GET',
          status: response.status,
          success: response.ok
        });

        // Alert on slow requests
        if (duration > 3000) { // 3 seconds
          this.alert('SLOW_NETWORK', `Request to ${url} took ${duration.toFixed(2)}ms`);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.recordMetric('fetch_error', duration, 'network', {
          url,
          error: error instanceof Error ? error.message : 'Network error'
        });
        throw error;
      }
    };
  }

  // ========================================================================
  // MEMORY TRACKING
  // ========================================================================

  private setupMemoryTracking() {
    // Track memory usage every 30 seconds
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize, 'memory', {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });

        // Alert on high memory usage (90% of limit)
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 90) {
          this.alert('HIGH_MEMORY_USAGE', `Memory usage: ${usagePercent.toFixed(1)}%`);
        }
      }
    }, 30000);
  }

  // ========================================================================
  // MÉTRICAS Y REPORTING
  // ========================================================================

  private recordMetric(
    name: string,
    value: number,
    type: PerformanceMetric['type'],
    context?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
      type
    };

    this.metrics.push(metric);

    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${type.toUpperCase()}: ${name} = ${value.toFixed(2)}`, context);
    }
  }

  private recordComponentMetric(componentName: string, renderTime: number, context?: Record<string, any>) {
    const metrics = this.componentMetrics.get(componentName) || [];
    metrics.push(renderTime);

    // Mantener solo las últimas 50 mediciones por componente
    if (metrics.length > 50) {
      metrics.shift();
    }

    this.componentMetrics.set(componentName, metrics);

    this.recordMetric(`${componentName}_render`, renderTime, 'component', context);
  }

  private observePerformance(entryType: string, callback: (entry: PerformanceEntry) => void) {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      console.warn(`Performance observer for ${entryType} failed:`, error);
    }
  }

  private alert(type: string, message: string) {
    const alert = {
      type,
      message,
      timestamp: Date.now()
    };

    this.alerts.push(alert);

    // Mantener solo las últimas 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    console.warn(`🚨 Performance Alert: ${type} - ${message}`);

    // En producción, enviar a servicio de monitoring
    if (process.env.NODE_ENV === 'production') {
      // this.sendAlertToService(alert);
    }
  }

  private shouldSample(type: keyof PerformanceConfig['sampling']): boolean {
    return Math.random() < this.config.sampling[type];
  }

  // ========================================================================
  // REPORTING Y UTILIDADES
  // ========================================================================

  private reportMetrics() {
    if (this.metrics.length === 0) return;

    const report = {
      sessionId: `perf_${Date.now()}`,
      timestamp: Date.now(),
      metrics: this.metrics.slice(-50), // Últimas 50 métricas
      alerts: this.alerts.slice(-10), // Últimas 10 alertas
      componentStats: this.getComponentStats(),
      summary: this.getSummaryStats()
    };

    console.log('📊 Performance Report:', report);

    // Enviar a analytics si está habilitado
    if (this.config.reportToAnalytics) {
      // this.sendToAnalytics(report);
    }

    // Limpiar métricas antiguas
    this.metrics = this.metrics.slice(-100);
  }

  private getComponentStats() {
    const stats: Record<string, { avg: number; max: number; count: number }> = {};

    this.componentMetrics.forEach((times, componentName) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);

      stats[componentName] = {
        avg: Math.round(avg * 100) / 100,
        max: Math.round(max * 100) / 100,
        count: times.length
      };
    });

    return stats;
  }

  private getSummaryStats() {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp > lastHour);

    const stats = {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      alertsCount: this.alerts.length,
      avgResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0
    };

    // Calcular estadísticas
    const responseTimes = recentMetrics.filter(m => m.type === 'network').map(m => m.value);
    if (responseTimes.length > 0) {
      stats.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    const errors = recentMetrics.filter(m => m.name.includes('error')).length;
    stats.errorRate = recentMetrics.length > 0 ? (errors / recentMetrics.length) * 100 : 0;

    const memoryMetrics = recentMetrics.filter(m => m.type === 'memory');
    if (memoryMetrics.length > 0) {
      stats.memoryUsage = memoryMetrics[memoryMetrics.length - 1].value;
    }

    return stats;
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  public getMetrics(type?: PerformanceMetric['type'], limit = 100) {
    let filteredMetrics = this.metrics;

    if (type) {
      filteredMetrics = this.metrics.filter(m => m.type === type);
    }

    return filteredMetrics.slice(-limit);
  }

  public getAlerts(limit = 20) {
    return this.alerts.slice(-limit);
  }

  public getComponentPerformance(componentName: string) {
    const metrics = this.componentMetrics.get(componentName) || [];
    if (metrics.length === 0) return null;

    const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    const max = Math.max(...metrics);
    const min = Math.min(...metrics);

    return {
      average: Math.round(avg * 100) / 100,
      max: Math.round(max * 100) / 100,
      min: Math.round(min * 100) / 100,
      count: metrics.length,
      lastRender: Math.round(metrics[metrics.length - 1] * 100) / 100
    };
  }

  public measureFunction<T>(name: string, fn: () => T, context?: Record<string, any>): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.recordMetric(`${name}_execution`, duration, 'custom', context);

      if (duration > 100) { // Más de 100ms
        this.alert('SLOW_FUNCTION', `Function ${name} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'custom', {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric(`${name}_execution`, duration, 'custom', context);

      if (duration > 1000) { // Más de 1 segundo
        this.alert('SLOW_ASYNC_FUNCTION', `Async function ${name} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_error`, duration, 'custom', {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  public destroy() {
    // Limpiar observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Limpiar métricas
    this.metrics = [];
    this.alerts = [];
    this.componentMetrics.clear();
  }
}

// Instancia global
let performanceMonitorInstance: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
};

// Funciones de conveniencia
export const measureFunction = <T>(name: string, fn: () => T, context?: Record<string, any>): T => {
  return getPerformanceMonitor().measureFunction(name, fn, context);
};

export const measureAsyncFunction = async <T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  return getPerformanceMonitor().measureAsyncFunction(name, fn, context);
};

export const getPerformanceMetrics = (type?: PerformanceMetric['type'], limit?: number) => {
  return getPerformanceMonitor().getMetrics(type, limit);
};

export const getPerformanceAlerts = (limit?: number) => {
  return getPerformanceMonitor().getAlerts(limit);
};

export const getComponentPerformance = (componentName: string) => {
  return getPerformanceMonitor().getComponentPerformance(componentName);
};

export default getPerformanceMonitor;
