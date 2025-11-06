# Ejemplo: Antes y Después de la Corrección

## ❌ CÓDIGO ANTERIOR (CON ERRORES)

### Problema 1: Parseo sin manejo de valores vacíos

```typescript
// ❌ INCORRECTO - genera NaN cuando el string está vacío
const metrosUtiles = parseInt(formData.metrosUtiles); // "" → NaN
const metrosTotales = parseInt(formData.metrosTotales); // "" → NaN
const price = parseFloat(formData.price); // "" → NaN

// Validación que siempre falla para campos opcionales vacíos
if (isNaN(price) || isNaN(metrosUtiles) || isNaN(metrosTotales)) {
  throw new Error('Valores numéricos inválidos'); // ❌ Siempre lanza error
}
```

**Resultado**: Error "Valores numéricos inválidos" cada vez que un campo opcional está vacío.

---

### Problema 2: Uso incorrecto del operador `||`

```typescript
// ❌ INCORRECTO - convierte 0 en null
propertyData.metros_utiles = metrosUtiles || null; // 0 → null (incorrecto)
propertyData.metros_totales = metrosTotales || null; // 0 → null (incorrecto)
propertyData.bedrooms = formData.bedrooms || 1; // 0 → 1 (incorrecto)
```

**Resultado**: Valores `0` legítimos se convierten en `null` o defaults incorrectos.

---

### Problema 3: Asignación sin validación por tipo de propiedad

```typescript
// ❌ INCORRECTO - No considera el tipo de propiedad
propertyData.metros_utiles = formData.useful_area || null; // puede ser NaN
propertyData.metros_totales = formData.total_area || null; // puede ser NaN

// Para Bodega, metros_utiles debería ser null, pero se envía NaN o undefined
if (formData.property_type === 'Bodega') {
  // No se limpia metros_utiles
}
```

**Resultado**: Campos que no aplican al tipo de propiedad se envían con valores incorrectos.

---

## ✅ CÓDIGO NUEVO (CORREGIDO)

### Solución 1: Función helper para parseo seguro

```typescript
// ✅ CORRECTO - retorna null si está vacío o es inválido
const parseNumber = (value: string | number | undefined, isInteger = false): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const numValue = typeof value === 'number' ? value : (isInteger ? parseInt(value) : parseFloat(value));
  return isNaN(numValue) ? null : numValue;
};

// Uso seguro
const metrosUtiles = parseNumber(formData.metrosUtiles, true); // "" → null ✅
const metrosTotales = parseNumber(formData.metrosTotales, true); // "" → null ✅
const price = parseNumber(formData.price, false); // "" → null ✅
```

**Resultado**: Nunca genera `NaN`, siempre retorna `number | null`.

---

### Solución 2: Validación condicional por tipo de propiedad

```typescript
// ✅ CORRECTO - Solo valida campos requeridos
const isStorage = formData.tipoPropiedad === 'Bodega';
const isParking = formData.tipoPropiedad === 'Estacionamiento';
const isStandardProperty = !isStorage && !isParking;

// Precio siempre requerido
if (price === null || price <= 0) {
  throw new Error('El precio es requerido y debe ser mayor a 0');
}

// M² Útiles solo requerido para propiedades estándar
if (isStandardProperty && (metrosUtiles === null || metrosUtiles <= 0)) {
  throw new Error('Los M² Útiles son requeridos para este tipo de propiedad');
}

// M² Totales requerido para todos excepto Estacionamiento
if (!isParking && (metrosTotales === null || metrosTotales <= 0)) {
  throw new Error('Los M² Totales son requeridos para este tipo de propiedad');
}
```

**Resultado**: Solo valida lo que realmente es requerido según el contexto.

---

### Solución 3: Asignación correcta según tipo de propiedad

```typescript
// ✅ CORRECTO - Asignación explícita según tipo
if (formData.tipoPropiedad === 'Bodega') {
  propertyData.bedrooms = 0;
  propertyData.bathrooms = 0;
  propertyData.estacionamientos = 0;
  propertyData.metros_utiles = null; // ✅ Explícitamente null (no aplica)
  propertyData.metros_totales = metrosTotales; // ✅ number | null parseado
  propertyData.tiene_terraza = false;
}

else if (formData.tipoPropiedad === 'Estacionamiento') {
  propertyData.bedrooms = 0;
  propertyData.bathrooms = 0;
  propertyData.estacionamientos = 0;
  propertyData.metros_utiles = null; // ✅ No aplica
  propertyData.metros_totales = null; // ✅ No aplica
  propertyData.tiene_terraza = false;
}

else if (formData.tipoPropiedad === 'Parcela') {
  propertyData.bedrooms = 0;
  propertyData.bathrooms = 0;
  propertyData.estacionamientos = parkingSpaces; // ✅ number parseado
  propertyData.metros_utiles = null; // ✅ No aplica para Parcela
  propertyData.metros_totales = metrosTotales; // ✅ Requerido (validado arriba)
  propertyData.tiene_terraza = formData.tieneTerraza === 'Sí';
}

else {
  // Casa, Departamento, Oficina, Local Comercial
  propertyData.bedrooms = bedrooms; // ✅ number parseado
  propertyData.bathrooms = bathrooms; // ✅ number parseado
  propertyData.estacionamientos = parkingSpaces; // ✅ number parseado
  propertyData.metros_utiles = metrosUtiles; // ✅ Requerido (validado arriba)
  propertyData.metros_totales = metrosTotales; // ✅ Requerido (validado arriba)
  propertyData.ano_construccion = anoConstruccion; // ✅ number | null opcional
}
```

