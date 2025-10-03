import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface HTMLCanvasViewerProps {
  htmlString: string;
}

export interface HTMLCanvasViewerRef {
  downloadPDF: (filename?: string) => Promise<void>;
}

// Función para envolver HTML con estilos profesionales
const wrapWithProfessionalStyles = (htmlContent: string): string => {
  return `
    <div style="
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.8;
      color: #000;
      background: white;
      max-width: 210mm;
      margin: 0 auto;
      font-size: 14px;
    ">
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          padding: 60px 100px !important;
        }

        p {
          margin-bottom: 12px;
          text-align: justify !important;
          line-height: 1.9;
        }

        h1, h2, h3, h4, h5, h6 {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          margin: 20px 0;
        }

        h1 {
          font-size: 22px;
          letter-spacing: 2px;
          line-height: 1.4;
          border-bottom: 3px double #000;
          padding-bottom: 25px;
          margin-bottom: 40px;
        }

        h2 {
          font-size: 16px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 18px;
          letter-spacing: 1px;
          text-align: left;
        }

        strong, b {
          font-weight: bold;
        }

        ul, ol {
          text-align: justify;
          padding-left: 25px;
          margin: 15px 0;
        }

        li {
          margin-bottom: 12px;
          text-align: justify;
          line-height: 1.9;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        td, th {
          padding: 10px;
          text-align: left;
          border: 1px solid #000;
        }

        th {
          font-weight: bold;
          background: #f5f5f5;
        }

        div {
          text-align: justify;
        }

        br {
          line-height: 1.9;
        }
      </style>
      ${htmlContent}
    </div>
  `;
};

export const HTMLCanvasViewer = forwardRef<HTMLCanvasViewerRef, HTMLCanvasViewerProps>(
  ({ htmlString }, ref) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!htmlString || !sourceRef.current || !canvasContainerRef.current) return;

    setIsLoading(true);
    setError(null);
    const sourceElement = sourceRef.current;
    const targetElement = canvasContainerRef.current;
    
    // Envolver el HTML con estilos profesionales
    const styledHTML = wrapWithProfessionalStyles(htmlString);
    sourceElement.innerHTML = styledHTML;
    targetElement.innerHTML = ''; // Limpiar canvas anterior

    html2canvas(sourceElement, { 
      useCORS: true, 
      logging: false,
      scale: 2, // Mayor calidad para PDF
      backgroundColor: '#ffffff'
    }).then(canvas => {
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvasRef.current = canvas; // Guardar referencia para PDF
      targetElement.appendChild(canvas);
    }).catch(err => {
      setError('No se pudo renderizar el informe en el canvas.');
      console.error("Error en html2canvas:", err);
    }).finally(() => {
      setIsLoading(false);
      sourceElement.innerHTML = ''; // Limpiar el DOM fuente
    });

  }, [htmlString]);

  // Exponer método downloadPDF al componente padre
  useImperativeHandle(ref, () => ({
    downloadPDF: async (filename = 'contrato') => {
      if (!canvasRef.current) {
        throw new Error('El canvas no está disponible');
      }

      try {
        const canvas = canvasRef.current;
        const imgData = canvas.toDataURL('image/png');
        
        // Dimensiones del canvas
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Configuración del PDF (A4: 210mm x 297mm)
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        // Calcular el ratio para ajustar la imagen al PDF
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
        
        // Calcular cuántas páginas se necesitan
        const pageHeight = pdfHeight;
        const totalPages = Math.ceil(finalHeight / pageHeight);
        
        // Crear el PDF
        const pdf = new jsPDF({
          orientation: finalHeight > finalWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Añadir cada página
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          const yOffset = -page * pageHeight;
          pdf.addImage(
            imgData,
            'PNG',
            0,
            yOffset,
            finalWidth,
            finalHeight,
            undefined,
            'FAST'
          );
        }
        
        // Guardar el PDF
        pdf.save(`${filename}.pdf`);
      } catch (error) {
        console.error('Error al generar PDF:', error);
        throw error;
      }
    }
  }));

  return (
    <div>
      {isLoading && <div className="text-center p-8">Renderizando vista previa...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}
      <div ref={canvasContainerRef} />
      <div ref={sourceRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} />
    </div>
  );
});

HTMLCanvasViewer.displayName = 'HTMLCanvasViewer';
