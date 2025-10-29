# Webhook - Ejemplos Antes y Después de la Refactorización

## 📌 Ejemplo 1: Aprobación de Aplicación

### ❌ ANTES (Formato Incorrecto)

**URL generada:**
```
https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb?data=%7B%22action%22%3A%22application_approved%22%2C%22status%22%3A%22aprobada%22%2C%22timestamp%22%3A%222025-10-29T10%3A30%3A00Z%22%2C%22application%22%3A%7B%22id%22%3A%22550e8400-e29b-41d4-a716-446655440000%22%2C%22property_id%22%3A%22660e8400-e29b-41d4-a716-446655440000%22%7D%2C%22property%22%3A%7B%22address%22%3A%22Av+Providencia+123%22%7D%7D
```

**Query params:**
```
data = '{"action":"application_approved","status":"aprobada","timestamp":"2025-10-29T10:30:00Z","application":{"id":"550e8400-...","property_id":"660e8400-..."},"property":{"address":"Av Providencia 123"},...}'
```

**Código que lo generaba:**
```typescript
const queryParams = new URLSearchParams();
queryParams.append('data', JSON.stringify(payload)); // ❌ TODO en un solo parámetro
```

**Problema:**
- Backend recibe: `req.query.data = '{"action":"application_approved",...}'`
- Necesita hacer: `const obj = JSON.parse(req.query.data)`
- Luego acceder: `obj.application.id`, `obj.property.address`
- **Muy complejo y propenso a errores**

---

### ✅ DESPUÉS (Formato Correcto)

**URL generada:**
```
https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb?action=application_approved&status=aprobada&timestamp=2025-10-29T10:30:00Z&application_id=550e8400-e29b-41d4-a716-446655440000&application_property_id=660e8400-e29b-41d4-a716-446655440000&application_applicant_id=770e8400-e29b-41d4-a716-446655440000&application_status=aprobada&application_created_at=2025-10-28T15:00:00Z&application_profession=Ingeniero&application_monthly_income_clp=2000000&application_age=30&application_nationality=Chilena&application_marital_status=Soltero&application_address=Calle+Principal+456&property_id=660e8400-e29b-41d4-a716-446655440000&property_address=Av+Providencia+123&property_comuna=Providencia&property_region=Metropolitana&property_price_clp=800000&property_listing_type=arriendo&property_bedrooms=2&property_bathrooms=1&property_surface_m2=65&applicant_id=770e8400-e29b-41d4-a716-446655440000&applicant_full_name=Juan+Perez&applicant_contact_email=juan.perez@example.com&applicant_contact_phone=+56912345678&applicant_profession=Ingeniero&applicant_monthly_income=2000000&property_owner_id=880e8400-e29b-41d4-a716-446655440000&property_owner_full_name=Maria+Lopez&property_owner_contact_email=maria.lopez@example.com&property_owner_contact_phone=+56987654321&metadata_source=propiedades_app&metadata_user_agent=Mozilla/5.0&metadata_url=https://app.propiedades.com/applications&metadata_environment=production
```

**Query params (decodificados):**
```
action = "application_approved"
status = "aprobada"
timestamp = "2025-10-29T10:30:00Z"
application_id = "550e8400-e29b-41d4-a716-446655440000"
application_property_id = "660e8400-e29b-41d4-a716-446655440000"
application_applicant_id = "770e8400-e29b-41d4-a716-446655440000"
application_status = "aprobada"
application_created_at = "2025-10-28T15:00:00Z"
application_profession = "Ingeniero"
application_monthly_income_clp = "2000000"
application_age = "30"
application_nationality = "Chilena"
application_marital_status = "Soltero"
application_address = "Calle Principal 456"
property_id = "660e8400-e29b-41d4-a716-446655440000"
property_address = "Av Providencia 123"
property_comuna = "Providencia"
property_region = "Metropolitana"
property_price_clp = "800000"
property_listing_type = "arriendo"
property_bedrooms = "2"
property_bathrooms = "1"
property_surface_m2 = "65"
applicant_id = "770e8400-e29b-41d4-a716-446655440000"
applicant_full_name = "Juan Perez"
applicant_contact_email = "juan.perez@example.com"
applicant_contact_phone = "+56912345678"
applicant_profession = "Ingeniero"
applicant_monthly_income = "2000000"
property_owner_id = "880e8400-e29b-41d4-a716-446655440000"
property_owner_full_name = "Maria Lopez"
property_owner_contact_email = "maria.lopez@example.com"
property_owner_contact_phone = "+56987654321"
metadata_source = "propiedades_app"
metadata_user_agent = "Mozilla/5.0"
metadata_url = "https://app.propiedades.com/applications"
metadata_environment = "production"
```