**Resultado**: Cada tipo de propiedad envía exactamente los campos correctos con los tipos correctos.

---

## 📊 Comparación de Resultados

### Escenario 1: Bodega con metros_utiles vacío

| Campo | ANTES ❌ | DESPUÉS ✅ |
|-------|---------|-----------|
| `metros_utiles` | `NaN` (error) | `null` (correcto) |
| `metros_totales` | `10` | `10` |
| **Resultado** | ❌ Error "Valores numéricos inválidos" | ✅ Inserción exitosa |

---

### Escenario 2: Estacionamiento sin metros

| Campo | ANTES ❌ | DESPUÉS ✅ |
|-------|---------|-----------|
| `metros_utiles` | `NaN` (error) | `null` (correcto) |
| `metros_totales` | `NaN` (error) | `null` (correcto) |
| `bedrooms` | `1` (incorrecto) | `0` (correcto) |
| **Resultado** | ❌ Error "Valores numéricos inválidos" | ✅ Inserción exitosa |

---

### Escenario 3: Casa con bedrooms = 0

| Campo | ANTES ❌ | DESPUÉS ✅ |
|-------|---------|-----------|
| `bedrooms` | `1` (forzado por `\|\|`) | `0` (correcto) |
| `metros_utiles` | `45.5` | `45.5` |
| `metros_totales` | `55.0` | `55.0` |
| **Resultado** | ⚠️ Datos incorrectos en BD | ✅ Datos correctos |

---

### Escenario 4: Parcela con metros_utiles vacío

| Campo | ANTES ❌ | DESPUÉS ✅ |
|-------|---------|-----------|
| `metros_utiles` | `NaN` (error) | `null` (correcto) |
| `metros_totales` | `1000` | `1000` |
| `bedrooms` | `1` (incorrecto) | `0` (correcto) |
| **Resultado** | ❌ Error "Valores numéricos inválidos" | ✅ Inserción exitosa |

---

## 🔍 Debugging: Antes vs Después

### ANTES ❌

```typescript
console.log({
  metrosUtiles: parseInt(""), // NaN
  metrosTotales: parseInt(""), // NaN
  bedrooms: "" || 1, // 1
  bathrooms: 0 || 1 // 1 (incorrecto!)
});

// Output: { metrosUtiles: NaN, metrosTotales: NaN, bedrooms: 1, bathrooms: 1 }
// Error: "Valores numéricos inválidos"
```

### DESPUÉS ✅

```typescript
console.log('🏠 PropertyData to submit:', JSON.stringify(propertyData, null, 2));

// Output:
// {
//   "metros_utiles": null,
//   "metros_totales": 10,
//   "bedrooms": 0,
//   "bathrooms": 1,
//   "price_clp": 50000,
//   "common_expenses_clp": 0
// }
// ✅ Inserción exitosa
```

---

## 💡 Lecciones Aprendidas

### 1. **Nunca usar `parseInt()` / `parseFloat()` sin validación**
```typescript
// ❌ MALO
const num = parseInt(value);

// ✅ BUENO
const num = value ? parseInt(value) : null;

// ✅ MEJOR
const parseNumber = (v) => v && !isNaN(parseInt(v)) ? parseInt(v) : null;
```

### 2. **Nunca usar `||` para defaults numéricos**
```typescript
// ❌ MALO - convierte 0 en default
const bedrooms = formData.bedrooms || 1; // 0 → 1

// ✅ BUENO - usa nullish coalescing
const bedrooms = formData.bedrooms ?? 1; // 0 → 0, null → 1

// ✅ MEJOR - asignación explícita
const bedrooms = formData.bedrooms !== undefined ? formData.bedrooms : 1;
```

### 3. **Validar según el contexto, no genéricamente**
```typescript
// ❌ MALO - valida todos los campos igual
if (isNaN(metros_utiles)) throw new Error('Error');

// ✅ BUENO - valida según tipo de propiedad
if (isStandardProperty && !metros_utiles) {
  throw new Error('M² Útiles requeridos para este tipo');
}
```

### 4. **Siempre usar `number | null`, nunca `NaN` o `undefined`**
```typescript
// ❌ MALO
interface PropertyData {
  metros_utiles: number; // puede ser undefined o NaN
}

// ✅ BUENO
interface PropertyData {
  metros_utiles: number | null; // siempre definido
}
```

---

## ✅ Checklist de Implementación

Para cualquier formulario que envíe datos numéricos a la BD:

- [ ] Crear función `parseNumber()` helper
- [ ] Parsear TODOS los campos numéricos con la función helper
- [ ] Validar solo los campos REQUERIDOS según el contexto
- [ ] Asignar explícitamente `null` para campos que no aplican
- [ ] Nunca usar `||` para defaults numéricos (usar `??` o asignación explícita)
- [ ] Agregar logging para debugging
- [ ] Probar casos edge: valores vacíos, 0, negativos, decimales
- [ ] Verificar que ningún campo sea `NaN`, `undefined`, o `""`

---

**Conclusión**: La clave está en el **manejo robusto de valores vacíos** y la **validación condicional según el contexto**. Nunca asumir que un campo numérico siempre tendrá un valor válido.

















