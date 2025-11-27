/**
 * ContractModal.tsx - Modal para gestión de contratos de arriendo
 *
 * Componente reutilizable para crear y editar contratos de arriendo.
 * Extraído de PostulationAdminPanel para mejorar la organización del código.
 */

import React, { useState } from 'react';

export interface ContractData {
  id?: string;
  application_id: string;

  // Datos básicos del contrato
  start_date: string; // Fecha de inicio
  validity_period_months: number; // Plazo de vigencia en meses
  final_amount: number; // Monto final del contrato
  final_amount_currency: 'clp' | 'uf'; // Moneda del monto final
  guarantee_amount: number; // Monto garantía
  guarantee_amount_currency: 'clp' | 'uf'; // Moneda de la garantía
  has_dicom_clause: boolean; // Cláusula de DICOM
  has_auto_renewal_clause: boolean; // Cláusula de renovación automática

  // Comunicación
  tenant_email: string; // Mail arrendatario
  landlord_email: string; // Mail arrendador

  // Pagos - Cuenta corriente
  account_holder_name: string; // Nombre del titular
  account_number: string; // Número de cuenta
  account_bank: string; // Banco
  account_type: string; // Tipo de cuenta

  // Comisión de corretaje
  has_brokerage_commission: boolean;
  broker_name?: string; // Solo si has_brokerage_commission = true
  broker_amount?: number; // Solo si has_brokerage_commission = true
  broker_rut?: string; // Solo si has_brokerage_commission = true

  // Condiciones del inmueble
  allows_pets: boolean; // Se permiten mascotas
  is_furnished: boolean; // Está amoblado

  // Control
  created_at?: string;
  updated_at?: string;
}

export interface ContractFormData {
  // Datos básicos del contrato
  start_date: string;
  validity_period_months: number;
  final_amount: number;
  final_amount_currency: 'clp' | 'uf';
  guarantee_amount: number;
  guarantee_amount_currency: 'clp' | 'uf';
  has_dicom_clause: boolean;
  has_auto_renewal_clause: boolean;

  // Comunicación
  tenant_email: string;
  landlord_email: string;

  // Pagos - Cuenta corriente
  account_holder_name: string;
  account_number: string;
  account_bank: string;
  account_type: string;

  // Comisión de corretaje
  has_brokerage_commission: boolean;
  broker_name?: string;
  broker_amount?: number;
  broker_rut?: string;

