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

// EditableField sub-component - Implementación de Doble Capa
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
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, isEditing, multiline]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleContainerClick = () => {
    setIsEditing(true);
    // Dar un pequeño delay para asegurar que el textarea esté listo
    setTimeout(() => {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
      }
    }, 0);
  };

  if (multiline) {
    // Implementación de Doble Capa para textarea
    return (
      <div ref={containerRef} className="relative">
        {/* Capa Visible - Div que muestra el texto justificado */}
        <div
          onClick={handleContainerClick}
          className={`font-serif leading-relaxed text-justify cursor-text select-text whitespace-pre-wrap break-words ${className} ${
            isEditing
              ? 'border-b-2 border-blue-500 bg-blue-50 px-2 py-1 rounded'
              : 'hover:border-b hover:border-gray-300 px-0 py-0'
          }`}
          style={{
            minHeight: '80px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {value || <span className="text-gray-400 italic">{placeholder}</span>}
        </div>

        {/* Capa Invisible - Textarea siempre presente pero invisible */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`absolute inset-0 font-serif leading-relaxed text-justify bg-transparent border-0 outline-none resize-none overflow-hidden pointer-events-none text-transparent caret-current ${className} ${
            isEditing ? 'opacity-100 pointer-events-auto' : 'opacity-0'
          }`}
          style={{
            minHeight: '80px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            fontSize: 'inherit',
            lineHeight: 'inherit'
          }}
          rows={1}
        />
      </div>
    );
  }

  // Para inputs simples, mantener la implementación original
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`bg-transparent border-0 outline-none text-justify ${className} ${
        isEditing
          ? 'border-b-2 border-blue-500 bg-blue-50 px-2 py-1 rounded'
          : 'hover:border-b hover:border-gray-300 cursor-text px-0 py-0'
      }`}
    />
  );
};

