import React, { useState } from 'react';
import { X, FileText, DollarSign, Calendar, Mail, Check, Building2, AlertTriangle } from 'lucide-react';
import { supabase, validateRUT } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface RentalContractConditionsFormProps {
  applicationId: string;
  propertyPrice: number;
  onSuccess: (conditions: RentalContractConditions) => void;
  onCancel: () => void;
}

export interface RentalContractConditions {
  id?: string;
  rental_contract_conditions_characteristic_id?: string;
  lease_term_months: number;
  payment_day: number;
  final_price_clp: number;
  final_rent_price?: number; // NUEVO
  broker_name?: string; // NUEVO
  broker_rut?: string; // NUEVO
  broker_commission_clp: number;
  guarantee_amount_clp: number;
  official_communication_email: string;
  accepts_pets: boolean;
  dicom_clause: boolean;
  additional_conditions: string;
  payment_method?: string;
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  bank_account_rut: string;
  bank_account_holder: string;
  automatic_renewal: boolean;
  termination_clause_non_payment: string;
  contract_start_date: string;
}

type RentalContractConditionsErrors = Partial<Record<keyof RentalContractConditions, string>>;

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
    final_rent_price: propertyPrice, // NUEVO: Precio final del arriendo
    broker_name: '', // NUEVO
    broker_rut: '', // NUEVO
    broker_commission_clp: Math.round(propertyPrice * 0.01), // Default 1% del precio
    guarantee_amount_clp: propertyPrice, // Default 1 mes de garantía
    official_communication_email: '',
    accepts_pets: false,
    dicom_clause: true, // Default true para protección del arrendatario
    additional_conditions: '',
    payment_method: 'transferencia',
    bank_name: '',
    bank_account_type: '',
    bank_account_number: '',
    bank_account_rut: '',
    bank_account_holder: '',
    automatic_renewal: false,
    termination_clause_non_payment: 'En caso de no pago, el arrendador podrá terminar el contrato previo aviso de 15 días.',
    contract_start_date: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<RentalContractConditionsErrors>({});
  const [paymentMethod, setPaymentMethod] = useState('transferencia');

  // Load existing conditions when component mounts
  React.useEffect(() => {
    const loadExistingConditions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rental_contract_conditions')
          .select('*, rental_contract_conditions_characteristic_id')
          .eq('application_id', applicationId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found", which is expected if no conditions exist yet
          throw error;
        }

        if (data) {
          console.log('📋 Condiciones existentes cargadas:', data);
          console.log('🔑 Characteristic ID existente:', data.rental_contract_conditions_characteristic_id);

          // Load existing data into form
          setFormData({
            id: data.id,
            rental_contract_conditions_characteristic_id: data.rental_contract_conditions_characteristic_id,
            lease_term_months: data.lease_term_months,
            payment_day: data.payment_day,
            final_price_clp: data.final_price_clp,
            final_rent_price: data.final_rent_price || data.final_price_clp, // NUEVO: fallback a final_price_clp
            broker_name: data.broker_name || '', // NUEVO
            broker_rut: data.broker_rut || '', // NUEVO
            broker_commission_clp: data.broker_commission_clp || 0,
            guarantee_amount_clp: data.guarantee_amount_clp,
            official_communication_email: data.official_communication_email || '',
            accepts_pets: data.accepts_pets || false,
            dicom_clause: data.dicom_clause || false,
            additional_conditions: data.additional_conditions || '',
            payment_method: data.payment_method || 'transferencia',
            bank_name: data.bank_name || '',
            bank_account_type: data.bank_account_type || '',
            bank_account_number: data.bank_account_number || '',
            bank_account_rut: data.bank_account_rut || '',
            bank_account_holder: data.bank_account_holder || '',
            automatic_renewal: data.automatic_renewal || false,
            termination_clause_non_payment: data.termination_clause_non_payment || 'En caso de no pago, el arrendador podrá terminar el contrato previo aviso de 15 días.',
            contract_start_date: data.contract_start_date || new Date().toISOString().split('T')[0]
          });
          
          // También actualizar el estado del método de pago
          if (data.payment_method) {
            setPaymentMethod(data.payment_method);
          }
          
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
    const newErrors: RentalContractConditionsErrors = {};

    if (!formData.lease_term_months || formData.lease_term_months < 1 || formData.lease_term_months > 60) {
      newErrors.lease_term_months = 'El plazo debe estar entre 1 y 60 meses';
    }

    if (!formData.payment_day || formData.payment_day < 1 || formData.payment_day > 31) {
      newErrors.payment_day = 'El día de pago debe estar entre 1 y 31';
    }

    if (!formData.final_price_clp || formData.final_price_clp < 0) {
      newErrors.final_price_clp = 'El precio final debe ser mayor a 0';
    }

    // NUEVO: Validar precio final del arriendo
    if (!formData.final_rent_price || formData.final_rent_price <= 0) {
      newErrors.final_rent_price = 'El precio final del arriendo es obligatorio y debe ser mayor a 0';
    }

    // NUEVO: Validar nombre del corredor
    if (!formData.broker_name?.trim()) {
      newErrors.broker_name = 'El nombre del corredor es obligatorio';
    }

    // NUEVO: Validar RUT del corredor
    if (!formData.broker_rut?.trim()) {
      newErrors.broker_rut = 'El RUT del corredor es obligatorio';
    } else if (!validateRUT(formData.broker_rut)) {
      newErrors.broker_rut = 'RUT del corredor inválido';
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

    // Validar datos bancarios solo si el método de pago es transferencia
    if (paymentMethod === 'transferencia') {
      if (!formData.bank_name || formData.bank_name.trim().length < 3) {
        newErrors.bank_name = 'Debe ingresar el nombre del banco';
      }

      if (!formData.bank_account_type) {
        newErrors.bank_account_type = 'Debe seleccionar el tipo de cuenta';
      }

      if (!formData.bank_account_number || formData.bank_account_number.trim().length < 5) {
        newErrors.bank_account_number = 'Debe ingresar un número de cuenta válido';
      }

      if (!formData.bank_account_rut || formData.bank_account_rut.trim().length < 9) {
        newErrors.bank_account_rut = 'Debe ingresar un RUT válido';
      }

      if (!formData.bank_account_holder || formData.bank_account_holder.trim().length < 3) {
        newErrors.bank_account_holder = 'Debe ingresar el nombre del titular';
      }
    }

    if (!formData.termination_clause_non_payment || formData.termination_clause_non_payment.trim().length < 10) {
      newErrors.termination_clause_non_payment = 'Debe especificar la cláusula de término por no pago';
    }

    if (!formData.contract_start_date) {
      newErrors.contract_start_date = 'Debe especificar la fecha de inicio del contrato';
    } else {
      const startDate = new Date(formData.contract_start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.contract_start_date = 'La fecha de inicio no puede ser anterior a hoy';
      }
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

  // Calcula la fecha de término del contrato basado en fecha de inicio y plazo
  const calculateEndDate = (): string | null => {
    if (!formData.contract_start_date || !formData.lease_term_months) return null;
    
    const startDate = new Date(formData.contract_start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + formData.lease_term_months);
    
    return endDate.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

    // NUEVO: Validaciones adicionales antes de guardar
    if (!formData.final_rent_price || formData.final_rent_price <= 0) {
      throw new Error('El precio final es obligatorio');
    }
    if (!formData.broker_name?.trim()) {
      throw new Error('El nombre del corredor es obligatorio');
    }
    if (!formData.broker_rut?.trim() || !validateRUT(formData.broker_rut)) {
      throw new Error('RUT del corredor inválido');
    }

    setSaving(true);

    try {
      // Preparar los datos incluyendo el método de pago y nuevos campos
      const dataToSave = {
        ...formData,
        payment_method: paymentMethod,
        // NUEVO: Asegurar coerción correcta de tipos para nuevos campos
        final_rent_price: Number(formData.final_rent_price),
        broker_name: String(formData.broker_name).trim(),
        broker_rut: String(formData.broker_rut).trim(),
      };

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
          .update(dataToSave)
          .eq('application_id', applicationId)
          .select('*, rental_contract_conditions_characteristic_id')
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new conditions
        const { data, error } = await supabase
          .from('rental_contract_conditions')
          .insert({
            application_id: applicationId,
            ...dataToSave
          })
          .select('*, rental_contract_conditions_characteristic_id')
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('✅ Condiciones guardadas. Resultado:', result);
      console.log('🔑 Characteristic ID generado:', result?.rental_contract_conditions_characteristic_id);

      // Si no se generó el characteristic_id, intentar generarlo manualmente
      if (!result?.rental_contract_conditions_characteristic_id && result?.id) {
        console.log('⚠️ Characteristic ID no generado por trigger, generando manualmente...');

        const characteristicId = `CONTRACT_COND_${Math.floor(Date.now() / 1000)}_${result.id.substring(0, 8)}`;

        const { error: updateError } = await supabase
          .from('rental_contract_conditions')
          .update({ rental_contract_conditions_characteristic_id: characteristicId })
          .eq('id', result.id);

        if (updateError) {
          console.error('❌ Error generando characteristic_id manualmente:', updateError);
        } else {
          console.log('✅ Characteristic ID generado manualmente:', characteristicId);
          result.rental_contract_conditions_characteristic_id = characteristicId;
        }
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
                  Fecha de Inicio del Contrato *
                </label>
                <input
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.contract_start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contract_start_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.contract_start_date}</p>
                )}
              </div>

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
                {calculateEndDate() && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    📅 Término estimado: {calculateEndDate()}
                  </p>
                )}
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

          {/* Sección: Precio Final del Arriendo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
              Precio Final del Arriendo
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Final del Arriendo (CLP) *
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                required
                value={formData.final_rent_price ?? ''}
                onChange={(e) => setFormData(prev => ({ ...prev, final_rent_price: e.target.value ? Number(e.target.value) : undefined }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.final_rent_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 500000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formateado: {formData.final_rent_price ? formatPrice(formData.final_rent_price) : '0'}
              </p>
              {errors.final_rent_price && (
                <p className="text-red-500 text-xs mt-1">{errors.final_rent_price}</p>
              )}
            </div>
          </div>

          {/* Sección: Corredor Responsable */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Check className="h-5 w-5 mr-2 text-emerald-600" />
              Corredor Responsable
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Corredor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.broker_name ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, broker_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.broker_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: María López"
                  maxLength={120}
                />
                {errors.broker_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.broker_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT del Corredor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.broker_rut ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, broker_rut: e.target.value }))}
                  onBlur={() => {
                    if (formData.broker_rut && !validateRUT(formData.broker_rut)) {
                      setErrors(prev => ({ ...prev, broker_rut: 'RUT del corredor inválido' }));
                    } else {
                      setErrors(prev => ({ ...prev, broker_rut: undefined }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.broker_rut ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 12.345.678-9"
                  maxLength={12}
                />
                {errors.broker_rut && (
                  <p className="text-red-500 text-xs mt-1">{errors.broker_rut}</p>
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="automatic_renewal"
                  checked={formData.automatic_renewal}
                  onChange={(e) => handleInputChange('automatic_renewal', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="automatic_renewal" className="ml-2 text-sm text-gray-700">
                  <span className="font-medium">Renovación Automática</span>
                  <span className="text-gray-500 ml-2">El contrato se renueva automáticamente al término del plazo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sección: Cláusula de Término por No Pago */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-emerald-600" />
              Cláusula de Término por No Pago
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condiciones de Término en Caso de No Pago *
              </label>
              <textarea
                value={formData.termination_clause_non_payment}
                onChange={(e) => handleInputChange('termination_clause_non_payment', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none ${
                  errors.termination_clause_non_payment ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Especifica las condiciones de término del contrato en caso de no pago..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Define el plazo y condiciones bajo las cuales el contrato puede terminar por falta de pago
              </p>
              {errors.termination_clause_non_payment && (
                <p className="text-red-500 text-xs mt-1">{errors.termination_clause_non_payment}</p>
              )}
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

          {/* Sección: Condiciones de Pago */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
              Condiciones de Pago
            </h3>

            {/* Comisión de Corretaje */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisión de Corretaje (Opcional)
              </label>
              <input
                type="number"
                value={formData.broker_commission_clp || ''}
                onChange={(e) => handleInputChange('broker_commission_clp', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ingrese el monto de la comisión"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dejar en blanco si no aplica
              </p>
            </div>

            {/* Modo de Pago del Arriendo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Modo de Pago del Arriendo
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transferencia"
                    checked={paymentMethod === 'transferencia'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Transferencia Bancaria
                  </span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg opacity-50 cursor-not-allowed bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="plataforma"
                    disabled
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-500">
                    Pago a través de la Plataforma (Próximamente)
                  </span>
                </label>
              </div>
            </div>

            {/* Datos para Transferencia (Condicional) */}
            {paymentMethod === 'transferencia' && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-300">
                <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-emerald-600" />
                  Datos para Transferencia
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      value={formData.bank_account_holder}
                      onChange={(e) => handleInputChange('bank_account_holder', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.bank_account_holder ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Juan Pérez González"
                    />
                    {errors.bank_account_holder && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_account_holder}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT del Titular *
                    </label>
                    <input
                      type="text"
                      value={formData.bank_account_rut}
                      onChange={(e) => handleInputChange('bank_account_rut', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.bank_account_rut ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 12.345.678-9"
                    />
                    {errors.bank_account_rut && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_account_rut}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banco *
                    </label>
                    <select
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.bank_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione un banco</option>
                      <option value="Banco de Chile">Banco de Chile</option>
                      <option value="Banco Santander">Banco Santander</option>
                      <option value="Banco Estado">Banco Estado</option>
                      <option value="BCI">BCI - Banco de Crédito e Inversiones</option>
                      <option value="Scotiabank">Scotiabank</option>
                      <option value="Banco Itaú">Banco Itaú</option>
                      <option value="Banco Security">Banco Security</option>
                      <option value="Banco Falabella">Banco Falabella</option>
                      <option value="Banco Ripley">Banco Ripley</option>
                      <option value="Banco Consorcio">Banco Consorcio</option>
                      <option value="Banco BICE">Banco BICE</option>
                      <option value="Coopeuch">Coopeuch</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {errors.bank_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Cuenta *
                    </label>
                    <select
                      value={formData.bank_account_type}
                      onChange={(e) => handleInputChange('bank_account_type', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.bank_account_type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione tipo de cuenta</option>
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista">Cuenta Vista</option>
                      <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                      <option value="Cuenta RUT">Cuenta RUT</option>
                    </select>
                    {errors.bank_account_type && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_account_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Cuenta *
                    </label>
                    <input
                      type="text"
                      value={formData.bank_account_number}
                      onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                        errors.bank_account_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 12345678"
                    />
                    {errors.bank_account_number && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank_account_number}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
