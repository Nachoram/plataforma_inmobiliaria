/**
 * RentalContractConditionsForm.tsx
 *
 * Componente independiente para la gestión de condiciones de contrato de arriendo.
 *
 * Este componente fue extraído de AdminPropertyDetailView.tsx para:
 * - Facilitar el mantenimiento y testing del formulario de condiciones contractuales
 * - Permitir reutilización en diferentes flujos de la aplicación
 * - Desacoplar la lógica de contratos de la vista administrativa
 * - Mejorar la organización del código y la separación de responsabilidades
 *
 * CAMPO property_type_characteristics_id - CRÍTICO PARA CONTRATOS:
 * ============================================================================
 * Este campo es OBLIGATORIO y debe contener un UUID válido de property_type_characteristics.
 *
 * RAZONES DE OBLIGATORIEDAD:
 * - Identifica el tipo de propiedad (Casa, Departamento, Bodega, etc.) de forma inequívoca
 * - Permite al sistema de contratos (n8n) aplicar cláusulas legales específicas por tipo
 * - Garantiza consistencia en documentos legales generados automáticamente
 * - Previene errores contractuales que podrían tener consecuencias legales
 * - Es requerido por el webhook de n8n para el procesamiento correcto de contratos
 * - Soporta validaciones específicas según el tipo de propiedad (ej: condiciones para bodegas)
 *
 * VALIDACIONES IMPLEMENTADAS:
 * - Campo requerido: no puede estar vacío
 * - Formato UUID válido: debe ser un UUID versión 4 válido
 * - Existencia en BD: el UUID debe existir en property_type_characteristics
 * - Error visual: muestra mensajes claros cuando falta o es inválido
 * - Bloqueo de envío: impide generar contrato sin este campo válido
 *
 * @author Plataforma Inmobiliaria
 * @date 2025-10-28
 */

import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, AlertTriangle, Mail, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { safeUUIDQuery } from '../../lib/validation';

// ========================================================================
// INTERFACES
// ========================================================================

/**
 * Datos del formulario de condiciones de contrato
 */
interface ContractConditionsFormData {
  // Basic contract information
  contract_start_date: string;
  contract_end_date: string;
  monthly_rent: number | string;
  warranty_amount: number | string;
  payment_day: number;

  /**
   * Property type characteristics ID (OBLIGATORIO para contratos)
   *
   * Este campo es crítico para el flujo de generación de contratos porque:
   * - Identifica inequívocamente el tipo de propiedad (Casa, Departamento, etc.)
   * - Permite al sistema de contratos (n8n) aplicar las cláusulas específicas por tipo de propiedad
   * - Garantiza consistencia en la generación de documentos legales
   * - Previene errores en contratos que podrían tener implicaciones legales
   * - Es requerido por el webhook de n8n para procesar contratos correctamente
   */
  property_type_characteristics_id: string;

  // Special conditions

  // DICOM clause
  dicom_clause: boolean;

  // Auto renewal clause
  autoRenewalClause: boolean;

  // Email notification
  notification_email: string;
  tenant_email: string;

  // Payment conditions
  payment_conditions: string;

  // Banking information
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder_name: string;
  account_holder_rut: string;

  // Broker information
  broker_name: string;
  broker_rut: string;

  // Final pricing
  final_rent_price: number | string;

  // Additional form fields
  duration: string; // Contract duration in months
  allows_pets: boolean;
  sublease: string;
  max_occupants: string;
  allowed_use: string;
  access_clause: string;
  broker_commission: number | string;
  payment_method: 'transferencia_bancaria' | 'plataforma';
}

/**
 * Datos del postulante seleccionado
 */
interface SelectedProfile {
  name: string;
  rut?: string;
  applicationId: string;
  applicationCharacteristicId?: string;
  guarantorName?: string | null;
  guarantorRut?: string | null;
  guarantorEmail?: string | null;
  guarantorPhone?: string | null;
  guarantorCharacteristicId?: string | null;
  profile: {
    email: string;
    phone: string;
  };
}

/**
 * Props del componente
 */
