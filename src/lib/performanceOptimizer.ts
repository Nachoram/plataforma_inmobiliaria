// Sistema de Optimización de Performance
// Gestiona lazy loading, code splitting, asset optimization y monitoring avanzado

import { getPerformanceMonitor } from './performanceMonitor';
import { getAdvancedLogger } from './advancedLogger';

export interface PerformanceConfig {
  enabled: boolean;
  lazyLoading: {
    enabled: boolean;
    preloadCritical: boolean;
    prefetchRoutes: boolean;
    intersectionObserver: boolean;
  };
  codeSplitting: {
    enabled: boolean;
    dynamicImports: boolean;
    routeBased: boolean;
    componentBased: boolean;
  };
  assetOptimization: {
    enabled: boolean;
    imageOptimization: boolean;
    fontLoading: boolean;
    cssOptimization: boolean;
  };
  caching: {
    enabled: boolean;
    serviceWorker: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  };
  monitoring: {
    enabled: boolean;
    coreWebVitals: boolean;
    customMetrics: boolean;
    errorTracking: boolean;
  };
}

export interface LazyLoadConfig {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
  delay?: number;
}

export interface CodeSplitConfig {
  chunkName?: string;
  webpackChunkName?: string;
  preload?: boolean;
  prefetch?: boolean;
}

export interface AssetOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
  optimizations: string[];
}

/**
 * Optimizador de Performance Global
 */
class PerformanceOptimizer {
  private config: PerformanceConfig;
  private isInitialized = false;
  private intersectionObserver?: IntersectionObserver;
  private performanceMonitor = getPerformanceMonitor();
  private logger = getAdvancedLogger();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      lazyLoading: {
        enabled: true,
        preloadCritical: true,
        prefetchRoutes: true,
        intersectionObserver: true
      },
      codeSplitting: {
        enabled: true,
        dynamicImports: true,
        routeBased: true,
        componentBased: true
      },
      assetOptimization: {
        enabled: true,
        imageOptimization: true,
        fontLoading: true,
        cssOptimization: true
      },
      caching: {
        enabled: true,
        serviceWorker: true,
        localStorage: true,
        sessionStorage: true
      },
      monitoring: {
        enabled: true,
        coreWebVitals: true,
        customMetrics: true,
        errorTracking: true
      },
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private async initialize() {
    if (this.isInitialized) return;

    console.log('⚡ Inicializando Performance Optimizer...');

    // Configurar lazy loading
    if (this.config.lazyLoading.enabled) {
      this.setupLazyLoading();
    }

    // Configurar asset optimization
    if (this.config.assetOptimization.enabled) {
      this.setupAssetOptimization();
    }

    // Configurar caching
    if (this.config.caching.enabled) {
      this.setupCaching();
    }

    // Configurar monitoring
    if (this.config.monitoring.enabled) {
      this.setupMonitoring();
    }

    // Preload recursos críticos
    if (this.config.lazyLoading.preloadCritical) {
      this.preloadCriticalResources();
    }

    this.isInitialized = true;
    console.log('✅ Performance Optimizer inicializado');
  }

  // ========================================================================
  // LAZY LOADING AVANZADO
  // ========================================================================

  private setupLazyLoading(): void {
    if (!this.config.lazyLoading.intersectionObserver) return;

    // Crear IntersectionObserver global
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const lazyCallback = (target as any)._lazyCallback;

            if (lazyCallback && typeof lazyCallback === 'function') {
              lazyCallback();
              this.intersectionObserver?.unobserve(target);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    console.log('👁️ IntersectionObserver configurado para lazy loading');
  }

  /**
   * Lazy loading de componentes con Intersection Observer
   */
  lazyLoadComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    config: LazyLoadConfig = {}
  ): React.LazyExoticComponent<T> {
    const LazyComponent = React.lazy(() =>
      this.loadComponent(importFunc, config)
    );

    return LazyComponent;
  }

