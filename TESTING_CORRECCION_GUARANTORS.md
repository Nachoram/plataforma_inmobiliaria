# 🧪 Guía de Testing: Corrección de Error guarantors_1.full_name

## 📋 Resumen

Esta guía te ayudará a verificar que la corrección del error `column guarantors_1.full_name does not exist` funciona correctamente en toda la aplicación.

---

## ✅ Pre-requisitos

Antes de comenzar las pruebas, asegúrate de:

1. ✅ **Código frontend actualizado:**
   - `src/components/portfolio/PostulationsList.tsx` - Corregido
   - `src/components/properties/AdminPropertyDetailView.tsx` - Ya estaba correcto

2. ✅ **Migración SQL aplicada en Supabase:**
   - Ejecutar: `FIX_GUARANTORS_COLUMNS_IN_RPC.sql`
   - O: `supabase/migrations/20251027163000_fix_guarantors_column_names_in_rpc.sql`

3. ✅ **Aplicación ejecutándose:**
   ```bash
   npm run dev
   ```

---

## 🧪 Casos de Prueba

### Test 1: Verificar Página de Portfolio

**Objetivo:** Confirmar que la página de portfolio carga sin errores.

**Pasos:**
1. Inicia sesión en la aplicación
2. Navega a "Mi Portafolio"
3. Observa que las propiedades se cargan

**Resultados Esperados:**
- ✅ Las propiedades se muestran correctamente
- ✅ El contador de postulaciones aparece en cada propiedad
- ✅ **NO** aparece error en consola con código `42703`
- ✅ **NO** aparece mensaje de error sobre columnas

**Verificación en Consola:**
```
Abrir DevTools (F12) → Console
Buscar:
✅ "🔍 [DEBUG] RPC Response:" - debe mostrar datos sin error
❌ NO debe aparecer: "column guarantors_1.full_name does not exist"
```

---

### Test 2: Ver Postulaciones en Portfolio

**Objetivo:** Verificar que se pueden expandir y ver las postulaciones.

**Pasos:**
1. En la página "Mi Portafolio"
2. Encuentra una propiedad con postulaciones (contador > 0)
3. Haz clic en "Ver postulaciones" o en la card de la propiedad
4. Observa la lista de postulaciones

**Resultados Esperados:**
- ✅ Se abre la sección de postulaciones
- ✅ Se muestran los nombres de los postulantes
- ✅ Se muestran los datos de garantes (si existen):
  - Nombre completo del garante
  - Email del garante
  - Teléfono del garante
- ✅ **NO** aparece "Sin nombre" si hay garante

**Verificación en Consola:**
```javascript
// Buscar en consola:
"✅ [PostulationsList] Postulaciones formateadas:"
// Debe mostrar un array con objetos que incluyan:
{
  guarantor_name: "Nombre Completo del Garante",  // o null si no hay garante
  guarantor_email: "email@example.com",           // o null si no hay garante
  guarantor_phone: "+56912345678"                  // o null si no hay garante
}
```

---

### Test 3: Vista Detallada de Propiedad (Admin)

**Objetivo:** Verificar que la vista de administrador de propiedad carga postulaciones correctamente.

**Pasos:**
1. En "Mi Portafolio"
2. Haz clic en "Ver detalles" de una propiedad
3. Ve a la pestaña de "Postulaciones" (si existe)
4. Observa la lista de postulaciones

**Resultados Esperados:**
- ✅ Las postulaciones se cargan
- ✅ Los datos de garantes se muestran correctamente:
  - Nombre completo
  - Email
  - Teléfono
- ✅ **NO** aparece error `42703` en consola

**Verificación en Consola:**
```javascript
// Buscar:
"✅ [AdminPropertyDetailView] Postulaciones reales cargadas:"
"📊 [AdminPropertyDetailView] Postulaciones formateadas:"

// Verificar que los objetos incluyen:
{
  guarantor: {
    name: "Nombre Completo",
    email: "email@example.com",
    phone: "+56912345678"
  }
}
// O null si no hay garante
```

---

### Test 4: Postulaciones con y sin Garante

**Objetivo:** Verificar el manejo correcto de postulaciones con y sin garante.

**Pasos:**
1. Encuentra o crea una postulación **CON** garante
2. Encuentra o crea una postulación **SIN** garante
3. Verifica que ambas se muestran correctamente

**Resultados Esperados:**

**Para postulaciones CON garante:**
- ✅ `guarantor_name` muestra el nombre completo
- ✅ `guarantor_email` muestra el email
- ✅ `guarantor_phone` muestra el teléfono
- ✅ Los datos se muestran en la UI

**Para postulaciones SIN garante:**
- ✅ `guarantor_name` es `null`
- ✅ `guarantor_email` es `null`
- ✅ `guarantor_phone` es `null`
- ✅ La UI muestra algo como "Sin garante" o no muestra la sección

---

### Test 5: Verificación en Base de Datos

**Objetivo:** Verificar directamente en Supabase que la función RPC está actualizada.

**Pasos:**
1. Ve a Supabase Dashboard
2. SQL Editor
3. Ejecuta:

