# 🚀 Despliegue de Edge Function: get-user-calendar-events

## 📋 Problema Actual

La aplicación está intentando acceder a la Edge Function desde `localhost:5173`, pero recibe errores CORS porque la función no está desplegada o no está configurada correctamente.

**Errores observados:**
- `Access to fetch at 'https://phnkervuiijqmapgswkc.supabase.co/functions/v1/get-user-calendar-events' from origin 'http://localhost:5173' has been blocked by CORS policy`
- `Response to preflight request doesn't pass access control check: It does not have HTTP ok status`

## ✅ Solución Temporal (Desarrollo)

Se ha implementado un **modo fallback** en `useUserCalendar.ts` que usa datos mock cuando la Edge Function no está disponible. Esto permite continuar el desarrollo y testing sin interrupciones.

**Características del modo desarrollo:**
- ✅ Datos de ejemplo realistas
- ✅ Todos los tipos de eventos representados
- ✅ Interface completa funcional
- ✅ Filtros y navegación operativos

## 🚀 Solución Definitiva (Producción)

### Paso 1: Instalar y Configurar Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalación
supabase --version

# Login (requiere navegador)
supabase login
```

### Paso 2: Verificar Proyecto

```bash
# Listar proyectos
supabase projects list

# Verificar estado del proyecto local
supabase status
```

### Paso 3: Desplegar Edge Function

```bash
# Desde el directorio raíz del proyecto
cd supabase/functions

# Desplegar la función específica
supabase functions deploy get-user-calendar-events

# Verificar despliegue
supabase functions list
```

### Paso 4: Ejecutar Migración de Base de Datos

```sql
-- Ejecutar en Supabase SQL Editor o mediante CLI
-- Archivo: supabase/migrations/20250129000000_add_deadline_date_to_offers.sql

ALTER TABLE property_sale_offers
ADD COLUMN IF NOT EXISTS deadline_date DATE;

COMMENT ON COLUMN property_sale_offers.deadline_date IS
'Fecha límite para que la oferta sea válida. Si no se especifica, la oferta no tiene plazo definido.';
```

### Paso 5: Verificar Funcionamiento

```bash
# Ejecutar script de verificación
node supabase/post-deployment-verification.js
```

## 🔧 Configuración CORS (Opcional)

Si hay problemas de CORS después del despliegue, verificar:

```typescript
// En la Edge Function, agregar headers CORS si es necesario
return new Response(JSON.stringify({ events: transformedEvents }), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
});
```

## 📊 Testing Post-Despliegue

### Verificación Manual
1. ✅ Acceder a `/perfil` en la aplicación
2. ✅ Hacer click en pestaña "Calendario de Actividades"
3. ✅ Verificar que carga eventos (no datos mock)
4. ✅ Probar filtros y navegación
5. ✅ Verificar detalles de eventos

### Verificación Automática
```bash
# Script de verificación incluye:
✅ Conexión a Supabase
✅ Existencia de tablas
✅ Función PostgreSQL
✅ Edge Function activa
✅ Datos de ejemplo
```

## 🎯 Estados de la Implementación

### ✅ Desarrollo Local
- ✅ Modo fallback con datos mock
- ✅ Interface completa funcional
- ✅ Testing de componentes
- ✅ Build exitoso

### ⏳ Producción (Requiere Despliegue)
- ⏳ Edge Function desplegada
- ⏳ Migración de BD ejecutada
- ⏳ CORS configurado
- ⏳ Datos reales cargando

## 🔍 Diagnóstico de Problemas

### Error: "Function does not exist"
```bash
# Verificar despliegue
supabase functions list

# Re-desplegar si es necesario
supabase functions deploy get-user-calendar-events
```

### Error: "CORS policy"
```typescript
// Verificar headers en Edge Function
// Agregar headers CORS si faltan
'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : 'your-domain.com'
```

### Error: "Column deadline_date does not exist"
```sql
-- Ejecutar migración faltante
ALTER TABLE property_sale_offers ADD COLUMN deadline_date DATE;
```

## 📋 Checklist de Despliegue

- [x] Código desarrollado y testeado
- [x] Modo fallback implementado (desarrollo)
- [ ] Supabase CLI instalado y configurado
- [ ] Proyecto autenticado
- [ ] Edge Function desplegada
- [ ] Migración de BD ejecutada
- [ ] Testing post-despliegue completado
- [ ] CORS funcionando correctamente

## 🎉 Próximos Pasos

1. **Despliegue**: Ejecutar comandos de deployment
2. **Verificación**: Correr script de testing
3. **Testing**: Validar funcionalidad completa
4. **Optimización**: Monitorear performance
5. **Documentación**: Actualizar docs de producción

---

**Estado Actual**: ✅ **Desarrollo completo con fallback - Listo para despliegue** 🚀