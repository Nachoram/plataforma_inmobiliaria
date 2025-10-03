# Análisis: Formato de Contratos desde N8N

## Formato Actual que Envía N8N

N8N genera contratos como **HTML completo** con la siguiente estructura:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        /* Estilos CSS integrados */
        body { font-family: 'Times New Roman', Times, serif; ... }
        h1, h2, p { ... }
        .signature-block { ... }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    <p>Contenido del contrato...</p>
    <h2>PRIMERO: PROPIEDAD ARRENDADA</h2>
    <p>...</p>
    <!-- Más secciones -->
    <div class="signature-block">...</div>
</body>
</html>
```

## Características del HTML

- ✅ **Documento completo** con DOCTYPE, head y body
- ✅ **CSS integrado** en la etiqueta `<style>`
- ✅ **Estructura semántica** con h1, h2, p
- ✅ **Bloques de firma** al final del documento
- ✅ **Formato profesional** tipo documento legal

## Formato Actual en Base de Datos

La tabla `rental_contracts` tiene:
```sql
contract_content JSONB NOT NULL DEFAULT '{}'
```

Estructura esperada:
```json
{
  "sections": [
    {"id": "header", "title": "...", "content": "...", "editable": true}
  ],
  "version": 1,
  "generatedAt": "2025-10-03..."
}
```

## Problema Identificado

❌ **Incompatibilidad de formatos**:
- N8N envía: HTML completo como string
- BD espera: Objeto JSON con estructura de sections

## Solución Propuesta

### Opción 1: Soporte Dual (RECOMENDADA)

Modificar el sistema para soportar **ambos formatos**:

1. **Base de Datos**: 
   - Cambiar `contract_content` de `JSONB NOT NULL` a `JSONB NULL`
   - Agregar `contract_html TEXT` para HTML puro
   
2. **Componentes de Visualización**:
   - Detectar automáticamente el formato
   - Si es HTML string → renderizar directo
   - Si es JSON con sections → convertir a HTML

3. **Webhook Receiver**:
   - Recibir HTML desde N8N
   - Almacenar en `contract_html`
   - Opcionalmente parsear y crear estructura JSON

### Opción 2: Solo HTML

Simplificar completamente:
1. Cambiar `contract_content` a tipo `TEXT`
2. Almacenar siempre HTML completo
3. Visualizador muestra HTML directamente

## Ventajas de Cada Opción

### Opción 1 (Dual)
✅ Máxima flexibilidad
✅ Compatibilidad con contratos existentes
✅ Permite edición granular (si se usa JSON)
✅ Permite HTML directo desde N8N
⚠️ Más complejo de mantener

### Opción 2 (Solo HTML)
✅ Extremadamente simple
✅ Compatible directo con N8N
✅ Fácil de visualizar
⚠️ Menos flexible para edición
⚠️ Requiere migración de datos existentes

## Recomendación

**Implementar Opción 1** con estos cambios:

1. Agregar columna `contract_html TEXT` a `rental_contracts`
2. Mantener `contract_content JSONB` pero permitir NULL
3. Componente visualizador inteligente que soporte ambos formatos
4. Webhook que almacene en `contract_html` por defecto

## Próximos Pasos

1. ✅ Crear migración para agregar `contract_html`
2. ⏳ Actualizar componente `ContractViewer` para detectar formato
3. ⏳ Crear `HTMLContractViewer` simplificado
4. ⏳ Actualizar webhook `receive-contract-webhook`
5. ⏳ Probar con contrato de ejemplo

