import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  Zap,
  X,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getExternalApiService } from '../../lib/externalApi';

interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  activeLimits: number;
  topLimitedEndpoints: Array<{
    endpoint: string;
    blocked: number;
    total: number;
    blockRate: number;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    apiKeyId: string;
    endpoint: string;
    allowed: boolean;
    remaining: number;
  }>;
}

interface RateLimitDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RateLimitDashboard: React.FC<RateLimitDashboardProps> = ({ isOpen, onClose }) => {
  const externalApi = getExternalApiService();
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar estadísticas
  useEffect(() => {
    if (isOpen) {
      loadStats();

      if (autoRefresh) {
        const interval = setInterval(loadStats, 30000); // Actualizar cada 30 segundos
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // En una implementación real, el servicio tendría un método getRateLimitStats()
      // Por ahora, simulamos datos
      const mockStats: RateLimitStats = {
        totalRequests: 15420,
        blockedRequests: 127,
        activeLimits: 45,
        topLimitedEndpoints: [
          {
            endpoint: 'GET /properties',
            blocked: 45,
            total: 2340,
            blockRate: 1.92
          },
          {
            endpoint: 'POST /offers',
            blocked: 32,
            total: 890,
            blockRate: 3.60
          },
          {
            endpoint: 'GET /analytics',
            blocked: 28,
            total: 156,
            blockRate: 17.95
          },
          {
            endpoint: 'PUT /offers/*',
            blocked: 22,
            total: 678,
            blockRate: 3.24
          }
        ],
        recentActivity: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            apiKeyId: 'key_123',
            endpoint: 'GET /properties',
            allowed: true,
            remaining: 47
          },
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            apiKeyId: 'key_456',
            endpoint: 'POST /offers',
            allowed: false,
            remaining: 0
          },
          {
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
            apiKeyId: 'key_123',
            endpoint: 'GET /analytics',
            allowed: true,
            remaining: 18
          }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error loading rate limit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBlockRateColor = (rate: number) => {
    if (rate < 1) return 'text-green-600 bg-green-100';
    if (rate < 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <h2 className="text-xl font-bold">Dashboard de Rate Limiting</h2>
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
              onClick={loadStats}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Actualizar estadísticas"
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

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {loading && !stats ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Cargando estadísticas...</span>
            </div>
          ) : stats ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Total Requests
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalRequests.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Últimas 24 horas
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">
                      Requests Bloqueados
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.blockedRequests}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {((stats.blockedRequests / stats.totalRequests) * 100).toFixed(2)}% del total
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      Tasa de Éxito
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {((1 - stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Requests permitidos
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Límites Activos
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.activeLimits}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    API keys con límites
                  </div>
                </div>
              </div>

              {/* Top Limited Endpoints */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Endpoints Más Limitados
                </h3>

                <div className="space-y-3">
                  {stats.topLimitedEndpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                          {endpoint.endpoint}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getBlockRateColor(endpoint.blockRate)}`}>
                          {endpoint.blockRate.toFixed(1)}% bloqueados
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-red-600">{endpoint.blocked}</div>
                          <div className="text-xs text-gray-500">Bloqueados</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{endpoint.total}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Actividad Reciente
                </h3>

                <div className="space-y-2">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.allowed ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {activity.endpoint}
                          </div>
                          <div className="text-xs text-gray-500">
                            API Key: {activity.apiKeyId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          activity.allowed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {activity.allowed ? 'Permitido' : 'Bloqueado'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.remaining} restantes
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Limit Rules */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Reglas de Rate Limiting
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white">
                          Endpoint
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900 dark:text-white">
                          Requests/Min
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900 dark:text-white">
                          Burst Limit
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900 dark:text-white">
                          Ventana Burst
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 dark:border-gray-600">
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400">
                          GET /properties
                        </td>
                        <td className="text-center py-2 px-3">300</td>
                        <td className="text-center py-2 px-3">50</td>
                        <td className="text-center py-2 px-3">10s</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-600">
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400">
                          GET /offers
                        </td>
                        <td className="text-center py-2 px-3">200</td>
                        <td className="text-center py-2 px-3">30</td>
                        <td className="text-center py-2 px-3">10s</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-600">
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400">
                          POST /properties
                        </td>
                        <td className="text-center py-2 px-3">50</td>
                        <td className="text-center py-2 px-3">10</td>
                        <td className="text-center py-2 px-3">10s</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-600">
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400">
                          POST /offers
                        </td>
                        <td className="text-center py-2 px-3">30</td>
                        <td className="text-center py-2 px-3">5</td>
                        <td className="text-center py-2 px-3">10s</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400">
                          GET /analytics
                        </td>
                        <td className="text-center py-2 px-3">20</td>
                        <td className="text-center py-2 px-3">5</td>
                        <td className="text-center py-2 px-3">10s</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Nota:</strong> Los límites de API key pueden ser más restrictivos que las reglas
                      por defecto. El límite efectivo es el mínimo entre la regla del endpoint y el límite de la API key.
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay datos disponibles</h3>
              <p>Las estadísticas de rate limiting estarán disponibles después de las primeras requests.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



