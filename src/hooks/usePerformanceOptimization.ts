/**
 * usePerformanceOptimization.ts
 *
 * Hook that provides performance optimization utilities for React components,
 * including scroll handling, visibility detection, and render optimization.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Types for performance tracking
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  memoryUsage?: number;
}

export interface ScrollState {
  scrollY: number;
  scrollX: number;
  scrollDirection: 'up' | 'down' | 'left' | 'right' | null;
  isAtTop: boolean;
  isAtBottom: boolean;
  isScrolling: boolean;
}

export interface IntersectionState {
  isVisible: boolean;
  intersectionRatio: number;
  isIntersecting: boolean;
  boundingRect: DOMRectReadOnly | null;
}

export interface UsePerformanceOptimizationOptions {
  enableScrollTracking?: boolean;
  enableVisibilityTracking?: boolean;
  enablePerformanceTracking?: boolean;
  scrollThrottleMs?: number;
  visibilityThreshold?: number;
  performanceTrackingEnabled?: boolean;
}

export interface UsePerformanceOptimizationReturn {
  // Scroll state and handlers
  scrollState: ScrollState;
  scrollToTop: () => void;
  scrollToElement: (element: HTMLElement, offset?: number) => void;

  // Visibility state
  visibilityState: IntersectionState;
  observeElement: (element: HTMLElement | null) => void;

  // Performance metrics
  performanceMetrics: PerformanceMetrics;
  trackRender: (renderTime?: number) => void;
  resetMetrics: () => void;

  // Utility functions
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ) => T;
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ) => T;

  // Memory and cleanup
  forceCleanup: () => void;
}

/**
 * Hook that provides comprehensive performance optimization utilities
 */
export const usePerformanceOptimization = ({
  enableScrollTracking = false,
  enableVisibilityTracking = false,
  enablePerformanceTracking = false,
  scrollThrottleMs = 16, // ~60fps
  visibilityThreshold = 0.1,
  performanceTrackingEnabled = false
}: UsePerformanceOptimizationOptions = {}): UsePerformanceOptimizationReturn => {

  // Scroll state
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    scrollX: 0,
    scrollDirection: null,
    isAtTop: true,
    isAtBottom: false,
    isScrolling: false
  });

  // Visibility state
  const [visibilityState, setVisibilityState] = useState<IntersectionState>({
    isVisible: false,
    intersectionRatio: 0,
    isIntersecting: false,
    boundingRect: null
  });

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0
  });

  // Refs
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const lastScrollYRef = useRef(0);
  const lastScrollXRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);

  // Scroll handling
  const handleScroll = useCallback(() => {
    if (!enableScrollTracking) return;

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    const scrollDirection: ScrollState['scrollDirection'] =
      scrollY > lastScrollYRef.current ? 'down' :
      scrollY < lastScrollYRef.current ? 'up' :
      scrollX > lastScrollXRef.current ? 'right' :
      scrollX < lastScrollXRef.current ? 'left' : null;

    const newScrollState: ScrollState = {
      scrollY,
      scrollX,
      scrollDirection,
      isAtTop: scrollY <= 10,
      isAtBottom: scrollY + windowHeight >= documentHeight - 10,
      isScrolling: true
    };

    setScrollState(newScrollState);

    // Update refs
    lastScrollYRef.current = scrollY;
    lastScrollXRef.current = scrollX;

    // Clear scrolling flag after a delay
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setScrollState(prev => ({ ...prev, isScrolling: false }));
    }, 150);
  }, [enableScrollTracking]);

  // Throttled scroll handler
  const throttledScrollHandler = useMemo(() => {
    if (!enableScrollTracking) return () => {};

    return throttle(handleScroll, scrollThrottleMs);
  }, [handleScroll, scrollThrottleMs, enableScrollTracking]);

  // Intersection observer setup
  const observeElement = useCallback((element: HTMLElement | null) => {
    if (!enableVisibilityTracking) return;

    // Clean up previous observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }

    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setVisibilityState({
          isVisible: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          isIntersecting: entry.isIntersecting,
          boundingRect: entry.boundingClientRect
        });
      },
      {
        threshold: visibilityThreshold,
        rootMargin: '0px'
      }
    );

    observer.observe(element);
    intersectionObserverRef.current = observer;
  }, [enableVisibilityTracking, visibilityThreshold]);

  // Performance tracking
  const trackRender = useCallback((renderTime?: number) => {
    if (!enablePerformanceTracking) return;

    const now = Date.now();
    const actualRenderTime = renderTime || now;

    setPerformanceMetrics(prev => {
      const newRenderTimes = [...renderTimesRef.current.slice(-49), actualRenderTime]; // Keep last 50
      renderTimesRef.current = newRenderTimes;

      const totalRenderTime = newRenderTimes.reduce((sum, time) => sum + time, 0);
      const averageRenderTime = totalRenderTime / newRenderTimes.length;

      return {
        renderCount: prev.renderCount + 1,
        lastRenderTime: actualRenderTime,
        averageRenderTime,
        totalRenderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      };
    });
  }, [enablePerformanceTracking]);

  // Scroll utilities
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToElement = useCallback((element: HTMLElement, offset = 0) => {
    const elementTop = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementTop + offset,
      behavior: 'smooth'
    });
  }, []);

  // Utility functions
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): T => {
    let timeout: NodeJS.Timeout | null = null;

    return ((...args: any[]) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };

      const callNow = immediate && !timeout;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func(...args);
    }) as T;
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;

    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setPerformanceMetrics({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0
    });
    renderTimesRef.current = [];
  }, []);

  // Cleanup function
  const forceCleanup = useCallback(() => {
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
      intersectionObserverRef.current = null;
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    resetMetrics();
  }, [resetMetrics]);

  // Effects
  useEffect(() => {
    if (enableScrollTracking) {
      window.addEventListener('scroll', throttledScrollHandler, { passive: true });

      // Initial scroll state
      handleScroll();

      return () => {
        window.removeEventListener('scroll', throttledScrollHandler);
      };
    }
  }, [enableScrollTracking, throttledScrollHandler, handleScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      forceCleanup();
    };
  }, [forceCleanup]);

  return {
    // Scroll state and handlers
    scrollState,
    scrollToTop,
    scrollToElement,

    // Visibility state
    visibilityState,
    observeElement,

    // Performance metrics
    performanceMetrics,
    trackRender,
    resetMetrics,

    // Utility functions
    debounce,
    throttle,

    // Memory and cleanup
    forceCleanup
  };
};


