import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Globe,
  Building,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { CustomButton } from '../common';
import { ApplicantFormData, BrokerType, IntentionType, ValidationErrors } from './types';
import BrokerTypeSelector from './BrokerTypeSelector';
import IntentionSelector from './IntentionSelector';

interface ApplicantFormProps {
  initialData?: Partial<ApplicantFormData>;
  onSubmit: (data: ApplicantFormData) => void;
  onCancel: () => void;
}

const ApplicantForm: React.FC<ApplicantFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<ApplicantFormData>({
    first_name: initialData?.first_name || '',
    paternal_last_name: initialData?.paternal_last_name || '',
    maternal_last_name: initialData?.maternal_last_name || '',
    rut: initialData?.rut || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    profession: initialData?.profession || '',
    marital_status: initialData?.marital_status || 'soltero',
    address_street: initialData?.address_street || '',
    address_number: initialData?.address_number || '',
    address_department: initialData?.address_department || '',
    address_commune: initialData?.address_commune || '',
    address_region: initialData?.address_region || '',
    monthly_income_clp: initialData?.monthly_income_clp,
    nationality: initialData?.nationality || '',
    date_of_birth: initialData?.date_of_birth || '',
    job_seniority: initialData?.job_seniority || '',
    broker_type: initialData?.broker_type || 'independent',
    firm_name: initialData?.firm_name || '',
    intention: initialData?.intention || 'rent'
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  // Validar RUT chileno
  const validateRut = (rut: string): boolean => {
    if (!rut) return false;

    // Remover puntos y guión
    const cleanRut = rut.replace(/[.\-]/g, '');

    if (cleanRut.length < 8 || cleanRut.length > 9) return false;

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

    return calculatedDv === dv;
  };

  // Validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar teléfono chileno
  const validatePhone = (phone: string): boolean => {
    // Formato chileno: +569XXXXXXXX o 9XXXXXXXX
    const phoneRegex = /^(\+569\d{8}|9\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Función de validación
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validaciones requeridas
    if (!formData.first_name.trim()) newErrors.first_name = 'Nombre es requerido';
    if (!formData.paternal_last_name.trim()) newErrors.paternal_last_name = 'Apellido paterno es requerido';
    if (!formData.maternal_last_name.trim()) newErrors.maternal_last_name = 'Apellido materno es requerido';

    // Validar RUT
    if (!formData.rut.trim()) {
      newErrors.rut = 'RUT es requerido';
    } else if (!validateRut(formData.rut)) {
      newErrors.rut = 'RUT inválido';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar teléfono
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono es requerido';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Teléfono inválido (formato: +569XXXXXXXX o 9XXXXXXXX)';
    }

    if (!formData.profession.trim()) newErrors.profession = 'Profesión es requerida';

    // Validar dirección
    if (!formData.address_street.trim()) newErrors.address_street = 'Calle es requerida';
    if (!formData.address_number.trim()) newErrors.address_number = 'Número es requerido';
    if (!formData.address_commune.trim()) newErrors.address_commune = 'Comuna es requerida';
    if (!formData.address_region.trim()) newErrors.address_region = 'Región es requerida';

    // Validar ingreso mensual
    if (formData.monthly_income_clp && formData.monthly_income_clp < 0) {
      newErrors.monthly_income_clp = 'Ingreso debe ser positivo';
    }

    // Validar fecha de nacimiento
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.date_of_birth = 'Debe ser mayor de 18 años';
      }
    }

    // Validar nombre de empresa si es broker de empresa
    if (formData.broker_type === 'firm' && !formData.firm_name?.trim()) {
      newErrors.firm_name = 'Nombre de empresa es requerido para brokers de empresa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ApplicantFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
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

    setLoading(true);
    try {
      // Formatear teléfono si no tiene +56
      let formattedPhone = formData.phone.replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+56${formattedPhone}`;
      }

      const submitData: ApplicantFormData = {
        ...formData,
        phone: formattedPhone
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Editar Perfil' : 'Completar Perfil'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Complete toda la información requerida para su perfil de postulante
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Juan"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={formData.paternal_last_name}
                  onChange={(e) => handleInputChange('paternal_last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.paternal_last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Pérez"
                />
                {errors.paternal_last_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.paternal_last_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  value={formData.maternal_last_name}
                  onChange={(e) => handleInputChange('maternal_last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.maternal_last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="González"
                />
                {errors.maternal_last_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.maternal_last_name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => handleInputChange('rut', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.rut ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12.345.678-9"
                />
                {errors.rut && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.rut}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.date_of_birth}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Chilena"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado Civil
                </label>
                <select
                  value={formData.marital_status}
                  onChange={(e) => handleInputChange('marital_status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="viudo">Viudo/a</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="juan.perez@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+56912345678 o 912345678"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Dirección
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle *
                </label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => handleInputChange('address_street', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address_street ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Avenida Providencia"
                />
                {errors.address_street && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address_street}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.address_number}
                  onChange={(e) => handleInputChange('address_number', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address_number ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123"
                />
                {errors.address_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.address_department}
                  onChange={(e) => handleInputChange('address_department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="401"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comuna *
                </label>
                <input
                  type="text"
                  value={formData.address_commune}
                  onChange={(e) => handleInputChange('address_commune', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address_commune ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Providencia"
                />
                {errors.address_commune && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address_commune}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Región *
                </label>
                <select
                  value={formData.address_region}
                  onChange={(e) => handleInputChange('address_region', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address_region ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar región</option>
                  <option value="Arica y Parinacota">Arica y Parinacota</option>
                  <option value="Tarapacá">Tarapacá</option>
                  <option value="Antofagasta">Antofagasta</option>
                  <option value="Atacama">Atacama</option>
                  <option value="Coquimbo">Coquimbo</option>
                  <option value="Valparaíso">Valparaíso</option>
                  <option value="Metropolitana">Metropolitana</option>
                  <option value="O'Higgins">O'Higgins</option>
                  <option value="Maule">Maule</option>
                  <option value="Ñuble">Ñuble</option>
                  <option value="Biobío">Biobío</option>
                  <option value="Araucanía">Araucanía</option>
                  <option value="Los Ríos">Los Ríos</option>
                  <option value="Los Lagos">Los Lagos</option>
                  <option value="Aysén">Aysén</option>
                  <option value="Magallanes">Magallanes</option>
                </select>
                {errors.address_region && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address_region}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trabajo y Finanzas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Información Laboral y Financiera
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesión *
                </label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.profession ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ingeniero Civil"
                />
                {errors.profession && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.profession}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Antigüedad Laboral
                </label>
                <input
                  type="text"
                  value={formData.job_seniority}
                  onChange={(e) => handleInputChange('job_seniority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="3 años"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Ingreso Mensual (CLP)
                </label>
                <input
                  type="number"
                  value={formData.monthly_income_clp || ''}
                  onChange={(e) => handleInputChange('monthly_income_clp', parseInt(e.target.value) || undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.monthly_income_clp ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="1500000"
                  min="0"
                />
                {errors.monthly_income_clp && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.monthly_income_clp}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Broker Type */}
          <BrokerTypeSelector
            value={formData.broker_type}
            firmName={formData.firm_name}
            onChange={(brokerType, firmName) => {
              setFormData(prev => ({
                ...prev,
                broker_type: brokerType,
                firm_name: firmName
              }));
              if (errors.firm_name) {
                setErrors(prev => ({ ...prev, firm_name: undefined }));
              }
            }}
            error={errors.firm_name}
          />

          {/* Intention */}
          <IntentionSelector
            value={formData.intention}
            onChange={(intention) => setFormData(prev => ({ ...prev, intention }))}
          />

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <CustomButton
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </CustomButton>
            <CustomButton
              type="submit"
              loading={loading}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {initialData ? 'Actualizar Perfil' : 'Guardar Perfil'}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicantForm;




