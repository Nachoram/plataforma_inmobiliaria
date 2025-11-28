// Integración con IFTTT
// Proporciona endpoints específicos para applets IFTTT

import { getExternalApiService } from '../externalApi';

export interface IFTTTTriggerResponse {
  data: Array<{
    id: string;
    timestamp: number;
    [key: string]: any;
  }>;
}

export interface IFTTTActionRequest {
  actionFields: {
    [key: string]: any;
  };
  ifttt_source?: {
    id: string;
    url: string;
  };
  user_id?: string;
}

export interface IFTTTActionResponse {
  data: Array<{
    id: string;
    [key: string]: any;
  }>;
}

class IFTTTIntegration {
  private externalApi = getExternalApiService();
  private baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // ========================================================================
  // TRIGGERS PARA IFTTT
  // ========================================================================

  /**
   * Trigger: Cuando se crea una nueva propiedad
   */
  async triggerPropertyCreated(apiKey: string, limit = 50): Promise<IFTTTTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/properties',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
        sort: 'created_at',
        order: 'desc'
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error fetching properties');
    }

    const properties = response.data || [];

    // Transformar para formato IFTTT
    const data = properties.slice(0, limit).map((property: any) => ({
      id: property.id,
      timestamp: new Date(property.created_at).getTime(),
      property_address: `${property.address_street} ${property.address_number}`,
      property_city: property.address_city,
      property_price: property.price,
      property_type: property.property_type,
      property_url: `${this.baseUrl}/properties/${property.id}`,
      created_at: property.created_at
    }));

    return { data };
  }

  /**
   * Trigger: Cuando se crea una nueva oferta
   */
  async triggerOfferCreated(apiKey: string, limit = 50): Promise<IFTTTTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/offers',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
        sort: 'created_at',
        order: 'desc'
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error fetching offers');
    }

    const offers = response.data || [];

    // Transformar para formato IFTTT
    const data = offers.slice(0, limit).map((offer: any) => ({
      id: offer.id,
      timestamp: new Date(offer.created_at).getTime(),
      offer_price: offer.offered_price,
      offer_currency: offer.currency || 'CLP',
      property_address: offer.property ? `${offer.property.address_street} ${offer.property.address_number}` : '',
      buyer_name: offer.buyer?.full_name || '',
      buyer_email: offer.buyer?.email || '',
      offer_status: offer.status,
      offer_url: `${this.baseUrl}/offers/${offer.id}`,
      created_at: offer.created_at
    }));

    return { data };
  }

  /**
   * Trigger: Cuando una oferta es aceptada
   */
  async triggerOfferAccepted(apiKey: string, limit = 50): Promise<IFTTTTriggerResponse> {
    const response = await this.externalApi.handleRequest({
      method: 'GET',
      path: '/offers',
      headers: { 'X-API-Key': apiKey },
      query: {
        limit: limit.toString(),
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

    // Transformar para formato IFTTT
    const data = recentlyAccepted.slice(0, limit).map((offer: any) => ({
      id: offer.id,
      timestamp: new Date(offer.updated_at).getTime(),
      offer_price: offer.offered_price,
      offer_currency: offer.currency || 'CLP',
      property_address: offer.property ? `${offer.property.address_street} ${offer.property.address_number}` : '',
      buyer_name: offer.buyer?.full_name || '',
      buyer_email: offer.buyer?.email || '',
      accepted_at: offer.updated_at,
      offer_url: `${this.baseUrl}/offers/${offer.id}`
    }));

    return { data };
  }

  // ========================================================================
  // ACTIONS PARA IFTTT
  // ========================================================================

  /**
   * Action: Enviar notificación por email
   */
  async actionSendEmail(apiKey: string, request: IFTTTActionRequest): Promise<IFTTTActionResponse> {
    try {
      const { emailService } = await import('../emailService');

      const result = await emailService.send({
        to: request.actionFields.recipient_email,
        subject: request.actionFields.subject || 'Notificación desde IFTTT',
        html: request.actionFields.message || 'Mensaje enviado desde IFTTT',
        text: request.actionFields.message?.replace(/<[^>]*>/g, '') || 'Mensaje enviado desde IFTTT',
        category: 'notifications',
        priority: 'normal',
        from: {
          email: 'noreply@plataformainmobiliaria.com',
          name: 'Plataforma Inmobiliaria'
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Error sending email');
      }

      return {
        data: [{
          id: result.messageId || `email_${Date.now()}`,
          recipient: request.actionFields.recipient_email,
          subject: request.actionFields.subject,
          sent_at: new Date().toISOString()
        }]
      };
    } catch (error) {
      throw new Error(`Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Action: Crear tarea
   */
  async actionCreateTask(apiKey: string, request: IFTTTActionRequest): Promise<IFTTTActionResponse> {
    try {
      const { supabase } = await import('../supabase');

      const { data, error } = await supabase
        .from('offer_tasks')
        .insert({
          offer_id: request.actionFields.offer_id,
          title: request.actionFields.title,
          description: request.actionFields.description,
          priority: request.actionFields.priority || 'medium',
          assigned_to: request.actionFields.assigned_to,
          due_date: request.actionFields.due_date
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger webhook
      await this.externalApi.triggerWebhooks('task.created', data);

      return {
        data: [{
          id: data.id,
          title: data.title,
          priority: data.priority,
          assigned_to: data.assigned_to,
          created_at: data.created_at
        }]
      };
    } catch (error) {
      throw new Error(`Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Action: Actualizar estado de oferta
   */
  async actionUpdateOfferStatus(apiKey: string, request: IFTTTActionRequest): Promise<IFTTTActionResponse> {
    try {
      const response = await this.externalApi.handleRequest({
        method: 'PUT',
        path: `/offers/${request.actionFields.offer_id}`,
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: {
          status: request.actionFields.new_status
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Error updating offer');
      }

      // Trigger webhook para cambio de status
      await this.externalApi.triggerWebhooks('offer.status_changed', {
        ...response.data,
        old_status: response.data.status,
        new_status: request.actionFields.new_status
      });

      return {
        data: [{
          id: response.data.id,
          old_status: response.data.status,
          new_status: request.actionFields.new_status,
          updated_at: response.data.updated_at
        }]
      };
    } catch (error) {
      throw new Error(`Error updating offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================================================
  // CONFIGURACIÓN Y UTILITIES
  // ========================================================================

  /**
   * Generar URLs para applets IFTTT
   */
  generateAppletUrls(baseUrl?: string): {
    triggers: {
      propertyCreated: string;
      offerCreated: string;
      offerAccepted: string;
    };
    actions: {
      sendEmail: string;
      createTask: string;
      updateOfferStatus: string;
    };
  } {
    const url = baseUrl || this.baseUrl;

    return {
      triggers: {
        propertyCreated: `${url}/api/ifttt/triggers/property-created`,
        offerCreated: `${url}/api/ifttt/triggers/offer-created`,
        offerAccepted: `${url}/api/ifttt/triggers/offer-accepted`
      },
      actions: {
        sendEmail: `${url}/api/ifttt/actions/send-email`,
        createTask: `${url}/api/ifttt/actions/create-task`,
        updateOfferStatus: `${url}/api/ifttt/actions/update-offer-status`
      }
    };
  }

  /**
   * Validar configuración de IFTTT
   */
  async validateConfiguration(apiKey: string): Promise<{
    valid: boolean;
    availableTriggers: string[];
    availableActions: string[];
    errors: string[];
  }> {
    const result = {
      valid: true,
      availableTriggers: [] as string[],
      availableActions: [] as string[],
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

      // Test available triggers
      const triggerTests = [
        { name: 'propertyCreated', path: '/properties', permission: 'properties' },
        { name: 'offerCreated', path: '/offers', permission: 'offers' },
        { name: 'offerAccepted', path: '/offers', permission: 'offers' }
      ];

      for (const test of triggerTests) {
        try {
          const response = await this.externalApi.handleRequest({
            method: 'GET',
            path: test.path,
            headers: { 'X-API-Key': apiKey },
            query: { limit: '1' }
          });

          if (response.success) {
            result.availableTriggers.push(test.name);
          }
        } catch (error) {
          // Trigger not available
        }
      }

      // Test available actions
      const actionTests = [
        { name: 'sendEmail', description: 'Enviar email' },
        { name: 'createTask', description: 'Crear tarea' },
        { name: 'updateOfferStatus', description: 'Actualizar oferta' }
      ];

      // Para IFTTT, asumimos que las actions están disponibles si la API key es válida
      // En una implementación real, verificaríamos permisos específicos
      result.availableActions = actionTests.map(test => test.name);

    } catch (error) {
      result.valid = false;
      result.errors.push(error instanceof Error ? error.message : 'Error de validación');
    }

    return result;
  }

  /**
   * Obtener información de configuración para IFTTT
   */
  getIFTTTConfig(): {
    name: string;
    description: string;
    triggers: Array<{
      name: string;
      description: string;
      sample_data: any;
    }>;
    actions: Array<{
      name: string;
      description: string;
      fields: Array<{
        name: string;
        type: string;
        label: string;
        required: boolean;
        sample_value?: any;
      }>;
    }>;
  } {
    return {
      name: 'Plataforma Inmobiliaria',
      description: 'Automatiza tu workflow inmobiliario con propiedades, ofertas y tareas',
      triggers: [
        {
          name: 'property_created',
          description: 'Se activa cuando se crea una nueva propiedad',
          sample_data: {
            id: 'prop_123',
            timestamp: Date.now(),
            property_address: 'Calle Principal 123',
            property_city: 'Santiago',
            property_price: 150000000,
            property_type: 'casa',
            property_url: 'https://app.com/properties/prop_123',
            created_at: new Date().toISOString()
          }
        },
        {
          name: 'offer_created',
          description: 'Se activa cuando se crea una nueva oferta',
          sample_data: {
            id: 'offer_456',
            timestamp: Date.now(),
            offer_price: 140000000,
            offer_currency: 'CLP',
            property_address: 'Calle Principal 123',
            buyer_name: 'Juan Pérez',
            buyer_email: 'juan@email.com',
            offer_status: 'pendiente',
            offer_url: 'https://app.com/offers/offer_456',
            created_at: new Date().toISOString()
          }
        },
        {
          name: 'offer_accepted',
          description: 'Se activa cuando una oferta es aceptada',
          sample_data: {
            id: 'offer_456',
            timestamp: Date.now(),
            offer_price: 140000000,
            property_address: 'Calle Principal 123',
            buyer_name: 'Juan Pérez',
            accepted_at: new Date().toISOString(),
            offer_url: 'https://app.com/offers/offer_456'
          }
        }
      ],
      actions: [
        {
          name: 'send_email',
          description: 'Enviar un email personalizado',
          fields: [
            {
              name: 'recipient_email',
              type: 'email',
              label: 'Email del destinatario',
              required: true,
              sample_value: 'cliente@email.com'
            },
            {
              name: 'subject',
              type: 'text',
              label: 'Asunto del email',
              required: true,
              sample_value: 'Actualización importante'
            },
            {
              name: 'message',
              type: 'textarea',
              label: 'Mensaje del email',
              required: true,
              sample_value: '<p>Hola, tenemos una actualización importante.</p>'
            }
          ]
        },
        {
          name: 'create_task',
          description: 'Crear una nueva tarea',
          fields: [
            {
              name: 'offer_id',
              type: 'text',
              label: 'ID de la oferta',
              required: true,
              sample_value: 'offer_123'
            },
            {
              name: 'title',
              type: 'text',
              label: 'Título de la tarea',
              required: true,
              sample_value: 'Revisar documentos'
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Descripción de la tarea',
              required: false,
              sample_value: 'Verificar que todos los documentos estén completos'
            },
            {
              name: 'priority',
              type: 'select',
              label: 'Prioridad',
              required: false,
              sample_value: 'high'
            }
          ]
        },
        {
          name: 'update_offer_status',
          description: 'Cambiar el estado de una oferta',
          fields: [
            {
              name: 'offer_id',
              type: 'text',
              label: 'ID de la oferta',
              required: true,
              sample_value: 'offer_123'
            },
            {
              name: 'new_status',
              type: 'select',
              label: 'Nuevo estado',
              required: true,
              sample_value: 'aceptada'
            }
          ]
        }
      ]
    };
  }
}

// Instancia global
let iftttIntegrationInstance: IFTTTIntegration | null = null;

export const getIFTTTIntegration = (): IFTTTIntegration => {
  if (!iftttIntegrationInstance) {
    iftttIntegrationInstance = new IFTTTIntegration();
  }
  return iftttIntegrationInstance;
};

// Funciones de conveniencia
export const ifttt = {
  // Triggers
  triggers: {
    propertyCreated: (apiKey: string, limit?: number) =>
      getIFTTTIntegration().triggerPropertyCreated(apiKey, limit),

    offerCreated: (apiKey: string, limit?: number) =>
      getIFTTTIntegration().triggerOfferCreated(apiKey, limit),

    offerAccepted: (apiKey: string, limit?: number) =>
      getIFTTTIntegration().triggerOfferAccepted(apiKey, limit)
  },

  // Actions
  actions: {
    sendEmail: (apiKey: string, request: IFTTTActionRequest) =>
      getIFTTTIntegration().actionSendEmail(apiKey, request),

    createTask: (apiKey: string, request: IFTTTActionRequest) =>
      getIFTTTIntegration().actionCreateTask(apiKey, request),

    updateOfferStatus: (apiKey: string, request: IFTTTActionRequest) =>
      getIFTTTIntegration().actionUpdateOfferStatus(apiKey, request)
  },

  // Configuration
  generateAppletUrls: (baseUrl?: string) =>
    getIFTTTIntegration().generateAppletUrls(baseUrl),

  validateConfiguration: (apiKey: string) =>
    getIFTTTIntegration().validateConfiguration(apiKey),

  getConfig: () => getIFTTTIntegration().getIFTTTConfig()
};

export default getIFTTTIntegration;


