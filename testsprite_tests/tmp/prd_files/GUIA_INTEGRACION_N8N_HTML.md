# Guía de Integración N8N → Supabase (Contratos HTML)

## Resumen

La plataforma ahora soporta **contratos en formato HTML completo** generados por N8N. Los contratos se almacenan directamente en la tabla `rental_contracts` y se visualizan con un componente especializado.

## Arquitectura

```
N8N Workflow
    ↓ (genera HTML)
    ↓
Webhook: receive-contract-webhook
    ↓
    ├── Storage: workflow-outputs/  (respaldo)
    └── DB: rental_contracts         (visualización)
            ↓
        Frontend: HTMLContractViewer
```

## Cambios en Base de Datos

### Nueva Estructura de `rental_contracts`

```sql
-- Columnas nuevas
contract_html TEXT                  -- HTML completo del contrato
contract_format VARCHAR(20)         -- 'json' | 'html' | 'hybrid'
contract_number VARCHAR(50)         -- Número único generado automáticamente
contract_content JSONB NULL         -- Ahora permite NULL

-- Constraints
CHECK (contract_content IS NOT NULL OR contract_html IS NOT NULL)
CHECK (contract_format IN ('json', 'html', 'hybrid'))
```

### Migración

```bash
# Aplicar migración
psql -U postgres -d tu_base_datos -f supabase/migrations/20251003190000_add_contract_html_column.sql
```

## Formato del HTML desde N8N

N8N debe enviar un HTML completo y auto-contenido:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        /* Todos los estilos CSS integrados aquí */
        body { font-family: 'Times New Roman', Times, serif; ... }
        h1, h2, p { ... }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    <!-- Contenido del contrato -->
    <div class="signature-block">...</div>
</body>
</html>
```

### Requisitos del HTML

✅ **DEBE incluir**:
- DOCTYPE completo
- Tag `<html>`, `<head>`, `<body>`
- Estilos CSS en `<style>` dentro del `<head>`
- Contenido semántico (h1, h2, p, div, etc.)

❌ **NO debe tener**:
- Referencias externas (CSS, JS, imágenes deben ser inline o base64)
- Scripts JavaScript (por seguridad)
- Dependencias externas

## Configuración del Webhook en N8N

### Paso 1: Configurar nodo HTTP Request en N8N

```json
{
  "method": "POST",
  "url": "https://tu-proyecto.supabase.co/functions/v1/receive-contract-webhook",
  "authentication": "none",
  "headers": {
    "Content-Type": "application/json",
    "x-webhook-secret": "tu-secret-seguro"
  },
  "body": {
    "html": "{{$node['Generate HTML'].json.html}}",
    "applicationId": "{{$json.application_id}}",
    "userId": "{{$json.user_id}}",
    "propertyId": "{{$json.property_id}}",
    "workflowId": "contrato_arriendo",
    "metadata": {
      "tenant_name": "{{$json.tenant_name}}",
      "property_address": "{{$json.property_address}}",
      "generated_at": "{{$now}}"
    }
  }
}
```

### Paso 2: Variables de Entorno en Supabase

```bash
# En Supabase Dashboard → Settings → Edge Functions → Secrets
WEBHOOK_SECRET=tu-secret-muy-seguro-aqui
```

### Paso 3: Payload Mínimo Requerido

```json
{
  "html": "<!DOCTYPE html>...",           // REQUERIDO
  "userId": "uuid-del-usuario",           // REQUERIDO
  "applicationId": "uuid-de-aplicacion",  // Opcional (pero recomendado)
  "propertyId": "uuid-de-propiedad",      // Opcional
  "workflowId": "contrato_arriendo",      // Opcional (default: 'contrato_n8n')
  "metadata": {}                          // Opcional
}
```

## Flujo Completo en N8N

### Workflow Recomendado

```
1. Trigger (Webhook o Schedule)
   ↓
2. Get Application Data (Supabase: applications)
   ↓
3. Get Property Data (Supabase: properties)
   ↓
4. Get Parties Data (Supabase: profiles, guarantors)
   ↓
5. Generate HTML (Function/Code)
   ↓
6. Send to Webhook (HTTP Request)
   ↓
