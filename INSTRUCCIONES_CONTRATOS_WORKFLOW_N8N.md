# 🏠 Contratos Generados por Workflow N8N

## 📋 Descripción

Se ha implementado un sistema completo para visualizar contratos generados dinámicamente por workflows de N8N. Este sistema permite que tus automatizaciones en N8N generen contratos HTML personalizados y los muestren directamente en la plataforma inmobiliaria.

## 🎯 Funcionalidades Implementadas

### ✅ Componentes Creados
- **`WorkflowContractViewer`**: Componente principal para mostrar contratos desde N8N
- **`WorkflowContractViewerPage`**: Página dedicada para contratos workflow
- **Modificación de `WorkflowViewer`**: Soporte para respuestas HTML directas
- **Integración en `ContractManagementPage`**: Botón "Contrato N8N" en cada contrato

### ✅ Rutas Agregadas
- `/workflow-contract/:contractId`: Página para contratos generados por workflow

## 🚀 Cómo Usar

### 1. Configurar el Webhook en N8N

Tu workflow en N8N debe terminar con un nodo **"Respond to Webhook"** que devuelva HTML puro:

```json
{
  "response": {
    "headers": {
      "Content-Type": "text/html"
    },
    "body": "<!DOCTYPE html><html><body><h1>Contrato Generado</h1>...</body></html>"
  }
}
```

### 2. Configurar Variables de Entorno

Agrega esta variable en tu archivo `.env`:

```env
VITE_N8N_CONTRACT_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/tu-webhook-id
```

### 3. Acceder desde la Plataforma

1. Ve a **Contratos** en el menú lateral
2. Busca el contrato que deseas ver
3. Haz clic en el botón **"Contrato N8N"** (verde con ícono de documento)

## 📊 Flujo de Funcionamiento

```
Usuario hace clic "Contrato N8N"
    ↓
Frontend llama a /workflow-contract/:id?webhookUrl=...&workflowId=...
    ↓
WorkflowContractViewer carga y muestra el contrato
    ↓
Se conecta al webhook de N8N con datos del contrato
    ↓
N8N procesa y devuelve HTML personalizado
    ↓
HTML se renderiza en canvas usando HTMLCanvasViewer
```

## 🔧 Parámetros Enviados a N8N

Cuando se llama al webhook, se envían estos datos en el `requestBody`:

```json
{
  "workflowId": "contrato_arriendo",
  "contractId": "uuid-del-contrato",
  "propertyId": "uuid-de-la-propiedad",
  "applicationId": "uuid-de-la-aplicacion",
  "action": "generate_contract",
  "timestamp": "2025-10-03T...",
  "metadata": {
    "source": "plataforma_inmobiliaria",
    "userAgent": "Mozilla/5.0...",
    "url": "https://tu-app.com/workflow-contract/..."
  }
}
```

## 🎨 Características de la UI

### Estados del Componente
- **Cargando**: Spinner con mensaje "Generando Contrato desde Workflow"
- **Error**: Mensaje de error con botón de reintento
- **Éxito**: Visualización del contrato con opciones de descarga e impresión

### Acciones Disponibles
- **Regenerar**: Vuelve a llamar al webhook para obtener versión actualizada
- **Imprimir**: Abre diálogo de impresión del navegador
- **Descargar**: Descarga el HTML como archivo
- **Nueva Pestaña**: Abre el contrato en una nueva pestaña

## 🔍 Diferencias con Contratos Normales

| Característica | Contrato Normal | Contrato N8N |
|---|---|---|
| **Fuente de datos** | Base de datos interna | Workflow externo |
| **Generación** | Plantilla estática | Dinámica personalizable |
| **Actualización** | Manual | Automática por workflow |
| **Personalización** | Limitada | Ilimitada |

## 🐛 Solución de Problemas

### Error: "URL del Webhook Requerida"
- Verifica que hayas configurado `VITE_N8N_CONTRACT_WEBHOOK_URL` en tus variables de entorno

### Error: "La respuesta HTML está vacía"
- Revisa que tu workflow de N8N esté devolviendo HTML válido
- Verifica que el nodo "Respond to Webhook" tenga el Content-Type correcto

### Error de CORS
- Asegúrate de que tu instancia de N8N permita requests desde tu dominio
- Configura los headers CORS apropiados en N8N

### El contrato no se actualiza
- Haz clic en "Regenerar" para forzar una nueva llamada al webhook
- Verifica que N8N esté procesando correctamente los parámetros enviados

## 📝 Ejemplo de Workflow N8N

### Nodo 1: Webhook
- Método: POST
- Path: `/contract-generator`

### Nodo 2: Function (Procesar Datos)
```javascript
// Extraer datos del contrato
const contractData = $node["Webhook"].json.body;

// Generar HTML personalizado basado en los datos
const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .contract-title { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="contract-title">Contrato de Arriendo</h1>
        <p>ID del Contrato: ${contractData.contractId}</p>
        <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
    </div>

    <div class="content">
        <h2>Información del Inmueble</h2>
        <p>Propiedad ID: ${contractData.propertyId}</p>
        <p>Aplicación ID: ${contractData.applicationId}</p>

        <!-- Aquí puedes agregar lógica personalizada -->
        <p>Contenido dinámico generado por N8N</p>
    </div>
</body>
</html>
`;

return { html };
```

### Nodo 3: Respond to Webhook
```json
{
  "response": {
    "headers": {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    "body": "{{ $node[\"Function\"].json.html }}",
    "status": 200
  }
}
```

## 🎯 Casos de Uso Recomendados

1. **Contratos con datos externos**: Integrar información de APIs externas
2. **Personalización avanzada**: Lógica compleja de generación de contratos
3. **Integraciones múltiples**: Combinar datos de varios sistemas
4. **Reportes automáticos**: Generar contratos por eventos programados
5. **Versionado dinámico**: Contratos que cambian según condiciones

## 📞 Soporte

Si tienes problemas con la implementación:

1. Revisa los logs de N8N para errores en el workflow
2. Verifica la configuración de CORS
3. Confirma que las variables de entorno están correctas
4. Prueba el webhook directamente con herramientas como Postman

---

**¡Listo!** Ahora puedes generar contratos dinámicos y personalizados usando la potencia de N8N. 🎉
