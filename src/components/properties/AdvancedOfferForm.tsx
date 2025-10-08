import React, { useState } from 'react';
import { X, DollarSign, Send, ChevronLeft, ChevronRight, Check, FileText, Shield, User, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface AdvancedOfferFormProps {
  propertyId: string;
  propertyAddress: string;
  askingPrice: number;
  onClose: () => void;
}

interface OfferData {
  // Paso 1: Detalles de la Oferta
  offerAmount: string;
  financingType: string;
  message: string;
  
  // Paso 2: Servicios Adicionales
  selectedServices: string[];
  servicesTotalCost: number;
  
  // Paso 3: Información del Comprador
  buyerInfo: {
    fullName: string;
    rut: string;
    address: string;
    email: string;
    phone: string;
    maritalStatus: string;
    propertyRegime: string;
  };
}

export const AdvancedOfferForm: React.FC<AdvancedOfferFormProps> = ({
  propertyId,
  propertyAddress,
  askingPrice,
  onClose
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estado del formulario
  const [offerData, setOfferData] = useState<OfferData>({
    offerAmount: '',
    financingType: '',
    message: '',
    selectedServices: [],
    servicesTotalCost: 0,
    buyerInfo: {
      fullName: '',
      rut: '',
      address: '',
      email: user?.email || '',
      phone: '',
      maritalStatus: '',
      propertyRegime: '',
    }
  });

  // Configuración de servicios disponibles
  const availableServices = [
    {
      id: 'appraisal',
      title: 'Informe de Tasación Comercial',
      description: 'Un tasador profesional determinará el valor de mercado justo de la propiedad para asegurar que tu oferta sea competitiva.',
      price: 80000,
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'title_study',
      title: 'Estudio de Títulos',
      description: 'Un abogado revisa los documentos legales de la propiedad para garantizar que no haya problemas legales, embargos o deudas.',
      price: 120000,
      icon: <Shield className="h-6 w-6" />
    }
  ];

  // Utilidades
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const calculateOfferPercentage = () => {
    if (!offerData.offerAmount) return '0';
    return ((parseFloat(offerData.offerAmount) / askingPrice) * 100).toFixed(1);
  };

  // Manejo de servicios
  const toggleService = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    if (!service) return;

    const isSelected = offerData.selectedServices.includes(serviceId);
    let newSelectedServices: string[];
    let newTotalCost: number;

    if (isSelected) {
      newSelectedServices = offerData.selectedServices.filter(id => id !== serviceId);
      newTotalCost = offerData.servicesTotalCost - service.price;
    } else {
      newSelectedServices = [...offerData.selectedServices, serviceId];
      newTotalCost = offerData.servicesTotalCost + service.price;
    }

    setOfferData(prev => ({
      ...prev,
      selectedServices: newSelectedServices,
      servicesTotalCost: newTotalCost
    }));
  };

  // Validación por paso
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(offerData.offerAmount && offerData.financingType);
      case 2:
        return true; // Los servicios son opcionales
      case 3: {
        const { buyerInfo } = offerData;
        const basicFieldsValid = !!(
          buyerInfo.fullName &&
          buyerInfo.rut &&
          buyerInfo.address &&
          buyerInfo.email &&
          buyerInfo.phone &&
          buyerInfo.maritalStatus
        );

        // Si está casado, también debe tener régimen patrimonial
        if (buyerInfo.maritalStatus === 'casado') {
          return basicFieldsValid && !!buyerInfo.propertyRegime;
        }

        return basicFieldsValid;
      }
      default:
        return false;
    }
  };

  // Navegación entre pasos
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Envío del formulario
  const handleSubmit = async () => {
    if (!user || !validateStep(3)) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          property_id: propertyId,
          offerer_id: user.id,
          offer_amount_clp: parseFloat(offerData.offerAmount),
          message: offerData.message.trim() || null,
          financing_type: offerData.financingType,
          selected_services: offerData.selectedServices,
          services_total_cost: offerData.servicesTotalCost,
          buyer_info: offerData.buyerInfo,
          payment_status: offerData.servicesTotalCost > 0 ? 'pendiente' : 'no_aplica'
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de pasos
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Detalles de tu Oferta</h3>
              <p className="text-gray-600">Especifica los términos financieros de tu propuesta</p>
            </div>

            {/* Monto de la Oferta */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monto de tu Oferta *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={offerData.offerAmount}
                  onChange={(e) => setOfferData(prev => ({ ...prev, offerAmount: e.target.value }))}
                  placeholder="Monto de tu oferta"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {offerData.offerAmount && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Tu oferta: {formatPrice(parseFloat(offerData.offerAmount))}
                  </span>
                  <span className={`font-medium ${
                    parseFloat(calculateOfferPercentage()) >= 95 ? 'text-green-600' :
                    parseFloat(calculateOfferPercentage()) >= 85 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {calculateOfferPercentage()}% del precio
                  </span>
                </div>
              )}
            </div>

            {/* Forma de Pago */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Forma de Pago *
              </label>
              <select
                required
                value={offerData.financingType}
                onChange={(e) => setOfferData(prev => ({ ...prev, financingType: e.target.value }))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona la forma de pago</option>
                <option value="contado">Contado (Fondos Propios)</option>
                <option value="credito_preaprobado">Crédito Hipotecario Pre-aprobado</option>
                <option value="credito_tramitacion">Crédito Hipotecario en Tramitación</option>
              </select>
            </div>

            {/* Mensaje al Vendedor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensaje al Vendedor
              </label>
              <textarea
                rows={4}
                value={offerData.message}
                onChange={(e) => setOfferData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Explica los términos de tu oferta o solicita más información..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Servicios Adicionales</h3>
              <p className="text-gray-600">Agrega servicios profesionales para fortalecer tu oferta</p>
            </div>

            <div className="space-y-4">
              {availableServices.map((service) => {
                const isSelected = offerData.selectedServices.includes(service.id);
                
                return (
                  <div
                    key={service.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {service.icon}
                            </div>
                            <h4 className="font-semibold text-gray-900">{service.title}</h4>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total de Servicios */}
            {offerData.servicesTotalCost > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900">Total de Servicios:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatPrice(offerData.servicesTotalCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Identificación del Comprador</h3>
              <p className="text-gray-600">Información necesaria para el contrato de compraventa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={offerData.buyerInfo.fullName}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    buyerInfo: { ...prev.buyerInfo, fullName: e.target.value }
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Carlos Pérez González"
                />
              </div>

              {/* RUT */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  RUT o Identificación Nacional *
                </label>
                <input
                  type="text"
                  required
                  value={offerData.buyerInfo.rut}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    buyerInfo: { ...prev.buyerInfo, rut: e.target.value }
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12.345.678-9"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email de Contacto *
                </label>
                <input
                  type="email"
                  required
                  value={offerData.buyerInfo.email}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    buyerInfo: { ...prev.buyerInfo, email: e.target.value }
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="comprador@email.com"
                />
              </div>

              {/* Domicilio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Domicilio *
                </label>
                <input
                  type="text"
                  required
                  value={offerData.buyerInfo.address}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    buyerInfo: { ...prev.buyerInfo, address: e.target.value }
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Av. Providencia 2500, Las Condes, Santiago"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono de Contacto *
                </label>
                <input
                  type="tel"
                  required
                  value={offerData.buyerInfo.phone}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    buyerInfo: { ...prev.buyerInfo, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              {/* Estado Civil */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado Civil *
                </label>
                <select
                  required
                  value={offerData.buyerInfo.maritalStatus}
                  onChange={(e) => setOfferData(prev => ({
                    ...prev,
                    buyerInfo: { 
                      ...prev.buyerInfo, 
                      maritalStatus: e.target.value,
                      propertyRegime: e.target.value !== 'casado' ? '' : prev.buyerInfo.propertyRegime
                    }
                  }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar estado civil</option>
                  <option value="soltero">Soltero(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viudo">Viudo(a)</option>
                </select>
              </div>

              {/* Régimen Patrimonial (condicional) */}
              {offerData.buyerInfo.maritalStatus === 'casado' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Régimen Patrimonial *
                  </label>
                  <select
                    required
                    value={offerData.buyerInfo.propertyRegime}
                    onChange={(e) => setOfferData(prev => ({
                      ...prev,
                      buyerInfo: { ...prev.buyerInfo, propertyRegime: e.target.value }
                    }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar régimen</option>
                    <option value="sociedad_conyugal">Sociedad conyugal</option>
                    <option value="separacion_bienes">Separación total de bienes</option>
                    <option value="participacion_gananciales">Participación en los gananciales</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Resumen y Confirmación</h3>
              <p className="text-gray-600">Revisa todos los detalles antes de enviar tu oferta</p>
            </div>

            {/* Resumen de la Oferta */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Resumen de la Oferta</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Propiedad:</span>
                  <span className="font-medium">{propertyAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio de venta:</span>
                  <span className="font-medium">{formatPrice(askingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tu oferta:</span>
                  <span className="font-bold text-blue-600">{formatPrice(parseFloat(offerData.offerAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Forma de pago:</span>
                  <span className="font-medium">
                    {offerData.financingType === 'contado' && 'Contado (Fondos Propios)'}
                    {offerData.financingType === 'credito_preaprobado' && 'Crédito Hipotecario Pre-aprobado'}
                    {offerData.financingType === 'credito_tramitacion' && 'Crédito Hipotecario en Tramitación'}
                  </span>
                </div>
              </div>
            </div>

            {/* Servicios Seleccionados */}
            {offerData.selectedServices.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Servicios Seleccionados</h4>
                <div className="space-y-2">
                  {offerData.selectedServices.map(serviceId => {
                    const service = availableServices.find(s => s.id === serviceId);
                    return service ? (
                      <div key={serviceId} className="flex justify-between text-sm">
                        <span className="text-blue-700">{service.title}</span>
                        <span className="font-medium text-blue-900">{formatPrice(service.price)}</span>
                      </div>
                    ) : null;
                  })}
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-blue-900">Total a Pagar por Servicios:</span>
                      <span className="text-blue-900">{formatPrice(offerData.servicesTotalCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información del Comprador */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Información del Comprador</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium ml-2">{offerData.buyerInfo.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">RUT:</span>
                  <span className="font-medium ml-2">{offerData.buyerInfo.rut}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium ml-2">{offerData.buyerInfo.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="font-medium ml-2">{offerData.buyerInfo.phone}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Domicilio:</span>
                  <span className="font-medium ml-2">{offerData.buyerInfo.address}</span>
                </div>
                <div>
                  <span className="text-gray-600">Estado Civil:</span>
                  <span className="font-medium ml-2 capitalize">{offerData.buyerInfo.maritalStatus}</span>
                </div>
                {offerData.buyerInfo.propertyRegime && (
                  <div>
                    <span className="text-gray-600">Régimen:</span>
                    <span className="font-medium ml-2">{offerData.buyerInfo.propertyRegime.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderizado principal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {success ? (
          // Pantalla de éxito
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Oferta Enviada Exitosamente!</h3>
            <p className="text-gray-600 mb-4">
              Tu oferta ha sido enviada al vendedor. 
              {offerData.servicesTotalCost > 0 && ' Te contactaremos pronto para procesar el pago de los servicios seleccionados.'}
            </p>
            {offerData.servicesTotalCost > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-700 font-medium">
                  Total a pagar por servicios: {formatPrice(offerData.servicesTotalCost)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header con progreso */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Hacer Oferta de Compra
                </h2>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === currentStep
                          ? 'bg-blue-600 text-white'
                          : step < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step < currentStep ? <Check className="h-4 w-4" /> : step}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido del paso actual */}
            <div className="p-6">
              {renderStep()}
            </div>

            {/* Footer con navegación */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !validateStep(3)}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {offerData.servicesTotalCost > 0 ? (
                          <>
                            <CreditCard className="h-4 w-4" />
                            <span>Proceder al Pago y Enviar Oferta</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Enviar Oferta</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};