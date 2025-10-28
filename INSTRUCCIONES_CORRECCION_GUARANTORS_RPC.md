# 🔧 Instrucciones para Corregir Función RPC get_portfolio_with_postulations

## 📋 Problema Identificado

El error `column guarantors_1.full_name does not exist` con código `42703` ocurre porque la función RPC `get_portfolio_with_postulations` está intentando acceder a columnas que no existen en la tabla `guarantors`.

**Columnas incorrectas que intentaba usar:**
- `guar.first_name`, `guar.paternal_last_name`, `guar.maternal_last_name` → ❌ No existen
- `guar.email` → ❌ No existe  
- `guar.phone` → ❌ No existe

**Columnas correctas en la tabla `guarantors`:**
- `full_name` ✅
- `contact_email` ✅
- `contact_phone` ✅

---

## ✅ Solución Aplicada en el Frontend

Ya he corregido las consultas en el código frontend:

### 1. **PostulationsList.tsx** ✅ CORREGIDO
- **Archivo:** `src/components/portfolio/PostulationsList.tsx`
- **Cambios:**
  - Líneas 57-63: Actualizado el SELECT para usar `full_name`, `contact_email`, `contact_phone`
  - Líneas 83-85: Actualizado el mapeo para usar directamente `app.guarantors?.full_name`

### 2. **AdminPropertyDetailView.tsx** ✅ YA ESTABA CORRECTO
- **Archivo:** `src/components/properties/AdminPropertyDetailView.tsx`
- Este archivo ya usaba las columnas correctas (líneas 427-430)

---

## 🔧 Acción Requerida: Actualizar Función RPC en Supabase

Para completar la corrección, debes actualizar la función RPC en tu base de datos de Supabase.

### Opción 1: Ejecutar SQL en Supabase Dashboard (RECOMENDADO)

1. **Ve a Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/TU_PROJECT_ID/sql/new
   ```

2. **Copia y pega el contenido del archivo:**
   ```
   FIX_GUARANTORS_COLUMNS_IN_RPC.sql
   ```
   O alternativamente:
   ```
   supabase/migrations/20251027163000_fix_guarantors_column_names_in_rpc.sql
   ```

3. **Haz click en "Run"** (o presiona Ctrl+Enter)

4. **Verifica el resultado:**
   - Deberías ver un mensaje de éxito
   - La función se habrá recreado con los nombres de columnas correctos

### Opción 2: Usar Supabase CLI (si está configurado)

```bash
# Aplicar la migración
supabase db push

# O aplicar migración específica
supabase migration up 20251027163000_fix_guarantors_column_names_in_rpc
```

---

## 🧪 Verificar que la Corrección Funciona

Después de aplicar la corrección SQL:

1. **Abre la aplicación en el navegador**

2. **Ve a "Mi Portafolio"** (portfolio page)

3. **Verifica que:**
   - Las propiedades se cargan correctamente ✅
   - El contador de postulaciones aparece ✅
   - Al hacer clic en "Ver postulaciones" se muestran sin errores ✅
   - Los nombres de garantes aparecen correctamente ✅
   - Los emails y teléfonos de garantes se muestran ✅

4. **Revisa la consola del navegador:**
   - NO debe aparecer el error `column guarantors_1.full_name does not exist`
   - Deben aparecer logs como: `✅ [PostulationsList] Postulaciones formateadas`

---

## 📝 Resumen de Cambios

| Archivo | Cambios | Estado |
|---------|---------|--------|
| `PostulationsList.tsx` | SELECT y mapeo actualizados | ✅ Completado |
| `AdminPropertyDetailView.tsx` | Ya estaba correcto | ✅ OK |
| Función RPC `get_portfolio_with_postulations` | Necesita actualización en BD | ⚠️ Pendiente |

---

## ⚠️ Nota Importante

El error **solo desaparecerá completamente** una vez que hayas ejecutado el SQL en Supabase. 

Los cambios en el frontend YA están aplicados, pero la función RPC en la base de datos debe actualizarse para que la página de portfolio funcione correctamente cuando usa la función RPC (PortfolioPage.tsx línea 57-60).

---

## 🐛 Si Continúas Viendo Errores

Si después de aplicar el SQL sigues viendo errores:

1. **Verifica que el SQL se ejecutó correctamente:**
   ```sql
   -- En Supabase SQL Editor
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'get_portfolio_with_postulations';
   ```

2. **Verifica que la tabla guarantors tiene las columnas correctas:**
   ```sql
   -- En Supabase SQL Editor
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'guarantors';
   ```

3. **Revisa los logs del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña Console
   - Busca errores con código `42703`

---

## 📞 Soporte

Si necesitas ayuda adicional o encuentras otros errores, revisa:
- Los archivos de documentación en la raíz del proyecto
- Los logs en la consola del navegador (F12)
- Los logs de Supabase en el dashboard

