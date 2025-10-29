# Refactorización del Sistema de Webhooks - Parámetros Planos

## 📋 Problema Identificado

El frontend estaba enviando el payload al webhook como un **único objeto JSON dentro de un solo parámetro**:

```
?data={"action":"application_received","property":{"id":"123",...},...}
```

Esto causaba incompatibilidad con el backend que esperaba **parámetros planos y cada ID/valor como un query param independiente**.

## ✅ Solución Implementada

Se ha refactorizado el archivo `src/lib/webhook.ts` para enviar cada valor como **key-value plano** en la query string.

### Cambios Principales

#### 1. Nuevo Método: `flattenPayload()`

Se creó un método privado que aplana el objeto complejo `WebhookPayload` en un objeto plano de clave-valor:

```typescript
private flattenPayload(payload: WebhookPayload): Record<string, string> {
  const flat: Record<string, string> = {};
  
  // Campos de nivel superior
  flat.action = payload.action;
  flat.status = payload.status;
  flat.timestamp = payload.timestamp;
  
  // Application data
  if (payload.application) {
    flat.application_id = payload.application.id;
    flat.application_property_id = payload.application.property_id;
    flat.application_applicant_id = payload.application.applicant_id;
    // ... más campos
  }
  
  // Property data
  if (payload.property) {
    flat.property_id = payload.property.id;
    flat.property_address = payload.property.address;
    flat.property_comuna = payload.property.comuna;
    // ... más campos
  }
  
  // Applicant, Offerer, Property Owner, Metadata...
  // Todos se aplanan de manera similar
  
  return flat;
}
```

#### 2. Método `send()` Refactorizado

El método principal ahora utiliza `flattenPayload()` para convertir el payload antes de enviarlo:

```typescript
async send(payload: WebhookPayload): Promise<void> {
  // Convertir payload complejo a parámetros planos
  const flatPayload = this.flattenPayload(payload);
  
  // Crear query parameters con valores planos (NO como JSON string)
  const queryParams = new URLSearchParams();
  Object.entries(flatPayload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const urlWithParams = `${this.baseURL}?${queryParams.toString()}`;
  
  const response = await fetch(urlWithParams, {
    method: 'GET',
    headers: { /* ... */ }
  });
}
```

## 📊 Formato de URL Resultante

### Antes (❌ Incorrecto):
```
https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb?data=%7B%22action%22%3A%22application_received%22%2C%22property%22%3A%7B%22id%22%3A%22123%22%7D%7D
```

### Después (✅ Correcto):
```
https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb?action=application_received&status=pendiente&timestamp=2025-10-29T00:00:00Z&application_id=APP_xxx&property_id=PROP_xxx&property_address=Av+Principal+123&property_comuna=Santiago&applicant_id=USER_xxx&applicant_full_name=Juan+Perez&property_owner_id=OWNER_xxx
```

## 🔑 Parámetros Enviados

Los siguientes parámetros se envían ahora como query params individuales:

### Campos Principales
- `action`: `application_received` | `application_approved` | `application_rejected` | `offer_received` | etc.
- `status`: Estado del evento
- `timestamp`: Timestamp ISO del evento
- `decision` (opcional): `approved` | `rejected` | `accepted`

### Application Data
- `application_id`
- `application_property_id`
- `application_applicant_id`
- `application_status`
- `application_created_at`
- `application_message` (opcional)
- `application_profession`
- `application_monthly_income_clp`
- `application_age`
- `application_nationality`
- `application_marital_status`
- `application_address`

### Property Data
- `property_id`
- `property_address`
- `property_comuna`
- `property_region`
- `property_price_clp`
- `property_listing_type` (`venta` | `arriendo`)
- `property_bedrooms` (opcional)
- `property_bathrooms` (opcional)
- `property_surface_m2` (opcional)
- `property_photos_urls` (opcional, separado por comas)

### Applicant/Offerer Data
- `applicant_id` / `offerer_id`
- `applicant_full_name` / `offerer_full_name`
- `applicant_contact_email` / `offerer_contact_email`
- `applicant_contact_phone` / `offerer_contact_phone` (opcional)
- `applicant_profession` (opcional)
- `applicant_monthly_income` (opcional)

### Property Owner Data
- `property_owner_id`
- `property_owner_full_name`
- `property_owner_contact_email`
- `property_owner_contact_phone` (opcional)

### Metadata
- `metadata_source`: `propiedades_app`
- `metadata_user_agent`: User agent del navegador
- `metadata_url`: URL de origen
- `metadata_environment`: `development` | `production`
- `metadata_ip_address` (opcional)

