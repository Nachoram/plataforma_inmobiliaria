# 🚀 Instrucciones para Aplicar las Migraciones

## ⚠️ IMPORTANTE: Orden de Aplicación

Debes aplicar las migraciones en este orden exacto:

### 1️⃣ Primera Migración: Agregar Campo `property_type`
**Archivo**: `supabase/migrations/20250123000000_add_property_type.sql`

Esta migración:
- Crea el enum `property_type_enum`
- Agrega la columna `property_type` a la tabla `properties`
- Crea un índice para mejorar el rendimiento

### 2️⃣ Segunda Migración: Actualizar Función RPC
**Archivo**: `supabase/migrations/20250123000001_update_portfolio_rpc_with_property_type.sql`

Esta migración:
- Actualiza la función `get_portfolio_with_postulations` para incluir `property_type`
- Mantiene las correcciones anteriores (guarantor_email/phone como NULL)

---

## 📝 Métodos de Aplicación

### Opción A: Supabase Dashboard (SQL Editor) ✅ RECOMENDADO

1. **Ve a tu proyecto en Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/sql/new
   ```

2. **Aplica la Primera Migración**:
   - Abre `supabase/migrations/20250123000000_add_property_type.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor
   - Haz clic en **"Run"**
   - Espera la confirmación de éxito ✅

3. **Aplica la Segunda Migración**:
   - Abre `supabase/migrations/20250123000001_update_portfolio_rpc_with_property_type.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor
   - Haz clic en **"Run"**
   - Espera la confirmación de éxito ✅

### Opción B: Supabase CLI (Si lo tienes configurado)

```bash
# Verificar conexión
npx supabase status

# Aplicar migraciones
npx supabase db push

# O aplicar una específica
npx supabase migration up --db-url postgresql://postgres:[TU_PASSWORD]@[TU_URL]:5432/postgres
```

---

## ✅ Verificación Post-Migración

Después de aplicar ambas migraciones, ejecuta estas queries en el SQL Editor para verificar:

### 1. Verificar que el campo property_type existe:
```sql
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'properties' 
  AND column_name = 'property_type';
```

**Resultado esperado**:
```
column_name   | data_type            | column_default
property_type | USER-DEFINED (enum)  | 'Casa'::property_type_enum
```

### 2. Verificar que el enum tiene los valores correctos:
```sql
SELECT unnest(enum_range(NULL::property_type_enum))::text as tipo;
```

**Resultado esperado**:
```
Casa
Departamento
Oficina
Local Comercial
Estacionamiento
Bodega
Parcela
```

### 3. Verificar que la función RPC está actualizada:
```sql
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_portfolio_with_postulations';
```

Busca en la definición que incluya `p.property_type`.

### 4. Probar la función RPC:
```sql
-- Reemplaza 'TU_USER_ID' con tu UUID real de usuario
SELECT * FROM get_portfolio_with_postulations('TU_USER_ID');
```

### 5. Actualizar propiedades existentes (OPCIONAL):
```sql
-- Ver cuántas propiedades no tienen tipo asignado
SELECT COUNT(*) FROM properties WHERE property_type IS NULL;

-- Actualizar todas las propiedades sin tipo a 'Casa' (o el tipo que prefieras)
UPDATE properties 
SET property_type = 'Casa' 
WHERE property_type IS NULL;

-- O actualizar manualmente por ID:
UPDATE properties 
SET property_type = 'Departamento' 
WHERE id = 'UUID_DE_LA_PROPIEDAD';
```

---

## 🔄 Volver a Agregar property_type en PortfolioPage

Una vez aplicadas las migraciones, actualiza `src/components/portfolio/PortfolioPage.tsx`:

```typescript
// Línea 85 aproximadamente, en la query de fallback:
.select(`
  id,
  owner_id,
  status,
  listing_type,
  property_type,  // ← AGREGAR ESTA LÍNEA
  address_street,
  address_number,
  // ... resto de campos
`)
```

---

## 🐛 Solución de Problemas

### Error: "column property_type does not exist"
- ✅ Aplica la primera migración (`20250123000000_add_property_type.sql`)

### Error: "type property_type_enum does not exist"
- ✅ Aplica la primera migración que crea el enum

### Error: "column guar.email does not exist"
- ✅ Esto ya está arreglado en la migración `20251021200000_fix_guarantor_email_phone_columns.sql`
- ✅ La nueva migración mantiene esta corrección

### Error en la función RPC después de aplicar migraciones
- ✅ Verifica que aplicaste AMBAS migraciones en orden
- ✅ Ejecuta: `SELECT * FROM pg_proc WHERE proname = 'get_portfolio_with_postulations';`

---

## 📊 Estado Actual vs Estado Deseado

### ❌ Antes de Aplicar Migraciones:
- La tabla `properties` **NO tiene** el campo `property_type`
- La función RPC **NO incluye** `property_type` en los resultados
- El código frontend está preparado pero el backend falta

### ✅ Después de Aplicar Migraciones:
- La tabla `properties` **SÍ tiene** el campo `property_type`
- La función RPC **SÍ incluye** `property_type` en los resultados
- Todo el stack (BD + Backend + Frontend) funciona correctamente

---

## 🎯 Comando Rápido (Copiar y Pegar en SQL Editor)

Si prefieres aplicar todo de una vez, copia ambos archivos en orden:

```sql
-- ========================================
-- MIGRACIÓN 1: Agregar property_type
-- ========================================
-- [Copiar contenido de 20250123000000_add_property_type.sql aquí]

-- ========================================
-- MIGRACIÓN 2: Actualizar función RPC
-- ========================================
-- [Copiar contenido de 20250123000001_update_portfolio_rpc_with_property_type.sql aquí]
```

---

## ✅ Checklist Final

Después de aplicar las migraciones, verifica:

- [ ] La columna `property_type` existe en la tabla `properties`
- [ ] El enum `property_type_enum` tiene 7 valores
- [ ] La función `get_portfolio_with_postulations` incluye `property_type`
- [ ] Puedes consultar propiedades y ver su tipo
- [ ] El frontend muestra correctamente los tipos de propiedad
- [ ] No hay errores en la consola del navegador
- [ ] El PortfolioPage carga correctamente

---

¡Listo! Una vez aplicadas las migraciones, toda la funcionalidad de tipos de propiedad estará completamente operativa. 🚀

