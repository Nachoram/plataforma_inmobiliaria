# ✅ CHECKLIST DE PRUEBAS: Sistema Modo Edición/Vista

## 🎯 Objetivo

Validar que el sistema de modo edición/vista funciona perfectamente en todos los escenarios posibles.

---

## 📋 SECCIÓN 1: Pruebas de Visualización (Modo Vista)

### 1.1 Texto Justificado
- [ ] **Comparecencia** muestra texto justificado perfecto
- [ ] **Contenido de cada cláusula** muestra texto justificado perfecto
- [ ] **Cierre** muestra texto justificado perfecto
- [ ] Texto NO justificado en elementos que no lo necesitan (títulos, nombres)

### 1.2 Tipografía
- [ ] Font-serif aplicado en todos los elementos
- [ ] Título en mayúsculas y centrado
- [ ] Títulos de cláusulas en mayúsculas y negrita
- [ ] Interlineado cómodo (leading-relaxed) en párrafos

### 1.3 Efectos Hover
- [ ] Al pasar mouse sobre cualquier elemento → fondo azul claro aparece
- [ ] Al pasar mouse → anillo azul aparece alrededor del elemento
- [ ] Al pasar mouse → icono de lápiz (Edit2) aparece en esquina superior derecha
- [ ] Al quitar el mouse → efectos desaparecen suavemente
- [ ] Cursor cambia a pointer sobre elementos editables

---

## 📋 SECCIÓN 2: Pruebas de Edición (Modo Edición)

### 2.1 Entrada al Modo Edición
- [ ] Hacer clic en **título** → se transforma en textarea
- [ ] Hacer clic en **comparecencia** → se transforma en textarea
- [ ] Hacer clic en **título de cláusula** → se transforma en textarea
- [ ] Hacer clic en **contenido de cláusula** → se transforma en textarea
- [ ] Hacer clic en **cierre** → se transforma en textarea
- [ ] Hacer clic en **rol de firmante** → se transforma en textarea
- [ ] Hacer clic en **nombre de firmante** → se transforma en textarea
- [ ] Hacer clic en **RUT de firmante** → se transforma en textarea

### 2.2 Características del Textarea
- [ ] Textarea tiene fondo azul claro (bg-blue-50)
- [ ] Textarea tiene borde azul grueso (border-2 border-blue-300)
- [ ] Cursor se posiciona automáticamente en el texto (auto-focus)
- [ ] Altura del textarea se ajusta al contenido inicial
- [ ] Textarea no tiene scrollbar visible (overflow-hidden)

### 2.3 Edición de Contenido
- [ ] Escribir texto → textarea crece automáticamente
- [ ] Borrar texto → textarea se reduce automáticamente
- [ ] Escribir párrafo largo → textarea mantiene todo visible sin scroll
- [ ] Copiar y pegar texto extenso → textarea se ajusta correctamente
- [ ] Caracteres especiales (ñ, á, é, etc.) se muestran correctamente

### 2.4 Salida del Modo Edición
- [ ] Hacer clic fuera del textarea → vuelve a modo vista
- [ ] Presionar Tab → enfoca siguiente elemento (si existe) o sale de edición
- [ ] Hacer clic en otro elemento editable → elemento anterior vuelve a vista, nuevo entra en edición
- [ ] Cambios se guardan automáticamente al salir

### 2.5 Exclusividad de Edición
- [ ] Solo un elemento puede estar en edición a la vez
- [ ] Al editar elemento A y hacer clic en elemento B → A vuelve a vista, B entra en edición
- [ ] No es posible tener dos textareas visibles simultáneamente

---

## 📋 SECCIÓN 3: Pruebas de Funcionalidad Dinámica

### 3.1 Añadir Cláusulas
- [ ] Hacer clic en "+ Añadir Cláusula" → nueva cláusula aparece al final
- [ ] Nueva cláusula tiene valores por defecto ("NUEVA CLÁUSULA", "...")
- [ ] Hacer clic en título de nueva cláusula → entra en modo edición
- [ ] Editar título → cambios se guardan
- [ ] Hacer clic en contenido de nueva cláusula → entra en modo edición
- [ ] Editar contenido → texto se muestra justificado al salir

### 3.2 Eliminar Cláusulas
- [ ] Botón de eliminar (🗑️) visible en cada cláusula
- [ ] Hacer clic en eliminar → cláusula desaparece
- [ ] Si cláusula estaba en edición y se elimina → no hay errores
- [ ] Eliminar todas las cláusulas → no hay errores (array vacío)

