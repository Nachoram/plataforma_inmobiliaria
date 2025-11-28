import { useEffect } from 'react';

/**
 * Hook para precargar rutas críticas de la aplicación
 * Mejora la experiencia de navegación al precargar chunks importantes
 */
export const useRoutePreloader = () => {
  useEffect(() => {
    // Preload crítico: Auth components (siempre necesario)
    import('../components/auth/AuthPage');
    import('../components/auth/AuthForm');

    // Preload importante: Marketplace (página principal después del login)
    import('../components/panel/PanelPage');

    // Prefetch de rutas comunes (con delay para no bloquear)
    const prefetchCommonRoutes = () => {
      setTimeout(() => {
        // Prefetch de formularios (probablemente visitados después del panel)
        import('../components/properties/PropertyFormPage');
        import('../components/properties/PropertyDetailsPage');

        // Prefetch de dashboard (visitado por usuarios activos)
        import('../components/dashboard/ApplicationsPage');
        import('../components/portfolio/PortfolioPage');

        // Prefetch de calendario (nueva funcionalidad crítica)
        import('../components/profile/UserProfilePage');
      }, 2000); // Delay de 2 segundos

      // Contracts are now admin-only and don't need public preloading
    };

    prefetchCommonRoutes();
  }, []);
};

/**
 * Hook específico para precargar rutas relacionadas con propiedades
 */
export const usePropertyRoutePreloader = () => {
  useEffect(() => {
    // Preload inmediato de componentes relacionados con propiedades
    import('../components/properties/RentalApplicationForm');

    // Prefetch de formularios de publicación
    setTimeout(() => {
      import('../components/properties/SalePublicationForm');
    }, 1000);
  }, []);
};

// Contract route preloader removed - contracts are now admin-only

/**
 * Función utilitaria para precargar manualmente una ruta específica
 */
export const preloadRoute = async (routeName: string) => {
  try {
    switch (routeName) {
      case 'auth':
        await import('../components/auth/AuthPage');
        break;
      case 'panel':
        await import('../components/panel/PanelPage');
        break;
      case 'portfolio':
        await import('../components/portfolio/PortfolioPage');
        break;
      case 'applications':
        await import('../components/dashboard/ApplicationsPage');
        break;
      case 'property-form':
        await import('../components/properties/PropertyFormPage');
        break;
      case 'profile':
        await import('../components/profile/UserProfilePage');
        break;
      case 'calendar':
        await import('../components/profile/UserCalendarSection');
        await import('../components/profile/EventDetailsModal');
        break;
      default:
        console.warn(`Ruta no reconocida para preload: ${routeName}`);
    }
  } catch (error) {
    console.error(`Error preloading route ${routeName}:`, error);
  }
};
