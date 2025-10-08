# 📝 Guía de Edición de Contratos

## ✅ **FUNCIONALIDAD ACTUALIZADA**

Ahora puedes **editar los contratos** directamente desde la aplicación con un editor visual profesional que funciona tanto con contratos HTML generados por N8N como con contratos estructurados en JSON.

---

## 🎯 **CARACTERÍSTICAS**

### ✨ **Lo que puedes hacer:**

1. ✅ **Editar cualquier sección del contrato**
   - Comparecientes
   - Propiedad
   - Condiciones
   - Obligaciones
   - Término del contrato
   - Disposiciones legales

2. ✅ **Editor de texto rico (Quill)**
   - Negrita, cursiva, subrayado
   - Listas numeradas y con viñetas
   - Encabezados (h1, h2, h3)
   - Alineación de texto
   - Sangrías

3. ✅ **Optimización con contract_content (JSONB)**
   - Contratos nuevos usan solo `contract_content` para mayor eficiencia
   - Eliminación de duplicación de datos (HTML + JSON)
   - Generación on-demand de HTML para visualización
   - Compatibilidad total con contratos existentes

4. ✅ **Vista previa en tiempo real**
   - Ve cómo quedará el contrato antes de guardar
   - Cambia entre editor y vista previa

5. ✅ **Guardar automático en base de datos**
   - Los cambios se guardan en Supabase
   - Se actualiza automáticamente el contrato

6. ✅ **Interfaz intuitiva**
   - Tabs para cada sección
   - Indicador de progreso
   - Mensajes de éxito/error

---

## 🚀 **CÓMO USAR**

### **Paso 1: Abrir un Contrato**
1. Ve a **"Contratos"** en el menú
2. Haz clic en **"Ver"** en el contrato que quieras editar
3. **Nota:** Ahora funciona con todos los contratos, tanto HTML generados por N8N como contratos estructurados

### **Paso 2: Abrir el Editor**
1. En la vista del contrato, verás el botón **"Editar"**
2. Haz clic en **"Editar"**
3. El sistema detectará automáticamente el formato del contrato y abrirá el editor visual apropiado

### **Sobre el Flujo Optimizado**
**Para contratos nuevos (de N8N):**
- Se guarda **solo en `contract_content`** (JSONB) para optimización
- HTML se genera on-demand para visualización
- Menos almacenamiento y mejor rendimiento

**Para contratos HTML existentes:**
- Se mantiene compatibilidad total
- Conversión automática a formato editable
- Preservación completa del formato original

**Para contratos estructurados:**
- Múltiples secciones editables por separado
- Generación automática de HTML completo al guardar

### **Paso 3: Editar el Contrato**
1. **Para contratos HTML originales** (como los de N8N):
   - Verás un solo tab: **📄 Contrato Completo**
   - El contrato se mantiene **tal cual** sin dividir en secciones
   - Edita cualquier parte del documento directamente

2. **Para contratos estructurados**:
   - Selecciona una sección usando los tabs:
     - 👥 Comparecientes
     - 🏠 Propiedad
     - 📋 Condiciones
     - ✓ Obligaciones
     - ⏹ Término
     - ⚖️ Legal

3. **Edita el contenido** usando las herramientas:
   - **Negrita**: Selecciona texto y haz clic en **B**
   - **Listas**: Usa los botones de lista numerada (1,2,3) o viñetas (•)
   - **Encabezados**: Usa los dropdown de encabezados
   - **Alineación**: Centra, justifica o alinea el texto

### **Paso 4: Vista Previa**
1. Haz clic en **"👁 Vista Previa"**
2. Ve cómo quedará el contrato completo
3. Haz clic en **"Editor"** para volver a editar

### **Paso 5: Guardar los Cambios**
1. Cuando termines, haz clic en **"💾 Guardar Cambios"**
2. Verás un mensaje de éxito: ✅ "¡Cambios guardados exitosamente!"
3. El modal se cerrará automáticamente
4. El contrato se actualizará en la vista

---

## 🎨 **INTERFAZ DEL EDITOR**

