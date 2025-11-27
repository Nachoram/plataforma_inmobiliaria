// Integración con HubSpot CRM
// Sincroniza propiedades y ofertas con HubSpot usando la API externa

import { getExternalApiService } from '../externalApi';

export interface HubSpotConfig {
  apiKey: string;
  portalId: string;
  syncEnabled: boolean;
  syncProperties: boolean;
  syncOffers: boolean;
  syncContacts: boolean;
  propertyPipelineId?: string;
  offerPipelineId?: string;
  customProperties: {
    propertyType: string;
    offerStatus: string;
    propertyValue: string;
  };
}

export interface HubSpotContact {
  id?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface HubSpotProperty {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  property_type?: string;
  status?: string;
}

export interface HubSpotDeal {
  id?: string;
  name: string;
  amount?: number;
  close_date?: string;
  stage?: string;
  pipeline?: string;
  associated_contact?: string;
  associated_property?: string;
}

class HubSpotIntegration {
  private config: HubSpotConfig;
  private externalApi = getExternalApiService();
  private baseUrl = 'https://api.hubapi.com';

  constructor(config: HubSpotConfig) {
    this.config = config;
  }

  // ========================================================================
  // AUTENTICACIÓN Y CONFIGURACIÓN
  // ========================================================================

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts?limit=1`, {
        headers: this.getHeaders()
      });

      if (response.ok) {
        return { success: true, message: 'Conexión exitosa con HubSpot' };
      } else {
        const error = await response.text();
        return { success: false, message: `Error de conexión: ${response.status} ${error}` };
      }
    } catch (error) {
      return { success: false, message: `Error de red: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN DE CONTACTOS (USUARIOS)
  // ========================================================================

