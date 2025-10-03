# 🎯 Cómo Probar la Aprobación de Aplicaciones (Ahora Corregido)

## ✅ Problema Resuelto

El error **400 Bad Request** al crear contratos se ha corregido. El sistema ya no intenta acceder a campos inexistentes.

## 🚀 Pasos para Probar

### 1. Recargar el Frontend

Si el servidor de desarrollo está corriendo, recarga la página en el navegador:
- Presiona `Ctrl + Shift + R` (Windows/Linux)
- O `Cmd + Shift + R` (Mac)

Si no está corriendo:
```bash
npm run dev
```

### 2. Ir a Aplicaciones

```
http://localhost:5173/applications
```

### 3. Aprobar una Aplicación

1. Busca una aplicación con estado **"Pendiente"**
2. Click en el botón **"Aprobar"**
3. Observa la consola del navegador (F12)

### 4. Verificar en la Consola

Deberías ver mensajes como:

```
🏠 Creando contrato de arriendo para la aplicación aprobada...
✅ Contrato creado exitosamente: {...}
📋 Contract ID: abc-123-...
📋 Contract Number: CTR-20251003-000001
📋 Application ID: 69a4f2d5-...
📊 Status: draft
📊 Approved at: 2025-10-03T...
📊 Version: 1

💡 Ahora N8N debe actualizar este contrato con el HTML
💡 O visualizar en: /contract/abc-123-...
```

### 5. Verificar en Base de Datos

```bash
node ver_contratos.js
```

**Salida esperada**:
```
✅ Se encontraron 1 contrato(s)

CONTRATO 1
================================================================================
ID: abc-123-...
Número: CTR-20251003-000001
Estado: draft
Formato: html
Application ID: 69a4f2d5-...
Creado: 03-10-2025, ...

📄 contract_html:
   ❌ NULL o vacío  <-- ESTO ES NORMAL POR AHORA

💡 N8N debe actualizar este campo con el HTML
```

## 🔄 Flujo Actual

```
1. Usuario aprueba aplicación ✅
   ↓
2. Sistema crea contrato vacío en rental_contracts ✅
   - ID generado
   - contract_number generado (CTR-...)
   - contract_html = null (por ahora)
   - contract_format = 'html'
   ↓
3. Sistema envía webhook a N8N/Railway ✅
   (aunque puede fallar si no está desplegado)
   ↓
4. N8N recibe el webhook ⏳ PENDIENTE
   ↓
5. N8N genera HTML del contrato ⏳ PENDIENTE
   ↓
6. N8N actualiza rental_contracts ⏳ PENDIENTE
   UPDATE contract_html = '<html>...'
   ↓
7. Usuario visualiza en /contract/{id} ⏳ PENDIENTE
```

## ⚠️ Notas Importantes

### El Contrato Estará Vacío Por Ahora

Esto es **NORMAL**. El contrato se crea vacío (`contract_html = null`) y N8N debe llenarlo después.

### Visualizar el Contrato Vacío

Si intentas visualizar el contrato ahora:
```
http://localhost:5173/contract/[el-id-del-contrato]
```

Verás probablemente un mensaje como:
- "Contenido del contrato no disponible"
- O una pantalla en blanco

**Esto es normal hasta que N8N actualice el HTML**.

## 📝 Próximos Pasos

### Paso 1: Probar Aprobación ✅

Sigue los pasos de arriba para aprobar una aplicación.

### Paso 2: Configurar N8N para Actualizar

**En N8N, después de generar el HTML del contrato**:

```javascript
// Nodo: Supabase Update
{
  "operation": "Update",
  "table": "rental_contracts",
  "filters": {
    "id": "{{$json.contract_id}}"  // El ID que viene del webhook
  },
  "fields": {
    "contract_html": "{{$node['Generate HTML'].json.html}}",
    "status": "draft"  // Opcional
  }
}
```

### Paso 3: Probar Flujo Completo

1. Aprobar aplicación
2. N8N recibe webhook
3. N8N genera HTML
4. N8N actualiza rental_contracts
5. Verificar:
```bash
node ver_contratos.js
```
6. Visualizar en navegador:
```
http://localhost:5173/contract/[id]
```

## 🐛 Troubleshooting

### Error: "Failed to load resource"

Si ves errores de CORS o "Failed to load resource" relacionados con `approve-application`:
- **No es crítico**: El contrato se crea igual
- **Solución**: Desplegar la Edge Function (opcional)

### Contrato no aparece en la lista

1. Verificar en base de datos:
```bash
node ver_contratos.js
```

2. Si no aparece, revisar errores en la consola del navegador

### Contrato aparece pero sin HTML

**Esto es normal por ahora**. N8N debe actualizar el campo `contract_html`.

## ✅ Checklist

- [ ] Frontend recargado
- [ ] Aplicación aprobada sin error 400
- [ ] Contrato creado (verificado con `ver_contratos.js`)
- [ ] `contract_number` generado automáticamente
- [ ] `contract_format` = 'html'
- [ ] `contract_html` = null (por ahora es OK)
- [ ] N8N configurado para actualizar HTML (pendiente)

## 🎉 Éxito

Si puedes aprobar una aplicación y el contrato se crea (aunque vacío), **¡el problema está resuelto!**

El siguiente paso es configurar N8N para que llene el HTML del contrato.

