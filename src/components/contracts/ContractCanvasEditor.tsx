import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import CustomButton from '../common/CustomButton';

interface Firmante {
      nombre: string;
      rut: string;
  rol: string;
}

interface ContractContent {
  titulo: string;
  comparecencia: string;
    clausulas?: Array<{
      titulo: string;
      contenido: string;
    }>;
  firmantes?: Firmante[];
}

interface ContractCanvasEditorProps {
  initialContract: ContractContent;
}

// EditableField sub-component - Implementación simplificada con solo textarea
interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onChange,
  placeholder = '',
  multiline = false,
  className = ''
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      (e.target as HTMLTextAreaElement).blur();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={multiline ? 3 : 1}
      className={`font-serif leading-relaxed text-justify bg-transparent border-none outline-none resize-none w-full p-0 m-0 text-gray-800 ${className} ${
        multiline ? 'min-h-[80px]' : 'min-h-[24px]'
      }`}
    />
  );
};

const ContractCanvasEditor: React.FC<ContractCanvasEditorProps> = ({
  initialContract
}) => {
  const [contract, setContract] = useState<ContractContent>(initialContract);
  const documentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Initialize default data
  useEffect(() => {
    setContract(prev => ({
      titulo: prev.titulo || 'CONTRATO DE ARRENDAMIENTO',
      comparecencia: prev.comparecencia || '',
      clausulas: prev.clausulas || [],
      firmantes: prev.firmantes || [
        { nombre: '', rut: '', rol: 'ARRENDADOR' },
        { nombre: '', rut: '', rol: 'ARRENDATARIO' }
      ]
    }));
  }, []);

  const updateTitle = (value: string) => {
    setContract(prev => ({
      ...prev,
      titulo: value
    }));
  };

  const updateComparecencia = (value: string) => {
    setContract(prev => ({
      ...prev,
      comparecencia: value
    }));
  };

  const updateClause = (index: number, field: 'titulo' | 'contenido', value: string) => {
    // Para títulos, asegurarse de que no contengan ":" al final
    const processedValue = field === 'titulo' ? value.replace(/:+$/, '') : value;

    setContract(prev => ({
      ...prev,
      clausulas: prev.clausulas?.map((clause, i) =>
        i === index ? { ...clause, [field]: processedValue } : clause
      )
    }));
  };

  const addClause = () => {
    setContract(prev => ({
      ...prev,
      clausulas: [
        ...(prev.clausulas || []),
        { titulo: 'NUEVA CLÁUSULA', contenido: '...' }
      ]
    }));
  };

  const deleteClause = (index: number) => {
    setContract(prev => ({
      ...prev,
      clausulas: prev.clausulas?.filter((_, i) => i !== index)
    }));
  };

  const updateFirmante = (index: number, field: 'nombre' | 'rut' | 'rol', value: string) => {
    setContract(prev => ({
      ...prev,
      firmantes: prev.firmantes?.map((firmante, i) =>
        i === index ? { ...firmante, [field]: value } : firmante
      )
    }));
  };

  const addFirmante = () => {
    setContract(prev => ({
      ...prev,
      firmantes: [
        ...(prev.firmantes || []),
        { nombre: '', rut: '', rol: 'AVAL' }
      ]
    }));
  };

  const deleteFirmante = (index: number) => {
    setContract(prev => ({
      ...prev,
      firmantes: prev.firmantes?.filter((_, i) => i !== index)
    }));
  };

  const handleDownloadPDF = async () => {
    // 1. Identificar el contenedor principal del documento
    const documentContainer = document.getElementById('document-canvas');
    if (!documentContainer) {
        console.error("El contenedor del documento no fue encontrado.");
        return;
    }

    // 2. Aplicar clases de limpieza para la captura
    const elementsToHide = document.querySelectorAll('.pdf-hide'); // Todos los botones y barras de herramientas
    documentContainer.classList.add('print-borderless'); // El div del "papel"
    elementsToHide.forEach(el => el.style.display = 'none');

    try {
        // 3. Capturar el DOM con html2canvas
        const canvas = await html2canvas(documentContainer, {
            scale: 2, // Alta resolución
            useCORS: true,
        });

        // 4. Lógica de PDF y Paginación
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const margin = 15; // 1.5 cm de margen
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = pdfHeight - (margin * 2);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgTotalHeight = contentWidth / ratio;

        let heightLeft = imgTotalHeight;
        let position = 0;

        // Bucle de paginación simple y efectivo
        while (heightLeft > 0) {
            // Se posiciona la imagen completa en cada página, moviendo la "ventana de visión"
            pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, imgTotalHeight);

            heightLeft -= contentHeight;

            if (heightLeft > 0) {
                pdf.addPage();
                position -= contentHeight;
            }
        }

        pdf.save('contrato-final.pdf');

    } catch (error) {
        console.error("Error al generar el PDF:", error);
    } finally {
        // 5. Restaurar la UI
        documentContainer.classList.remove('print-borderless');
        elementsToHide.forEach(el => el.style.display = '');
    }
  };

  return (
    <div id="canvas-editor-root" className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Barra de Herramientas Fija */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 sticky top-4 z-10 pdf-hide">
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-xl font-semibold text-gray-900">Editor Canvas de Contrato</h1>
              <p className="text-sm text-gray-600 mt-1">Lienzo de Documento Dinámico</p>
          </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={addClause}
                className="pdf-hide flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Cláusula</span>
              </button>
            <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="pdf-hide flex items-center space-x-2 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>{isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>
            </div>
          </div>
        </div>

        {/* Documento A4-like con secciones semánticas */}
        <div
          ref={documentRef}
          id="document-canvas"
          className="document-paper max-w-4xl mx-auto bg-white p-8 sm:p-16 shadow-lg border border-gray-200 font-serif"
          style={{ minHeight: '800px' }}
        >
          {/* SECCIÓN 1: CABECERA */}
          <div id="pdf-header" className="mb-16">
            <EditableField
              value={contract.titulo}
              onChange={updateTitle}
              placeholder="TÍTULO DEL CONTRATO"
              multiline={true}
              className="text-xl font-bold text-center uppercase mb-8"
            />
          </div>

          {/* SECCIÓN 2: CUERPO (CLÁUSULAS) */}
          <div id="pdf-body" className="space-y-8">
            {/* Comparecencia */}
            <div className="mb-16">
              <EditableField
                value={contract.comparecencia}
                onChange={updateComparecencia}
                placeholder="Escribe aquí la comparecencia de las partes..."
                multiline={true}
                className="text-sm leading-relaxed text-justify"
              />
            </div>

            {/* Cláusulas */}
            {contract.clausulas?.map((clause, index) => (
              <div key={index} className="mb-8 relative">
                <div className="flex items-center justify-between mb-2">
                  <EditableField
                    value={clause.titulo.replace(/:$/, '')}
                    onChange={(value) => updateClause(index, 'titulo', value)}
                    placeholder={`CLÁUSULA ${index + 1}`}
                    multiline={true}
                    className="font-bold uppercase leading-normal flex-1"
                  />
                  <button
                    onClick={() => deleteClause(index)}
                    className="pdf-hide ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="Eliminar cláusula"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <EditableField
                  value={clause.contenido}
                  onChange={(value) => updateClause(index, 'contenido', value)}
                  placeholder="Escribe el contenido de la cláusula..."
                  multiline={true}
                  className="text-sm leading-relaxed text-justify"
                />
              </div>
            ))}

            {(!contract.clausulas || contract.clausulas.length === 0) && (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg pdf-hide">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No hay cláusulas definidas</p>
                <p className="text-xs mt-2">Haz clic en "Añadir Cláusula" para comenzar</p>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: PIE DE PÁGINA (FIRMAS) */}
          <div id="pdf-footer" className="mt-16 pt-12 border-t-2 border-black">
            <div className="text-center mb-12">
              <p className="text-sm leading-relaxed text-justify">
                En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha,
                declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.
              </p>
            </div>

            {/* Firmantes Dinámicos */}
            <div className="mt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {contract.firmantes?.map((firmante, index) => (
                  <div key={index} className="text-center relative">
                    <div className="border-t border-black pt-2">
                      <div className="flex items-center justify-center mb-2">
                        <EditableField
                          value={firmante.rol}
                          onChange={(value) => updateFirmante(index, 'rol', value)}
                          placeholder="ROL"
                          className="font-bold text-sm uppercase text-center flex-1"
                        />
                        <button
                          onClick={() => deleteFirmante(index)}
                          className="pdf-hide ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar firmante"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <EditableField
                        value={firmante.nombre}
                        onChange={(value) => updateFirmante(index, 'nombre', value)}
                        placeholder="Nombre completo"
                        className="text-sm text-center mb-2"
                      />
                      <EditableField
                        value={firmante.rut}
                        onChange={(value) => updateFirmante(index, 'rut', value)}
                        placeholder="RUT"
                        className="text-sm text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para añadir firmante */}
              <div className="text-center mt-8">
                <button
                  onClick={addFirmante}
                  className="pdf-hide flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Añadir Firmante</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Mode Styles */}
      <style>{`
        .pdf-hide {
          display: none !important;
        }
        .print-borderless {
          border: none !important;
          box-shadow: none !important;
        }
        .print-mode {
          border-color: transparent !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
        }
        .print-mode:focus {
          border-color: transparent !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          outline: none !important;
        }
        /* Mejora del renderizado de fuentes para texto natural */
        .document-paper {
          font-kerning: auto;
          font-variant-ligatures: common-ligatures;
          text-rendering: optimizeLegibility;
        }
        .document-paper textarea {
          font-kerning: auto;
          font-variant-ligatures: common-ligatures;
          text-rendering: optimizeLegibility;
        }
      `}</style>
    </div>
  );
};

export default ContractCanvasEditor;