7. Update Application Status (opcional)
```

### Ejemplo de Nodo "Generate HTML"

```javascript
// En N8N Function node
const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        body { 
          font-family: 'Times New Roman', Times, serif; 
          margin: 50px; 
          font-size: 12pt; 
        }
        h1 { text-align: center; font-size: 14pt; }
        h2 { text-align: left; font-size: 12pt; text-decoration: underline; }
        p { text-align: justify; line-height: 1.6; margin-bottom: 1.2em; }
        .signature-block { margin-top: 60px; page-break-inside: avoid; }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    <p>En Santiago de Chile, a ${new Date().toLocaleDateString('es-CL')}, 
       entre <strong>${items[0].json.owner_name}</strong>, 
       RUT ${items[0].json.owner_rut}...</p>
    
    <h2>PRIMERO: PROPIEDAD ARRENDADA</h2>
    <p>${items[0].json.property_description}</p>
    
    <!-- Más secciones -->
    
    <div class="signature-block">
        <strong>${items[0].json.owner_name}</strong><br>
        RUT: ${items[0].json.owner_rut}
    </div>
</body>
</html>
`;

return { html };
```

## Visualización en el Frontend

### Componente: HTMLContractViewer

El nuevo componente `HTMLContractViewer` incluye:

- ✅ Visualización en iframe (aislamiento de seguridad)
- ✅ Zoom in/out (50% - 200%)
- ✅ Modo pantalla completa
- ✅ Imprimir
- ✅ Descargar HTML
- ✅ Diseño responsive

### Detección Automática de Formato

`ContractViewer.tsx` detecta automáticamente el formato:

```typescript
if (contract.contract_html && 
    (contract.contract_format === 'html' || contract.contract_format === 'hybrid')) {
  return <HTMLContractViewer htmlContent={contract.contract_html} />;
} else {
  return <JSONContractViewer contract={contract} />;
}
```

## Rutas de Visualización

```
/contract/:id              → Visualización completa del contrato
/applications              → Ver contratos desde aplicaciones
/contracts                 → Listado de contratos (si existe)
```

## Testing

### 1. Insertar Contrato de Prueba

```bash
node test_insert_html_contract.js
```

### 2. Verificar en Base de Datos

```sql
SELECT 
  id, 
  contract_number, 
  contract_format,
  LENGTH(contract_html) as html_length,
  status,
  created_at
FROM rental_contracts
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Probar en el Frontend

```
http://localhost:5173/contract/[contract-id]
```

## Seguridad

### Webhook

- ✅ Secret validation (`x-webhook-secret` header)
- ✅ CORS configurado
- ✅ Service role key para permisos admin

### HTML Rendering

- ✅ Iframe con `sandbox="allow-same-origin"` (sin scripts)
- ✅ Sin ejecución de JavaScript del contrato
- ✅ Aislamiento de estilos

### RLS Policies

Las políticas existentes en `rental_contracts` aplican:
- Propietarios pueden ver sus contratos
- Arrendatarios pueden ver sus contratos
- Avales pueden ver contratos donde son garantes

## Troubleshooting

### Error: "contract_content cannot be null"

**Solución**: Aplicar la migración `20251003190000_add_contract_html_column.sql`

### El HTML no se muestra correctamente

**Verificar**:
1. HTML es completo (DOCTYPE, head, body)
2. Estilos están en `<style>` tag
3. No hay referencias externas
4. `contract_format` está en 'html' o 'hybrid'

### Webhook retorna 401

**Verificar**:
1. Header `x-webhook-secret` coincide con variable de entorno
2. Variable `WEBHOOK_SECRET` configurada en Supabase

### No se crea el rental_contract

**Verificar**:
1. `applicationId` está en el payload
2. Application existe en la BD
3. Usuario tiene permisos (usar Service Role Key)

## Próximos Pasos

1. ✅ Migración aplicada
2. ✅ Componente HTMLContractViewer creado
3. ✅ Webhook actualizado
4. ⏳ Probar flujo completo con N8N
5. ⏳ Implementar editor de contratos HTML (opcional)
6. ⏳ Agregar validación de HTML (sanitization)

## Soporte

Para problemas o dudas:
1. Revisar logs del Edge Function en Supabase Dashboard
2. Verificar payload enviado desde N8N
3. Consultar tabla `workflow_outputs` para debugging

