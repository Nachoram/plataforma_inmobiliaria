// API Externa para Integraciones de Terceros
// Proporciona acceso RESTful a datos con autenticación por API keys

import { supabase } from './supabase';
import { getAdvancedLogger } from './advancedLogger';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  permissions: ApiPermission[];
  rateLimit: {
    requests: number;
    period: number; // segundos
  };
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface ApiPermission {
  resource: ApiResource;
  actions: ApiAction[];
}

export type ApiResource =
  | 'properties'
  | 'offers'
  | 'users'
  | 'tasks'
  | 'documents'
  | 'communications'
  | 'templates'
  | 'analytics'
  | 'webhooks';

export type ApiAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'list';

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  apiKey: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
    rateLimitRemaining: number;
    rateLimitReset: Date;
  };
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  filters?: Record<string, any>;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent =
  | 'property.created'
  | 'property.updated'
  | 'property.deleted'
  | 'offer.created'
  | 'offer.updated'
  | 'offer.status_changed'
  | 'user.created'
  | 'user.updated'
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'communication.sent'
  | 'document.uploaded';

export interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: Date;
  webhookId: string;
  attempt: number;
  signature: string;
}

class ExternalApiService {
  private apiKeys: Map<string, ApiKey> = new Map();
  private rateLimitCache: Map<string, { count: number; resetTime: Date }> = new Map();
  private webhooks: Map<string, WebhookConfig> = new Map();
  private logger = getAdvancedLogger();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('🔌 Inicializando External API Service...');

    // Cargar API keys desde base de datos
    await this.loadApiKeys();

    // Cargar configuraciones de webhooks
    await this.loadWebhooks();

    // Configurar limpieza automática de rate limits
    this.setupRateLimitCleanup();

