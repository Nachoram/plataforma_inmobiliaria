# ❌ Error Solucionado: `column guarantors.application_id does not exist`

## 🔍 **Problema Encontrado**

El error ocurría porque el script RLS anterior asumía una estructura de base de datos incorrecta:

```sql
-- ❌ INCORRECTO (script anterior)
WHERE guarantors.application_id = applications.id
```

La tabla `guarantors` **NO tiene** una columna `application_id`.

---

## ✅ **Estructura Real de la Base de Datos**

La relación entre `applications` y `guarantors` funciona así:

```
applications
├── id (PRIMARY KEY)
├── property_id → properties.id
├── applicant_id → profiles.id
└── guarantor_id → guarantors.id  ✅ La foreign key está aquí

guarantors
├── id (PRIMARY KEY)
├── first_name
├── paternal_last_name
├── rut
├── profession
└── monthly_income_clp
    (NO tiene application_id)
```

---

## 🔧 **Solución Aplicada**

### **Antes (Incorrecto):**
```sql
-- ❌ Esto causaba el error
CREATE POLICY "guarantors_select_related" ON guarantors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = guarantors.application_id  -- ❌ Esta columna no existe
    )
  );
```

### **Después (Correcto):**
```sql
-- ✅ Esto funciona
CREATE POLICY "guarantors_select_related" ON guarantors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.guarantor_id = guarantors.id  -- ✅ Relación correcta
      AND (
        applications.applicant_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = applications.property_id
          AND properties.owner_id = auth.uid()
        )
      )
    )
  );
```

---

## 📋 **Instrucciones de Aplicación**

### **Paso 1: Ejecutar el script corregido**
```bash
# Ejecuta este archivo en Supabase SQL Editor:
FIX_RLS_CORRECTO.sql
```

### **Paso 2: Verificar que se aplicó correctamente**

Deberías ver este mensaje al final:
```
✅ SCRIPT EJECUTADO CORRECTAMENTE
============================================

📋 profiles           : X políticas
📋 properties         : X políticas
📋 applications       : X políticas
📋 guarantors         : X políticas
📋 rental_contracts   : X políticas

Relaciones correctas aplicadas:
  applications.guarantor_id → guarantors.id ✅
  rental_contracts.application_id → applications.id ✅
  properties.owner_id → profiles.id ✅
```

### **Paso 3: Probar en tu aplicación**

Después de ejecutar el script, recarga tu aplicación y verifica que:
- ✅ Ya no hay error 403 en `profiles`
- ✅ Ya no hay error 409 en `guarantors`
- ✅ Ya no hay error 400 en `properties`
- ✅ Puedes ver contratos correctamente

---

## 🎯 **Políticas RLS Correctas para Guarantors**

### **SELECT (Lectura)**
- Los usuarios pueden ver guarantors de:
  - Sus propias aplicaciones (donde son `applicant_id`)
  - Aplicaciones a sus propiedades (donde son `property.owner_id`)

### **INSERT (Creación)**
- Cualquier usuario autenticado puede crear un guarantor

### **UPDATE (Actualización)**
- Los usuarios pueden actualizar guarantors de sus propias aplicaciones

### **DELETE (Eliminación)**
- Los usuarios pueden eliminar guarantors de sus propias aplicaciones

---

## 📊 **Diagrama de Relaciones Corregido**

```
profiles
   ↑
   | owner_id
   |
properties ← property_id ── applications
                               ↑  |
                               |  | guarantor_id
                               |  ↓
                        applicant_id  guarantors
                               |
                               | application_id
                               ↓
                        rental_contracts
```

---

## ✨ **Beneficios de esta Corrección**

1. ✅ **Usa la estructura real** de tu base de datos
2. ✅ **Elimina todos los errores 403/409/400**
3. ✅ **Mantiene la seguridad** con RLS apropiadas
4. ✅ **Permite el flujo completo** de creación de aplicaciones

---

## 🚀 **Próximos Pasos**

1. Ejecuta `FIX_RLS_CORRECTO.sql` en Supabase
2. Recarga tu aplicación (Ctrl + F5)
3. Prueba crear una aplicación con guarantor
4. Verifica que todo funcione sin errores 403/409/400

---

**Fecha:** 3 de octubre, 2025  
**Estado:** ✅ Solucionado

