import React, { useState, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, Edit2, Save, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';

// ============================================================================
// INTERFACES DE TYPESCRIPT
// ============================================================================

interface Firmante {
  id: string;
  nombre: string;
  rut: string;
  rol: string;
}

interface Clausula {
  id: string;
  titulo: string;
  contenido: string;
}

interface ContractData {
  titulo: string;
  comparecencia: string;
  clausulas: Clausula[];
  cierre: string;
  firmantes: Firmante[];
}

interface ContractCanvasEditorProps {
  initialContract: Partial<ContractData>;
  contractId?: string;
  onSave?: (contract: ContractData) => void;
  onChange?: (contract: ContractData) => void;
  showSaveButton?: boolean;
}

// ============================================================================
// COMPONENTE EDITABLECONTENT - MODO EDICIÓN/VISTA (SOLUCIÓN DEFINITIVA)
// ============================================================================

interface EditableContentProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  onToggleEdit: (id: string | null) => void;
  placeholder?: string;
  className?: string;
  viewClassName?: string;
}

const EditableContent: React.FC<EditableContentProps> = ({
  id,
  value,
  onChange,
  isEditing,
  onToggleEdit,
  placeholder = '',
  className = '',
  viewClassName = ''
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-ajuste de altura al cargar y al escribir
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing, value]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
    onChange(target.value);
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={handleInput}
        onBlur={() => onToggleEdit(null)}
        placeholder={placeholder}
        className={`bg-blue-50 border-2 border-blue-300 rounded-md outline-none resize-none w-full p-2 m-0 overflow-hidden ${className}`}
        style={{ minHeight: '1.5em' }}
      />
    );
  }

  return (
    <div
      onClick={() => onToggleEdit(id)}
      className={`cursor-pointer hover:bg-blue-50 hover:ring-2 hover:ring-blue-200 rounded-md transition-all duration-200 p-2 -m-2 relative group ${viewClassName}`}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
      <Edit2 className="absolute top-2 right-2 h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity pdf-hide" />
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ContractCanvasEditor: React.FC<ContractCanvasEditorProps> = ({
  initialContract,
  contractId,
  onSave,
  onChange,
  showSaveButton = true
}) => {
  // Estado del contrato
  const [contract, setContract] = useState<ContractData>({
    titulo: initialContract.titulo || 'CONTRATO DE ARRENDAMIENTO',
    comparecencia: initialContract.comparecencia || 'Comparecen de una parte...',
    clausulas: initialContract.clausulas || [
      {
        id: '1',
        titulo: 'PRIMERA',
        contenido: 'El arrendador se compromete a entregar la propiedad en perfectas condiciones...'
      }
    ],
    cierre: initialContract.cierre || 'En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha, declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.',
    firmantes: initialContract.firmantes || [
      { id: '1', nombre: '', rut: '', rol: 'ARRENDADOR' },
      { id: '2', nombre: '', rut: '', rol: 'ARRENDATARIO' }
    ]
  });

  // Estado de edición (solución definitiva para renderizado perfecto)
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado de guardado
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Notificar cambios al componente padre
  useEffect(() => {
    if (onChange) {
      onChange(contract);
    }
  }, [contract]);

  // ============================================================================
  // FUNCIONES DE ACTUALIZACIÓN
  // ============================================================================

  const updateTitle = (value: string) => {
    setContract(prev => ({ ...prev, titulo: value }));
  };

  const updateComparecencia = (value: string) => {
    setContract(prev => ({ ...prev, comparecencia: value }));
  };

  const updateCierre = (value: string) => {
    setContract(prev => ({ ...prev, cierre: value }));
  };

  const updateClause = (id: string, field: 'titulo' | 'contenido', value: string) => {
    setContract(prev => ({
      ...prev,
      clausulas: prev.clausulas.map(clause =>
        clause.id === id ? { ...clause, [field]: value } : clause
      )
    }));
  };

  const addClause = () => {
    const newId = Date.now().toString();
    setContract(prev => ({
      ...prev,
      clausulas: [
        ...prev.clausulas,
        { id: newId, titulo: 'NUEVA CLÁUSULA', contenido: '...' }
      ]
    }));
  };

  const deleteClause = (id: string) => {
    setContract(prev => ({
      ...prev,
      clausulas: prev.clausulas.filter(clause => clause.id !== id)
    }));
  };

  const updateFirmante = (id: string, field: 'nombre' | 'rut' | 'rol', value: string) => {
    setContract(prev => ({
      ...prev,
      firmantes: prev.firmantes.map(firmante =>
        firmante.id === id ? { ...firmante, [field]: value } : firmante
      )
    }));
  };

  const addFirmante = () => {
    const newId = Date.now().toString();
    setContract(prev => ({
      ...prev,
      firmantes: [
        ...prev.firmantes,
        { id: newId, nombre: '', rut: '', rol: 'AVAL' }
      ]
    }));
  };

  const deleteFirmante = (id: string) => {
    setContract(prev => ({
      ...prev,
      firmantes: prev.firmantes.filter(firmante => firmante.id !== id)
    }));
  };

  // ============================================================================
  // FUNCIÓN DE GUARDADO EN BASE DE DATOS
  // ============================================================================
  
  const handleSaveChanges = async () => {
    if (!contractId) {
      console.error('No se puede guardar: contractId no proporcionado');
      alert('Error: No se puede guardar el contrato sin un ID válido');
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Llamar al callback onSave si existe
      if (onSave) {
        await onSave(contract);
      } else {
        // Guardar directamente en la base de datos
        const { error } = await supabase
          .from('rental_contracts')
          .update({ 
            contract_content: contract,
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId);

        if (error) throw error;
      }

      // Mostrar feedback de éxito
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      console.log('✅ Contrato guardado exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error al guardar el contrato:', error);
      alert('Error al guardar los cambios: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // FUNCIÓN DE EXPORTACIÓN A PDF - ALGORITMO DEFINITIVO DE "REBANADO" DE CANVAS
  // ============================================================================
  // Esta versión garantiza márgenes perfectos en todas las páginas mediante:
  // 1. Cálculo preciso: Convierte contentHeight (mm) a píxeles exactos del canvas
  // 2. Rebanado por página: Crea canvas individuales para cada página
  // 3. Manejo del final: Solo rebana el contenido restante en la última página
  // 4. Respeto por márgenes: 15mm en los 4 lados de todas las páginas
  // ============================================================================

  const handleDownloadPDF = async () => {
    // PASO 1: Asegurar que no hay elementos en edición (modo vista perfecto)
    setEditingId(null);
    
    // Esperar un tick para que React renderice el cambio
    await new Promise(resolve => setTimeout(resolve, 100));

    const documentContainer = document.getElementById('document-canvas');
    if (!documentContainer) return;

    // --- Preparación de la UI ---
    const elementsToHide = document.querySelectorAll('.pdf-hide');
    documentContainer.classList.add('print-borderless');
    elementsToHide.forEach(el => (el as HTMLElement).style.visibility = 'hidden');

    try {
      // --- Captura Única del Canvas ---
      const originalCanvas = await html2canvas(documentContainer, { 
        scale: 2,
        useCORS: true,
        logging: false
      });

      // --- Configuración del PDF y Dimensiones ---
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15; // 1.5 cm
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = pdfHeight - margin * 2;

      // --- Dimensiones del Canvas Original ---
      const originalCanvasWidth = originalCanvas.width;
      const originalCanvasHeight = originalCanvas.height;

      // Convertir contentHeight (en mm) a la altura equivalente en píxeles del canvas original
      const sliceHeightInPixels = (contentHeight * originalCanvasWidth) / contentWidth;

      const numPages = Math.ceil(originalCanvasHeight / sliceHeightInPixels);
      let renderedHeight = 0;

      // --- Bucle de "Rebanado" Final y Corregido ---
      for (let i = 0; i < numPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const pageCanvas = document.createElement('canvas');
        const pageContext = pageCanvas.getContext('2d');
        if (!pageContext) continue;

        pageCanvas.width = originalCanvasWidth;
        pageCanvas.height = sliceHeightInPixels;

        // Altura restante en el canvas original
        const remainingHeight = originalCanvasHeight - renderedHeight;
        // La altura a cortar es la menor entre una página completa o lo que quede
        const heightToDraw = Math.min(sliceHeightInPixels, remainingHeight);

        // Cortar la rebanada del canvas original
        pageContext.drawImage(
          originalCanvas,
          0, // sourceX
          renderedHeight, // sourceY
          originalCanvasWidth, // sourceWidth
          heightToDraw, // sourceHeight
          0, // destX
          0, // destY
          originalCanvasWidth, // destWidth
          heightToDraw // destHeight
        );

        // Añadir la rebanada al PDF
        const pageDataUrl = pageCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(pageDataUrl, 'PNG', margin, margin, contentWidth, contentHeight);
        
        renderedHeight += sliceHeightInPixels;
      }

      pdf.save('contrato-final-profesional.pdf');

    } catch (error) {
      console.error("Error al generar el PDF:", error);
    } finally {
      // --- Restauración de la UI ---
      documentContainer.classList.remove('print-borderless');
      elementsToHide.forEach(el => (el as HTMLElement).style.visibility = 'visible');
    }
  };

  // ============================================================================
  // RENDER DEL COMPONENTE
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* BARRA DE HERRAMIENTAS */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 sticky top-4 z-10 pdf-hide">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Editor Canvas de Contrato</h1>
              <p className="text-sm text-gray-600 mt-1">Lienzo de Documento Dinámico</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={addClause}
                className="pdf-hide flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Cláusula</span>
              </button>
              
              {showSaveButton && contractId && (
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className={`pdf-hide flex items-center space-x-2 px-4 py-2 text-sm rounded-md transition-colors border ${
                    saveSuccess 
                      ? 'bg-green-50 text-green-700 border-green-300' 
                      : isSaving
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Guardado ✓</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleDownloadPDF}
                className="pdf-hide flex items-center space-x-2 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors border border-green-200"
              >
                <Download className="h-4 w-4" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* LIENZO PRINCIPAL DEL DOCUMENTO */}
        <div
          id="document-canvas"
          className="max-w-4xl mx-auto bg-white p-16 shadow-lg border border-gray-200"
          style={{ minHeight: '1000px' }}
        >
          
          {/* TÍTULO PRINCIPAL */}
          <div className="mb-16">
            <EditableContent
              id="titulo"
              value={contract.titulo}
              onChange={updateTitle}
              isEditing={editingId === 'titulo'}
              onToggleEdit={setEditingId}
              placeholder="TÍTULO DEL CONTRATO"
              className="font-serif text-2xl font-bold text-center uppercase text-gray-900"
              viewClassName="font-serif text-2xl font-bold text-center uppercase text-gray-900"
            />
          </div>

          {/* COMPARECENCIA */}
          <div className="mb-12">
            <EditableContent
              id="comparecencia"
              value={contract.comparecencia}
              onChange={updateComparecencia}
              isEditing={editingId === 'comparecencia'}
              onToggleEdit={setEditingId}
              placeholder="Escribe aquí la comparecencia de las partes..."
              className="font-serif text-base leading-relaxed text-gray-800"
              viewClassName="font-serif text-base leading-relaxed text-justify text-gray-800"
            />
          </div>

          {/* CLÁUSULAS */}
          <div className="space-y-8">
            {contract.clausulas.map((clausula) => (
              <div key={clausula.id} className="mb-8">
                <div className="flex items-start justify-between mb-2">
                  <EditableContent
                    key={`clausula-titulo-${clausula.id}`}
                    id={`clausula-titulo-${clausula.id}`}
                    value={clausula.titulo}
                    onChange={(value) => updateClause(clausula.id, 'titulo', value)}
                    isEditing={editingId === `clausula-titulo-${clausula.id}`}
                    onToggleEdit={setEditingId}
                    placeholder="TÍTULO DE LA CLÁUSULA"
                    className="font-serif font-bold uppercase text-gray-900"
                    viewClassName="font-serif font-bold uppercase text-gray-900 flex-1"
                  />
                  <button
                    onClick={() => deleteClause(clausula.id)}
                    className="pdf-hide ml-2 p-1 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                    title="Eliminar cláusula"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <EditableContent
                  key={`clausula-contenido-${clausula.id}`}
                  id={`clausula-contenido-${clausula.id}`}
                  value={clausula.contenido}
                  onChange={(value) => updateClause(clausula.id, 'contenido', value)}
                  isEditing={editingId === `clausula-contenido-${clausula.id}`}
                  onToggleEdit={setEditingId}
                  placeholder="Escribe el contenido de la cláusula..."
                  className="font-serif text-base leading-relaxed text-gray-800"
                  viewClassName="font-serif text-base leading-relaxed text-justify text-gray-800"
                />
              </div>
            ))}
          </div>

          {/* CIERRE */}
          <div className="mt-16 mb-16">
            <EditableContent
              id="cierre"
              value={contract.cierre}
              onChange={updateCierre}
              isEditing={editingId === 'cierre'}
              onToggleEdit={setEditingId}
              placeholder="En comprobante de lo pactado..."
              className="font-serif text-base leading-relaxed text-gray-800"
              viewClassName="font-serif text-base leading-relaxed text-justify text-gray-800"
            />
          </div>

          {/* SECCIÓN DE FIRMAS */}
          <div className="mt-20 pt-8">
            <div className="space-y-16">
              {contract.firmantes.map((firmante) => (
                <div key={firmante.id} className="border-t border-gray-400 pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <EditableContent
                        key={`firmante-rol-${firmante.id}`}
                        id={`firmante-rol-${firmante.id}`}
                        value={firmante.rol}
                        onChange={(value) => updateFirmante(firmante.id, 'rol', value)}
                        isEditing={editingId === `firmante-rol-${firmante.id}`}
                        onToggleEdit={setEditingId}
                        placeholder="ROL"
                        className="font-serif font-bold uppercase text-sm text-gray-900"
                        viewClassName="font-serif font-bold uppercase text-sm text-gray-900 mb-2"
                      />
                      <EditableContent
                        key={`firmante-nombre-${firmante.id}`}
                        id={`firmante-nombre-${firmante.id}`}
                        value={firmante.nombre}
                        onChange={(value) => updateFirmante(firmante.id, 'nombre', value)}
                        isEditing={editingId === `firmante-nombre-${firmante.id}`}
                        onToggleEdit={setEditingId}
                        placeholder="Nombre completo"
                        className="font-serif text-sm text-gray-800"
                        viewClassName="font-serif text-sm text-gray-800 mb-1"
                      />
                      <EditableContent
                        key={`firmante-rut-${firmante.id}`}
                        id={`firmante-rut-${firmante.id}`}
                        value={firmante.rut}
                        onChange={(value) => updateFirmante(firmante.id, 'rut', value)}
                        isEditing={editingId === `firmante-rut-${firmante.id}`}
                        onToggleEdit={setEditingId}
                        placeholder="RUT"
                        className="font-serif text-sm text-gray-700"
                        viewClassName="font-serif text-sm text-gray-700"
                      />
                    </div>
                    <button
                      onClick={() => deleteFirmante(firmante.id)}
                      className="pdf-hide ml-2 p-1 text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                      title="Eliminar firmante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Espacio para firma manuscrita */}
                  <div className="h-32"></div>
                </div>
              ))}
            </div>

            {/* BOTÓN AÑADIR FIRMANTE */}
            <div className="mt-8 text-center">
              <button
                onClick={addFirmante}
                className="pdf-hide inline-flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <Plus className="h-4 w-4" />
                <span>Añadir Firmante</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ESTILOS DE SOPORTE */}
      <style>{`
        .print-borderless {
          border: none !important;
          box-shadow: none !important;
        }
        
        textarea {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        }
        
        /* Ocultar elementos en modo PDF */
        .pdf-hide[style*="visibility: hidden"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default ContractCanvasEditor;
