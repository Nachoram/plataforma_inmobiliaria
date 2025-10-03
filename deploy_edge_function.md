# 🚀 Desplegar Edge Function - Guía Paso a Paso

## Paso 1: Acceder al Dashboard
1. Ve a [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. Ve a **"Edge Functions"** en el menú lateral

## Paso 2: Crear la Función
1. Haz clic en **"Create a function"**
2. **Function name**: `approve-application`
3. **Function URL**: Se generará automáticamente

## Paso 3: Pegar el Código
Copia y pega TODO el contenido del archivo:
`supabase/functions/approve-application/index.ts`

## Paso 4: Desplegar
1. Haz clic en **"Deploy function"**
2. Espera a que aparezca el mensaje de éxito
3. Ve a la pestaña **"Logs"** para verificar que no hay errores

## Paso 5: Probar
1. Aprueba una postulación desde tu app
2. Deberías ver en los logs de Supabase:
   - ✅ Solicitud OPTIONS (CORS) - 200 OK
   - ✅ Solicitud POST - 200 OK
   - ✅ Logs del webhook con `created_by` y `approved_by`

## 📋 Código de la Función

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ApprovalWebhookPayload {
  application_id: string;
  created_by: string;
  approved_by: string;
  property_id: string;
  applicant_id: string;
  applicant_data: {
    full_name: string;
    contact_email: string;
    contact_phone?: string;
    profession?: string;
    company?: string;
    monthly_income?: number;
  };
  property_data: {
    address: string;
    city: string;
    price: number;
    listing_type: string;
  };
  timestamp: string;
  action: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar autorización
    const authHeader = req.headers.get('Authorization')
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET') || 'default-secret'

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (token !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parsear payload
    const payload: ApprovalWebhookPayload = await req.json()

    // Validar payload requerido
    if (!payload.application_id || !payload.created_by || !payload.approved_by || !payload.applicant_data?.contact_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: application_id, created_by, approved_by, and applicant contact_email are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Aquí puedes integrar con servicios externos
    console.log('🎉 Application approved:', payload.application_id)
    console.log('👤 Created by:', payload.created_by)
    console.log('✅ Approved by:', payload.approved_by)
    console.log('📧 Sending notification to:', payload.applicant_data.contact_email)
    console.log('🏠 Property:', payload.property_data.address)

    // Ejemplo de integraciones que puedes hacer:

    // 1. Enviar email de aprobación
    await sendApprovalEmail(payload)

    // 2. Crear tarea en sistema de gestión
    await createManagementTask(payload)

    // 3. Notificar a sistemas externos
    await notifyExternalSystems(payload)

    // 4. Generar documentos automáticamente
    await generateContractDocuments(payload)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        application_id: payload.application_id,
        created_by: payload.created_by,
        approved_by: payload.approved_by,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Función para enviar email de aprobación
async function sendApprovalEmail(payload: ApprovalWebhookPayload) {
  try {
    // Aquí integrarías con tu servicio de email (SendGrid, Resend, etc.)
    console.log(`📧 Sending approval email to ${payload.applicant_data.contact_email}`)

    // Ejemplo con fetch a servicio de email:
    /*
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: payload.applicant_data.contact_email }],
          subject: `¡Tu postulación ha sido aprobada! - ${payload.property_data.address}`
        }],
        from: { email: 'noreply@propiedadesapp.com' },
        content: [{
          type: 'text/html',
          value: generateApprovalEmailHTML(payload)
        }]
      })
    })
    */

  } catch (error) {
    console.error('Error sending email:', error)
  }
}

// Función para crear tarea de gestión
async function createManagementTask(payload: ApprovalWebhookPayload) {
  try {
    console.log(`📋 Creating management task for application ${payload.application_id}`)

    // Aquí integrarías con tu sistema de gestión (Trello, Asana, etc.)
    // Ejemplo: crear tarjeta en Trello para seguimiento del contrato

  } catch (error) {
    console.error('Error creating management task:', error)
  }
}

// Función para notificar sistemas externos
async function notifyExternalSystems(payload: ApprovalWebhookPayload) {
  try {
    console.log(`🔔 Notifying external systems for application ${payload.application_id}`)

    // Aquí notificarías a sistemas como:
    // - CRM
    // - Sistema contable
    // - Plataforma de documentos
    // - etc.

  } catch (error) {
    console.error('Error notifying external systems:', error)
  }
}

// Función para generar documentos
async function generateContractDocuments(payload: ApprovalWebhookPayload) {
  try {
    console.log(`📄 Generating contract documents for application ${payload.application_id}`)

    // Aquí integrarías con servicios de generación de documentos
    // - DocuSign
    // - PandaDoc
    // - Generación de PDF personalizado

  } catch (error) {
    console.error('Error generating documents:', error)
  }
}

// Función auxiliar para generar HTML del email
function generateApprovalEmailHTML(payload: ApprovalWebhookPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">¡Felicitaciones! Tu postulación ha sido aprobada</h2>

      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Detalles de la Propiedad:</h3>
        <p><strong>Dirección:</strong> ${payload.property_data.address}</p>
        <p><strong>Ciudad:</strong> ${payload.property_data.city}</p>
        <p><strong>Precio:</strong> $${payload.property_data.price.toLocaleString('es-CL')}</p>
      </div>

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Información del Proceso:</h3>
        <p><strong>ID de Postulación:</strong> ${payload.application_id}</p>
        <p><strong>Postulación creada por:</strong> ${payload.created_by}</p>
        <p><strong>Aprobada por:</strong> ${payload.approved_by}</p>
      </div>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Próximos Pasos:</h3>
        <ol>
          <li>Te contactaremos en las próximas 24 horas para coordinar la firma del contrato</li>
          <li>Prepara la documentación requerida</li>
          <li>Coordinaremos la entrega de llaves</li>
        </ol>
      </div>

      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

      <p style="color: #6b7280; font-size: 12px;">
        Este email fue generado automáticamente el ${new Date(payload.timestamp).toLocaleString('es-CL')}
      </p>
    </div>
  `
}
```

## 🔧 Configuración Adicional (Opcional)

### Variables de Entorno
En el dashboard de Supabase, puedes configurar:
- `WEBHOOK_SECRET`: Para validar las solicitudes
- `SENDGRID_API_KEY`: Para envío de emails

### Probar la Función
Después de desplegar, puedes probar desde la pestaña "Test" en el dashboard con un payload como:

```json
{
  "application_id": "test-id",
  "created_by": "test-created-by",
  "approved_by": "test-approved-by",
  "property_id": "test-property",
  "applicant_id": "test-applicant",
  "applicant_data": {
    "full_name": "Juan Pérez",
    "contact_email": "juan@example.com"
  },
  "property_data": {
    "address": "Test Address",
    "city": "Test City",
    "price": 100000,
    "listing_type": "rental"
  },
  "timestamp": "2025-10-03T10:00:00.000Z",
  "action": "application_approved"
}
```

¡Una vez desplegada, el webhook funcionará perfectamente! 🎉
