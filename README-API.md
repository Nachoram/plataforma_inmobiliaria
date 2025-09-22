# 📡 **API y Integraciones**

> **Documentación completa de APIs, webhooks, Edge Functions y integraciones externas**

---

## 📋 **Índice**
- [🗄️ API de Supabase](#️-api-de-supabase)
- [📧 Sistema de Webhooks](#-sistema-de-webhooks)
- [⚡ Edge Functions](#-edge-functions)
- [🔌 Integraciones Externas](#-integraciones-externas)
- [📊 Endpoints Customizados](#-endpoints-customizados)
- [🔐 Autenticación de API](#-autenticación-de-api)
- [📈 Monitoreo y Logs](#-monitoreo-y-logs)
- [🧪 Testing de APIs](#-testing-de-apis)

---

## 🗄️ **API de Supabase**

### **Cliente Base Configurado**

#### **Configuración Principal**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'plataforma-inmobiliaria-app'
    }
  }
});
```

### **Endpoints Principales**

#### **Profiles API**
```typescript
// GET /profiles - Obtener perfil del usuario actual
export const getCurrentProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// PUT /profiles - Actualizar perfil
export const updateProfile = async (updates: Partial<Profile>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// POST /profiles - Crear perfil (usado por trigger automático)
export const createProfile = async (profileData: ProfileInsert) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

#### **Properties API**
```typescript
// GET /properties - Listar propiedades disponibles
export const getProperties = async (filters?: PropertyFilters) => {
  let query = supabase
    .from('properties')
    .select(`
      *,
      profiles!owner_id (
        first_name,
        paternal_last_name,
        phone
      ),
      property_images (
        image_url,
        storage_path
      )
    `)
    .eq('status', 'disponible')
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters?.listing_type) {
    query = query.eq('listing_type', filters.listing_type);
  }
  if (filters?.min_price) {
    query = query.gte('price_clp', filters.min_price);
  }
  if (filters?.max_price) {
    query = query.lte('price_clp', filters.max_price);
  }
  if (filters?.commune) {
    query = query.ilike('address_commune', `%${filters.commune}%`);
  }
  if (filters?.search) {
    query = query.or(`description.ilike.%${filters.search}%,address_street.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// GET /properties/:id - Obtener propiedad específica
export const getProperty = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      profiles!owner_id (
        first_name,
        paternal_last_name,
        phone,
        email
      ),
      property_images (
        image_url,
        storage_path
      ),
      applications (
        id,
        status,
        created_at,
        profiles!applicant_id (
          first_name,
          paternal_last_name
        )
      ),
      offers (
        id,
        amount_clp,
        status,
        created_at,
        profiles!offerer_id (
          first_name,
          paternal_last_name
        )
      )
    `)
    .eq('id', propertyId)
    .single();

  if (error) throw error;
  return data;
};

// POST /properties - Crear nueva propiedad
export const createProperty = async (propertyData: PropertyInsert) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('properties')
    .insert([{
      ...propertyData,
      owner_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// PUT /properties/:id - Actualizar propiedad
export const updateProperty = async (propertyId: string, updates: Partial<Property>) => {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', propertyId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// DELETE /properties/:id - Soft delete de propiedad
export const deleteProperty = async (propertyId: string) => {
  const { error } = await supabase
    .from('properties')
    .update({ is_visible: false, status: 'pausada' })
    .eq('id', propertyId);

  if (error) throw error;
};
```

#### **Applications API**
```typescript
// GET /applications/sent - Postulaciones enviadas por el usuario
export const getSentApplications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      properties (
        address_street,
        address_number,
        address_commune,
        price_clp,
        listing_type,
        property_images (image_url)
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// GET /applications/received - Postulaciones recibidas en propiedades del usuario
export const getReceivedApplications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      properties!inner (
        id,
        address_street,
        address_number,
        address_commune,
        price_clp
      ),
      profiles!applicant_id (
        first_name,
        paternal_last_name,
        email,
        phone
      ),
      guarantors (
        first_name,
        paternal_last_name,
        relationship
      )
    `)
    .eq('properties.owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// POST /applications - Crear nueva postulación
export const createApplication = async (applicationData: ApplicationInsert) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Obtener perfil del usuario para snapshot
  const { data: profile } = await getCurrentProfile();
  if (!profile) throw new Error('Perfil incompleto');

  const { data, error } = await supabase
    .from('applications')
    .insert([{
      ...applicationData,
      applicant_id: user.id,
      // Snapshot data preservation
      snapshot_applicant_profession: profile.profession,
      snapshot_applicant_monthly_income_clp: applicationData.snapshot_applicant_monthly_income_clp,
      snapshot_applicant_age: applicationData.snapshot_applicant_age,
      snapshot_applicant_nationality: applicationData.snapshot_applicant_nationality,
      snapshot_applicant_marital_status: profile.marital_status,
      snapshot_applicant_address_street: profile.address_street,
      snapshot_applicant_address_number: profile.address_number,
      snapshot_applicant_address_department: profile.address_department,
      snapshot_applicant_address_commune: profile.address_commune,
      snapshot_applicant_address_region: profile.address_region,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// PUT /applications/:id/status - Actualizar estado de postulación
export const updateApplicationStatus = async (
  applicationId: string, 
  status: 'aprobada' | 'rechazada' | 'info_solicitada',
  message?: string
) => {
  const { data, error } = await supabase
    .from('applications')
    .update({ 
      status,
      ...(message && { response_message: message })
    })
    .eq('id', applicationId)
    .select(`
      *,
      properties (
        address_street,
        address_commune,
        price_clp,
        listing_type
      ),
      profiles!applicant_id (
        first_name,
        paternal_last_name,
        email
      )
    `)
    .single();

  if (error) throw error;
  return data;
};
```

#### **Offers API**
```typescript
// GET /offers/sent - Ofertas enviadas por el usuario
export const getSentOffers = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      properties (
        address_street,
        address_number,
        address_commune,
        price_clp,
        property_images (image_url)
      )
    `)
    .eq('offerer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// GET /offers/received - Ofertas recibidas en propiedades del usuario
export const getReceivedOffers = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      properties!inner (
        id,
        address_street,
        address_number,
        address_commune,
        price_clp
      ),
      profiles!offerer_id (
        first_name,
        paternal_last_name,
        email,
        phone
      )
    `)
    .eq('properties.owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// POST /offers - Crear nueva oferta
export const createOffer = async (offerData: OfferInsert) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('offers')
    .insert([{
      ...offerData,
      offerer_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### **Storage API**

#### **Property Images**
```typescript
// POST /storage/property-images - Subir imagen de propiedad
export const uploadPropertyImage = async (
  propertyId: string, 
  file: File,
  index: number = 0
) => {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${propertyId}/${Date.now()}_${index}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(data.path);

  // Registrar en base de datos
  const { data: imageRecord, error: dbError } = await supabase
    .from('property_images')
    .insert([{
      property_id: propertyId,
      image_url: publicUrl,
      storage_path: data.path
    }])
    .select()
    .single();

  if (dbError) throw dbError;

  return { ...imageRecord, publicUrl };
};

// DELETE /storage/property-images/:path - Eliminar imagen
export const deletePropertyImage = async (imagePath: string) => {
  // Eliminar archivo de storage
  const { error: storageError } = await supabase.storage
    .from('property-images')
    .remove([imagePath]);

  if (storageError) throw storageError;

  // Eliminar registro de base de datos
  const { error: dbError } = await supabase
    .from('property_images')
    .delete()
    .eq('storage_path', imagePath);

  if (dbError) throw dbError;
};
```

#### **User Documents**
```typescript
// POST /storage/user-documents - Subir documento de usuario
export const uploadUserDocument = async (
  entityType: 'property_legal' | 'application_applicant' | 'application_guarantor',
  entityId: string,
  file: File,
  documentType: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${user.id}/${entityType}/${entityId}/${Date.now()}_${documentType}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('user-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Registrar en base de datos
  const { data: documentRecord, error: dbError } = await supabase
    .from('documents')
    .insert([{
      owner_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      storage_path: data.path
    }])
    .select()
    .single();

  if (dbError) throw dbError;

  return documentRecord;
};

// GET /storage/user-documents/:path - Obtener documento
export const getDocumentUrl = async (documentPath: string) => {
  const { data, error } = await supabase.storage
    .from('user-documents')
    .createSignedUrl(documentPath, 3600); // 1 hora

  if (error) throw error;
  return data.signedUrl;
};
```

---

## 📧 **Sistema de Webhooks**

### **Configuración de Webhooks**

#### **Variables de Entorno**
```env
# Webhook URL para n8n/Railway
VITE_RAILWAY_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook-test/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
```

#### **Estado del Webhook**
- ✅ **Configurado**: La URL del webhook está correctamente configurada
- ⚠️ **Modo Prueba**: El webhook está en modo test en n8n
- 🔄 **Activación**: Para producción, activar el workflow en n8n

### **Tipos de Eventos Soportados**

#### **Eventos de Postulaciones**
```typescript
// Postulaciones
'application_received'  // Nueva postulación
'application_approved'  // Postulación aprobada
'application_rejected'  // Postulación rechazada
```

#### **Eventos de Ofertas**
```typescript
// Ofertas
'offer_received'        // Nueva oferta
'offer_accepted'        // Oferta aceptada
'offer_rejected'        // Oferta rechazada
```

#### **Eventos de Propiedades**
```typescript
// Propiedades
'property_published'    // Nueva propiedad publicada
```

#### **Payload Structure**
```typescript
// Estructura de datos enviada a n8n
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
    message: string;
    created_at: string;
    snapshot_data: {
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
    bedrooms: number;
    bathrooms: number;
    surface_m2: number;
    photos_urls: string[];
  };

  // Información del usuario (aplicante/oferente)
  applicant?: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string;
    profession: string;
    monthly_income?: number;
  };

  offerer?: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string;
  };

  // Información del propietario
  property_owner: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string;
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
```

### **Funciones de Webhook**

#### **Cliente de Webhook**
```typescript
// src/lib/webhook.ts
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
        snapshot_data: {
          profession: application.snapshot_applicant_profession,
          monthly_income_clp: application.snapshot_applicant_monthly_income_clp,
          age: application.snapshot_applicant_age,
          nationality: application.snapshot_applicant_nationality,
          marital_status: application.snapshot_applicant_marital_status,
          address: `${application.snapshot_applicant_address_street} ${application.snapshot_applicant_address_number}, ${application.snapshot_applicant_address_commune}`
        }
      },

      property: {
        id: property.id,
        address: `${property.address_street} ${property.address_number}`,
        comuna: property.address_commune,
        region: property.address_region,
        price_clp: property.price_clp,
        listing_type: property.listing_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        surface_m2: property.surface_m2,
        photos_urls: property.property_images?.map(img => img.image_url) || []
      },

      applicant: {
        id: applicant.id,
        full_name: `${applicant.first_name} ${applicant.paternal_last_name}`,
        contact_email: applicant.email,
        contact_phone: applicant.phone,
        profession: application.snapshot_applicant_profession,
        monthly_income: application.snapshot_applicant_monthly_income_clp
      },

      property_owner: {
        id: propertyOwner.id,
        full_name: `${propertyOwner.first_name} ${propertyOwner.paternal_last_name}`,
        contact_email: propertyOwner.email,
        contact_phone: propertyOwner.phone
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
        address: `${property.address_street} ${property.address_number}`,
        comuna: property.address_commune,
        region: property.address_region,
        price_clp: property.price_clp,
        listing_type: property.listing_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        surface_m2: property.surface_m2,
        photos_urls: property.property_images?.map(img => img.image_url) || []
      },

      offerer: {
        id: offerer.id,
        full_name: `${offerer.first_name} ${offerer.paternal_last_name}`,
        contact_email: offerer.email,
        contact_phone: offerer.phone
      },

      property_owner: {
        id: propertyOwner.id,
        full_name: `${propertyOwner.first_name} ${propertyOwner.paternal_last_name}`,
        contact_email: propertyOwner.email,
        contact_phone: propertyOwner.phone
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
```

### **Integración en Funciones**

#### **Uso en ApplicationsPage**
```typescript
// src/components/dashboard/ApplicationsPage.tsx
import { webhookClient } from '../../lib/webhook';

const handleApproveApplication = async (applicationId: string) => {
  try {
    // Actualizar estado en base de datos
    const updatedApplication = await updateApplicationStatus(applicationId, 'aprobada');
    
    // Obtener datos completos para webhook
    const property = await getProperty(updatedApplication.property_id);
    const applicant = await getProfile(updatedApplication.applicant_id);
    const propertyOwner = await getProfile(property.owner_id);
    
    // Enviar webhook
    await webhookClient.sendApplicationEvent(
      'approved',
      updatedApplication,
      property,
      applicant,
      propertyOwner
    );
    
    // Actualizar UI
    refetchReceivedApplications();
    
    toast({
      title: 'Postulación aprobada',
      description: 'Se ha enviado la notificación al postulante.',
    });
  } catch (error) {
    console.error('Error approving application:', error);
    toast({
      title: 'Error',
      description: 'No se pudo aprobar la postulación.',
      variant: 'destructive',
    });
  }
};
```

---

## ⚡ **Edge Functions**

### **approve-application Function**

#### **Implementación Completa**
```typescript
// supabase/functions/approve-application/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  applicationId: string;
  status: 'aprobada' | 'rechazada';
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { applicationId, status, message }: RequestBody = await req.json();

    if (!applicationId || !status) {
      return new Response(
        JSON.stringify({ error: 'applicationId and status are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabaseClient
      .from('applications')
      .update({
        status,
        response_message: message,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        properties (
          *,
          profiles!owner_id (
            first_name,
            paternal_last_name,
            email,
            phone
          ),
          property_images (image_url)
        ),
        profiles!applicant_id (
          first_name,
          paternal_last_name,
          email,
          phone
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Send webhook notification
    const webhookUrl = Deno.env.get('WEBHOOK_URL');
    if (webhookUrl) {
      const webhookPayload = {
        action: `application_${status === 'aprobada' ? 'approved' : 'rejected'}`,
        decision: status === 'aprobada' ? 'approved' : 'rejected',
        status: status,
        timestamp: new Date().toISOString(),
        application: {
          id: updatedApplication.id,
          property_id: updatedApplication.property_id,
          applicant_id: updatedApplication.applicant_id,
          message: updatedApplication.message,
          created_at: updatedApplication.created_at
        },
        property: {
          id: updatedApplication.properties.id,
          address: `${updatedApplication.properties.address_street} ${updatedApplication.properties.address_number}`,
          comuna: updatedApplication.properties.address_commune,
          region: updatedApplication.properties.address_region,
          price_clp: updatedApplication.properties.price_clp,
          listing_type: updatedApplication.properties.listing_type,
          photos_urls: updatedApplication.properties.property_images?.map(img => img.image_url) || []
        },
        applicant: {
          id: updatedApplication.profiles.id,
          full_name: `${updatedApplication.profiles.first_name} ${updatedApplication.profiles.paternal_last_name}`,
          contact_email: updatedApplication.profiles.email,
          contact_phone: updatedApplication.profiles.phone
        },
        property_owner: {
          id: updatedApplication.properties.profiles.id,
          full_name: `${updatedApplication.properties.profiles.first_name} ${updatedApplication.properties.profiles.paternal_last_name}`,
          contact_email: updatedApplication.properties.profiles.email,
          contact_phone: updatedApplication.properties.profiles.phone
        },
        metadata: {
          source: 'edge_function',
          environment: 'production'
        }
      };

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Edge-Function/1.0'
          },
          body: JSON.stringify(webhookPayload)
        });
      } catch (webhookError) {
        console.warn('Webhook failed:', webhookError);
        // No fallar la función por error de webhook
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: updatedApplication 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

#### **CORS Helper**
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
```

### **property-stats Function**

#### **Estadísticas de Propiedades**
```typescript
// supabase/functions/property-stats/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface StatsResponse {
  total_properties: number;
  available_properties: number;
  sold_properties: number;
  rented_properties: number;
  total_applications: number;
  total_offers: number;
  avg_price_venta: number;
  avg_price_arriendo: number;
  properties_by_commune: Array<{
    commune: string;
    count: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get property statistics
    const [
      totalPropertiesResult,
      availablePropertiesResult,
      soldPropertiesResult,
      rentedPropertiesResult,
      totalApplicationsResult,
      totalOffersResult,
      avgPriceVentaResult,
      avgPriceArriendoResult,
      propertiesByCommuneResult
    ] = await Promise.all([
      supabaseClient.from('properties').select('id', { count: 'exact' }),
      supabaseClient.from('properties').select('id', { count: 'exact' }).eq('status', 'disponible'),
      supabaseClient.from('properties').select('id', { count: 'exact' }).eq('status', 'vendida'),
      supabaseClient.from('properties').select('id', { count: 'exact' }).eq('status', 'arrendada'),
      supabaseClient.from('applications').select('id', { count: 'exact' }),
      supabaseClient.from('offers').select('id', { count: 'exact' }),
      supabaseClient.from('properties').select('price_clp').eq('listing_type', 'venta'),
      supabaseClient.from('properties').select('price_clp').eq('listing_type', 'arriendo'),
      supabaseClient.from('properties').select('address_commune')
    ]);

    // Calculate averages
    const avgPriceVenta = avgPriceVentaResult.data?.reduce((sum, p) => sum + p.price_clp, 0) / (avgPriceVentaResult.data?.length || 1) || 0;
    const avgPriceArriendo = avgPriceArriendoResult.data?.reduce((sum, p) => sum + p.price_clp, 0) / (avgPriceArriendoResult.data?.length || 1) || 0;

    // Group by commune
    const communeStats = propertiesByCommuneResult.data?.reduce((acc, p) => {
      const commune = p.address_commune;
      acc[commune] = (acc[commune] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const propertiesByCommune = Object.entries(communeStats)
      .map(([commune, count]) => ({ commune, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 communes

    const stats: StatsResponse = {
      total_properties: totalPropertiesResult.count || 0,
      available_properties: availablePropertiesResult.count || 0,
      sold_properties: soldPropertiesResult.count || 0,
      rented_properties: rentedPropertiesResult.count || 0,
      total_applications: totalApplicationsResult.count || 0,
      total_offers: totalOffersResult.count || 0,
      avg_price_venta: Math.round(avgPriceVenta),
      avg_price_arriendo: Math.round(avgPriceArriendo),
      properties_by_commune: propertiesByCommune
    };

    return new Response(
      JSON.stringify(stats),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Stats function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

---

## 🔌 **Integraciones Externas**

### **n8n Workflow Configuration**

#### **Workflow de Notificaciones**
```json
{
  "name": "Real Estate Notifications",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "real-estate-events",
        "httpMethod": "POST",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Switch",
      "type": "n8n-nodes-base.switch",
      "position": [450, 300],
      "parameters": {
        "values": [
          {
            "conditions": [
              {
                "leftValue": "={{$json.action}}",
                "rightValue": "application_approved",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                }
              }
            ]
          },
          {
            "conditions": [
              {
                "leftValue": "={{$json.action}}",
                "rightValue": "application_rejected",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                }
              }
            ]
          },
          {
            "conditions": [
              {
                "leftValue": "={{$json.action}}",
                "rightValue": "offer_received",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "Send Approval Email",
      "type": "n8n-nodes-base.gmail",
      "position": [650, 200],
      "parameters": {
        "operation": "send",
        "to": "={{$json.applicant.contact_email}}",
        "subject": "🎉 Tu postulación fue aprobada!",
        "message": "Hola {{$json.applicant.full_name}},\n\nTu postulación para la propiedad en {{$json.property.address}} ha sido aprobada.\n\nDetalles:\n- Precio: ${{$json.property.price_clp}}\n- Tipo: {{$json.property.listing_type}}\n\nContacta al propietario: {{$json.property_owner.contact_email}}"
      }
    },
    {
      "name": "Send Rejection Email",
      "type": "n8n-nodes-base.gmail",
      "position": [650, 300],
      "parameters": {
        "operation": "send",
        "to": "={{$json.applicant.contact_email}}",
        "subject": "Información sobre tu postulación",
        "message": "Hola {{$json.applicant.full_name}},\n\nLamentamos informarte que tu postulación para la propiedad en {{$json.property.address}} no fue aprobada en esta ocasión.\n\nTe invitamos a seguir explorando otras propiedades disponibles en nuestra plataforma."
      }
    },
    {
      "name": "Notify Owner - New Offer",
      "type": "n8n-nodes-base.gmail",
      "position": [650, 400],
      "parameters": {
        "operation": "send",
        "to": "={{$json.property_owner.contact_email}}",
        "subject": "💰 Nueva oferta recibida",
        "message": "Hola {{$json.property_owner.full_name}},\n\nHas recibido una nueva oferta para tu propiedad en {{$json.property.address}}.\n\nOferta: ${{$json.offer.amount_clp}}\nDe: {{$json.offerer.full_name}}\nContacto: {{$json.offerer.contact_email}}\n\nRevisa tu dashboard para más detalles."
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Switch",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch": {
      "main": [
        [
          {
            "node": "Send Approval Email",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Send Rejection Email",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Notify Owner - New Offer",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### **Integración con CRM**

#### **HubSpot Integration**
```typescript
// src/lib/integrations/hubspot.ts
class HubSpotIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createContact(profile: Profile): Promise<void> {
    const contactData = {
      properties: {
        email: profile.email,
        firstname: profile.first_name,
        lastname: `${profile.paternal_last_name} ${profile.maternal_last_name}`,
        phone: profile.phone,
        company: profile.profession,
        city: profile.address_commune,
        state: profile.address_region,
        country: 'Chile',
        lifecyclestage: 'lead'
      }
    };

    await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(contactData)
    });
  }

  async createDeal(property: Property, application: Application): Promise<void> {
    const dealData = {
      properties: {
        dealname: `Propiedad ${property.address_street} ${property.address_number}`,
        amount: property.price_clp,
        dealstage: 'appointmentscheduled',
        pipeline: 'default',
        closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        hubspot_owner_id: '1234567' // ID del owner en HubSpot
      }
    };

    await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(dealData)
    });
  }
}
```

---

## 📊 **Endpoints Customizados**

### **Search API**

#### **Búsqueda Avanzada de Propiedades**
```typescript
// src/lib/api/search.ts
export interface SearchFilters {
  query?: string;
  listing_type?: 'venta' | 'arriendo';
  price_range?: { min: number; max: number };
  bedrooms_range?: { min: number; max: number };
  bathrooms_range?: { min: number; max: number };
  surface_range?: { min: number; max: number };
  communes?: string[];
  regions?: string[];
  property_type?: string[];
  amenities?: string[];
  sort_by?: 'price_asc' | 'price_desc' | 'created_at_desc' | 'surface_desc';
  page?: number;
  limit?: number;
}

export const searchProperties = async (filters: SearchFilters) => {
  let query = supabase
    .from('properties')
    .select(`
      *,
      profiles!owner_id (
        first_name,
        paternal_last_name,
        phone
      ),
      property_images (
        image_url
      )
    `)
    .eq('status', 'disponible')
    .eq('is_visible', true);

  // Text search
  if (filters.query) {
    query = query.or(`
      description.ilike.%${filters.query}%,
      address_street.ilike.%${filters.query}%,
      address_commune.ilike.%${filters.query}%
    `);
  }

  // Listing type
  if (filters.listing_type) {
    query = query.eq('listing_type', filters.listing_type);
  }

  // Price range
  if (filters.price_range) {
    if (filters.price_range.min) {
      query = query.gte('price_clp', filters.price_range.min);
    }
    if (filters.price_range.max) {
      query = query.lte('price_clp', filters.price_range.max);
    }
  }

  // Bedrooms range
  if (filters.bedrooms_range) {
    if (filters.bedrooms_range.min) {
      query = query.gte('bedrooms', filters.bedrooms_range.min);
    }
    if (filters.bedrooms_range.max) {
      query = query.lte('bedrooms', filters.bedrooms_range.max);
    }
  }

  // Bathrooms range
  if (filters.bathrooms_range) {
    if (filters.bathrooms_range.min) {
      query = query.gte('bathrooms', filters.bathrooms_range.min);
    }
    if (filters.bathrooms_range.max) {
      query = query.lte('bathrooms', filters.bathrooms_range.max);
    }
  }

  // Surface range
  if (filters.surface_range) {
    if (filters.surface_range.min) {
      query = query.gte('surface_m2', filters.surface_range.min);
    }
    if (filters.surface_range.max) {
      query = query.lte('surface_m2', filters.surface_range.max);
    }
  }

  // Location filters
  if (filters.communes && filters.communes.length > 0) {
    query = query.in('address_commune', filters.communes);
  }

  if (filters.regions && filters.regions.length > 0) {
    query = query.in('address_region', filters.regions);
  }

  // Sorting
  switch (filters.sort_by) {
    case 'price_asc':
      query = query.order('price_clp', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_clp', { ascending: false });
      break;
    case 'surface_desc':
      query = query.order('surface_m2', { ascending: false });
      break;
    case 'created_at_desc':
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  };
};
```

### **Analytics API**

#### **Métricas del Dashboard**
```typescript
// src/lib/api/analytics.ts
export interface DashboardMetrics {
  user_stats: {
    total_properties: number;
    active_properties: number;
    applications_received: number;
    applications_sent: number;
    offers_received: number;
    offers_sent: number;
  };
  activity_timeline: Array<{
    date: string;
    type: 'property_created' | 'application_received' | 'application_sent' | 'offer_received' | 'offer_sent';
    title: string;
    description: string;
  }>;
  performance_metrics: {
    avg_response_time_hours: number;
    approval_rate: number;
    properties_by_status: Record<string, number>;
  };
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Get user statistics
  const [
    userProperties,
    receivedApplications,
    sentApplications,
    receivedOffers,
    sentOffers
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('id, status')
      .eq('owner_id', user.id),
    
    supabase
      .from('applications')
      .select('id, status, created_at')
      .in('property_id', 
        supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id)
      ),
    
    supabase
      .from('applications')
      .select('id, status, created_at')
      .eq('applicant_id', user.id),
    
    supabase
      .from('offers')
      .select('id, status, created_at')
      .in('property_id',
        supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id)
      ),
    
    supabase
      .from('offers')
      .select('id, status, created_at')
      .eq('offerer_id', user.id)
  ]);

  // Calculate metrics
  const userStats = {
    total_properties: userProperties.data?.length || 0,
    active_properties: userProperties.data?.filter(p => p.status === 'disponible').length || 0,
    applications_received: receivedApplications.data?.length || 0,
    applications_sent: sentApplications.data?.length || 0,
    offers_received: receivedOffers.data?.length || 0,
    offers_sent: sentOffers.data?.length || 0,
  };

  // Activity timeline
  const activities: DashboardMetrics['activity_timeline'] = [];
  
  // Add recent activities
  userProperties.data?.slice(0, 5).forEach(property => {
    activities.push({
      date: property.created_at,
      type: 'property_created',
      title: 'Propiedad publicada',
      description: `Nueva propiedad añadida a tu portafolio`
    });
  });

  sentApplications.data?.slice(0, 5).forEach(app => {
    activities.push({
      date: app.created_at,
      type: 'application_sent',
      title: 'Postulación enviada',
      description: `Postulaste a una propiedad`
    });
  });

  // Sort by date
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Performance metrics
  const approvedApplications = receivedApplications.data?.filter(app => app.status === 'aprobada').length || 0;
  const totalApplications = receivedApplications.data?.length || 0;
  
  const propertiesByStatus = userProperties.data?.reduce((acc, property) => {
    acc[property.status] = (acc[property.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    user_stats: userStats,
    activity_timeline: activities.slice(0, 10),
    performance_metrics: {
      avg_response_time_hours: 24, // Placeholder - calcular basado en datos reales
      approval_rate: totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0,
      properties_by_status: propertiesByStatus
    }
  };
};
```

---

## 🔐 **Autenticación de API**

### **JWT Token Management**

#### **Token Refresh Helper**
```typescript
// src/lib/auth.ts
export const refreshToken = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Error refreshing token:', error);
    // Redirect to login
    window.location.href = '/auth';
    return null;
  }
  return data.session;
};

export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
};
```

### **RLS Testing Helpers**

#### **Policy Testing Functions**
```typescript
// src/utils/rlsTest.ts
export const testRLSPolicy = async (
  table: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  data?: any
) => {
  console.log(`🔒 Testing RLS for ${table} - ${operation}`);
  
  try {
    let query = supabase.from(table);
    
    switch (operation) {
      case 'SELECT':
        const { data: selectData, error: selectError } = await query.select('*').limit(1);
        console.log('SELECT result:', { data: selectData, error: selectError });
        break;
        
      case 'INSERT':
        const { data: insertData, error: insertError } = await query.insert([data]).select();
        console.log('INSERT result:', { data: insertData, error: insertError });
        break;
        
      case 'UPDATE':
        const { data: updateData, error: updateError } = await query.update(data).eq('id', data.id);
        console.log('UPDATE result:', { data: updateData, error: updateError });
        break;
        
      case 'DELETE':
        const { error: deleteError } = await query.delete().eq('id', data.id);
        console.log('DELETE result:', { error: deleteError });
        break;
    }
  } catch (error) {
    console.error('RLS Test failed:', error);
  }
};
```

---

## 📈 **Monitoreo y Logs**

### **API Logging**

#### **Request/Response Logger**
```typescript
// src/lib/apiLogger.ts
interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  error?: string;
  user_id?: string;
}

class APILogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  logRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
    error?: string,
    userId?: string
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration,
      error,
      user_id: userId
    };

    this.logs.unshift(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
      console.log(`${statusEmoji} ${method} ${url} - ${status} (${duration}ms)`);
      
      if (error) {
        console.error('API Error:', error);
      }
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.status >= 400);
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const apiLogger = new APILogger();

// Interceptor for Supabase requests
export const setupAPILogging = () => {
  const originalFrom = supabase.from;
  
  supabase.from = function(table: string) {
    const startTime = Date.now();
    const builder = originalFrom.call(this, table);
    
    // Override then to capture results
    const originalThen = builder.then;
    builder.then = function(onResolve, onReject) {
      return originalThen.call(this,
        (result) => {
          const duration = Date.now() - startTime;
          const status = result.error ? 400 : 200;
          
          apiLogger.logRequest(
            'QUERY',
            table,
            status,
            duration,
            result.error?.message
          );
          
          return onResolve ? onResolve(result) : result;
        },
        (error) => {
          const duration = Date.now() - startTime;
          
          apiLogger.logRequest(
            'QUERY',
            table,
            500,
            duration,
            error.message
          );
          
          return onReject ? onReject(error) : Promise.reject(error);
        }
      );
    };
    
    return builder;
  };
};
```

---

## 🧪 **Testing de APIs**

### **Test Helpers**

#### **API Testing Utilities**
```typescript
// src/test/apiHelpers.ts
export const mockSupabaseResponse = (data: any = null, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
});

export const createMockProperty = (): Property => ({
  id: 'prop-123',
  owner_id: 'user-123',
  status: 'disponible',
  listing_type: 'venta',
  address_street: 'Calle Falsa',
  address_number: '123',
  address_department: null,
  address_commune: 'Santiago',
  address_region: 'Metropolitana',
  price_clp: 100000000,
  common_expenses_clp: 50000,
  bedrooms: 3,
  bathrooms: 2,
  surface_m2: 80,
  description: 'Hermosa propiedad',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: null,
  is_visible: true,
  is_featured: false
});

export const createMockApplication = (): Application => ({
  id: 'app-123',
  property_id: 'prop-123',
  applicant_id: 'user-456',
  guarantor_id: null,
  status: 'pendiente',
  message: 'Mensaje de postulación',
  snapshot_applicant_profession: 'Ingeniero',
  snapshot_applicant_monthly_income_clp: 1500000,
  snapshot_applicant_age: 30,
  snapshot_applicant_nationality: 'Chilena',
  snapshot_applicant_marital_status: 'soltero',
  snapshot_applicant_address_street: 'Calle Real',
  snapshot_applicant_address_number: '456',
  snapshot_applicant_address_department: null,
  snapshot_applicant_address_commune: 'Las Condes',
  snapshot_applicant_address_region: 'Metropolitana',
  created_at: '2024-01-01T00:00:00Z'
});
```

#### **Integration Tests**
```typescript
// src/test/api.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createProperty, getProperties, updateProperty } from '../lib/api/properties';

describe('Properties API Integration Tests', () => {
  let testPropertyId: string;

  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
    if (testPropertyId) {
      await deleteProperty(testPropertyId);
    }
  });

  it('should create a property successfully', async () => {
    const propertyData = {
      listing_type: 'venta' as const,
      address_street: 'Test Street',
      address_number: '123',
      address_commune: 'Test Commune',
      address_region: 'Test Region',
      price_clp: 100000000,
      bedrooms: 3,
      bathrooms: 2,
      surface_m2: 80,
      description: 'Test property'
    };

    const createdProperty = await createProperty(propertyData);
    testPropertyId = createdProperty.id;

    expect(createdProperty).toBeDefined();
    expect(createdProperty.address_street).toBe('Test Street');
    expect(createdProperty.status).toBe('disponible');
  });

  it('should fetch properties with filters', async () => {
    const filters = {
      listing_type: 'venta' as const,
      min_price: 50000000,
      max_price: 200000000
    };

    const result = await getProperties(filters);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      expect(result[0].listing_type).toBe('venta');
      expect(result[0].price_clp).toBeGreaterThanOrEqual(50000000);
      expect(result[0].price_clp).toBeLessThanOrEqual(200000000);
    }
  });
});
```

---

## 📚 **Documentación Relacionada**

### **🏗️ Arquitectura y Desarrollo**
- 🏗️ **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Arquitectura del sistema y base de datos
- 💻 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Ejemplos prácticos y mejores prácticas
- 👥 **[README-CONTRIBUCION.md](README-CONTRIBUCION.md)** - Guías de contribución y estándares

### **🛠️ Configuración y Seguridad**
- 🚀 **[README-INSTALACION.md](README-INSTALACION.md)** - Instalación y configuración inicial
- 🔐 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - Seguridad, RLS y autenticación
- 🗄️ **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones y fixes de base de datos

### **🚀 Producción y Debugging**
- 🚀 **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)** - Despliegue y producción
- 🐛 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Debugging y troubleshooting

---

**✅ Con esta documentación de APIs, puedes integrar completamente tu plataforma inmobiliaria.**
