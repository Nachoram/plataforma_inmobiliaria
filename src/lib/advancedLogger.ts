// Sistema Avanzado de Logging con Análisis y Visualización
// Captura, analiza y visualiza logs para debugging y monitoreo

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'auth' | 'api' | 'ui' | 'performance' | 'error' | 'security' | 'business' | 'system';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  ip?: string;
  stackTrace?: string;
  correlationId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  byHour: Record<string, number>;
  byDay: Record<string, number>;
  errors: LogEntry[];
  warnings: LogEntry[];
  recentActivity: LogEntry[];
  topErrors: Array<{ message: string; count: number; lastSeen: Date }>;
}

export interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  categories: LogCategory[];
  maxEntries: number;
  persistToStorage: boolean;
  sendToServer: boolean;
  batchSize: number;
  flushInterval: number;
  includeStackTrace: boolean;
  includeUserAgent: boolean;
  includeUrl: boolean;
  filters: {
    excludePatterns: RegExp[];
    includePatterns: RegExp[];
  };
}

class AdvancedLogger {
  private config: LogConfig;
  private entries: LogEntry[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_ADVANCED_LOGGING === 'true',
      level: 'info',
      categories: ['auth', 'api', 'ui', 'performance', 'error', 'security', 'business', 'system'],
      maxEntries: 1000,
      persistToStorage: true,
      sendToServer: process.env.NODE_ENV === 'production',
      batchSize: 10,
      flushInterval: 30000, // 30 segundos
      includeStackTrace: true,
      includeUserAgent: true,
      includeUrl: true,
      filters: {
        excludePatterns: [],
        includePatterns: []
      },
      ...config
    };

    this.sessionId = this.generateSessionId();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private async initialize() {
    if (this.isInitialized) return;

    console.log('📝 Inicializando Advanced Logger...');

    // Cargar logs persistidos
    if (this.config.persistToStorage) {
      await this.loadPersistedLogs();
    }

    // Configurar envío automático al servidor
    if (this.config.sendToServer) {
      this.setupAutoFlush();
    }

    // Configurar captura global de errores
    this.setupGlobalErrorCapture();

    // Configurar captura de eventos de rendimiento
    this.setupPerformanceCapture();

    this.isInitialized = true;
    console.log('✅ Advanced Logger inicializado');
  }

