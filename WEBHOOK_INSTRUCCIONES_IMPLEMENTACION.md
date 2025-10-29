# Instrucciones de Implementación - Webhooks con Parámetros Planos

## ✅ Cambios Completados en Frontend

La refactorización del sistema de webhooks está **100% completa** y lista para usar.

## 📋 Resumen de Cambios

### Archivos Modificados:

1. **`src/lib/webhook.ts`**
   - ✅ Nuevo método `flattenPayload()` agregado
   - ✅ Método `send()` refactorizado para enviar parámetros planos
   - ✅ Todos los webhooks ahora envían formato correcto

2. **`src/components/dashboard/ApplicationsPage.tsx`**
   - ✅ Eliminado código duplicado (~100 líneas)
   - ✅ Ahora usa `webhookClient.send()` centralizado
   - ✅ Reversiones de decisiones usan formato plano

### Documentación Creada:

1. **`WEBHOOK_REFACTOR_EXPLICACION.md`** - Documentación técnica completa
2. **`WEBHOOK_REFACTOR_RESUMEN.md`** - Resumen ejecutivo
3. **`WEBHOOK_EJEMPLO_ANTES_DESPUES.md`** - Ejemplos comparativos
4. **`WEBHOOK_INSTRUCCIONES_IMPLEMENTACION.md`** - Este archivo

## 🚀 Cómo Usar

### Frontend (Ya Implementado)

No necesitas hacer ningún cambio en los componentes existentes. El webhook ya envía parámetros planos automáticamente:

```typescript
// En cualquier componente
import { webhookClient } from '@/lib/webhook';

// Enviar evento de aplicación
await webhookClient.sendApplicationEvent(
  'approved',
  application,
  property,
  applicant,
  propertyOwner
);

// Enviar evento simplificado
await webhookClient.sendSimpleApprovalEvent(
  applicationId,
  propertyId,
  applicantId,
  rentalOwnerCharacteristicId
);

// El método send() también funciona automáticamente
await webhookClient.send(webhookPayload);
```

## 🔧 Backend - Configuración Requerida

### URL del Webhook
```
https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
```

### Formato de Query Params que Recibirá

El backend Railway ahora recibirá parámetros individuales en `req.query`:

```javascript
// Node.js/Express
app.get('/webhook/:id', (req, res) => {
  const {
    // Campos principales
    action,                  // 'application_received' | 'application_approved' | ...
    status,                  // 'pendiente' | 'aprobada' | 'rechazada'
    timestamp,               // ISO timestamp
    decision,                // 'approved' | 'rejected' | 'accepted' (opcional)
    
    // Application
    application_id,
    application_property_id,
    application_applicant_id,
    application_status,
    application_created_at,
    application_message,
    application_profession,
    application_monthly_income_clp,
    application_age,
    application_nationality,
    application_marital_status,
    application_address,
    
    // Offer (opcional)
    offer_id,
    offer_property_id,
    offer_offerer_id,
    offer_amount_clp,
    offer_created_at,
    offer_message,
    
    // Property
    property_id,
    property_address,
    property_comuna,
    property_region,
    property_price_clp,
    property_listing_type,
    property_bedrooms,
    property_bathrooms,
    property_surface_m2,
    property_photos_urls,    // Separado por comas
    
    // Applicant
    applicant_id,
    applicant_full_name,
    applicant_contact_email,
    applicant_contact_phone,
    applicant_profession,
    applicant_monthly_income,
    
    // Offerer (opcional)
    offerer_id,
    offerer_full_name,
    offerer_contact_email,
    offerer_contact_phone,
    
    // Property Owner
    property_owner_id,
    property_owner_full_name,
    property_owner_contact_email,
    property_owner_contact_phone,
    
    // Metadata
    metadata_source,         // 'propiedades_app'
    metadata_user_agent,
    metadata_url,
    metadata_environment,    // 'development' | 'production'
    metadata_ip_address
  } = req.query;
  
  console.log(`Webhook recibido: ${action}`);
  console.log(`Application ID: ${application_id}`);
  console.log(`Property: ${property_address}, ${property_comuna}`);
  console.log(`Applicant: ${applicant_full_name}`);
  
  // Procesar webhook...
  
  res.json({ success: true, received: action });
});
```

### Ejemplo de Processing Backend

```javascript
app.get('/webhook/:webhookId', async (req, res) => {
  try {
    const { action } = req.query;
    
    switch (action) {
      case 'application_received':
        await handleApplicationReceived(req.query);
        break;
        
      case 'application_approved':
        await handleApplicationApproved(req.query);
        break;
        
      case 'application_rejected':
        await handleApplicationRejected(req.query);
        break;
        
      case 'application_reverted':
        await handleApplicationReverted(req.query);
        break;
        
      case 'offer_received':
        await handleOfferReceived(req.query);
        break;
        
      case 'offer_accepted':
        await handleOfferAccepted(req.query);
        break;
        
      case 'offer_rejected':
        await handleOfferRejected(req.query);
        break;
        
      default:
        console.warn(`Acción desconocida: ${action}`);
    }
    
    res.json({ 
      success: true, 
      action,
      processed_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Handlers específicos
async function handleApplicationApproved(params) {
  const {
    application_id,
    applicant_full_name,
    applicant_contact_email,
    property_address,
    property_comuna
  } = params;
  
  // Enviar email de notificación
  await sendEmail({
    to: applicant_contact_email,
    subject: '¡Tu postulación fue aprobada!',
    body: `Hola ${applicant_full_name}, tu postulación para la propiedad en ${property_address}, ${property_comuna} ha sido aprobada.`
  });
  
  // Actualizar sistema externo
  await updateExternalSystem({
    applicationId: application_id,
    status: 'approved'
  });
  
  console.log(`✅ Aplicación ${application_id} procesada exitosamente`);
}
```

