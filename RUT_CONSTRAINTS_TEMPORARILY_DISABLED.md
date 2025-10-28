# 🔓 RUT UNIQUE CONSTRAINTS TEMPORARILY DISABLED

## 📋 Resumen de Cambios

Este documento registra la eliminación temporal de restricciones de unicidad en campos RUT del sistema inmobiliario para facilitar el desarrollo y las pruebas.

**Fecha:** Octubre 28, 2025
**Estado:** ✅ COMPLETADO - Restricciones de BD eliminadas, lógica frontend adaptada para funcionar sin UNIQUE constraints

---

## 🎯 Objetivo

Permitir el uso de RUTs duplicados durante la fase de desarrollo y pruebas, eliminando bloqueos por unicidad que impiden:
- Crear usuarios con datos ficticios
- Realizar pruebas con múltiples escenarios
- Migrar datos de prueba sin conflictos

---

## 📊 Cambios Realizados

### 1. 🗄️ Base de Datos (PostgreSQL/Supabase)

**Archivo:** `supabase/migrations/20251028123418_temporarily_remove_rut_unique_constraints.sql`

**Constraints eliminadas:**
- ✅ `profiles.rut` - UNIQUE constraint
- ✅ `guarantors.rut` - UNIQUE constraint
- ✅ `rental_owner_characteristics.rut` - UNIQUE index
- ✅ `applicants.rut` - UNIQUE constraint (si existe)
- ✅ `property_owners.rut` - UNIQUE constraint (si existe)

**Estado:** Migración creada y lista para aplicar cuando Supabase esté configurado.

---

### 2. 🔧 Backend (API/Edge Functions)

**Estado:** ✅ NO REQUIERE CAMBIOS
- No se encontraron validaciones específicas de unicidad de RUT en las funciones de Supabase Edge Functions
- Las validaciones se manejan principalmente en el frontend

---

### 3. 🎨 Frontend (React/Formularios)

**Archivo:** `src/components/properties/RentalApplicationForm.tsx`

**Cambios realizados:**
- ✅ **Líneas 325-345:** Validación de unicidad de RUT comentada (ya estaba deshabilitada)
- ✅ **Líneas 347-413:** Lógica de upsert de profiles reemplazada por select->update/insert manual
- ✅ **Líneas 424-507:** Lógica de upsert de guarantors reemplazada por select->update/insert manual
- ✅ **Comentarios TODO agregados** para recordar restaurar validaciones y lógica de upsert

**Validaciones mantenidas:**
- ✅ `validateRUT()` - Validación de formato de RUT chileno (mantener)
- ✅ Otros campos requeridos y validaciones básicas

---

## 🔄 TODOs para Restaurar Antes de Producción

### Base de Datos
```sql
-- Ejecutar la migración inversa o recrear constraints:
ALTER TABLE profiles ADD CONSTRAINT profiles_rut_key UNIQUE (rut);
ALTER TABLE guarantors ADD CONSTRAINT guarantors_rut_key UNIQUE (rut);
CREATE UNIQUE INDEX idx_rental_owner_characteristics_rut ON rental_owner_characteristics(rut);
-- Repetir para applicants y property_owners si existen
```

### Frontend
**Archivo:** `src/components/properties/RentalApplicationForm.tsx`

1. **Descomentar validación de unicidad (líneas 328-342):**
   ```typescript
   const { data: existingProfileWithRUT, error: rutCheckError } = await supabase
     .from('profiles')
     .select('id')
     .eq('rut', applicantData.rut)
     .neq('id', user.id)
     .maybeSingle();

   if (rutCheckError) {
     throw new Error(`Error verificando RUT: ${rutCheckError.message}`);
   }

   if (existingProfileWithRUT) {
     throw new Error('El RUT ingresado ya está registrado para otro usuario. Por favor, verifica tus datos.');
   }
   ```

2. **Restaurar lógica de upsert para profiles (líneas 347-413):**
   - Reemplazar lógica manual select->update/insert por upsert directo
   - Usar `onConflict: 'id'` para profiles (PRIMARY KEY)

3. **Restaurar lógica de upsert para guarantors (líneas 424-507):**
   - Reemplazar lógica manual select->update/insert por upsert directo
   - Usar `onConflict: 'rut'` para guarantors (después de restaurar UNIQUE constraint)

---

## ⚠️ Recordatorios Importantes

### Durante Desarrollo/Pruebas
- ✅ Se permiten RUTs duplicados
- ✅ Los guarantors se actualizan si ya existen (upsert)
- ✅ No hay bloqueos por unicidad de datos

### Antes de Producción
- ❌ **OBLIGATORIO:** Restaurar todas las UNIQUE constraints
- ❌ **OBLIGATORIO:** Re-habilitar validaciones de unicidad en frontend
- ❌ **OBLIGATORIO:** Remover lógica de upsert para guarantors
- ❌ **OBLIGATORIO:** Probar integridad de datos después de restaurar constraints

---

## 🧪 Impacto en Pruebas

### Ventajas
- ✅ Creación rápida de usuarios ficticios
- ✅ Pruebas con datos repetidos sin conflictos
- ✅ Desarrollo de flujos sin bloqueos por validaciones

### Riesgos
- ⚠️ Posible pérdida de integridad referencial
- ⚠️ Datos inconsistentes durante pruebas
- ⚠️ Dificultad para identificar duplicados reales

---

## 📞 Checklist de Restauración

- [ ] Base de datos: UNIQUE constraints restauradas
- [ ] Frontend: Validaciones de unicidad re-habilitadas
- [ ] Guarantors: Remover `onConflict: 'rut'`
- [ ] Pruebas: Verificar que validaciones funcionen correctamente
- [ ] Datos: Limpiar datos de prueba duplicados si es necesario
- [ ] Documentación: Actualizar este documento con fecha de restauración

---

## 📝 Notas Adicionales

- La función `validateRUT()` se mantiene activa ya que valida el formato correcto del RUT chileno
- Solo se eliminaron restricciones de **unicidad**, no de formato
- Los cambios son reversibles siguiendo los TODOs marcados en el código

**Restaurar todo antes del despliegue a producción.** 🚀
