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

  // Función para generar HTML desde secciones
  const generateContractHTML = (contractSections: any[], contractInfo: any) => {
    const sections = contractSections;

    // Si hay solo una sección completa (contrato HTML original), devolverla tal cual
    if (sections.length === 1 && sections[0].id === 'full_contract') {
      return sections[0].content;
    }

    // Si hay múltiples secciones estructuradas, generar HTML completo
    let html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contrato de Arriendo - ${contractInfo.applications?.snapshot_applicant_first_name || 'Cliente'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.8;
              color: #000;
              background: white;
              padding: 60px 100px;
              max-width: 210mm;
              margin: 0 auto;
              font-size: 14px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 25px;
              border-bottom: 3px double #000;
            }
            .contract-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 2px;
              line-height: 1.4;
            }
            .section {
              margin-bottom: 35px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 18px;
              text-transform: uppercase;
              color: #000;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              letter-spacing: 1px;
            }
            .section-content {
              text-align: justify;
              line-height: 1.9;
              margin-bottom: 15px;
            }
            p { margin-bottom: 12px; text-align: justify !important; }
            strong { font-weight: bold; }
            .text-center { text-align: center !important; }
            .emphasis { font-style: italic; font-weight: bold; }
            @media print {
              body { padding: 40px 60px; font-size: 12px; }
              .contract-title { font-size: 18px; }
              .section-title { font-size: 14px; }
            }
          </style>
        </head>
        <body>
    `;

    // Header
    html += `
      <div class="header">
        <div class="contract-title">CONTRATO DE ARRENDAMIENTO<br>DE BIEN RAÍZ URBANO</div>
        ${contractInfo.contract_number ? `<div class="contract-number">N° ${contractInfo.contract_number}</div>` : ''}
        <div class="contract-date">Santiago, Chile - ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
    `;

    // Sections
    const sectionMap = {
      parties: 'I. COMPARECIENTES',
      property: 'II. BIEN ARRENDADO',
      conditions: 'III. CONDICIONES DEL ARRENDAMIENTO',
      obligations: 'IV. OBLIGACIONES DE LAS PARTES',
      termination: 'V. TÉRMINO DEL CONTRATO',
      legal: 'VI. DISPOSICIONES LEGALES'
    };

    Object.entries(sectionMap).forEach(([sectionId, title]) => {
      const section = sections.find((s: any) => s.id === sectionId);
      if (section && section.content?.trim()) {
        html += `
          <div class="section">
            <div class="section-title">${title}</div>
            <div class="section-content" style="text-align: justify !important;">
              ${section.content}
            </div>
          </div>
        `;
      }
    });

    // Signatures
    html += `
      <div class="signature-section" style="margin-top: 80px; page-break-inside: avoid;">
        <div class="section-title text-center">FIRMAS</div>
        <p style="text-align: justify !important; margin-bottom: 30px; line-height: 1.9;">
          En comprobante de lo pactado, se firma el presente contrato en dos ejemplares de igual tenor y fecha,
          declarando las partes haber leído y aceptado todas y cada una de las cláusulas del presente instrumento.
        </p>
        <div style="display: flex; justify-content: space-between; margin-top: 60px; gap: 40px;">
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 2px solid #000; margin-bottom: 10px; padding-top: 10px;">
              <div style="font-weight: bold; text-transform: uppercase; font-size: 12px; margin-bottom: 6px;">ARRENDADOR</div>
              <div style="font-size: 13px; margin-bottom: 4px;">[Nombre]</div>
              <div style="font-size: 12px; color: #555;">[RUT]</div>
            </div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="border-top: 2px solid #000; margin-bottom: 10px; padding-top: 10px;">
              <div style="font-weight: bold; text-transform: uppercase; font-size: 12px; margin-bottom: 6px;">ARRENDATARIO</div>
              <div style="font-size: 13px; margin-bottom: 4px;">${contractInfo.applications?.snapshot_applicant_first_name || ''} ${contractInfo.applications?.snapshot_applicant_paternal_last_name || ''}</div>
              <div style="font-size: 12px; color: #555;">[RUT]</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Footer
    html += `
      <div style="margin-top: 60px; padding-top: 25px; border-top: 2px solid #ccc; text-align: center; font-size: 11px; color: #666; page-break-inside: avoid;">
        <div style="margin-bottom: 5px;"><strong>DOCUMENTO GENERADO ELECTRÓNICAMENTE</strong></div>
        <div style="margin-bottom: 5px;">ID del Contrato: ${contractInfo.id}</div>
        <div style="margin-bottom: 5px;">Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}</div>
        <div style="margin-top: 10px; font-style: italic;">
          Este contrato se rige por la Ley N° 18.101 sobre Arrendamiento de Bienes Raíces Urbanos
        </div>
      </div>
    `;

    html += `
        </body>
      </html>
    `;

    return html;
  };

  // Guardar cambios en la base de datos
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData: any = {
        contract_content: {
          ...contractData.contract_content,
          sections: sections
        },
        updated_at: new Date().toISOString()
      };

      // Solo generar y guardar HTML si el contrato originalmente lo tenía
      // Para contratos nuevos (de N8N), usar solo contract_content para optimización
      if (contractData.contract_html && sections.length > 1) {
        // Contrato con múltiples secciones estructuradas - generar HTML completo
        updateData.contract_html = generateContractHTML(sections, contractData);
      } else if (sections.length === 1 && sections[0].id === 'full_contract') {
        // Contrato HTML completo - guardar tal cual (ya está en contract_content)
        updateData.contract_html = sections[0].content;
      }
      // Para contratos nuevos de N8N: no guardar contract_html, solo contract_content

      // Actualizar el contrato en la base de datos
      const { error: updateError } = await supabase
        .from('rental_contracts')
        .update(updateData)
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

  const tabs = sections.length === 1 && sections[0].id === 'full_contract'
    ? [{ id: 'full_contract', label: 'Contrato Completo', icon: '📄' }]
    : [
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

              {sections.length === 1 && sections[0].id === 'full_contract' ? (
                <div className="mb-8">
                  <div
                    className="prose max-w-none text-justify"
                    dangerouslySetInnerHTML={{ __html: sections[0].content }}
                  />
                </div>
              ) : (
                sections.map(section => (
                  <div key={section.id} className="mb-8">
                    <h2 className="text-lg font-bold uppercase mb-4 pb-2 border-b-2 border-gray-900">
                      {section.title}
                    </h2>
                    <div
                      className="prose max-w-none text-justify"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {sections.length === 1 && sections[0].id === 'full_contract'
              ? 'Contrato completo editable'
              : `${sections.filter(s => s.content?.trim()).length} de ${sections.length} secciones completadas`
            }
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