```sql
-- Verificar que la función existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_portfolio_with_postulations';

-- Verificar que usa las columnas correctas
-- Busca en prosrc: "full_name", "contact_email", "contact_phone"
```

**Resultados Esperados:**
- ✅ La función existe
- ✅ El código de la función incluye:
  - `guar.full_name` ✅
  - `guar.contact_email` ✅
  - `guar.contact_phone` ✅
- ❌ El código NO debe incluir:
  - `guar.first_name` ❌
  - `guar.email` ❌
  - `guar.phone` ❌

---

### Test 6: Verificar Estructura de Tabla guarantors

**Objetivo:** Confirmar que la tabla tiene las columnas correctas.

**Pasos:**
1. En Supabase SQL Editor, ejecuta:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'guarantors'
ORDER BY ordinal_position;
```

**Resultados Esperados:**
```
✅ Columnas que DEBEN existir:
- id (uuid)
- full_name (text) - NOT NULL
- contact_email (text) - NOT NULL
- contact_phone (text)
- rut (text)
- guarantor_characteristic_id (uuid)
- created_at (timestamp)
- updated_at (timestamp)

❌ Columnas que NO deben usarse (pueden existir por legacy):
- first_name
- paternal_last_name
- maternal_last_name
- email
- phone
```

---

## 🔍 Checklist de Verificación Completa

Marca cada ítem cuando lo hayas verificado:

### Frontend
- [ ] `PostulationsList.tsx` usa `full_name`, `contact_email`, `contact_phone`
- [ ] `AdminPropertyDetailView.tsx` usa las columnas correctas
- [ ] No hay otros archivos con `guarantors.first_name` o `guarantors.email`

### Base de Datos
- [ ] Función RPC `get_portfolio_with_postulations` actualizada
- [ ] Tabla `guarantors` tiene columnas `full_name`, `contact_email`, `contact_phone`
- [ ] Migración SQL aplicada exitosamente

### Funcionalidad
- [ ] Página de Portfolio carga sin errores
- [ ] Postulaciones se muestran correctamente
- [ ] Datos de garantes se muestran (cuando existen)
- [ ] Manejo correcto de postulaciones sin garante
- [ ] Console NO muestra error `42703`
- [ ] Console NO muestra "column does not exist"

---

## 🐛 Troubleshooting

### Error persiste después de aplicar correcciones

**Síntoma:** Sigue apareciendo `column guarantors_1.full_name does not exist`

**Soluciones:**

1. **Limpiar caché del navegador:**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

2. **Verificar que el SQL se aplicó:**
   ```sql
   -- En Supabase SQL Editor
   SELECT prosrc FROM pg_proc WHERE proname = 'get_portfolio_with_postulations';
   ```
   Debe mostrar `guar.full_name`, NO `guar.first_name`

3. **Verificar versión del código:**
   ```bash
   # Ver cambios locales
   git diff src/components/portfolio/PostulationsList.tsx
   ```

4. **Reiniciar servidor de desarrollo:**
   ```bash
   # Detener con Ctrl+C
   npm run dev
   ```

### Datos de garante no se muestran

**Síntoma:** Las postulaciones cargan pero no se ven nombres de garantes

**Verificaciones:**

1. **Verificar que existen garantes en BD:**
   ```sql
   SELECT 
     a.id as application_id,
     a.guarantor_id,
     g.full_name,
     g.contact_email
   FROM applications a
   LEFT JOIN guarantors g ON g.id = a.guarantor_id
   LIMIT 10;
   ```

2. **Verificar datos en consola:**
   - Abrir DevTools → Console
   - Buscar: "Postulaciones formateadas"
   - Verificar que `guarantor_name` no sea `null` cuando sí existe garante

---

## 📊 Métricas de Éxito

La corrección se considera **exitosa** cuando:

- ✅ 0 errores de tipo `42703` en la consola
- ✅ 0 errores relacionados con columnas de `guarantors`
- ✅ 100% de las postulaciones se cargan correctamente
- ✅ 100% de los datos de garantes se muestran (cuando existen)
- ✅ La funcionalidad no se ve afectada para postulaciones sin garante

---

## 📝 Reporte de Resultados

Después de completar las pruebas, documenta:

```markdown
## Resultados de Testing - [FECHA]

### Tests Ejecutados
- [ ] Test 1: Portfolio carga ✅/❌
- [ ] Test 2: Ver postulaciones ✅/❌
- [ ] Test 3: Vista admin ✅/❌
- [ ] Test 4: Con/sin garante ✅/❌
- [ ] Test 5: Verificación BD ✅/❌
- [ ] Test 6: Estructura tabla ✅/❌

### Errores Encontrados
[Listar cualquier error o comportamiento inesperado]

### Notas Adicionales
[Cualquier observación relevante]
```

---

## ✅ Conclusión

Si todos los tests pasan:
- ✅ La corrección está completa
- ✅ El sistema funciona correctamente
- ✅ Los usuarios pueden ver postulaciones con y sin garantes sin errores

Si algún test falla, revisa la sección de Troubleshooting o consulta los logs para más detalles.

