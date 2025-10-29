# ✅ Problema Resuelto: Webhook de Contratos N8N

## 🚨 Problema Original

```
❌ URL del webhook de contratos (N8N) no configurada
RentalContractConditionsForm.tsx:1216
```

El sistema no podía generar contratos porque faltaba la variable de entorno `VITE_N8N_CONTRACT_WEBHOOK_URL`.

## 🔍 Análisis

El usuario indicó que usa el webhook de Railway: `https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb`

El sistema tenía dos webhooks separados:
- **Railway Webhook**: Para notificaciones (aplicaciones, ofertas) - ✅ Ya configurado
- **N8N Contract Webhook**: Para contratos - ❌ Falta configurar

## ✅ Solución Implementada

### Configuración Unificada

Ahora ambos webhooks apuntan al **mismo endpoint de Railway**:

```env
# Railway Webhook (notificaciones)
VITE_RAILWAY_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb

# N8N Contract Webhook (contratos) - AHORA CONFIGURADO
VITE_N8N_CONTRACT_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
```

### Scripts de Instalación Automática

Se crearon scripts para facilitar la configuración:

**Windows:** `create-env.bat` - Ejecutar desde la raíz del proyecto
**Linux/Mac:** `create-env.sh` - Ejecutar desde la raíz del proyecto

### Archivos Creados/Actualizados

1. **`create-env.bat`** - Script automático para Windows
2. **`create-env.sh`** - Script automático para Linux/Mac
3. **`env.example.txt`** - Plantilla actualizada con configuración correcta
4. **`SOLUCION_WEBHOOK_N8N_CONTRATOS.md`** - Documentación completa de la solución

## 📊 Diferencias entre Webhooks

| Aspecto | Railway Webhook | N8N Contract Webhook |
|---------|----------------|---------------------|
| **Variable** | `VITE_RAILWAY_WEBHOOK_URL` | `VITE_N8N_CONTRACT_WEBHOOK_URL` |
| **Propósito** | Notificaciones (aplicaciones, ofertas) | Generación de contratos PDF |
| **Método HTTP** | GET | POST |
| **Formato** | Parámetros planos (refactorizado) | JSON plano |
| **URL** | ✅ Mismo endpoint | ✅ Mismo endpoint |

## 🔧 Implementación Backend Requerida

El webhook de Railway debe estar configurado para manejar **dos tipos de requests**:

### 1. GET Requests (Notificaciones)
- Parámetros planos: `?action=application_approved&application_id=123&...`
- Procesado por: `webhookClient.send()` (ya refactorizado)

### 2. POST Requests (Contratos)
- Body JSON plano con campos individuales
- Procesado por: `RentalContractConditionsForm.tsx`

**Backend debe detectar el método HTTP y procesar apropiadamente.**

## 🚀 Pasos para Aplicar la Solución

### Opción 1: Automática (Recomendada)

```bash
# Desde la raíz del proyecto:

# Windows
create-env.bat

# Linux/Mac
chmod +x create-env.sh && ./create-env.sh
```

### Opción 2: Manual

Crear archivo `.env` con la configuración mostrada arriba.

### Verificación

```bash
# Reiniciar servidor
npm run dev

# Verificar en consola del navegador
console.log('Contract Webhook:', import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL);
// Debe mostrar: https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
```

## ✅ Resultado Esperado

Después de aplicar la solución:

```
✅ Condiciones actualizadas exitosamente
🎯 Characteristic ID del contrato obtenido: CONTRACT_COND_xxx
📝 Creando registro del contrato...
✅ Registro del contrato creado/actualizado: xxx
📤 Enviando al webhook de n8n...
✅ Respuesta del webhook exitosa
```

En lugar del error anterior.

## 📚 Documentación

- **`SOLUCION_WEBHOOK_N8N_CONTRATOS.md`** - Guía detallada de solución
- **`WEBHOOK_REFACTOR_EXPLICACION.md`** - Documentación del refactor de webhooks
- **`env.example.txt`** - Plantilla de configuración

## 🎯 Estado Final

- ✅ **Problema identificado**: Falta variable de entorno para contratos
- ✅ **Solución implementada**: Configuración unificada de webhooks
- ✅ **Scripts creados**: Automatización de configuración
- ✅ **Documentación completa**: Guías para troubleshooting
- ⏳ **Pendiente**: Aplicar configuración en el ambiente del usuario

---

**Fecha**: 29 de octubre de 2025  
**Solución**: Configuración unificada de webhooks  
**Estado**: ✅ Lista para implementar
