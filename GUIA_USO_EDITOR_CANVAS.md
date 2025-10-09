# 📚 Guía de Uso: Editor Canvas de Contratos

## 🎯 Introducción

El **Editor Canvas** es una herramienta visual e intuitiva para crear y editar contratos de arrendamiento directamente en el navegador. Permite modificar cualquier parte del contrato con un sistema de edición en vivo.

---

## 🚀 Acceso al Editor

### Opción 1: Desde la Lista de Contratos

1. Ve a la página **Contratos** (`/contracts`)
2. Busca el contrato que deseas editar
3. Click en el botón **🟣 Editar Contrato**

### Opción 2: Desde la Vista del Contrato

1. Abre un contrato en modo vista (`/contract/:id`)
2. Click en el botón **Editar** en la barra de acciones
3. Se abrirá el editor canvas

---

## 🖊️ Edición del Contrato

### Editar Cualquier Texto

1. **Haz click** en cualquier texto que quieras editar
2. Aparecerá un **campo de edición** con fondo azul
3. **Escribe** tus cambios
4. **Click fuera** del campo o presiona `Tab` para salir del modo edición

#### Elementos Editables:
- ✏️ **Título del contrato**
- ✏️ **Comparecencia** (texto introductorio)
- ✏️ **Título de cada cláusula**
- ✏️ **Contenido de cada cláusula**
- ✏️ **Texto de cierre**
- ✏️ **Información de firmantes** (nombre, RUT, rol)

### Visual de Edición

