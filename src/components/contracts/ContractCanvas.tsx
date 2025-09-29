import React, { useState, useEffect, useRef } from 'react';
import { Save, Edit3, FileText, Check, X, Eye, EyeOff } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface ContractCanvasProps {
  contractId: string;
  initialContent?: any;
  onSave?: (content: any) => void;
  onCancel?: () => void;
  readOnly?: boolean;
  showPreview?: boolean;
}

interface ContractSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

const ContractCanvas: React.FC<ContractCanvasProps> = ({
  contractId,
  initialContent,
  onSave,
  onCancel,
  readOnly = false,
  showPreview = true
}) => {
  const [contract, setContract] = useState<any>(null);
  const [sections, setSections] = useState<ContractSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(showPreview);
  const [loading, setLoading] = useState(true);

  const quillRef = useRef<ReactQuill>(null);

  // Configuración del editor
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link'],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'align'
  ];

  useEffect(() => {
    loadContract();
  }, [contractId]);

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
      alert('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
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
          <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
            CONTRATO DE ARRENDAMIENTO DE VIVIENDA
          </h1>
          <p style="text-align: center; margin-bottom: 30px;">
            Celebrado entre las partes que al final se individualizan, al amparo de lo dispuesto en la ley N° 18.101 sobre Arrendamiento de Bienes Raíces.
          </p>
        `,
        editable: false
      },
      {
        id: 'parties',
        title: 'PARTES CONTRATANTES',
        content: `
          <h3>PROPIETARIO ARRENDADOR:</h3>
          <p><strong>Nombre:</strong> ${owner.first_name} ${owner.paternal_last_name} ${owner.maternal_last_name || ''}</p>
          <p><strong>RUT:</strong> ${owner.rut}</p>
          <p><strong>Domicilio:</strong> ${property.address}</p>
          <p><strong>Email:</strong> ${owner.email}</p>
          <p><strong>Teléfono:</strong> ${owner.phone || 'No especificado'}</p>

          <h3 style="margin-top: 20px;">ARRENDATARIO:</h3>
          <p><strong>Nombre:</strong> ${tenant.first_name} ${tenant.paternal_last_name} ${tenant.maternal_last_name || ''}</p>
          <p><strong>RUT:</strong> ${tenant.rut}</p>
          <p><strong>Email:</strong> ${tenant.email}</p>
          <p><strong>Teléfono:</strong> ${tenant.phone || 'No especificado'}</p>

          ${guarantor ? `
          <h3 style="margin-top: 20px;">AVAL:</h3>
          <p><strong>Nombre:</strong> ${guarantor.first_name} ${guarantor.paternal_last_name} ${guarantor.maternal_last_name || ''}</p>
          <p><strong>RUT:</strong> ${guarantor.rut}</p>
          <p><strong>Email:</strong> ${guarantor.email}</p>
          <p><strong>Teléfono:</strong> ${guarantor.phone || 'No especificado'}</p>
          ` : ''}
        `,
        editable: false
      },
      {
        id: 'property',
        title: 'BIEN ARRENDADO',
        content: `
          <h3>DESCRIPCIÓN DEL INMUEBLE:</h3>
          <p><strong>Dirección:</strong> ${property.address}</p>
          <p><strong>Tipo:</strong> ${property.title}</p>
          <p><strong>Uso:</strong> Vivienda</p>
        `,
        editable: true
      },
      {
        id: 'conditions',
        title: 'CONDICIONES DEL CONTRATO',
        content: `
          <h3>PLAZO Y RENOVACIÓN:</h3>
          <p>El presente contrato se celebra por un plazo de ${conditions.lease_term_months} meses, contados desde la fecha de entrega de las llaves.</p>

          <h3>PRECIO Y FORMA DE PAGO:</h3>
          <p>El precio mensual del arriendo es de ${formatPrice(conditions.final_price_clp)}, pagadero por adelantado el día ${conditions.payment_day} de cada mes.</p>

          <h3>GARANTÍA:</h3>
          <p>Se deja en garantía la cantidad de ${formatPrice(conditions.guarantee_amount_clp)}, equivalente a un mes de arriendo.</p>

          ${conditions.broker_commission_clp > 0 ? `
          <h3>COMISIÓN CORREDOR:</h3>
          <p>Se deja constancia que el corredor inmobiliario recibe una comisión de ${formatPrice(conditions.broker_commission_clp)}.</p>
          ` : ''}

          <h3>COMUNICACIONES:</h3>
          <p>Todas las comunicaciones oficiales se realizarán al email: ${conditions.official_communication_email}</p>

          ${conditions.accepts_pets ? '<p><strong>MASCOTAS:</strong> Se permite el ingreso de mascotas al inmueble.</p>' : '<p><strong>MASCOTAS:</strong> No se permite el ingreso de mascotas al inmueble.</p>'}

          ${conditions.dicom_clause ? '<p><strong>CLÁUSULA DICOM:</strong> Se incluye la cláusula de Derecho a Crédito por Cobranza Indebida.</p>' : ''}

          ${conditions.additional_conditions ? `
          <h3>CONDICIONES ADICIONALES:</h3>
          <p>${conditions.additional_conditions}</p>
          ` : ''}
        `,
        editable: true
      },
      {
        id: 'obligations',
        title: 'DERECHOS Y OBLIGACIONES',
        content: `
          <h3>OBLIGACIONES DEL ARRENDADOR:</h3>
          <ul>
            <li>Entregar el inmueble en buen estado de conservación y funcionamiento.</li>
            <li>Realizar las reparaciones necesarias para mantener el inmueble en condiciones habitables.</li>
            <li>Respetar el derecho a la intimidad y tranquilidad del arrendatario.</li>
          </ul>

          <h3>OBLIGACIONES DEL ARRENDATARIO:</h3>
          <ul>
            <li>Pagar puntualmente el precio del arriendo en la forma convenida.</li>
            <li>Usar el inmueble únicamente para vivienda.</li>
            <li>Conservar el inmueble en buen estado.</li>
            <li>No realizar modificaciones sin autorización previa.</li>
            <li>Permitir el acceso al inmueble para inspecciones cuando sea necesario.</li>
          </ul>
        `,
        editable: true
      },
      {
        id: 'termination',
        title: 'TERMINACIÓN DEL CONTRATO',
        content: `
          <p>El contrato podrá terminarse por mutuo acuerdo, por vencimiento del plazo, o por las causales establecidas en la ley.</p>
          <p>En caso de terminación anticipada por parte del arrendatario, este deberá pagar una indemnización equivalente a 1 mes de arriendo.</p>
        `,
        editable: true
      },
      {
        id: 'signatures',
        title: 'FIRMAS',
        content: `
          <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div style="width: 30%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
              <p><strong>PROPIETARIO</strong></p>
              <p>${owner.first_name} ${owner.paternal_last_name}</p>
              <p>RUT: ${owner.rut}</p>
            </div>
            <div style="width: 30%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
              <p><strong>ARRENDATARIO</strong></p>
              <p>${tenant.first_name} ${tenant.paternal_last_name}</p>
              <p>RUT: ${tenant.rut}</p>
            </div>
            ${guarantor ? `
            <div style="width: 30%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
              <p><strong>AVAL</strong></p>
              <p>${guarantor.first_name} ${guarantor.paternal_last_name}</p>
              <p>RUT: ${guarantor.rut}</p>
            </div>
            ` : ''}
          </div>
        `,
        editable: false
      }
    ];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleSectionEdit = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const handleSectionSave = (sectionId: string, newContent: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, content: newContent }
          : section
      )
    );
    setEditingSection(null);
  };

  const handleSectionCancel = () => {
    setEditingSection(null);
  };

  const handleSaveContract = async () => {
    setSaving(true);
    try {
      const contractContent = {
        sections,
        lastModified: new Date().toISOString(),
        version: (contract?.contract_content?.version || 0) + 1
      };

      const { error } = await supabase
        .from('rental_contracts')
        .update({
          contract_content: contractContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando contrato...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-bold">Editor de Contrato</h2>
            <p className="text-blue-100 text-sm">
              {contract?.status === 'draft' ? 'Modo borrador - Puedes editar el contenido' :
               contract?.status === 'approved' ? 'Contrato aprobado - Solo vista previa' :
               'Vista del contrato'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {showPreview && (
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{previewMode ? 'Editar' : 'Vista'}</span>
            </button>
          )}
          {!readOnly && contract?.status === 'draft' && (
            <CustomButton
              onClick={handleSaveContract}
              disabled={saving}
              loading={saving}
              loadingText="Guardando..."
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
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
        {sections.map((section) => (
          <div key={section.id} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-gray-200 pb-2">
                {section.title}
              </h3>
              {!readOnly && contract?.status === 'draft' && section.editable && !previewMode && (
                <div className="flex space-x-2">
                  {editingSection === section.id ? (
                    <>
                      <button
                        onClick={() => handleSectionSave(section.id, quillRef.current?.getEditor().root.innerHTML || section.content)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={handleSectionCancel}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSectionEdit(section.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {editingSection === section.id && !previewMode ? (
              <ReactQuill
                ref={quillRef}
                value={section.content}
                onChange={() => {}} // Controlled by save button
                modules={quillModules}
                formats={quillFormats}
                className="bg-white"
                style={{ minHeight: '200px' }}
              />
            ) : (
              <div
                className="prose prose-sm max-w-none border rounded-lg p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractCanvas;
