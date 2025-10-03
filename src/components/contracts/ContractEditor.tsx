import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import CustomButton from '../common/CustomButton';
import { supabase } from '../../lib/supabase';

interface ContractEditorProps {
  contractId: string;
  contractData: any;
  onClose: () => void;
  onSave: () => void;
}

interface ContractSection {
  id: string;
  title: string;
  content: string;
}

const ContractEditor: React.FC<ContractEditorProps> = ({
  contractId,
  contractData,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('parties');
  const [sections, setSections] = useState<ContractSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración del editor Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align'
  ];

  // Inicializar secciones desde el contrato
  useEffect(() => {
    if (contractData?.contract_content?.sections) {
      setSections(contractData.contract_content.sections);
    } else {
      // Secciones por defecto si no existen
      setSections([
        { id: 'parties', title: 'I. COMPARECIENTES', content: '' },
        { id: 'property', title: 'II. BIEN ARRENDADO', content: '' },
        { id: 'conditions', title: 'III. CONDICIONES DEL ARRENDAMIENTO', content: '' },
        { id: 'obligations', title: 'IV. OBLIGACIONES DE LAS PARTES', content: '' },
        { id: 'termination', title: 'V. TÉRMINO DEL CONTRATO', content: '' },
        { id: 'legal', title: 'VI. DISPOSICIONES LEGALES', content: '' }
      ]);
    }
  }, [contractData]);

  // Actualizar contenido de una sección
  const handleSectionChange = (sectionId: string, content: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, content } : section
    ));
  };

  // Guardar cambios en la base de datos
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Actualizar el contrato en la base de datos
      const { error: updateError } = await supabase
        .from('rental_contracts')
        .update({
          contract_content: {
            ...contractData.contract_content,
            sections: sections
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSave(); // Notificar al componente padre
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error al guardar el contrato:', err);
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const currentSection = sections.find(s => s.id === activeTab);

  const tabs = [
    { id: 'parties', label: 'Comparecientes', icon: '👥' },
    { id: 'property', label: 'Propiedad', icon: '🏠' },
    { id: 'conditions', label: 'Condiciones', icon: '📋' },
    { id: 'obligations', label: 'Obligaciones', icon: '✓' },
    { id: 'termination', label: 'Término', icon: '⏹' },
    { id: 'legal', label: 'Legal', icon: '⚖️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Editar Contrato
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              ID: {contractId}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <CustomButton
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Editor' : 'Vista Previa'}</span>
            </CustomButton>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mensajes de estado */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>¡Cambios guardados exitosamente!</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {!showPreview ? (
          <>
            {/* Tabs */}
            <div className="border-b px-6">
              <div className="flex space-x-1 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-3 font-medium text-sm
                      border-b-2 transition-colors whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentSection?.title}
                </h3>
                
                <div className="bg-white border rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={currentSection?.content || ''}
                    onChange={(content) => handleSectionChange(activeTab, content)}
                    modules={quillModules}
                    formats={quillFormats}
                    className="h-96"
                    placeholder="Escribe el contenido de esta sección..."
                  />
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Consejo:</strong> Usa las herramientas de formato para dar estructura al texto.
                    El contenido se guardará y se mostrará con formato justificado en el contrato final.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Vista Previa */
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg rounded-lg">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold uppercase mb-4">
                  CONTRATO DE ARRENDAMIENTO<br/>DE BIEN RAÍZ URBANO
                </h1>
                <p className="text-sm text-gray-600">Vista Previa del Contrato</p>
              </div>

              {sections.map(section => (
                <div key={section.id} className="mb-8">
                  <h2 className="text-lg font-bold uppercase mb-4 pb-2 border-b-2 border-gray-900">
                    {section.title}
                  </h2>
                  <div 
                    className="prose max-w-none text-justify"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {sections.filter(s => s.content?.trim()).length} de {sections.length} secciones completadas
          </div>
          <div className="flex space-x-3">
            <CustomButton
              onClick={onClose}
              variant="outline"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractEditor;

