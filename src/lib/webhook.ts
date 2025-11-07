// Webhook client for external integrations (n8n, etc.)
interface WebhookPayload {
  // Información básica del evento
  action: 'application_received' | 'application_approved' | 'application_rejected' | 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'property_published';
  decision?: 'approved' | 'rejected' | 'accepted';
  status: string;
  timestamp: string;

  // Información de la aplicación/oferta
  application?: {
    id: string;
    property_id: string;
    applicant_id: string;
    message: string | null;
    created_at: string;
    status: string;
    snapshot_data?: {
      profession: string;
      monthly_income_clp: number;
      age: number;
      nationality: string;
      marital_status: string;
      address: string;
    };
  };

  offer?: {
    id: string;
    property_id: string;
    offerer_id: string;
    amount_clp: number;
    message?: string;
    created_at: string;
  };

  // Información de la propiedad
  property: {
    id: string;
    address: string;
    comuna: string;
    region: string;
    price_clp: number;
    listing_type: 'venta' | 'arriendo';
    bedrooms?: number;
    bathrooms?: number;
    surface_m2?: number;
    photos_urls: string[];
  };

  // Información del usuario (aplicante/oferente)
  applicant?: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string | null;
    profession: string | null;
    monthly_income?: number | null;
  };

  offerer?: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string | null;
  };

  // Información del propietario
  property_owner: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string | null;
  };

  // Metadata adicional
  metadata: {
    source: 'propiedades_app';
    user_agent: string;
    url: string;
    environment: 'development' | 'production';
    ip_address?: string;
  };
}

class WebhookClient {
  private baseURL: string;

  constructor() {
    // Use proxy in development to avoid CORS issues
    if (import.meta.env.DEV) {
      this.baseURL = '/api/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb';
    } else {
      this.baseURL = 'https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb';
    }
  }

  /**
   * Aplana un objeto anidado en parámetros planos para query string
   * Ejemplo: { application: { id: '123' } } => { 'application_id': '123' }
   */
  private flattenPayload(payload: WebhookPayload): Record<string, string> {
    const flat: Record<string, string> = {};

    // Campos de nivel superior
    flat.action = payload.action;
    flat.status = payload.status;
    flat.timestamp = payload.timestamp;
    if (payload.decision) {
      flat.decision = payload.decision;
    }

    // Application data
    if (payload.application) {
      flat.application_id = payload.application.id;
      flat.application_property_id = payload.application.property_id;
      flat.application_applicant_id = payload.application.applicant_id;
      flat.application_status = payload.application.status;
      flat.application_created_at = payload.application.created_at;
      if (payload.application.message) {
        flat.application_message = payload.application.message;
      }
      if (payload.application.snapshot_data) {
        const snapshot = payload.application.snapshot_data;
        flat.application_profession = snapshot.profession;
        flat.application_monthly_income_clp = String(snapshot.monthly_income_clp);
        flat.application_age = String(snapshot.age);
        flat.application_nationality = snapshot.nationality;
        flat.application_marital_status = snapshot.marital_status;
        flat.application_address = snapshot.address;
      }
    }

    // Offer data
    if (payload.offer) {
      flat.offer_id = payload.offer.id;
      flat.offer_property_id = payload.offer.property_id;
      flat.offer_offerer_id = payload.offer.offerer_id;
      flat.offer_amount_clp = String(payload.offer.amount_clp);
      flat.offer_created_at = payload.offer.created_at;
      if (payload.offer.message) {
        flat.offer_message = payload.offer.message;
      }
    }

    // Property data
    if (payload.property) {
      flat.property_id = payload.property.id;
      flat.property_address = payload.property.address;
      flat.property_comuna = payload.property.comuna;
      flat.property_region = payload.property.region;
      flat.property_price_clp = String(payload.property.price_clp);
      flat.property_listing_type = payload.property.listing_type;
      if (payload.property.bedrooms !== undefined) {
        flat.property_bedrooms = String(payload.property.bedrooms);
      }
      if (payload.property.bathrooms !== undefined) {
        flat.property_bathrooms = String(payload.property.bathrooms);
      }
      if (payload.property.surface_m2 !== undefined) {
        flat.property_surface_m2 = String(payload.property.surface_m2);
      }
      if (payload.property.photos_urls && payload.property.photos_urls.length > 0) {
        flat.property_photos_urls = payload.property.photos_urls.join(',');
      }
    }

    // Applicant data
    if (payload.applicant) {
      flat.applicant_id = payload.applicant.id;
      flat.applicant_full_name = payload.applicant.full_name;
      flat.applicant_contact_email = payload.applicant.contact_email;
      if (payload.applicant.contact_phone) {
        flat.applicant_contact_phone = payload.applicant.contact_phone;
      }
      if (payload.applicant.profession) {
        flat.applicant_profession = payload.applicant.profession;
      }
      if (payload.applicant.monthly_income !== undefined && payload.applicant.monthly_income !== null) {
        flat.applicant_monthly_income = String(payload.applicant.monthly_income);
      }
    }

    // Offerer data
    if (payload.offerer) {
      flat.offerer_id = payload.offerer.id;
      flat.offerer_full_name = payload.offerer.full_name;
      flat.offerer_contact_email = payload.offerer.contact_email;
      if (payload.offerer.contact_phone) {
        flat.offerer_contact_phone = payload.offerer.contact_phone;
      }
    }

    // Property owner data
    if (payload.property_owner) {
      flat.property_owner_id = payload.property_owner.id;
      flat.property_owner_full_name = payload.property_owner.full_name;
      flat.property_owner_contact_email = payload.property_owner.contact_email;
      if (payload.property_owner.contact_phone) {
        flat.property_owner_contact_phone = payload.property_owner.contact_phone;
      }
    }

    // Metadata
    if (payload.metadata) {
      flat.metadata_source = payload.metadata.source;
      flat.metadata_user_agent = payload.metadata.user_agent;
      flat.metadata_url = payload.metadata.url;
      flat.metadata_environment = payload.metadata.environment;
      if (payload.metadata.ip_address) {
        flat.metadata_ip_address = payload.metadata.ip_address;
      }
    }

    return flat;
  }

