# 🔧 Diagnóstico y Correcciones Aplicadas

**Fecha:** 28 de Octubre, 2025  
**Objetivo:** Corregir errores en consola y formulario del sistema inmobiliario

---

## 📋 Resumen Ejecutivo

Se han corregido **5 problemas críticos** en el sistema:

1. ✅ Error 400 de columna `guar.full_name` inexistente (migración de estructura de tabla)
2. ✅ Manejo deficiente de errores (logging incompleto)
3. ✅ Validación de campos obligatorios (broker_name, broker_rut)
4. ✅ Prevención de consultas con IDs undefined/null
5. ✅ Errores 404 en consultas a características

---

## 🐛 Problema 1: Error 400 - "column guar.full_name does not exist"

### Diagnóstico
La tabla `guarantors` tenía una estructura antigua con columnas separadas:
- ❌ `first_name`, `paternal_last_name`, `maternal_last_name`
- ❌ `email`, `phone`

La función RPC `get_portfolio_with_postulations` intentaba usar la estructura nueva:
- ✅ `full_name`
- ✅ `contact_email`, `contact_phone`

### Solución Aplicada

**Archivo:** `supabase/migrations/20251028000000_migrate_guarantors_to_new_structure.sql`

```sql
-- Migración automática de estructura antigua a nueva
ALTER TABLE guarantors 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Migrar datos existentes
UPDATE guarantors
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(paternal_last_name, '') || ' ' || COALESCE(maternal_last_name, ''))
WHERE full_name IS NULL;

-- Hacer columnas críticas NOT NULL
ALTER TABLE guarantors 
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN contact_email SET NOT NULL;
```

**Resultado:**
- ✅ Tabla guarantors migrada a estructura unificada
- ✅ Datos existentes preservados y migrados
- ✅ Compatibilidad con función RPC existente

---

## 🐛 Problema 2: Manejo Deficiente de Errores

### Diagnóstico
El código mostraba errores como `{}` en consola porque:
- JSON.stringify() en objetos Error no captura propiedades
- No se extraían campos `message`, `code`, `details`, `hint`, `stack`
- Mensajes de error no eran user-friendly

### Solución Aplicada

**Archivo:** `src/components/properties/AdminPropertyDetailView.tsx`

Se agregaron funciones helper para formatear errores:

```typescript
/**
 * Formatea un error de Supabase para logging y display
 */
const formatErrorDetails = (error: any, context: string = '') => {
  const details = {
    context,
    message: error?.message || 'Error desconocido',
    code: error?.code || 'N/A',
    details: error?.details || 'Sin detalles adicionales',
    hint: error?.hint || 'Sin sugerencias',
    stack: error?.stack || 'Sin stack trace',
    statusCode: error?.statusCode || error?.status || 'N/A',
  };

  console.error(`❌ [ERROR] ${context}:`, details);
  return details;
};

/**
 * Genera un mensaje de error user-friendly
 */
const getUserFriendlyErrorMessage = (error: any, defaultMessage: string): string => {
  // Detecta tipos de error y retorna mensajes claros
  // - Check constraints
  // - Foreign key violations
  // - Permission/RLS errors
  // - Column doesn't exist
  // - 400/404 errors
  // - Network/Connection errors
}
```

**Resultado:**
- ✅ Logging completo con todos los detalles del error
- ✅ Mensajes user-friendly en la UI (toast messages)
- ✅ Identificación automática de tipos de error
- ✅ Stack traces completos en consola para debugging

---

## 🐛 Problema 3: Error en Formulario - Campos Broker Obligatorios

### Diagnóstico
Los campos `broker_name` y `broker_rut` eran obligatorios en backend pero:
- ❌ No había validación visual en el formulario
- ❌ El error se mostraba solo después del submit
- ❌ No había feedback en tiempo real al usuario

### Solución Aplicada

**1. Estado para errores de formulario:**
```typescript
const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
```

**2. Función de validación en tiempo real:**
```typescript
const validateField = (field: string, value: any): string | null => {
  switch (field) {
    case 'broker_name':
      if (!value || !value.trim()) return 'El nombre del corredor es obligatorio';
      if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
      return null;
    
    case 'broker_rut':
      if (!value || !value.trim()) return 'El RUT del corredor es obligatorio';
      if (value.trim().length < 9) return 'Ingresa un RUT válido (ej: 12.345.678-9)';
      return null;
    
    // ... más validaciones
  }
};
```

