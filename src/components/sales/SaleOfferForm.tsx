import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, User, Building2, DollarSign, MessageSquare, 
  FileText, Plus, Trash2, AlertCircle, CheckCircle, 
  Briefcase, Mail, Phone, Building, Upload, X
} from 'lucide-react';
import { supabase, Property, formatPriceCLP } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SaleOfferFormProps {
  property: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type EntityType = 'natural' | 'juridica';

interface BankExecutive {
  id: string;
  name: string;
  email: string;
  banco: string;
  phone?: string;
}

interface OfferFormData {
  entityType: EntityType;
  
  // Persona Natural
  buyer_name: string;
  buyer_lastname: string;
  buyer_rut: string;
  buyer_email: string;
  buyer_phone: string;
  
  // Persona Jurídica
  company_name: string;
  company_rut: string;
  legal_representative_name: string;
  legal_representative_rut: string;
  
  // Oferta
  offer_amount: string;
  message: string;
  
  // Financiamiento
  has_preapproved_credit: boolean;
  credit_proof?: File;
  has_bank_executive: boolean;
}

const BANCOS_CHILE = [
  'Banco de Chile',
  'Banco Estado',
  'Banco Santander',
  'BCI',
  'Scotiabank',
  'Banco Itaú',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco BICE',
  'HSBC',
  'Banco Internacional',
  'Coopeuch',
  'Otro'
];

const SaleOfferForm: React.FC<SaleOfferFormProps> = ({ property, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<OfferFormData>({
    entityType: 'natural',
    buyer_name: '',
    buyer_lastname: '',
    buyer_rut: '',
    buyer_email: '',
    buyer_phone: '',
    company_name: '',
    company_rut: '',
    legal_representative_name: '',
    legal_representative_rut: '',
    offer_amount: '',
    message: '',
    has_preapproved_credit: false,
    has_bank_executive: false
  });

  const [executives, setExecutives] = useState<BankExecutive[]>([]);
  const [creditProofFile, setCreditProofFile] = useState<File | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);

  // Cargar usuario actual
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      // Pre-llenar email si está disponible
      setFormData(prev => ({
        ...prev,
        buyer_email: user.email || ''
      }));
    }
  };

  // Agregar ejecutivo bancario
  const addExecutive = () => {
    const newExecutive: BankExecutive = {
      id: `exec-${Date.now()}`,
      name: '',
      email: '',
      banco: '',
      phone: ''
    };
    setExecutives([...executives, newExecutive]);
  };

  // Remover ejecutivo bancario
  const removeExecutive = (id: string) => {
    setExecutives(executives.filter(exec => exec.id !== id));
  };

  // Actualizar ejecutivo
  const updateExecutive = (id: string, field: keyof BankExecutive, value: string) => {
    setExecutives(executives.map(exec => 
      exec.id === id ? { ...exec, [field]: value } : exec
    ));
  };

  // Manejo de cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Validación del formulario
  const validateForm = (): string | null => {
    // Validar tipo de persona
    if (formData.entityType === 'natural') {
      if (!formData.buyer_name.trim()) return 'El nombre es requerido';
      if (!formData.buyer_lastname.trim()) return 'Los apellidos son requeridos';
      if (!formData.buyer_rut.trim()) return 'El RUT es requerido';
    } else {
      if (!formData.company_name.trim()) return 'La razón social es requerida';
      if (!formData.company_rut.trim()) return 'El RUT de la empresa es requerido';
      if (!formData.legal_representative_name.trim()) return 'El nombre del representante legal es requerido';
      if (!formData.legal_representative_rut.trim()) return 'El RUT del representante legal es requerido';
    }

    // Validar contacto
    if (!formData.buyer_email.trim()) return 'El correo electrónico es requerido';
    if (!formData.buyer_phone.trim()) return 'El teléfono es requerido';

    // Validar oferta
    const offerAmount = parseFloat(formData.offer_amount);
    if (!formData.offer_amount || isNaN(offerAmount) || offerAmount <= 0) {
      return 'El monto de la oferta debe ser mayor a 0';
    }

    if (!formData.message.trim()) return 'El mensaje para el propietario es requerido';

    // Validar ejecutivos bancarios si se marcó que tiene
    if (formData.has_bank_executive) {
      if (executives.length === 0) {
        return 'Debe agregar al menos un ejecutivo bancario';
      }

      for (const exec of executives) {
        if (!exec.name.trim()) return 'Todos los ejecutivos deben tener nombre';
        if (!exec.email.trim()) return 'Todos los ejecutivos deben tener email';
        if (!exec.banco.trim()) return 'Todos los ejecutivos deben tener banco';
      }
    }

    return null;
  };

  // Subir archivo a Supabase Storage
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Enviar oferta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!currentUser) {
      toast.error('Debe iniciar sesión para hacer una oferta');
      return;
    }

    setLoading(true);

    try {
      // Subir comprobante de crédito si existe
      let creditProofUrl = null;
      if (creditProofFile) {
        creditProofUrl = await uploadFile(creditProofFile, 'sale-offer-documents');
        if (!creditProofUrl) {
          throw new Error('Error al subir el comprobante de crédito');
        }
      }

      // Crear la oferta
      const offerData: any = {
        property_id: property.id,
        buyer_id: currentUser.id,
        entity_type: formData.entityType,
        buyer_name: formData.entityType === 'natural' ? formData.buyer_name : formData.company_name,
        buyer_email: formData.buyer_email,
        buyer_phone: formData.buyer_phone,
        offer_amount: parseFloat(formData.offer_amount),
        offer_amount_currency: 'CLP',
        message: formData.message,
        has_preapproved_credit: formData.has_preapproved_credit,
        has_bank_executive: formData.has_bank_executive,
        status: 'pendiente'
      };

      // Campos específicos según tipo de persona
      if (formData.entityType === 'natural') {
        offerData.buyer_lastname = formData.buyer_lastname;
        offerData.buyer_rut = formData.buyer_rut;
      } else {
        offerData.company_name = formData.company_name;
        offerData.company_rut = formData.company_rut;
        offerData.legal_representative_name = formData.legal_representative_name;
        offerData.legal_representative_rut = formData.legal_representative_rut;
      }

      if (creditProofUrl) {
        offerData.credit_proof_url = creditProofUrl;
      }

      const { data: offer, error: offerError } = await supabase
        .from('property_sale_offers')
        .insert([offerData])
        .select()
        .single();

      if (offerError) throw offerError;

      // Insertar ejecutivos bancarios si existen
      if (formData.has_bank_executive && executives.length > 0) {
        const executivesData = executives.map(exec => ({
          offer_id: offer.id,
          name: exec.name,
          email: exec.email,
          banco: exec.banco,
          phone: exec.phone || null
        }));

        const { error: executivesError } = await supabase
          .from('offer_bank_executives')
          .insert(executivesData);

        if (executivesError) {
          console.error('Error al insertar ejecutivos:', executivesError);
          // No fallar completamente, solo advertir
          toast.error('Oferta creada pero hubo un error al guardar los ejecutivos');
        }
      }

      // Subir documentos adicionales si existen
      if (additionalDocuments.length > 0) {
        for (const doc of additionalDocuments) {
          const docUrl = await uploadFile(doc, 'sale-offer-documents');
          if (docUrl) {
            await supabase
              .from('property_sale_offer_documents')
              .insert({
                offer_id: offer.id,
                doc_type: 'otro',
                file_name: doc.name,
                file_url: docUrl,
                storage_path: docUrl,
                file_size_bytes: doc.size,
                mime_type: doc.type,
                uploaded_by: currentUser.id
              });
          }
        }
      }

      toast.success('¡Oferta enviada exitosamente!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirigir a mis ofertas
        navigate('/my-offers');
      }
    } catch (error: any) {
      console.error('Error al enviar oferta:', error);
      toast.error(error.message || 'Error al enviar la oferta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Hacer Oferta de Compra</h2>
        <p className="text-gray-600 mt-1">
          Complete los siguientes datos para realizar su oferta
        </p>
        
        {/* Info de la propiedad */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Propiedad:</strong> {property.address_street} {property.address_number}, {property.address_commune}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Precio publicado:</strong> {formatPriceCLP(property.price_clp)}
          </p>
        </div>
      </div>

      {/* Tipo de Persona */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5" />
          Tipo de Persona
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            formData.entityType === 'natural' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <input
              type="radio"
              name="entityType"
              value="natural"
              checked={formData.entityType === 'natural'}
              onChange={handleChange}
              className="mr-3"
            />
            <User className="h-5 w-5 mr-2" />
            <span className="font-medium">Persona Natural</span>
          </label>

          <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            formData.entityType === 'juridica' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <input
              type="radio"
              name="entityType"
              value="juridica"
              checked={formData.entityType === 'juridica'}
              onChange={handleChange}
              className="mr-3"
            />
            <Building2 className="h-5 w-5 mr-2" />
            <span className="font-medium">Persona Jurídica</span>
          </label>
        </div>
      </div>

      {/* Datos del Ofertante - Persona Natural */}
      {formData.entityType === 'natural' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Datos Personales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="buyer_name"
                value={formData.buyer_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                name="buyer_lastname"
                value={formData.buyer_lastname}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT *
              </label>
              <input
                type="text"
                name="buyer_rut"
                value={formData.buyer_rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Datos del Ofertante - Persona Jurídica */}
      {formData.entityType === 'juridica' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Datos de la Empresa</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT Empresa *
              </label>
              <input
                type="text"
                name="company_rut"
                value={formData.company_rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Representante Legal *
              </label>
              <input
                type="text"
                name="legal_representative_name"
                value={formData.legal_representative_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT Representante Legal *
              </label>
              <input
                type="text"
                name="legal_representative_rut"
                value={formData.legal_representative_rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Datos de Contacto */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Datos de Contacto
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="buyer_email"
              value={formData.buyer_email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="buyer_phone"
              value={formData.buyer_phone}
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Datos de la Oferta */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Detalles de la Oferta
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto de la Oferta (CLP) *
          </label>
          <input
            type="number"
            name="offer_amount"
            value={formData.offer_amount}
            onChange={handleChange}
            placeholder="100000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {formData.offer_amount && !isNaN(parseFloat(formData.offer_amount)) && (
            <p className="text-sm text-gray-600 mt-1">
              {formatPriceCLP(parseFloat(formData.offer_amount))}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje para el Propietario *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Escriba un mensaje al propietario explicando su interés en la propiedad..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Financiamiento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Financiamiento
        </h3>
        
        {/* Crédito Preaprobado */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name="has_preapproved_credit"
              checked={formData.has_preapproved_credit}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <span className="font-medium text-gray-900">
              ¿Posee crédito preaprobado?
            </span>
          </label>

          {formData.has_preapproved_credit && (
            <div className="ml-8 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Comprobante de Crédito (opcional)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCreditProofFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {creditProofFile && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {creditProofFile.name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ejecutivo Bancario */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              name="has_bank_executive"
              checked={formData.has_bank_executive}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <span className="font-medium text-gray-900">
              ¿Tiene ejecutivo bancario?
            </span>
          </label>

          {formData.has_bank_executive && (
            <div className="ml-8 space-y-4">
              {executives.map((exec, index) => (
                <div key={exec.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Ejecutivo {index + 1}
                    </h4>
                    {executives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExecutive(exec.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={exec.name}
                        onChange={(e) => updateExecutive(exec.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={exec.email}
                        onChange={(e) => updateExecutive(exec.id, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banco *
                      </label>
                      <select
                        value={exec.banco}
                        onChange={(e) => updateExecutive(exec.id, 'banco', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccione un banco</option>
                        {BANCOS_CHILE.map(banco => (
                          <option key={banco} value={banco}>{banco}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono (opcional)
                      </label>
                      <input
                        type="tel"
                        value={exec.phone || ''}
                        onChange={(e) => updateExecutive(exec.id, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addExecutive}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar otro ejecutivo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documentos Adicionales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos Respaldatorios (opcional)
        </h3>
        
        <div>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files) {
                setAdditionalDocuments(Array.from(e.target.files));
              }
            }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {additionalDocuments.length > 0 && (
            <div className="mt-2 space-y-1">
              {additionalDocuments.map((doc, index) => (
                <p key={index} className="text-sm text-gray-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {doc.name}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Enviar Oferta
            </>
          )}
        </button>
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Al enviar esta oferta, el propietario recibirá una notificación con sus datos y podrá ponerse en contacto con usted.
          Asegúrese de que toda la información sea correcta antes de enviar.
        </p>
      </div>
    </form>
  );
};

export default SaleOfferForm;