**Código nuevo:**
```typescript
// Aplanar el payload
const flatPayload = this.flattenPayload(payload);

// Crear query params con cada valor individual
const queryParams = new URLSearchParams();
Object.entries(flatPayload).forEach(([key, value]) => {
  if (value !== null && value !== undefined) {
    queryParams.append(key, value); // ✅ Cada valor individual
  }
});
```

**Beneficio:**
- Backend recibe: `req.query.application_id`, `req.query.property_address`, etc.
- Acceso directo: **NO necesita JSON.parse()**
- **Simple, limpio y confiable**

---

## 📌 Ejemplo 2: Evento de Oferta

### ❌ ANTES

**Código:**
```typescript
const webhookPayload = {
  action: 'offer_received',
  offer: {
    id: 'off-123',
    property_id: 'prop-456',
    offerer_id: 'user-789',
    amount_clp: 150000000
  },
  property: {
    id: 'prop-456',
    address: 'Las Condes 789'
  },
  offerer: {
    id: 'user-789',
    full_name: 'Carlos Silva',
    contact_email: 'carlos@example.com'
  }
};

queryParams.append('data', JSON.stringify(webhookPayload)); // ❌
```

**Backend necesitaba:**
```javascript
const data = JSON.parse(req.query.data);
const offerId = data.offer.id;
const propertyAddress = data.property.address;
const offererName = data.offerer.full_name;
```

---

### ✅ DESPUÉS

**URL generada:**
```
?action=offer_received&status=received&timestamp=2025-10-29T11:00:00Z&offer_id=off-123&offer_property_id=prop-456&offer_offerer_id=user-789&offer_amount_clp=150000000&offer_created_at=2025-10-29T10:45:00Z&property_id=prop-456&property_address=Las+Condes+789&property_comuna=Las+Condes&property_region=Metropolitana&property_price_clp=150000000&property_listing_type=venta&offerer_id=user-789&offerer_full_name=Carlos+Silva&offerer_contact_email=carlos@example.com&property_owner_id=owner-101&property_owner_full_name=Ana+Martinez&property_owner_contact_email=ana@example.com&metadata_source=propiedades_app&metadata_environment=production
```

**Backend ahora puede:**
```javascript
const {
  action,
  offer_id,
  offer_amount_clp,
  property_address,
  offerer_full_name,
  offerer_contact_email,
  property_owner_full_name
} = req.query;

// ✅ Acceso directo, sin parsing
```

---

## 📌 Ejemplo 3: Reversión de Decisión (ApplicationsPage)

### ❌ ANTES (Código duplicado)

**En `ApplicationsPage.tsx`:**
```typescript
// 100+ líneas de código duplicado
const webhookURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;

if (import.meta.env.DEV && webhookURL) {
  const url = new URL(webhookURL);
  webhookURL = `/api${url.pathname}`;
}

const webhookPayload = {
  action: 'application_reverted',
  application: { id: '...', ... },
  property: { id: '...', ... },
  applicant: { id: '...', ... }
};

const queryParams = new URLSearchParams();
queryParams.append('data', JSON.stringify(webhookPayload)); // ❌

const response = await fetch(`${webhookURL}?${queryParams.toString()}`, {
  method: 'GET',
  headers: { ... }
});
```