  // ========================================================================
  // LOGGING PRINCIPAL
  // ========================================================================

  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    tags?: string[],
    correlationId?: string
  ): void {
    if (!this.config.enabled) return;
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
      userAgent: this.config.includeUserAgent ? navigator.userAgent : undefined,
      url: this.config.includeUrl ? window.location.href : undefined,
      correlationId,
      tags: tags || [],
      metadata: {
        userId: this.getCurrentUserId(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
      }
    };

    // Agregar stack trace para errores
    if (level === 'error' || level === 'critical') {
      entry.stackTrace = this.config.includeStackTrace ? new Error().stack : undefined;
    }

    this.addEntry(entry);
  }

  // Métodos convenientes para diferentes niveles
  debug(category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string): void {
    this.log('debug', category, message, data, tags, correlationId);
  }

  info(category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string): void {
    this.log('info', category, message, data, tags, correlationId);
  }

  warn(category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string): void {
    this.log('warn', category, message, data, tags, correlationId);
  }

  error(category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string): void {
    this.log('error', category, message, data, tags, correlationId);
  }

  critical(category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string): void {
    this.log('critical', category, message, data, tags, correlationId);
  }

  // ========================================================================
  // UTILIDADES ESPECIALIZADAS
  // ========================================================================

  // Logging de API calls
  logApiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
    error?: any,
    correlationId?: string
  ): void {
    const level: LogLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;

    this.log(level, 'api', message, {
      method,
      url,
      status,
      duration,
      error: error?.message
    }, ['api', method.toLowerCase()], correlationId);
  }

  // Logging de errores de UI
  logUIError(
    component: string,
    error: Error,
    context?: any,
    correlationId?: string
  ): void {
    this.error('ui', `Error en componente ${component}: ${error.message}`, {
      component,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    }, ['ui', 'error', component], correlationId);
  }

  // Logging de performance
  logPerformance(
    metric: string,
    value: number,
    threshold?: number,
    context?: any,
    correlationId?: string
  ): void {
    const level: LogLevel = threshold && value > threshold ? 'warn' : 'info';
    const message = `Performance: ${metric} = ${value}`;

    this.log(level, 'performance', message, {
      metric,
      value,
      threshold,
      context
    }, ['performance', metric], correlationId);
  }

  // Logging de autenticación
  logAuth(
    action: string,
    success: boolean,
    userId?: string,
    error?: any,
    correlationId?: string
  ): void {
    const level: LogLevel = success ? 'info' : 'warn';
    const message = `Auth ${action}: ${success ? 'success' : 'failed'}`;

    this.log(level, 'auth', message, {
      action,
      success,
      userId,
      error: error?.message
    }, ['auth', action], correlationId);
  }

  // Logging de seguridad
  logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: any,
    correlationId?: string
  ): void {
    const levelMap = { low: 'info', medium: 'warn', high: 'error', critical: 'critical' } as const;
    const level = levelMap[severity];

    this.log(level, 'security', `Security event: ${event}`, {
      event,
      severity,
      details
    }, ['security', event, severity], correlationId);
  }

  // Logging de negocio
  logBusiness(
    event: string,
    entity: string,
    action: string,
    details?: any,
    correlationId?: string
  ): void {
    this.info('business', `Business event: ${event}`, {
      event,
      entity,
      action,
      details
    }, ['business', entity, action], correlationId);
  }

  // ========================================================================
  // GESTIÓN DE ENTRIES
  // ========================================================================

  private addEntry(entry: LogEntry): void {
    this.entries.push(entry);

    // Mantener límite de entries
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }

    // Persistir si está habilitado
    if (this.config.persistToStorage) {
      this.persistLogEntry(entry);
    }

    // Enviar al servidor si está habilitado
    if (this.config.sendToServer) {
      this.scheduleServerSend();
    }

    // Log en consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    }
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    // Verificar nivel
    const levelOrder = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
    if (levelOrder[level] < levelOrder[this.config.level]) {
      return false;
    }

    // Verificar categoría
    if (!this.config.categories.includes(category)) {
      return false;
    }

    // Verificar filtros
    const message = `${category}:${level}`;
    const excludeMatch = this.config.filters.excludePatterns.some(pattern => pattern.test(message));
    const includeMatch = this.config.filters.includePatterns.length === 0 ||
                        this.config.filters.includePatterns.some(pattern => pattern.test(message));

    return !excludeMatch && includeMatch;
  }

  // ========================================================================
  // PERSISTENCIA Y SINCRONIZACIÓN
  // ========================================================================

  private async loadPersistedLogs(): Promise<void> {
    try {
      const stored = localStorage.getItem('advanced_logger_entries');
      if (stored) {
        const parsed = JSON.parse(stored);
        const entries: LogEntry[] = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));

        // Filtrar entradas recientes (últimas 24 horas)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentEntries = entries.filter(entry => entry.timestamp > oneDayAgo);

        this.entries = recentEntries;
      }
    } catch (error) {
      console.warn('Error loading persisted logs:', error);
    }
  }

  private persistLogEntry(entry: LogEntry): void {
    try {
      // Solo persistir errores y warnings críticos
      if (entry.level === 'error' || entry.level === 'critical') {
        const toStore = this.entries.slice(-50); // Últimas 50 entries críticas
        localStorage.setItem('advanced_logger_entries', JSON.stringify(toStore));
      }
    } catch (error) {
      console.warn('Error persisting log entry:', error);
    }
  }

  private setupAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushToServer();
    }, this.config.flushInterval);
  }

  private scheduleServerSend(): void {
    // Enviar en lotes cuando se alcance el batch size
    if (this.entries.length >= this.config.batchSize) {
      this.flushToServer();
    }
  }

  private async flushToServer(): Promise<void> {
    if (this.entries.length === 0) return;

    const entriesToSend = this.entries.slice(-this.config.batchSize);
    const logsData = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      entries: entriesToSend.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      }))
    };

    try {
      // TODO: Implementar envío real al servidor de logging
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logsData)
      // });

      console.log('📤 Logs enviados al servidor:', entriesToSend.length);
    } catch (error) {
      console.warn('Error sending logs to server:', error);
    }
  }

  // ========================================================================
  // CAPTURA GLOBAL
  // ========================================================================

  private setupGlobalErrorCapture(): void {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.error('system', `Uncaught error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }, ['system', 'uncaught']);
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('system', `Unhandled promise rejection: ${event.reason}`, {
        reason: event.reason,
        promise: event.promise
      }, ['system', 'unhandled', 'promise']);
    });

    // Capturar errores de recursos
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as any).tagName) {
        const target = event.target as any;
        if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
          this.warn('system', `Resource load error: ${target.src || target.href}`, {
            tagName: target.tagName,
            src: target.src,
            href: target.href
          }, ['system', 'resource']);
        }
      }
    }, true);
  }

  private setupPerformanceCapture(): void {
    // Capturar navegación lenta
    if ('performance' in window && 'getEntriesByType' in performance) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          if (loadTime > 3000) { // Más de 3 segundos
            this.logPerformance('page_load_time', loadTime, 3000, {
              navigation
            });
          }
        }
      }, 1000);
    }
  }

  // ========================================================================
  // ANÁLISIS Y ESTADÍSTICAS
  // ========================================================================

  getStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): LogStats {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredEntries = this.entries.filter(entry => entry.timestamp >= startTime);

    const stats: LogStats = {
      total: filteredEntries.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        critical: 0
      },
      byCategory: {
        auth: 0,
        api: 0,
        ui: 0,
        performance: 0,
        error: 0,
        security: 0,
        business: 0,
        system: 0
      },
      byHour: {},
      byDay: {},
      errors: [],
      warnings: [],
      recentActivity: [],
      topErrors: []
    };

    // Contar por nivel y categoría
    filteredEntries.forEach(entry => {
      stats.byLevel[entry.level]++;
      stats.byCategory[entry.category]++;

      // Agrupar por hora
      const hourKey = entry.timestamp.toISOString().substring(0, 13);
      stats.byHour[hourKey] = (stats.byHour[hourKey] || 0) + 1;

      // Agrupar por día
      const dayKey = entry.timestamp.toISOString().substring(0, 10);
      stats.byDay[dayKey] = (stats.byDay[dayKey] || 0) + 1;

      // Recopilar errores y warnings
      if (entry.level === 'error' || entry.level === 'critical') {
        stats.errors.push(entry);
      } else if (entry.level === 'warn') {
        stats.warnings.push(entry);
      }
    });

    // Actividad reciente (últimas 20 entries)
    stats.recentActivity = filteredEntries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    // Top errores
    const errorCounts: Record<string, { count: number; lastSeen: Date }> = {};
    stats.errors.forEach(error => {
      const key = error.message;
      if (!errorCounts[key]) {
        errorCounts[key] = { count: 0, lastSeen: error.timestamp };
      }
      errorCounts[key].count++;
      if (error.timestamp > errorCounts[key].lastSeen) {
        errorCounts[key].lastSeen = error.timestamp;
      }
    });

    stats.topErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // TODO: Obtener ID del usuario actual desde el contexto de auth
    return undefined;
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()} [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data);
        break;
      case 'info':
        console.info(message, entry.data);
        break;
      case 'warn':
        console.warn(message, entry.data);
        break;
      case 'error':
      case 'critical':
        console.error(message, entry.data);
        break;
    }
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  getEntries(limit?: number, filter?: {
    level?: LogLevel;
    category?: LogCategory;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    let filtered = [...this.entries];

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(entry => entry.level === filter.level);
      }
      if (filter.category) {
        filtered = filtered.filter(entry => entry.category === filter.category);
      }
      if (filter.startDate) {
        filtered = filtered.filter(entry => entry.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(entry => entry.timestamp <= filter.endDate!);
      }
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit || this.entries.length);
  }

  clearEntries(): void {
    this.entries = [];
    if (this.config.persistToStorage) {
      localStorage.removeItem('advanced_logger_entries');
    }
  }

  exportLogs(format: 'json' | 'csv' = 'json', filter?: any): string {
    const entries = this.getEntries(undefined, filter);

    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'data', 'userId', 'tags'];
      const rows = entries.map(entry => [
        entry.timestamp.toISOString(),
        entry.level,
        entry.category,
        entry.message,
        JSON.stringify(entry.data),
        entry.userId || '',
        entry.tags?.join(';') || ''
      ]);

      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    return JSON.stringify(entries, null, 2);
  }

  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.sendToServer !== undefined && !newConfig.sendToServer && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    } else if (newConfig.sendToServer && !this.flushTimer) {
      this.setupAutoFlush();
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.entries = [];
    this.isInitialized = false;
    console.log('💥 Advanced Logger destruido');
  }
}

// Instancia global
let advancedLoggerInstance: AdvancedLogger | null = null;

export const getAdvancedLogger = (): AdvancedLogger => {
  if (!advancedLoggerInstance) {
    advancedLoggerInstance = new AdvancedLogger();
  }
  return advancedLoggerInstance;
};

// Funciones de conveniencia
export const logger = {
  debug: (category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string) =>
    getAdvancedLogger().debug(category, message, data, tags, correlationId),

  info: (category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string) =>
    getAdvancedLogger().info(category, message, data, tags, correlationId),

  warn: (category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string) =>
    getAdvancedLogger().warn(category, message, data, tags, correlationId),

  error: (category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string) =>
    getAdvancedLogger().error(category, message, data, tags, correlationId),

  critical: (category: LogCategory, message: string, data?: any, tags?: string[], correlationId?: string) =>
    getAdvancedLogger().critical(category, message, data, tags, correlationId),

  // Utilidades especializadas
  logApiCall: (method: string, url: string, status: number, duration: number, error?: any, correlationId?: string) =>
    getAdvancedLogger().logApiCall(method, url, status, duration, error, correlationId),

  logUIError: (component: string, error: Error, context?: any, correlationId?: string) =>
    getAdvancedLogger().logUIError(component, error, context, correlationId),

  logPerformance: (metric: string, value: number, threshold?: number, context?: any, correlationId?: string) =>
    getAdvancedLogger().logPerformance(metric, value, threshold, context, correlationId),

  logAuth: (action: string, success: boolean, userId?: string, error?: any, correlationId?: string) =>
    getAdvancedLogger().logAuth(action, success, userId, error, correlationId),

  logSecurity: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any, correlationId?: string) =>
    getAdvancedLogger().logSecurity(event, severity, details, correlationId),

  logBusiness: (event: string, entity: string, action: string, details?: any, correlationId?: string) =>
    getAdvancedLogger().logBusiness(event, entity, action, details, correlationId)
};

export default getAdvancedLogger;



