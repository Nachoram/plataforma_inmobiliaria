import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getPerformanceMonitor } from '../lib/performanceMonitor';
import { getAdvancedLogger } from '../lib/advancedLogger';
import { getBackupManager } from '../lib/backupManager';

export interface BusinessKPIs {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalProperties: number;
  activeOffers: number;
  completedTransactions: number;
  averageOfferValue: number;
  conversionRate: number;
  customerSatisfaction: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

export interface SystemMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  storageUsage: number;
  activeConnections: number;
  apiCallsPerMinute: number;
}

export interface DashboardData {
  businessKPIs: BusinessKPIs;
  systemMetrics: SystemMetrics;
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
  trends: TrendData[];
  charts: ChartData[];
}

export interface ActivityItem {
  id: string;
  type: 'user' | 'offer' | 'transaction' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  value?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  period: 'day' | 'week' | 'month';
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  config?: any;
}

/**
 * Hook personalizado para dashboard ejecutivo con KPIs y métricas
 */
export const useExecutiveDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        businessKPIs,
        systemMetrics,
        recentActivity,
        alerts,
        trends,
        charts
      ] = await Promise.all([
        loadBusinessKPIs(),
        loadSystemMetrics(),
        loadRecentActivity(),
        loadAlerts(),
        loadTrends(),
        loadCharts()
      ]);

      const data: DashboardData = {
        businessKPIs,
        systemMetrics,
        recentActivity,
        alerts,
        trends,
        charts
      };

      setDashboardData(data);
      setLastUpdated(new Date());

      // Log de carga exitosa
      getAdvancedLogger().info('system', 'Dashboard data loaded successfully', {
        businessKPIsCount: Object.keys(businessKPIs).length,
        systemMetricsCount: Object.keys(systemMetrics).length,
        activitiesCount: recentActivity.length,
        alertsCount: alerts.length
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      getAdvancedLogger().error('system', 'Failed to load dashboard data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar KPIs del negocio
  const loadBusinessKPIs = async (): Promise<BusinessKPIs> => {
    try {
      // Usuarios totales
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Usuarios activos (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', thirtyDaysAgo.toISOString());

      // Nuevos usuarios este mes
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Propiedades totales
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Ofertas activas
      const { count: activeOffers } = await supabase
        .from('property_sale_offers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendiente', 'aceptada', 'contraoferta']);

      // Transacciones completadas
      const { count: completedTransactions } = await supabase
        .from('property_sale_offers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completada');

      // Valor promedio de ofertas
      const { data: offers } = await supabase
        .from('property_sale_offers')
        .select('offered_price')
        .not('offered_price', 'is', null);

      const averageOfferValue = offers && offers.length > 0
        ? offers.reduce((sum, offer) => sum + (offer.offered_price || 0), 0) / offers.length
        : 0;

      // Tasa de conversión (ofertas aceptadas / ofertas totales)
      const { count: totalOffers } = await supabase
        .from('property_sale_offers')
        .select('*', { count: 'exact', head: true });

      const { count: acceptedOffers } = await supabase
        .from('property_sale_offers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aceptada');

      const conversionRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalProperties: totalProperties || 0,
        activeOffers: activeOffers || 0,
        completedTransactions: completedTransactions || 0,
        averageOfferValue,
        conversionRate,
        customerSatisfaction: 4.2, // TODO: Implementar sistema de satisfacción
        revenueThisMonth: 0, // TODO: Implementar cálculo de ingresos
        revenueGrowth: 0 // TODO: Implementar cálculo de crecimiento
      };

    } catch (error) {
      console.error('Error loading business KPIs:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalProperties: 0,
        activeOffers: 0,
        completedTransactions: 0,
        averageOfferValue: 0,
        conversionRate: 0,
        customerSatisfaction: 0,
        revenueThisMonth: 0,
        revenueGrowth: 0
      };
    }
  };

  // Cargar métricas del sistema
  const loadSystemMetrics = async (): Promise<SystemMetrics> => {
    try {
      const performanceMonitor = getPerformanceMonitor();
      const logger = getAdvancedLogger();
      const backupManager = getBackupManager();

      // Uptime (simulado - en producción vendría del servidor)
      const uptime = 99.9;

      // Tiempo de respuesta promedio (última hora)
      const performanceMetrics = performanceMonitor.getMetrics('custom', 100);
      const responseTimes = performanceMetrics
        .filter(m => m.name.includes('response') || m.name.includes('load'))
        .map(m => m.value);

      const responseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Tasa de error
      const stats = logger.getStats('1h');
      const errorRate = stats.total > 0 ? (stats.errors.length / stats.total) * 100 : 0;

      // Throughput (llamadas por minuto)
      const throughput = stats.total / 60; // Asumiendo datos de 1 hora

      // Uso de memoria
      const memoryMetrics = performanceMonitor.getMetrics('memory', 10);
      const memoryUsage = memoryMetrics.length > 0
        ? memoryMetrics[memoryMetrics.length - 1].value / (1024 * 1024 * 1024) // GB
        : 0;

      // Uso de almacenamiento
      const backupHistory = await backupManager.getBackupHistory(1);
      const storageUsage = backupHistory.length > 0
        ? backupHistory.reduce((sum, backup) => sum + backup.size, 0) / (1024 * 1024 * 1024) // GB
        : 0;

      // Conexiones activas (simulado)
      const activeConnections = Math.floor(Math.random() * 50) + 10;

      // Llamadas API por minuto
      const apiCallsPerMinute = Math.floor(Math.random() * 100) + 20;

      return {
        uptime,
        responseTime,
        errorRate,
        throughput,
        memoryUsage,
        storageUsage,
        activeConnections,
        apiCallsPerMinute
      };

    } catch (error) {
      console.error('Error loading system metrics:', error);
      return {
        uptime: 0,
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        memoryUsage: 0,
        storageUsage: 0,
        activeConnections: 0,
        apiCallsPerMinute: 0
      };
    }
  };

  // Cargar actividad reciente
  const loadRecentActivity = async (): Promise<ActivityItem[]> => {
    try {
      const activities: ActivityItem[] = [];

      // Actividad de ofertas recientes
      const { data: recentOffers } = await supabase
        .from('property_sale_offers')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          property:property_id (
            address_street,
            address_number
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(5);

      recentOffers?.forEach(offer => {
        activities.push({
          id: `offer-${offer.id}`,
          type: 'offer',
          title: `Nueva oferta en ${offer.property?.address_street} ${offer.property?.address_number}`,
          description: `Estado: ${offer.status}`,
          timestamp: new Date(offer.updated_at),
          status: offer.status === 'aceptada' ? 'success' : 'info'
        });
      });

      // Actividad de usuarios recientes
      const { data: recentUsers } = await supabase
        .from('user_profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentUsers?.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          title: `Nuevo usuario registrado`,
          description: user.full_name || 'Usuario sin nombre',
          timestamp: new Date(user.created_at),
          status: 'success'
        });
      });

      // Actividad del sistema (logs recientes)
      const logger = getAdvancedLogger();
      const recentLogs = logger.getEntries(5);
      recentLogs.forEach(log => {
        activities.push({
          id: `system-${log.id}`,
          type: 'system',
          title: `Actividad del sistema: ${log.category}`,
          description: log.message,
          timestamp: log.timestamp,
          status: log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'info'
        });
      });

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('Error loading recent activity:', error);
      return [];
    }
  };

  // Cargar alertas
  const loadAlerts = async (): Promise<AlertItem[]> => {
    try {
      const alerts: AlertItem[] = [];

      // Alertas de sistema (errores críticos)
      const logger = getAdvancedLogger();
      const stats = logger.getStats('1h');

      if (stats.errorRate > 5) {
        alerts.push({
          id: 'high-error-rate',
          type: 'critical',
          title: 'Alta tasa de errores',
          message: `Tasa de error: ${stats.errorRate.toFixed(1)}% en la última hora`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // Alertas de backup
      const backupManager = getBackupManager();
      const backupHistory = await backupManager.getBackupHistory(1);
      const lastBackup = backupHistory[0];

      if (!lastBackup || Date.now() - lastBackup.startTime.getTime() > 24 * 60 * 60 * 1000) {
        alerts.push({
          id: 'no-recent-backup',
          type: 'warning',
          title: 'Backup desactualizado',
          message: 'No hay backups recientes (más de 24 horas)',
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // Alertas de rendimiento
      const performanceMonitor = getPerformanceMonitor();
      const performanceMetrics = performanceMonitor.getMetrics('memory', 5);
      const avgMemoryUsage = performanceMetrics.length > 0
        ? performanceMetrics.reduce((sum, m) => sum + m.value, 0) / performanceMetrics.length
        : 0;

      if (avgMemoryUsage > 500 * 1024 * 1024) { // 500MB
        alerts.push({
          id: 'high-memory-usage',
          type: 'warning',
          title: 'Alto uso de memoria',
          message: `Uso promedio de memoria: ${(avgMemoryUsage / (1024 * 1024)).toFixed(1)} MB`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      return alerts;

    } catch (error) {
      console.error('Error loading alerts:', error);
      return [];
    }
  };

  // Cargar tendencias
  const loadTrends = async (): Promise<TrendData[]> => {
    try {
      const trends: TrendData[] = [];

      // Tendencia de usuarios
      const { count: usersToday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: usersYesterday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (usersYesterday > 0) {
        const change = usersToday - usersYesterday;
        const changePercent = (change / usersYesterday) * 100;
        trends.push({
          metric: 'Nuevos Usuarios',
          current: usersToday,
          previous: usersYesterday,
          change,
          changePercent,
          period: 'day'
        });
      }

      // Tendencia de ofertas
      const { count: offersToday } = await supabase
        .from('property_sale_offers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: offersYesterday } = await supabase
        .from('property_sale_offers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (offersYesterday > 0) {
        const change = offersToday - offersYesterday;
        const changePercent = (change / offersYesterday) * 100;
        trends.push({
          metric: 'Nuevas Ofertas',
          current: offersToday,
          previous: offersYesterday,
          change,
          changePercent,
          period: 'day'
        });
      }

      return trends;

    } catch (error) {
      console.error('Error loading trends:', error);
      return [];
    }
  };

  // Cargar datos para gráficos
  const loadCharts = async (): Promise<ChartData[]> => {
    try {
      const charts: ChartData[] = [];

      // Gráfico de usuarios por mes (últimos 12 meses)
      const usersByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

        usersByMonth.push({
          month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          users: count || 0
        });
      }

      charts.push({
        id: 'users-trend',
        title: 'Usuarios Registrados por Mes',
        type: 'line',
        data: usersByMonth
      });

      // Gráfico de ofertas por estado
      const { data: offersByStatus } = await supabase
        .from('property_sale_offers')
        .select('status')
        .in('status', ['pendiente', 'aceptada', 'rechazada', 'completada']);

      const statusCounts: Record<string, number> = {};
      offersByStatus?.forEach(offer => {
        statusCounts[offer.status] = (statusCounts[offer.status] || 0) + 1;
      });

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      charts.push({
        id: 'offers-by-status',
        title: 'Ofertas por Estado',
        type: 'pie',
        data: statusData
      });

      return charts;

    } catch (error) {
      console.error('Error loading charts:', error);
      return [];
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 5 * 60 * 1000); // 5 minutos
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadDashboardData]);

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calcular métricas calculadas
  const calculatedMetrics = useMemo(() => {
    if (!dashboardData) return null;

    const { businessKPIs, systemMetrics } = dashboardData;

    return {
      userEngagementRate: businessKPIs.totalUsers > 0
        ? (businessKPIs.activeUsers / businessKPIs.totalUsers) * 100
        : 0,
      offerConversionEfficiency: businessKPIs.activeOffers > 0
        ? (businessKPIs.completedTransactions / businessKPIs.activeOffers) * 100
        : 0,
      systemHealthScore: Math.max(0, 100 - (systemMetrics.errorRate * 2) - (systemMetrics.responseTime > 1000 ? 10 : 0)),
      revenuePerUser: businessKPIs.totalUsers > 0
        ? businessKPIs.revenueThisMonth / businessKPIs.totalUsers
        : 0
    };
  }, [dashboardData]);

  return {
    // Estado
    dashboardData,
    loading,
    lastUpdated,
    autoRefresh,
    calculatedMetrics,

    // Acciones
    loadDashboardData,
    setAutoRefresh,

    // Utilidades
    formatNumber: (num: number) => new Intl.NumberFormat('es-ES').format(num),
    formatCurrency: (amount: number) => new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount),
    formatPercent: (value: number) => `${value.toFixed(1)}%`,
    formatBytes: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  };
};


