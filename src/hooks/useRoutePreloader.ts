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
    import('../components/marketplace/MarketplacePage');

    // Prefetch de rutas comunes (con delay para no bloquear)
    const prefetchCommonRoutes = () => {
      setTimeout(() => {
        // Prefetch de formularios (probablemente visitados después del marketplace)
        import('../components/properties/PropertyFormPage');
        import('../components/properties/PropertyDetailsPage');

        // Prefetch de dashboard (visitado por usuarios activos)
        import('../components/dashboard/ApplicationsPage');
        import('../components/portfolio/PortfolioPage');
      }, 2000); // Delay de 2 segundos

      setTimeout(() => {
        // Prefetch de contratos (menos frecuente pero importante)
        import('../components/contracts/ContractManagementPage');
      }, 5000); // Delay de 5 segundos
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
    import('../components/marketplace/OfferModal');

    // Prefetch de formularios de publicación
    setTimeout(() => {
      import('../components/properties/SalePublicationForm');
    }, 1000);
  }, []);
};

/**
 * Hook para precargar rutas de contratos cuando se accede a secciones relacionadas
 */
export const useContractRoutePreloader = () => {
  useEffect(() => {
    // Preload de visor de contratos
    import('../components/contracts/ContractViewerPage');
    import('../components/contracts/HTMLContractViewer');

    // Prefetch de editor de contratos
    setTimeout(() => {
      import('../components/contracts/ContractEditor');
      import('../components/contracts/ContractApprovalWorkflow');
    }, 1500);
  }, []);
};

/**
 * Función utilitaria para precargar manualmente una ruta específica
 */
export const preloadRoute = async (routeName: string) => {
  try {
    switch (routeName) {
      case 'auth':
        await import('../components/auth/AuthPage');
        break;
      case 'marketplace':
        await import('../components/marketplace/MarketplacePage');
        break;
      case 'portfolio':
        await import('../components/portfolio/PortfolioPage');
        break;
      case 'applications':
        await import('../components/dashboard/ApplicationsPage');
        break;
      case 'contracts':
        await import('../components/contracts/ContractManagementPage');
        break;
      case 'property-form':
        await import('../components/properties/PropertyFormPage');
        break;
      default:
        console.warn(`Ruta no reconocida para preload: ${routeName}`);
    }
  } catch (error) {
    console.error(`Error preloading route ${routeName}:`, error);
  }
};
