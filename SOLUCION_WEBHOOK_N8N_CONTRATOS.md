# Solución: Error de Webhook N8N para Generación de Contratos

## 🚨 Error Encontrado

```
❌ URL del webhook de contratos (N8N) no configurada
```

## 📋 Causa

Falta la variable de entorno `VITE_N8N_CONTRACT_WEBHOOK_URL` que es necesaria para enviar los datos del contrato al servicio de generación de PDFs.

## ✅ Solución Rápida

### 🚀 Opción 1: Ejecutar script automático (Más rápido)

**Para Windows:**
```bash
# Ejecuta este archivo desde la raíz del proyecto
create-env.bat
```

**Para Linux/Mac:**
```bash
# Ejecuta este archivo desde la raíz del proyecto
chmod +x create-env.sh
./create-env.sh
```

### 📝 Opción 2: Crear archivo .env manualmente

1. **Crea un archivo `.env` en la raíz del proyecto** con este contenido:

```env
# ======================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO
# ======================================
# Archivo generado para resolver el problema del webhook de contratos
# Fecha: 29 de octubre de 2025

# ======================================
# SUPABASE CONFIGURATION
# ======================================
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w

# ======================================
# WEBHOOK CONFIGURATION
# ======================================

# Railway Webhook - Notificaciones de aplicaciones, ofertas, etc.
# Este webhook ya envía parámetros planos (refactorizado)
VITE_RAILWAY_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb

# N8N Contract Webhook - Generación de contratos PDF
# ✅ CONFIGURADO: Usando el mismo webhook de Railway para contratos
VITE_N8N_CONTRACT_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb

# Webhook Secret - Opcional, para autenticación adicional
# VITE_WEBHOOK_SECRET=tu-secret-aqui

# ======================================
# NOTAS
# ======================================
# - El webhook de contratos ahora apunta al mismo endpoint de Railway
# - Reinicia el servidor de desarrollo después de crear este archivo
# - Para desarrollo: npm run dev
# ======================================
```

2. **Reinicia el servidor de desarrollo**:

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
npm run dev
```

### Opción 2: Usar la URL de Railway

Si tu workflow de generación de contratos está en Railway, usa:

```env
VITE_N8N_CONTRACT_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/generate-contract
```

### Opción 3: Configurar tu propia instancia de n8n

Si tienes tu propia instancia de n8n:

```env
VITE_N8N_CONTRACT_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/tu-webhook-id
```

## 🔍 Verificación

Después de configurar, verifica en la consola del navegador:

```javascript
console.log('Contract Webhook:', import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL);
console.log('Railway Webhook:', import.meta.env.VITE_RAILWAY_WEBHOOK_URL);
```

Deberías ver la misma URL para ambos:
```
Contract Webhook: https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
Railway Webhook: https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
```

**No** deberías ver `undefined`.

## 📊 Configuración de Webhooks

El sistema ahora usa **el mismo webhook de Railway** para todo:

### 1. Railway Webhook (✅ Unificado)
- **Variable**: `VITE_RAILWAY_WEBHOOK_URL`
- **Propósito**: Notificaciones de aplicaciones, ofertas, reversiones
- **Formato**: Parámetros planos (GET request, refactorizado)
- **URL**: `https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb`

### 2. N8N Contract Webhook (✅ Ahora configurado)
- **Variable**: `VITE_N8N_CONTRACT_WEBHOOK_URL`
- **Propósito**: Generación automática de contratos PDF
- **Formato**: POST con JSON plano
- **URL**: `https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb` *(Misma que arriba)*

**✅ Solución**: Ambos apuntan al mismo endpoint de Railway, que debe estar configurado para manejar tanto notificaciones como contratos.

## 🧪 Probar la Configuración

Una vez configurado, intenta generar un contrato nuevamente desde el formulario de condiciones de contrato. Deberías ver en los logs:

```
✅ Condiciones actualizadas exitosamente
🎯 Characteristic ID del contrato obtenido: CONTRACT_COND_xxx
📝 Creando registro del contrato...
✅ Registro del contrato creado/actualizado: xxx
📤 Enviando al webhook de n8n...
✅ Respuesta del webhook exitosa
```

En lugar de:

```
❌ URL del webhook de contratos (N8N) no configurada
```

## 🔧 Estructura del Payload Enviado

El webhook de contratos envía un payload con formato plano (valores individuales):

```typescript
{
  contract_id: "...",
  contract_number: "...",
  application_id: "...",
  property_id: "...",
  
  // Datos del postulante
  applicant_name: "...",
  applicant_rut: "...",
  applicant_email: "...",
  applicant_phone: "...",
  
  // Datos del garante
  guarantor_name: "...",
  guarantor_rut: "...",
  
  // Datos de la propiedad
  property_address: "...",
  property_commune: "...",
  property_type: "...",
  
  // Datos del propietario
  owner_name: "...",
  owner_rut: "...",
  owner_email: "...",
  
  // Condiciones del contrato
  contract_start_date: "...",
  contract_end_date: "...",
  monthly_rent: 0,
  warranty_amount: 0,
  
  // ... más campos
}
```

Este formato ya es correcto (valores planos, no objetos anidados).

## ⚙️ Configuración del Backend (n8n)

Si necesitas configurar el webhook en n8n, debe recibir un POST con estos campos:

```javascript
// En n8n Webhook node
HTTP Method: POST
Path: /webhook/generate-contract
Response Mode: On Response

// El payload llegará en req.body con todos los campos planos
```

## 🚨 Solución Temporal

Si no tienes el webhook de n8n configurado todavía, puedes:

1. **Comentar temporalmente la validación** (no recomendado para producción):
   - Ir a `src/components/contracts/RentalContractConditionsForm.tsx`
   - Línea 1215-1236
   - Comentar el bloque de validación

2. **O mejor**: Configurar el webhook correctamente usando esta guía

## 📚 Documentación Relacionada

- `WEBHOOK_REFACTOR_EXPLICACION.md` - Documentación del webhook de Railway (parámetros planos)
- `INSTRUCCIONES_CONTRATOS_WORKFLOW_N8N.md` - Guía de configuración de n8n
- `env.example.txt` - Plantilla de variables de entorno

## 🎯 Resumen de Acción

```bash
# Opción 1: Script automático (Recomendado)
# En Windows:
create-env.bat

# En Linux/Mac:
chmod +x create-env.sh && ./create-env.sh

# Opción 2: Manual
# Crear archivo .env con la configuración del paso anterior

# 3. Reiniciar servidor
npm run dev

# 4. Verificar configuración
# Abre la consola del navegador y ejecuta:
console.log('Contract Webhook:', import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL);

# 5. Probar generación de contrato
# Intenta generar un contrato desde el formulario
```

---

**Fecha**: 29 de octubre de 2025  
**Prioridad**: Alta  
**Estado**: Pendiente de configuración por el usuario