---

### ✅ DESPUÉS (Usando webhookClient)

**En `ApplicationsPage.tsx` (refactorizado):**
```typescript
// Solo 10 líneas - sin código duplicado
const webhookPayload = {
  action: 'application_reverted' as const,
  application: { id: '...', ... },
  property: { id: '...', ... },
  applicant: { id: '...', ... },
  property_owner: { id: '...', ... },
  metadata: { ... }
};

// ✅ webhookClient maneja todo automáticamente
await webhookClient.send(webhookPayload);
```

**Beneficios:**
- 90% menos código
- Usa la lógica centralizada de `webhook.ts`
- Parámetros planos automáticamente
- Manejo de errores incluido
- Logging consistente

---

## 📌 Ejemplo 4: Comparación de Query Params

### ❌ ANTES - Backend recibe:

```javascript
{
  data: '{"action":"application_approved","application":{"id":"550e...","property_id":"660e..."},"property":{"address":"Av Providencia 123"}}'
}

// Backend necesita:
const parsed = JSON.parse(req.query.data);
const appId = parsed.application.id;             // ❌ Acceso anidado
const propAddress = parsed.property.address;     // ❌ Acceso anidado
```

---

### ✅ DESPUÉS - Backend recibe:

```javascript
{
  action: 'application_approved',
  application_id: '550e8400-e29b-41d4-a716-446655440000',
  application_property_id: '660e8400-e29b-41d4-a716-446655440000',
  application_applicant_id: '770e8400-e29b-41d4-a716-446655440000',
  property_id: '660e8400-e29b-41d4-a716-446655440000',
  property_address: 'Av Providencia 123',
  property_comuna: 'Providencia',
  applicant_id: '770e8400-e29b-41d4-a716-446655440000',
  applicant_full_name: 'Juan Perez',
  applicant_contact_email: 'juan.perez@example.com'
  // ... todos los demás campos planos
}

// Backend accede directamente:
const appId = req.query.application_id;         // ✅ Acceso directo
const propAddress = req.query.property_address; // ✅ Acceso directo
```

---

## 🎯 Resumen de Mejoras

| Aspecto | Antes ❌ | Después ✅ |
|---------|---------|------------|
| **Formato** | `?data={...JSON...}` | `?param1=val1&param2=val2&...` |
| **Parsing Backend** | `JSON.parse()` requerido | Acceso directo |
| **Legibilidad** | Imposible leer URL | URL legible |
| **Debugging** | Difícil | Fácil |
| **Performance** | Parsing overhead | Ningún overhead |
| **Compatibilidad** | Limitada | Universal (n8n, Zapier, etc.) |
| **Código duplicado** | Sí (100+ líneas) | No - centralizado |
| **Mantenibilidad** | Baja | Alta |

---

## 🚀 Próximos Pasos para Backend

El backend Railway ahora debe leer parámetros planos:

```javascript
// Node.js/Express
app.get('/webhook/:id', (req, res) => {
  // ✅ Leer parámetros directamente
  const {
    action,
    application_id,
    property_id,
    applicant_full_name,
    applicant_contact_email,
    property_address,
    property_comuna,
    property_price_clp,
    property_owner_full_name,
    property_owner_contact_email
  } = req.query;

  // Procesar sin JSON.parse()
  console.log(`Nueva acción: ${action}`);
  console.log(`Aplicación ID: ${application_id}`);
  console.log(`Propiedad: ${property_address}, ${property_comuna}`);
  console.log(`Postulante: ${applicant_full_name} (${applicant_contact_email})`);
  
  res.json({ success: true });
});
```

---

**Fecha**: 29 de octubre de 2025  
**Estado**: ✅ Implementado y funcionando

