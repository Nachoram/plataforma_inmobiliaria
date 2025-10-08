import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CustomButton from '../common/CustomButton';
import ContractEditor from './ContractEditor';
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileDown,
  Edit3
} from 'lucide-react';

interface HTMLContractViewerProps {
  htmlContent: string;
  contractNumber?: string;
  contractId?: string;
  contractData?: {
    id: string;
    contract_html: string | null;
    contract_number: string | null;
    status: string;
  };
  onClose?: () => void;
  onSave?: () => void;
  showActions?: boolean;
}

/**
 * Componente para visualizar contratos en formato HTML puro
 * Renderiza HTML completo generado por N8N u otros sistemas externos
 */
export const HTMLContractViewer: React.FC<HTMLContractViewerProps> = ({
  htmlContent,
  contractNumber,
  contractId,
  contractData,
  onClose,
  onSave,
  showActions = true
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Función para convertir HTML en formato JSON de secciones
  const convertHTMLToSections = (htmlContent: string) => {
    // Si ya hay contenido JSON, devolverlo
    if (contractData?.contract_content?.sections) {
      return contractData.contract_content.sections;
    }

    // Para contratos HTML puros, mantener el contenido completo en una sola sección editable
    // Esto preserva el formato original y permite edición sin perder estructura
    const sections = [
      {
        id: 'full_contract',
        title: 'CONTRATO COMPLETO',
        content: htmlContent || '<p>Contenido del contrato no disponible</p>'
      }
    ];

    return sections;
  };

  // Preparar datos del contrato para el editor
  const prepareContractDataForEditor = () => {
    // Si ya tiene contract_content con secciones, usar eso
    if (contractData?.contract_content?.sections) {
      return contractData;
    }

    // Si no, convertir HTML a secciones
    const sections = convertHTMLToSections(htmlContent);

    return {
      ...contractData,
      contract_content: {
        ...contractData?.contract_content,
        sections: sections
      }
    };
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${contractNumber || 'documento'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!iframeRef.current) return;
    
    setIsDownloadingPDF(true);
    try {
      // Crear un elemento temporal con el HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      document.body.appendChild(tempDiv);

      // Esperar un momento para que se renderice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generar canvas del HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Limpiar elemento temporal
      document.body.removeChild(tempDiv);

      // Generar PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Configuración del PDF (A4)
      const pdfWidth = 210;
      const pdfHeight = 297;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Calcular páginas necesarias
      const pageHeight = pdfHeight;
      const totalPages = Math.ceil(finalHeight / pageHeight);
      
      // Crear PDF
      const pdf = new jsPDF({
        orientation: finalHeight > finalWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Añadir páginas
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        const yOffset = -page * pageHeight;
        pdf.addImage(imgData, 'PNG', 0, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      }
      
      // Guardar PDF
      pdf.save(`contrato-${contractNumber || 'documento'}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      <div className={`mx-auto px-4 py-8 ${isFullscreen ? 'max-w-full h-full flex flex-col' : 'max-w-6xl'}`}>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              {onClose && !isFullscreen && (
                <CustomButton
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver</span>
                </CustomButton>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Contrato de Arrendamiento
                </h1>
                {contractNumber && (
                  <p className="text-gray-600 mt-1">
                    Número: {contractNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <div className="flex space-x-3">
                <CustomButton
                  onClick={handleZoomOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </CustomButton>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                  {zoom}%
                </span>
                <CustomButton
                  onClick={handleZoomIn}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </CustomButton>
              </div>

              <div className="flex space-x-3">
                {contractId && contractData && (
                  <CustomButton
                    onClick={() => setShowEditor(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar</span>
                  </CustomButton>
                )}
                <CustomButton
                  onClick={toggleFullscreen}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
                </CustomButton>
                <CustomButton
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir</span>
                </CustomButton>
                <CustomButton
                  onClick={handleDownloadPDF}
                  variant="primary"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={isDownloadingPDF}
                >
                  <FileDown className="h-4 w-4" />
                  <span>{isDownloadingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
                </CustomButton>
                <CustomButton
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Descargar HTML</span>
                </CustomButton>
              </div>
            </div>
          )}
        </div>

        {/* Contract Content */}
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
          <div className={`overflow-auto ${isFullscreen ? 'flex-1' : 'max-h-[800px]'}`}>
            <div 
              className="p-8"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease'
              }}
            >
              {/* Renderizar HTML directamente - sin sandbox para contenido propio controlado */}
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full border-0"
                style={{ 
                  minHeight: '800px',
                  backgroundColor: 'white'
                }}
                title="Contrato de Arrendamiento"
              />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        {!isFullscreen && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Documento generado electrónicamente</p>
            <p>Este contrato tiene validez legal según la Ley 18.101 sobre Arrendamiento de Bienes Raíces</p>
          </div>
        )}

        {/* Modal de Edición */}
        {showEditor && contractId && contractData && (
          <ContractEditor
            contractId={contractId}
            contractData={prepareContractDataForEditor()}
            onClose={() => setShowEditor(false)}
            onSave={() => {
              setShowEditor(false);
              if (onSave) onSave();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HTMLContractViewer;