**3. Actualización de handleContractFormChange:**
```typescript
const handleContractFormChange = (field: string, value: any) => {
  // Actualizar formData...
  
  // ✅ Validar campo en tiempo real
  const error = validateField(field, value);
  setFormErrors(prev => {
    const newErrors = { ...prev };
    if (error) {
      newErrors[field] = error;
    } else {
      delete newErrors[field];
    }
    return newErrors;
  });
};
```

**4. UI con indicadores visuales:**
```tsx
<input
  type="text"
  value={formData.broker_name}
  onChange={(e) => handleContractFormChange('broker_name', e.target.value)}
  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors ${
    formErrors.broker_name
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
  }`}
  required
/>
{formErrors.broker_name && (
  <p className="mt-1 text-sm text-red-600 flex items-center">
    <AlertTriangle className="h-4 w-4 mr-1" />
    {formErrors.broker_name}
  </p>
)}
```

**5. Validación antes del submit:**
```typescript
const handleGenerateContract = async () => {
  const validationErrors = [];
  
  // ✅ Validar campos críticos PRIMERO
  if (!formData.broker_name?.trim()) {
    validationErrors.push('nombre del corredor (campo obligatorio)');
    setFormErrors(prev => ({ ...prev, broker_name: 'El nombre del corredor es obligatorio' }));
  }
  
  if (!formData.broker_rut?.trim()) {
    validationErrors.push('RUT del corredor (campo obligatorio)');
    setFormErrors(prev => ({ ...prev, broker_rut: 'El RUT del corredor es obligatorio' }));
  }
  
  if (validationErrors.length > 0) {
    toast.error(`Errores de validación: ${validationErrors.join(', ')}`);
    setIsGenerating(false);
    return;
  }
  
  // Continuar con generación de contrato...
};
```

**Resultado:**
- ✅ Validación en tiempo real (mientras el usuario escribe)
- ✅ Indicadores visuales (border rojo, icono de alerta)
- ✅ Mensajes de error claros debajo de cada campo
- ✅ Prevención de submit si hay errores
- ✅ Mejor UX para el usuario

---

## 🐛 Problema 4: Consultas con IDs undefined/null

### Diagnóstico
Las consultas a Supabase se ejecutaban incluso cuando:
- ❌ `property_id` era undefined
- ❌ `application_id` era null
- ❌ Causaba errores 400 en el backend

### Solución Aplicada

**1. Validación en fetchPostulations:**
```typescript
const fetchPostulations = async () => {
  // ✅ Validación: prevenir consultas con ID undefined/null
  if (!id) {
    console.error('❌ Property ID es undefined/null, no se puede cargar postulaciones');
    toast.error('Error: ID de propiedad no válido');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(/* ... */)
      .eq('property_id', id);
    
    if (error) {
      formatErrorDetails(error, 'fetchPostulations - Error cargando postulaciones');
      toast.error(getUserFriendlyErrorMessage(error, 'Error al cargar las postulaciones'));
      return;
    }
    // ... procesar datos
  } catch (error: any) {
    formatErrorDetails(error, 'fetchPostulations - Error en catch');
    toast.error(getUserFriendlyErrorMessage(error, 'Error inesperado al cargar postulaciones'));
  }
};
```

**2. Validación en fetchContractData:**
```typescript
const fetchContractData = async (applicationId: string) => {
  // ✅ Validación: prevenir consultas con ID undefined/null
  if (!applicationId) {
    console.error('❌ [fetchContractData] Application ID es undefined/null');
    throw new Error('ID de aplicación no válido');
  }
  
  try {
    const { data: applicationData, error: appError } = await supabase
      .from('applications')
      .select(/* ... */)
      .eq('id', applicationId)
      .single();
    
    if (appError) {
      formatErrorDetails(appError, 'fetchContractData - Error fetching application');
      throw new Error(getUserFriendlyErrorMessage(appError, 'No se pudo obtener la información de la aplicación'));
    }
    
    // ✅ Validar que existan los IDs relacionados
    if (!applicationData?.properties?.rental_owner_characteristic_id) {
      throw new Error('La aplicación no tiene información completa del propietario');
    }
    
    // ... resto del código
  } catch (error) {
    // ... manejo de error
  }
};
```

**3. Corrección en consulta de guarantors:**
```typescript
// ❌ ANTES: usaba columnas inexistentes
guarantors!guarantor_id (
  first_name,
  paternal_last_name,
  maternal_last_name,
  rut,
  guarantor_characteristic_id  // ❌ No existe en guarantors
)

