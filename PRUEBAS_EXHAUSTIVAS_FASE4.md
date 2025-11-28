# 🧪 PRUEBAS EXHAUSTIVAS - FASE 4: Validación Completa

## 🎯 OBJETIVO
Validar completamente la implementación de estacionamientos y bodegas para Casa, Departamento y Oficina.

## 🌐 ACCESO A LA APLICACIÓN
- **URL**: `http://localhost:5173`
- **Servidor**: ✅ Corriendo en puerto 5173
- **Ruta de prueba**: `/property/new/rental`

---

## 📋 PROTOCOLO DE PRUEBAS

### **PRECONDICIONES:**
1. ✅ Servidor de desarrollo corriendo
2. ✅ Usuario autenticado en la aplicación
3. ✅ Navegador actualizado

### **DATOS DE PRUEBA:**
- **Dirección**: Calle Test 123, Santiago
- **Precio**: $500.000
- **Gastos comunes**: $50.000
- **Dormitorios**: 3
- **Baños**: 2

---

## 🧪 **PRUEBA 1: CASA - Validación Completa**

### **Pasos:**
1. Ir a `http://localhost:5173/property/new/rental`
2. Seleccionar **"Casa"** como tipo de propiedad
3. Llenar información básica (dirección, precio, dormitorios, baños)
4. Desplazarse a la **sección "Espacios de la Propiedad"**

### **Validaciones Esperadas:**

#### **Sección "Estacionamientos":**
- ✅ **Título**: "Estacionamientos"
- ✅ **Subtítulo**: "Configura los espacios de estacionamiento disponibles"
- ✅ **Contador inicial**: "0 de 10 espacios configurados"
- ✅ **Botón**: "Agregar Espacio" (habilitado)

#### **Sección "Espacios de Almacenamiento":**
- ✅ **Título**: "Espacios de Almacenamiento"
- ✅ **Subtítulo**: "Configura bodegas y espacios de almacenamiento disponibles"
- ✅ **Contador inicial**: "0 de 5 bodegas configuradas"
- ✅ **Botón**: "Agregar Bodega" (habilitado)

### **Pruebas Funcionales:**

#### **Estacionamientos:**
1. **Agregar 2 espacios de estacionamiento:**
   - Espacio 1: Número "E-01", Tipo "Techado", Ubicación "Subsuelo", Costo "5000"
   - Espacio 2: Número "E-02", Tipo "Descubierto", Ubicación "Primer piso", Costo "3000"
   - ✅ Contador: "2 de 10 espacios configurados"
   - ✅ Validación: Números únicos, campos requeridos

2. **Intentar agregar más de 10:**
   - Agregar 9 espacios más (total 11)
   - ❌ Botón "Agregar Espacio" debe deshabilitarse
   - ❌ Mensaje de error: "Máximo 10 espacios de estacionamiento permitidos"

#### **Bodegas:**
1. **Agregar 2 espacios de bodega:**
   - Bodega 1: Número "B-01", Tamaño "15 m²", Ubicación "Primer piso", Descripción "Bodega amplia"
   - Bodega 2: Número "B-02", Tamaño "8 m²", Ubicación "Subsuelo", Descripción "Bodega pequeña"
   - ✅ Contador: "2 de 5 bodegas configuradas"
   - ✅ Validación: Números únicos, metros cuadrados > 0

2. **Intentar agregar más de 5:**
   - Agregar 4 bodegas más (total 6)
   - ❌ Botón "Agregar Bodega" debe deshabilitarse
   - ❌ Mensaje de error: "Máximo 5 espacios de bodega permitidos"

### **Prueba de Envío:**
1. **Completar formulario** con datos básicos + espacios
2. **Hacer clic en "Publicar Propiedad"**
3. ✅ **Validación**: Campos requeridos pasan
4. ✅ **Guardado**: Mensaje de éxito
5. ✅ **Persistencia**: Datos guardados en BD (verificar logs en consola)

---

## 🧪 **PRUEBA 2: DEPARTAMENTO - Validación Completa**

### **Pasos:**
1. Repetir proceso de **PRUEBA 1** pero seleccionar **"Departamento"**
2. ✅ **Verificar**: Sección "Espacios de la Propiedad" aparece
3. ✅ **Verificar**: Ambas sub-secciones (estacionamientos + bodegas) funcionan igual
4. ✅ **Probar**: Límite de 10 estacionamientos y 5 bodegas
5. ✅ **Probar**: Envío y persistencia funcionan

---

## 🧪 **PRUEBA 3: OFICINA - Validación Completa**

### **Pasos:**
1. Repetir proceso de **PRUEBA 1** pero seleccionar **"Oficina"**
2. ✅ **Verificar**: Sección "Espacios de la Propiedad" aparece
3. ✅ **Verificar**: Ambas sub-secciones funcionan igual
4. ✅ **Probar**: Límite de 10 estacionamientos y 5 bodegas
5. ✅ **Probar**: Envío y persistencia funcionan

---

## 🧪 **PRUEBA 4: TIPOS EXCLUIDOS - Validación**

### **Bodega:**
1. Seleccionar **"Bodega"** como tipo
2. ❌ **Verificar**: NO aparece sección "Espacios de la Propiedad"
3. ✅ **Verificar**: Aparece sección "Estacionamientos" normal (solo parking)