### 3.3 Añadir Firmantes
- [ ] Hacer clic en "+ Añadir Firmante" → nuevo firmante aparece al final
- [ ] Nuevo firmante tiene valores por defecto (rol: "AVAL", nombre y RUT vacíos)
- [ ] Editar rol, nombre y RUT del nuevo firmante → cambios se guardan

### 3.4 Eliminar Firmantes
- [ ] Botón de eliminar (🗑️) visible en cada firmante
- [ ] Hacer clic en eliminar → firmante desaparece
- [ ] Eliminar firmante mientras se edita → no hay errores

---

## 📋 SECCIÓN 4: Pruebas de Generación de PDF

### 4.1 Preparación del Documento
- [ ] Con un elemento en modo edición → hacer clic en "Descargar PDF"
- [ ] Elemento en edición vuelve automáticamente a modo vista
- [ ] Espera breve (100ms) antes de capturar
- [ ] Botones de edición y eliminar NO aparecen en el PDF

### 4.2 Calidad del PDF
- [ ] Abrir PDF descargado → texto de comparecencia está justificado
- [ ] Texto de cláusulas está justificado
- [ ] Texto de cierre está justificado
- [ ] Títulos están centrados/alineados correctamente
- [ ] No hay textareas visibles en el PDF
- [ ] No hay iconos de lápiz visibles
- [ ] No hay botones de eliminar visibles
- [ ] Font-serif se mantiene en el PDF

### 4.3 Estructura del PDF
- [ ] Márgenes de 15mm en todos los lados
- [ ] Formato A4
- [ ] Si el documento es largo → múltiples páginas generadas correctamente
- [ ] Paginación correcta (sin cortes en medio de palabras)
- [ ] Nombre del archivo: "contrato-final.pdf"

---

## 📋 SECCIÓN 5: Pruebas de Edge Cases

### 5.1 Contenido Vacío
- [ ] Dejar título vacío → placeholder "TÍTULO DEL CONTRATO" aparece en gris
- [ ] Dejar comparecencia vacía → placeholder aparece
- [ ] Dejar contenido de cláusula vacío → placeholder aparece
- [ ] Placeholder NO aparece en el PDF si está vacío

### 5.2 Contenido Muy Largo
- [ ] Escribir comparecencia de 1000+ palabras → textarea se ajusta
- [ ] Volver a modo vista → texto justificado sin errores
- [ ] Generar PDF con contenido largo → múltiples páginas correctas

### 5.3 Contenido con Formato Especial
- [ ] Texto con saltos de línea → se mantienen al cambiar de modo
- [ ] Texto con múltiples espacios → se respetan
- [ ] Texto con caracteres especiales (©, ®, €, $) → se muestran correctamente

### 5.4 Múltiples Cláusulas y Firmantes
- [ ] Añadir 10+ cláusulas → todas editables individualmente
- [ ] Añadir 5+ firmantes → todos editables individualmente
- [ ] Eliminar cláusula del medio → IDs únicos se mantienen consistentes
- [ ] Generar PDF con muchas cláusulas → documento completo y coherente

### 5.5 Interacciones Rápidas
- [ ] Hacer clic rápido en múltiples elementos → solo el último entra en edición
- [ ] Hacer doble clic en elemento → entra en edición normalmente (no duplica)
- [ ] Hacer clic en "Descargar PDF" múltiples veces seguidas → solo genera un PDF

---

## 📋 SECCIÓN 6: Pruebas de Compatibilidad

### 6.1 Navegadores
- [ ] **Chrome/Edge:** Todo funciona perfectamente
- [ ] **Firefox:** Todo funciona perfectamente
- [ ] **Safari:** Todo funciona perfectamente

### 6.2 Responsive
- [ ] Viewport 1920px → documento se ve bien
- [ ] Viewport 1366px → documento se ve bien
- [ ] Viewport 1024px → documento se ve bien (puede requerir scroll horizontal)

### 6.3 Performance
- [ ] Cambiar entre modos → transición instantánea (<50ms)
- [ ] Auto-ajuste de textarea → sin lag visible
- [ ] Añadir/eliminar cláusulas → operación instantánea
- [ ] Generar PDF → completa en <5 segundos

---

## 📋 SECCIÓN 7: Pruebas de Accesibilidad Básica

### 7.1 Teclado
- [ ] Presionar Tab → navega entre elementos editables
- [ ] Hacer clic y escribir → texto aparece normalmente
- [ ] Seleccionar texto con Shift+Arrow → funciona
- [ ] Ctrl+A (seleccionar todo) en textarea → funciona
- [ ] Ctrl+C / Ctrl+V (copiar/pegar) → funciona

