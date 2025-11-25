import React, { useState, useEffect } from 'react';
import { X, DollarSign, FileText, Upload, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { Property, createSaleOffer, uploadSaleOfferDocument, supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface SaleOfferModalProps {
  property: Property;
  onClose: () => void;
  onSuccess?: () => void;
}

const FINANCING_TYPES = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito_hipotecario', label: 'Crédito Hipotecario' },
  { value: 'mixto', label: 'Mixto (Contado + Crédito)' },
  { value: 'otro', label: 'Otro' },
];

const DOCUMENT_TYPES = [
  { value: 'promesa_compra', label: 'Promesa de Compra' },
  { value: 'carta_intencion', label: 'Carta de Intención' },
  { value: 'respaldo_bancario', label: 'Respaldo Bancario' },
  { value: 'pre_aprobacion_credito', label: 'Pre-aprobación Crédito' },
  { value: 'cedula_identidad', label: 'Cédula de Identidad' },
  { value: 'declaracion_impuestos', label: 'Declaración de Impuestos' },
  { value: 'certificado_laboral', label: 'Certificado Laboral' },
  { value: 'otro', label: 'Otro' },
];

export const SaleOfferModal: React.FC<SaleOfferModalProps> = ({
  property,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: user?.email || '',
    buyer_phone: '',
    offer_amount: '',
    offer_amount_currency: 'CLP',
    financing_type: '',
    message: '',
    requests_title_study: false,
    requests_property_inspection: false,
  });

  const [documents, setDocuments] = useState<Array<{
    file: File;
    doc_type: string;
    uploading: boolean;
    uploaded: boolean;
  }>>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, paternal_last_name, maternal_last_name, phone')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserProfile(data);
        setFormData(prev => ({
          ...prev,
          buyer_name: `${data.first_name} ${data.paternal_last_name}${data.maternal_last_name ? ` ${data.maternal_last_name}` : ''}`,
          buyer_phone: data.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newDocs = Array.from(files).map(file => ({
        file,
        doc_type: docType,
        uploading: false,
        uploaded: false,
      }));
      setDocuments(prev => [...prev, ...newDocs]);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
    if (!formData.buyer_name.trim()) {
      toast.error('Por favor ingresa tu nombre completo');
      return false;
    }
    if (!formData.buyer_email.trim()) {
      toast.error('Por favor ingresa tu email');
      return false;
    }
    if (!formData.offer_amount || parseInt(formData.offer_amount) <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return false;
    }
    return true;
  };

  const handleSubmitOffer = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    try {
      // Create offer
      const offerData = {
        property_id: property.id,
        buyer_name: formData.buyer_name,
        buyer_email: formData.buyer_email,
        buyer_phone: formData.buyer_phone,
        offer_amount: parseInt(formData.offer_amount),
        offer_amount_currency: formData.offer_amount_currency,
        financing_type: formData.financing_type,
        message: formData.message,
        requests_title_study: formData.requests_title_study,
        requests_property_inspection: formData.requests_property_inspection,
      };

      const offer = await createSaleOffer(offerData);
      setOfferId(offer.id);

      toast.success('¡Oferta enviada exitosamente!');
      
      if (documents.length > 0) {
        setCurrentStep(2);
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error(error.message || 'Error al enviar la oferta');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!offerId) return;

    setLoading(true);
    try {
      // Upload all documents
      const uploadPromises = documents.map(async (doc, index) => {
        if (doc.uploaded) return;

        setDocuments(prev => {
          const updated = [...prev];
          updated[index].uploading = true;
          return updated;
        });

        try {
          await uploadSaleOfferDocument(offerId, doc.file, doc.doc_type);
          
          setDocuments(prev => {
            const updated = [...prev];
            updated[index].uploading = false;
            updated[index].uploaded = true;
            return updated;
          });
        } catch (error) {
          console.error('Error uploading document:', error);
          setDocuments(prev => {
            const updated = [...prev];
            updated[index].uploading = false;
            return updated;
          });
        }
      });

      await Promise.all(uploadPromises);
      
      toast.success('Documentos subidos exitosamente');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error('Error al subir algunos documentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentStep === 1 ? 'Realizar Oferta de Compra' : 'Adjuntar Documentos'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {property.address_street} {property.address_number}, {property.address_commune}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Información de la Oferta</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Documentos (Opcional)</span>
            </div>
          </div>
        </div>

        {/* Step 1: Offer Information */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="buyer_name"
                    value={formData.buyer_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="buyer_email"
                    value={formData.buyer_email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="buyer_phone"
                    value={formData.buyer_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Offer Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Oferta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Ofertado * (CLP)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="offer_amount"
                      value={formData.offer_amount}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 150000000"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Precio publicado: ${new Intl.NumberFormat('es-CL').format(property.price_clp)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Financiamiento
                  </label>
                  <select
                    name="financing_type"
                    value={formData.financing_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona una opción</option>
                    {FINANCING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje para el Vendedor
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe tu interés en la propiedad, tus plazos, o cualquier información relevante..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Special Requests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes Adicionales</h3>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requests_title_study"
                    checked={formData.requests_title_study}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Solicitar Estudio de Título</span>
                    <p className="text-sm text-gray-500">
                      Quiero revisar los documentos del estudio de título antes de avanzar
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requests_property_inspection"
                    checked={formData.requests_property_inspection}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Solicitar Inspección de la Propiedad</span>
                    <p className="text-sm text-gray-500">
                      Deseo realizar una inspección técnica de la propiedad
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Información importante</p>
                  <p>
                    Tu oferta será enviada al propietario, quien podrá aceptarla, rechazarla o hacer una contraoferta. 
                    Recibirás una notificación por email cuando el propietario responda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Adjuntar Documentos (Opcional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Puedes adjuntar documentos que respalden tu oferta, como pre-aprobación de crédito, 
                carta de intención, o certificados bancarios.
              </p>

              {/* Document Upload */}
              <div className="space-y-4">
                {DOCUMENT_TYPES.map(docType => (
                  <div key={docType.value} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {docType.label}
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, docType.value)}
                          className="hidden"
                          multiple
                        />
                        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                          <Upload className="h-4 w-4" />
                          <span>Seleccionar</span>
                        </div>
                      </label>
                    </div>
                    
                    {/* Show uploaded files for this type */}
                    {documents
                      .filter(doc => doc.doc_type === docType.value)
                      .map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 mt-2"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">
                              {doc.file.name}
                            </span>
                            {doc.uploaded && (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          {!doc.uploaded && (
                            <button
                              onClick={() => handleRemoveDocument(documents.indexOf(doc))}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
          {currentStep === 1 ? (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Enviar Oferta</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Omitir y Finalizar
              </button>
              <button
                onClick={handleUploadDocuments}
                disabled={loading || documents.length === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>Subir Documentos</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};









