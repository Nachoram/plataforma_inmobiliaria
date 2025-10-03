# 🔒 Solución: No puedo modificar el contrato

## 🔍 **Diagnóstico del Problema**

Si no puedes editar contratos, el problema suele ser uno de estos:

1. **Permisos RLS** - La base de datos no permite UPDATE
2. **Tipo de dato incorrecto** - `contract_content` no acepta JSON
3. **Error de frontend** - El componente no puede guardar

---

## ✅ **Solución Rápida (2 minutos)**

### **Paso 1: Habilitar edición temporalmente**

Para probar si el problema es de permisos RLS:

```bash
1. Abre Supabase → SQL Editor
2. Ejecuta: HABILITAR_EDICION_CONTRATOS_TEMPORAL.sql
3. Intenta editar un contrato en tu aplicación
```

#### **¿Funcionó?**

- ✅ **SÍ funciona** → El problema era RLS. Ve al Paso 2.
- ❌ **NO funciona** → El problema es otro. Ve al Paso 3.

---

### **Paso 2: Aplicar permisos RLS correctos**

Si funcionó con el script temporal, ahora aplica las políticas seguras:

```bash
1. Abre Supabase → SQL Editor
2. Ejecuta: FIX_RLS_CORRECTO.sql
3. Recarga tu aplicación (Ctrl + F5)
4. Prueba editar de nuevo
```

**✅ Ahora deberías poder editar con seguridad.**

---

### **Paso 3: Diagnóstico profundo**

Si el Paso 1 no funcionó, necesitamos más información:

```bash
1. Abre Supabase → SQL Editor
2. Ejecuta: DIAGNOSTICO_EDICION_CONTRATOS.sql
3. Toma CAPTURA DE PANTALLA de los resultados
4. También captura el error en la CONSOLA del navegador (F12)
```

#### **Errores comunes en la consola:**

| Error | Causa | Solución |
|-------|-------|----------|
| `403 Forbidden` | RLS bloquea UPDATE | Ejecutar `FIX_RLS_CORRECTO.sql` |
| `400 Bad Request` | Datos inválidos | Verificar formato JSON |
| `422 Unprocessable Entity` | Campo no existe | Verificar columna `contract_content` |
| `500 Internal Server Error` | Error de servidor | Ver logs en Supabase |

---

## 🔧 **Verificaciones Adicionales**

### **1. Verificar que ejecutaste el script RLS**

```sql
-- En Supabase SQL Editor:
SELECT 
  policyname,
  cmd 
FROM pg_policies 
WHERE tablename = 'rental_contracts' 
  AND cmd = 'UPDATE';
```

**Deberías ver:**
- `contracts_update_related` ✅

Si NO ves esta política, ejecuta `FIX_RLS_CORRECTO.sql`

---

### **2. Verificar tu usuario en el contrato**

```sql
-- En Supabase SQL Editor:
SELECT 
  rc.id,
  a.applicant_id,
  p.owner_id,
  auth.uid() as tu_id,
  CASE 
    WHEN p.owner_id = auth.uid() THEN '✅ Eres propietario'
    WHEN a.applicant_id = auth.uid() THEN '✅ Eres aplicante'
    ELSE '❌ Sin permisos'
  END as estado
FROM rental_contracts rc
JOIN applications a ON a.id = rc.application_id
JOIN properties p ON p.id = a.property_id
WHERE rc.id = 'TU_CONTRACT_ID_AQUI';
```

Reemplaza `TU_CONTRACT_ID_AQUI` con el ID real del contrato.

---

### **3. Verificar columna contract_content**

```sql
-- En Supabase SQL Editor:
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
  AND column_name = 'contract_content';
```

**Debe ser:**
- `data_type`: `jsonb` o `json` ✅
- `is_nullable`: `YES` ✅

Si no existe, ejecuta:

```sql
ALTER TABLE rental_contracts 
ADD COLUMN IF NOT EXISTS contract_content jsonb;
```

---

## 🎯 **Estructura correcta de contract_content**

El campo `contract_content` debe tener esta estructura JSON:

```json
{
  "sections": [
    {
      "id": "parties",
      "title": "I. COMPARECIENTES",
      "content": "<p>Contenido HTML...</p>"
    },
    {
      "id": "property",
      "title": "II. BIEN ARRENDADO",
      "content": "<p>Contenido HTML...</p>"
    }
    // ... más secciones
  ]
}
```

---

## 🚨 **Errores Específicos y Soluciones**

### **Error: "Failed to update rental_contracts"**

**Causa:** RLS bloqueando UPDATE

**Solución:**
```bash
1. Ejecuta: HABILITAR_EDICION_CONTRATOS_TEMPORAL.sql
2. Si funciona, ejecuta: FIX_RLS_CORRECTO.sql
```

---

### **Error: "column 'contract_content' does not exist"**

**Causa:** Falta la columna en la tabla

**Solución:**
```sql
ALTER TABLE rental_contracts 
ADD COLUMN contract_content jsonb;
```

---

### **Error: "invalid input syntax for type json"**

**Causa:** El JSON está malformado

**Solución:**
1. Verifica en la consola del navegador el JSON que se está enviando
2. Asegúrate de que el `ContractEditor` esté enviando JSON válido

---

### **Error: "row-level security policy for table 'rental_contracts'"**

**Causa:** No tienes permisos para editar este contrato específico

**Solución:**
```bash
Solo puedes editar contratos donde:
- Eres el dueño de la propiedad (owner_id)
- O eres el aplicante (applicant_id)

Verifica con el diagnóstico del Paso 3.
```

---

## 📋 **Checklist de Verificación**

Antes de reportar un problema, verifica:

- [ ] ¿Ejecutaste `FIX_RLS_CORRECTO.sql`?
- [ ] ¿Recargaste la aplicación (Ctrl + F5)?
- [ ] ¿Eres propietario o aplicante del contrato?
- [ ] ¿Existe la columna `contract_content` en `rental_contracts`?
- [ ] ¿Hay algún error en la consola del navegador (F12)?
- [ ] ¿Ejecutaste el diagnóstico completo?

---

## 🎬 **Proceso Completo Paso a Paso**

### **Para resolver el 95% de los casos:**

```bash
# 1. Aplicar permisos RLS correctos
En Supabase → SQL Editor:
  → Ejecutar: FIX_RLS_CORRECTO.sql

# 2. Recargar aplicación
En navegador:
  → Ctrl + F5

# 3. Probar edición
En tu app:
  → Ir a un contrato
  → Click "Editar"
  → Hacer cambios
  → Click "Guardar Cambios"

# 4. Si no funciona
En navegador:
  → F12 (abrir consola)
  → Ver errores en rojo
  → Copiar el mensaje completo
```

---

## 📞 **¿Necesitas más ayuda?**

Si después de seguir estos pasos aún no funciona:

1. **Ejecuta el diagnóstico:**
   ```bash
   DIAGNOSTICO_EDICION_CONTRATOS.sql
   ```

2. **Captura de pantalla de:**
   - ✅ Resultados del diagnóstico
   - ✅ Error en consola del navegador (F12)
   - ✅ Error en Network tab (pestaña Response)

3. **Envía la información** y te ayudaré a resolver el problema específico.

---

**Fecha:** 3 de octubre, 2025  
**Archivos relacionados:**
- `FIX_RLS_CORRECTO.sql` - Permisos RLS correctos
- `HABILITAR_EDICION_CONTRATOS_TEMPORAL.sql` - Para debugging
- `DIAGNOSTICO_EDICION_CONTRATOS.sql` - Diagnóstico completo
- `src/components/contracts/ContractEditor.tsx` - Componente de edición