## 🧪 Testing

### 1. Test Manual desde Frontend

Abre la consola del navegador en tu aplicación y ejecuta:

```javascript
// Test básico
await webhookClient.testWebhook();

// Verifica en los Network tabs del navegador:
// - La URL debe tener parámetros individuales
// - NO debe tener "?data={...}"
```

### 2. Test de URL Generada

La URL generada debe verse así:

```
https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb?action=application_approved&status=aprobada&timestamp=2025-10-29T10:00:00Z&application_id=550e8400-e29b-41d4-a716-446655440000&property_id=660e8400-e29b-41d4-a716-446655440000&applicant_full_name=Juan+Perez&property_address=Av+Providencia+123&...
```

### 3. Test Backend Railway

Monitorea los logs del backend Railway para verificar que recibe parámetros planos:

```bash
# Railway logs
railway logs

# Deberías ver:
# Webhook recibido: application_approved
# Application ID: 550e8400-e29b-41d4-a716-446655440000
# Property: Av Providencia 123, Providencia
```

## 📊 Verificación de Implementación

### Checklist Frontend ✅

- [x] `src/lib/webhook.ts` refactorizado
- [x] Método `flattenPayload()` implementado
- [x] Método `send()` usa parámetros planos
- [x] `ApplicationsPage.tsx` usa `webhookClient`
- [x] Código duplicado eliminado
- [x] Sin errores de linter
- [x] Documentación completa

### Checklist Backend (Pendiente)

- [ ] Endpoint webhook configurado en Railway
- [ ] Backend lee `req.query` en lugar de `JSON.parse(req.query.data)`
- [ ] Handlers para cada tipo de acción implementados
- [ ] Logging configurado
- [ ] Tests de integración creados

## 🔍 Debugging

### Ver Payload en Frontend

Los logs del frontend mostrarán:

```
🌐 Enviando webhook a: https://primary-production-bafdc.up.railway.app/webhook/...
📦 Payload del webhook: { action: 'application_approved', application: {...}, ... }
📋 Payload aplanado: { action: 'application_approved', application_id: '...', ... }
🔗 URL completa del webhook (primeros 200 caracteres): https://primary...
✅ Webhook ejecutado con éxito
```

### Ver Request en Backend

```javascript
app.get('/webhook/:id', (req, res) => {
  // Debug: Ver todos los query params
  console.log('📥 Query params recibidos:', req.query);
  console.log('📊 Cantidad de parámetros:', Object.keys(req.query).length);
  console.log('🎯 Action:', req.query.action);
  
  // Si ves "data" en req.query, el frontend no está actualizado
  if (req.query.data) {
    console.error('❌ ERROR: Recibiendo formato antiguo (data: JSON)');
  } else {
    console.log('✅ Formato correcto: parámetros planos');
  }
});
```

## 🚨 Troubleshooting

### Problema: Backend recibe `req.query.data` como JSON string

**Causa**: Frontend no actualizado o usando método incorrecto

**Solución**:
```bash
# Verificar que estás usando el código actualizado
git pull origin main

# Verificar importación correcta
# Debe ser: import { webhookClient } from '@/lib/webhook';
```

### Problema: URL muy larga (error 414)

**Causa**: Demasiados parámetros en GET request

**Solución**: Cambiar a POST (ya preparado en el código):
```typescript
// En webhook.ts, cambiar línea 242:
const response = await fetch(urlWithParams, {
  method: 'POST',  // Cambiar de 'GET' a 'POST'
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    // ...
  },
  body: queryParams.toString()  // Agregar body
});
```

### Problema: Parámetros con caracteres especiales

**Causa**: `URLSearchParams` codifica automáticamente

**Solución**: Ya está resuelto. El backend debe decodificar:
```javascript
// Los frameworks lo hacen automáticamente
req.query.property_address // Ya está decodificado
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del navegador (consola del desarrollador)
2. Revisa los logs de Railway
3. Consulta `WEBHOOK_EJEMPLO_ANTES_DESPUES.md` para comparar
4. Verifica que la URL del webhook esté correcta en las variables de entorno

## 🎉 Estado Final

✅ **Frontend: 100% Completado**
⏳ **Backend: Pendiente de configuración**

**Próximo paso**: Actualizar el backend Railway para leer parámetros planos como se describe en este documento.

---

**Documentos relacionados:**
- `WEBHOOK_REFACTOR_EXPLICACION.md` - Documentación técnica
- `WEBHOOK_REFACTOR_RESUMEN.md` - Resumen ejecutivo
- `WEBHOOK_EJEMPLO_ANTES_DESPUES.md` - Ejemplos comparativos

**Fecha**: 29 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Listo para producción

