import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import CustomButton from '../common/CustomButton';

interface ContractContent {
  titulo: string;
  comparecencia: string;
  clausulas?: Array<{
    titulo: string;
    contenido: string;
  }>;
}

interface ContractCanvasEditorProps {
  initialContract: ContractContent;
}

// EditableField sub-component
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

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`bg-transparent border-0 outline-none resize-none overflow-hidden text-justify leading-relaxed ${className} ${
          isEditing
            ? 'border-b-2 border-blue-500 bg-blue-50 px-2 py-1 rounded'
            : 'hover:border-b hover:border-gray-300 cursor-text px-0 py-0'
        }`}
        rows={1}
      />
    );
  }

  return (
    <input
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
      clausulas: prev.clausulas || []
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
    setContract(prev => ({
      ...prev,
      clausulas: prev.clausulas?.map((clause, i) =>
        i === index ? { ...clause, [field]: value } : clause
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
          className="max-w-4xl mx-auto bg-white p-12 sm:p-16 shadow-lg border border-gray-200 font-serif"
          style={{ minHeight: '800px' }}
        >
            {/* Título Principal */}
            <div className="text-center mb-8">
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold uppercase mb-2">
                      <EditableField
                        value={clause.titulo}
                        onChange={(value) => updateClause(index, 'titulo', value)}
                        placeholder={`CLÁUSULA ${index + 1}`}
                        className="font-bold uppercase"
                      />
                      :
                    </h3>
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

              <div className="flex justify-between mt-16">
                <div className="text-center flex-1">
                  <div className="border-t border-black pt-2">
                    <p className="font-bold text-sm">ARRENDADOR</p>
                    <p className="text-xs mt-2">[Nombre]</p>
                    <p className="text-xs">[RUT]</p>
                  </div>
                </div>

                <div className="text-center flex-1">
                  <div className="border-t border-black pt-2">
                    <p className="font-bold text-sm">ARRENDATARIO</p>
                    <p className="text-xs mt-2">[Nombre]</p>
                    <p className="text-xs">[RUT]</p>
                  </div>
                </div>
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
