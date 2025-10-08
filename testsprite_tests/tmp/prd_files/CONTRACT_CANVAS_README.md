# Canvas del Contrato - Prototipo

## 🎨 Descripción

El **Contract Canvas Prototype** es una implementación simplificada y funcional del editor visual de contratos de arriendo. Diseñado para prototipado rápido y facilidad de uso.

## ✨ Características

### 📝 Editor Simple
- **Textarea básico** en lugar de editor rico complejo
- **Edición directa** de secciones del contrato
- **Vista previa** en tiempo real
- **Guardar cambios** automáticamente

### 🏗️ Estructura del Contrato
- **Encabezado**: Información básica del contrato
- **Partes Contratantes**: Datos del arrendador, arrendatario y aval
- **Bien Arrendado**: Descripción de la propiedad
- **Condiciones**: Plazo, precio, garantías, cláusulas especiales
- **Obligaciones**: Derechos y deberes de cada parte
- **Terminación**: Condiciones de finalización del contrato
- **Firmas**: Espacios para las firmas de todas las partes

### 🎯 Funcionalidades

#### Modo Edición
- ✅ Editar cualquier sección editable
- ✅ Guardar cambios automáticamente
- ✅ Cancelar edición sin guardar
- ✅ Validación básica de contenido

#### Modo Vista Previa
- 👁️ Vista completa del contrato
- 📄 Formato de texto plano legible
- 🖨️ Opción de impresión
- 💾 Descarga como archivo de texto

#### Integración con Base de Datos
- 🔄 Carga automática de contratos existentes
- 💾 Guardado en Supabase
- 📊 Estados del contrato (borrador, aprobado, firmado)
- 🔐 Control de permisos por usuario

## 🚀 Cómo Usar

### 1. Acceder al Canvas
```typescript
// Desde cualquier página
navigate('/contract-canvas'); // Para contrato por defecto
navigate('/contract-canvas/contrato-id'); // Para contrato específico
```

### 2. Editar Secciones
- Hacer clic en **"Editar"** en cualquier sección
- Modificar el contenido en el textarea
- Hacer clic en **"Guardar"** o **"Cancelar"**

### 3. Vista Previa
- Alternar entre **"Editar"** y **"Vista"** con el botón superior
- Ver el contrato completo formateado

### 4. Guardar y Descargar
- **Guardar**: Almacena cambios en la base de datos
- **Descargar**: Genera archivo .txt del contrato
- **Imprimir**: Abre diálogo de impresión del navegador

## 🔧 Implementación Técnica

### Componentes Principales
```typescript
// Editor prototípico simplificado
ContractCanvasPrototype

// Página de demostración
ContractCanvasDemo

// Flujo de aprobación integrado
ContractApprovalWorkflow
```

### Estructura de Datos
```typescript
interface ContractSection {
  id: string;           // Identificador único
  title: string;        // Título de la sección
  content: string;      // Contenido editable
  editable: boolean;    // Si permite edición
}
```

### Estados del Contrato
- `draft`: Borrador editable
- `approved`: Aprobado, listo para firma
- `sent_to_signature`: Enviado a proceso de firma
- `partially_signed`: Algunas firmas completadas
- `fully_signed`: Todas las firmas completadas

## 🎨 Diseño y UX

### Interfaz Intuitiva
- **Botones claros** para acciones principales
- **Estados visuales** diferenciados (edición/vista)
- **Feedback inmediato** en acciones del usuario
- **Responsive design** para móviles y desktop

### Colores y Estilos
- **Gradientes azules** para headers
- **Fondos grises claros** para secciones
- **Botones contextuales** (verde=guardar, azul=editar, rojo=cancelar)
- **Texto monoespaciado** para mejor legibilidad

## 🔮 Próximos Pasos

### Mejoras Planeadas
- [ ] **Editor rico** con formato avanzado
- [ ] **Plantillas** predefinidas de contratos
- [ ] **Validación automática** de campos requeridos
- [ ] **Comentarios y anotaciones** en el contrato
- [ ] **Versionado** de cambios en contratos
- [ ] **Firma digital integrada** en el canvas

### Integración Completa
- [ ] **IA para redacción** automática de cláusulas
- [ ] **Análisis legal** de contratos generados
- [ ] **Workflows personalizados** por tipo de propiedad
- [ ] **Notificaciones** en tiempo real de cambios

## 🐛 Solución de Problemas

### Error 409 (Conflict)
- **Causa**: Intentar crear condiciones que ya existen
- **Solución**: El componente detecta automáticamente y hace UPDATE

### Contrato no carga
- **Causa**: ID de contrato inválido o permisos insuficientes
- **Solución**: Verificar ID y permisos del usuario

### Cambios no se guardan
- **Causa**: Error de conexión o permisos
- **Solución**: Verificar conexión a Supabase y RLS policies

## 📱 Acceso Rápido

- **URL**: `/contract-canvas` o `/contract-canvas/:contractId`
- **Menú**: "Canvas Demo" en la navegación principal
- **Desde contratos**: Botón "Ver Contrato" en el workflow de aprobación

---

**💡 Este prototipo permite una experiencia funcional completa mientras se desarrolla la versión final con todas las características avanzadas.**
