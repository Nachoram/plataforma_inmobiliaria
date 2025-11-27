import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getAnalytics, trackEvent, trackNavigation, trackInteraction, trackError, trackOfferAction, trackSearch, trackConversion } from '../lib/analytics';

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackInteractions?: boolean;
  trackErrors?: boolean;
  offerId?: string;
  userId?: string;
  userRole?: string;
}

/**
 * Hook personalizado para integrar analytics en componentes
 */
export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const {
    trackPageViews = true,
    trackInteractions = true,
    trackErrors = true,
    offerId,
    userId,
    userRole
  } = options;

  const location = useLocation();
  const previousPath = useRef<string>(location.pathname);
  const pageStartTime = useRef<number>(Date.now());
  const analytics = getAnalytics();

  // Configurar usuario en analytics
  useEffect(() => {
    if (userId) {
      analytics.setUser(userId, userRole);
    }
  }, [userId, userRole, analytics]);

  // Trackear cambios de página
  useEffect(() => {
    if (!trackPageViews) return;

    const currentPath = location.pathname;

    if (previousPath.current !== currentPath) {
      // Trackear tiempo en página anterior
      const timeSpent = Date.now() - pageStartTime.current;
      if (timeSpent > 1000) { // Solo si pasó más de 1 segundo
        trackEvent({
          name: 'time_on_page',
          category: 'engagement',
          action: 'time_spent',
          label: previousPath.current,
          value: Math.round(timeSpent / 1000),
          metadata: {
            from: previousPath.current,
            to: currentPath,
            timeSpent
          }
        });
      }

      // Trackear navegación
      trackNavigation(previousPath.current, currentPath);

      // Resetear timer para nueva página
      pageStartTime.current = Date.now();
      previousPath.current = currentPath;
    }
  }, [location.pathname, trackPageViews]);

  // Trackear tiempo en página al desmontar
  useEffect(() => {
    return () => {
      if (trackPageViews) {
        const timeSpent = Date.now() - pageStartTime.current;
        if (timeSpent > 1000) {
          trackEvent({
            name: 'time_on_page',
            category: 'engagement',
            action: 'time_spent',
            label: location.pathname,
            value: Math.round(timeSpent / 1000),
            metadata: { timeSpent }
          });
        }
      }
    };
  }, [location.pathname, trackPageViews]);

  // Trackear errores en el componente
  useEffect(() => {
    if (!trackErrors) return;

    const handleError = (error: ErrorEvent) => {
      trackError(error.error || new Error(error.message), {
        component: 'useAnalytics',
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        url: window.location.href
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(event.reason), {
        component: 'useAnalytics',
        type: 'unhandled_promise_rejection',
        url: window.location.href
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackErrors]);

  // Funciones de tracking específicas
  const trackButtonClick = useCallback((buttonName: string, metadata?: Record<string, any>) => {
    if (!trackInteractions) return;

    trackInteraction('click', `button:${buttonName}`, metadata);
  }, [trackInteractions]);

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, any>) => {
    if (!trackInteractions) return;

    trackInteraction('submit', `form:${formName}`, metadata);
  }, [trackInteractions]);

  const trackTabChange = useCallback((tabName: string, metadata?: Record<string, any>) => {
    if (!trackInteractions) return;

    trackInteraction('change', `tab:${tabName}`, metadata);
  }, [trackInteractions]);

  const trackSearchQuery = useCallback((query: string, results: number, filters?: Record<string, any>) => {
    trackSearch(query, results, filters);
  }, []);

  const trackOfferInteraction = useCallback((action: string, metadata?: Record<string, any>) => {
    if (!offerId) return;

    trackOfferAction(action, offerId, metadata);
  }, [offerId]);

  const trackCustomEvent = useCallback((event: Omit<Parameters<typeof trackEvent>[0], 'timestamp' | 'sessionId' | 'url' | 'userAgent' | 'viewport'>) => {
    trackEvent(event);
  }, []);

  const trackGoal = useCallback((goalName: string, value?: number, metadata?: Record<string, any>) => {
    trackConversion(goalName, value, metadata);
  }, []);

  return {
    // Funciones de tracking
    trackButtonClick,
    trackFormSubmit,
    trackTabChange,
    trackSearchQuery,
    trackOfferInteraction,
    trackCustomEvent,
    trackGoal,

    // Información de sesión
    sessionId: analytics.sessionId,

    // Utilidades
    analyticsEnabled: analytics.config.enabled,
    debugMode: analytics.config.debug
  };
};
