// Integración con Zapier
// Proporciona endpoints específicos para automatizaciones Zapier

import { getExternalApiService } from '../externalApi';
import { supabase } from '../supabase';

export interface ZapierWebhookPayload {
  id: string;
  event: string;
  data: any;
  timestamp: string;
  webhook_id: string;
  attempt: number;
}

export interface ZapierTriggerResponse {
  data: any[];
  meta?: {
    next_cursor?: string;
    has_more: boolean;
  };
}

export interface ZapierActionRequest {
  data: any;
  meta?: {
    zap_id?: string;
    attempt?: number;
  };
}

export interface ZapierActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class ZapierIntegration {
  private externalApi = getExternalApiService();
  private baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // ========================================================================
  // TRIGGERS (Eventos que activan Zaps)
  // ========================================================================

  /**
   * Trigger: Nueva propiedad creada
   */
  async triggerNewProperty(apiKey: string, cursor?: string, limit = 50): Promise<ZapierTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/properties',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
        cursor,
        status: 'available',
        sort: 'created_at',
        order: 'desc'
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error fetching properties');
    }

    const properties = response.data || [];

    // Filtrar solo propiedades nuevas (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newProperties = properties.filter((prop: any) =>
      new Date(prop.created_at) > oneDayAgo
    );

    return {
      data: newProperties,
      meta: {
        has_more: properties.length === limit,
        next_cursor: properties.length === limit ? properties[properties.length - 1].id : undefined
      }
    };
  }

  /**
   * Trigger: Nueva oferta creada
   */
  async triggerNewOffer(apiKey: string, cursor?: string, limit = 50): Promise<ZapierTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/offers',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
        cursor,
        status: 'pendiente',
        sort: 'created_at',
        order: 'desc'
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error fetching offers');
    }

    const offers = response.data || [];

    // Filtrar solo ofertas nuevas (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newOffers = offers.filter((offer: any) =>
      new Date(offer.created_at) > oneDayAgo
    );

    return {
      data: newOffers,
      meta: {
        has_more: offers.length === limit,
        next_cursor: offers.length === limit ? offers[offers.length - 1].id : undefined
      }
    };
  }

  /**
   * Trigger: Oferta aceptada
   */
  async triggerOfferAccepted(apiKey: string, cursor?: string, limit = 50): Promise<ZapierTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/offers',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
        cursor,
        status: 'aceptada',
        sort: 'updated_at',
        order: 'desc'
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error fetching offers');
    }

    const offers = response.data || [];

    // Filtrar solo ofertas aceptadas recientemente (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyAccepted = offers.filter((offer: any) =>
      offer.status === 'aceptada' && new Date(offer.updated_at) > oneDayAgo
    );

    return {
      data: recentlyAccepted,
      meta: {
        has_more: offers.length === limit,
        next_cursor: offers.length === limit ? offers[offers.length - 1].id : undefined
      }
    };
  }

  /**
   * Trigger: Nuevo usuario registrado
   */
  async triggerNewUser(apiKey: string, cursor?: string, limit = 50): Promise<ZapierTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/users',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
        cursor,
        sort: 'created_at',
        order: 'desc'
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error fetching users');
    }

    const users = response.data || [];

    // Filtrar solo usuarios nuevos (últimas 24 horas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsers = users.filter((user: any) =>
      new Date(user.created_at) > oneDayAgo
    );

    return {
      data: newUsers,
      meta: {
        has_more: users.length === limit,
        next_cursor: users.length === limit ? users[users.length - 1].id : undefined
      }
    };
  }

  // ========================================================================
  // ACTIONS (Acciones que Zapier puede ejecutar)
  // ========================================================================

  /**
   * Action: Crear propiedad
   */
  async actionCreateProperty(apiKey: string, request: ZapierActionRequest): Promise<ZapierActionResponse> {
    try {
      const response = await this.externalApi.handleRequest({
        method: 'POST',
        path: '/properties',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: request.data
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error?.message || 'Error creating property'
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Action: Actualizar oferta
   */
  async actionUpdateOffer(apiKey: string, offerId: string, request: ZapierActionRequest): Promise<ZapierActionResponse> {
    try {
      const response = await this.externalApi.handleRequest({
        method: 'PUT',
        path: `/offers/${offerId}`,
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: request.data
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error?.message || 'Error updating offer'
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Action: Enviar notificación por email
   */
  async actionSendEmail(apiKey: string, request: ZapierActionRequest): Promise<ZapierActionResponse> {
    try {
      // Usar el servicio de email directamente
      const { emailService } = await import('../emailService');

      const result = await emailService.send({
        to: request.data.to,
        subject: request.data.subject,
        html: request.data.html,
        text: request.data.text,
        category: 'notifications',
        priority: 'normal',
        from: {
          email: 'noreply@plataformainmobiliaria.com',
          name: 'Plataforma Inmobiliaria'
        }
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error sending email'
        };
      }

      return {
        success: true,
        data: { messageId: result.messageId }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Action: Crear tarea
   */
  async actionCreateTask(apiKey: string, request: ZapierActionRequest): Promise<ZapierActionResponse> {
    try {
      // Crear tarea directamente en la base de datos
      const { data, error } = await supabase
        .from('offer_tasks')
        .insert({
          offer_id: request.data.offer_id,
          title: request.data.title,
          description: request.data.description,
          priority: request.data.priority || 'medium',
          assigned_to: request.data.assigned_to,
          due_date: request.data.due_date
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger webhook para nueva tarea
      await this.externalApi.triggerWebhooks('task.created', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ========================================================================
  // WEBHOOK HANDLING
  // ========================================================================

  /**
   * Procesar webhook de Zapier
   */
  async handleZapierWebhook(payload: ZapierWebhookPayload): Promise<void> {
    console.log('🎣 Procesando webhook de Zapier:', payload.event);

    // El webhook payload ya viene en el formato correcto
    // Solo necesitamos trigger nuestros propios webhooks internos
    await this.externalApi.triggerWebhooks(payload.event as any, payload.data);
  }

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  /**
   * Generar URLs de webhook para Zapier
   */
  generateWebhookUrls(baseUrl?: string): {
    newProperty: string;
    newOffer: string;
    offerAccepted: string;
    newUser: string;
  } {
    const url = baseUrl || this.baseUrl;

    return {
      newProperty: `${url}/api/zapier/triggers/new-property`,
      newOffer: `${url}/api/zapier/triggers/new-offer`,
      offerAccepted: `${url}/api/zapier/triggers/offer-accepted`,
      newUser: `${url}/api/zapier/triggers/new-user`
    };
  }

  /**
   * Generar URLs de acciones para Zapier
   */
  generateActionUrls(baseUrl?: string): {
    createProperty: string;
    updateOffer: string;
    sendEmail: string;
    createTask: string;
  } {
    const url = baseUrl || this.baseUrl;

    return {
      createProperty: `${url}/api/zapier/actions/create-property`,
      updateOffer: `${url}/api/zapier/actions/update-offer`,
      sendEmail: `${url}/api/zapier/actions/send-email`,
      createTask: `${url}/api/zapier/actions/create-task`
    };
  }

  /**
   * Validar configuración de Zapier
   */
  async validateConfiguration(apiKey: string): Promise<{
    valid: boolean;
    permissions: string[];
    errors: string[];
  }> {
    const result = {
      valid: true,
      permissions: [] as string[],
      errors: [] as string[]
    };

    try {
      // Test basic API access
      const testResponse = await this.externalApi.handleRequest({
        method: 'GET',
        path: '/analytics',
        headers: { 'X-API-Key': apiKey }
      });

      if (!testResponse.success) {
        result.valid = false;
        result.errors.push('API key inválida o insuficientes permisos');
        return result;
      }

      // Test different endpoints to determine permissions
      const endpoints = [
        { path: '/properties', permission: 'properties' },
        { path: '/offers', permission: 'offers' },
        { path: '/users', permission: 'users' },
        { path: '/tasks', permission: 'tasks' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.externalApi.handleRequest({
            method: 'GET',
            path: endpoint.path,
            headers: { 'X-API-Key': apiKey },
            query: { limit: '1' }
          });

          if (response.success) {
            result.permissions.push(endpoint.permission);
          }
        } catch (error) {
          // Permission not available
        }
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(error instanceof Error ? error.message : 'Error de validación');
    }

    return result;
  }
}

// Instancia global
let zapierIntegrationInstance: ZapierIntegration | null = null;

export const getZapierIntegration = (): ZapierIntegration => {
  if (!zapierIntegrationInstance) {
    zapierIntegrationInstance = new ZapierIntegration();
  }
  return zapierIntegrationInstance;
};

// Funciones de conveniencia
export const zapier = {
  // Triggers
  triggers: {
    newProperty: (apiKey: string, cursor?: string, limit?: number) =>
      getZapierIntegration().triggerNewProperty(apiKey, cursor, limit),

    newOffer: (apiKey: string, cursor?: string, limit?: number) =>
      getZapierIntegration().triggerNewOffer(apiKey, cursor, limit),

    offerAccepted: (apiKey: string, cursor?: string, limit?: number) =>
      getZapierIntegration().triggerOfferAccepted(apiKey, cursor, limit),

    newUser: (apiKey: string, cursor?: string, limit?: number) =>
      getZapierIntegration().triggerNewUser(apiKey, cursor, limit)
  },

  // Actions
  actions: {
    createProperty: (apiKey: string, request: ZapierActionRequest) =>
      getZapierIntegration().actionCreateProperty(apiKey, request),

    updateOffer: (apiKey: string, offerId: string, request: ZapierActionRequest) =>
      getZapierIntegration().actionUpdateOffer(apiKey, offerId, request),

    sendEmail: (apiKey: string, request: ZapierActionRequest) =>
      getZapierIntegration().actionSendEmail(apiKey, request),

    createTask: (apiKey: string, request: ZapierActionRequest) =>
      getZapierIntegration().actionCreateTask(apiKey, request)
  },

  // Webhooks
  handleWebhook: (payload: ZapierWebhookPayload) =>
    getZapierIntegration().handleZapierWebhook(payload),

  // Utilities
  generateWebhookUrls: (baseUrl?: string) =>
    getZapierIntegration().generateWebhookUrls(baseUrl),

  generateActionUrls: (baseUrl?: string) =>
    getZapierIntegration().generateActionUrls(baseUrl),

  validateConfiguration: (apiKey: string) =>
    getZapierIntegration().validateConfiguration(apiKey)
};

export default getZapierIntegration;
