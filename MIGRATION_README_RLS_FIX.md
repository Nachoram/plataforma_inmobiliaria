# 🔧 Fix for Properties RLS Policies - Migration Guide

## 🚨 Problema Identificado

Los errores **406 Not Acceptable** y **403 Forbidden** al intentar publicar propiedades se deben a inconsistencias en las Políticas de Row Level Security (RLS) y el enum `property_status_enum`.

### Problemas encontrados:
1. **Inconsistencia en enum**: La vista `active_properties` usa `status = 'disponible'` pero el enum solo tenía `['activa', 'arrendada', 'vendida', 'pausada']`
2. **Políticas RLS obsoletas**: Las políticas existentes no seguían las mejores prácticas de `auth.uid()`
3. **Valor por defecto inconsistente**: El valor por defecto era `'activa'` pero la vista buscaba `'disponible'`

## ✅ Solución Implementada

### 1. Nueva Migración SQL
Se creó la migración: `supabase/migrations/20250902210000_fix_properties_rls_policies.sql`

**Cambios principales:**
- ✅ Agrega `'disponible'` al enum `property_status_enum`
- ✅ Cambia el valor por defecto de `status` a `'disponible'`
- ✅ Actualiza todas las propiedades existentes de `'activa'` a `'disponible'`
- ✅ Recreó todas las políticas RLS con sintaxis correcta usando `auth.uid()`
- ✅ Corrige la vista `active_properties` para usar el status correcto
- ✅ Agrega función helper `can_user_access_property()` para debugging

### 2. Interfaces TypeScript Actualizadas
Se actualizó `src/lib/supabase.ts` para incluir:
- ✅ `'disponible'` en los tipos de `Property.status`
- ✅ Campos opcionales nuevos: `updated_at`, `is_visible`, `is_featured`

## 🚀 Cómo Aplicar la Migración

### Opción 1: Supabase Dashboard (Recomendado)
1. Ve al [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido completo de `supabase/migrations/20250902210000_fix_properties_rls_policies.sql`
5. Haz clic en **Run** para ejecutar la migración

### Opción 2: Supabase CLI (Si tienes CLI instalado)
```bash
# Desde la raíz del proyecto
supabase db push
```

### Opción 3: Ejecutar SQL Directamente
Si tienes acceso directo a PostgreSQL:
```bash
psql -h [tu-host] -d [tu-database] -U [tu-usuario] -f supabase/migrations/20250902210000_fix_properties_rls_policies.sql
```

## 🔍 Verificación de la Migración

Después de aplicar la migración, verifica que:

1. **Las políticas RLS funcionan correctamente:**
   ```sql
   -- Verificar políticas activas
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'properties'
   ORDER BY policyname;
   ```

2. **El enum incluye el nuevo valor:**
   ```sql
   -- Verificar valores del enum
   SELECT enum_range(NULL::property_status_enum);
   ```

3. **Las propiedades existentes se actualizaron:**
   ```sql
   -- Verificar que no hay propiedades con status 'activa'
   SELECT status, COUNT(*) FROM properties GROUP BY status;
   ```

## 📋 Políticas RLS Implementadas

### SELECT Policy (`properties_select_policy`)
```sql
-- Público puede ver propiedades con status 'disponible'
-- Usuarios autenticados pueden ver todas sus propiedades + todas las 'disponible'
(status = 'disponible' AND auth.role() = 'anon') OR
(auth.role() = 'authenticated' AND auth.uid() = owner_id) OR
(auth.role() = 'authenticated' AND status = 'disponible')
```

### INSERT Policy (`properties_insert_policy`)
```sql
-- Solo usuarios autenticados pueden crear propiedades que les pertenecen
auth.uid() = owner_id AND auth.uid() IS NOT NULL
```

### UPDATE Policy (`properties_update_policy`)
```sql
-- Solo propietarios pueden actualizar sus propiedades
auth.uid() = owner_id
```

### DELETE Policy (`properties_delete_policy`)
```sql
-- Solo propietarios pueden eliminar sus propiedades
auth.uid() = owner_id
```

## 🧪 Testing Manual

Después de aplicar la migración:

1. **Crear una nueva propiedad** (debería funcionar sin errores 403/406)
2. **Ver propiedades públicas** (usuarios no autenticados deberían ver propiedades 'disponible')
3. **Ver propiedades propias** (usuarios autenticados deberían ver todas sus propiedades)
4. **Actualizar propiedad propia** (debería funcionar)
5. **Eliminar propiedad propia** (debería funcionar)

## 🔧 Función Helper para Debugging

La migración incluye una función helper:
```sql
SELECT can_user_access_property('user-uuid', 'property-uuid');
```

Esta función te permite verificar si un usuario específico puede acceder a una propiedad específica.

## 📞 Soporte

Si después de aplicar la migración sigues teniendo problemas:

1. Verifica que la migración se ejecutó completamente sin errores
2. Revisa los logs de Supabase para mensajes de error específicos
3. Usa la función helper para verificar permisos específicos
4. Asegúrate de que el usuario esté correctamente autenticado

## 📝 Notas Importantes

- **Backup recomendado**: Haz un backup de tu base de datos antes de aplicar la migración
- **Testing en staging**: Si es posible, prueba primero en un entorno de staging
- **Rollback**: Si algo sale mal, puedes revertir usando las migraciones anteriores
- **Monitorización**: Monitorea los logs después de aplicar la migración para detectar cualquier problema

---

**Estado**: ✅ Listo para aplicar
**Archivo de migración**: `supabase/migrations/20250902210000_fix_properties_rls_policies.sql`
**Archivos modificados**: `src/lib/supabase.ts`
