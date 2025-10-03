# 🔗 Integración N8N + Supabase para Contratos (V2)

## 📋 Descripción

Este documento explica cómo configurar N8N para que **cree contratos HTML completos** en la tabla `workflow_outputs` de Supabase. La plataforma envía datos a N8N via webhook, y N8N inserta la fila completa.

## 🎯 Flujo Simplificado

```
Usuario hace clic "Generar con N8N"
    ↓
Plataforma envía datos del contrato a N8N via webhook
    ↓
N8N genera HTML + sube a Storage + inserta fila completa
    ↓
Usuario ve contrato completo en plataforma
```

## 🔧 Configuración en N8N

### 1. Instalar y Configurar Nodo de Supabase

1. **Instalar N8N** (si no lo tienes)
2. **Instalar credenciales de Supabase** en N8N:

```json
{
  "supabase": {
    "url": "https://tu-project.supabase.co",
    "serviceRoleKey": "tu-service-role-key"
  }
}
```

### 2. Obtener las Credenciales de Supabase

Necesitas estas variables de entorno de tu proyecto Supabase:

- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (clave administrativa)

### 3. Configurar Workflow de Recepción

El workflow de N8N debe estar activo para recibir webhooks de la plataforma.

## 📊 Estructura de Datos

### Datos que la Plataforma Envía:

```json
{
  "action": "generate_contract",
  "timestamp": "2025-10-03T12:00:00.000Z",
  "data": {
    "contractId": "contrato-001",
    "userId": "uuid-del-usuario",
    "propertyId": "uuid-de-propiedad",
    "applicationId": "uuid-de-aplicacion",
    "tenantName": "Juan",
    "tenantLastName": "Pérez",
    "propertyAddress": "Calle Falsa 123",
    "propertyCommune": "Santiago",
    "propertyRegion": "Metropolitana"
  }
}
```

### Campos que N8N Inserta:

N8N inserta TODOS estos campos cuando crea el contrato completo:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `user_id` | uuid | ID del usuario | `"123e4567-e89b-12d3-a456-426614174000"` |
| `workflow_type` | text | Tipo de contrato | `"contrato_arriendo_n8n"` |
| `output_storage_path` | text | Ruta del archivo HTML | `"n8n-contracts/contrato-001-1703123456789.html"` |
| `file_size_bytes` | bigint | Tamaño en bytes | `5248` |
| `metadata` | jsonb | Todos los metadatos | `{"source": "n8n_complete", "status": "completed"}` |

## 🚀 Workflow N8N Completo

### Configuración del Workflow:

#### **Nodo 1: Webhook**
- **Tipo**: Webhook
- **HTTP Method**: POST
- **Path**: `/generate-contract`
- **Authentication**: Header `X-Webhook-Secret`
- **Response Mode**: On Received (para respuesta inmediata)

#### **Nodo 2: Function (Procesar Datos)**
```javascript
// Extraer datos del webhook
const webhookData = $node["Webhook"].json;

if (!webhookData.data || !webhookData.data.contractId) {
  throw new Error('Datos del contrato inválidos');
}

const contractData = webhookData.data;
console.log('📝 Procesando contrato:', contractData.contractId);

// Generar HTML del contrato
const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Arriendo - ${contractData.tenantName || 'Arrendatario'}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .contract-title {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .section {
            margin-bottom: 25px;
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }
        .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            text-align: center;
            padding-top: 20px;
            margin-top: 20px;
            display: inline-block;
            margin-right: 50px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="contract-title">CONTRATO DE ARRIENDO</h1>
        <p><strong>ID del Contrato:</strong> ${contractData.contractId}</p>
        <p><strong>Generado por:</strong> N8N Workflow</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
    </div>

    <div class="section">
        <h2 class="section-title">📋 Información de las Partes</h2>
        <p><strong>Arrendador:</strong> Propietario de la Propiedad</p>
        <p><strong>Arrendatario:</strong> ${contractData.tenantName || 'N/A'} ${contractData.tenantLastName || ''}</p>
        <p><strong>ID del Arrendatario:</strong> ${contractData.applicationId || 'N/A'}</p>
    </div>

    <div class="section">
        <h2 class="section-title">🏠 Información de la Propiedad</h2>
        <p><strong>Dirección:</strong> ${contractData.propertyAddress || 'Dirección no especificada'}</p>
        <p><strong>Comuna:</strong> ${contractData.propertyCommune || 'N/A'}</p>
        <p><strong>Región:</strong> ${contractData.propertyRegion || 'N/A'}</p>
        <p><strong>ID de Propiedad:</strong> ${contractData.propertyId || 'N/A'}</p>
    </div>

    <div class="section">
        <h2 class="section-title">💰 Términos del Contrato</h2>
        <p><strong>Plazo:</strong> 12 meses</p>
        <p><strong>Fecha de Inicio:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        <p><strong>Renta Mensual:</strong> $450.000 CLP</p>
        <p><strong>Garantía:</strong> 1 mes de renta</p>
    </div>

    <div class="section">
        <h2 class="section-title">📜 Obligaciones</h2>
        <ul>
            <li>El arrendatario pagará puntualmente la renta mensual</li>
            <li>El arrendador mantendrá la propiedad en buen estado</li>
            <li>Ambas partes cumplirán con las normativas vigentes</li>
            <li>El contrato se rige por las leyes chilenas</li>
        </ul>
    </div>

    <div class="section">
        <h2 class="section-title">✍️ Firmas</h2>
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div class="signature-box">
                <p><strong>Arrendador</strong></p>
                <p>Propietario Test S.A.</p>
                <p>RUT: 12.345.678-9</p>
            </div>
            <div class="signature-box">
                <p><strong>Arrendatario</strong></p>
                <p>${contractData.tenantName || 'Nombre'} ${contractData.tenantLastName || 'Apellido'}</p>
                <p>RUT: 9.876.543-2</p>
            </div>
        </div>
    </div>

    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
        <p>Este contrato fue generado automáticamente por N8N Workflow</p>
        <p>Fecha de generación: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;

return {
    html: html,
    contractData: contractData,
    fileName: `n8n-contracts/${contractData.contractId}-${Date.now()}.html`
};
```