### **Parcela:**
1. Seleccionar **"Parcela"** como tipo
2. ❌ **Verificar**: NO aparece sección "Espacios de la Propiedad"
3. ✅ **Verificar**: Aparece sección "Estacionamientos" normal (solo parking)

### **Estacionamiento:**
1. Seleccionar **"Estacionamiento"** como tipo
2. ❌ **Verificar**: NO aparece ninguna sección de espacios

### **Local Comercial:**
1. Seleccionar **"Local Comercial"** como tipo
2. ❌ **Verificar**: NO aparece sección "Espacios de la Propiedad"
3. ✅ **Verificar**: Campo simple de estacionamientos (si corresponde)

---

## 🧪 **PRUEBA 5: LÍMITES Y VALIDACIONES**

### **Límites de Espacios:**
1. **Estacionamientos**: Verificar límite estricto de 10
2. **Bodegas**: Verificar límite estricto de 5
3. ✅ **Botones deshabilitados** cuando se alcanza el límite
4. ✅ **Mensajes de error** informativos

### **Validaciones de Campos:**
1. **Estacionamientos**:
   - ✅ Número requerido y único
   - ✅ Ubicación requerida
   - ✅ Costo adicional opcional, no negativo

2. **Bodegas**:
   - ✅ Número requerido y único
   - ✅ Tamaño en m² requerido y > 0
   - ✅ Ubicación requerida
   - ✅ Descripción opcional

### **Validaciones de Formulario:**
- ✅ Campos requeridos marcados con *
- ✅ Mensajes de error específicos
- ✅ No se puede enviar sin completar campos requeridos

---

## 🧪 **PRUEBA 6: PERSISTENCIA DE DATOS**

### **Verificación en Base de Datos:**
1. **Después de publicar** una propiedad con espacios:
   - ✅ Verificar logs en consola del navegador
   - ✅ Confirmar llamadas a `saveParkingSpaces` y `saveStorageSpaces`
   - ✅ Verificar datos enviados a Supabase

### **Campos en BD:**
```sql
-- Verificar que se guarden correctamente:
SELECT parking_spaces, storage_spaces FROM properties WHERE id = 'id_de_la_propiedad';
```

### **Estructura esperada:**
```json
{
  "parking_spaces": [
    {"id": "...", "number": "E-01", "type": "techado", "location": "Subsuelo", "additionalCost": 5000}
  ],
  "storage_spaces": [
    {"id": "...", "number": "B-01", "size_m2": 15, "location": "Primer piso", "description": "..."}
  ]
}
```

---

## 📊 **CHECKLIST DE VALIDACIÓN**

### **Funcionalidad:**
- [ ] Sección "Espacios de la Propiedad" aparece solo para Casa/Departamento/Oficina
- [ ] Ambas sub-secciones (estacionamientos + bodegas) funcionan
- [ ] Contadores actualizan correctamente (0 de 10, 0 de 5)
- [ ] Botones de agregar funcionan
- [ ] Límites se respetan (10 parking, 5 storage)
- [ ] Validaciones de campos funcionan
- [ ] Formulario se envía correctamente

### **Interfaz de Usuario:**
- [ ] Iconos diferenciados (Car azul, Archive ámbar)
- [ ] Textos descriptivos claros
- [ ] Estados visuales correctos (habilitado/deshabilitado)
- [ ] Mensajes de error informativos
- [ ] Responsive design funciona

### **Persistencia:**
- [ ] Datos se guardan en BD
- [ ] Logs de consola muestran llamadas correctas
- [ ] Estructura JSON correcta en campos parking_spaces y storage_spaces
- [ ] Propiedades existentes no se ven afectadas

---

## 🎯 **CRITERIOS DE ÉXITO**

### **Mínimos Requeridos:**
- ✅ **Casa/Departamento/Oficina**: Muestran sección unificada
- ✅ **Funcionalidad básica**: Agregar/remover espacios funciona
- ✅ **Validaciones**: Campos requeridos validados
- ✅ **Persistencia**: Datos se guardan correctamente
- ✅ **Límites**: Se respetan los límites establecidos

### **Criterios Óptimos:**
- ✅ **UX perfecta**: Interfaz intuitiva y responsive
- ✅ **Validaciones robustas**: Todos los edge cases cubiertos
- ✅ **Performance**: Sin lag al agregar múltiples espacios
- ✅ **Compatibilidad**: Funciona en todos los navegadores modernos

---

## 🚨 **REPORTES DE BUGS**

Si encuentras algún problema, documenta:

```
**Tipo de propiedad:** Casa/Departamento/Oficina
**Paso donde falla:** [descripción]
**Comportamiento esperado:** [qué debería pasar]
**Comportamiento actual:** [qué pasa en realidad]
**Captura/logs:** [si aplica]
```

---

## ✅ **SIGN OFF**

Una vez completadas todas las pruebas exitosamente:

- ✅ **Funcionalidad validada**
- ✅ **Interfaz de usuario probada**
- ✅ **Persistencia confirmada**
- ✅ **Compatibilidad verificada**

**Estado:** ✅ **LISTO PARA PRODUCCIÓN**

---

*Fecha de pruebas: $(date)*
*Versión probada: Commit 8adbe08*
*Testers: [Nombres]*
