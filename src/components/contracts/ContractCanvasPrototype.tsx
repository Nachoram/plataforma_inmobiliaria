import React, { useState, useEffect } from 'react';
import { Save, Edit3, FileText, Check, X, Eye, EyeOff, Download, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface ContractCanvasPrototypeProps {
  contractId?: string;
  initialContent?: any;
  onSave?: (content: any) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

interface ContractSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

const ContractCanvasPrototype: React.FC<ContractCanvasPrototypeProps> = ({
  contractId,
  initialContent,
  onSave,
  onCancel,
  readOnly = false
}) => {
  const [contract, setContract] = useState<any>(null);
  const [sections, setSections] = useState<ContractSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(true);

  useEffect(() => {
    if (contractId) {
      loadContract();
    } else if (initialContent) {
      setSections(initialContent.sections || []);
      setLoading(false);
    } else {
      loadDefaultContract();
    }
  }, [contractId, initialContent]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rental_contracts')
        .select(`
          *,
          rental_contract_conditions (
            lease_term_months,
            payment_day,
            final_price_clp,
            broker_commission_clp,
            guarantee_amount_clp,
            official_communication_email,
            accepts_pets,
            dicom_clause,
            additional_conditions
          ),
          applications (
            id,
            snapshot_applicant_first_name,
            snapshot_applicant_paternal_last_name,
            snapshot_applicant_maternal_last_name,
            snapshot_applicant_rut,
            snapshot_applicant_email,
            snapshot_applicant_phone,
            properties (
              title,
              address,
              owner_id,
              profiles!properties_owner_id_fkey (
                first_name,
                paternal_last_name,
                maternal_last_name,
                rut,
                email,
                phone
              )
            ),
            guarantors (
              guarantor_id,
              profiles!guarantors_guarantor_id_fkey (
                first_name,
                paternal_last_name,
                maternal_last_name,
                rut,
                email,
                phone
              )
            )
          )
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;

      setContract(data);

      // Si no hay contenido, generar el contrato inicial
      if (!data.contract_content || Object.keys(data.contract_content).length === 0) {
        const generatedSections = generateContractSections(data);
        setSections(generatedSections);
      } else {
        setSections(data.contract_content.sections || []);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      // Si falla la carga, mostrar contrato por defecto
      loadDefaultContract();
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultContract = () => {
    const defaultSections: ContractSection[] = [
      {
        id: 'header',
        title: 'ENCABEZADO DEL CONTRATO',
        content: `
CONTRATO DE ARRENDAMIENTO DE VIVIENDA

En Santiago, a ${new Date().toLocaleDateString('es-ES')}

Entre las partes que se individualizan más adelante.`,
        editable: false
      },
      {
        id: 'parties',
        title: 'PARTES CONTRATANTES',
        content: `
ARRANDADOR: [Nombre del propietario]
RUT: [RUT del propietario]
Domicilio: [Dirección de la propiedad]

ARRENDATARIO: [Nombre del arrendatario]
RUT: [RUT del arrendatario]

AVAL: [Nombre del aval]
RUT: [RUT del aval]`,
        editable: true
      },
      {
        id: 'property',
        title: 'BIEN ARRENDADO',
        content: `
Se arrienda la propiedad ubicada en: [Dirección completa]
Tipo: [Tipo de propiedad - Casa/Depto/Oficina]
Superficie: [Metros cuadrados] m²
Estado: [Estado de entrega]`,
        editable: true
      },
      {
        id: 'conditions',
        title: 'CONDICIONES DEL CONTRATO',
        content: `
PLAZO: [Número] meses, desde [fecha inicio] hasta [fecha término]

PRECIO MENSUAL: $[monto] CLP
DÍA DE PAGO: [día] de cada mes

GARANTÍA: $[monto] CLP (equivalente a 1 mes de arriendo)

COMISIONES: $[monto] CLP (comisión del corredor)

COMUNICACIONES: [email oficial para comunicaciones]`,
        editable: true
      },
      {
        id: 'obligations',
        title: 'DERECHOS Y OBLIGACIONES',
        content: `
OBLIGACIONES DEL ARRENDADOR:
- Entregar la propiedad en buen estado
- Mantener las instalaciones en condiciones habitables
- Respetar el derecho a la tranquilidad

OBLIGACIONES DEL ARRENDATARIO:
- Pagar puntualmente el arriendo
- Mantener la propiedad en buen estado
- Permitir inspecciones con aviso previo
- No realizar modificaciones sin autorización
- Respetar normas de convivencia`,
        editable: true
      },
      {
        id: 'termination',
        title: 'TERMINACIÓN',
        content: `
El contrato podrá terminarse por:
- Mutuo acuerdo entre las partes
- Vencimiento del plazo pactado
- Incumplimiento de las obligaciones
- Necesidad del arrendador de ocupar la propiedad

Indemnización por terminación anticipada: 1 mes de arriendo`,
        editable: true
      },
      {
        id: 'signatures',
        title: 'FIRMAS',
        content: `

_______________________________    _______________________________
ARRANDADOR                                 ARRENDATARIO

[NOMBRE COMPLETO]                         [NOMBRE COMPLETO]
RUT: [RUT]                               RUT: [RUT]

_______________________________
AVAL

[NOMBRE COMPLETO]
RUT: [RUT]`,
        editable: false
      }
    ];

    setSections(defaultSections);
    setLoading(false);
  };

  const generateContractSections = (contractData: any): ContractSection[] => {
    const conditions = contractData.rental_contract_conditions;
    const application = contractData.applications;
    const property = application.properties;
    const owner = property.profiles;
    const tenant = {
      first_name: application.snapshot_applicant_first_name,
      paternal_last_name: application.snapshot_applicant_paternal_last_name,
      maternal_last_name: application.snapshot_applicant_maternal_last_name,
      rut: application.snapshot_applicant_rut,
      email: application.snapshot_applicant_email,
      phone: application.snapshot_applicant_phone
    };
    const guarantor = application.guarantors?.[0]?.profiles;

    return [
      {
        id: 'header',
        title: 'ENCABEZADO DEL CONTRATO',
        content: `
CONTRATO DE ARRENDAMIENTO DE VIVIENDA

En Santiago, a ${new Date().toLocaleDateString('es-ES')}

Entre las partes que se individualizan más adelante.`,
        editable: false
      },
      {
        id: 'parties',
        title: 'PARTES CONTRATANTES',
        content: `
ARRANDADOR: ${owner.first_name} ${owner.paternal_last_name} ${owner.maternal_last_name || ''}
RUT: ${owner.rut}
Domicilio: ${property.address}

ARRENDATARIO: ${tenant.first_name} ${tenant.paternal_last_name} ${tenant.maternal_last_name || ''}
RUT: ${tenant.rut}
Email: ${tenant.email}

${guarantor ? `AVAL: ${guarantor.first_name} ${guarantor.paternal_last_name} ${guarantor.maternal_last_name || ''}
RUT: ${guarantor.rut}
Email: ${guarantor.email}` : 'AVAL: [No especificado]'}`,
        editable: true
      },
      {
        id: 'property',
        title: 'BIEN ARRENDADO',
        content: `
Se arrienda la propiedad ubicada en: ${property.address}
Tipo: ${property.title}
Estado: En buen estado de conservación y funcionamiento`,
        editable: true
      },
      {
        id: 'conditions',
        title: 'CONDICIONES DEL CONTRATO',
        content: `
PLAZO: ${conditions.lease_term_months} meses

PRECIO MENSUAL: ${formatPrice(conditions.final_price_clp)} CLP
DÍA DE PAGO: ${conditions.payment_day} de cada mes

GARANTÍA: ${formatPrice(conditions.guarantee_amount_clp)} CLP

${conditions.broker_commission_clp > 0 ? `COMISIÓN CORREDOR: ${formatPrice(conditions.broker_commission_clp)} CLP` : ''}

COMUNICACIONES: ${conditions.official_communication_email}

${conditions.accepts_pets ? 'MASCOTAS: Permitidas' : 'MASCOTAS: No permitidas'}
${conditions.dicom_clause ? 'CLÁUSULA DICOM: Incluida' : 'CLÁUSULA DICOM: No incluida'}

${conditions.additional_conditions ? `CONDICIONES ADICIONALES: ${conditions.additional_conditions}` : ''}`,
        editable: true
      },
      {
        id: 'obligations',
        title: 'DERECHOS Y OBLIGACIONES',
        content: `
OBLIGACIONES DEL ARRENDADOR:
• Entregar la propiedad en buen estado
• Mantener las instalaciones en condiciones habitables
• Respetar el derecho a la tranquilidad

OBLIGACIONES DEL ARRENDATARIO:
• Pagar puntualmente el arriendo
• Mantener la propiedad en buen estado
• Permitir inspecciones con aviso previo
• No realizar modificaciones sin autorización
• Respetar normas de convivencia`,
        editable: true
      },
      {
        id: 'termination',
        title: 'TERMINACIÓN',
        content: `
El contrato podrá terminarse por:
• Mutuo acuerdo entre las partes
• Vencimiento del plazo pactado
• Incumplimiento de las obligaciones
• Necesidad del arrendador de ocupar la propiedad

Indemnización por terminación anticipada: 1 mes de arriendo`,
        editable: true
      },
      {
        id: 'signatures',
        title: 'FIRMAS',
        content: `

_______________________________    _______________________________
ARRANDADOR                                 ARRENDATARIO

${owner.first_name} ${owner.paternal_last_name}     ${tenant.first_name} ${tenant.paternal_last_name}
RUT: ${owner.rut}                              RUT: ${tenant.rut}

${guarantor ? `
_______________________________
AVAL

${guarantor.first_name} ${guarantor.paternal_last_name}
RUT: ${guarantor.rut}` : ''}`,
        editable: false
      }
    ];
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleEditSection = (section: ContractSection) => {
    if (readOnly || !section.editable) return;
    setEditingSection(section.id);
    setEditingContent(section.content);
  };

  const handleSaveSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, content: editingContent }
          : section
      )
    );
    setEditingSection(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditingContent('');
  };

  const handleSaveContract = async () => {
    setSaving(true);
    try {
      const contractContent = {
        sections,
        lastModified: new Date().toISOString(),
        version: (contract?.contract_content?.version || 0) + 1
      };

      if (contractId) {
        const { error } = await supabase
          .from('rental_contracts')
          .update({
            contract_content: contractContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId);

        if (error) throw error;
      }

      if (onSave) {
        onSave(contractContent);
      }

      alert('Contrato guardado exitosamente');
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Error al guardar el contrato');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = sections.map(section =>
      `${section.title}\n${'='.repeat(section.title.length)}\n\n${section.content}\n\n`
    ).join('');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contrato-arrendamiento.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-bold">Canvas del Contrato</h2>
            <p className="text-blue-100 text-sm">
              {readOnly ? 'Vista previa del contrato' : 'Editor prototípico del contrato de arriendo'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{previewMode ? 'Editar' : 'Vista'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Descargar</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
          {!readOnly && (
            <CustomButton
              onClick={handleSaveContract}
              disabled={saving}
              loading={saving}
              loadingText="Guardando..."
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </CustomButton>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Contract Content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                {!readOnly && section.editable && !previewMode && (
                  <div className="flex space-x-2">
                    {editingSection === section.id ? (
                      <>
                        <button
                          onClick={() => handleSaveSection(section.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          <Check className="h-3 w-3" />
                          <span>Guardar</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditSection(section)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {editingSection === section.id && !previewMode ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                  placeholder="Ingresa el contenido de esta sección..."
                />
              ) : (
                <div className="bg-white p-4 rounded border whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with contract info */}
      <div className="px-6 py-4 bg-gray-50 border-t rounded-b-xl">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Estado del contrato:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              contract?.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              contract?.status === 'approved' ? 'bg-green-100 text-green-800' :
              contract?.status === 'sent_to_signature' ? 'bg-blue-100 text-blue-800' :
              contract?.status === 'fully_signed' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {contract?.status || 'borrador'}
            </span>
          </div>
          <div>
            Última modificación: {contract?.updated_at ? new Date(contract.updated_at).toLocaleString('es-ES') : 'Nunca'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCanvasPrototype;
