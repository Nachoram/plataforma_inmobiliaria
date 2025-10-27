# 🔧 Solución: Error 400 en Portfolio - "column guar.email does not exist"

## 📋 Resumen del Problema

### Error Observado
```
❌ Error completo: {
  "code": "42703",
  "details": null,
  "hint": null,
  "message": "column guar.email does not exist"
}
```

### Endpoint Afectado
- `/rest/v1/rpc/get_portfolio_with_postulations`
- Función RPC: `get_portfolio_with_postulations(user_id_param uuid)`

### Causa Raíz
La función RPC `get_portfolio_with_postulations` está intentando acceder a columnas que **NO EXISTEN** en la tabla `guarantors`:

#### ❌ Columnas que la función intentaba usar (INCORRECTAS):
- `guar.email` → **NO EXISTE**
- `guar.phone` → **NO EXISTE**
- `guar.first_name` → **NO EXISTE**
- `guar.paternal_last_name` → **NO EXISTE**
- `guar.maternal_last_name` → **NO EXISTE**
- `guar.guarantor_characteristic_id` → **NO EXISTE EN GUARANTORS** (está en `applications`)

#### ✅ Columnas que la tabla `guarantors` realmente tiene:
```sql
CREATE TABLE guarantors (
  id uuid,
  full_name text NOT NULL,          -- ✅ Nombre completo en un solo campo
  rut text UNIQUE NOT NULL,
  profession text,
  company text,
  monthly_income numeric,
  work_seniority_years integer,
  contact_email text NOT NULL,      -- ✅ Es "contact_email" no "email"
  contact_phone text,               -- ✅ Es "contact_phone" no "phone"
  address_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);
```

## 🛠️ Solución Implementada

### Archivos Creados

1. **`supabase/migrations/20251027163000_fix_guarantors_column_names_in_rpc.sql`**
   - Migración oficial para el repositorio
   - Actualiza la función RPC con los nombres de columnas correctos

2. **`FIX_GUARANTORS_COLUMNS_IN_RPC.sql`**
   - Script SQL independiente para ejecutar manualmente en Supabase SQL Editor
   - Contiene la misma corrección con comentarios detallados

### Cambios Realizados en la Función RPC

```sql
-- ❌ ANTES (INCORRECTO):
'guarantor_name', COALESCE(
    guar.first_name || ' ' || guar.paternal_last_name || ' ' || COALESCE(guar.maternal_last_name, ''),
    NULL
),
'guarantor_email', guar.email,
'guarantor_phone', guar.phone,
'guarantor_characteristic_id', guar.guarantor_characteristic_id

-- ✅ DESPUÉS (CORRECTO):
'guarantor_name', guar.full_name,
'guarantor_email', guar.contact_email,
'guarantor_phone', guar.contact_phone,
'guarantor_characteristic_id', app.guarantor_characteristic_id
```

### Cambios Específicos

| Campo JSON | Antes (Incorrecto) | Después (Correcto) |
|-----------|-------------------|-------------------|
| `guarantor_name` | `guar.first_name + guar.paternal_last_name + guar.maternal_last_name` | `guar.full_name` |
| `guarantor_email` | `guar.email` | `guar.contact_email` |
| `guarantor_phone` | `guar.phone` | `guar.contact_phone` |
| `guarantor_characteristic_id` | `guar.guarantor_characteristic_id` | `app.guarantor_characteristic_id` |

## 📝 Instrucciones de Aplicación

### Opción 1: Usando Supabase SQL Editor (Recomendado)

1. Abre el **SQL Editor** en tu proyecto de Supabase
2. Copia el contenido completo de `FIX_GUARANTORS_COLUMNS_IN_RPC.sql`
3. Pégalo en el editor y ejecuta el script
4. Verifica que la función se haya actualizado correctamente

### Opción 2: Usando Supabase CLI

```bash
# Si tienes Supabase CLI configurado
supabase db push
```

Esto aplicará automáticamente la migración `20251027163000_fix_guarantors_column_names_in_rpc.sql`.

## ✅ Verificación

### 1. Verifica que la función se haya actualizado

```sql
-- Ver la definición de la función
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_portfolio_with_postulations';
```

Busca las líneas que deben mostrar:
- `guar.full_name`
- `guar.contact_email`
- `guar.contact_phone`
- `app.guarantor_characteristic_id`

### 2. Prueba la función directamente

```sql
-- Reemplaza 'TU_USER_ID' con un ID de usuario real
SELECT * FROM get_portfolio_with_postulations('TU_USER_ID');
```

Esto debería devolver todas las propiedades del usuario con sus postulaciones **SIN ERRORES**.

### 3. Prueba desde el frontend

1. Recarga tu aplicación web
2. Navega a la página de Portfolio
3. Verifica que ya NO aparezcan los errores:
   - ❌ "Failed to load resource: the server responded with a status of 400"
   - ❌ "column guar.email does not exist"

## 🎯 Resultado Esperado

Después de aplicar la solución:

✅ La página de Portfolio carga correctamente
✅ Las propiedades se muestran con sus postulaciones
✅ Los datos de los garantes se muestran correctamente:
   - Nombre completo del garante
   - Email del garante
   - Teléfono del garante

## 🔍 Debugging Adicional

Si aún experimentas problemas:

### 1. Verifica la estructura de la tabla guarantors

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'guarantors'
ORDER BY ordinal_position;
```

### 2. Verifica que haya datos de garantes

```sql
SELECT 
    g.id,
    g.full_name,
    g.contact_email,
    g.contact_phone,
    COUNT(a.id) as application_count
FROM guarantors g
LEFT JOIN applications a ON g.id = a.guarantor_id
GROUP BY g.id, g.full_name, g.contact_email, g.contact_phone;
```

### 3. Revisa los logs del navegador

Abre las **Developer Tools** (F12) y revisa:
- **Console**: Para errores de JavaScript
- **Network**: Para ver las peticiones a `/rpc/get_portfolio_with_postulations`

## 📚 Contexto Adicional

### Historia del Problema

Este error ocurrió porque:

1. **Esquema inicial**: La tabla `guarantors` originalmente tenía columnas separadas (`first_name`, `paternal_last_name`, `maternal_last_name`, `email`, `phone`)

2. **Refactorización**: En algún momento se consolidó la estructura a:
   - `full_name` (en lugar de nombres separados)
   - `contact_email` (en lugar de `email`)
   - `contact_phone` (en lugar de `phone`)

3. **Desincronización**: La función RPC `get_portfolio_with_postulations` no se actualizó junto con el cambio de esquema

### Lecciones Aprendidas

- ✅ Siempre actualizar las funciones RPC cuando se cambia el esquema de las tablas
- ✅ Verificar todas las referencias a columnas renombradas
- ✅ Probar las funciones RPC después de cambios de esquema
- ✅ Documentar los cambios de nombres de columnas

## 🚀 Próximos Pasos

Una vez aplicada esta corrección:

1. ✅ El portfolio debería funcionar correctamente
2. ✅ Los datos de garantes se mostrarán correctamente
3. ✅ Ya no habrá errores 400 en la consola
4. ⚠️ Revisa si hay otras funciones RPC que puedan tener el mismo problema

## 📞 Soporte

Si después de aplicar esta solución sigues teniendo problemas:

1. Verifica los pasos de verificación mencionados arriba
2. Revisa los logs de Supabase (Logging → Postgres Logs)
3. Comparte el error específico que estés experimentando