```
╔═══════════════════════════════════════════════════════╗
║  Editar Contrato                    [Vista Previa] [X]║
╠═══════════════════════════════════════════════════════╣
║  [👥 Comparecientes] [🏠 Propiedad] [📋 Condiciones] ...║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  I. COMPARECIENTES                                    ║
║  ────────────────────────────────────                 ║
║                                                        ║
║  [B] [I] [U] [Lista] [Encabezado] [Alineación]      ║
║  ┌──────────────────────────────────────────────┐    ║
║  │ Escribe aquí el contenido...                │    ║
║  │                                              │    ║
║  │                                              │    ║
║  └──────────────────────────────────────────────┘    ║
║                                                        ║
║  💡 Consejo: Usa las herramientas de formato...      ║
║                                                        ║
╠═══════════════════════════════════════════════════════╣
║  3 de 6 secciones completadas   [Cancelar] [Guardar] ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🔧 **HERRAMIENTAS DEL EDITOR**

### **Barra de Herramientas:**

| Botón | Función | Atajo |
|-------|---------|-------|
| **B** | Negrita | Ctrl + B |
| **I** | Cursiva | Ctrl + I |
| **U** | Subrayado | Ctrl + U |
| **S̶** | Tachado | - |
| **1.** | Lista numerada | - |
| **•** | Lista con viñetas | - |
| **←** | Reducir sangría | - |
| **→** | Aumentar sangría | - |
| **⚏** | Alineación | - |
| **🧹** | Limpiar formato | - |

### **Encabezados:**

- **H1**: Título principal
- **H2**: Título de sección
- **H3**: Subtítulo
- **Normal**: Texto normal

---

## 💡 **CONSEJOS DE USO**

### ✅ **Buenas Prácticas:**

1. **Estructura con encabezados**
   ```
   H2: PRIMERA CLÁUSULA
   Normal: El arrendador se obliga a...
   ```

2. **Usa listas para obligaciones**
   ```
   El arrendatario se obliga a:
   1. Pagar la renta mensual
   2. Mantener la propiedad
   3. Cumplir con las normas
   ```

3. **Negrita para términos importantes**
   ```
   El **ARRENDADOR** y el **ARRENDATARIO** convienen...
   ```

4. **Guarda frecuentemente**
   - No esperes a terminar todo
   - Guarda después de cada sección importante

5. **Usa vista previa**
   - Revisa cómo se ve antes de guardar
   - Verifica el formato

---

## 📊 **INDICADORES**

### **Progreso de Secciones:**
En la parte inferior verás:
```
3 de 6 secciones completadas
```

Esto te muestra cuántas secciones tienen contenido.

### **Estados del Editor:**

| Mensaje | Significado |
|---------|-------------|
| ✅ ¡Cambios guardados exitosamente! | Todo bien |
| ⏳ Guardando... | Procesando |
| ❌ Error al guardar los cambios | Hubo un problema |

---

## 🎯 **EJEMPLOS DE EDICIÓN**

### **Ejemplo 1: Editar Comparecientes**

**Original:**
```
El Arrendador: Juan Pérez
El Arrendatario: María González
```

**Editado:**
```
PRIMERA: PARTES CONTRATANTES

En Santiago de Chile, a 3 de octubre de 2025, entre:

**ARRENDADOR**: Juan Pérez González, RUT 12.345.678-9,
domiciliado en Av. Providencia 1234, Santiago.

**ARRENDATARIO**: María González Castro, RUT 98.765.432-1,
domiciliada en Las Condes, Santiago.
```

### **Ejemplo 2: Formatear Obligaciones**

**Original:**
```
Pagar la renta, mantener la propiedad, cumplir normas
```

**Editado:**
```
El ARRENDATARIO se obliga a:

1. **Pagar puntualmente** la renta mensual acordada
2. **Mantener** la propiedad en buen estado
3. **Cumplir** con las normas de copropiedad
4. **Dar aviso** de cualquier desperfecto
```

---

## 🔒 **SEGURIDAD**

### **Consideraciones:**

1. ✅ Los cambios se guardan en la base de datos
2. ✅ Se actualiza el timestamp de modificación
3. ⚠️ **Próximamente:** Historial de versiones
4. ⚠️ **Próximamente:** Control de permisos por usuario

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Problema: No se guardan los cambios**

**Solución:**
1. Verifica tu conexión a internet
2. Revisa la consola del navegador (F12)
3. Asegúrate de tener permisos en la base de datos

### **Problema: El editor no carga**

**Solución:**
1. Recarga la página (F5)
2. Limpia la caché (Ctrl + Shift + R)
3. Verifica que Quill esté cargado

### **Problema: Formato no se guarda**

**Solución:**
1. Usa las herramientas del editor (no pegues desde Word)
2. Limpia el formato previo (botón 🧹)
3. Aplica formato nuevo

### **Problema: Vista previa no se actualiza**

**Solución:**
1. Cambia de tab y vuelve
2. Cierra y abre vista previa de nuevo

---

## 📚 **FORMATO DEL CONTRATO**

El contrato editado se guardará en formato JSON:

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
    },
    ...
  ]
}
```