const ContractCanvasEditor: React.FC<ContractCanvasEditorProps> = ({
  initialContract
}) => {
  const [contract, setContract] = useState<ContractContent>(initialContract);
  const [clausesToDelete, setClausesToDelete] = useState<Set<number>>(new Set());
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

  const toggleDeleteClause = (index: number) => {
    setClausesToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const confirmDeleteClause = (index: number) => {
    setContract(prev => ({
      ...prev,
      clausulas: prev.clausulas?.filter((_, i) => i !== index)
    }));
    setClausesToDelete(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
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
    if (!documentRef.current) return;

    try {
      setIsGeneratingPDF(true);

      // Apply print-mode class to hide borders and focus indicators
      documentRef.current.classList.add('print-mode');

      // Generate canvas with high resolution
      const canvas = await html2canvas(documentRef.current, {
        scale: 2, // Higher resolution for better quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: documentRef.current.offsetWidth,
        height: documentRef.current.offsetHeight
      });

      // Restore normal appearance
      documentRef.current.classList.remove('print-mode');

      // Create PDF with A4 dimensions and professional margins
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 20; // 20mm margin

      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Center the content with margins
      const x = margin;
      const y = margin;

      // Add the image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Download the PDF
      pdf.save('contrato-de-arrendamiento.pdf');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo nuevamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Barra de Herramientas Fija */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 sticky top-4 z-10">
          <div className="flex items-center justify-between">
      <div>
              <h1 className="text-xl font-semibold text-gray-900">Editor Canvas de Contrato</h1>
              <p className="text-sm text-gray-600 mt-1">Lienzo de Documento Dinámico</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={addClause}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Cláusula</span>
              </button>
              <CustomButton
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </CustomButton>
            </div>
          </div>
        </div>

        {/* Documento A4-like */}
        <div
          ref={documentRef}
          className="max-w-4xl mx-auto bg-white p-12 sm:pt-16 sm:px-16 shadow-lg border border-gray-200 font-serif"
          style={{ minHeight: '800px' }}
        >
            {/* Título Principal */}
            <div className="text-center mb-16">
              <h1 className="text-2xl font-bold text-center uppercase mb-8">
                <EditableField
                  value={contract.titulo}
                  onChange={updateTitle}
                  placeholder="TÍTULO DEL CONTRATO"
                  className="text-2xl font-bold text-center uppercase"
                />
              </h1>
        </div>

            {/* Comparecencia Section */}
            <div className="mb-16">
              <div className="text-sm leading-relaxed text-black text-justify">
                <EditableField
                  value={contract.comparecencia}
                  onChange={updateComparecencia}
                  placeholder="Escribe aquí la comparecencia de las partes..."
                  multiline={true}
                  className="text-sm leading-relaxed text-justify min-h-[80px]"
                />
              </div>
            </div>

            {/* Cláusulas con Espaciado Generoso */}
            <div className="space-y-8">
              {contract.clausulas?.map((clause, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between mb-1">
                    <EditableField
                      value={clause.titulo.replace(/:$/, '')}
                      onChange={(value) => updateClause(index, 'titulo', value)}
                      placeholder={`CLÁUSULA ${index + 1}`}
                      multiline={true}
                      className="flex-grow font-bold uppercase leading-normal min-h-[24px]"
                    />
                    <div className="flex items-center space-x-2">
                      {clausesToDelete.has(index) ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-red-600">¿Eliminar?</span>
                          <button
                            onClick={() => confirmDeleteClause(index)}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => toggleDeleteClause(index)}
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            No
                          </button>
                </div>
              ) : (
                        <button
                          onClick={() => toggleDeleteClause(index)}
                          className="flex items-center space-x-1 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Eliminar</span>
                        </button>
                      )}
                      </div>
                        </div>
                  <EditableField
                            value={clause.contenido}
                    onChange={(value) => updateClause(index, 'contenido', value)}
                            placeholder="Escribe el contenido de la cláusula..."
                    multiline={true}
                    className="text-sm leading-relaxed text-justify min-h-[80px]"
                          />
                    </div>
                  ))}

              {(!contract.clausulas || contract.clausulas.length === 0) && (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No hay cláusulas definidas</p>
                  <p className="text-xs mt-2">Haz clic en "Añadir Cláusula" para comenzar</p>
                </div>
              )}
            </div>

            {/* Firmas */}
            <div className="mt-16 pt-12 border-t-2 border-black">
              <div className="text-center mb-12">
                <p className="text-sm leading-relaxed text-justify">
                  En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha,
                  declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.
                </p>
              </div>

              {/* Firmantes Dinámicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                {contract.firmantes?.map((firmante, index) => (
                  <div key={index} className="text-center">
                    <div className="border-t border-black pt-2 relative">
                      <EditableField
                        value={firmante.rol}
                        onChange={(value) => updateFirmante(index, 'rol', value)}
                        placeholder="ROL"
                        className="font-bold text-sm uppercase text-center"
                      />
                      <div className="mt-4 space-y-2">
                        <EditableField
                          value={firmante.nombre}
                          onChange={(value) => updateFirmante(index, 'nombre', value)}
                          placeholder="Nombre completo"
                          className="text-sm text-center"
                        />
                        <EditableField
                          value={firmante.rut}
                          onChange={(value) => updateFirmante(index, 'rut', value)}
                          placeholder="RUT"
                          className="text-sm text-center"
                        />
                      </div>
                      {contract.firmantes && contract.firmantes.length > 1 && (
                        <button
                          onClick={() => deleteFirmante(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Eliminar firmante"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para añadir firmante */}
              <div className="text-center mt-12">
                <button
                  onClick={addFirmante}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Añadir Firmante</span>
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* Print Mode Styles */}
      <style jsx>{`
        .print-mode :global(.hover\\:border-b) {
          border-bottom: none !important;
        }
        .print-mode :global(.hover\\:border-gray-300) {
          border-color: transparent !important;
        }
        .print-mode :global(.border-blue-500) {
          border-color: transparent !important;
        }
        .print-mode :global(.bg-blue-50) {
          background-color: transparent !important;
        }
        .print-mode :global(.px-2) {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .print-mode :global(.py-1) {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }
        .print-mode :global(.rounded) {
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default ContractCanvasEditor;
