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
    if (import.meta.env.DEV && import.meta.env.VITE_RAILWAY_WEBHOOK_URL) {
      // Extract the webhook path from the full URL
      const fullURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
      const url = new URL(fullURL);
      this.baseURL = `/api${url.pathname}`;
    } else {
      this.baseURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
    }
  }

  async send(payload: WebhookPayload): Promise<void> {
    if (!this.baseURL) {
      console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      return;
    }

    console.log('🌐 Enviando webhook a:', this.baseURL);
    console.log('📦 Payload del webhook:', JSON.stringify(payload, null, 2));

    try {
      // Convertir payload a query parameters para GET request
      const queryParams = new URLSearchParams();
      queryParams.append('data', JSON.stringify(payload));
      
      const urlWithParams = `${this.baseURL}?${queryParams.toString()}`;
      console.log('🔗 URL completa del webhook:', urlWithParams);
      
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
        const result = await response.json();
        console.log('✅ Webhook ejecutado con éxito:', result);
      }
    } catch (error) {
      console.warn('⚠️ Servicio de notificaciones no disponible:', error.message);
      // No lanzar error - el webhook es opcional
    }
  }

  async sendApplicationEvent(
    action: 'received' | 'approved' | 'rejected',
    application: any,
    property: any,
    applicant: any,
    propertyOwner: any
  ): Promise<void> {
    const payload: WebhookPayload = {
      action: `application_${action}` as any,
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

  // Función simplificada para enviar solo los IDs requeridos al aprobar aplicación
  async sendSimpleApprovalEvent(
    applicationId: string,
    propertyId: string,
    applicantId: string
  ): Promise<void> {
    const payload = {
      applicationId,
      propertyId,
      applicantId
    };

    if (!this.baseURL) {
      console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      return;
    }

    console.log('🌐 Enviando webhook simplificado a:', this.baseURL);
    console.log('📦 Payload simplificado:', JSON.stringify(payload, null, 2));

    try {
      // Convertir payload a query parameters para GET request
      const queryParams = new URLSearchParams();
      queryParams.append('data', JSON.stringify(payload));
      
      const urlWithParams = `${this.baseURL}?${queryParams.toString()}`;
      console.log('🔗 URL completa del webhook:', urlWithParams);
      
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
        const result = await response.json();
        console.log('✅ Webhook simplificado ejecutado con éxito:', result);
      }
    } catch (error) {
      console.warn('⚠️ Servicio de notificaciones no disponible:', error.message);
      // No lanzar error - el webhook es opcional
    }
  }

  // Función de prueba para verificar conectividad del webhook
  async testWebhook(): Promise<void> {
    const testPayload: WebhookPayload = {
      action: 'application_received',
      status: 'pendiente',
      timestamp: new Date().toISOString(),
      property: {
        id: 'test-property-id',
        address: 'Dirección de Prueba',
        comuna: 'Comuna de Prueba',
        region: 'Región de Prueba',
        price_clp: 500000,
        listing_type: 'arriendo',
        photos_urls: []
      },
      property_owner: {
        id: 'test-owner-id',
        full_name: 'Propietario de Prueba',
        contact_email: 'test@example.com',
        contact_phone: null
      },
      metadata: {
        source: 'propiedades_app',
        user_agent: navigator.userAgent,
        url: window.location.href,
        environment: import.meta.env.MODE as 'development' | 'production'
      }
    };

    console.log('🧪 Probando webhook con payload de prueba...');
    await this.send(testPayload);
  }
}

export const webhookClient = new WebhookClient();
