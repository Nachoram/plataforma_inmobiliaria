import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  Clock,
  User,
  Globe,
  Tag,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { getAdvancedLogger, LogEntry, LogLevel, LogCategory, LogStats } from '../../lib/advancedLogger';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: {
    level?: LogLevel;
    category?: LogCategory;
  };
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose, initialFilter }) => {
  const logger = getAdvancedLogger();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [showStats, setShowStats] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar logs iniciales
  useEffect(() => {
    if (isOpen) {
      loadLogs();
      loadStats();

      if (initialFilter) {
        if (initialFilter.level) setLevelFilter(initialFilter.level);
        if (initialFilter.category) setCategoryFilter(initialFilter.category);
      }
    }
  }, [isOpen, initialFilter]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isOpen) return;

    const interval = setInterval(() => {
      loadLogs();
      loadStats();
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  const loadLogs = () => {
    const filter: any = {};

    if (levelFilter !== 'all') filter.level = levelFilter;
    if (categoryFilter !== 'all') filter.category = categoryFilter;

    // Calcular rango de tiempo
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    filter.startDate = startDate;

    const entries = logger.getEntries(200, filter); // Últimas 200 entries
    setLogs(entries);
  };

  const loadStats = () => {
    const statsData = logger.getStats(timeRange);
    setStats(statsData);
  };

  // Logs filtrados por búsqueda
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;

    const lowerSearch = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.message.toLowerCase().includes(lowerSearch) ||
      log.category.toLowerCase().includes(lowerSearch) ||
      log.tags?.some(tag => tag.toLowerCase().includes(lowerSearch)) ||
      JSON.stringify(log.data).toLowerCase().includes(lowerSearch)
    );
  }, [logs, searchTerm]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-700" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryColor = (category: LogCategory) => {
    const colors = {
      auth: 'bg-purple-100 text-purple-800',
      api: 'bg-green-100 text-green-800',
      ui: 'bg-cyan-100 text-cyan-800',
      performance: 'bg-orange-100 text-orange-800',
      error: 'bg-red-100 text-red-800',
      security: 'bg-pink-100 text-pink-800',
      business: 'bg-indigo-100 text-indigo-800',
      system: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const exportLogs = (format: 'json' | 'csv') => {
    const data = logger.exportLogs(format, {
      level: levelFilter !== 'all' ? levelFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined
    });

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
      logger.clearEntries();
      setLogs([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug className="h-6 w-6" />
            <h2 className="text-xl font-bold">Visor de Logs</h2>
            <span className="text-sm bg-gray-700 px-2 py-1 rounded">
              {filteredLogs.length} logs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2 rounded transition-colors ${
                showStats ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Mostrar estadísticas"
            >
              <BarChart3 className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                loadLogs();
                loadStats();
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los niveles</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as LogCategory | 'all')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                <option value="auth">Autenticación</option>
                <option value="api">API</option>
                <option value="ui">UI</option>
                <option value="performance">Performance</option>
                <option value="error">Error</option>
                <option value="security">Seguridad</option>
                <option value="business">Negocio</option>
                <option value="system">Sistema</option>
              </select>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">Última hora</option>
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh
              </label>

              <button
                onClick={() => exportLogs('json')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 inline mr-1" />
                JSON
              </button>

              <button
                onClick={() => exportLogs('csv')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 inline mr-1" />
                CSV
              </button>

              <button
                onClick={clearLogs}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Logs List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Cargando logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bug className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay logs disponibles</h3>
                <p>Ajusta los filtros o espera a que se generen nuevos logs.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getLevelIcon(log.level)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.category)}`}>
                            {log.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp.toLocaleString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>

                        <p className="text-gray-900 dark:text-white mb-2">{log.message}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          {log.userId && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User: {log.userId}
                            </span>
                          )}
                          {log.url && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                URL
                              </a>
                            </span>
                          )}
                          {log.correlationId && (
                            <span>ID: {log.correlationId.substring(0, 8)}</span>
                          )}
                        </div>

                        {log.tags && log.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {log.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {log.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                              Ver datos adicionales
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}

                        {log.stackTrace && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                              Ver stack trace
                            </summary>
                            <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900 rounded text-xs overflow-x-auto text-red-800 dark:text-red-200">
                              {log.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Panel */}
          {showStats && stats && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-600 p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Estadísticas
              </h3>

              {/* Overview Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Total Logs
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.errors.length}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Errores
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.warnings.length}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Warnings
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.byLevel.info}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Info Logs
                  </div>
                </div>
              </div>

              {/* Level Breakdown */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                  Por Nivel
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.byLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{level}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                  Por Categoría
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Errors */}
              {stats.topErrors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                    Errores Más Comunes
                  </h4>
                  <div className="space-y-2">
                    {stats.topErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-red-600 dark:text-red-400 truncate" title={error.message}>
                          {error.message.substring(0, 40)}...
                        </div>
                        <div className="text-gray-500">
                          {error.count} veces • Último: {error.lastSeen.toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                  Actividad Reciente
                </h4>
                <div className="space-y-2">
                  {stats.recentActivity.slice(0, 10).map((log, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {getLevelIcon(log.level)}
                      <span className="flex-1 truncate">{log.message}</span>
                      <span className="text-gray-500">
                        {log.timestamp.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