#### **Nodo 3: Supabase Upload**
```javascript
// Configuración del nodo Supabase Upload:
// - Bucket: workflow-outputs
// - File Name: {{ $node["Function"].json.fileName }}
// - File Content: {{ $node["Function"].json.html }}
// - Content Type: text/html
```

#### **Nodo 4: Supabase Insert**
```javascript
// Configuración del nodo Supabase Insert:
// - Table: workflow_outputs
// - Data:
{
  "user_id": "{{ $node[\"Function\"].json.contractData.userId }}",
  "property_id": "{{ $node[\"Function\"].json.contractData.propertyId }}",
  "workflow_type": "contrato_arriendo_n8n",
  "output_storage_path": "{{ $node[\"Supabase Upload\"].json.path }}",
  "file_size_bytes": "{{ $node[\"Function\"].json.html.length }}",
  "metadata": {
    "contract_id": "{{ $node[\"Function\"].json.contractData.contractId }}",
    "application_id": "{{ $node[\"Function\"].json.contractData.applicationId }}",
    "source": "n8n_complete",
    "generated_at": "{{ new Date().toISOString() }}",
    "tenant_name": "{{ $node[\"Function\"].json.contractData.tenantName }}",
    "tenant_lastname": "{{ $node[\"Function\"].json.contractData.tenantLastName }}",
    "property_address": "{{ $node[\"Function\"].json.contractData.propertyAddress }}",
    "property_commune": "{{ $node[\"Function\"].json.contractData.propertyCommune }}",
    "property_region": "{{ $node[\"Function\"].json.contractData.propertyRegion }}",
    "status": "completed"
  }
}
```

## 🔑 Credenciales Necesarias en N8N

En la configuración de N8N, crea una credencial de tipo "Supabase":

```json
{
  "name": "Supabase API",
  "url": "https://tu-project.supabase.co",
  "serviceRoleKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📊 Verificación

### Comprobar que el contrato se creó:

```sql
SELECT
    id,
    workflow_type,
    output_storage_path,
    file_size_bytes,
    metadata,
    created_at
FROM workflow_outputs
WHERE metadata->>'source' = 'n8n_complete'
ORDER BY created_at DESC
LIMIT 5;
```

### Ver contratos en la plataforma:

1. Ve a **"Contratos N8N"** en la navegación
2. Filtra por "Solo N8N Complete"
3. Los contratos aparecerán con ícono ⚡

## 🎯 Variables de Configuración

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_N8N_CONTRACT_WEBHOOK_URL` | URL del webhook de N8N | `https://tu-n8n.com/webhook/generate-contract` |
| `VITE_WEBHOOK_SECRET` | Secreto para autenticación | `tu-webhook-secret` |

## 🐛 Solución de Problemas

### Error: "Webhook no encontrado"
- Verifica que el workflow de N8N esté activo
- Confirma la URL del webhook en las variables de entorno

### Error: "Permission denied en Supabase"
- Verifica que uses el `serviceRoleKey` en las credenciales de N8N
- Confirma que el bucket `workflow-outputs` existe

### Error: "Foreign key violation"
- Verifica que el `user_id` existe en la tabla `profiles`
- Confirma que el `property_id` existe en la tabla `properties`

### Contrato no aparece en la plataforma:
- Espera unos segundos para que se actualice
- Verifica que el `user_id` sea correcto
- Revisa los logs de N8N para errores

## 🎉 ¡Flujo Final!

Con esta configuración:

1. **Usuario hace clic** → Plataforma envía datos a N8N
2. **N8N recibe** → Genera HTML + sube a Storage + inserta fila completa
3. **Usuario ve contrato** → Aparece automáticamente en "Contratos N8N"

¡El flujo está **completo y funcional**! 🚀