  async send(payload: WebhookPayload): Promise<void> {
    if (!this.baseURL) {
      console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      return;
    }

    console.log('🌐 Enviando webhook a:', this.baseURL);
    console.log('📦 Payload del webhook:', JSON.stringify(payload, null, 2));

    try {
      // Convertir payload complejo a parámetros planos
      const flatPayload = this.flattenPayload(payload);
      console.log('📋 Payload aplanado:', flatPayload);

      // Crear query parameters con valores planos
      const queryParams = new URLSearchParams();
      Object.entries(flatPayload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      const urlWithParams = `${this.baseURL}?${queryParams.toString()}`;
      console.log('🔗 URL completa del webhook (primeros 200 caracteres):', urlWithParams.substring(0, 200) + '...');
      
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PropiedadesApp/1.0',
          'X-Webhook-Source': 'plataforma-inmobiliaria',
          ...(import.meta.env.VITE_WEBHOOK_SECRET && {
            'Authorization': `Bearer ${import.meta.env.VITE_WEBHOOK_SECRET}`
          })
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Webhook respondió con ${response.status}: ${response.statusText}`);
        
        // Intentar leer el cuerpo de la respuesta para más detalles del error
        try {
          const errorText = await response.text();
          console.error('📄 Detalles del error del servidor:', errorText);
        } catch (e) {
          console.error('❌ No se pudo leer el cuerpo de la respuesta de error');
        }
      } else {
        try {
          const result = await response.json();
          console.log('✅ Webhook ejecutado con éxito:', result);
        } catch {
          // Si no hay JSON en la respuesta, está bien
          console.log('✅ Webhook ejecutado con éxito');
        }
      }
    } catch (error) {
      console.warn('⚠️ Servicio de notificaciones no disponible:', error);
      
      // Safely extract error message
      const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
      console.warn('⚠️ Webhook error message:', errorMessage);
      // No lanzar error - el webhook es opcional
    }
  }

  async sendApplicationEvent(
    action: 'received' | 'approved' | 'rejected',
    application: Record<string, unknown>,
    property: Record<string, unknown>,
    applicant: Record<string, unknown>,
    propertyOwner: Record<string, unknown>
  ): Promise<void> {
    const payload: WebhookPayload = {
      action: `application_${action}` as WebhookPayload['action'],
      decision: action === 'received' ? undefined : action,
      status: action === 'approved' ? 'aprobada' : action === 'rejected' ? 'rechazada' : 'pendiente',
      timestamp: new Date().toISOString(),

      application: {
        id: application.id,
        property_id: application.property_id,
        applicant_id: application.applicant_id,
        message: application.message,
        created_at: application.created_at,
        status: action === 'approved' ? 'aprobada' : action === 'rejected' ? 'rechazada' : 'pendiente',
        snapshot_data: {
          profession: application.snapshot_applicant_profession || applicant.profession || 'No especificado',
          monthly_income_clp: application.snapshot_applicant_monthly_income_clp || applicant.monthly_income || 0,
          age: application.snapshot_applicant_age || 0,
          nationality: application.snapshot_applicant_nationality || 'No especificado',
          marital_status: application.snapshot_applicant_marital_status || 'No especificado',
          address: `${application.snapshot_applicant_address_street || ''} ${application.snapshot_applicant_address_number || ''}, ${application.snapshot_applicant_address_commune || ''}`
        }
      },

      property: {
        id: property.id,
        address: `${property.address_street} ${property.address_number || ''}`,
        comuna: property.address_commune,
        region: property.address_region,
        price_clp: property.price_clp,
        listing_type: property.listing_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        surface_m2: property.surface_m2,
        photos_urls: property.property_images?.map((img: any) => img.image_url) || []
      },

      applicant: {
        id: applicant.id,
        full_name: `${applicant.first_name || ''} ${applicant.paternal_last_name || ''}`.trim() || 'No especificado',
        contact_email: applicant.email || 'No especificado',
        contact_phone: applicant.phone || null,
        profession: applicant.profession || null,
        monthly_income: applicant.monthly_income || null
      },

      property_owner: {
        id: propertyOwner.id,
        full_name: `${propertyOwner.first_name || ''} ${propertyOwner.paternal_last_name || ''}`.trim() || 'No especificado',
        contact_email: propertyOwner.email || 'No especificado',
        contact_phone: propertyOwner.phone || null
      },

      metadata: {
        source: 'propiedades_app',
        user_agent: navigator.userAgent,
        url: window.location.href,
        environment: import.meta.env.MODE as 'development' | 'production'
      }
    };

    await this.send(payload);
  }

  async sendOfferEvent(
    action: 'received' | 'accepted' | 'rejected',
    offer: any,
    property: any,
    offerer: any,
    propertyOwner: any
  ): Promise<void> {
    const payload: WebhookPayload = {
      action: `offer_${action}` as any,
      decision: action === 'received' ? undefined : action,
      status: action,
      timestamp: new Date().toISOString(),

      offer: {
        id: offer.id,
        property_id: offer.property_id,
        offerer_id: offer.offerer_id,
        amount_clp: offer.amount_clp,
        message: offer.message,
        created_at: offer.created_at
      },

      property: {
        id: property.id,
        address: `${property.address_street} ${property.address_number || ''}`,
        comuna: property.address_commune,
        region: property.address_region,
        price_clp: property.price_clp,
        listing_type: property.listing_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        surface_m2: property.surface_m2,
        photos_urls: property.property_images?.map((img: any) => img.image_url) || []
      },

      offerer: {
        id: offerer.id,
        full_name: `${offerer.first_name || ''} ${offerer.paternal_last_name || ''}`.trim() || 'No especificado',
        contact_email: offerer.email || 'No especificado',
        contact_phone: offerer.phone || null
      },

      property_owner: {
        id: propertyOwner.id,
        full_name: `${propertyOwner.first_name || ''} ${propertyOwner.paternal_last_name || ''}`.trim() || 'No especificado',
        contact_email: propertyOwner.email || 'No especificado',
        contact_phone: propertyOwner.phone || null
      },

      metadata: {
        source: 'propiedades_app',
        user_agent: navigator.userAgent,
        url: window.location.href,
        environment: import.meta.env.MODE as 'development' | 'production'
      }
    };

    await this.send(payload);
  }

  // Función optimizada para enviar IDs característicos al aprobar aplicación (para N8N)
  async sendSimpleApprovalEvent(
    applicationId: string,
    propertyId: string,
    applicantId: string,
    rentalOwnerCharacteristicId?: string,
    contractConditionsId?: string,
    contractCharacteristicId?: string
  ): Promise<void> {
    // Obtener los characteristic IDs para una búsqueda más eficiente en N8N
    const data = {
      application_characteristic_id: applicationId, // Este vendrá de la base de datos como characteristic_id
      property_characteristic_id: propertyId,       // Este vendrá de la base de datos como characteristic_id
      applicant_characteristic_id: applicantId,     // Este vendrá de la base de datos como characteristic_id
      rental_owner_characteristic_id: rentalOwnerCharacteristicId || null, // ID característico del propietario (de rental_owners)
      // guarantor_characteristic_id: REMOVED - guarantor fields no longer required in webhook v2025-11
      contract_conditions_characteristic_id: contractConditionsId || null, // ID característico de las condiciones del contrato
      contract_characteristic_id: contractCharacteristicId || null, // ID característico del contrato generado
      action: 'application_approved',
      timestamp: new Date().toISOString(),
      // Mantener compatibilidad con UUIDs por si N8N necesita fallback
      application_uuid: applicationId,
      property_uuid: propertyId,
      applicant_uuid: applicantId,
      owner_uuid: rentalOwnerCharacteristicId || null
      // guarantor_uuid: REMOVED - guarantor fields no longer required in webhook v2025-11
    };

    if (!this.baseURL) {
      console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      return;
    }

    console.log('🌐 Enviando webhook GET optimizado a Railway:', this.baseURL);
    console.log('📦 Datos con characteristic IDs:', JSON.stringify(data, null, 2));
    console.log('📋 Application characteristic ID enviado:', data.application_characteristic_id);
    console.log('🏠 Rental owner characteristic ID enviado:', data.rental_owner_characteristic_id);
    // Guarantor fields removed - no longer required in webhook v2025-11
    console.log('📄 Contract characteristic ID enviado:', data.contract_characteristic_id);

    try {
      // Convertir datos a query parameters para GET request
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });

      const url = `${this.baseURL}?${params.toString()}`;
      console.log('🔗 URL completa:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PropiedadesApp/1.0',
          'X-Webhook-Optimized': 'true' // Indicador de que usa characteristic IDs
        }
      });

      console.log('📡 Respuesta del webhook optimizado - Status:', response.status);

      if (!response.ok) {
        console.warn(`⚠️ Webhook respondió con ${response.status}: ${response.statusText}`);

        // Intentar leer el cuerpo de la respuesta para más detalles del error
        try {
          const errorText = await response.text();
          console.error('📄 Detalles del error del servidor:', errorText);
        } catch (e) {
          console.error('❌ No se pudo leer el cuerpo de la respuesta de error');
        }
      } else {
        // Intentar leer la respuesta
        let result;
        try {
          result = await response.text();
          console.log('✅ Webhook optimizado ejecutado con éxito:', result);
        } catch (error) {
          console.log('✅ Webhook optimizado ejecutado con éxito (sin respuesta)');
        }
      }
    } catch (error) {
      console.warn('⚠️ Servicio de notificaciones no disponible:', error);

      // Safely extract error message
      const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
      console.warn('⚠️ Webhook error message:', errorMessage);
      // No lanzar error - el webhook es opcional
    }
  }

  // Función de prueba para verificar conectividad del webhook
  async testWebhook(): Promise<void> {
    // Datos mínimos para probar con GET
    const testData = {
      applicationId: 'test-123',
      propertyId: 'prop-456',
      applicantId: 'user-789',
      ownerId: 'owner-101',
      guarantorId: null,
      action: 'test',
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Probando webhook de Railway con GET...');
    console.log('🌐 URL del webhook:', this.baseURL);
    console.log('📦 Datos de prueba:', JSON.stringify(testData, null, 2));
    
    try {
      // Convertir datos a query parameters
      const params = new URLSearchParams();
      Object.entries(testData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });

      const url = `${this.baseURL}?${params.toString()}`;
      console.log('🔗 URL de prueba:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PropiedadesApp/1.0'
        }
      });

      console.log('📡 Respuesta del webhook de prueba - Status:', response.status);
      console.log('📡 Headers de respuesta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.warn(`⚠️ Webhook de prueba respondió con ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error('📄 Detalles del error:', errorText);
      } else {
        const result = await response.text();
        console.log('✅ Webhook de prueba ejecutado con éxito:', result);
      }
    } catch (error) {
      console.error('❌ Error en webhook de prueba:', error);
    }
  }
}

export const webhookClient = new WebhookClient();

// Función alternativa usando GET para webhooks simples
export const sendWebhookGET = async (data: Record<string, unknown>): Promise<boolean> => {
  const baseURL = import.meta.env.DEV
    ? '/api/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb'
    : 'https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb';

  try {
    // Convertir datos a query parameters
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });

    const url = `${baseURL}?${params.toString()}`;
    console.log('🌐 Enviando webhook GET a:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PropiedadesApp/1.0'
      }
    });

    console.log('📡 Respuesta GET - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Webhook GET falló: ${response.status}`, errorText);
      return false;
    } else {
      const result = await response.text();
      console.log('✅ Webhook GET exitoso:', result);
      return true;
    }
  } catch (error) {
    console.error('❌ Error en webhook GET:', error);
    return false;
  }
};