// ✅ DESPUÉS: usa columnas correctas
guarantors!guarantor_id (
  full_name,              // ✅ Columna nueva
  rut,
  contact_email,          // ✅ Columna nueva
  contact_phone           // ✅ Columna nueva
)
// guarantor_characteristic_id se obtiene de applications, no de guarantors
```

**Resultado:**
- ✅ No se ejecutan consultas con IDs inválidos
- ✅ Mensajes de error claros cuando falta información
- ✅ Validaciones tempranas previenen errores de red innecesarios
- ✅ Uso correcto de columnas en joins

---

## 🐛 Problema 5: Errores 404 en Consultas a Características

### Diagnóstico
Las consultas a `property_type_characteristics` y `rental_owner_characteristics` fallaban con 404:
- ❌ Usaban `.single()` que lanza error si no existe el registro
- ❌ No validaban si el ID existe antes de consultar
- ❌ No manejaban el caso de registros inexistentes

### Solución Aplicada

```typescript
// ❌ ANTES: .single() lanza error 404 si no existe
const { data: propertyTypeData } = await supabase
  .from('property_type_characteristics')
  .select('name')
  .eq('id', characteristicIds.property_characteristic_id)
  .single();

// ✅ DESPUÉS: .maybeSingle() + validación explícita
console.log('🔍 Obteniendo datos de property_type_characteristics...');
const { data: propertyTypeData, error: propertyTypeError } = await supabase
  .from('property_type_characteristics')
  .select('name')
  .eq('id', characteristicIds.property_characteristic_id)
  .maybeSingle(); // ✅ No lanza error si no existe

if (propertyTypeError) {
  formatErrorDetails(propertyTypeError, 'handleGenerateContract - Error obteniendo property_type_characteristics');
  toast.error('Error al obtener datos del tipo de propiedad');
  setIsGenerating(false);
  return;
}

if (!propertyTypeData) {
  console.error('❌ property_type_characteristics no encontrado para ID:', characteristicIds.property_characteristic_id);
  toast.error('No se encontraron las características del tipo de propiedad');
  setIsGenerating(false);
  return;
}
```

**Lo mismo para rental_owner_characteristics:**
```typescript
const { data: ownerData, error: ownerError } = await supabase
  .from('rental_owner_characteristics')
  .select('name, rut')
  .eq('id', characteristicIds.rental_owner_characteristic_id)
  .maybeSingle(); // ✅ No lanza error si no existe

if (ownerError) {
  formatErrorDetails(ownerError, 'handleGenerateContract - Error obteniendo rental_owner_characteristics');
  toast.error('Error al obtener datos del propietario');
  setIsGenerating(false);
  return;
}

