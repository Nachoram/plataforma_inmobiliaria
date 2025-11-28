import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  HardDrive,
  Wifi,
  Eye
} from 'lucide-react';
import { getPerformanceMonitor, getComponentPerformance, getPerformanceMetrics, getPerformanceAlerts } from '../../lib/performanceMonitor';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible = false,
  onToggle
}) => {
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  const [alerts, setAlerts] = useState(getPerformanceAlerts());
  const [componentStats, setComponentStats] = useState<Record<string, any>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Actualizar métricas automáticamente
  useEffect(() => {
    if (!autoRefresh || !isVisible) return;

    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
      setAlerts(getPerformanceAlerts());

      // Obtener stats de componentes principales
      const components = [
        'SalesOfferDetailView',
        'VirtualizedTimelineTab',
        'VirtualizedCommunicationTab',
        'AdvancedSearchFilters',
        'CommandControls'
      ];

      const stats: Record<string, any> = {};
      components.forEach(component => {
        const perf = getComponentPerformance(component);
        if (perf) {
          stats[component] = perf;
        }
      });

      setComponentStats(stats);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Mostrar Performance Dashboard"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
    );
  }

  // Calcular estadísticas resumidas
  const webVitals = metrics.filter(m => m.type === 'web-vital');
  const componentMetrics = metrics.filter(m => m.type === 'component');
  const networkMetrics = metrics.filter(m => m.type === 'network');
  const memoryMetrics = metrics.filter(m => m.type === 'memory');

  const avgRenderTime = componentMetrics.length > 0
    ? componentMetrics.reduce((sum, m) => sum + m.value, 0) / componentMetrics.length
    : 0;

  const avgNetworkTime = networkMetrics.length > 0
    ? networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length
    : 0;

  const latestMemory = memoryMetrics[memoryMetrics.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            <h2 className="text-xl font-bold">Performance Dashboard</h2>
            <span className="text-sm bg-gray-700 px-2 py-1 rounded">
              {metrics.length} métricas • {alerts.length} alertas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>

            <button
              onClick={() => {
                setMetrics(getPerformanceMetrics());
                setAlerts(getPerformanceAlerts());
              }}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              Refresh
            </button>

            <button
              onClick={onToggle}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Web Vitals */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Core Web Vitals</h3>
              </div>

              <div className="space-y-3">
                {webVitals.slice(-5).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono ${
                        metric.value > 2000 ? 'text-red-600' :
                        metric.value > 1000 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {metric.value.toFixed(0)}ms
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        metric.value > 2000 ? 'bg-red-500' :
                        metric.value > 1000 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                    </div>
                  </div>
                ))}

                {webVitals.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No Core Web Vitals data available
                  </p>
                )}
              </div>
            </div>

            {/* Component Performance */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Component Performance</h3>
              </div>

              <div className="space-y-3">
                {Object.entries(componentStats).map(([component, stats]: [string, any]) => (
                  <div key={component} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate" title={component}>
                        {component.replace('Component', '')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {stats.count} renders
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Avg:</span>
                        <span className={`ml-1 font-mono ${
                          stats.average > 16.67 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {stats.average}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max:</span>
                        <span className={`ml-1 font-mono ${
                          stats.max > 50 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {stats.max}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last:</span>
                        <span className={`ml-1 font-mono ${
                          stats.lastRender > 16.67 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {stats.lastRender}ms
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {Object.keys(componentStats).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No component performance data
                  </p>
                )}
              </div>
            </div>

            {/* Network Performance */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Network Performance</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Average Response Time</span>
                  <span className={`font-mono text-lg ${
                    avgNetworkTime > 1000 ? 'text-red-600' :
                    avgNetworkTime > 500 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {avgNetworkTime.toFixed(0)}ms
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  Total requests: {networkMetrics.length}
                </div>

                {/* Most recent network requests */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {networkMetrics.slice(-5).reverse().map((metric, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                      <span className="truncate max-w-32" title={metric.context?.url}>
                        {metric.context?.url?.split('/').pop() || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${
                          metric.value > 2000 ? 'text-red-600' :
                          metric.value > 1000 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {metric.value.toFixed(0)}ms
                        </span>
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          metric.context?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {metric.context?.status || 'ERR'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <HardDrive className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Memory Usage</h3>
              </div>

              {latestMemory ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {((latestMemory.value / latestMemory.context.limit) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">of heap limit</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used:</span>
                      <span className="font-mono">
                        {(latestMemory.value / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span className="font-mono">
                        {(latestMemory.context.total / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Limit:</span>
                      <span className="font-mono">
                        {(latestMemory.context.limit / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (latestMemory.value / latestMemory.context.limit) > 0.8 ? 'bg-red-500' :
                        (latestMemory.value / latestMemory.context.limit) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(latestMemory.value / latestMemory.context.limit) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Memory monitoring not available
                </p>
              )}
            </div>

            {/* Performance Alerts */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Performance Alerts</h3>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                  {alerts.length}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.slice(-10).reverse().map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-red-900">{alert.type}</div>
                          <div className="text-sm text-red-700">{alert.message}</div>
                        </div>
                      </div>
                      <div className="text-xs text-red-600">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No performance alerts
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                {avgRenderTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-blue-700">Avg Render Time</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Wifi className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {avgNetworkTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-green-700">Avg Network Time</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {metrics.length}
              </div>
              <div className="text-sm text-purple-700">Total Metrics</div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">
                {alerts.length}
              </div>
              <div className="text-sm text-orange-700">Active Alerts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


