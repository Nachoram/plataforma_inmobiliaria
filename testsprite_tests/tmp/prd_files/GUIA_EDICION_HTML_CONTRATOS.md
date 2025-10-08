# Guía de Edición HTML de Contratos

## 📋 Descripción
La plataforma ahora incluye un **Editor HTML** que permite editar contratos almacenados directamente en formato HTML (`contract_html`), además del editor tradicional para contratos JSON.

## 🎯 Diferencias entre Editores

| Característica | Editor JSON Tradicional | Editor HTML |
|---|---|---|
| **Campo editado** | `contract_content` | `contract_html` |
| **Formato** | JSON estructurado con secciones | HTML puro |
| **Vista previa** | Generada desde JSON | Renderizado directo de HTML |
| **Flexibilidad** | Secciones predefinidas | HTML completamente libre |
| **Uso recomendado** | Contratos generados por el sistema | Contratos externos (N8N, etc.) |

## 🚀 Cómo Usar el Editor HTML

### 1. Acceder al Editor
1. Ve a la página de un contrato
2. Si el contrato tiene formato `html` o `hybrid`, verás el botón **"Editar HTML"**
3. Haz clic en el botón para abrir el editor

### 2. Modos de Edición

#### Modo Visual
- Vista previa en tiempo real del contrato
- Muestra cómo se verá el contrato final
- Solo lectura (no se puede editar directamente)

#### Modo HTML
- Editor de texto para código HTML
- Barra de herramientas con botones de formato
- Vista dividida: HTML a la izquierda, vista previa a la derecha

### 3. Funciones de la Barra de Herramientas

| Botón | Función | HTML Generado |
|---|---|---|
| **B** | Negrita | `<strong>texto</strong>` |
| **I** | Cursiva | `<em>texto</em>` |
| **U** | Subrayado | `<u>texto</u>` |
| **¶** | Párrafo | `<p>texto</p>` |
| **H1** | Título 1 | `<h1>texto</h1>` |
| **H2** | Título 2 | `<h2>texto</h2>` |
| **H3** | Título 3 | `<h3>texto</h3>` |
| **•** | Lista | `<ul><li>texto</li></ul>` |
| **1.** | Lista numerada | `<ol><li>texto</li></ol>` |
| **🔗** | Enlace | `<a href="#">texto</a>` |
| **↵** | Salto de línea | `<br>` |

### 4. Guardar Cambios
1. Edita el contenido HTML según necesites
2. Haz clic en **"Guardar Cambios"**
3. El contrato se actualizará en la base de datos
4. Se mostrará un mensaje de confirmación

## 📝 Consejos para Editar HTML

### Estructura Recomendada
```html
<div class="contrato">
  <h1>Título del Contrato</h1>

  <h2>Sección 1</h2>
  <p>Contenido de la sección 1...</p>

  <h2>Sección 2</h2>
  <p>Contenido de la sección 2...</p>

  <!-- Firma -->
  <div class="firma">
    <p>Firmado por: ____________________</p>
  </div>
</div>
```

### Estilos Recomendados
- Usa `text-align: justify` para justificar texto
- Mantén `line-height: 1.8` para buena legibilidad
- Usa clases CSS para estilos consistentes

### Validaciones
- El contrato debe tener contenido HTML válido
- No puede estar vacío
- Se guarda automáticamente con timestamp de actualización

## 🔧 Solución de Problemas

### No veo el botón "Editar HTML"
**Causa:** El contrato no tiene formato HTML
**Solución:** Verifica que `contract_format` sea `'html'` o `'hybrid'`

### Error al guardar
**Causa:** Problemas de permisos RLS
**Solución:** Ejecuta `SOLUCION_RAPIDA_EDICION_CONTRATOS.sql`

### El HTML no se renderiza bien
**Causa:** HTML mal formado
**Solución:** Verifica que todas las etiquetas estén cerradas correctamente

## 🧪 Pruebas

Para probar la funcionalidad:
1. Ejecuta `npm run dev`
2. Ve a un contrato HTML
3. Haz clic en "Editar HTML"
4. Modifica algo
5. Guarda y verifica que se actualice

También puedes usar el script `test_html_editor.js` en la consola del navegador.

## 📚 Referencias
- `src/components/contracts/HTMLEditor.tsx` - Componente principal
- `src/components/contracts/HTMLContractViewer.tsx` - Visor con botón de editar
- `probar_edicion_contract_html.js` - Script de pruebas
- `SOLUCION_RAPIDA_EDICION_CONTRATOS.sql` - Políticas de permisos
