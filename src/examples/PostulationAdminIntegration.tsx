/**
 * PostulationAdminIntegration.tsx
 *
 * Ejemplo de integración del PostulationAdminPanel con todas las fases implementadas
 * Muestra cómo usar cada versión del componente según las necesidades
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importar las diferentes versiones del componente
import PostulationAdminPanel from '../components/applications/PostulationAdminPanel'; // Original
import { PostulationAdminPanelPhase2 } from '../components/applications/PostulationAdminPanel.phase2'; // Fase 2
import { PostulationAdminPanelPhase3 } from '../components/applications/PostulationAdminPanel.phase3'; // Fase 3

// PWA Provider para Fase 3
import { PWAProvider } from '../components/PWAProvider';

/**
 * App principal con routing para diferentes versiones
 */
export const AppWithPostulationVersions: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Versión original (legacy) */}
        <Route
          path="/postulation/:id/admin"
          element={<PostulationAdminPanel />}
        />

        {/* Versión Fase 2 (optimizada) */}
        <Route
          path="/postulation/:id/admin/v2"
          element={<PostulationAdminPanelPhase2 />}
        />

        {/* Versión Fase 3 (PWA completa) */}
        <Route
          path="/postulation/:id/admin/v3"
          element={
            <PWAProvider
              enableOfflineSupport={true}
              enableBackgroundSync={true}
              enableCaching={true}
            >
              <PostulationAdminPanelPhase3 />
            </PWAProvider>
          }
        />
      </Routes>
    </Router>
  );
};

/**
 * Hook personalizado para elegir versión del componente
 */
export const usePostulationAdminVersion = (version: 'v1' | 'v2' | 'v3' = 'v3') => {
  const getComponent = React.useCallback(() => {
    switch (version) {
      case 'v1':
        return PostulationAdminPanel;
      case 'v2':
        return PostulationAdminPanelPhase2;
      case 'v3':
        return PostulationAdminPanelPhase3;
      default:
        return PostulationAdminPanelPhase3;
    }
  }, [version]);

  const needsPWAProvider = version === 'v3';

  return {
    Component: getComponent(),
    needsPWAProvider,
    version
  };
};

/**
 * Componente wrapper inteligente que elige la mejor versión
 */
export const SmartPostulationAdmin: React.FC<{
  version?: 'v1' | 'v2' | 'v3';
  autoUpgrade?: boolean;
}> = ({ version, autoUpgrade = true }) => {
  // Detectar capacidades del navegador para auto-upgrade
  const getOptimalVersion = React.useCallback(() => {
    if (!autoUpgrade) return version || 'v1';

    // Verificar Service Worker support (PWA)
    if ('serviceWorker' in navigator && 'caches' in window) {
      return 'v3';
    }

    // Verificar React.lazy support (Fase 2)
    if ('lazy' in React) {
      return 'v2';
    }

    return 'v1';
  }, [version, autoUpgrade]);

  const optimalVersion = getOptimalVersion();
  const { Component, needsPWAProvider } = usePostulationAdminVersion(optimalVersion);

  const componentElement = <Component />;

  if (needsPWAProvider) {
    return (
      <PWAProvider
        enableOfflineSupport={true}
        enableBackgroundSync={true}
        enableCaching={true}
      >
        {componentElement}
      </PWAProvider>
    );
  }

  return componentElement;
};

/**
 * Página de comparación entre versiones
 * Útil para testing y comparación de performance
 */
export const PostulationVersionsComparison: React.FC = () => {
  const [activeVersion, setActiveVersion] = React.useState<'v1' | 'v2' | 'v3'>('v3');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con selector de versión */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            PostulationAdminPanel - Comparación de Versiones
          </h1>

          <div className="flex space-x-4 mb-4">
            {[
              { key: 'v1' as const, label: 'Versión 1 (Original)', color: 'bg-red-100 text-red-800' },
              { key: 'v2' as const, label: 'Versión 2 (Optimizada)', color: 'bg-yellow-100 text-yellow-800' },
              { key: 'v3' as const, label: 'Versión 3 (PWA Completa)', color: 'bg-green-100 text-green-800' }
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveVersion(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeVersion === key
                    ? `${color} ring-2 ring-offset-2 ring-blue-500`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Información de la versión seleccionada */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              {activeVersion === 'v1' && 'Versión 1: Arquitectura Original'}
              {activeVersion === 'v2' && 'Versión 2: Performance Optimizada'}
              {activeVersion === 'v3' && 'Versión 3: PWA Enterprise'}
            </h3>
            <div className="text-blue-800 text-sm">
              {activeVersion === 'v1' && 'Componente monolítico original de 2470 líneas sin optimizaciones.'}
              {activeVersion === 'v2' && 'Lazy loading, useReducer, memoización y navegación accesible.'}
              {activeVersion === 'v3' && 'Service Worker, virtual scrolling, caching avanzado y offline completo.'}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de la versión seleccionada */}
      <div className="flex-1">
        <SmartPostulationAdmin version={activeVersion} autoUpgrade={false} />
      </div>

      {/* Footer con métricas */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
              <div className="space-y-1 text-gray-600">
                <div>v1: Bundle completo al inicio</div>
                <div>v2: Lazy loading de pestañas</div>
                <div>v3: Virtual scrolling + PWA</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Offline Support</h4>
              <div className="space-y-1 text-gray-600">
                <div>v1: Sin soporte offline</div>
                <div>v2: Sin soporte offline</div>
                <div>v3: Service Worker completo</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Developer Experience</h4>
              <div className="space-y-1 text-gray-600">
                <div>v1: Código monolítico</div>
                <div>v2: Hooks especializados</div>
                <div>v3: Arquitectura enterprise</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * HOC para agregar métricas de performance a cualquier versión
 */
export const withPerformanceMetrics = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const [metrics, setMetrics] = React.useState({
      renderCount: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      lastRenderTime: 0
    });

    const trackRender = React.useCallback((renderTime?: number) => {
      const now = Date.now();
      const actualRenderTime = renderTime || now;

      setMetrics(prev => {
        const newRenderCount = prev.renderCount + 1;
        const newTotalTime = prev.totalRenderTime + actualRenderTime;
        const newAverageTime = newTotalTime / newRenderCount;

        return {
          renderCount: newRenderCount,
          averageRenderTime: newAverageTime,
          totalRenderTime: newTotalTime,
          lastRenderTime: actualRenderTime
        };
      });
    }, []);

    React.useEffect(() => {
      trackRender();
    });

    // Mostrar métricas en desarrollo
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 [${componentName}] Performance Metrics:`, metrics);
      }
    }, [metrics, componentName]);

    return (
      <>
        <Component {...props} ref={ref} />
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs font-mono z-50">
            <div className="font-bold mb-1">{componentName}</div>
            <div>Renders: {metrics.renderCount}</div>
            <div>Avg Time: {metrics.averageRenderTime.toFixed(2)}ms</div>
            <div>Last: {metrics.lastRenderTime}ms</div>
          </div>
        )}
      </>
    );
  });
};

/**
 * Versión con métricas de todas las versiones
 */
export const PostulationAdminWithMetrics = withPerformanceMetrics(
  PostulationAdminPanel,
  'PostulationAdmin v1'
);

export const PostulationAdminPhase2WithMetrics = withPerformanceMetrics(
  PostulationAdminPanelPhase2,
  'PostulationAdmin v2'
);

export const PostulationAdminPhase3WithMetrics = withPerformanceMetrics(
  PostulationAdminPanelPhase3,
  'PostulationAdmin v3'
);

export default AppWithPostulationVersions;