### 7.2 Focus
- [ ] Elemento en foco tiene indicador visual claro (borde azul)
- [ ] Al hacer clic fuera → focus se pierde y elemento vuelve a vista
- [ ] Focus no se queda atrapado en un elemento

---

## 📋 SECCIÓN 8: Pruebas de Regresión

### 8.1 Funcionalidad Original
- [ ] Todas las funciones originales siguen funcionando
- [ ] Estado del contrato se actualiza correctamente
- [ ] Botones de la barra de herramientas funcionan
- [ ] Estilos globales no se han roto

### 8.2 Sin Errores en Consola
- [ ] Abrir DevTools → pestaña Console
- [ ] No hay errores rojos
- [ ] No hay warnings críticos de React
- [ ] No hay warnings de TypeScript

---

## 📋 RESUMEN DE PRUEBAS

| Categoría | Total Tests | Pasados | Pendientes | Fallidos |
|-----------|-------------|---------|------------|----------|
| Visualización | 13 | ⬜ | ⬜ | ⬜ |
| Edición | 21 | ⬜ | ⬜ | ⬜ |
| Funcionalidad Dinámica | 11 | ⬜ | ⬜ | ⬜ |
| Generación PDF | 11 | ⬜ | ⬜ | ⬜ |
| Edge Cases | 12 | ⬜ | ⬜ | ⬜ |
| Compatibilidad | 7 | ⬜ | ⬜ | ⬜ |
| Accesibilidad | 8 | ⬜ | ⬜ | ⬜ |
| Regresión | 5 | ⬜ | ⬜ | ⬜ |
| **TOTAL** | **88** | **⬜** | **⬜** | **⬜** |

---

## 🎯 Criterios de Aceptación

Para considerar la implementación como **EXITOSA**, deben cumplirse:

1. ✅ **Mínimo 95% de tests pasados** (84 de 88)
2. ✅ **Cero errores críticos** (bloqueantes)
3. ✅ **Texto justificado perfecto** en vista y PDF
4. ✅ **Sin errores en consola** del navegador
5. ✅ **PDF generado correctamente** en todos los casos

---

## 🚀 Instrucciones de Uso del Checklist

### **Para el Tester:**

1. Abre el checklist en un editor
2. Por cada prueba:
   - ✅ = Pasada (funciona correctamente)
   - ⚠️ = Con warnings (funciona pero con problemas menores)
   - ❌ = Fallida (no funciona como se espera)
   - ⏭️ = Omitida (no aplicable o sin recursos para probar)
3. Marca cada casilla con el emoji correspondiente
4. Anota observaciones específicas al lado de cada test si es necesario
5. Al final, completa la tabla de resumen

### **Para el Desarrollador:**

1. Revisa los tests fallidos (❌)
2. Prioriza arreglos por criticidad:
   - **Crítico:** Generación de PDF, texto justificado
   - **Alto:** Edición de contenido, transiciones
   - **Medio:** Efectos visuales, hover
   - **Bajo:** Edge cases raros
3. Arregla los problemas
4. Vuelve a ejecutar las pruebas
5. Repite hasta alcanzar 95%+ de tests pasados

---

## 📝 Plantilla de Reporte de Bug

Si encuentras un bug, usa esta plantilla:

```markdown
### Bug #[N]: [Título Descriptivo]

**Categoría:** [Visualización / Edición / PDF / etc.]

**Severidad:** [Crítica / Alta / Media / Baja]

**Descripción:**
[Descripción detallada del problema]

**Pasos para Reproducir:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Esperado:**
[Qué debería suceder]

**Resultado Actual:**
[Qué sucede realmente]

**Navegador/OS:**
[Chrome 120 / Windows 11]

**Screenshot/Video:**
[Si aplica]

**Prioridad de Arreglo:**
[Inmediata / Alta / Media / Baja]
```

---

## 🎉 Al Completar Todas las Pruebas

Si el resultado es **≥95% de tests pasados**:

🎊 **¡FELICIDADES!**

La implementación del sistema Modo Edición/Vista es un **ÉXITO TOTAL**.

El editor de contratos ahora ofrece:
- ✅ Texto justificado perfecto
- ✅ Edición intuitiva
- ✅ PDFs impecables
- ✅ UX de clase mundial

**Este checklist garantiza la calidad de la implementación.** 🚀