```
┌─────────────────────────────────────────┐
│  Modo Vista (Hover)                     │
│  ┌───────────────────────────────────┐  │
│  │ CONTRATO DE ARRENDAMIENTO      ✏️ │  │ ← Icono aparece al pasar mouse
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Modo Edición (Activo)                  │
│  ┌───────────────────────────────────┐  │
│  │ [CONTRATO DE ARRENDAMIENTO]       │  │ ← Fondo azul, campo editable
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## ➕ Agregar Elementos

### Agregar Cláusula

1. Click en **➕ Añadir Cláusula** (barra superior)
2. Se agrega una nueva cláusula al final
3. Edita el título y contenido de la nueva cláusula

### Agregar Firmante

1. Desplázate hasta la sección de firmas
2. Click en **➕ Añadir Firmante** (al final de la lista)
3. Completa: ROL, Nombre, RUT

---

## 🗑️ Eliminar Elementos

### Eliminar Cláusula

1. Pasa el mouse sobre el título de la cláusula
2. Aparece un botón **🗑️ rojo** a la derecha
3. Click para eliminar (sin confirmación, ten cuidado)

### Eliminar Firmante

1. Pasa el mouse sobre la información del firmante
2. Aparece un botón **🗑️ rojo** a la derecha
3. Click para eliminar

---

## 💾 Guardar Cambios

### Guardar en Base de Datos

1. Click en **💾 Guardar Cambios** (barra superior, botón morado)
2. Espera el mensaje "Guardando..."
3. Verás **✓ Guardado** cuando se complete

### Estados del Botón:

| Estado | Apariencia | Significado |
|--------|-----------|-------------|
| Normal | 🟣 Guardar Cambios | Listo para guardar |
| Guardando | ⚪ Guardando... | Procesando |
| Éxito | 🟢 Guardado ✓ | Guardado exitoso (3 seg) |
| Error | 🔴 Error | Muestra alerta con detalles |

**⚠️ Importante:** Los cambios NO se guardan automáticamente. Debes hacer click en "Guardar Cambios".

---

## 📄 Descargar PDF

### Generar PDF del Contrato

1. Click en **📥 Descargar PDF** (barra superior, botón verde)
2. El sistema genera el PDF con:
   - ✅ Márgenes perfectos (1.5cm en todos los lados)
   - ✅ Paginación automática
   - ✅ Fuente serif profesional
   - ✅ Texto justificado
3. Se descarga automáticamente como `contrato-final-profesional.pdf`

**💡 Tip:** El PDF se genera con el estado actual del contrato, incluso si no has guardado los cambios en la base de datos.

---

## 🎨 Interfaz del Editor

### Barra de Herramientas (Superior)

```
┌────────────────────────────────────────────────────────────────┐
│  Editor Canvas de Contrato                                     │
│  Lienzo de Documento Dinámico                                  │
│                                                                 │
│  [➕ Añadir Cláusula] [💾 Guardar Cambios] [📥 Descargar PDF] │
└────────────────────────────────────────────────────────────────┘
```

### Estructura del Documento

```
┌──────────────────────────────────────┐
│                                      │
│    CONTRATO DE ARRENDAMIENTO         │ ← Título (editable)
│                                      │
│  Comparecen de una parte...          │ ← Comparecencia (editable)
│                                      │
│  PRIMERA: PROPIEDAD ARRENDADA  🗑️   │ ← Cláusula con botón eliminar
│  El arrendador da en arrendamiento...│
│                                      │
│  SEGUNDA: RENTA                🗑️   │
│  La renta mensual será...            │
│                                      │
│  [➕ Añadir Cláusula]                │
│                                      │
│  En comprobante de lo pactado...     │ ← Cierre (editable)
│                                      │
│  ──────────────────────────          │
│  ARRENDADOR                    🗑️   │ ← Firmante con botón eliminar
│  Juan Pérez                          │
│  12.345.678-9                        │
│                                      │
│  [          Espacio firma        ]   │
│                                      │
│  ──────────────────────────          │
│  ARRENDATARIO                  🗑️   │
│  María González                      │
│  98.765.432-1                        │
│                                      │
│  [          Espacio firma        ]   │
│                                      │
│  [➕ Añadir Firmante]                │
│                                      │
└──────────────────────────────────────┘
```

---

## ⌨️ Atajos y Trucos

### Navegación Rápida

- **Click** → Activa edición
- **Tab** → Sale del campo actual (guarda el cambio)
- **Click fuera** → Sale del campo actual (guarda el cambio)
- **Esc** → (No implementado aún, sale con los cambios)

### Edición Eficiente

1. **Títulos de cláusulas:** Úsalos en MAYÚSCULAS para mantener el formato profesional
2. **Contenido extenso:** El campo de texto se expande automáticamente
3. **Saltos de línea:** Presiona `Enter` normalmente dentro del campo
4. **Formato:** El texto en modo vista se justifica automáticamente

### Buenas Prácticas

- ✅ Guarda frecuentemente (cada 5-10 minutos)
- ✅ Revisa el PDF antes de enviar
- ✅ Verifica los datos de firmantes
- ✅ Usa títulos descriptivos en cláusulas
- ✅ Mantén consistencia en numeración (PRIMERA, SEGUNDA, etc.)

---

## 🔧 Resolución de Problemas

### El botón "Guardar" no aparece

**Causa:** El componente no recibió el `contractId`  
**Solución:** Verifica que accediste al editor desde una URL válida con ID

### Error al guardar: "No se puede guardar"

**Causa:** No tienes permisos para editar este contrato  
**Solución:** Solo el propietario de la propiedad puede editar el contrato

### Los cambios no se reflejan después de guardar

**Causa 1:** Error de red o base de datos  
**Solución:** Revisa la consola del navegador (F12) para ver errores

**Causa 2:** Actualización pendiente  
**Solución:** Recarga la página y verifica si los cambios se guardaron

### El PDF no se descarga

**Causa:** Error en la generación del canvas  
**Solución:**
1. Sal del modo edición (click fuera de cualquier campo)
2. Espera 1 segundo
3. Vuelve a intentar descargar

### El texto se corta en el PDF

**Causa:** Contenido muy largo sin saltos de página  
**Solución:** El sistema hace paginación automática, pero si hay problemas:
1. Divide cláusulas muy largas en varias cláusulas más cortas
2. Usa saltos de párrafo dentro de las cláusulas

---

## 📊 Información Técnica

### Datos que se Guardan

Cuando haces click en "Guardar Cambios", se actualiza:

```json
{
  "contract_content": {
    "titulo": "CONTRATO DE ARRENDAMIENTO",
    "comparecencia": "Comparecen de una parte...",
    "clausulas": [
      {
        "id": "1",
        "titulo": "PRIMERA",
        "contenido": "..."
      }
    ],
    "cierre": "En comprobante...",
    "firmantes": [
      {
        "id": "1",
        "nombre": "Juan Pérez",
        "rut": "12.345.678-9",
        "rol": "ARRENDADOR"
      }
    ]
  },
  "updated_at": "2025-10-09T..."
}
```

### Compatibilidad

El editor es compatible con:
- ✅ Navegadores modernos (Chrome, Firefox, Edge, Safari)
- ✅ Dispositivos móviles (con limitaciones en edición)
- ✅ Contratos existentes con estructura canvas
- ⚠️ Contratos HTML antiguos (se convierten automáticamente)

---

## 🎓 Ejemplos de Uso

### Caso 1: Editar Monto de Renta

1. Localiza la cláusula "RENTA" o "PRECIO"
2. Click en el contenido de la cláusula
3. Cambia el monto: `$500.000` → `$550.000`
4. Click fuera del campo
5. Click en "Guardar Cambios"

### Caso 2: Agregar Cláusula de Mascotas

1. Click en "Añadir Cláusula"
2. Click en el título de la nueva cláusula
3. Escribe: `SEXTA: MASCOTAS`
4. Click en el contenido
5. Escribe: `El arrendatario podrá tener hasta dos mascotas pequeñas...`
6. Click en "Guardar Cambios"

### Caso 3: Modificar Datos de Firmante

1. Desplázate a la sección de firmas
2. Click en el nombre del arrendatario
3. Corrige el nombre
4. Click en el RUT
5. Corrige el RUT
6. Click en "Guardar Cambios"

### Caso 4: Descargar Contrato Final

1. Revisa que todos los datos sean correctos
2. Click en "Descargar PDF"
3. Abre el PDF descargado
4. Verifica márgenes, paginación, contenido
5. Envía el PDF al cliente o imprímelo

---

## 📞 Soporte

### Recursos Adicionales:

- 📖 **Documentación técnica:** Ver `INTEGRACION_CANVAS_EDITOR_COMPLETA.md`
- 🔍 **Verificación:** Ejecutar `verificar_integracion_canvas.sql`
- 🐛 **Reportar problemas:** Consulta con el equipo de desarrollo

### Logs para Debugging:

Si encuentras problemas, abre la consola del navegador (F12) y busca:
- ✅ `Contrato guardado exitosamente` → Guardado OK
- ❌ `Error al guardar el contrato` → Ver detalles del error
- 🔍 Mensajes de red en la pestaña "Network"

---

## ✨ Tips Pro

1. **Usa plantillas:** Si vas a crear muchos contratos similares, crea uno "maestro" y duplícalo
2. **Guarda versiones:** Descarga el PDF de cada versión importante antes de hacer cambios grandes
3. **Revisa en PDF:** Siempre descarga y revisa el PDF antes de firmar
4. **Nomenclatura:** Mantén consistencia en nombres de cláusulas (PRIMERA, SEGUNDA, etc.)
5. **Backup:** El sistema guarda `updated_at`, pero considera hacer capturas de pantalla de cambios importantes

---

**🎉 ¡Listo! Ya estás preparado para usar el Editor Canvas de Contratos de forma profesional.**

