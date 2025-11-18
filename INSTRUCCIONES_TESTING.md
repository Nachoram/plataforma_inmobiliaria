# Instrucciones de Testing: Corrección "Valores numéricos inválidos"

## 🎯 Objetivo del Testing

Verificar que los formularios de propiedades ahora funcionan correctamente con todos los tipos de propiedad y manejan adecuadamente campos vacíos, opcionales y numéricos.

---

## 🚀 Preparación

### 1. Verificar que los archivos están actualizados

```bash
git status
```

Deberías ver modificados:
- `src/components/properties/RentalPublicationForm.tsx`
- `src/components/properties/PropertyForm.tsx`

### 2. Instalar dependencias (si es necesario)

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

---

## 🧪 Casos de Prueba

### ✅ Test 1: Bodega SIN metros útiles (debe funcionar)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Bodega**
3. Llenar campos obligatorios:
   - Dirección completa
   - Calle y número
   - Región y comuna
   - **M² de la Bodega**: `8.5`
   - **Número de Bodega**: `B-115`
   - Precio: `50000`
   - Descripción (opcional para Bodega)
4. **NO llenar**: M² Útiles (debería estar oculto o no requerido)
5. Subir al menos 1 foto
6. Click "Publicar"

**Resultado esperado**: ✅ 
- Éxito: "Propiedad publicada exitosamente"
- En consola: Ver `🏠 PropertyData to submit:` con `metros_utiles: null`
- NO ver error "Valores numéricos inválidos"

**Resultado anterior**: ❌ Error "Valores numéricos inválidos"

---

### ✅ Test 2: Estacionamiento SIN metros (debe funcionar)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Estacionamiento**
3. Llenar campos obligatorios:
   - Dirección completa
   - Calle y número
   - Región y comuna
   - Precio: `25000`
   - Descripción
4. **NO llenar**: M² Útiles ni M² Totales (deberían estar ocultos)
5. Subir al menos 1 foto
6. Click "Publicar"

**Resultado esperado**: ✅
- Éxito: "Propiedad publicada exitosamente"
- En consola: `metros_utiles: null`, `metros_totales: null`
- `bedrooms: 0`, `bathrooms: 0`, `estacionamientos: 0`

**Resultado anterior**: ❌ Error "Valores numéricos inválidos"

---

### ✅ Test 3: Parcela SIN metros útiles (debe funcionar)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Parcela**
3. Llenar campos obligatorios:
   - Dirección completa
   - Calle y número
   - Región y comuna
   - **M² Totales del Terreno**: `5000`
   - Precio: `500000`
   - Descripción
4. **NO llenar**: M² Útiles (debería estar oculto o marcado como opcional)
5. Subir al menos 1 foto
6. Click "Publicar"

**Resultado esperado**: ✅
- Éxito: "Propiedad publicada exitosamente"
- En consola: `metros_utiles: null`, `metros_totales: 5000`

**Resultado anterior**: ❌ Error "Valores numéricos inválidos"

---

### ✅ Test 4: Casa con TODOS los campos (debe funcionar)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Casa**
3. Llenar TODOS los campos:
   - Dirección, calle, número, departamento
   - Región y comuna
   - **M² Útiles**: `45.5`
   - **M² Totales**: `55.0`
   - Dormitorios: `2`
   - Baños: `1`
   - Estacionamientos: `1`
   - Ubicación estacionamiento: `E-23`
   - Tiene terraza: `Sí`
   - Precio: `600000`
   - Gastos comunes: `50000`
   - Descripción completa
4. Subir fotos
5. Click "Publicar"

**Resultado esperado**: ✅
- Éxito: "Propiedad publicada exitosamente"
- Todos los campos con valores correctos en consola
- `metros_utiles: 45.5`, `metros_totales: 55.0`

**Resultado anterior**: ✅ Funcionaba (pero ahora más robusto)

---

### ✅ Test 5: Casa con 0 dormitorios (debe funcionar y guardar 0)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Casa**
3. Llenar campos con:
   - **Dormitorios**: `0` (seleccionar 0 del dropdown)
   - Resto de campos normales
4. Click "Publicar"

**Resultado esperado**: ✅
- En consola: `bedrooms: 0` (no `1` como antes)
- Propiedad creada con 0 dormitorios

**Resultado anterior**: ⚠️ Se guardaba `bedrooms: 1` (incorrecto)

---

### ✅ Test 6: Departamento sin gastos comunes (debe funcionar)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Departamento**
3. Llenar todos los campos EXCEPTO:
   - **Gastos comunes**: Dejar vacío
4. Click "Publicar"

**Resultado esperado**: ✅
- En consola: `common_expenses_clp: 0`
- No error

**Resultado anterior**: ⚠️ Posible error o valor incorrecto

---

### ❌ Test 7: Casa SIN metros útiles (debe fallar con mensaje claro)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Casa**
3. Llenar todos los campos EXCEPTO:
   - **M² Útiles**: Dejar vacío
4. Click "Publicar"

**Resultado esperado**: ❌
- Error: "Los M² Útiles son requeridos para este tipo de propiedad"
- NO error "Valores numéricos inválidos"

