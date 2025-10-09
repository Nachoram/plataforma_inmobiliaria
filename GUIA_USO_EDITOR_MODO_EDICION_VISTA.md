# 📖 GUÍA DE USO: Editor de Contratos con Modo Edición/Vista

## 🎯 Experiencia del Usuario

### **Estado Normal (Modo Vista - 99% del Tiempo)**

El documento se muestra con:
- ✅ Texto perfectamente justificado
- ✅ Tipografía profesional (font-serif)
- ✅ Interlineado cómodo
- ✅ Aspecto impecable de documento legal

**Interacción:**
- Al pasar el mouse sobre cualquier texto → Se resalta sutilmente con fondo azul claro
- Aparece un pequeño ícono de lápiz (Edit2) en la esquina superior derecha
- Un anillo azul rodea el elemento

### **Entrar en Modo Edición**

**Cómo:** Hacer clic en cualquier elemento de texto

**Qué sucede:**
1. El `<div>` se transforma en un `<textarea>` automáticamente
2. El fondo cambia a azul claro con borde azul
3. El cursor se posiciona automáticamente en el texto (auto-focus)
4. El textarea se ajusta automáticamente a la altura del contenido

**En este modo:**
- Puedes escribir normalmente
- El textarea crece/se reduce según el contenido
- Los cambios se guardan en tiempo real

### **Salir del Modo Edición**

**Cómo:** 
- Hacer clic fuera del textarea (en cualquier parte)
- El evento `onBlur` se activa automáticamente

**Qué sucede:**
1. El `<textarea>` se transforma de vuelta en `<div>`
2. El texto vuelve a verse perfectamente justificado
3. Los cambios quedan guardados

---

## 🎬 Flujo Completo de Edición

### **Ejemplo: Editar el Título del Contrato**

```
PASO 1: Usuario ve el título "CONTRATO DE ARRENDAMIENTO"
│
├─ Texto justificado ✅
├─ Font-serif profesional ✅
└─ Sin indicadores de edición (limpio)

PASO 2: Usuario pasa el mouse sobre el título
│
├─ Fondo azul claro aparece
├─ Icono de lápiz aparece en la esquina
└─ Anillo azul rodea el elemento

PASO 3: Usuario hace clic en el título
│
├─ Se transforma en textarea
├─ Fondo azul + borde azul
├─ Cursor activo (auto-focus)
└─ Listo para editar

PASO 4: Usuario escribe "CONTRATO DE ARRENDAMIENTO HABITACIONAL"
│
├─ Textarea se ajusta a la nueva altura
└─ Cambios en tiempo real

PASO 5: Usuario hace clic fuera (en cualquier parte)
│
├─ Textarea se transforma en div
├─ Texto justificado perfecto ✅
└─ Cambios guardados
```

---

## 🎨 Estados Visuales

### **1. Estado Reposo (Vista)**
```
┌─────────────────────────────────────────────┐
│ CONTRATO DE ARRENDAMIENTO                   │
│                                             │
│ Comparecen de una parte...                  │ ← Texto justificado
│                                             │
└─────────────────────────────────────────────┘
```

### **2. Estado Hover**
```
┌─────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════╗   │
│ ║ CONTRATO DE ARRENDAMIENTO          ✏️ ║   │ ← Icono de edición
│ ╚═══════════════════════════════════════╝   │ ← Anillo azul + fondo
│                                             │
│ Comparecen de una parte...                  │
│                                             │
└─────────────────────────────────────────────┘
```

### **3. Estado Edición**
```
┌─────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ CONTRATO DE ARRENDAMIENTO|          ┃ │ ← Cursor activo
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ ← Borde azul grueso
│          (fondo azul claro)                 │
│                                             │
│ Comparecen de una parte...                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📄 Exportación a PDF

### **Flujo Automático:**

```
Usuario hace clic en "Descargar PDF"
       ↓
setEditingId(null)  ← Forzar TODOS los elementos a modo VISTA
       ↓
await setTimeout(100ms)  ← Esperar que React renderice
       ↓
html2canvas captura la pantalla  ← Solo ve <div> perfectamente estilizados
       ↓