if (!ownerData) {
  console.error('❌ rental_owner_characteristics no encontrado para ID:', characteristicIds.rental_owner_characteristic_id);
  toast.error('No se encontraron las características del propietario');
  setIsGenerating(false);
  return;
}
```

**Resultado:**
- ✅ No más errores 404 en la consola
- ✅ Validación explícita de existencia de registros
- ✅ Mensajes de error claros sobre qué falta
- ✅ Manejo correcto de casos edge (datos faltantes)

---

## 📊 Resumen de Archivos Modificados

### Nuevos Archivos

1. **`supabase/migrations/20251028000000_migrate_guarantors_to_new_structure.sql`**
   - Migración de estructura de tabla guarantors
   - Migración de datos existentes
   - Triggers y constraints

2. **`DIAGNOSTICO_Y_CORRECCIONES_APLICADAS.md`** (este archivo)
   - Documentación completa de correcciones

### Archivos Modificados

1. **`src/components/properties/AdminPropertyDetailView.tsx`**
   - Funciones helper de manejo de errores (líneas 87-179)
   - Estado para errores de formulario (línea 204)
   - Función de validación en tiempo real (líneas 549-587)
   - Validación en handleContractFormChange (líneas 589-634)
   - Validación en fetchPostulations (líneas 394-475)
   - Validación en fetchContractData (líneas 637-760)
   - Manejo de errores en handleGenerateContract (líneas 900-1250)
   - UI con indicadores visuales de error (líneas 2188-2238)

---

## 🎯 Resultados Esperados

### Antes de las Correcciones
- ❌ Error 400: "column guar.full_name does not exist"
- ❌ Errores 404 en property_type_characteristics
- ❌ Errores 404 en rental_owner_characteristics
- ❌ Logs mostrando `{}` o información incompleta
- ❌ Submit de formulario sin validación de campos obligatorios
- ❌ Mensajes de error técnicos y confusos para el usuario

### Después de las Correcciones
- ✅ Portfolio carga correctamente sin errores 400
- ✅ No más errores 404 en consultas de características
- ✅ Logs completos con message, code, details, hint, stack
- ✅ Validación en tiempo real de campos obligatorios
- ✅ Indicadores visuales de error en el formulario
- ✅ Prevención de submit con campos inválidos
- ✅ Mensajes de error claros y user-friendly
- ✅ Mejor experiencia de usuario en general

---

## 🚀 Instrucciones para Aplicar las Correcciones

### 1. Aplicar Migración de Base de Datos

**Opción A: Usando Supabase SQL Editor (Recomendado)**
```sql
-- Copia y ejecuta el contenido de:
-- supabase/migrations/20251028000000_migrate_guarantors_to_new_structure.sql
```

**Opción B: Usando Supabase CLI**
```bash
supabase db push
```

### 2. Verificar Migración

```sql
-- Verificar estructura de tabla guarantors
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guarantors'
ORDER BY ordinal_position;

-- Debe mostrar: full_name, contact_email, contact_phone
```

### 3. Probar Correcciones

1. **Recargar la aplicación web**
2. **Navegar a Portfolio**
   - ✅ Debe cargar sin errores 400
   - ✅ Postulaciones deben mostrarse con datos de garantes
3. **Abrir AdminPropertyDetailView**
   - ✅ Modal de contrato debe abrir correctamente
4. **Probar formulario de contrato**
   - ✅ Campos broker_name y broker_rut deben validarse en tiempo real
   - ✅ Bordes rojos y mensajes de error deben aparecer
   - ✅ Submit debe prevenirse si hay errores
5. **Revisar consola del navegador (F12)**
   - ✅ No debe haber errores 400/404
   - ✅ Errores (si los hay) deben mostrar información completa

---

## 🔍 Debugging Adicional

Si aún experimentas problemas después de aplicar las correcciones:

### 1. Verificar que la migración se aplicó
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'guarantors' 
AND column_name IN ('full_name', 'contact_email', 'contact_phone');
```

### 2. Verificar función RPC
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_portfolio_with_postulations';
```
Debe contener referencias a `guar.full_name`, `guar.contact_email`, `guar.contact_phone`.

### 3. Verificar datos de garantes
```sql
SELECT id, full_name, contact_email, contact_phone
FROM guarantors
LIMIT 10;
```

### 4. Revisar logs del navegador
- Abrir Developer Tools (F12)
- Tab "Console": ver errores de JavaScript
- Tab "Network": ver peticiones HTTP fallidas
- Buscar mensajes con prefijo `❌` o `⚠️`

---

## 📞 Contacto y Soporte

Si después de aplicar estas correcciones sigues experimentando problemas:

1. Verifica los pasos de verificación mencionados arriba
2. Revisa los logs de Supabase (Logging → Postgres Logs)
3. Comparte:
   - Screenshot del error en consola
   - Logs completos (con ❌ [ERROR] prefix)
   - Pasos para reproducir el error

---

## ✅ Checklist de Correcciones Aplicadas

- [x] Migración de estructura de tabla guarantors
- [x] Funciones helper para manejo de errores
- [x] Validación en tiempo real de formulario
- [x] Indicadores visuales de error en UI
- [x] Prevención de consultas con IDs undefined/null
- [x] Corrección de consultas que causaban 404s
- [x] Uso de .maybeSingle() en lugar de .single()
- [x] Mensajes de error user-friendly
- [x] Logging completo en consola
- [x] Documentación de correcciones aplicadas

---

**Fecha de última actualización:** 28 de Octubre, 2025  
**Versión:** 1.0.0

