import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  RefreshCw,
  Download,
  Settings,
  X,
  Gauge,
  Activity
} from 'lucide-react';
import { getPerformanceOptimizer, AssetOptimizationResult } from '../../lib/performanceOptimizer';

interface PerformanceAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceAnalyzer: React.FC<PerformanceAnalyzerProps> = ({ isOpen, onClose }) => {
  const optimizer = getPerformanceOptimizer();
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'bundle' | 'recommendations'>('overview');
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      analyzePerformance();
    }
  }, [isOpen]);

  const analyzePerformance = async () => {
    setLoading(true);
    try {
      const [bundle, report] = await Promise.all([
        optimizer.analyzeBundle(),
        optimizer.generatePerformanceReport()
      ]);

      setBundleAnalysis(bundle);
      setPerformanceReport(report);
      setLastAnalysis(new Date());
    } catch (error) {
      console.error('Error analyzing performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6" />
            <h2 className="text-xl font-bold">Analizador de Performance</h2>
            {lastAnalysis && (
              <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                Análisis: {lastAnalysis.toLocaleTimeString('es-ES')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={analyzePerformance}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Actualizar análisis"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <nav className="flex">
            {[
              { id: 'overview', label: 'Resumen', icon: BarChart3 },
              { id: 'metrics', label: 'Métricas', icon: Activity },
              { id: 'bundle', label: 'Bundle', icon: HardDrive },
              { id: 'recommendations', label: 'Recomendaciones', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Analizando performance...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && performanceReport && (
                <div className="space-y-6">
                  {/* Performance Score */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Puntuación de Performance</h3>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getScoreColor(performanceReport.score)}`}>
                        {getScoreIcon(performanceReport.score)}
                        <span className="font-bold">{performanceReport.score}/100</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {performanceReport.metrics.LCP?.toFixed(0) || 'N/A'}ms
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Largest Contentful Paint</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {performanceReport.metrics.FID?.toFixed(0) || 'N/A'}ms
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">First Input Delay</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {performanceReport.metrics.CLS?.toFixed(3) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Cumulative Layout Shift</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {performanceReport.metrics.memory_usage_percent?.toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Uso de Memoria</div>
                      </div>
                    </div>
                  </div>

                  {/* Bundle Analysis Summary */}
                  {bundleAnalysis && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-semibold mb-4">Análisis de Bundle</h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatBytes(bundleAnalysis.totalSize)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Tamaño Total</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatBytes(bundleAnalysis.totalGzipSize)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Comprimido (Gzip)</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {bundleAnalysis.chunks.length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Chunks</div>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Compresión: {((1 - bundleAnalysis.totalGzipSize / bundleAnalysis.totalSize) * 100).toFixed(1)}% de reducción
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium text-blue-900 dark:text-blue-100">Limpiar Cache</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Eliminar datos en cache</div>
                        </div>
                      </button>

                      <button className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
                        <Download className="h-5 w-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium text-green-900 dark:text-green-100">Exportar Reporte</div>
                          <div className="text-sm text-green-700 dark:text-green-300">Descargar análisis completo</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics Tab */}
              {activeTab === 'metrics' && performanceReport && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Métricas Detalladas</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Core Web Vitals */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Core Web Vitals
                      </h4>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Largest Contentful Paint (LCP)</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              (performanceReport.metrics.LCP || 0) < 2500 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {performanceReport.metrics.LCP?.toFixed(0) || 'N/A'}ms
                            </span>
                            {(performanceReport.metrics.LCP || 0) < 2500 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">First Input Delay (FID)</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              (performanceReport.metrics.FID || 0) < 100 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {performanceReport.metrics.FID?.toFixed(0) || 'N/A'}ms
                            </span>
                            {(performanceReport.metrics.FID || 0) < 100 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Cumulative Layout Shift (CLS)</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              (performanceReport.metrics.CLS || 0) < 0.1 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {performanceReport.metrics.CLS?.toFixed(3) || 'N/A'}
                            </span>
                            {(performanceReport.metrics.CLS || 0) < 0.1 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Metrics */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        Métricas del Sistema
                      </h4>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Uso de Memoria</span>
                          <span className={`text-sm font-medium ${
                            (performanceReport.metrics.memory_usage_percent || 0) < 80 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {performanceReport.metrics.memory_usage_percent?.toFixed(1) || 'N/A'}%
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tiempo de Component Load</span>
                          <span className="text-sm font-medium text-blue-600">
                            {performanceReport.metrics.component_load_time?.toFixed(0) || 'N/A'}ms
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tiempo de Route Load</span>
                          <span className="text-sm font-medium text-blue-600">
                            {performanceReport.metrics.route_load_time?.toFixed(0) || 'N/A'}ms
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Peticiones por Minuto</span>
                          <span className="text-sm font-medium text-purple-600">
                            {performanceReport.metrics.network_requests_per_minute || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bundle Tab */}
              {activeTab === 'bundle' && bundleAnalysis && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Análisis de Bundle</h3>

                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {bundleAnalysis.chunks.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Chunks</div>
                      </div>

                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {formatBytes(bundleAnalysis.totalSize)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Tamaño Total</div>
                      </div>

                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {formatBytes(bundleAnalysis.totalGzipSize)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Comprimido</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {bundleAnalysis.chunks.map((chunk: any, index: number) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{chunk.name}</h4>
                            <div className="text-right text-sm">
                              <div className="font-medium">{formatBytes(chunk.size)}</div>
                              <div className="text-gray-500">({formatBytes(chunk.gzipSize)} gzip)</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {chunk.modules.length} módulos
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            {chunk.modules.slice(0, 3).join(', ')}
                            {chunk.modules.length > 3 && ` y ${chunk.modules.length - 3} más...`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && performanceReport && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Recomendaciones de Optimización</h3>

                  <div className="space-y-4">
                    {performanceReport.recommendations.map((recommendation: string, index: number) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">
                              Recomendación {index + 1}
                            </h4>
                            <p className="text-blue-800 dark:text-blue-200 mt-1">
                              {recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {performanceReport.recommendations.length === 0 && (
                      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                          ¡Excelente Performance!
                        </h4>
                        <p className="text-green-800 dark:text-green-200">
                          No se encontraron problemas significativos de performance.
                          Tu aplicación está funcionando de manera óptima.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional Optimization Tips */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <h4 className="font-semibold mb-4">Consejos Adicionales de Optimización</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Frontend</h5>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Implementar virtualización para listas grandes</li>
                          <li>• Usar React.memo para componentes estáticos</li>
                          <li>• Optimizar imágenes con WebP y lazy loading</li>
                          <li>• Minimizar el uso de bibliotecas pesadas</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Backend</h5>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Implementar caching de API responses</li>
                          <li>• Optimizar consultas de base de datos</li>
                          <li>• Usar compresión Gzip para responses</li>
                          <li>• Implementar CDN para assets estáticos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};