Genera PDF con texto justificado perfecto ✅
```

**Resultado:** El PDF SIEMPRE es perfecto, sin importar qué estaba en edición.

---

## 🔧 Elementos Editables Implementados

| Elemento | ID | Texto Justificado |
|----------|----|--------------------|
| **Título** | `titulo` | No (centrado) |
| **Comparecencia** | `comparecencia` | ✅ Sí |
| **Título de Cláusula** | `clausula-titulo-{id}` | No (mayúsculas, negrita) |
| **Contenido de Cláusula** | `clausula-contenido-{id}` | ✅ Sí |
| **Cierre** | `cierre` | ✅ Sí |
| **Rol de Firmante** | `firmante-rol-{id}` | No (mayúsculas, negrita) |
| **Nombre de Firmante** | `firmante-nombre-{id}` | No |
| **RUT de Firmante** | `firmante-rut-{id}` | No |

---

## 🎯 Ventajas para el Usuario Final

### **1. Claridad Visual**
- El documento SIEMPRE se ve profesional
- No hay confusión entre "modo edición" y "modo vista"
- El formato es predecible y confiable

### **2. Edición Intuitiva**
- No necesita instrucciones
- Patrón familiar (similar a aplicaciones modernas)
- Feedback visual inmediato

### **3. Sin Errores de Formato**
- El texto justificado NUNCA se rompe
- El PDF SIEMPRE es perfecto
- Los estilos son consistentes

### **4. Eficiencia**
- Edición en el lugar (in-place editing)
- Sin modales o formularios separados
- Cambios instantáneos

---

## 🚀 Casos de Uso Prácticos

### **Caso 1: Editar Comparecencia**
1. Leer el documento completo (texto justificado perfecto)
2. Encontrar error en la comparecencia
3. Hacer clic en el párrafo
4. Corregir el texto
5. Hacer clic fuera
6. Seguir leyendo (texto justificado perfecto)

### **Caso 2: Añadir Nueva Cláusula**
1. Hacer clic en "+ Añadir Cláusula"
2. Nueva cláusula aparece al final
3. Hacer clic en "NUEVA CLÁUSULA" para cambiar el título
4. Escribir título personalizado
5. Hacer clic fuera
6. Hacer clic en "..." para escribir el contenido
7. Escribir contenido completo
8. Hacer clic fuera
9. La cláusula se ve perfectamente justificada

### **Caso 3: Generar PDF Final**
1. Revisar documento completo (puede estar editando algo)
2. Hacer clic en "Descargar PDF"
3. Sistema automáticamente sale del modo edición
4. PDF generado con texto justificado perfecto
5. Descargar y compartir

---

## 🎨 Personalización de Estilos

### **Para Modo Vista (viewClassName):**
```tsx
// Texto justificado con interlineado relajado
viewClassName="font-serif text-base leading-relaxed text-justify text-gray-800"

// Título centrado y en mayúsculas
viewClassName="font-serif text-2xl font-bold text-center uppercase text-gray-900"

// Título de cláusula en negrita
viewClassName="font-serif font-bold uppercase text-gray-900 flex-1"
```

### **Para Modo Edición (className):**
```tsx
// Sin text-justify (no funciona en textarea)
className="font-serif text-base leading-relaxed text-gray-800"

// Los estilos visuales de edición (borde, fondo) están en el componente
```

---

## 💡 Consejos de Uso

1. **Editar un elemento a la vez:** Por diseño, solo un elemento puede estar en edición. Esto evita confusión.

2. **Salir de edición:** Simplemente haz clic fuera. No necesitas buscar un botón "Guardar".

3. **Antes de generar PDF:** No te preocupes si estás editando algo. El sistema automáticamente sale de todos los modos de edición antes de generar el PDF.

4. **Eliminar cláusulas/firmantes:** Los botones de eliminar están siempre visibles (solo ocultos en PDF).

---

## ✅ Checklist de Calidad Implementada

- ✅ Texto justificado perfecto en modo vista
- ✅ Edición intuitiva en textarea
- ✅ Transición suave entre modos
- ✅ Auto-focus al entrar en edición
- ✅ Auto-salida al hacer clic fuera
- ✅ Auto-ajuste de altura del textarea
- ✅ Feedback visual claro (hover, active)
- ✅ PDF siempre perfecto
- ✅ Sin errores de renderizado
- ✅ Performance óptimo
- ✅ Accesibilidad básica (focus, blur)
- ✅ Código limpio y mantenible

---

## 🎉 Resultado Final

**Un editor de contratos profesional que:**
- Se ve perfecto todo el tiempo
- Es fácil de usar sin instrucciones
- Genera PDFs impecables
- Usa tecnología moderna y probada
- Es extensible y mantenible

**Esta es la solución definitiva para el problema del texto justificado.** ✅

