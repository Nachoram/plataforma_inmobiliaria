# Guía de Descarga de Contratos en PDF

## Descripción

Se ha implementado la funcionalidad para descargar contratos en formato PDF directamente desde el canvas de visualización de contratos.

## Características

### ✨ Funcionalidades Implementadas

1. **Descarga directa en PDF** - Convierte el contrato visualizado en canvas a un archivo PDF de alta calidad
2. **Múltiples páginas automáticas** - Si el contrato es muy largo, automáticamente se divide en múltiples páginas A4
3. **Alta resolución** - Usa escala 2x para garantizar texto legible y nítido
4. **Nombres descriptivos** - Los archivos PDF se nombran automáticamente con información del contrato
5. **Indicador de progreso** - Botón muestra "Generando PDF..." mientras se procesa

## Componentes Actualizados

### 1. HTMLCanvasViewer

**Ubicación:** `src/components/common/HTMLCanvasViewer.tsx`

**Características:**
- Componente base que renderiza HTML en canvas
- Expone método `downloadPDF()` mediante `forwardRef`
- Genera PDF multipágina automáticamente
- Escala 2x para mejor calidad

**Uso:**
```tsx
import { HTMLCanvasViewer, HTMLCanvasViewerRef } from '../common/HTMLCanvasViewer';

const canvasRef = useRef<HTMLCanvasViewerRef>(null);

const handleDownloadPDF = async () => {
  if (canvasRef.current) {
    await canvasRef.current.downloadPDF('nombre-archivo');
  }
};

<HTMLCanvasViewer ref={canvasRef} htmlString={htmlContent} />
```

### 2. ContractViewer

**Ubicación:** `src/components/contracts/ContractViewer.tsx`

**Mejoras:**
- Botón "Descargar PDF" prominente con variante primary
- Maneja estado de carga con `isDownloadingPDF`
- Nombres de archivo descriptivos basados en aplicante
- Manejo de errores con alertas amigables

**Ejemplo de uso:**
```tsx
<ContractViewer 
  contractId="uuid-del-contrato"
  onClose={() => {}}
  showActions={true}
/>
```

### 3. HTMLContractViewer

**Ubicación:** `src/components/contracts/HTMLContractViewer.tsx`

**Mejoras:**
- Convierte HTML completo (incluyendo desde N8N) a PDF
- Crea elemento temporal para renderizado
- Limpieza automática después de generar PDF
- Soporte para contratos con HTML embebido

## Flujo de Descarga PDF

```
1. Usuario hace clic en "Descargar PDF"
   ↓
2. Se captura el canvas/HTML actual
   ↓
3. html2canvas convierte a imagen PNG (escala 2x)
   ↓
4. jsPDF calcula dimensiones y páginas necesarias
   ↓
5. Se genera PDF con formato A4
   ↓
6. Descarga automática del archivo
```

## Dependencias Instaladas

```json
{
  "html2canvas": "^1.4.1",  // Ya instalada
  "jspdf": "^2.5.2"         // Nueva instalación
}
```

## Configuración Técnica

### Formato del PDF
- **Tamaño:** A4 (210mm × 297mm)
- **Orientación:** Automática (portrait si altura > ancho)
- **Escala de renderizado:** 2x para mayor calidad
- **Formato de imagen:** PNG para mantener calidad

### Algoritmo de Paginación

```typescript
const pdfWidth = 210;  // mm
const pdfHeight = 297; // mm
const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
const totalPages = Math.ceil(finalHeight / pageHeight);
```

## Cómo Usar

### Desde el Visor de Contratos

1. **Navega a un contrato:**
   - Ve a "Contratos" en el menú
   - Selecciona cualquier contrato para visualizar

2. **Descarga en PDF:**
   - Haz clic en el botón azul **"Descargar PDF"**
   - Espera a que aparezca "Generando PDF..."
   - El archivo se descargará automáticamente

3. **Nombre del archivo:**
   - Formato: `contrato-[Nombre]-[Apellido].pdf`
   - Ejemplo: `contrato-Juan-Perez.pdf`

### Desde Código

```typescript
// Opción 1: Usando ContractViewer (recomendado)
<ContractViewer 
  contractId="uuid"
  showActions={true}
/>

// Opción 2: Usando HTMLCanvasViewer directamente
const canvasRef = useRef<HTMLCanvasViewerRef>(null);

const downloadPDF = async () => {
  try {
    await canvasRef.current?.downloadPDF('mi-contrato');
  } catch (error) {
    console.error('Error:', error);
  }
};

<HTMLCanvasViewer ref={canvasRef} htmlString={html} />
<button onClick={downloadPDF}>Descargar PDF</button>
```

## Solución de Problemas

### El PDF está en blanco
- **Causa:** HTML no renderizado completamente
- **Solución:** Ya incluido timeout de 500ms antes de captura

### Calidad baja en el PDF
- **Causa:** Escala insuficiente
- **Solución:** Configurado con `scale: 2` en html2canvas

### El PDF tiene demasiadas páginas
- **Causa:** Contenido muy largo
- **Solución:** Normal para contratos extensos. Optimizar HTML si es necesario.

### Error al generar PDF
- **Causa:** Canvas no disponible o error en renderizado
- **Solución:** Se muestra alert al usuario con mensaje de error

## Mejoras Futuras Posibles

1. **Vista previa antes de descargar** - Modal con preview del PDF
2. **Selección de calidad** - Opciones de baja/media/alta resolución
3. **Marca de agua** - Agregar watermark opcional
4. **Firmas digitales** - Integración con firma electrónica
5. **Envío por email** - Opción de enviar PDF directamente
6. **Compresión de PDF** - Reducir tamaño de archivo para contratos largos
7. **Metadatos** - Agregar información al PDF (autor, fecha, etc.)

## Ejemplo Completo

```typescript
import React, { useRef, useState } from 'react';
import { HTMLCanvasViewer, HTMLCanvasViewerRef } from './components/common/HTMLCanvasViewer';
import CustomButton from './components/common/CustomButton';
import { FileDown } from 'lucide-react';

const MiComponenteContrato = () => {
  const canvasRef = useRef<HTMLCanvasViewerRef>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!canvasRef.current) return;
    
    setIsDownloading(true);
    try {
      await canvasRef.current.downloadPDF('mi-contrato-personalizado');
      console.log('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al generar PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <CustomButton 
        onClick={handleDownloadPDF}
        disabled={isDownloading}
      >
        <FileDown className="mr-2" />
        {isDownloading ? 'Generando...' : 'Descargar PDF'}
      </CustomButton>
      
      <HTMLCanvasViewer 
        ref={canvasRef}
        htmlString="<h1>Mi Contrato</h1><p>Contenido...</p>"
      />
    </div>
  );
};

export default MiComponenteContrato;
```

## Compatibilidad

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Dispositivos móviles (con limitaciones de tamaño)

## Notas Importantes

1. **Tamaño de archivo:** PDFs grandes pueden tardar más en generarse
2. **Memoria del navegador:** Contratos muy extensos pueden consumir mucha memoria
3. **Estilos CSS:** Los estilos inline funcionan mejor que CSS externo
4. **Imágenes:** Requieren CORS habilitado (`useCORS: true`)

## Soporte

Para problemas o preguntas sobre la funcionalidad de descarga de PDF:
- Revisa los logs del navegador (F12 > Console)
- Verifica que el contrato se visualice correctamente en canvas
- Contacta al equipo de desarrollo con detalles del error

---

**Última actualización:** Octubre 2025
**Autor:** Equipo de Desarrollo
**Versión:** 1.0.0