**Resultado anterior**: ❌ Error "Valores numéricos inválidos" (mensaje genérico)

---

### ❌ Test 8: Propiedad SIN precio (debe fallar con mensaje claro)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar cualquier tipo
3. Llenar todos los campos EXCEPTO:
   - **Precio**: Dejar vacío
4. Click "Publicar"

**Resultado esperado**: ❌
- Error: "El precio es requerido y debe ser mayor a 0"
- Mensaje claro y específico

**Resultado anterior**: ❌ Error "Valores numéricos inválidos" (mensaje genérico)

---

### ✅ Test 9: Decimales en metros (debe funcionar)

**Pasos**:
1. Ir a "Publicar Propiedad en Arriendo"
2. Seleccionar tipo: **Departamento**
3. Ingresar valores decimales:
   - **M² Útiles**: `45.75`
   - **M² Totales**: `52.25`
4. Completar resto de campos
5. Click "Publicar"

**Resultado esperado**: ✅
- En consola: `metros_utiles: 45.75`, `metros_totales: 52.25`
- Valores guardados correctamente como decimales

---

## 🔍 Verificaciones en Consola del Navegador

Abrir las DevTools (F12) y verificar:

### 1. Antes de enviar el formulario:
```javascript
// Verificar que los inputs tienen valores correctos
document.querySelector('[name="metrosUtiles"]').value
document.querySelector('[name="metrosTotales"]').value
document.querySelector('[name="price"]').value
```

### 2. Al enviar el formulario:
Buscar en la consola el log:
```
🏠 PropertyData to submit: { ... }
```

**Verificar que**:
- ✅ NO hay campos con valor `NaN`
- ✅ Campos vacíos son `null` (no `undefined` ni `""`)
- ✅ Números son `number` (no strings)
- ✅ Campos booleanos son `true`/`false` (no strings)

### 3. Si hay error:
```
❌ Error: [mensaje del error]
```

**Verificar que**:
- ✅ El mensaje es específico y claro
- ✅ NO dice "Valores numéricos inválidos" (a menos que sea un valor realmente inválido)

---

## 📊 Tabla de Resultados (llenar durante el testing)

| Test | Tipo Propiedad | Resultado | Notas |
|------|----------------|-----------|-------|
| 1 | Bodega sin m² útiles | ⬜ PASS / ⬜ FAIL | |
| 2 | Estacionamiento sin metros | ⬜ PASS / ⬜ FAIL | |
| 3 | Parcela sin m² útiles | ⬜ PASS / ⬜ FAIL | |
| 4 | Casa con todos los campos | ⬜ PASS / ⬜ FAIL | |
| 5 | Casa con 0 dormitorios | ⬜ PASS / ⬜ FAIL | |
| 6 | Depto sin gastos comunes | ⬜ PASS / ⬜ FAIL | |
| 7 | Casa sin m² útiles (error) | ⬜ PASS / ⬜ FAIL | |
| 8 | Sin precio (error) | ⬜ PASS / ⬜ FAIL | |
| 9 | Decimales en metros | ⬜ PASS / ⬜ FAIL | |

---

## 🐛 Si encuentras un Bug

### 1. Capturar información
- Screenshot del formulario
- Screenshot del error
- Console logs completos
- Datos ingresados

### 2. Verificar en consola
```javascript
// Ver el propertyData que se está enviando
// (aparece justo antes del error)
```

### 3. Comparar con documentación
- Ver `SOLUCION_VALORES_NUMERICOS_INVALIDOS.md`
- Ver `EJEMPLO_ANTES_DESPUES.md`

### 4. Reportar con:
- Tipo de propiedad
- Campos llenados/vacíos
- Mensaje de error exacto
- Log de consola `🏠 PropertyData to submit:`

---

## ✅ Criterios de Éxito

El testing es exitoso si:

1. ✅ Todos los tests marcados como "debe funcionar" funcionan
2. ✅ Todos los tests marcados como "debe fallar" fallan con mensajes claros
3. ✅ NO aparece nunca "Valores numéricos inválidos" para campos opcionales
4. ✅ Los valores en consola son siempre `number | null` (nunca `NaN`)
5. ✅ Se pueden crear propiedades de TODOS los tipos sin errores

---

## 📝 Checklist Final

Antes de considerar completo:

- [ ] Ejecutados todos los 9 tests
- [ ] Verificado logs en consola para cada test
- [ ] Verificado en base de datos que los valores se guardaron correctamente
- [ ] Probado en diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Probado en móvil (responsive)
- [ ] Sin errores en consola del navegador
- [ ] Sin errores de TypeScript/linter

---

## 🚀 Siguiente Paso

Una vez completado el testing con éxito:

1. ✅ Marcar tests como PASS
2. 📸 Tomar screenshots de éxito
3. 📋 Documentar cualquier issue menor
4. ✅ Aprobar para staging/producción

**¡Mucha suerte con el testing!** 🎉

---

**Referencia rápida**:
- Docs técnicas: `SOLUCION_VALORES_NUMERICOS_INVALIDOS.md`
- Ejemplos código: `EJEMPLO_ANTES_DESPUES.md`
- Resumen ejecutivo: `RESUMEN_EJECUTIVO.md`
























