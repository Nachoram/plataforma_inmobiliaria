// Webhook client for external integrations (n8n, etc.)
interface WebhookPayload {
  // Información básica del evento
  action: 'application_approved' | 'application_rejected' | 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'property_published';
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
    this.baseURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
  }

  async send(payload: WebhookPayload): Promise<void> {
    if (!this.baseURL) {
      console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      return;
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'PropiedadesApp/1.0',
          'X-Webhook-Source': 'plataforma-inmobiliaria'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn(`⚠️ Webhook respondió con ${response.status}: ${response.statusText}`);
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
    action: 'approved' | 'rejected',
    application: any,
    property: any,
    applicant: any,
    propertyOwner: any
  ): Promise<void> {
    const payload: WebhookPayload = {
      action: `application_${action}` as any,
      decision: action,
      status: action === 'approved' ? 'aprobada' : 'rechazada',
      timestamp: new Date().toISOString(),

      application: {
        id: application.id,
        property_id: application.property_id,
        applicant_id: application.applicant_id,
        message: application.message,
        created_at: application.created_at,
        status: action === 'approved' ? 'aprobada' : 'rechazada',
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
}

export const webhookClient = new WebhookClient();
