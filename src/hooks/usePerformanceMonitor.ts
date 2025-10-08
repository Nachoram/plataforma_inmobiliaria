import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'navigation' | 'resource' | 'custom' | 'interaction'
}

interface PerformanceConfig {
  enableLogging?: boolean
  reportToService?: boolean
  sampleRate?: number // 0-1, percentage of users to track
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private config: PerformanceConfig

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableLogging: process.env.NODE_ENV === 'development',
      reportToService: false,
      sampleRate: 1.0, // Track all users in development
      ...config
    }

    this.initializeObservers()
  }

  private initializeObservers() {
    // Navigation timing
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        this.recordMetric('navigation_dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'navigation')
        this.recordMetric('navigation_load_complete', navigation.loadEventEnd - navigation.loadEventStart, 'navigation')
        this.recordMetric('navigation_first_paint', navigation.responseStart - navigation.fetchStart, 'navigation')
      }
    }

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric('lcp', lastEntry.startTime, 'custom')
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)
    } catch (e) {
      console.warn('LCP observation not supported')
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.recordMetric('fid', (entry as any).processingStart - entry.startTime, 'interaction')
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)
    } catch (e) {
      console.warn('FID observation not supported')
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })
        this.recordMetric('cls', clsValue, 'custom')
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    } catch (e) {
      console.warn('CLS observation not supported')
    }
  }

  recordMetric(name: string, value: number, type: PerformanceMetric['type'] = 'custom') {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type
    }

    this.metrics.push(metric)

    if (this.config.enableLogging) {
      console.log(`📊 Performance: ${name} = ${value.toFixed(2)}ms`)
    }

    if (this.config.reportToService && Math.random() < this.config.sampleRate!) {
      this.reportToService(metric)
    }
  }

  private reportToService(metric: PerformanceMetric) {
    // In a real application, this would send to analytics/performance monitoring service
    // Examples: Google Analytics, DataDog, New Relic, Sentry Performance, etc.

    try {
      // Example: Send to hypothetical performance service
      // performanceService.track(metric)

      // For now, just store in localStorage for debugging
      const stored = localStorage.getItem('performance_metrics') || '[]'
      const metrics = JSON.parse(stored)
      metrics.push(metric)

      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100)
      }

      localStorage.setItem('performance_metrics', JSON.stringify(metrics))
    } catch (error) {
      console.warn('Failed to report performance metric:', error)
    }
  }

  startTiming(name: string): () => void {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(`timing_${name}`, duration, 'custom')
    }
  }

  markRouteChange(route: string) {
    this.recordMetric(`route_change_${route}`, performance.now(), 'navigation')
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type)
  }

  clearMetrics() {
    this.metrics = []
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export const getPerformanceMonitor = (config?: PerformanceConfig): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(config)
  }
  return performanceMonitor
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitorRef = useRef<PerformanceMonitor | null>(null)

  useEffect(() => {
    monitorRef.current = getPerformanceMonitor()

    return () => {
      // Don't destroy the singleton instance
    }
  }, [])

  const startTiming = useCallback((name: string) => {
    return monitorRef.current?.startTiming(name) || (() => {})
  }, [])

  const recordMetric = useCallback((name: string, value: number, type?: PerformanceMetric['type']) => {
    monitorRef.current?.recordMetric(name, value, type)
  }, [])

  const markRouteChange = useCallback((route: string) => {
    monitorRef.current?.markRouteChange(route)
  }, [])

  const getMetrics = useCallback(() => {
    return monitorRef.current?.getMetrics() || []
  }, [])

  return {
    startTiming,
    recordMetric,
    markRouteChange,
    getMetrics
  }
}

// Hook for measuring component render time
export const useRenderTiming = (componentName: string) => {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef<number>(0)

  useEffect(() => {
    renderCountRef.current += 1
    const now = performance.now()

    if (lastRenderTimeRef.current > 0) {
      const timeSinceLastRender = now - lastRenderTimeRef.current
      getPerformanceMonitor().recordMetric(
        `render_${componentName}_interval`,
        timeSinceLastRender,
        'custom'
      )
    }

    lastRenderTimeRef.current = now

    getPerformanceMonitor().recordMetric(
      `render_${componentName}_count`,
      renderCountRef.current,
      'custom'
    )
  })

  return renderCountRef.current
}

// Hook for measuring user interactions
export const useInteractionTiming = () => {
  const startTiming = useCallback((interactionName: string) => {
    const endTiming = getPerformanceMonitor().startTiming(`interaction_${interactionName}`)
    return endTiming
  }, [])

  return { startTiming }
}

// Utility function to measure async operations
export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  const endTiming = getPerformanceMonitor().startTiming(`async_${name}`)
  try {
    const result = await operation()
    endTiming()
    return result
  } catch (error) {
    endTiming()
    throw error
  }
}

export default usePerformanceMonitor