  private async loadComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    config: LazyLoadConfig
  ): Promise<{ default: T }> {
    const startTime = performance.now();

    try {
      const module = await importFunc();
      const loadTime = performance.now() - startTime;

      // Log de performance
      this.logger.logPerformance('component_load_time', loadTime, 1000, {
        component: 'LazyComponent',
        config
      });

      return module;
    } catch (error) {
      this.logger.error('system', 'Error loading lazy component', {
        error: error instanceof Error ? error.message : 'Unknown error',
        config
      });
      throw error;
    }
  }

  /**
   * Lazy loading de imágenes con Intersection Observer
   */
  lazyLoadImage(
    src: string,
    placeholder?: string,
    config: LazyLoadConfig = {}
  ): {
    ref: (element: HTMLElement | null) => void;
    src: string;
    loaded: boolean;
    error: boolean;
  } {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [currentSrc, setCurrentSrc] = React.useState(placeholder || '');

    const ref = React.useCallback((element: HTMLElement | null) => {
      if (!element || !this.intersectionObserver) return;

      const lazyCallback = () => {
        const img = new Image();
        img.onload = () => {
          setCurrentSrc(src);
          setLoaded(true);
          setError(false);
        };
        img.onerror = () => {
          setError(true);
          this.logger.warn('system', 'Error loading lazy image', { src });
        };
        img.src = src;
      };

      (element as any)._lazyCallback = lazyCallback;
      this.intersectionObserver.observe(element);
    }, [src]);

    return { ref, src: currentSrc, loaded, error };
  }

  /**
   * Prefetch inteligente de rutas
   */
  prefetchRoute(route: string, priority: 'low' | 'high' = 'low'): void {
    if (!this.config.lazyLoading.prefetchRoutes) return;

    const link = document.createElement('link');
    link.rel = priority === 'high' ? 'preload' : 'prefetch';
    link.href = route;
    link.as = 'document';

    // Agregar con delay para rutas de baja prioridad
    if (priority === 'low') {
      setTimeout(() => document.head.appendChild(link), 1000);
    } else {
      document.head.appendChild(link);
    }

    this.logger.info('performance', `Route prefetched: ${route}`, {
      priority,
      type: link.rel
    });
  }

  // ========================================================================
  // CODE SPLITTING OPTIMIZADO
  // ========================================================================

  /**
   * Code splitting por rutas
   */
  async loadRoute(
    routeId: string,
    importFunc: () => Promise<any>,
    config: CodeSplitConfig = {}
  ): Promise<any> {
    if (!this.config.codeSplitting.routeBased) {
      return importFunc();
    }

    const startTime = performance.now();

    try {
      // Configurar webpack chunk name si está disponible
      if (config.webpackChunkName) {
        // En webpack, esto se traduce a comments mágicos
        console.log(`Loading route chunk: ${config.webpackChunkName}`);
      }

      const module = await importFunc();
      const loadTime = performance.now() - startTime;

      this.logger.logPerformance('route_load_time', loadTime, 2000, {
        routeId,
        config
      });

      return module;
    } catch (error) {
      this.logger.error('system', 'Error loading route', {
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Code splitting por componentes
   */
  async loadComponentChunk(
    componentId: string,
    importFunc: () => Promise<any>,
    config: CodeSplitConfig = {}
  ): Promise<any> {
    if (!this.config.codeSplitting.componentBased) {
      return importFunc();
    }

    const startTime = performance.now();

    try {
      // Preload/Prefetch si está configurado
      if (config.preload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = componentId; // En producción esto sería el chunk URL
        link.as = 'script';
        document.head.appendChild(link);
      }

      const module = await importFunc();
      const loadTime = performance.now() - startTime;

      this.logger.logPerformance('component_chunk_load_time', loadTime, 1000, {
        componentId,
        config
      });

      return module;
    } catch (error) {
      this.logger.error('system', 'Error loading component chunk', {
        componentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ========================================================================
  // OPTIMIZACIÓN DE ASSETS
  // ========================================================================

  private setupAssetOptimization(): void {
    // Optimizar carga de fuentes
    if (this.config.assetOptimization.fontLoading) {
      this.optimizeFontLoading();
    }

    // Optimizar imágenes
    if (this.config.assetOptimization.imageOptimization) {
      this.optimizeImageLoading();
    }

    // Optimizar CSS
    if (this.config.assetOptimization.cssOptimization) {
      this.optimizeCSS();
    }
  }

  private optimizeFontLoading(): void {
    // Crear FontFace API loading para fuentes críticas
    if ('fonts' in document) {
      const font = new FontFace('Inter', 'url(/fonts/inter.woff2)', {
        weight: '400',
        display: 'swap'
      });

      font.load().then(() => {
        document.fonts.add(font);
        this.logger.info('performance', 'Font loaded via FontFace API', {
          fontFamily: 'Inter',
          weight: '400'
        });
      }).catch(error => {
        this.logger.warn('performance', 'Font loading failed', { error });
      });
    }

    // Preload fuentes críticas
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/inter.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }

  private optimizeImageLoading(): void {
    // Configurar loading lazy por defecto para imágenes
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });

    // Implementar responsive images donde sea posible
    this.implementResponsiveImages();
  }

  private implementResponsiveImages(): void {
    const images = document.querySelectorAll('img[data-responsive]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (!src) return;

      const srcset = `
        ${src}?w=480 480w,
        ${src}?w=768 768w,
        ${src}?w=1024 1024w,
        ${src}?w=1280 1280w,
        ${src}?w=1920 1920w
      `;

      img.setAttribute('srcset', srcset.trim());
      img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw');

      this.logger.info('performance', 'Responsive image implemented', {
        originalSrc: src,
        srcset: srcset.trim()
      });
    });
  }

  private optimizeCSS(): void {
    // Eliminar CSS no utilizado (simulado)
    const unusedCSS = this.analyzeUnusedCSS();
    if (unusedCSS.length > 0) {
      console.log('📝 CSS no utilizado encontrado:', unusedCSS);
      this.logger.info('performance', 'Unused CSS detected', {
        count: unusedCSS.length,
        rules: unusedCSS.slice(0, 10)
      });
    }

    // Critical CSS inlining (simulado)
    this.inlineCriticalCSS();
  }

  private analyzeUnusedCSS(): string[] {
    // En producción, esto usaría una herramienta como PurgeCSS
    // Aquí simulamos análisis básico
    const stylesheets = document.styleSheets;
    const unusedRules: string[] = [];

    for (let i = 0; i < stylesheets.length; i++) {
      try {
        const rules = stylesheets[i].cssRules;
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j] as CSSStyleRule;
          if (rule.selectorText && !document.querySelector(rule.selectorText)) {
            unusedRules.push(rule.selectorText);
          }
        }
      } catch (error) {
        // Ignorar errores de CORS en stylesheets externas
      }
    }

    return unusedRules.slice(0, 50); // Limitar resultados
  }

  private inlineCriticalCSS(): void {
    // Simular inlining de CSS crítico
    const criticalCSS = `
      body { margin: 0; font-family: Inter, system-ui, sans-serif; }
      .loading { opacity: 0.6; pointer-events: none; }
      .error { color: #ef4444; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);

    this.logger.info('performance', 'Critical CSS inlined', {
      size: criticalCSS.length
    });
  }

  /**
   * Optimización de imágenes con compresión
   */
  async optimizeImage(
    imageFile: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<AssetOptimizationResult> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'jpeg' } = options;

        // Calcular nuevas dimensiones
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen optimizada
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({
              originalSize: imageFile.size,
              optimizedSize: imageFile.size,
              savings: 0,
              savingsPercent: 0,
              optimizations: []
            });
            return;
          }

          const optimizedSize = blob.size;
          const savings = imageFile.size - optimizedSize;
          const savingsPercent = (savings / imageFile.size) * 100;

          const optimizations = [
            `Resized to ${width}x${height}`,
            `Compressed to ${format.toUpperCase()}`,
            `Quality: ${(quality * 100).toFixed(0)}%`
          ];

          const processingTime = performance.now() - startTime;
          this.logger.logPerformance('image_optimization_time', processingTime, 5000, {
            originalSize: imageFile.size,
            optimizedSize,
            savings,
            savingsPercent
          });

          resolve({
            originalSize: imageFile.size,
            optimizedSize,
            savings,
            savingsPercent,
            optimizations
          });
        }, `image/${format}`, quality);
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  // ========================================================================
  // CACHING AVANZADO
  // ========================================================================

  private setupCaching(): void {
    // Service Worker
    if (this.config.caching.serviceWorker && 'serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Configurar cache de API responses
    this.setupApiCaching();

    // Configurar cache de componentes
    this.setupComponentCaching();
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('🚀 Service Worker registrado:', registration.scope);

      this.logger.info('system', 'Service Worker registered', {
        scope: registration.scope,
        state: registration.active?.state
      });
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      this.logger.error('system', 'Service Worker registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private setupApiCaching(): void {
    // Cache de respuestas de API usando Cache API
    const cacheApiResponses = async (request: Request, response: Response) => {
      if (!response.ok) return response;

      const cache = await caches.open('api-cache-v1');
      cache.put(request, response.clone());

      return response;
    };

    // Interceptar fetch para API calls
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const request = new Request(input, init);

      // Solo cache para GET requests a nuestra API
      if (request.method === 'GET' && request.url.includes('/api/')) {
        try {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Devolver cache pero actualizar en background
            originalFetch(input, init).then(response => cacheApiResponses(request, response));
            return cachedResponse;
          }

          const response = await originalFetch(input, init);
          return cacheApiResponses(request, response);
        } catch (error) {
          console.warn('API caching error:', error);
        }
      }

      return originalFetch(input, init);
    };
  }

  private setupComponentCaching(): void {
    // Cache de componentes React usando localStorage
    const componentCache = new Map<string, any>();

    // Override React.lazy para usar cache
    const originalLazy = React.lazy;
    React.lazy = (lazyComponent) => {
      return originalLazy(() => {
        const cacheKey = lazyComponent.toString();

        if (componentCache.has(cacheKey)) {
          return componentCache.get(cacheKey);
        }

        const promise = lazyComponent();
        componentCache.set(cacheKey, promise);

        return promise;
      });
    };
  }

  // ========================================================================
  // MONITORING AVANZADO
  // ========================================================================

  private setupMonitoring(): void {
    // Core Web Vitals
    if (this.config.monitoring.coreWebVitals) {
      this.monitorCoreWebVitals();
    }

    // Métricas custom
    if (this.config.monitoring.customMetrics) {
      this.setupCustomMetrics();
    }

    // Error tracking
    if (this.config.monitoring.errorTracking) {
      this.setupErrorTracking();
    }
  }

  private monitorCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const value = lastEntry.startTime;

      this.logger.logPerformance('LCP', value, 2500, {
        element: (lastEntry as any).element?.tagName
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const value = (entry as any).processingStart - entry.startTime;
        this.logger.logPerformance('FID', value, 100, {
          eventType: (entry as any).name
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });

      this.logger.logPerformance('CLS', clsValue, 0.1);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private setupCustomMetrics(): void {
    // Memory usage monitoring
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

        this.logger.logPerformance('memory_usage_percent', usedPercent, 80, {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }
    }, 30000); // Cada 30 segundos

    // Network requests monitoring
    let requestCount = 0;
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      requestCount++;
      return originalFetch.apply(this, args);
    };

    setInterval(() => {
      this.logger.logPerformance('network_requests_per_minute', requestCount, 100);
      requestCount = 0;
    }, 60000); // Cada minuto
  }

  private setupErrorTracking(): void {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.logger.error('system', 'Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('system', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  private preloadCriticalResources(): void {
    // Preload recursos críticos
    const criticalResources = [
      { href: '/api/user/profile', as: 'fetch' },
      { href: '/fonts/inter.woff2', as: 'font', crossorigin: 'anonymous' },
      { href: '/css/critical.css', as: 'style' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as as any;
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }
      document.head.appendChild(link);
    });

    this.logger.info('performance', 'Critical resources preloaded', {
      count: criticalResources.length
    });
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  async analyzeBundle(): Promise<{
    chunks: Array<{
      name: string;
      size: number;
      gzipSize: number;
      modules: string[];
    }>;
    totalSize: number;
    totalGzipSize: number;
  }> {
    // En producción, esto analizaría el bundle usando webpack-bundle-analyzer
    // Aquí devolvemos datos simulados
    return {
      chunks: [
        {
          name: 'vendor',
          size: 125000,
          gzipSize: 34000,
          modules: ['react', 'react-dom', 'lodash']
        },
        {
          name: 'app',
          size: 95000,
          gzipSize: 25000,
          modules: ['App.tsx', 'routes.tsx']
        },
        {
          name: 'dashboard',
          size: 78000,
          gzipSize: 20000,
          modules: ['Dashboard.tsx', 'Charts.tsx']
        }
      ],
      totalSize: 298000,
      totalGzipSize: 79000
    };
  }

  generatePerformanceReport(): {
    score: number;
    metrics: Record<string, number>;
    recommendations: string[];
  } {
    const metrics = this.performanceMonitor.getAllMetrics();
    const avgMetrics: Record<string, number> = {};

    // Calcular promedios
    Object.keys(metrics).forEach(key => {
      const values = metrics[key].map(m => m.value);
      avgMetrics[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    // Calcular score (0-100)
    const score = Math.max(0, Math.min(100,
      100 -
      (avgMetrics['LCP'] > 2500 ? 20 : 0) -
      (avgMetrics['FID'] > 100 ? 15 : 0) -
      (avgMetrics['CLS'] > 0.1 ? 10 : 0) -
      (avgMetrics['memory_usage_percent'] > 80 ? 25 : 0)
    ));

    // Generar recomendaciones
    const recommendations: string[] = [];

    if (avgMetrics['LCP'] > 2500) {
      recommendations.push('Optimizar Largest Contentful Paint (LCP) - Considera precargar recursos críticos');
    }
    if (avgMetrics['FID'] > 100) {
      recommendations.push('Reducir First Input Delay (FID) - Optimiza JavaScript execution');
    }
    if (avgMetrics['CLS'] > 0.1) {
      recommendations.push('Minimizar Cumulative Layout Shift (CLS) - Define tamaños de elementos');
    }
    if (avgMetrics['memory_usage_percent'] > 80) {
      recommendations.push('Optimizar uso de memoria - Implementa limpieza de listeners y cache');
    }

    return { score, metrics: avgMetrics, recommendations };
  }

  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.isInitialized = false;
    console.log('💥 Performance Optimizer destruido');
  }
}

// Instancia global
let performanceOptimizerInstance: PerformanceOptimizer | null = null;

export const getPerformanceOptimizer = (): PerformanceOptimizer => {
  if (!performanceOptimizerInstance) {
    performanceOptimizerInstance = new PerformanceOptimizer();
  }
  return performanceOptimizerInstance;
};

// Funciones de conveniencia
export const performanceOptimizer = {
  // Lazy loading
  lazyLoadComponent: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    config?: LazyLoadConfig
  ) => getPerformanceOptimizer().lazyLoadComponent(importFunc, config),

  lazyLoadImage: (
    src: string,
    placeholder?: string,
    config?: LazyLoadConfig
  ) => getPerformanceOptimizer().lazyLoadImage(src, placeholder, config),

  // Code splitting
  loadRoute: (
    routeId: string,
    importFunc: () => Promise<any>,
    config?: CodeSplitConfig
  ) => getPerformanceOptimizer().loadRoute(routeId, importFunc, config),

  loadComponentChunk: (
    componentId: string,
    importFunc: () => Promise<any>,
    config?: CodeSplitConfig
  ) => getPerformanceOptimizer().loadComponentChunk(componentId, importFunc, config),

  // Asset optimization
  optimizeImage: (
    imageFile: File,
    options?: Parameters<PerformanceOptimizer['optimizeImage']>[1]
  ) => getPerformanceOptimizer().optimizeImage(imageFile, options),

  // Utilities
  analyzeBundle: () => getPerformanceOptimizer().analyzeBundle(),
  generatePerformanceReport: () => getPerformanceOptimizer().generatePerformanceReport(),

  // Config
  updateConfig: (config: Partial<PerformanceConfig>) => getPerformanceOptimizer().updateConfig(config),
  getConfig: () => getPerformanceOptimizer().getConfig()
};

export default getPerformanceOptimizer;