    console.log('✅ External API Service inicializado');
  }

  // ========================================================================
  // GESTIÓN DE API KEYS
  // ========================================================================

  async createApiKey(
    userId: string,
    name: string,
    permissions: ApiPermission[],
    rateLimit?: { requests: number; period: number }
  ): Promise<ApiKey> {
    const apiKey: ApiKey = {
      id: this.generateId(),
      name,
      key: this.generateApiKey(),
      userId,
      permissions,
      rateLimit: rateLimit || { requests: 1000, period: 3600 }, // 1000 requests/hour
      createdAt: new Date(),
      isActive: true
    };

    // Guardar en base de datos
    const { error } = await supabase
      .from('api_keys')
      .insert({
        id: apiKey.id,
        name: apiKey.name,
        key_hash: await this.hashApiKey(apiKey.key),
        user_id: apiKey.userId,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rateLimit,
        created_at: apiKey.createdAt.toISOString(),
        is_active: apiKey.isActive
      });

    if (error) throw error;

    // Cache en memoria
    this.apiKeys.set(apiKey.key, apiKey);

    this.logger.info('api', 'API key created', {
      apiKeyId: apiKey.id,
      userId,
      permissions: permissions.map(p => `${p.resource}:${p.actions.join(',')}`)
    });

    return apiKey;
  }

  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    // Buscar en cache
    let keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      // Buscar en base de datos
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', await this.hashApiKey(apiKey))
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      keyData = {
        id: data.id,
        name: data.name,
        key: apiKey, // No almacenar el key real en DB
        userId: data.user_id,
        permissions: data.permissions,
        rateLimit: data.rate_limit,
        createdAt: new Date(data.created_at),
        lastUsed: data.last_used ? new Date(data.last_used) : undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        isActive: data.is_active
      };

      // Cache en memoria
      this.apiKeys.set(apiKey, keyData);
    }

    // Verificar expiración
    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      return null;
    }

    // Actualizar last_used
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', keyData.id);

    return keyData;
  }

  async revokeApiKey(apiKeyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', apiKeyId)
      .eq('user_id', userId);

    if (error) throw error;

    // Remover del cache
    for (const [key, data] of this.apiKeys.entries()) {
      if (data.id === apiKeyId) {
        this.apiKeys.delete(key);
        break;
      }
    }

    this.logger.info('api', 'API key revoked', { apiKeyId, userId });
  }

  async listApiKeys(userId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      name: item.name,
      key: '[REDACTED]', // Nunca devolver el key real
      userId: item.user_id,
      permissions: item.permissions,
      rateLimit: item.rate_limit,
      createdAt: new Date(item.created_at),
      lastUsed: item.last_used ? new Date(item.last_used) : undefined,
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      isActive: item.is_active
    }));
  }

  // ========================================================================
  // RATE LIMITING AVANZADO
  // ========================================================================

  private rateLimitRules: Map<string, {
    maxRequests: number;
    windowMs: number;
    burstLimit?: number;
    burstWindowMs?: number;
  }> = new Map();

  constructor() {
    // Configurar reglas de rate limiting por endpoint
    this.setupRateLimitRules();
  }

  private setupRateLimitRules(): void {
    // Reglas por defecto
    this.rateLimitRules.set('default', {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minuto
      burstLimit: 20,
      burstWindowMs: 10 * 1000 // 10 segundos
    });

    // Reglas específicas por endpoint
    this.rateLimitRules.set('GET /properties', {
      maxRequests: 300,
      windowMs: 60 * 1000,
      burstLimit: 50,
      burstWindowMs: 10 * 1000
    });

    this.rateLimitRules.set('GET /offers', {
      maxRequests: 200,
      windowMs: 60 * 1000,
      burstLimit: 30,
      burstWindowMs: 10 * 1000
    });

    this.rateLimitRules.set('POST /properties', {
      maxRequests: 50,
      windowMs: 60 * 1000,
      burstLimit: 10,
      burstWindowMs: 10 * 1000
    });

    this.rateLimitRules.set('POST /offers', {
      maxRequests: 30,
      windowMs: 60 * 1000,
      burstLimit: 5,
      burstWindowMs: 10 * 1000
    });

    this.rateLimitRules.set('PUT /offers/*', {
      maxRequests: 100,
      windowMs: 60 * 1000,
      burstLimit: 20,
      burstWindowMs: 10 * 1000
    });

    this.rateLimitRules.set('GET /analytics', {
      maxRequests: 20,
      windowMs: 60 * 1000,
      burstLimit: 5,
      burstWindowMs: 10 * 1000
    });
  }

  checkRateLimit(apiKey: string, method: string, path: string): {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    limit: number;
    retryAfter?: number;
  } {
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        limit: 0
      };
    }

    // Determinar regla de rate limiting
    const ruleKey = this.getRateLimitRuleKey(method, path);
    const rule = this.rateLimitRules.get(ruleKey) || this.rateLimitRules.get('default')!;

    // Aplicar límite de API key (si es más restrictivo)
    const apiKeyLimit = Math.min(rule.maxRequests, keyData.rateLimit.requests);
    const apiKeyWindow = Math.max(rule.windowMs, keyData.rateLimit.period * 1000);

    const now = new Date();

    // Check burst limit first (más estricto)
    if (rule.burstLimit && rule.burstWindowMs) {
      const burstKey = `burst_${apiKey}_${ruleKey}`;
      const burstCache = this.rateLimitCache.get(burstKey);

      if (burstCache && burstCache.resetTime > now) {
        if (burstCache.count >= rule.burstLimit) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: burstCache.resetTime,
            limit: rule.burstLimit,
            retryAfter: Math.ceil((burstCache.resetTime.getTime() - now.getTime()) / 1000)
          };
        }
      } else {
        // Reset burst window
        this.rateLimitCache.set(burstKey, {
          count: 0,
          resetTime: new Date(now.getTime() + rule.burstWindowMs)
        });
      }
    }

    // Check sustained limit
    const sustainedKey = `sustained_${apiKey}_${ruleKey}`;
    let sustainedCache = this.rateLimitCache.get(sustainedKey);

    if (!sustainedCache || sustainedCache.resetTime <= now) {
      // Reset sustained window
      sustainedCache = {
        count: 0,
        resetTime: new Date(now.getTime() + apiKeyWindow)
      };
    }

    const allowed = sustainedCache.count < apiKeyLimit;
    const remaining = Math.max(0, apiKeyLimit - sustainedCache.count);

    if (allowed) {
      sustainedCache.count++;

      // Update burst counter if exists
      if (rule.burstLimit && rule.burstWindowMs) {
        const burstKey = `burst_${apiKey}_${ruleKey}`;
        const burstCache = this.rateLimitCache.get(burstKey);
        if (burstCache) {
          burstCache.count++;
          this.rateLimitCache.set(burstKey, burstCache);
        }
      }

      this.rateLimitCache.set(sustainedKey, sustainedCache);
    }

    return {
      allowed,
      remaining,
      resetTime: sustainedCache.resetTime,
      limit: apiKeyLimit,
      retryAfter: allowed ? undefined : Math.ceil((sustainedCache.resetTime.getTime() - now.getTime()) / 1000)
    };
  }

  private getRateLimitRuleKey(method: string, path: string): string {
    // Normalizar path (remover IDs y parámetros)
    const normalizedPath = path
      .split('/')
      .map(segment => isNaN(Number(segment)) ? segment : '*')
      .join('/');

    const ruleKey = `${method} ${normalizedPath}`;

    // Buscar regla específica
    if (this.rateLimitRules.has(ruleKey)) {
      return ruleKey;
    }

    // Buscar regla con wildcards
    for (const [key] of this.rateLimitRules.entries()) {
      if (key.includes('*')) {
        const regex = new RegExp(key.replace(/\*/g, '[^/]+'));
        if (regex.test(ruleKey)) {
          return key;
        }
      }
    }

    return 'default';
  }

  private setupRateLimitCleanup(): void {
    // Limpiar rate limits expirados cada 30 segundos
    setInterval(() => {
      const now = new Date();
      const toDelete: string[] = [];

      for (const [key, cache] of this.rateLimitCache.entries()) {
        if (cache.resetTime <= now) {
          toDelete.push(key);
        }
      }

      toDelete.forEach(key => this.rateLimitCache.delete(key));

      if (toDelete.length > 0) {
        console.log(`🧹 Limpieza de rate limits: ${toDelete.length} entradas eliminadas`);
      }
    }, 30000);

    // Log de estadísticas de rate limiting cada 5 minutos
    setInterval(() => {
      const stats = this.getRateLimitStats();
      if (stats.totalRequests > 0) {
        console.log('📊 Estadísticas de Rate Limiting:', stats);
      }
    }, 5 * 60 * 1000);
  }

  private getRateLimitStats(): {
    totalRequests: number;
    blockedRequests: number;
    activeLimits: number;
    topLimitedEndpoints: Array<{ endpoint: string; blocked: number }>;
  } {
    const stats = {
      totalRequests: 0,
      blockedRequests: 0,
      activeLimits: this.rateLimitCache.size,
      topLimitedEndpoints: [] as Array<{ endpoint: string; blocked: number }>
    };

    // Calcular estadísticas (esto requeriría tracking adicional en producción)
    // Por ahora, devolver datos básicos
    return stats;
  }

  // ========================================================================
  // MANEJO DE REQUESTS
  // ========================================================================

  async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();
    const requestId = this.generateId();

    try {
      // Validar API key
      const apiKeyData = await this.validateApiKey(request.apiKey);
      if (!apiKeyData) {
        return {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'API key inválida o inactiva'
          }
        };
      }

      // Verificar rate limit
      const rateLimit = this.checkRateLimit(request.apiKey, request.method, request.path);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Límite de rate alcanzado. ${rateLimit.remaining} requests restantes.`
          },
          meta: {
            timestamp: new Date(),
            requestId,
            rateLimitRemaining: rateLimit.remaining,
            rateLimitReset: rateLimit.resetTime
          }
        };
      }

      // Verificar permisos
      const hasPermission = this.checkPermission(apiKeyData, request);
      if (!hasPermission) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Permisos insuficientes para esta operación'
          }
        };
      }

      // Procesar request
      const result = await this.processApiRequest(request, apiKeyData);

      const processingTime = Date.now() - startTime;
      this.logger.logPerformance('api_request_processing', processingTime, 1000, {
        method: request.method,
        path: request.path,
        apiKeyId: apiKeyData.id,
        requestId
      });

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date(),
          requestId,
          rateLimitRemaining: rateLimit.remaining,
          rateLimitReset: rateLimit.resetTime,
          rateLimitLimit: rateLimit.limit
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error('api', 'API request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: request.method,
        path: request.path,
        requestId,
        processingTime
      });

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        meta: {
          timestamp: new Date(),
          requestId,
          rateLimitRemaining: 0,
          rateLimitReset: new Date()
        }
      };
    }
  }

  private checkPermission(apiKeyData: ApiKey, request: ApiRequest): boolean {
    // Extraer recurso y acción del path
    const pathParts = request.path.split('/').filter(p => p);
    const resource = pathParts[0] as ApiResource;
    let action: ApiAction;

    switch (request.method) {
      case 'GET':
        action = pathParts.length > 1 ? 'read' : 'list';
        break;
      case 'POST':
        action = 'create';
        break;
      case 'PUT':
      case 'PATCH':
        action = 'update';
        break;
      case 'DELETE':
        action = 'delete';
        break;
      default:
        return false;
    }

    // Verificar permisos
    const permission = apiKeyData.permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  }

  private async processApiRequest(request: ApiRequest, apiKeyData: ApiKey): Promise<any> {
    const pathParts = request.path.split('/').filter(p => p);
    const resource = pathParts[0];
    const id = pathParts[1];

    switch (resource) {
      case 'properties':
        return this.handlePropertiesRequest(request.method, id, request, apiKeyData);
      case 'offers':
        return this.handleOffersRequest(request.method, id, request, apiKeyData);
      case 'users':
        return this.handleUsersRequest(request.method, id, request, apiKeyData);
      case 'tasks':
        return this.handleTasksRequest(request.method, id, request, apiKeyData);
      case 'documents':
        return this.handleDocumentsRequest(request.method, id, request, apiKeyData);
      case 'communications':
        return this.handleCommunicationsRequest(request.method, id, request, apiKeyData);
      case 'templates':
        return this.handleTemplatesRequest(request.method, id, request, apiKeyData);
      case 'analytics':
        return this.handleAnalyticsRequest(request.method, id, request, apiKeyData);
      default:
        throw new Error(`Recurso no encontrado: ${resource}`);
    }
  }

  // ========================================================================
  // HANDLERS DE RECURSOS
  // ========================================================================

  private async handlePropertiesRequest(
    method: string,
    id: string | undefined,
    request: ApiRequest,
    apiKeyData: ApiKey
  ): Promise<any> {
    const userId = apiKeyData.userId;

    switch (method) {
      case 'GET':
        if (id) {
          // Obtener propiedad específica
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .eq('owner_id', userId)
            .single();

          if (error) throw error;
          return data;
        } else {
          // Listar propiedades
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        }

      case 'POST':
        // Crear propiedad
        const { data, error } = await supabase
          .from('properties')
          .insert({
            ...request.body,
            owner_id: userId
          })
          .select()
          .single();

        if (error) throw error;

        // Trigger webhook
        await this.triggerWebhooks('property.created', data, userId);

        return data;

      case 'PUT':
        // Actualizar propiedad
        const { data: updateData, error: updateError } = await supabase
          .from('properties')
          .update(request.body)
          .eq('id', id)
          .eq('owner_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Trigger webhook
        await this.triggerWebhooks('property.updated', updateData, userId);

        return updateData;

      default:
        throw new Error(`Método no soportado: ${method}`);
    }
  }

  private async handleOffersRequest(
    method: string,
    id: string | undefined,
    request: ApiRequest,
    apiKeyData: ApiKey
  ): Promise<any> {
    const userId = apiKeyData.userId;

    switch (method) {
      case 'GET':
        if (id) {
          // Obtener oferta específica
          const { data, error } = await supabase
            .from('property_sale_offers')
            .select(`
              *,
              property:properties(*),
              buyer:user_profiles!property_sale_offers_buyer_id_fkey(*)
            `)
            .eq('id', id)
            .or(`buyer_id.eq.${userId},property_id.in.(${await this.getUserPropertyIds(userId)})`);

          if (error) throw error;
          return data;
        } else {
          // Listar ofertas
          const { data, error } = await supabase
            .from('property_sale_offers')
            .select(`
              *,
              property:properties(*),
              buyer:user_profiles!property_sale_offers_buyer_id_fkey(*)
            `)
            .or(`buyer_id.eq.${userId},property_id.in.(${await this.getUserPropertyIds(userId)})`);

          if (error) throw error;
          return data;
        }

      case 'POST':
        // Crear oferta
        const { data, error } = await supabase
          .from('property_sale_offers')
          .insert({
            ...request.body,
            buyer_id: userId
          })
          .select()
          .single();

        if (error) throw error;

        // Trigger webhook
        await this.triggerWebhooks('offer.created', data, userId);

        return data;

      case 'PUT':
        // Actualizar oferta
        const { data: updateData, error: updateError } = await supabase
          .from('property_sale_offers')
          .update(request.body)
          .eq('id', id)
          .eq('buyer_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Trigger webhook para cambio de status
        if (request.body.status && request.body.status !== updateData.status) {
          await this.triggerWebhooks('offer.status_changed', {
            ...updateData,
            old_status: updateData.status,
            new_status: request.body.status
          }, userId);
        }

        await this.triggerWebhooks('offer.updated', updateData, userId);

        return updateData;

      default:
        throw new Error(`Método no soportado: ${method}`);
    }
  }

  private async handleUsersRequest(
    method: string,
    id: string | undefined,
    request: ApiRequest,
    apiKeyData: ApiKey
  ): Promise<any> {
    // Solo lectura básica para integraciones
    switch (method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, created_at')
            .eq('id', id)
            .single();

          if (error) throw error;
          return data;
        } else {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, created_at')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        }

      default:
        throw new Error(`Método no soportado: ${method}`);
    }
  }

  private async handleTasksRequest(
    method: string,
    id: string | undefined,
    request: ApiRequest,
    apiKeyData: ApiKey
  ): Promise<any> {
    const userId = apiKeyData.userId;

    switch (method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('offer_tasks')
            .select('*')
            .eq('id', id)
            .eq('assigned_to', userId)
            .single();

          if (error) throw error;
          return data;
        } else {
          const { data, error } = await supabase
            .from('offer_tasks')
            .select('*')
            .eq('assigned_to', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        }

      case 'PUT':
        const { data, error } = await supabase
          .from('offer_tasks')
          .update(request.body)
          .eq('id', id)
          .eq('assigned_to', userId)
          .select()
          .single();

        if (error) throw error;

        // Trigger webhooks
        if (request.body.status === 'completed') {
          await this.triggerWebhooks('task.completed', data, userId);
        }
        await this.triggerWebhooks('task.updated', data, userId);

        return data;

      default:
        throw new Error(`Método no soportado: ${method}`);
    }
  }

  private async handleAnalyticsRequest(
    method: string,
    id: string | undefined,
    request: ApiRequest,
    apiKeyData: ApiKey
  ): Promise<any> {
    if (method !== 'GET') {
      throw new Error('Solo se permiten consultas GET para analytics');
    }

    const userId = apiKeyData.userId;

    // Métricas básicas del usuario
    const [
      { count: totalProperties },
      { count: totalOffers },
      { count: activeOffers },
      { count: completedOffers }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('property_sale_offers').select('*', { count: 'exact', head: true }).eq('buyer_id', userId),
      supabase.from('property_sale_offers').select('*', { count: 'exact', head: true }).eq('buyer_id', userId).in('status', ['pendiente', 'aceptada']),
      supabase.from('property_sale_offers').select('*', { count: 'exact', head: true }).eq('buyer_id', userId).eq('status', 'completada')
    ]);

    return {
      userId,
      metrics: {
        totalProperties: totalProperties || 0,
        totalOffers: totalOffers || 0,
        activeOffers: activeOffers || 0,
        completedOffers: completedOffers || 0,
        conversionRate: totalOffers ? ((completedOffers || 0) / totalOffers) * 100 : 0
      },
      timestamp: new Date().toISOString()
    };
  }

  // Handlers simplificados para otros recursos
  private async handleDocumentsRequest(method: string, id: string | undefined, request: ApiRequest, apiKeyData: ApiKey): Promise<any> {
    // Implementación simplificada
    throw new Error('Documents API no implementado aún');
  }

  private async handleCommunicationsRequest(method: string, id: string | undefined, request: ApiRequest, apiKeyData: ApiKey): Promise<any> {
    // Implementación simplificada
    throw new Error('Communications API no implementado aún');
  }

  private async handleTemplatesRequest(method: string, id: string | undefined, request: ApiRequest, apiKeyData: ApiKey): Promise<any> {
    // Implementación simplificada
    throw new Error('Templates API no implementado aún');
  }

  // ========================================================================
  // WEBHOOKS
  // ========================================================================

  async createWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: this.generateId(),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Guardar en base de datos
    const { error } = await supabase
      .from('webhooks')
      .insert({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        is_active: webhook.isActive,
        retry_policy: webhook.retryPolicy,
        filters: webhook.filters,
        headers: webhook.headers,
        created_at: webhook.createdAt.toISOString(),
        updated_at: webhook.updatedAt.toISOString()
      });

    if (error) throw error;

    // Cache en memoria
    this.webhooks.set(webhook.id, webhook);

    this.logger.info('api', 'Webhook created', {
      webhookId: webhook.id,
      events: webhook.events,
      url: webhook.url
    });

    return webhook;
  }

  async triggerWebhooks(event: WebhookEvent, data: any, userId?: string): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.isActive && webhook.events.includes(event));

    for (const webhook of relevantWebhooks) {
      // Verificar filtros si existen
      if (webhook.filters && !this.matchesFilters(data, webhook.filters)) {
        continue;
      }

      // Enviar webhook
      await this.sendWebhook(webhook, event, data, userId);
    }
  }

  private async sendWebhook(
    webhook: WebhookConfig,
    event: WebhookEvent,
    data: any,
    userId?: string,
    attempt: number = 1
  ): Promise<void> {
    const timestamp = new Date();
    const payload: WebhookPayload = {
      event,
      data,
      timestamp,
      webhookId: webhook.id,
      attempt,
      signature: ''
    };

    // Generar firma
    payload.signature = await this.generateWebhookSignature(payload, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': payload.signature,
          'X-Webhook-Event': event,
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Attempt': attempt.toString(),
          ...webhook.headers
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.info('api', 'Webhook delivered successfully', {
        webhookId: webhook.id,
        event,
        attempt,
        status: response.status
      });

    } catch (error) {
      this.logger.error('api', 'Webhook delivery failed', {
        webhookId: webhook.id,
        event,
        attempt,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Reintentar según política
      if (attempt < webhook.retryPolicy.maxRetries) {
        const delay = Math.pow(webhook.retryPolicy.backoffMultiplier, attempt) * 1000;
        setTimeout(() => {
          this.sendWebhook(webhook, event, data, userId, attempt + 1);
        }, delay);
      }
    }
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  private async loadApiKeys(): Promise<void> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.warn('Error loading API keys:', error);
      return;
    }

    for (const item of data || []) {
      // Nota: En producción, las keys estarían encriptadas
      // Aquí asumimos que están hasheadas y no podemos recuperarlas
      // Las keys reales se validarían contra el hash
    }
  }

  private async loadWebhooks(): Promise<void> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.warn('Error loading webhooks:', error);
      return;
    }

    for (const item of data || []) {
      const webhook: WebhookConfig = {
        id: item.id,
        name: item.name,
        url: item.url,
        events: item.events,
        secret: item.secret,
        isActive: item.is_active,
        retryPolicy: item.retry_policy,
        filters: item.filters,
        headers: item.headers,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      };

      this.webhooks.set(webhook.id, webhook);
    }
  }

  private async getUserPropertyIds(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', userId);

    if (error) throw error;

    return (data || []).map(p => p.id).join(',');
  }

  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    // Implementación simple de filtros
    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private generateId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateApiKey(): string {
    return `sk_${this.generateId()}`;
  }

  private async hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key + process.env.VITE_SUPABASE_ANON_KEY);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private async generateWebhookSignature(payload: WebhookPayload, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload) + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return 'sha256=' + Array.from(hashArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Instancia global
let externalApiServiceInstance: ExternalApiService | null = null;

export const getExternalApiService = (): ExternalApiService => {
  if (!externalApiServiceInstance) {
    externalApiServiceInstance = new ExternalApiService();
  }
  return externalApiServiceInstance;
};

// Funciones de conveniencia
export const externalApi = {
  // API Keys
  createApiKey: (userId: string, name: string, permissions: ApiPermission[], rateLimit?: any) =>
    getExternalApiService().createApiKey(userId, name, permissions, rateLimit),

  validateApiKey: (apiKey: string) => getExternalApiService().validateApiKey(apiKey),

  revokeApiKey: (apiKeyId: string, userId: string) =>
    getExternalApiService().revokeApiKey(apiKeyId, userId),

  listApiKeys: (userId: string) => getExternalApiService().listApiKeys(userId),

  // Requests
  handleRequest: (request: ApiRequest) => getExternalApiService().handleRequest(request),

  // Webhooks
  createWebhook: (config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>) =>
    getExternalApiService().createWebhook(config),

  triggerWebhooks: (event: WebhookEvent, data: any, userId?: string) =>
    getExternalApiService().triggerWebhooks(event, data, userId),

  // Rate limiting
  checkRateLimit: (apiKey: string) => getExternalApiService().checkRateLimit(apiKey)
};

export default getExternalApiService;