---

## 🎓 **PRÓXIMAS MEJORAS**

### **En desarrollo:**

- [ ] **Historial de versiones** - Ver cambios anteriores
- [ ] **Control de permisos** - Solo usuarios autorizados
- [ ] **Plantillas** - Contratos predefinidos
- [ ] **Firmas digitales** - Integración con DocuSign
- [ ] **Comentarios** - Añadir notas al contrato
- [ ] **Comparar versiones** - Ver diferencias
- [ ] **Exportar Word** - Descargar como .docx

---

## 📞 **SOPORTE**

Si tienes problemas con el editor:

1. **Revisa esta guía** primero
2. **Consola del navegador** (F12 → Console)
3. **Verifica permisos** en Supabase
4. **Contacta soporte** con detalles del error

---

## ✅ **CHECKLIST DE USO**

Antes de editar un contrato:

- [ ] ¿Tienes el contrato abierto?
- [ ] ¿Hiciste clic en "Editar"?
- [ ] ¿Se abrió el modal del editor?
- [ ] ¿Puedes ver los tabs de secciones?
- [ ] ¿Las herramientas de formato funcionan?
- [ ] ¿Guardaste los cambios?
- [ ] ¿Viste el mensaje de éxito?

---

## 🎉 **¡LISTO PARA USAR!**

El editor de contratos está **completamente funcional** y listo para que edites tus contratos.

**Ubicación:**
```
Contratos → Ver Contrato → Botón "Editar" → Editor
```

**Archivos creados/modificados:**
- ✅ `src/components/contracts/ContractCanvasEditor.tsx` - **NUEVO** Editor Canvas tipo Gemini
- ✅ `src/components/contracts/ContractViewer.tsx` - Optimizado para JSONB estructurado
- ✅ `src/components/contracts/ContractEditor.tsx` - Guardado inteligente (detecta formato)
- ✅ `create_canvas_contract_example.js` - Script de ejemplo para N8N
- ✅ Eliminación completa de dependencia HTML
- ✅ Sistema puro JSONB con generación on-demand
- ✅ Interfaz visual intuitiva (letra 12, títulos negrita)
- ✅ Compatible con contratos existentes
- ✅ Sin errores de linting
- ✅ Listo para producción

---

**Fecha:** Octubre 8, 2025
**Versión:** 3.0.0
**Estado:** ✅ **ECOSISTEMA CANVAS COMPLETO - JSONB PURO**

---

## 🎨 **ECOSISTEMA OPTIMIZADO PARA JSONB**

### **Nuevo Formato Estructurado:**
```json
{
  "arrendador": {
    "nombre": "Martín Ignacio Pérez López",
    "rut": "20.456.789-1",
    "domicilio": "Santa Isabel 345 Depto. 1201, Santiago"
  },
  "arrendatario": {
    "nombre": "María José González Castro",
    "rut": "15.123.456-7",
    "domicilio": "Providencia 1234, Santiago"
  },
  "aval": {
    "nombre": "Javiera Paz Muñoz Díaz",
    "rut": "13.054.363-4",
    "domicilio": "Av. Irarrázaval 3050 Depto. 607, ñuñoa"
  },
  "clausulas": [
    {
      "titulo": "PRIMERO: PROPIEDAD ARRENDADA",
      "contenido": "El Arrendador da en arrendamiento al Arrendatario..."
    }
  ]
}
```

### **Características del Sistema:**
- ✅ **Editor Canvas tipo Gemini** - Interfaz visual intuitiva
- ✅ **Letra tamaño 12** - Formato clásico profesional
- ✅ **Títulos en negrita** - Jerarquía visual clara
- ✅ **Sin dependencia de HTML** - Trabajo puro con JSONB
- ✅ **Generación automática** - HTML creado on-demand
- ✅ **Compatible con N8N** - Fácil integración

---

## 🔄 **INTEGRACIÓN CON N8N**

### **Flujo Optimizado:**
```javascript
// N8N solo inserta contract_content
const contractData = {
  contract_content: {
    arrendador: { /* datos */ },
    arrendatario: { /* datos */ },
    aval: { /* datos opcional */ },
    clausulas: [ /* array de cláusulas */ ]
  },
  // NO se incluye contract_html - se genera automáticamente
}
```

### **Beneficios para N8N:**
- ✅ **Payload más pequeño** (solo JSONB)
- ✅ **Menos campos a mapear**
- ✅ **Mejor rendimiento** en transferencias
- ✅ **Mantenimiento simplificado**
- ✅ **Flexibilidad total** para modificar estructura