  // Condiciones del inmueble
  allows_pets: boolean;
  is_furnished: boolean;
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContractFormData) => Promise<void>;
  initialData?: ContractData | null;
  isSaving: boolean;
  mode: 'create' | 'edit';
}

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving,
  mode
}) => {
  const [formData, setFormData] = useState<ContractFormData>({
    start_date: '',
    validity_period_months: 12,
    final_amount: 0,
    final_amount_currency: 'clp',
    guarantee_amount: 0,
    guarantee_amount_currency: 'clp',
    has_dicom_clause: false,
    has_auto_renewal_clause: false,
    tenant_email: '',
    landlord_email: '',
    account_holder_name: '',
    account_number: '',
    account_bank: '',
    account_type: '',
    has_brokerage_commission: false,
    broker_name: '',
    broker_amount: 0,
    broker_rut: '',
    allows_pets: false,
    is_furnished: false
  });

  // Reset form when modal opens with initial data
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
          validity_period_months: initialData.validity_period_months || 12,
          final_amount: initialData.final_amount || 0,
          final_amount_currency: initialData.final_amount_currency || 'clp',
          guarantee_amount: initialData.guarantee_amount || 0,
          guarantee_amount_currency: initialData.guarantee_amount_currency || 'clp',
          has_dicom_clause: initialData.has_dicom_clause || false,
          has_auto_renewal_clause: initialData.has_auto_renewal_clause || false,
          tenant_email: initialData.tenant_email || '',
          landlord_email: initialData.landlord_email || '',
          account_holder_name: initialData.account_holder_name || '',
          account_number: initialData.account_number || '',
          account_bank: initialData.account_bank || '',
          account_type: initialData.account_type || '',
          has_brokerage_commission: initialData.has_brokerage_commission || false,
          broker_name: initialData.broker_name || '',
          broker_amount: initialData.broker_amount || 0,
          broker_rut: initialData.broker_rut || '',
          allows_pets: initialData.allows_pets || false,
          is_furnished: initialData.is_furnished || false
        });
      } else {
        setFormData({
          start_date: '',
          validity_period_months: 12,
          final_amount: 0,
          final_amount_currency: 'clp',
          guarantee_amount: 0,
          guarantee_amount_currency: 'clp',
          has_dicom_clause: false,
          has_auto_renewal_clause: false,
          tenant_email: '',
          landlord_email: '',
          account_holder_name: '',
          account_number: '',
          account_bank: '',
          account_type: '',
          has_brokerage_commission: false,
          broker_name: '',
          broker_amount: 0,
          broker_rut: '',
          allows_pets: false,
          is_furnished: false
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // useEffect para estabilizar el estado del modal al cerrar
  React.useEffect(() => {
    if (!isOpen) {
      // Reset form cuando se cierra el modal
      setFormData({
        start_date: '',
        validity_period_months: 12,
        final_amount: 0,
        final_amount_currency: 'clp',
        guarantee_amount: 0,
        guarantee_amount_currency: 'clp',
        has_dicom_clause: false,
        tenant_email: '',
        landlord_email: '',
        account_holder_name: '',
        account_number: '',
        account_bank: '',
        account_type: '',
        has_brokerage_commission: false,
        broker_name: '',
        broker_amount: 0,
        broker_rut: '',
        allows_pets: false,
        is_furnished: false,
        has_auto_renewal_clause: false
      });
      setErrors({});
    }
  }, [isOpen]);

  const [errors, setErrors] = useState<Partial<ContractFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContractFormData> = {};

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria';
    }

    if (formData.validity_period_months < 1) {
      newErrors.validity_period_months = 'El plazo debe ser mayor a 0';
    }

    if (formData.final_amount <= 0) {
      newErrors.final_amount = 'El monto final debe ser mayor a 0';
    }

    if (formData.guarantee_amount < 0) {
      newErrors.guarantee_amount = 'El monto de garantía no puede ser negativo';
    }

    if (!formData.tenant_email.trim()) {
      newErrors.tenant_email = 'El email del arrendatario es obligatorio';
    }

    if (!formData.landlord_email.trim()) {
      newErrors.landlord_email = 'El email del arrendador es obligatorio';
    }

    if (!formData.account_holder_name.trim()) {
      newErrors.account_holder_name = 'El nombre del titular es obligatorio';
    }

    if (!formData.account_number.trim()) {
      newErrors.account_number = 'El número de cuenta es obligatorio';
    }

    if (!formData.account_bank.trim()) {
      newErrors.account_bank = 'El banco es obligatorio';
    }

    if (!formData.account_type.trim()) {
      newErrors.account_type = 'El tipo de cuenta es obligatorio';
    }

    // Validar comisión de corretaje si está habilitada
    if (formData.has_brokerage_commission) {
      if (!formData.broker_name?.trim()) {
        newErrors.broker_name = 'El nombre del corredor es obligatorio';
      }
      if (formData.broker_amount <= 0) {
        newErrors.broker_amount = 'El monto de la comisión debe ser mayor a 0';
      }
      if (!formData.broker_rut?.trim()) {
        newErrors.broker_rut = 'El RUT del corredor es obligatorio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando contrato:', error);
    }
  };

  const formatPriceCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {mode === 'create' ? 'Crear Contrato de Arriendo' : 'Editar Contrato de Arriendo'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General del Contrato */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Información General del Contrato
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.start_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plazo de Vigencia (meses) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.validity_period_months}
                onChange={(e) => setFormData(prev => ({ ...prev, validity_period_months: parseInt(e.target.value) || 12 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.validity_period_months ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.validity_period_months && <p className="text-red-500 text-xs mt-1">{errors.validity_period_months}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Final *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.final_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, final_amount: parseFloat(e.target.value) || 0 }))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.final_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 500000"
                />
                <select
                  value={formData.final_amount_currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, final_amount_currency: e.target.value as 'clp' | 'uf' }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="clp">CLP</option>
                  <option value="uf">UF</option>
                </select>
              </div>
              {errors.final_amount && <p className="text-red-500 text-xs mt-1">{errors.final_amount}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Garantía *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.guarantee_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, guarantee_amount: parseFloat(e.target.value) || 0 }))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.guarantee_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 100000"
                />
                <select
                  value={formData.guarantee_amount_currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, guarantee_amount_currency: e.target.value as 'clp' | 'uf' }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="clp">CLP</option>
                  <option value="uf">UF</option>
                </select>
              </div>
              {errors.guarantee_amount && <p className="text-red-500 text-xs mt-1">{errors.guarantee_amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.has_dicom_clause}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_dicom_clause: e.target.checked }))}
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Incluir cláusula DICOM</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.has_auto_renewal_clause}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_auto_renewal_clause: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Renovación automática</span>
              </label>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-4 w-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Información de Contacto
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Arrendatario *
              </label>
              <input
                type="email"
                value={formData.tenant_email}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tenant_email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="arrendatario@email.com"
              />
              {errors.tenant_email && <p className="text-red-500 text-xs mt-1">{errors.tenant_email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Arrendador *
              </label>
              <input
                type="email"
                value={formData.landlord_email}
                onChange={(e) => setFormData(prev => ({ ...prev, landlord_email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.landlord_email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="arrendador@email.com"
              />
              {errors.landlord_email && <p className="text-red-500 text-xs mt-1">{errors.landlord_email}</p>}
            </div>
          </div>
        </div>

        {/* Información Bancaria */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-4 w-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Información Bancaria
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Titular *
              </label>
              <input
                type="text"
                value={formData.account_holder_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.account_holder_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre completo del titular"
              />
              {errors.account_holder_name && <p className="text-red-500 text-xs mt-1">{errors.account_holder_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Cuenta *
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.account_number ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123456789"
              />
              {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banco *
              </label>
              <input
                type="text"
                value={formData.account_bank}
                onChange={(e) => setFormData(prev => ({ ...prev, account_bank: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.account_bank ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre del banco"
              />
              {errors.account_bank && <p className="text-red-500 text-xs mt-1">{errors.account_bank}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Cuenta *
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData(prev => ({ ...prev, account_type: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.account_type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar tipo</option>
                <option value="cuenta_corriente">Cuenta Corriente</option>
                <option value="cuenta_vista">Cuenta Vista</option>
                <option value="cuenta_ahorro">Cuenta de Ahorro</option>
              </select>
              {errors.account_type && <p className="text-red-500 text-xs mt-1">{errors.account_type}</p>}
            </div>
          </div>
        </div>

        {/* Comisión de Corretaje */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-4 w-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Comisión de Corretaje
          </h4>

          <div className="flex items-center mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.has_brokerage_commission}
                onChange={(e) => setFormData(prev => ({ ...prev, has_brokerage_commission: e.target.checked }))}
                className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">Incluir comisión de corretaje</span>
            </label>
          </div>

          {formData.has_brokerage_commission && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Corredor *
                </label>
                <input
                  type="text"
                  value={formData.broker_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, broker_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.broker_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre completo"
                />
                {errors.broker_name && <p className="text-red-500 text-xs mt-1">{errors.broker_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Comisión *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.broker_amount || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, broker_amount: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.broker_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Monto en CLP"
                />
                {errors.broker_amount && <p className="text-red-500 text-xs mt-1">{errors.broker_amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT del Corredor *
                </label>
                <input
                  type="text"
                  value={formData.broker_rut || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, broker_rut: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.broker_rut ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12.345.678-9"
                />
                {errors.broker_rut && <p className="text-red-500 text-xs mt-1">{errors.broker_rut}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Condiciones del Inmueble */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-4 w-4 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Condiciones del Inmueble
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allows_pets}
                  onChange={(e) => setFormData(prev => ({ ...prev, allows_pets: e.target.checked }))}
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">¿Se permiten mascotas?</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_furnished}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_furnished: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">¿Está amoblado?</span>
              </label>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {mode === 'create' ? 'Crear Contrato' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