## 🔄 Métodos y Componentes Afectados

### Métodos de `WebhookClient` refactorizados:

1. **`send(payload)`** - Método principal (✅ refactorizado)
   - Ahora usa `flattenPayload()` internamente
   - Convierte objetos anidados a parámetros planos
   - Envía cada valor como query param individual

2. **`sendApplicationEvent()`** - Usa `send()` internamente (✅ beneficiado)
3. **`sendOfferEvent()`** - Usa `send()` internamente (✅ beneficiado)
4. **`sendSimpleApprovalEvent()`** - Ya estaba implementado correctamente (✅ OK)
5. **`testWebhook()`** - Ya estaba implementado correctamente (✅ OK)

### Componentes refactorizados:

1. **`src/lib/webhook.ts`** (✅ refactorizado)
   - Nuevo método `flattenPayload()` agregado
   - Método `send()` completamente refactorizado

2. **`src/components/dashboard/ApplicationsPage.tsx`** (✅ refactorizado)
   - Función `handleUndoDecision` ahora usa `webhookClient.send()` 
   - Eliminado código duplicado de envío de webhook
   - Ahora envía parámetros planos automáticamente

### Componentes que ya estaban correctos:

1. **`src/components/contracts/RentalContractConditionsForm.tsx`** (✅ OK)
   - Ya usa formato plano en el payload
   - Envía POST con valores individuales, no objetos anidados

2. **`src/lib/electronicSignature.ts`** (✅ OK - No modificado)
   - API externa (firma electrónica) que requiere formato específico

## 🧪 Compatibilidad

### Backend Requirements
El backend debe estar preparado para recibir parámetros planos en la query string:

```javascript
// Ejemplo en Node.js/Express
app.get('/webhook/:id', (req, res) => {
  const {
    action,
    status,
    timestamp,
    application_id,
    property_id,
    applicant_id,
    property_owner_id,
    // ... todos los demás parámetros planos
  } = req.query;
  
  // Procesar webhook...
});
```

### Frontend Integration
Los componentes que usan webhooks **NO necesitan cambios** ya que siguen usando la misma interfaz:

```typescript
// En ApplicationsPage.tsx, OfferModal.tsx, etc.
await webhookClient.sendApplicationEvent(
  'approved',
  application,
  property,
  applicant,
  propertyOwner
);

// O para flujos simplificados:
await webhookClient.sendSimpleApprovalEvent(
  applicationId,
  propertyId,
  applicantId,
  rentalOwnerCharacteristicId,
  guarantorId,
  contractConditionsId,
  contractCharacteristicId
);
```

## 📝 Notas Importantes

1. **Valores Null/Undefined**: Solo se envían parámetros con valores definidos
2. **Arrays**: Los arrays (como `photos_urls`) se convierten en strings separados por comas
3. **Números**: Todos los valores numéricos se convierten a strings
4. **Objetos Anidados**: Se aplanan con prefijos descriptivos (ej: `application_id`, `property_id`)
5. **Logs Mejorados**: Se incluye log del payload aplanado para debugging

## ✨ Beneficios

1. ✅ **Compatible con backends estándar** que esperan query params planos
2. ✅ **URLs más legibles** en logs y debugging
3. ✅ **Mejor performance** al evitar parsing de JSON
4. ✅ **Mayor compatibilidad** con herramientas de integración (n8n, Zapier, etc.)
5. ✅ **Retrocompatible** - no requiere cambios en componentes existentes

## 🚀 Testing

Para probar el webhook refactorizado:

```typescript
// En la consola del navegador o en un test
import { webhookClient } from './lib/webhook';

await webhookClient.testWebhook();
```

O usando la función standalone:

```typescript
import { sendWebhookGET } from './lib/webhook';

await sendWebhookGET({
  application_characteristic_id: 'APP_xxx',
  property_characteristic_id: 'PROP_xxx',
  applicant_characteristic_id: 'USER_xxx',
  rental_owner_characteristic_id: 'OWNER_xxx',
  action: 'application_approved',
  timestamp: new Date().toISOString()
});
```

## 📚 Referencias

- Archivo modificado: `src/lib/webhook.ts`
- Componentes que usan webhooks:
  - `src/components/dashboard/ApplicationsPage.tsx`
  - `src/components/panel/OfferModal.tsx`
  - `src/components/properties/RentalApplicationForm.tsx`
- URL del webhook: `https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb`

---

**Fecha de implementación**: 29 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Implementado y listo para producción

