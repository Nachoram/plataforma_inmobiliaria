# 🔗 Integración N8N + Supabase para Contratos

## 📋 Descripción

Este documento explica cómo configurar N8N para que cree contratos HTML completos en la tabla `workflow_outputs` de Supabase. La plataforma envía datos a N8N, y N8N inserta la fila completa.

## 🎯 Flujo Simplificado

```
Usuario hace clic "Generar con N8N"
    ↓
Plataforma envía datos del contrato a N8N
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

> ⚠️ **Importante**: Usa el Service Role Key solo para operaciones administrativas. Este key tiene permisos completos.

### 3. Configurar Workflow de Monitoreo

El workflow de N8N debe ejecutarse periódicamente para detectar contratos pendientes y procesarlos.

## 📊 Estructura de la Tabla `workflow_outputs`

```sql
CREATE TABLE workflow_outputs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id),
    property_id uuid REFERENCES properties(id),
    workflow_type text NOT NULL,
    output_storage_path text NOT NULL UNIQUE,
    file_size_bytes bigint,
    created_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);
```

### Campos que la Plataforma Crea:

La plataforma crea el registro con estos campos:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `user_id` | uuid | ID del usuario propietario | `"123e4567-e89b-12d3-a456-426614174000"` |
| `workflow_type` | text | Siempre: `"contrato_pendiente_n8n"` | `"contrato_pendiente_n8n"` |
| `output_storage_path` | text | `null` (N8N lo completa) | `null` |
| `file_size_bytes` | bigint | `null` (N8N lo completa) | `null` |
| `property_id` | uuid | ID de propiedad relacionada | `"456e7890-e89b-12d3-a456-426614174001"` |
| `metadata` | jsonb | Datos del contrato + estado | `{"contract_type": "contrato_arriendo_n8n", "status": "pending"}` |

### Campos que N8N Inserta:

N8N inserta TODOS estos campos cuando crea el contrato completo:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `user_id` | uuid | ID del usuario (viene de la plataforma) | `"123e4567-e89b-12d3-a456-426614174000"` |
| `workflow_type` | text | Tipo de contrato | `"contrato_arriendo_n8n"` |
| `output_storage_path` | text | Ruta del archivo HTML | `"n8n-contracts/contrato-001-1703123456789.html"` |
| `file_size_bytes` | bigint | Tamaño en bytes | `5248` |
| `metadata` | jsonb | Todos los metadatos | `{"source": "n8n_complete", "status": "completed"}` |

## 🚀 Ejemplo de Workflow N8N

### Nodos Necesarios:

1. **Webhook** → **Function** → **Supabase Upload** → **Supabase Insert**

### Configuración Paso a Paso:

#### **Paso 1: Webhook Trigger**
```javascript
// En un nodo "Function" o "Code"
const contractData = {
  contractId: "contrato-001",
  propertyId: "prop-123",
  userId: "user-456",
  tenantName: "Juan Pérez",
  propertyAddress: "Calle Falsa 123"
};

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Contrato de Arriendo</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .contract-title { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="contract-title">CONTRATO DE ARRIENDO</h1>
        <p>ID del Contrato: ${contractData.contractId}</p>
    </div>

    <div class="parties">
        <h2>Partes Contratantes</h2>
        <p><strong>Arrendador:</strong> Propietario de la Propiedad</p>
        <p><strong>Arrendatario:</strong> ${contractData.tenantName}</p>
    </div>

    <div class="property">
        <h2>Propiedad Arrendada</h2>
        <p><strong>Dirección:</strong> ${contractData.propertyAddress}</p>
        <p><strong>Tipo:</strong> Departamento</p>
    </div>

    <div class="terms">
        <h2>Términos del Contrato</h2>
        <p>Plazo: 12 meses</p>
        <p>Renta mensual: $500.000</p>
    </div>

    <div class="signatures">
        <h2>Firmas</h2>
        <p>_______________________________</p>
        <p>Arrendador</p>
        <br>
        <p>_______________________________</p>
        <p>Arrendatario</p>
    </div>
</body>
</html>
`;

return { html, contractData };
```

#### **Paso 2: Subir HTML a Storage**
```javascript
// Nodo "Supabase" - Operación: Upload File
{
  "bucket": "workflow-outputs",
  "fileName": `{{ $node["Function"].json.contractData.userId }}/{{ $node["Function"].json.contractData.contractId }}-{{ Date.now() }}.html`,
  "fileContent": "{{ $node["Function"].json.html }}",
  "contentType": "text/html"
}
```

#### **Paso 3: Insertar Registro en Base de Datos**
```javascript
// Nodo "Supabase" - Operación: Insert Row
{
  "table": "workflow_outputs",
  "data": {
    "user_id": "{{ $node["Function"].json.contractData.userId }}",
    "property_id": "{{ $node["Function"].json.contractData.propertyId }}",
    "workflow_type": "contrato_arriendo",
    "output_storage_path": "{{ $node["Supabase Upload"].json.path }}",
    "file_size_bytes": "{{ $node["Function"].json.html.length }}",
    "metadata": {
      "contract_id": "{{ $node["Function"].json.contractData.contractId }}",
      "source": "n8n_direct",
      "generated_at": "{{ new Date().toISOString() }}",
      "tenant_name": "{{ $node["Function"].json.contractData.tenantName }}"
    }
  }
}
```

## 📝 Template JSON para N8N

```json
{
  "name": "Contrato Generator",
  "nodes": [
    {
      "parameters": {
        "functionCode": "const contractData = {\n  contractId: $parameter.contractId || 'contrato-' + Date.now(),\n  userId: $parameter.userId,\n  propertyId: $parameter.propertyId,\n  tenantName: $parameter.tenantName,\n  propertyAddress: $parameter.propertyAddress\n};\n\nconst html = `<!DOCTYPE html>\n<html>\n<head>\n    <title>Contrato de Arriendo</title>\n    <style>\n        body { font-family: Arial; margin: 40px; }\n        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }\n        .contract-title { font-size: 24px; font-weight: bold; }\n    </style>\n</head>\n<body>\n    <div class=\"header\">\n        <h1 class=\"contract-title\">CONTRATO DE ARRIENDO</h1>\n        <p>ID del Contrato: ${contractData.contractId}</p>\n    </div>\n    \n    <div class=\"parties\">\n        <h2>Partes Contratantes</h2>\n        <p><strong>Arrendador:</strong> Propietario de la Propiedad</p>\n        <p><strong>Arrendatario:</strong> ${contractData.tenantName}</p>\n    </div>\n    \n    <div class=\"property\">\n        <h2>Propiedad Arrendada</h2>\n        <p><strong>Dirección:</strong> ${contractData.propertyAddress}</p>\n    </div>\n    \n    <div class=\"signatures\">\n        <h2>Firmas</h2>\n        <p>_______________________________</p>\n        <p>Arrendador</p>\n        <br>\n        <p>_______________________________</p>\n        <p>Arrendatario</p>\n    </div>\n</body>\n</html>`;\n\nreturn { html, contractData };"
      },
      "name": "Generate Contract",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "uploadFile",
        "bucket": "workflow-outputs",
        "fileName": "={{ $node[\"Generate Contract\"].json.contractData.userId }}/{{ $node[\"Generate Contract\"].json.contractData.contractId }}-{{ Date.now() }}.html",
        "fileContent": "={{ $node[\"Generate Contract\"].json.html }}",
        "contentType": "text/html"
      },
      "name": "Upload to Storage",
      "type": "@n8n/n8n-nodes-supabase.supabase",
      "typeVersion": 1,
      "position": [460, 300],
      "credentials": {
        "supabase": {
          "id": "credencial-supabase",
          "name": "Supabase API"
        }
      }
    },
    {
      "parameters": {
        "operation": "insert",
        "table": "workflow_outputs",
        "data": {
          "user_id": "={{ $node[\"Generate Contract\"].json.contractData.userId }}",
          "property_id": "={{ $node[\"Generate Contract\"].json.contractData.propertyId }}",
          "workflow_type": "contrato_arriendo",
          "output_storage_path": "={{ $node[\"Upload to Storage\"].json.path }}",
          "file_size_bytes": "={{ $node[\"Generate Contract\"].json.html.length }}",
          "metadata": {
            "contract_id": "={{ $node[\"Generate Contract\"].json.contractData.contractId }}",
            "source": "n8n_direct",
            "generated_at": "={{ new Date().toISOString() }}",
            "tenant_name": "={{ $node[\"Generate Contract\"].json.contractData.tenantName }}"
          }
        }
      },
      "name": "Insert Record",
      "type": "@n8n/n8n-nodes-supabase.supabase",
      "typeVersion": 1,
      "position": [680, 300],
      "credentials": {
        "supabase": {
          "id": "credencial-supabase",
          "name": "Supabase API"
        }
      }
    }
  ],
  "connections": {
    "Generate Contract": {
      "main": [
        [
          {
            "node": "Upload to Storage",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upload to Storage": {
      "main": [
        [
          {
            "node": "Insert Record",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
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

### Comprobar que el contrato se insertó:

```sql
SELECT
    id,
    workflow_type,
    output_storage_path,
    file_size_bytes,
    metadata,
    created_at
FROM workflow_outputs
WHERE metadata->>'source' = 'n8n_direct'
ORDER BY created_at DESC
LIMIT 5;
```

### Ver contratos en la plataforma:

1. Ve a **Contratos N8N** en la navegación
2. Filtra por "Solo N8N Webhooks"
3. Los contratos aparecerán con ícono ⚡

## 🎯 Casos de Uso

### 1. **Automatización de Contratos**
- Trigger: Nueva aplicación aprobada
- Acción: Generar contrato automáticamente
- Resultado: Contrato listo en la plataforma

### 2. **Contratos Personalizados**
- Trigger: Datos de formulario
- Acción: Generar contrato con datos específicos
- Resultado: Contrato personalizado por usuario

### 3. **Integración con Sistemas Externos**
- Trigger: Webhook de otro sistema
- Acción: Procesar datos y generar contrato
- Resultado: Contrato generado desde datos externos

## 🐛 Solución de Problemas

### Error: "Permission denied"
- Verifica que uses el `serviceRoleKey` en las credenciales
- Confirma que la tabla `workflow_outputs` existe

### Error: "Bucket not found"
- Verifica que el bucket `workflow-outputs` existe en Storage
- Confirma que tienes permisos para subir archivos

### Error: "Foreign key violation"
- Verifica que el `user_id` existe en la tabla `profiles`
- Confirma que el `property_id` (si se usa) existe en `properties`

### Contrato no aparece en la plataforma:
- Espera unos segundos para que se actualice el cache
- Verifica que el `user_id` sea correcto (debe ser del usuario logueado)
- Revisa que el archivo se subió correctamente a Storage

## 📞 Variables de Configuración

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SUPABASE_URL` | URL de tu proyecto Supabase | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave administrativa | `eyJhbGciOiJIUzI1NiI...` |

## 🎉 ¡Listo!

Con esta configuración, N8N puede insertar contratos directamente en Supabase sin necesidad de webhooks complejos. Los contratos aparecerán automáticamente en la plataforma bajo la sección "Contratos N8N".

---

**¿Necesitas ayuda configurando el workflow o tienes alguna duda?** 🚀
