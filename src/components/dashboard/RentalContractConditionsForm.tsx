import React, { useState } from 'react';
import { X, FileText, DollarSign, Calendar, Mail, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface RentalContractConditionsFormProps {
  applicationId: string;
  propertyPrice: number;
  onSuccess: (conditions: RentalContractConditions) => void;
  onCancel: () => void;
}

export interface RentalContractConditions {
  lease_term_months: number;
  payment_day: number;
  final_price_clp: number;
  broker_commission_clp: number;
  guarantee_amount_clp: number;
  official_communication_email: string;
  accepts_pets: boolean;
  dicom_clause: boolean;
  additional_conditions: string;
}

const RentalContractConditionsForm: React.FC<RentalContractConditionsFormProps> = ({
  applicationId,
  propertyPrice,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<RentalContractConditions>({
    lease_term_months: 12, // Default 1 año
    payment_day: 5, // Default día 5
    final_price_clp: propertyPrice, // Precio base de la propiedad
    broker_commission_clp: Math.round(propertyPrice * 0.01), // Default 1% del precio
    guarantee_amount_clp: propertyPrice, // Default 1 mes de garantía
    official_communication_email: '',
    accepts_pets: false,
    dicom_clause: true, // Default true para protección del arrendatario
    additional_conditions: ''
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<RentalContractConditions>>({});

  // Load existing conditions when component mounts
  React.useEffect(() => {
    const loadExistingConditions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rental_contract_conditions')
          .select('*')
          .eq('application_id', applicationId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found", which is expected if no conditions exist yet
          throw error;
        }

        if (data) {
          // Load existing data into form
          setFormData({
            lease_term_months: data.lease_term_months,
            payment_day: data.payment_day,
            final_price_clp: data.final_price_clp,
            broker_commission_clp: data.broker_commission_clp || 0,
            guarantee_amount_clp: data.guarantee_amount_clp,
            official_communication_email: data.official_communication_email || '',
            accepts_pets: data.accepts_pets || false,
            dicom_clause: data.dicom_clause || false,
            additional_conditions: data.additional_conditions || ''
          });
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error loading existing conditions:', error);
        // Continue with default values if loading fails
      } finally {
        setLoading(false);
      }
    };

    loadExistingConditions();
  }, [applicationId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RentalContractConditions> = {};

    if (!formData.lease_term_months || formData.lease_term_months < 1 || formData.lease_term_months > 60) {
      newErrors.lease_term_months = 'El plazo debe estar entre 1 y 60 meses';
    }

    if (!formData.payment_day || formData.payment_day < 1 || formData.payment_day > 31) {
      newErrors.payment_day = 'El día de pago debe estar entre 1 y 31';
    }

    if (!formData.final_price_clp || formData.final_price_clp < 0) {
      newErrors.final_price_clp = 'El precio final debe ser mayor a 0';
    }

    if (formData.broker_commission_clp < 0) {
      newErrors.broker_commission_clp = 'La comisión no puede ser negativa';
    }

    if (!formData.guarantee_amount_clp || formData.guarantee_amount_clp < 0) {
      newErrors.guarantee_amount_clp = 'La garantía debe ser mayor a 0';
    }

    if (!formData.official_communication_email || !formData.official_communication_email.includes('@')) {
      newErrors.official_communication_email = 'Debe ingresar un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleInputChange = (field: keyof RentalContractConditions, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // First, check if conditions already exist for this application
      const { data: existingConditions, error: checkError } = await supabase
        .from('rental_contract_conditions')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found", which is expected if no conditions exist yet
        throw checkError;
      }

      let result;
      if (existingConditions) {
        // Update existing conditions
        const { data, error } = await supabase
          .from('rental_contract_conditions')
          .update(formData)
          .eq('application_id', applicationId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new conditions
        const { data, error } = await supabase
          .from('rental_contract_conditions')
          .insert({
            application_id: applicationId,
            ...formData
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      onSuccess(result);
    } catch (error: any) {
      console.error('Error saving contract conditions:', error);

      // Provide more specific error messages
      let errorMessage = 'Error al guardar las condiciones del contrato.';

      if (error?.code === '23505') {
        errorMessage = 'Ya existen condiciones para esta postulación. Intenta editar las existentes.';
      } else if (error?.code === 'PGRST301') {
        errorMessage = 'Error de permisos. Verifica que tengas acceso para modificar esta postulación.';
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando condiciones del contrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? 'Editar Condiciones del Contrato' : 'Condiciones del Contrato de Arriendo'}
              </h2>
              <p className="text-emerald-100 text-sm">
                {isEditing
                  ? 'Modifica las condiciones específicas del contrato'
                  : 'Define las condiciones específicas antes de aprobar la postulación'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-emerald-200 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sección: Condiciones Temporales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
              Condiciones Temporales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plazo del Contrato (meses) *
                </label>
                <select
                  value={formData.lease_term_months}
                  onChange={(e) => handleInputChange('lease_term_months', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.lease_term_months ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value={6}>6 meses</option>
                  <option value={12}>1 año</option>
                  <option value={18}>18 meses</option>
                  <option value={24}>2 años</option>
                  <option value={36}>3 años</option>
                  <option value={48}>4 años</option>
                  <option value={60}>5 años</option>
                </select>
                {errors.lease_term_months && (
                  <p className="text-red-500 text-xs mt-1">{errors.lease_term_months}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día de Pago Mensual *
                </label>
                <select
                  value={formData.payment_day}
                  onChange={(e) => handleInputChange('payment_day', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.payment_day ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                {errors.payment_day && (
                  <p className="text-red-500 text-xs mt-1">{errors.payment_day}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Condiciones Económicas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
              Condiciones Económicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Final Mensual (CLP) *
                </label>
                <input
                  type="number"
                  value={formData.final_price_clp}
                  onChange={(e) => handleInputChange('final_price_clp', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.final_price_clp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingresa el precio acordado"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formateado: {formatPrice(formData.final_price_clp)}
                </p>
                {errors.final_price_clp && (
                  <p className="text-red-500 text-xs mt-1">{errors.final_price_clp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión del Corredor (CLP)
                </label>
                <input
                  type="number"
                  value={formData.broker_commission_clp}
                  onChange={(e) => handleInputChange('broker_commission_clp', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.broker_commission_clp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Comisión acordada"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formateado: {formatPrice(formData.broker_commission_clp)}
                </p>
                {errors.broker_commission_clp && (
                  <p className="text-red-500 text-xs mt-1">{errors.broker_commission_clp}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto de Garantía (CLP) *
                </label>
                <input
                  type="number"
                  value={formData.guarantee_amount_clp}
                  onChange={(e) => handleInputChange('guarantee_amount_clp', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.guarantee_amount_clp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Monto de la garantía/depósito"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formateado: {formatPrice(formData.guarantee_amount_clp)}
                </p>
                {errors.guarantee_amount_clp && (
                  <p className="text-red-500 text-xs mt-1">{errors.guarantee_amount_clp}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Comunicación Oficial */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-emerald-600" />
              Comunicación Oficial
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Oficial para Comunicaciones *
              </label>
              <input
                type="email"
                value={formData.official_communication_email}
                onChange={(e) => handleInputChange('official_communication_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.official_communication_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="correo@ejemplo.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este email será utilizado para todas las comunicaciones oficiales del contrato
              </p>
              {errors.official_communication_email && (
                <p className="text-red-500 text-xs mt-1">{errors.official_communication_email}</p>
              )}
            </div>
          </div>

          {/* Sección: Condiciones Especiales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Check className="h-5 w-5 mr-2 text-emerald-600" />
              Condiciones Especiales
            </h3>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="accepts_pets"
                  checked={formData.accepts_pets}
                  onChange={(e) => handleInputChange('accepts_pets', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="accepts_pets" className="ml-2 text-sm text-gray-700">
                  <span className="font-medium">Acepta mascotas</span>
                  <span className="text-gray-500 ml-2">Permite el ingreso de mascotas al inmueble</span>
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="dicom_clause"
                  checked={formData.dicom_clause}
                  onChange={(e) => handleInputChange('dicom_clause', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="dicom_clause" className="ml-2 text-sm text-gray-700">
                  <span className="font-medium">Cláusula DICOM</span>
                  <span className="text-gray-500 ml-2">Derecho a Crédito por Cobranza Indebida</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección: Condiciones Adicionales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condiciones Adicionales
            </label>
            <textarea
              value={formData.additional_conditions}
              onChange={(e) => handleInputChange('additional_conditions', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Otras condiciones acordadas (opcional)..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Aquí puedes agregar cualquier condición especial acordada verbalmente
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex space-x-3 pt-4 border-t">
            <CustomButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              type="submit"
              variant="primary"
              disabled={saving}
              loading={saving}
              loadingText="Guardando..."
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar Condiciones' : 'Guardar Condiciones y Aprobar'}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalContractConditionsForm;
