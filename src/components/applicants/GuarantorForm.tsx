import React, { useState } from 'react';
import {
  User,
  Users,
  Mail,
  Phone,
  AlertCircle,
  Plus,
  X,
  Shield
} from 'lucide-react';
import { CustomButton } from '../common';
import { GuarantorFormData, ValidationErrors } from './types';

interface GuarantorFormProps {
  guarantor?: GuarantorFormData;
  onSave: (guarantor: GuarantorFormData) => void;
  onCancel: () => void;
  isRequired?: boolean;
}

const GuarantorForm: React.FC<GuarantorFormProps> = ({
  guarantor,
  onSave,
  onCancel,
  isRequired = false
}) => {
  const [formData, setFormData] = useState<GuarantorFormData>({
    name: guarantor?.name || '',
    relationship: guarantor?.relationship || '',
    email: guarantor?.email || '',
    phone: guarantor?.phone || ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  // Validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar teléfono chileno
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+569\d{8}|9\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Función de validación
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre del garante es requerido';
    }

    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Relación con el garante es requerida';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email del garante es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono del garante es requerido';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Teléfono inválido (formato: +569XXXXXXXX o 9XXXXXXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GuarantorFormData, value: string) => {
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

      const submitData: GuarantorFormData = {
        ...formData,
        phone: formattedPhone
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving guarantor:', error);
    } finally {
      setLoading(false);
    }
  };

  const commonRelationships = [
    'Padre',
    'Madre',
    'Hermano/a',
    'Tío/a',
    'Primo/a',
    'Abuelo/a',
    'Empleador',
    'Otro'
  ];

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Información del Garante
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isRequired
                ? 'Esta información es requerida para continuar con tu postulación'
                : 'Información opcional del garante para fortalecer tu postulación'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Nombre del garante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo del garante *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Juan Pérez González"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Relación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relación con el garante *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={formData.relationship}
              onChange={(e) => handleInputChange('relationship', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.relationship ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar relación</option>
              {commonRelationships.map((relation) => (
                <option key={relation} value={relation}>
                  {relation}
                </option>
              ))}
            </select>
          </div>
          {errors.relationship && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.relationship}
            </p>
          )}
          {formData.relationship === 'Otro' && (
            <input
              type="text"
              placeholder="Especificar relación"
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => {
                if (e.target.value.trim()) {
                  handleInputChange('relationship', e.target.value);
                }
              }}
            />
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email del garante *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="juan.perez@email.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono del garante *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+56912345678 o 912345678"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            ¿Por qué necesito un garante?
          </h5>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              Un garante respalda financieramente tu compromiso en caso de arriendo o compra.
            </p>
            <p>
              Generalmente debe tener ingresos suficientes y una relación de confianza contigo.
            </p>
          </div>
        </div>

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
            <Plus className="h-4 w-4 mr-2" />
            {guarantor ? 'Actualizar Garante' : 'Agregar Garante'}
          </CustomButton>
        </div>
      </form>
    </div>
  );
};

export default GuarantorForm;