interface RentalContractConditionsFormProps {
  property: Property;
  selectedProfile: SelectedProfile;
  onSuccess?: () => void;
  onClose: () => void;
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Formatea un error de Supabase para logging y display
 */
const formatErrorDetails = (error: any, context: string = '') => {
  const details = {
    context,
    message: error?.message || 'Error desconocido',
    code: error?.code || 'N/A',
    details: error?.details || 'Sin detalles adicionales',
    hint: error?.hint || 'Sin sugerencias',
    stack: error?.stack || 'Sin stack trace',
    statusCode: error?.statusCode || error?.status || 'N/A',
  };

  console.error(`❌ [ERROR] ${context}:`, details);
  return details;
};

/**
 * Genera un mensaje de error user-friendly
 */
const getUserFriendlyErrorMessage = (error: any, defaultMessage: string = 'Ha ocurrido un error'): string => {
  if (!error) return defaultMessage;

  const message = error.message || '';

  if (message.includes('violates check constraint "check_monthly_payment_day"')) {
    return 'El día de pago debe estar entre 1 y 31';
  }
  if (message.includes('violates check constraint')) {
    return 'Datos inválidos. Por favor verifica los campos ingresados.';
  }
  if (message.includes('violates foreign key constraint')) {
    return 'Referencia inválida. Verifica que todos los datos relacionados existan.';
  }
  if (message.includes('violates not-null constraint')) {
    const match = message.match(/column "([^"]+)"/);
    const columnName = match ? match[1] : 'desconocido';
    return `Campo requerido faltante: ${columnName}`;
  }
  if (message.includes('permission denied') || message.includes('RLS') || message.includes('policy')) {
    return 'No tienes permisos para realizar esta acción. Verifica que seas el propietario.';
  }
  if (message.includes('column') && message.includes('does not exist')) {
    const match = message.match(/column "?([^"]+)"?/i);
    const columnName = match ? match[1] : 'desconocida';
    return `Error de configuración: La columna "${columnName}" no existe en la base de datos. Contacta al administrador.`;
  }
  if (message.includes('obligatorio') || message.includes('inválido') || message.includes('debe ser')) {
    return message;
  }

  return message || defaultMessage;
};

/**
 * Calcula la fecha de término del contrato
 */
const calculateEndDate = (startDate: string, durationMonths: string): string => {
  if (!startDate || !durationMonths) return '';

  const start = new Date(startDate);
  const months = parseInt(durationMonths);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  return end.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

/**
 * Validación defensiva para datos de propiedad
 * @param propertyData - Datos de la propiedad a validar
 * @returns true si los datos son válidos, false en caso contrario
 */
const validatePropertyData = (propertyData: any): boolean => {
  if (!propertyData) {
    console.error('❌ validatePropertyData: propertyData es null/undefined');
    return false;
  }

  if (!propertyData.id) {
    console.error('❌ validatePropertyData: Falta propertyData.id');
    return false;
  }

  if (!propertyData.property_type_characteristics_id) {
    console.error('❌ validatePropertyData: Falta property_type_characteristics_id');
    return false;
  }

  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(propertyData.property_type_characteristics_id)) {
    console.error('❌ validatePropertyData: property_type_characteristics_id no es un UUID válido');
    return false;
  }

  return true;
};

/**
 * Validación defensiva para datos de características del contrato
 * @param characteristicIds - Objeto con IDs de características
 * @returns true si todos los datos requeridos están presentes, false en caso contrario
 */
