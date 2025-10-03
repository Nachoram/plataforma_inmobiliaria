# 🚀 Desplegar Función Edge `approve-application`

## Problema Actual
La función Edge `approve-application` no está desplegada, causando errores CORS y de conexión.

## ✅ Solución Rápida (5 minutos)

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc
2. Inicia sesión en tu cuenta

### Paso 2: Ir a Edge Functions
1. En el menú lateral, haz clic en **"Edge Functions"**
2. Si no ves funciones, el proyecto puede no tener Edge Functions habilitadas

### Paso 3: Crear la Función
1. Haz clic en **"Create a function"**
2. **Nombre**: `approve-application`
3. **Código**: Copia y pega el contenido completo del archivo `supabase/functions/approve-application/index.ts`

### Paso 4: Desplegar
1. Haz clic en **"Deploy function"**
2. Espera a que se complete el despliegue (puede tomar 1-2 minutos)

### Paso 5: Verificar
1. Ve a la pestaña **"Logs"** para verificar que no hay errores
2. Prueba la función desde tu aplicación

## 🔧 Configuración Adicional (Opcional pero Recomendado)

### Variables de Entorno
Después de desplegar, configura estas variables en tu proyecto Supabase:

1. Ve a **Settings > Environment Variables**
2. Agrega:
   - `WEBHOOK_SECRET`: Un secreto seguro para autenticación (ej: `tu_webhook_secret_seguro`)
   - `SUPABASE_ANON_KEY`: Tu clave anónima de Supabase (ya debería estar configurada)

### Probar la Función
Desde el dashboard de Supabase, puedes probar la función con este payload de ejemplo:

```json
{
  "application_id": "uuid-de-ejemplo",
  "created_by": "uuid-del-postulante",
  "approved_by": "uuid-del-aprobador",
  "property_id": "uuid-de-la-propiedad",
  "applicant_id": "uuid-del-postulante",
  "applicant_data": {
    "full_name": "Juan Pérez",
    "contact_email": "juan@example.com",
    "contact_phone": "+56912345678",
    "profession": "Ingeniero",
    "company": "Tech Corp",
    "monthly_income": 1500000
  },
  "property_data": {
    "address": "Calle Ficticia 123",
    "city": "Santiago",
    "price": 500000,
    "listing_type": "arriendo"
  },
  "timestamp": "2025-10-03T12:00:00.000Z",
  "action": "application_approved"
}
```

## 🎯 Resultado Esperado

Después de desplegar la función:
- ✅ No más errores CORS
- ✅ Webhooks se envían correctamente
- ✅ Notificaciones por email funcionan
- ✅ Integración con sistemas externos funciona

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de la función en Supabase
2. Verifica que el código se copió correctamente
3. Asegúrate de que las variables de entorno estén configuradas

---

**Nota**: La aplicación funciona correctamente sin la función Edge desplegada. Solo faltarán las notificaciones automáticas por email y las integraciones externas.
