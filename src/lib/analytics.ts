// Sistema de Analytics Avanzado
// Configuración y tipos

export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  userRole?: string;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  performance?: {
    loadTime?: number;
    domReady?: number;
    firstPaint?: number;
    largestContentfulPaint?: number;
  };
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number;
  maxQueueSize: number;
  endpoints: {
    events: string;
    performance: string;
    errors: string;
  };
  sampling: {
    events: number; // 0-1, porcentaje de eventos a trackear
    performance: number;
    errors: number;
  };
}

class AnalyticsManager {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;
  private isOnline: boolean = navigator.onLine;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      debug: process.env.NODE_ENV === 'development',
      batchSize: 10,
      flushInterval: 30000, // 30 segundos
      maxQueueSize: 100,
      endpoints: {
        events: '/api/analytics/events',
        performance: '/api/analytics/performance',
        errors: '/api/analytics/errors'
      },
      sampling: {
        events: 1.0, // 100% en desarrollo, configurable en producción
        performance: 1.0,
        errors: 1.0
      },
      ...config
    };

    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private initialize() {
    // Configurar timer de flush automático
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Escuchar cambios de conexión
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush(); // Intentar enviar datos pendientes
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Trackear evento de carga de página
    this.trackEvent({
      name: 'page_load',
      category: 'navigation',
      action: 'load',
      label: window.location.pathname
    });

    // Trackear métricas de performance iniciales
    this.trackPerformanceMetrics();

    // Trackear errores no manejados
    this.setupErrorTracking();

    if (this.config.debug) {
      console.log('📊 Analytics initialized:', this.config);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(type: keyof AnalyticsConfig['sampling']): boolean {
    return Math.random() < this.config.sampling[type];
  }

  // Trackear eventos personalizados
  public trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'viewport'>) {
    if (!this.config.enabled || !this.shouldSample('events')) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.addToQueue(fullEvent);

    if (this.config.debug) {
      console.log('📊 Event tracked:', fullEvent);
    }
  }

  // Trackear métricas de performance
  public trackPerformanceMetrics() {
    if (!this.config.enabled || !this.shouldSample('performance')) return;

    // Usar Performance API si está disponible
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const metrics = {
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
        domReady: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime,
        largestContentfulPaint: paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime
      };

      this.trackEvent({
        name: 'performance_metrics',
        category: 'performance',
        action: 'page_load',
        metadata: metrics
      });
    }
  }

  // Trackear interacciones de usuario
  public trackInteraction(action: string, element: string, metadata?: Record<string, any>) {
    this.trackEvent({
      name: 'user_interaction',
      category: 'interaction',
      action,
      label: element,
      metadata
    });
  }

  // Trackear navegación
  public trackNavigation(from: string, to: string, method: 'push' | 'replace' | 'back' | 'forward') {
    this.trackEvent({
      name: 'navigation',
      category: 'navigation',
      action: method,
      label: `${from} → ${to}`,
      metadata: { from, to, method }
    });
  }

  // Trackear errores
  public trackError(error: Error, context?: Record<string, any>) {
    if (!this.config.enabled || !this.shouldSample('errors')) return;

    this.trackEvent({
      name: 'error',
      category: 'error',
      action: 'javascript_error',
      label: error.message,
      metadata: {
        stack: error.stack,
        context,
        url: window.location.href
      }
    });
  }

  // Trackear acciones de oferta
  public trackOfferAction(action: string, offerId: string, metadata?: Record<string, any>) {
    this.trackEvent({
      name: 'offer_action',
      category: 'offers',
      action,
      label: offerId,
      metadata: { offerId, ...metadata }
    });
  }

  // Trackear búsqueda
  public trackSearch(query: string, results: number, filters?: Record<string, any>) {
    this.trackEvent({
      name: 'search',
      category: 'search',
      action: 'perform',
      label: query,
      value: results,
      metadata: { query, results, filters }
    });
  }

  // Trackear tiempo en página
  public trackTimeOnPage(page: string, timeSpent: number) {
    this.trackEvent({
      name: 'time_on_page',
      category: 'engagement',
      action: 'time_spent',
      label: page,
      value: Math.round(timeSpent / 1000), // segundos
      metadata: { page, timeSpent }
    });
  }

  // Trackear conversiones
  public trackConversion(type: string, value?: number, metadata?: Record<string, any>) {
    this.trackEvent({
      name: 'conversion',
      category: 'conversion',
      action: type,
      value,
      metadata
    });
  }

  private setupErrorTracking() {
    // Trackear errores no manejados
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Trackear promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  private addToQueue(event: AnalyticsEvent) {
    this.eventQueue.push(event);

    // Evitar que la cola crezca demasiado
    if (this.eventQueue.length > this.config.maxQueueSize) {
      this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
    }

    // Flush si alcanza el batch size
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (!this.isOnline || this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoints.events, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: eventsToSend,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics API returned ${response.status}`);
      }

      if (this.config.debug) {
        console.log(`📤 Sent ${eventsToSend.length} analytics events`);
      }

    } catch (error) {
      console.warn('Failed to send analytics events:', error);

      // Re-agregar eventos a la cola para reintento
      this.eventQueue.unshift(...eventsToSend);

      // Limitar la cola en caso de error persistente
      if (this.eventQueue.length > this.config.maxQueueSize) {
        this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
      }
    }
  }

  // Métodos públicos para control manual
  public setUser(userId: string, userRole?: string) {
    this.sessionId = `${userId}_${this.generateSessionId()}`;

    if (this.config.debug) {
      console.log('👤 User set for analytics:', { userId, userRole });
    }
  }

  public enable() {
    this.config.enabled = true;
    this.initialize();
  }

  public disable() {
    this.config.enabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  public destroy() {
    this.disable();
    this.eventQueue = [];
  }
}

// Instancia global de analytics
let analyticsInstance: AnalyticsManager | null = null;

export const getAnalytics = (): AnalyticsManager => {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsManager({
      enabled: process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
      debug: process.env.NODE_ENV === 'development',
      sampling: {
        events: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev
        performance: 1.0,
        errors: 1.0
      }
    });
  }
  return analyticsInstance;
};

// Funciones de conveniencia para usar analytics
export const trackEvent = (event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'viewport'>) => {
  getAnalytics().trackEvent(event);
};

export const trackInteraction = (action: string, element: string, metadata?: Record<string, any>) => {
  getAnalytics().trackInteraction(action, element, metadata);
};

export const trackNavigation = (from: string, to: string, method: 'push' | 'replace' | 'back' | 'forward' = 'push') => {
  getAnalytics().trackNavigation(from, to, method);
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  getAnalytics().trackError(error, context);
};

export const trackOfferAction = (action: string, offerId: string, metadata?: Record<string, any>) => {
  getAnalytics().trackOfferAction(action, offerId, metadata);
};

export const trackSearch = (query: string, results: number, filters?: Record<string, any>) => {
  getAnalytics().trackSearch(query, results, filters);
};

export const trackConversion = (type: string, value?: number, metadata?: Record<string, any>) => {
  getAnalytics().trackConversion(type, value, metadata);
};

export default getAnalytics;


