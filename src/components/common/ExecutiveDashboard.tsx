import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  DollarSign,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  X,
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { useExecutiveDashboard } from '../../hooks/useExecutiveDashboard';

interface ExecutiveDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ isOpen, onClose }) => {
  const {
    dashboardData,
    loading,
    lastUpdated,
    autoRefresh,
    calculatedMetrics,
    loadDashboardData,
    setAutoRefresh,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatBytes
  } = useExecutiveDashboard();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  if (!isOpen) return null;

  const KPICard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    format = 'number'
  }: {
    title: string;
    value: number;
    icon: any;
    trend?: { change: number; changePercent: number };
    color?: string;
    format?: 'number' | 'currency' | 'percent';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };

    const formatValue = () => {
      switch (format) {
        case 'currency':
          return formatCurrency(value);
        case 'percent':
          return formatPercent(value);
        default:
          return formatNumber(value);
      }
    };

    return (
      <div className={`p-6 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-6 w-6" />
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.changePercent >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trend.changePercent).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">{formatValue()}</div>
        <div className="text-sm opacity-75">{title}</div>
        {trend && (
          <div className="text-xs mt-2 opacity-60">
            {trend.change >= 0 ? '+' : ''}{formatNumber(trend.change)} desde ayer
          </div>
        )}
      </div>
    );
  };

  const AlertCard = ({ alert }: { alert: any }) => {
    const colorClasses = {
      critical: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconClasses = {
      critical: AlertTriangle,
      warning: AlertTriangle,
      info: CheckCircle
    };

    const Icon = iconClasses[alert.type as keyof typeof iconClasses];

    return (
      <div className={`p-4 rounded-lg border ${colorClasses[alert.type as keyof typeof colorClasses]}`}>
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium">{alert.title}</h4>
            <p className="text-sm opacity-75 mt-1">{alert.message}</p>
            <div className="text-xs opacity-60 mt-2">
              {alert.timestamp.toLocaleString('es-ES')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }: { activity: any }) => {
    const iconClasses = {
      user: Users,
      offer: Target,
      transaction: DollarSign,
      system: Activity
    };

    const statusColors = {
      success: 'text-green-500',
      warning: 'text-yellow-500',
      error: 'text-red-500',
      info: 'text-blue-500'
    };

    const Icon = iconClasses[activity.type as keyof typeof iconClasses];

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className={`p-2 rounded-full ${
          activity.status ? statusColors[activity.status as keyof typeof statusColors] : 'text-gray-500'
        } bg-current bg-opacity-10`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{activity.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
          <div className="text-xs text-gray-500 mt-2">
            {activity.timestamp.toLocaleString('es-ES')}
          </div>
        </div>
      </div>
    );
  };

  // Simple chart component (en producción usar una librería como recharts)
  const SimpleChart = ({ data, type }: { data: any[]; type: 'line' | 'bar' | 'pie' }) => {
    if (type === 'pie') {
      const total = data.reduce((sum, item) => sum + item.count, 0);
      return (
        <div className="flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: `hsl(${(index * 360) / data.length}, 70%, 50%)` }}
              />
              <span className="text-sm flex-1">{item.status}</span>
              <span className="text-sm font-medium">{item.count}</span>
              <span className="text-xs text-gray-500">({((item.count / total) * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      );
    }

    // Simple line/bar representation
    const maxValue = Math.max(...data.map(item => item.users || item.count || 0));
    return (
      <div className="flex items-end gap-2 h-32">
        {data.map((item, index) => {
          const value = item.users || item.count || 0;
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-full bg-blue-500 rounded-t transition-all duration-300"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-center">{item.month || item.status}</span>
              <span className="text-xs font-medium">{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-lg">Cargando dashboard ejecutivo...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            <h2 className="text-xl font-bold">Dashboard Ejecutivo</h2>
            {lastUpdated && (
              <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="1h">Última hora</option>
              <option value="24h">Últimas 24h</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>

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
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Actualizar datos"
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

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {dashboardData && (
            <>
              {/* KPI Cards */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Indicadores Clave de Rendimiento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <KPICard
                    title="Usuarios Totales"
                    value={dashboardData.businessKPIs.totalUsers}
                    icon={Users}
                    color="blue"
                    trend={dashboardData.trends.find(t => t.metric === 'Nuevos Usuarios')}
                  />
                  <KPICard
                    title="Propiedades Activas"
                    value={dashboardData.businessKPIs.totalProperties}
                    icon={Building}
                    color="green"
                  />
                  <KPICard
                    title="Ofertas Activas"
                    value={dashboardData.businessKPIs.activeOffers}
                    icon={Target}
                    color="purple"
                    trend={dashboardData.trends.find(t => t.metric === 'Nuevas Ofertas')}
                  />
                  <KPICard
                    title="Transacciones Completadas"
                    value={dashboardData.businessKPIs.completedTransactions}
                    icon={DollarSign}
                    color="yellow"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="Valor Promedio Oferta"
                    value={dashboardData.businessKPIs.averageOfferValue}
                    icon={DollarSign}
                    color="indigo"
                    format="currency"
                  />
                  <KPICard
                    title="Tasa de Conversión"
                    value={dashboardData.businessKPIs.conversionRate}
                    icon={TrendingUp}
                    color="green"
                    format="percent"
                  />
                  <KPICard
                    title="Tasa de Error Sistema"
                    value={dashboardData.systemMetrics.errorRate}
                    icon={AlertTriangle}
                    color="red"
                    format="percent"
                  />
                  <KPICard
                    title="Uptime Sistema"
                    value={dashboardData.systemMetrics.uptime}
                    icon={Shield}
                    color="blue"
                    format="percent"
                  />
                </div>
              </div>

              {/* Métricas Calculadas */}
              {calculatedMetrics && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Métricas Avanzadas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                      title="Tasa de Engagement"
                      value={calculatedMetrics.userEngagementRate}
                      icon={Activity}
                      color="cyan"
                      format="percent"
                    />
                    <KPICard
                      title="Eficiencia Conversión"
                      value={calculatedMetrics.offerConversionEfficiency}
                      icon={Zap}
                      color="orange"
                      format="percent"
                    />
                    <KPICard
                      title="Puntuación Salud Sistema"
                      value={calculatedMetrics.systemHealthScore}
                      icon={Shield}
                      color="green"
                      format="percent"
                    />
                    <KPICard
                      title="Ingresos por Usuario"
                      value={calculatedMetrics.revenuePerUser}
                      icon={DollarSign}
                      color="purple"
                      format="currency"
                    />
                  </div>
                </div>
              )}

              {/* Charts and Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Charts */}
                <div className="lg:col-span-2 space-y-6">
                  {dashboardData.charts.map(chart => (
                    <div key={chart.id} className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">
                        {chart.title}
                      </h4>
                      <SimpleChart data={chart.data} type={chart.type} />
                    </div>
                  ))}
                </div>

                {/* Alerts and Activity */}
                <div className="space-y-6">
                  {/* Alerts */}
                  {dashboardData.alerts.length > 0 && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">
                        Alertas ({dashboardData.alerts.length})
                      </h4>
                      <div className="space-y-3">
                        {dashboardData.alerts.map(alert => (
                          <AlertCard key={alert.id} alert={alert} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">
                      Actividad Reciente
                    </h4>
                    <div className="space-y-1">
                      {dashboardData.recentActivity.map(activity => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </div>

                  {/* System Metrics */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                    <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">
                      Métricas del Sistema
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tiempo de Respuesta:</span>
                        <span className="font-medium">{dashboardData.systemMetrics.responseTime.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Throughput:</span>
                        <span className="font-medium">{dashboardData.systemMetrics.throughput.toFixed(1)}/min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Memoria:</span>
                        <span className="font-medium">{dashboardData.systemMetrics.memoryUsage.toFixed(1)} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Almacenamiento:</span>
                        <span className="font-medium">{formatBytes(dashboardData.systemMetrics.storageUsage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Conexiones:</span>
                        <span className="font-medium">{dashboardData.systemMetrics.activeConnections}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