  async syncContacts(apiKey: string): Promise<{
    synced: number;
    skipped: number;
    errors: string[];
  }> {
    const result = { synced: 0, skipped: 0, errors: [] as string[] };

    if (!this.config.syncContacts) {
      return result;
    }

    try {
      // Obtener usuarios de la plataforma
      const usersResponse = await this.externalApi.handleRequest({
        method: 'GET',
        path: '/users',
        headers: { 'X-API-Key': apiKey },
        query: { limit: '100' }
      });

      if (!usersResponse.success) {
        result.errors.push(`Error obteniendo usuarios: ${usersResponse.error?.message}`);
        return result;
      }

      const users = usersResponse.data || [];

      for (const user of users) {
        try {
          // Buscar si el contacto ya existe en HubSpot
          const existingContact = await this.findContactByEmail(user.email);

          const contactData: HubSpotContact = {
            email: user.email,
            firstname: user.full_name?.split(' ')[0],
            lastname: user.full_name?.split(' ').slice(1).join(' '),
            phone: user.phone
          };

          if (existingContact) {
            // Actualizar contacto existente
            await this.updateContact(existingContact.id!, contactData);
            result.synced++;
          } else {
            // Crear nuevo contacto
            await this.createContact(contactData);
            result.synced++;
          }
        } catch (error) {
          result.errors.push(`Error sincronizando usuario ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.skipped++;
        }
      }

    } catch (error) {
      result.errors.push(`Error en sincronización de contactos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async findContactByEmail(email: string): Promise<{ id: string } | null> {
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.[0] ? { id: data.results[0].id } : null;
  }

  private async createContact(contact: HubSpotContact): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        properties: {
          email: contact.email,
          firstname: contact.firstname,
          lastname: contact.lastname,
          phone: contact.phone
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error creando contacto: ${response.status}`);
    }

    return await response.json();
  }

  private async updateContact(contactId: string, contact: HubSpotContact): Promise<void> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        properties: {
          firstname: contact.firstname,
          lastname: contact.lastname,
          phone: contact.phone
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error actualizando contacto: ${response.status}`);
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN DE PROPIEDADES
  // ========================================================================

  async syncProperties(apiKey: string): Promise<{
    synced: number;
    skipped: number;
    errors: string[];
  }> {
    const result = { synced: 0, skipped: 0, errors: [] as string[] };

    if (!this.config.syncProperties) {
      return result;
    }

    try {
      // Obtener propiedades de la plataforma
      const propertiesResponse = await this.externalApi.handleRequest({
        method: 'GET',
        path: '/properties',
        headers: { 'X-API-Key': apiKey },
        query: { limit: '50', status: 'available' }
      });

      if (!propertiesResponse.success) {
        result.errors.push(`Error obteniendo propiedades: ${propertiesResponse.error?.message}`);
        return result;
      }

      const properties = propertiesResponse.data || [];

      for (const property of properties) {
        try {
          // Crear deal en HubSpot para representar la propiedad
          const dealData: HubSpotDeal = {
            name: `${property.address_street} ${property.address_number}`,
            amount: property.price,
            pipeline: this.config.propertyPipelineId || 'default',
            stage: 'property_available'
          };

          // Buscar si ya existe un deal para esta propiedad
          const existingDeal = await this.findDealByName(dealData.name);

          if (existingDeal) {
            // Actualizar deal existente
            await this.updateDeal(existingDeal.id!, dealData);
            result.synced++;
          } else {
            // Crear nuevo deal
            await this.createDeal(dealData);
            result.synced++;
          }
        } catch (error) {
          result.errors.push(`Error sincronizando propiedad ${property.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.skipped++;
        }
      }

    } catch (error) {
      result.errors.push(`Error en sincronización de propiedades: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async findDealByName(name: string): Promise<{ id: string } | null> {
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/deals/search`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'dealname',
              operator: 'EQ',
              value: name
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.[0] ? { id: data.results[0].id } : null;
  }

  private async createDeal(deal: HubSpotDeal): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        properties: {
          dealname: deal.name,
          amount: deal.amount?.toString(),
          dealstage: deal.stage,
          pipeline: deal.pipeline
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error creando deal: ${response.status}`);
    }

    return await response.json();
  }

  private async updateDeal(dealId: string, deal: HubSpotDeal): Promise<void> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        properties: {
          amount: deal.amount?.toString(),
          dealstage: deal.stage
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error actualizando deal: ${response.status}`);
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN DE OFERTAS
  // ========================================================================

  async syncOffers(apiKey: string): Promise<{
    synced: number;
    skipped: number;
    errors: string[];
  }> {
    const result = { synced: 0, skipped: 0, errors: [] as string[] };

    if (!this.config.syncOffers) {
      return result;
    }

    try {
      // Obtener ofertas de la plataforma
      const offersResponse = await this.externalApi.handleRequest({
        method: 'GET',
        path: '/offers',
        headers: { 'X-API-Key': apiKey },
        query: { limit: '50' }
      });

      if (!offersResponse.success) {
        result.errors.push(`Error obteniendo ofertas: ${offersResponse.error?.message}`);
        return result;
      }

      const offers = offersResponse.data || [];

      for (const offer of offers) {
        try {
          // Crear deal en HubSpot para representar la oferta
          const stageMap = {
            'pendiente': 'offer_pending',
            'aceptada': 'offer_accepted',
            'rechazada': 'offer_rejected',
            'completada': 'deal_closed'
          };

          const dealData: HubSpotDeal = {
            name: `Oferta - ${offer.property?.address_street} ${offer.property?.address_number}`,
            amount: offer.offered_price,
            pipeline: this.config.offerPipelineId || 'offers',
            stage: stageMap[offer.status as keyof typeof stageMap] || 'offer_pending'
          };

          // Buscar si ya existe un deal para esta oferta
          const existingDeal = await this.findDealByName(dealData.name);

          if (existingDeal) {
            // Actualizar deal existente
            await this.updateDeal(existingDeal.id!, dealData);
            result.synced++;
          } else {
            // Crear nuevo deal
            const newDeal = await this.createDeal(dealData);

            // Asociar con el contacto (buyer) si existe
            if (offer.buyer?.email) {
              const contact = await this.findContactByEmail(offer.buyer.email);
              if (contact) {
                await this.associateDealWithContact(newDeal.id, contact.id);
              }
            }

            result.synced++;
          }
        } catch (error) {
          result.errors.push(`Error sincronizando oferta ${offer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.skipped++;
        }
      }

    } catch (error) {
      result.errors.push(`Error en sincronización de ofertas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async associateDealWithContact(dealId: string, contactId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 3 // Deal to Contact association
        })
      }
    );

    if (!response.ok) {
      console.warn(`Error asociando deal ${dealId} con contact ${contactId}: ${response.status}`);
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN COMPLETA
  // ========================================================================

  async fullSync(apiKey: string): Promise<{
    contacts: { synced: number; skipped: number; errors: string[] };
    properties: { synced: number; skipped: number; errors: string[] };
    offers: { synced: number; skipped: number; errors: string[] };
    totalSynced: number;
    totalErrors: number;
    duration: number;
  }> {
    const startTime = Date.now();

    console.log('🔄 Iniciando sincronización completa con HubSpot...');

    const [contacts, properties, offers] = await Promise.all([
      this.syncContacts(apiKey),
      this.syncProperties(apiKey),
      this.syncOffers(apiKey)
    ]);

    const duration = Date.now() - startTime;
    const totalSynced = contacts.synced + properties.synced + offers.synced;
    const totalErrors = contacts.errors.length + properties.errors.length + offers.errors.length;

    console.log(`✅ Sincronización completada: ${totalSynced} elementos sincronizados, ${totalErrors} errores en ${duration}ms`);

    return {
      contacts,
      properties,
      offers,
      totalSynced,
      totalErrors,
      duration
    };
  }

  // ========================================================================
  // WEBHOOK HANDLING
  // ========================================================================

  async handleWebhook(payload: any): Promise<void> {
    // Procesar webhooks de la plataforma inmobiliaria
    const { event, data } = payload;

    console.log(`🎣 Procesando webhook de HubSpot: ${event}`, data);

    // Aquí puedes implementar lógica específica para cada tipo de evento
    switch (event) {
      case 'property.created':
      case 'property.updated':
        // Sincronizar propiedad con HubSpot
        await this.syncPropertiesFromWebhook(data);
        break;

      case 'offer.created':
      case 'offer.updated':
      case 'offer.status_changed':
        // Sincronizar oferta con HubSpot
        await this.syncOffersFromWebhook(data);
        break;

      case 'user.created':
      case 'user.updated':
        // Sincronizar contacto con HubSpot
        await this.syncContactsFromWebhook(data);
        break;

      default:
        console.log(`Evento no manejado: ${event}`);
    }
  }

  private async syncPropertiesFromWebhook(propertyData: any): Promise<void> {
    // Lógica para sincronizar una propiedad específica desde webhook
    console.log('Sincronizando propiedad desde webhook:', propertyData.id);
  }

  private async syncOffersFromWebhook(offerData: any): Promise<void> {
    // Lógica para sincronizar una oferta específica desde webhook
    console.log('Sincronizando oferta desde webhook:', offerData.id);
  }

  private async syncContactsFromWebhook(userData: any): Promise<void> {
    // Lógica para sincronizar un contacto específico desde webhook
    console.log('Sincronizando contacto desde webhook:', userData.id);
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  updateConfig(newConfig: Partial<HubSpotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): HubSpotConfig {
    return { ...this.config };
  }

  destroy(): void {
    // Cleanup si es necesario
    console.log('💥 HubSpot Integration destruida');
  }
}

// Factory function
export const createHubSpotIntegration = (config: HubSpotConfig): HubSpotIntegration => {
  return new HubSpotIntegration(config);
};

// Utilidades de configuración
export const hubspotConfigTemplates = {
  basic: {
    syncEnabled: true,
    syncProperties: true,
    syncOffers: true,
    syncContacts: true,
    customProperties: {
      propertyType: 'property_type',
      offerStatus: 'offer_status',
      propertyValue: 'property_value'
    }
  },

  salesFocused: {
    syncEnabled: true,
    syncProperties: false,
    syncOffers: true,
    syncContacts: true,
    offerPipelineId: 'sales_offers',
    customProperties: {
      propertyType: 'deal_type',
      offerStatus: 'sales_stage',
      propertyValue: 'deal_amount'
    }
  },

  marketingFocused: {
    syncEnabled: true,
    syncProperties: true,
    syncOffers: false,
    syncContacts: true,
    propertyPipelineId: 'property_leads',
    customProperties: {
      propertyType: 'lead_type',
      offerStatus: 'lead_status',
      propertyValue: 'lead_value'
    }
  }
};

export default HubSpotIntegration;