const validateCharacteristicIds = (characteristicIds: any): boolean => {
  if (!characteristicIds) {
    console.error('❌ validateCharacteristicIds: characteristicIds es null/undefined');
    return false;
  }

  const requiredFields = [
    'application_characteristic_id',
    'property_type_characteristics_id',
    'rental_owner_characteristic_id'
  ];

  for (const field of requiredFields) {
    if (!characteristicIds[field]) {
      console.error(`❌ validateCharacteristicIds: Falta campo requerido: ${field}`);
      return false;
    }
  }

  return true;
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

const RentalContractConditionsForm: React.FC<RentalContractConditionsFormProps> = ({
  property,
  selectedProfile,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Estado del formulario
  const [formData, setFormData] = useState<ContractConditionsFormData>({
    contract_start_date: '',
    contract_end_date: '',
    monthly_rent: '',
    warranty_amount: '',
    payment_day: 5,
    property_type_characteristics_id: (property as any)?.property_type_characteristics_id || '',
    dicom_clause: false,
    autoRenewalClause: false,
    notification_email: '',
    tenant_email: '',
    payment_conditions: '',
    bank_name: '',
    account_type: '',
    account_number: '',
    account_holder_name: '',
    account_holder_rut: '',
    broker_name: '',
    broker_rut: '',
    final_rent_price: '',
    duration: '12',
    allows_pets: false,
    sublease: 'No Permitido',
    max_occupants: '',
    allowed_use: '',
    access_clause: '',
    broker_commission: '',
    payment_method: 'transferencia_bancaria',
  });

  // ========================================================================
  // EFFECTS
  // ========================================================================

  /**
   * Cargar tipos de propiedad disponibles al montar el componente
   */
  useEffect(() => {
    fetchAvailablePropertyTypes();
  }, []);

  // ========================================================================
  // VALIDATION
  // ========================================================================

  /**
   * Valida un campo específico del formulario
   */
  const validateField = async (field: string, value: any): Promise<string | null> => {
    switch (field) {
      case 'property_type_characteristics_id':
        if (!value || value.trim() === '') {
          return 'El tipo de propiedad es obligatorio para generar contratos';
        }
        // Validar que sea un UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          return 'El tipo de propiedad seleccionado no es válido (formato UUID incorrecto)';
        }

        // Validación adicional: verificar que existe en la base de datos
        try {
          const validatedId = safeUUIDQuery(value, 'property_type_characteristics', 'id');
          const { data: propertyTypeData, error } = await supabase
            .from('property_type_characteristics')
            .select('id, name')
            .eq('id', validatedId)
            .maybeSingle();

          if (error) {
            console.error('Error validando property_type_characteristics_id:', error);
            return 'Error al validar el tipo de propiedad. Contacte al administrador.';
          }

          if (!propertyTypeData) {
            return `El tipo de propiedad seleccionado no existe en la base de datos. Por favor, contacte al administrador del sistema.`;
          }

          console.log('✅ Validación de property_type_characteristics_id exitosa:', propertyTypeData.name);
          return null;
        } catch (error) {
          console.error('Error en validación asíncrona de property_type_characteristics_id:', error);
          return 'Error al validar el tipo de propiedad';
        }

      case 'broker_name':
        if (!value || !value.trim()) {
          return 'El nombre del corredor es obligatorio';
        }
        if (value.trim().length < 3) {
          return 'El nombre debe tener al menos 3 caracteres';
        }
        return null;

      case 'broker_rut':
        if (!value || !value.trim()) {
          return 'El RUT del corredor es obligatorio';
        }
        if (value.trim().length < 9) {
          return 'Ingresa un RUT válido (ej: 12.345.678-9)';
        }
        return null;

      case 'final_rent_price':
        const price = Number(value);
        if (isNaN(price) || price <= 0) {
          return 'El precio debe ser mayor a 0';
        }
        return null;

      case 'notification_email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          return 'Ingresa un correo electrónico válido';
        }
        return null;

      default:
        return null;
    }
  };

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleContractFormChange = async (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };

      // Campos de monto que permiten valores vacíos en el UI
      const amountFields = ['monthly_rent', 'warranty_amount', 'final_rent_price', 'broker_commission'];

      // Campo de pago que debe ser número entero
      const integerFields = ['payment_day'];

      if (amountFields.includes(field)) {
        (newData as any)[field] = value === '' ? '' : value;
      } else if (integerFields.includes(field)) {
        const numValue = typeof value === 'string' ? parseInt(value) || 0 : Number(value) || 0;
        (newData as any)[field] = numValue;
      } else {
        (newData as any)[field] = value;
      }

      // Si cambia fecha de inicio o duración, recalcular fecha de término
      if (field === 'contract_start_date' || field === 'duration') {
        const endDate = calculateEndDate(
          field === 'contract_start_date' ? value : newData.contract_start_date,
          field === 'duration' ? value : newData.duration
        );
        newData.contract_end_date = endDate;
      }

      return newData;
    });

    // Validar campo en tiempo real (manejar validación asíncrona)
    try {
      const fieldError = await validateField(field, value);
      setFormErrors(prev => {
        const newErrors = { ...prev };
        if (fieldError) {
          newErrors[field] = fieldError;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    } catch (error) {
      console.error('Error en validación de campo:', error);
      setFormErrors(prev => ({
        ...prev,
        [field]: 'Error al validar el campo'
      }));
    }
  };

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  /**
   * Interfaz para tipos de propiedad disponibles
   */
  interface PropertyTypeOption {
    id: string;
    name: string;
    description?: string;
  }

  /**
   * Estado para tipos de propiedad disponibles
   */
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [isLoadingPropertyTypes, setIsLoadingPropertyTypes] = useState(false);

  /**
   * Obtiene los tipos de propiedad disponibles desde property_type_characteristics
   */
  const fetchAvailablePropertyTypes = async () => {
    try {
      setIsLoadingPropertyTypes(true);
      console.log('🔍 [fetchAvailablePropertyTypes] Obteniendo tipos de propiedad disponibles...');

      const { data: propertyTypes, error } = await supabase
        .from('property_type_characteristics')
        .select('id, name, description')
        .order('name');

      if (error) {
        formatErrorDetails(error, 'fetchAvailablePropertyTypes - Error obteniendo tipos de propiedad');
        toast.error('Error al cargar tipos de propiedad disponibles');
        return;
      }

      if (!propertyTypes || propertyTypes.length === 0) {
        console.warn('⚠️ [fetchAvailablePropertyTypes] No se encontraron tipos de propiedad');
        toast.error('No se encontraron tipos de propiedad configurados');
        return;
      }

      setAvailablePropertyTypes(propertyTypes);
      console.log('✅ [fetchAvailablePropertyTypes] Tipos de propiedad cargados:', propertyTypes.length);

    } catch (error) {
      console.error('❌ [fetchAvailablePropertyTypes] Error:', error);
      toast.error('Error al cargar tipos de propiedad');
    } finally {
      setIsLoadingPropertyTypes(false);
    }
  };

  /**
   * Obtiene los IDs de características del contrato con validaciones robustas
   */
  const fetchContractData = async (applicationId: string) => {
    if (!applicationId) {
      const errorMsg = 'Application ID es undefined/null';
      console.error('❌ [fetchContractData]', errorMsg);
      throw new Error('ID de aplicación no válido');
    }

    try {
      console.log('🔍 [fetchContractData] INICIANDO - Application ID:', applicationId);

      // Paso 1: Obtener datos de la aplicación y propiedad con validaciones robustas
      console.log('🔍 [fetchContractData] Consultando aplicación y propiedad con ID:', applicationId);

      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          application_characteristic_id,
          guarantor_characteristic_id,
          property_id,
          properties!inner (
            id,
            property_characteristic_id,
            property_type_characteristics_id,
            owner_id,
            address_street,
            address_number,
            address_commune,
            address_region,
            tipo_propiedad
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError) {
        formatErrorDetails(appError, 'fetchContractData - Error fetching application');
        throw new Error(getUserFriendlyErrorMessage(appError, 'No se pudo obtener la información de la aplicación'));
      }

      // Validación defensiva: verificar que properties existe en la respuesta
      const propertyData = applicationData.properties as any;

      if (!validatePropertyData(propertyData)) {
        throw new Error('Los datos de la propiedad son inválidos o incompletos. Verifique que la propiedad esté correctamente configurada en el sistema.');
      }

      // Paso 2: Obtener rental_owner_characteristic_id y datos del owner
      const { data: ownerData, error: ownerError } = await supabase
        .from('rental_owners')
        .select('id, rental_owner_characteristic_id, first_name, paternal_last_name, maternal_last_name, rut, email, phone')
        .eq('property_id', propertyData.id)
        .single();

      if (ownerError) {
        console.error('❌ Error fetching owner:', ownerError);
        throw new Error(getUserFriendlyErrorMessage(ownerError, 'No se pudo obtener la información del propietario'));
      }

      // Paso 3: Obtener rental_contract_conditions_characteristic_id (si existe registro)
      const { data: contractData, error: contractError } = await supabase
        .from('rental_contract_conditions')
        .select('id, rental_contract_conditions_characteristic_id')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (contractError && contractError.code !== 'PGRST116') {
        console.error('❌ Error fetching contract conditions:', contractError);
        throw new Error(getUserFriendlyErrorMessage(contractError, 'Error al consultar condiciones de contrato existentes'));
      }

      const characteristicIds = {
        application_characteristic_id: applicationData.application_characteristic_id,
        property_characteristic_id: propertyData.property_characteristic_id,
        property_type_characteristics_id: propertyData.property_type_characteristics_id,
        rental_owner_characteristic_id: ownerData.rental_owner_characteristic_id,
        rental_contract_conditions_characteristic_id: contractData?.rental_contract_conditions_characteristic_id || null,
        guarantor_characteristic_id: applicationData.guarantor_characteristic_id
      };

      console.log('✅ Characteristic IDs obtenidos:', characteristicIds);

      // Validar campos requeridos críticos
      const missingFields = [];
      if (!characteristicIds.application_characteristic_id) {
        missingFields.push('application_characteristic_id');
      }
      if (!characteristicIds.property_type_characteristics_id) {
        missingFields.push('property_type_characteristics_id');
      }
      if (!characteristicIds.rental_owner_characteristic_id) {
        missingFields.push('rental_owner_characteristic_id');
      }

      if (!characteristicIds.guarantor_characteristic_id) {
        console.warn('⚠️ Esta postulación no tiene garante - no es requerido para contrato básico');
      }

      if (missingFields.length > 0) {
        const errorMsg = `Faltan datos requeridos para generar contrato: ${missingFields.join(', ')}. ` +
                        'Verifique que la propiedad tenga un tipo asignado y que el propietario esté correctamente registrado.';
        throw new Error(errorMsg);
      }

      // Validación adicional: verificar que property_type_characteristics_id existe en la tabla
      const validatedPropertyTypeId = safeUUIDQuery(
        characteristicIds.property_type_characteristics_id,
        'property_type_characteristics',
        'id'
      );

      const { data: propertyTypeExists, error: propertyTypeCheckError } = await supabase
        .from('property_type_characteristics')
        .select('id, name')
        .eq('id', validatedPropertyTypeId)
        .maybeSingle();

      if (propertyTypeCheckError) {
        console.error('❌ Error validating property_type_characteristics_id:', propertyTypeCheckError);
        throw new Error('Error al validar el tipo de propiedad');
      }

      if (!propertyTypeExists) {
        throw new Error(`El tipo de propiedad seleccionado (UUID: ${characteristicIds.property_type_characteristics_id}) no existe en la base de datos. ` +
                       'Por favor, contacte al administrador del sistema.');
      }

      console.log('✅ Validación de property_type_characteristics_id exitosa:', propertyTypeExists.name);

      // Validación final de todos los datos requeridos
      if (!validateCharacteristicIds(characteristicIds)) {
        throw new Error('Validación final fallida: faltan datos requeridos para el contrato');
      }

      return characteristicIds;
    } catch (error) {
      console.error('❌ Error al obtener datos del contrato:', error);
      throw error;
    }
  };



  // ========================================================================
  // FORM SUBMISSION
  // ========================================================================

  /**
   * Validación final antes del envío del formulario
   */
  const validateFormBeforeSubmission = async (): Promise<string[]> => {
    const errors: string[] = [];

    // Validación crítica: property_type_characteristics_id
    if (!formData.property_type_characteristics_id || formData.property_type_characteristics_id.trim() === '') {
      errors.push('tipo de propiedad (campo obligatorio para generar contratos)');
    } else {
      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formData.property_type_characteristics_id)) {
        errors.push('tipo de propiedad (UUID inválido)');
      } else {
        // Validar existencia en BD
        try {
          const validatedId = safeUUIDQuery(formData.property_type_characteristics_id, 'property_type_characteristics', 'id');
          const { data: propertyTypeData, error } = await supabase
            .from('property_type_characteristics')
            .select('id, name')
            .eq('id', validatedId)
            .maybeSingle();

          if (error) {
            errors.push('tipo de propiedad (error de validación en BD)');
          } else if (!propertyTypeData) {
            errors.push('tipo de propiedad (no existe en la base de datos)');
          }
        } catch (error) {
          errors.push('tipo de propiedad (error al validar existencia)');
        }
      }
    }

    // Validaciones de otros campos críticos
    if (!formData.broker_name?.trim()) {
      errors.push('nombre del corredor (campo obligatorio)');
    }

    if (!formData.broker_rut?.trim()) {
      errors.push('RUT del corredor (campo obligatorio)');
    }

    if (!formData.contract_start_date) {
      errors.push('fecha de inicio del contrato (campo obligatorio)');
    }

    if (!formData.duration || formData.duration.trim() === '') {
      errors.push('duración del contrato (campo requerido)');
    } else {
      const durationMonths = Number(formData.duration);
      if (isNaN(durationMonths) || durationMonths < 1 || durationMonths > 60) {
        errors.push('duración del contrato (debe estar entre 1 y 60 meses)');
      }
    }

    if (!formData.payment_day) {
      errors.push('día de pago (campo requerido)');
    } else {
      const paymentDay = Number(formData.payment_day);
      if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) {
        errors.push('día de pago (debe estar entre 1 y 31)');
      }
    }

    const finalRentPriceValue = Number(formData.final_rent_price);
    if (isNaN(finalRentPriceValue) || finalRentPriceValue <= 0) {
      errors.push('precio final del arriendo (debe ser mayor a 0)');
    }

    if (formData.warranty_amount === null || formData.warranty_amount === undefined) {
      errors.push('monto de garantía (campo requerido)');
    } else {
      const warrantyAmount = Number(formData.warranty_amount);
      if (isNaN(warrantyAmount) || warrantyAmount < 0) {
        errors.push('monto de garantía (no puede ser negativo)');
      }
    }

    if (!formData.notification_email || formData.notification_email.trim() === '') {
      errors.push('correo electrónico oficial (campo obligatorio)');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.notification_email.trim())) {
        errors.push('correo electrónico (formato inválido)');
      }
    }

    if (!formData.tenant_email || formData.tenant_email.trim() === '') {
      errors.push('correo electrónico del arrendatario (campo obligatorio)');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.tenant_email.trim())) {
        errors.push('correo electrónico del arrendatario (formato inválido)');
      }
    }

    // Validación de RUT si está presente
    if (formData.broker_rut && formData.broker_rut.trim() !== '') {
      const rutRegex = /^\d{7,8}-[\dkK]$/;
      if (!rutRegex.test(formData.broker_rut.trim())) {
        errors.push('RUT del corredor (formato inválido)');
      }
    }

    // Validación de comisión del corredor si está presente
    if (formData.broker_commission !== null && formData.broker_commission !== undefined && formData.broker_commission !== 0) {
      const commission = Number(formData.broker_commission);
      if (isNaN(commission) || commission < 0) {
        errors.push('comisión del corredor (no puede ser negativa)');
      }
    }

    return errors;
  };

  /**
   * Maneja la creación del contrato a través de condiciones contractuales
   * El trigger se encarga automáticamente de crear el contrato en rental_contracts
   */
  const handleGenerateContract = async () => {
    if (isGenerating) {
      console.log('⚠️ Ya hay una creación de contrato en proceso.');
      return;
    }

    try {
      console.log('🚀 [handleGenerateContract] INICIANDO creación de contrato vía condiciones');

      setIsGenerating(true);
      setError(null);

      // 0. Validación final del formulario antes de procesar
      console.log('🔍 Ejecutando validación final del formulario...');
      const validationErrors = await validateFormBeforeSubmission();

      if (validationErrors.length > 0) {
        console.error('❌ Errores de validación final:', validationErrors);
        toast.error(`Errores de validación: ${validationErrors.join(', ')}`);
        setIsGenerating(false);
        return;
      }

      console.log('✅ Validación final del formulario exitosa');

      // Verificar permisos: usuario debe ser propietario de la propiedad
      console.log('🔐 Verificando permisos...');
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          property_id,
          properties!inner(owner_id)
        `)
        .eq('id', selectedProfile.applicationId)
        .single();

      if (appError || !appData) {
        console.error('❌ Error obteniendo datos de la aplicación:', appError);
        toast.error('Error al verificar permisos de la aplicación');
        setIsGenerating(false);
        return;
      }

      if (appData.properties.owner_id !== user?.id) {
        console.error('❌ Usuario no es propietario de la propiedad');
        toast.error('Solo el propietario de la propiedad puede crear contratos');
        setIsGenerating(false);
        return;
      }

      // Verificar que no existe ya un contrato para esta aplicación
      console.log('🔍 Verificando que no existe contrato previo...');
      const { data: existingContract, error: contractCheckError } = await supabase
        .from('rental_contracts')
        .select('id')
        .eq('application_id', selectedProfile.applicationId)
        .maybeSingle();

      if (contractCheckError) {
        console.error('❌ Error verificando contratos existentes:', contractCheckError);
        toast.error('Error al verificar contratos existentes');
        setIsGenerating(false);
        return;
      }

      if (existingContract) {
        console.error('❌ Ya existe un contrato para esta aplicación');
        toast.error('Ya existe un contrato para esta postulación');
        setIsGenerating(false);
        return;
      }

      // 1. Preparar datos para las condiciones contractuales
      console.log('📦 Preparando datos de condiciones contractuales...');

      const conditionsData = {
        application_id: selectedProfile.applicationId,
        contract_start_date: formData.contract_start_date,
        contract_duration_months: Number(formData.duration),
        final_rent_price: Number(formData.final_rent_price),
        guarantee_amount: Number(formData.warranty_amount) || Number(formData.final_rent_price),
        monthly_payment_day: formData.payment_day,
        broker_name: formData.broker_name?.trim() || '',
        broker_rut: formData.broker_rut?.trim() || '',
        brokerage_commission: formData.broker_commission ? Number(formData.broker_commission) : null,
        accepts_pets: formData.allows_pets || false,
        dicom_clause: formData.dicom_clause || false,
        auto_renewal_clause: formData.autoRenewalClause || false,
        notification_email: formData.notification_email?.trim(),
        tenant_email: formData.tenant_email?.trim(),
        bank_name: formData.bank_name?.trim(),
        account_type: formData.account_type,
        account_number: formData.account_number?.trim(),
        account_holder_name: formData.account_holder_name?.trim(),
        account_holder_rut: formData.account_holder_rut?.trim(),
        payment_method: formData.payment_method || 'transferencia_bancaria',
        landlord_email: formData.notification_email?.trim(), // Email del arrendador
        is_furnished: false, // Default
        created_by: user?.id
      };

      console.log('📊 Datos preparados para condiciones:', conditionsData);

      // 2. Insertar o actualizar condiciones contractuales
      console.log('💾 Guardando condiciones contractuales...');

      // Usar upsert para manejar inserción o actualización automática
      const { data: conditionsResult, error: conditionsError } = await supabase
        .from('rental_contract_conditions')
        .upsert(conditionsData, {
          onConflict: 'application_id', // Conflicto basado en application_id
          ignoreDuplicates: false // Permitir actualización si hay conflicto
        })
        .select('id, rental_contract_conditions_characteristic_id')
        .single();

      if (conditionsError) {
        console.error('❌ Error guardando condiciones:', conditionsError);

        let errorMessage = 'Error al guardar las condiciones del contrato';
        if (conditionsError.message.includes('violates check constraint')) {
          errorMessage = 'Los datos ingresados no cumplen con las validaciones requeridas';
        } else {
          errorMessage = `Error al guardar: ${conditionsError.message}`;
        }

        toast.error(errorMessage);
        setIsGenerating(false);
        return;
      }

      console.log('✅ Condiciones guardadas exitosamente:', conditionsResult.id);

      toast.success('Condiciones contractuales guardadas exitosamente');

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      // Cerrar modal
      onClose();

    } catch (error: any) {
      console.error('❌ Error en handleGenerateContract:', error);

      let errorMessage = 'Error al crear el contrato';

      if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setError(errorMessage);

    } finally {
      setIsGenerating(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-8 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-gray-200 transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-white rounded-full mb-4 shadow-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Confirmar Condiciones del Contrato de Arriendo
            </h2>
            <p className="text-blue-100 text-sm">
              Para: {selectedProfile.name}
            </p>
          </div>
        </div>

        {/* Contenido del Formulario */}
        <div className="p-8">
          
          {/* Información del Postulante y Propiedad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b-2 border-gray-200">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">👤</span>
                Postulante
              </h3>
              <p className="text-sm text-gray-700"><strong>Nombre:</strong> {selectedProfile.name}</p>
              <p className="text-sm text-gray-700"><strong>Email:</strong> {selectedProfile.profile.email}</p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🏠</span>
                Propiedad
              </h3>
              <p className="text-sm text-gray-700"><strong>Dirección:</strong> {property.address_street} {property.address_number}</p>
              <p className="text-sm text-gray-700"><strong>Tipo:</strong> {property.tipo_propiedad || 'No especificado'}</p>
            </div>
          </div>

          {/* Formulario de Condiciones */}
          <div className="space-y-6">
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">Condiciones del Contrato</h3>
            
            {/* Campos Comunes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Tipo de Propiedad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Propiedad <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 block mt-1">
                    Obligatorio para aplicar cláusulas específicas del contrato según el tipo de propiedad
                  </span>
                </label>
                {isLoadingPropertyTypes ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Cargando tipos de propiedad...</span>
                  </div>
                ) : (
                  <select
                    value={formData.property_type_characteristics_id}
                    onChange={(e) => handleContractFormChange('property_type_characteristics_id', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      formErrors.property_type_characteristics_id
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Seleccione un tipo de propiedad</option>
                    {availablePropertyTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} {type.description ? `(${type.description})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.property_type_characteristics_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {formErrors.property_type_characteristics_id}
                  </p>
                )}
                {!isLoadingPropertyTypes && availablePropertyTypes.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    No se encontraron tipos de propiedad configurados
                  </p>
                )}
              </div>

              {/* Fecha de Inicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Inicio del Contrato <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => handleContractFormChange('contract_start_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors relative z-10 bg-white"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none'
                  }}
                  required
                />
                {formData.contract_start_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fecha seleccionada: {new Date(formData.contract_start_date).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Duración del Contrato */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duración del Contrato (meses) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleContractFormChange('duration', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="18">18 meses</option>
                  <option value="24">24 meses</option>
                  <option value="36">36 meses</option>
                </select>
                {formData.contract_end_date && (
                  <p className="text-sm text-gray-600 mt-2">
                    📅 <strong>Fecha de término calculada:</strong> {new Date(formData.contract_end_date).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Monto de la Garantía */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto de la Garantía (CLP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.warranty_amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleContractFormChange('warranty_amount', value === '' ? '' : value);
                  }}
                  placeholder="Ej: 850000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Día de Pago Mensual */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Día de Pago Mensual <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_day}
                  onChange={(e) => handleContractFormChange('payment_day', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>Día {day}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Precio Final y Corredor */}
            <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💰</span>
                Precio Final del Arriendo y Corredor
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Precio Final */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio Final del Arriendo (CLP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={formData.final_rent_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleContractFormChange('final_rent_price', value === '' ? '' : value);
                    }}
                    placeholder="Ej: 500000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                {/* Nombre del Corredor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Corredor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.broker_name}
                    onChange={(e) => handleContractFormChange('broker_name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors ${
                      formErrors.broker_name
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                    placeholder="Ej: María López"
                    maxLength={120}
                    required
                  />
                  {formErrors.broker_name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {formErrors.broker_name}
                    </p>
                  )}
                </div>

                {/* RUT del Corredor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    RUT del Corredor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.broker_rut}
                    onChange={(e) => handleContractFormChange('broker_rut', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors ${
                      formErrors.broker_rut
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                    placeholder="Ej: 12.345.678-9"
                    maxLength={12}
                    required
                  />
                  {formErrors.broker_rut && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {formErrors.broker_rut}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Condiciones Especiales para Casa o Departamento */}
            {(property.tipo_propiedad === 'Casa' || property.tipo_propiedad === 'Departamento' || !property.tipo_propiedad) && (
              <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏘️</span>
                  Condiciones Especiales para {property.tipo_propiedad || 'Casa/Departamento'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Permite Mascotas */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowsPets"
                      checked={formData.allows_pets}
                      onChange={(e) => handleContractFormChange('allows_pets', e.target.checked)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowsPets" className="ml-3 text-sm font-semibold text-gray-700">
                      Permite Mascotas
                    </label>
                  </div>

                  {/* Cláusula de Subarriendo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cláusula de Subarriendo
                    </label>
                    <select
                      value={formData.sublease}
                      onChange={(e) => handleContractFormChange('sublease', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Permitido">Permitido</option>
                      <option value="No Permitido">No Permitido</option>
                    </select>
                  </div>

                  {/* Número de Ocupantes Máximo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Ocupantes Máximo
                    </label>
                    <input
                      type="number"
                      value={formData.max_occupants}
                      onChange={(e) => handleContractFormChange('max_occupants', e.target.value)}
                      placeholder="Ej: 4"
                      min="1"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* Condiciones Especiales para Bodega o Estacionamiento */}
            {(property.tipo_propiedad === 'Bodega' || property.tipo_propiedad === 'Estacionamiento') && (
              <div className="mt-8 p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🚗</span>
                  Condiciones Especiales para {property.tipo_propiedad}
                </h4>
                
                <div className="space-y-4">
                  
                  {/* Uso Permitido */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Uso Permitido
                    </label>
                    <textarea
                      value={formData.allowed_use}
                      onChange={(e) => handleContractFormChange('allowed_use', e.target.value)}
                      placeholder="Ej: Almacenamiento de enseres domésticos"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Cláusula de Acceso */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cláusula de Acceso
                    </label>
                    <textarea
                      value={formData.access_clause}
                      onChange={(e) => handleContractFormChange('access_clause', e.target.value)}
                      placeholder="Ej: Acceso 24/7 con llave magnética"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                </div>
              </div>
            )}


            {/* Cláusula DICOM */}
            <div className="mt-8 p-6 bg-amber-50 rounded-xl border-2 border-amber-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                Cláusula DICOM
              </h4>
              <div className="bg-white rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dicom_clause}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dicom_clause: e.target.checked
                    }))}
                    className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 block mb-1">
                      Incluir cláusula de terminación anticipada por ingreso a DICOM
                    </span>
                    <p className="text-xs text-gray-600">
                      Si se marca, el contrato incluirá una cláusula que permite al arrendador
                      terminar anticipadamente el contrato en caso de que el arrendatario ingrese
                      a DICOM durante la vigencia del arriendo.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Cláusula de Renovación Automática */}
            <div className="mt-8 p-6 bg-green-50 rounded-xl border-2 border-green-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 text-green-600 mr-2" />
                Cláusula de Renovación Automática
              </h4>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoRenewalClause"
                    checked={formData.autoRenewalClause}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      autoRenewalClause: e.target.checked
                    }))}
                    className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="autoRenewalClause" className="cursor-pointer">
                      <span className="text-sm font-medium text-gray-900 block mb-1">
                        Incluir Cláusula de Renovación Automática
                      </span>
                      <p className="text-xs text-gray-600">
                        Si se marca, el contrato incluirá una cláusula que permite la renovación
                        automática del contrato por un período igual al original, bajo las mismas
                        condiciones, a menos que alguna de las partes notifique lo contrario.
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Condiciones de Pago */}
            <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💰</span>
                Condiciones de Pago
              </h4>
              

              {/* Modo de Pago */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Modo de Pago del Arriendo *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transferencia_bancaria"
                      checked={formData.payment_method === 'transferencia_bancaria'}
                      onChange={(e) => handleContractFormChange('payment_method', e.target.value as 'transferencia_bancaria' | 'plataforma')}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm font-semibold text-gray-700">
                      Transferencia Bancaria
                    </span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg opacity-50 cursor-not-allowed bg-gray-100">
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

              {/* Datos para Transferencia */}
              {formData.payment_method === 'transferencia_bancaria' && (
                <div className="p-5 bg-white rounded-lg border-2 border-emerald-400">
                  <h5 className="text-md font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🏦</span>
                    Datos para Transferencia
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre del Titular */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del Titular <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.account_holder_name}
                        onChange={(e) => handleContractFormChange('account_holder_name', e.target.value)}
                        placeholder="Ej: Juan Pérez González"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* RUT del Titular */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        RUT del Titular <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.account_holder_rut}
                        onChange={(e) => handleContractFormChange('account_holder_rut', e.target.value)}
                        placeholder="Ej: 12.345.678-9"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Banco */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Banco <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.bank_name}
                        onChange={(e) => handleContractFormChange('bank_name', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                    </div>

                    {/* Tipo de Cuenta */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Cuenta <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.account_type}
                        onChange={(e) => handleContractFormChange('account_type', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="">Seleccione tipo de cuenta</option>
                        <option value="Cuenta Corriente">Cuenta Corriente</option>
                        <option value="Cuenta Vista">Cuenta Vista</option>
                        <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                        <option value="Cuenta RUT">Cuenta RUT</option>
                      </select>
                    </div>

                    {/* Número de Cuenta */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Número de Cuenta <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.account_number}
                        onChange={(e) => handleContractFormChange('account_number', e.target.value)}
                        placeholder="Ej: 12345678"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email de Notificación */}
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                Email de Notificación
              </h4>
              <div className="bg-white rounded-lg p-4">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1 block">
                      MAIL DE ARRENDADOR *
                    </span>
                    <input
                      type="email"
                      value={formData.notification_email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notification_email: e.target.value.trim()
                      }))}
                      placeholder="ejemplo@correo.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-1 block">
                      MAIL ARRENDATATARIO *
                    </span>
                    <input
                      type="email"
                      value={formData.tenant_email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        tenant_email: e.target.value.trim()
                      }))}
                      placeholder="ejemplo@correo.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </label>

                  <p className="text-xs text-gray-600">
                    El contrato generado será enviado a ambas direcciones de correo electrónico.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-6 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="w-full sm:w-auto px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateContract}
              disabled={isGenerating}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generando contrato...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Guardar Condiciones
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600 font-medium">Error al generar contrato</p>
              </div>
              <p className="text-xs text-red-500 mt-2">{error}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RentalContractConditionsForm;