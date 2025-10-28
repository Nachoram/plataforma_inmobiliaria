import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Calendar as CalendarIcon, ArrowLeft, Building, Building2, Car, Eye, Check, X, Mail, Phone, DollarSign, Briefcase, FileText, Send, UserCheck, FileUp, Copy, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AdminPropertyDetailView.css';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

// Interface for contract conditions form data
interface ContractConditionsFormData {
  // Basic contract information
  contract_start_date: string;
  contract_end_date: string;
  monthly_rent: number | string;
  warranty_amount: number | string;
  payment_day: number;

  // Special conditions
  special_conditions_house: string;

  // DICOM clause - NEW
  dicom_clause: boolean;

  // Email notification - NEW
  notification_email: string;

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

  // Additional form fields still used in the UI
  duration: string; // Contract duration in months
  allows_pets: boolean; // For property-specific conditions
  sublease: string; // For property-specific conditions
  max_occupants: string; // For property-specific conditions
  allowed_use: string; // For property-specific conditions
  access_clause: string; // For property-specific conditions
  broker_commission: number | string; // Commission amount
  payment_method: 'transferencia_bancaria' | 'plataforma'; // Payment method
}

// Datos de prueba para las métricas
const weeklyApplications = [
  { week: 'Hace 4 sem', count: 5 },
  { week: 'Hace 3 sem', count: 8 },
  { week: 'Hace 2 sem', count: 6 },
  { week: 'Última sem', count: 12 },
];

const weeklyViews = [
  { week: 'Hace 4 sem', count: 150 },
  { week: 'Hace 3 sem', count: 210 },
  { week: 'Hace 2 sem', count: 180 },
  { week: 'Última sem', count: 350 },
];

const marketPriceData = {
  currentPrice: 850000,
  marketAverage: 810000,
  difference: '+4.9%',
  recommendation: 'El precio es competitivo.'
};

// ========================================================================
// HELPER FUNCTIONS FOR ERROR HANDLING
// ========================================================================

/**
 * Formatea un error de Supabase para logging y display
 * @param error - Error object from Supabase or other sources
 * @param context - Context string describing where the error occurred
 * @returns Formatted error object with all details
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

  // Log completo en consola
  console.error(`❌ [ERROR] ${context}:`, details);

  return details;
};

/**
 * Genera un mensaje de error user-friendly a partir de un error de Supabase
 * @param error - Error object from Supabase
 * @param defaultMessage - Default message if no specific match is found
 * @returns User-friendly error message
 */
const getUserFriendlyErrorMessage = (error: any, defaultMessage: string = 'Ha ocurrido un error'): string => {
  if (!error) return defaultMessage;

  const message = error.message || '';

  // Check constraint violations
  if (message.includes('violates check constraint "check_monthly_payment_day"')) {
    return 'El día de pago debe estar entre 1 y 31';
  }
  if (message.includes('violates check constraint')) {
    return 'Datos inválidos. Por favor verifica los campos ingresados.';
  }

  // Foreign key violations
  if (message.includes('violates foreign key constraint')) {
    return 'Referencia inválida. Verifica que todos los datos relacionados existan.';
  }

  // Not-null constraint violations
  if (message.includes('violates not-null constraint')) {
    const match = message.match(/column "([^"]+)"/);
    const columnName = match ? match[1] : 'desconocido';
    return `Campo requerido faltante: ${columnName}`;
  }

  // Permission/RLS errors
  if (message.includes('permission denied') || message.includes('RLS') || message.includes('policy')) {
    return 'No tienes permisos para realizar esta acción. Verifica que seas el propietario.';
  }

  // Column doesn't exist (common in schema mismatches)
  if (message.includes('column') && message.includes('does not exist')) {
    const match = message.match(/column "?([^"]+)"?/i);
    const columnName = match ? match[1] : 'desconocida';
    return `Error de configuración: La columna "${columnName}" no existe en la base de datos. Contacta al administrador.`;
  }

  // 400 errors
  if (error.code === '400' || error.statusCode === 400) {
    return `Error 400: ${message || error.details || 'Solicitud inválida'}`;
  }

  // 404 errors
  if (error.code === '404' || error.statusCode === 404 || message.includes('not found')) {
    return 'El recurso solicitado no existe o no está disponible.';
  }

  // Network/Connection errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
  }

  // Validation errors from backend
  if (message.includes('obligatorio') || message.includes('inválido') || message.includes('debe ser')) {
    return message;
  }

  // Default: use the original message if it exists, otherwise default
  return message || defaultMessage;
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const AdminPropertyDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [applicationLink, setApplicationLink] = useState(
    'https://propiedadesapp.com/postular/a5b1c8f8-a0d4-425c-865e'
  );
  const [isCopied, setIsCopied] = useState(false);
  const [postulations, setPostulations] = useState<any[]>([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // ✅ Estados para validación de formulario
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Estado para el usuario actual
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados para la funcionalidad de webhook de contrato
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para calcular fecha de término basada en fecha de inicio y duración
  const calculateEndDate = (startDate: string, durationMonths: string): string => {
    if (!startDate || !durationMonths) return '';

    const start = new Date(startDate);
    const months = parseInt(durationMonths);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    return end.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  // Estado para el formulario de condiciones de contrato
  const [formData, setFormData] = useState<ContractConditionsFormData>({
    contract_start_date: '',
    contract_end_date: '',
    monthly_rent: '',
    warranty_amount: '',
    payment_day: Number(5),
    special_conditions_house: '',
    dicom_clause: false, // NUEVO
    notification_email: '', // NUEVO
    payment_conditions: '',
    bank_name: '',
    account_type: '',
    account_number: '',
    account_holder_name: '',
    account_holder_rut: '',
    broker_name: '',
    broker_rut: '',
    final_rent_price: '',
    // Additional form fields
    duration: '12',
    allows_pets: false,
    sublease: 'No Permitido',
    max_occupants: '',
    allowed_use: '',
    access_clause: '',
    broker_commission: '',
    payment_method: 'transferencia_bancaria',
  });

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      fetchPostulations();
    }
  }, [id]);

  // UseEffect para obtener el usuario actual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setCurrentUser(user);
        console.log('👤 Usuario actual:', user.id);
      } else {
        console.error('❌ Error obteniendo usuario:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Cargar condiciones existentes cuando se abre el modal
  useEffect(() => {
    const loadExistingConditions = async () => {
      if (!isContractModalOpen || !selectedProfile?.applicationId) return;

      console.log('🔍 Cargando condiciones existentes...');

      const { data, error } = await supabase
        .from('rental_contract_conditions')
        .select('*')
        .eq('application_id', selectedProfile.applicationId)
        .maybeSingle();

      if (data && !error) {
        console.log('📦 Condiciones encontradas:', data);

        const loadedData: ContractConditionsFormData = {
          // Fechas del contrato
          contract_start_date: data.contract_start_date || '',
          contract_end_date: data.contract_end_date || '',
          
          // Campos económicos - CORRECTED: mapear desde nombres de columnas actualizados
          monthly_rent: Number(data.final_rent_price) || Number(0), // monthly_rent en el form = final_rent_price en DB
          warranty_amount: Number(data.guarantee_amount) || Number(0), // warranty_amount en el form = guarantee_amount en DB
          final_rent_price: Number(data.final_rent_price) || Number(0),
          broker_commission: Number(data.brokerage_commission) || Number(0), // CORRECTED: brokerage_commission
          
          // Día de pago - CORRECTED: monthly_payment_day
          payment_day: Number(data.monthly_payment_day) || Number(5),
          
          // Duración - CORRECTED: contract_duration_months
          duration: data.contract_duration_months?.toString() || '12',
          
          // Condiciones especiales y booleanas
          special_conditions_house: data.additional_conditions || '', // CORRECTED: additional_conditions
          dicom_clause: data.dicom_clause || false,
          allows_pets: data.accepts_pets || false,
          
          // Email oficial - CORRECTED: official_communication_email
          notification_email: data.official_communication_email || '',
          
          // Información bancaria
          bank_name: data.bank_name || '',
          account_type: data.account_type || '',
          account_number: data.account_number || '',
          account_holder_name: data.account_holder_name || '',
          account_holder_rut: data.account_holder_rut || '',
          
          // Información del broker
          broker_name: data.broker_name || '',
          broker_rut: data.broker_rut || '',
          
          // Payment method
          payment_method: data.payment_method || 'transferencia',
          
          // Campos con valores por defecto
          payment_conditions: '',
          sublease: 'No Permitido',
          max_occupants: '',
          allowed_use: '',
          access_clause: '',
        };

        // Si no hay fecha de término pero hay fecha de inicio y duración, calcularla
        if (!loadedData.contract_end_date && loadedData.contract_start_date && loadedData.duration) {
          loadedData.contract_end_date = calculateEndDate(loadedData.contract_start_date, loadedData.duration);
        }

        setFormData(loadedData);
      }
    };

    loadExistingConditions();
  }, [isContractModalOpen, selectedProfile?.applicationId]);


  const fetchPropertyDetails = async () => {
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          id,
          owner_id,
          status,
          listing_type,
          tipo_propiedad,
          address_street,
          address_number,
          address_department,
          address_commune,
          address_region,
          price_clp,
          common_expenses_clp,
          bedrooms,
          bathrooms,
          surface_m2,
          description,
          estacionamientos,
          metros_utiles,
          metros_totales,
          ano_construccion,
          created_at,
          property_images!inner (
            image_url,
            storage_path
          )
        `)
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;

      setProperty(propertyData);
    } catch (error: any) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostulations = async () => {
    console.log('🔍 [AdminPropertyDetailView] Cargando postulaciones reales para property:', id);
    
    // ✅ Validación: prevenir consultas con ID undefined/null
    if (!id) {
      console.error('❌ [AdminPropertyDetailView] Property ID es undefined/null, no se puede cargar postulaciones');
      toast.error('Error: ID de propiedad no válido');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          applicant_id,
          guarantor_id,
          status,
          created_at,
          message,
          application_characteristic_id,
          guarantor_characteristic_id,
          profiles!applicant_id (
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone
          ),
        guarantors!guarantor_id (
          first_name,
          rut
        )
        `)
        .eq('property_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        // ✅ Usar función helper para formatear error
        formatErrorDetails(error, 'fetchPostulations - Error cargando postulaciones');
        const userMessage = getUserFriendlyErrorMessage(error, 'Error al cargar las postulaciones');
        toast.error(userMessage);
        return;
      }

      console.log('✅ [AdminPropertyDetailView] Postulaciones reales cargadas:', data?.length || 0);

      // Formatear las postulaciones al formato que usa el componente
      const formattedPostulations = (data || []).map((app: any, index: number) => ({
        id: index + 1, // ID numérico para la tabla (display)
        applicationId: app.id, // ✅ ID REAL de la aplicación (UUID)
        name: app.profiles
          ? `${app.profiles.first_name} ${app.profiles.paternal_last_name} ${app.profiles.maternal_last_name || ''}`.trim()
          : 'Sin nombre',
        date: new Date(app.created_at).toISOString().split('T')[0],
        score: 750, // TODO: Calcular score real si existe
        status: app.status === 'aprobada' ? 'Aprobado' : app.status === 'rechazada' ? 'Rechazado' : 'En Revisión',
        profile: {
          email: app.profiles?.email || 'Sin email',
          phone: app.profiles?.phone || 'Sin teléfono',
          income: 0, // TODO: Agregar si existe en la BD
          employment: 'N/A' // TODO: Agregar si existe en la BD
        },
        guarantor: app.guarantors ? {
          name: app.guarantors.first_name || 'Sin nombre',
          email: 'N/A', // Email not available in current schema
          phone: 'N/A', // Phone not available in current schema
          income: 0 // TODO: Agregar si existe en la BD
        } : null
      }));

      console.log('📊 [AdminPropertyDetailView] Postulaciones formateadas:', formattedPostulations);
      setPostulations(formattedPostulations);
    } catch (error: any) {
      // ✅ Usar función helper para formatear error
      formatErrorDetails(error, 'fetchPostulations - Error en catch');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error inesperado al cargar postulaciones');
      toast.error(userMessage);
    }
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleDateClick = (date: Date) => {
    // Comprueba si la fecha ya existe en el array
    const dateExists = availableDates.find(d => d.getTime() === date.getTime());

    if (dateExists) {
      // Si existe, la elimina (deselección)
      setAvailableDates(availableDates.filter(d => d.getTime() !== date.getTime()));
    } else {
      // Si no existe, la añade (selección)
      setAvailableDates([...availableDates, date]);
    }
  };

  // Obtener el color del score de riesgo
  const getScoreColor = (score: number) => {
    if (score > 750) return 'text-green-600 bg-green-50';
    if (score >= 650) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Obtener el estilo del badge de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'En Revisión':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Función para abrir el modal de detalles del perfil
  const handleViewDetails = (postulation: any) => {
    setSelectedProfile(postulation);
    setIsProfileModalOpen(true);
  };

  // Función para copiar el link al portapapeles
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationLink);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 3000); // Vuelve al estado normal después de 3 segundos
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  // Función para abrir el modal de condiciones de contrato
  const handleAcceptClick = () => {
    console.log('👆 [handleAcceptClick] CLICK en "Aceptar Postulación"');
    console.log('👤 selectedProfile antes de abrir modal:', selectedProfile);
    setIsProfileModalOpen(false); // Cierra el modal del perfil
    setIsContractModalOpen(true);  // Abre el modal de contrato
    console.log('✅ Modal de contrato abierto');
  };

  // ✅ Función de validación en tiempo real
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
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

  // Función para actualizar los campos del formulario
  const handleContractFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };

      // Campos de monto que permiten valores vacíos en el UI
      const amountFields = ['monthly_rent', 'warranty_amount', 'final_rent_price', 'broker_commission'];
      
      // Campo de pago que debe ser número entero
      const integerFields = ['payment_day'];

      if (amountFields.includes(field)) {
        // Permitir string vacío o mantener el valor como está (string o número)
        (newData as any)[field] = value === '' ? '' : value;
      } else if (integerFields.includes(field)) {
        // Convertir explícitamente a número para payment_day
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

    // ✅ Validar campo en tiempo real y actualizar errores
    const error = validateField(field, value);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  // Función para obtener los IDs de características del contrato
  const fetchContractData = async (applicationId: string) => {
    // ✅ Validación: prevenir consultas con ID undefined/null
    if (!applicationId) {
      const errorMsg = 'Application ID es undefined/null';
      console.error('❌ [fetchContractData]', errorMsg);
      throw new Error('ID de aplicación no válido');
    }

    try {
      console.log('🔍 [fetchContractData] INICIANDO - Application ID:', applicationId);

      // Paso 1: Obtener datos de la aplicación y propiedad
      console.log('📋 Paso 1: Consultando aplicación y propiedad...');
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
            owner_id
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError) {
        formatErrorDetails(appError, 'fetchContractData - Error fetching application');
        throw new Error(getUserFriendlyErrorMessage(appError, 'No se pudo obtener la información de la aplicación'));
      }

      console.log('📋 Application data obtenida:', applicationData);

      // Asegurar que properties sea tratado como objeto único
      const propertyData = applicationData.properties as any;

      // Paso 2: Obtener rental_owner_characteristic_id desde rental_owners
      console.log('👤 Paso 2: Consultando propietario - Property ID:', propertyData?.id);
      const { data: ownerData, error: ownerError } = await supabase
        .from('rental_owners')
        .select('id, rental_owner_characteristic_id')
        .eq('property_id', propertyData?.id)
        .single();

      if (ownerError) {
        console.error('❌ Error fetching owner:', ownerError);
        throw ownerError;
      }

      console.log('👤 Owner data obtenida:', ownerData);

      // Paso 3: Obtener contract_conditions_characteristic_id
      console.log('📄 Paso 3: Consultando condiciones del contrato existentes...');
      const { data: contractData, error: contractError } = await supabase
        .from('rental_contract_conditions')
        .select('id, contract_conditions_characteristic_id')
        .eq('application_id', applicationId)
        .maybeSingle(); // Puede no existir aún

      if (contractError && contractError.code !== 'PGRST116') {
        console.error('❌ Error fetching contract conditions:', contractError);
        throw contractError;
      }

      console.log('📄 Contract data obtenida:', contractData);

      // Validar que todos los IDs existen
      const characteristicIds = {
        application_characteristic_id: applicationData.application_characteristic_id,
        property_characteristic_id: propertyData?.property_characteristic_id,
        rental_owner_characteristic_id: ownerData.rental_owner_characteristic_id,
        contract_conditions_characteristic_id: contractData?.contract_conditions_characteristic_id || null,
        guarantor_characteristic_id: applicationData.guarantor_characteristic_id
      };

      console.log('✅ Characteristic IDs obtenidos:', characteristicIds);

      // Validar campos requeridos
      console.log('🔍 Validando campos requeridos...');
      const missingFields = [];
      if (!characteristicIds.application_characteristic_id) {
        missingFields.push('application_characteristic_id');
      }
      if (!characteristicIds.property_characteristic_id) {
        missingFields.push('property_characteristic_id');
      }
      if (!characteristicIds.rental_owner_characteristic_id) {
        missingFields.push('rental_owner_characteristic_id');
      }
      // guarantor_characteristic_id es OPCIONAL - no todas las postulaciones tienen garante
      // Solo advertir si falta, pero no bloquear el proceso
      if (!characteristicIds.guarantor_characteristic_id) {
        console.warn('⚠️ Esta postulación no tiene garante (guarantor_characteristic_id es null)');
      }

      if (missingFields.length > 0) {
        console.error('❌ Campos faltantes:', missingFields);
        throw new Error(`Faltan datos requeridos: ${missingFields.join(', ')}`);
      }

      console.log('✅ [fetchContractData] FINALIZADO exitosamente');
      return characteristicIds;
    } catch (error) {
      console.error('❌ Error al obtener datos del contrato:', error);
      throw error;
    }
  };

  /**
   * Crea o actualiza el registro del contrato en rental_contracts
   * Se ejecuta cuando se genera el contrato, antes de enviar a n8n
   */
  const createOrUpdateRentalContract = async (applicationId: string) => {
    try {
      console.log('📝 Creando/actualizando registro en rental_contracts...');

      if (!currentUser?.id) {
        console.error('❌ No hay usuario autenticado');
        throw new Error('Usuario no autenticado');
      }

      // Verificar si ya existe un contrato para esta aplicación
      const { data: existingContract, error: checkError } = await supabase
        .from('rental_contracts')
        .select('id, status, version')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error verificando contrato existente:', checkError);
        throw checkError;
      }

      if (existingContract) {
        console.log('📄 Contrato existente encontrado:', existingContract.id);
        console.log('📊 Estado actual:', existingContract.status);
        console.log('🔢 Versión actual:', existingContract.version);

        // Si ya existe, actualizar campos relevantes pero mantener contract_content y contract_html
        const { data: updatedContract, error: updateError } = await supabase
          .from('rental_contracts')
          .update({
            status: 'draft', // Resetear a draft si se regenera
            updated_at: new Date().toISOString(),
            version: (existingContract.version || 1) + 1, // Incrementar versión
            notes: `Contrato regenerado el ${new Date().toLocaleString('es-CL')}`,
          })
          .eq('id', existingContract.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error actualizando contrato:', updateError);
          throw updateError;
        }

        console.log('✅ Contrato actualizado:', updatedContract.id);
        return updatedContract;

      } else {
        console.log('🆕 Creando nuevo contrato...');

        // Crear nuevo registro
        const { data: newContract, error: insertError } = await supabase
          .from('rental_contracts')
          .insert({
            application_id: applicationId,
            status: 'draft',
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            contract_format: 'hybrid', // Porque tendremos tanto JSON como HTML
            version: 1,
            notes: `Contrato generado el ${new Date().toLocaleString('es-CL')}`,
            // contract_content y contract_html se dejan null - n8n los llenará
            // Los triggers automáticos generarán:
            // - contract_characteristic_id
            // - contract_number
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creando contrato:', insertError);
          throw insertError;
        }

        console.log('✅ Nuevo contrato creado:', newContract.id);
        console.log('🔢 Contract number:', newContract.contract_number);
        console.log('🆔 Characteristic ID:', newContract.contract_characteristic_id);
        return newContract;
      }

    } catch (error) {
      console.error('❌ Error en createOrUpdateRentalContract:', error);
      throw error;
    }
  };

  // Función helper para mapear campos del formulario a la estructura de la base de datos
  const mapFormDataToDatabase = (formData: ContractConditionsFormData, currentUserId: string) => {
    // Convertir campos de monto de string a número ('' se convierte a 0)
    const finalRentPrice = formData.final_rent_price === '' ? 0 : Number(formData.final_rent_price);
    const warrantyAmount = formData.warranty_amount === '' ? 0 : Number(formData.warranty_amount);
    const brokerCommission = formData.broker_commission === '' ? 0 : Number(formData.broker_commission);

    // Validaciones básicas antes de mapear
    if (!formData.broker_name?.trim()) {
      throw new Error('El nombre del corredor es obligatorio');
    }
    if (!formData.broker_rut?.trim()) {
      throw new Error('El RUT del corredor es obligatorio');
    }
    if (!formData.contract_start_date) {
      throw new Error('La fecha de inicio del contrato es obligatoria');
    }
    if (isNaN(finalRentPrice) || finalRentPrice <= 0) {
      throw new Error('El precio final del arriendo debe ser mayor a 0');
    }
    if (isNaN(warrantyAmount) || warrantyAmount <= 0) {
      throw new Error('El monto de garantía debe ser mayor a 0');
    }
    if (!formData.duration || Number(formData.duration) <= 0) {
      throw new Error('La duración del contrato debe ser mayor a 0 meses');
    }
    if (!formData.payment_day || formData.payment_day < 1 || formData.payment_day > 31) {
      throw new Error('El día de pago debe estar entre 1 y 31');
    }
    if (!selectedProfile.applicationId) {
      throw new Error('No se encontró el ID de la aplicación');
    }

    return {
      application_id: selectedProfile.applicationId,

      // Campos requeridos por la tabla
      final_rent_price: finalRentPrice,
      broker_name: formData.broker_name.trim(),
      broker_rut: formData.broker_rut.trim(),
      contract_duration_months: Number(formData.duration),
      monthly_payment_day: Number(formData.payment_day),
      guarantee_amount: warrantyAmount,
      contract_start_date: formData.contract_start_date,

      // Campos opcionales
      accepts_pets: Boolean(formData.allows_pets),
      additional_conditions: formData.special_conditions_house?.trim() || null,
      brokerage_commission: brokerCommission,

      // Información bancaria (opcional)
      bank_name: formData.bank_name?.trim() || null,
      account_type: formData.account_type?.trim() || null,
      account_number: formData.account_number?.trim() || null,
      account_holder_name: formData.account_holder_name?.trim() || null,
      account_holder_rut: formData.account_holder_rut?.trim() || null,

      // Método de pago - Normalizar valores antiguos (cast para compatibilidad con datos legacy)
      payment_method: (formData.payment_method as string) === 'transferencia' ? 'transferencia_bancaria' : formData.payment_method,

      // Usuario que crea las condiciones
      created_by: currentUserId,

      // Timestamp de actualización (el trigger lo maneja, pero lo incluimos por claridad)
      updated_at: new Date().toISOString(),
    };
  };

  // Función para generar y enviar contrato al webhook
  const handleGenerateContract = async () => {
    // Prevenir múltiples ejecuciones simultáneas
    if (isGenerating) {
      console.log('⚠️ Ya hay una generación de contrato en proceso. Ignorando duplicado.');
      return;
    }

    let contractRecordCreated = false;
    let contractId = null;

    try {
      console.log('🚀 [handleGenerateContract] INICIANDO proceso de generación de contrato');
      console.log('👤 selectedProfile:', selectedProfile);
      console.log('📄 formData:', formData);

      setIsGenerating(true);
      setError(null);

      // 1. Validar campos requeridos
      console.log('🔍 Validando campos requeridos...');

      // DEBUG: Logging para verificar tipos de datos
      console.log('🔍 [DEBUG] Valores antes de validación:', {
        final_rent_price: formData.final_rent_price,
        final_rent_price_type: typeof formData.final_rent_price,
        final_rent_price_parsed: Number(formData.final_rent_price),
        warranty_amount: formData.warranty_amount,
        warranty_amount_type: typeof formData.warranty_amount,
        payment_day: formData.payment_day,
        payment_day_type: typeof formData.payment_day,
        broker_commission: formData.broker_commission,
        broker_commission_type: typeof formData.broker_commission
      });

      const validationErrors = [];

      // ✅ Validar campos críticos PRIMERO (broker_name, broker_rut)
      if (!formData.broker_name?.trim()) {
        validationErrors.push('nombre del corredor (campo obligatorio)');
        setFormErrors(prev => ({ ...prev, broker_name: 'El nombre del corredor es obligatorio' }));
      }
      
      if (!formData.broker_rut?.trim()) {
        validationErrors.push('RUT del corredor (campo obligatorio)');
        setFormErrors(prev => ({ ...prev, broker_rut: 'El RUT del corredor es obligatorio' }));
      }

      // Validar duración del contrato (1-60 meses)
      if (!formData.duration || formData.duration.trim() === '') {
        validationErrors.push('duración del contrato (campo requerido)');
      } else {
        const durationMonths = Number(formData.duration);
        if (isNaN(durationMonths)) {
          validationErrors.push('duración del contrato (debe ser un número válido)');
        } else if (durationMonths < 1 || durationMonths > 60) {
          validationErrors.push('duración del contrato (debe estar entre 1 y 60 meses)');
        }
      }

      // Validar día de pago (1-31)
      if (!formData.payment_day) {
        validationErrors.push('día de pago (campo requerido)');
      } else {
        const paymentDay = Number(formData.payment_day);
        if (isNaN(paymentDay)) {
          validationErrors.push('día de pago (debe ser un número válido)');
        } else if (paymentDay < 1 || paymentDay > 31) {
          validationErrors.push('día de pago (debe estar entre 1 y 31)');
        }
      }

      // Validar precio final del arriendo (NO puede ser 0, debe ser mayor a 0)
      const finalRentPriceValue = Number(formData.final_rent_price);
      if (isNaN(finalRentPriceValue)) {
        validationErrors.push('precio final del arriendo (debe ser un número válido)');
      } else if (finalRentPriceValue <= 0) {
        validationErrors.push('precio final del arriendo (debe ser mayor a 0)');
      }

      // Validar monto de garantía (puede ser 0 pero no negativo)
      if (formData.warranty_amount === null || formData.warranty_amount === undefined) {
        validationErrors.push('monto de garantía (campo requerido)');
      } else {
        const warrantyAmount = Number(formData.warranty_amount);
        if (isNaN(warrantyAmount)) {
          validationErrors.push('monto de garantía (debe ser un número válido)');
        } else if (warrantyAmount < 0) {
          validationErrors.push('monto de garantía (no puede ser negativo)');
        }
      }

      // Validar email oficial
      if (!formData.notification_email || formData.notification_email.trim() === '') {
        validationErrors.push('correo electrónico oficial');
      }

      // Validar RUT del broker si se proporciona
      if (formData.broker_rut && formData.broker_rut.trim() !== '') {
        const rutRegex = /^\d{7,8}-[\dkK]$/;
        if (!rutRegex.test(formData.broker_rut.trim())) {
          validationErrors.push('RUT del corredor (formato inválido)');
        }
      }

      // Validar comisión del broker (opcional pero no negativa si se proporciona)
      if (formData.broker_commission !== null && formData.broker_commission !== undefined && formData.broker_commission !== 0) {
        const commission = Number(formData.broker_commission);
        if (isNaN(commission)) {
          validationErrors.push('comisión del corredor (debe ser un número válido)');
        } else if (commission < 0) {
          validationErrors.push('comisión del corredor (no puede ser negativa)');
        }
      }

      if (validationErrors.length > 0) {
        console.error('❌ Errores de validación:', {
          duration: formData.duration,
          payment_day: formData.payment_day,
          final_rent_price: formData.final_rent_price,
          warranty_amount: formData.warranty_amount,
          notification_email: formData.notification_email,
          errores: validationErrors
        });
        toast.error(`Errores de validación: ${validationErrors.join(', ')}`);
        setIsGenerating(false);
        return;
      }
      console.log('✅ Campos requeridos validados');

      // 2. Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.notification_email)) {
        console.error('❌ Email inválido:', formData.notification_email);
        toast.error('Por favor ingresa un correo electrónico válido');
        setIsGenerating(false);
        return;
      }
      console.log('✅ Email validado');

      console.log('📋 Iniciando generación de contrato...');
      console.log('🎯 Application ID:', selectedProfile?.applicationId);

      // 3. Obtener datos de características (código existente)
      console.log('🔍 Obteniendo datos de características...');
      const characteristicIds = await fetchContractData(selectedProfile.applicationId);
      console.log('✅ Datos de características obtenidos:', characteristicIds);

      // ✅ Validación: verificar que existan los IDs necesarios
      if (!characteristicIds.property_characteristic_id || !characteristicIds.rental_owner_characteristic_id) {
        console.error('❌ Faltan datos requeridos:', characteristicIds);
        toast.error('Error obteniendo datos de la propiedad. Verifica que la propiedad tenga características asignadas.');
        setIsGenerating(false);
        return;
      }
      console.log('✅ Validación de características exitosa');

      // ✅ Consultas con manejo de errores para evitar 404s
      console.log('🔍 Obteniendo datos de property_type_characteristics...');
      const { data: propertyTypeData, error: propertyTypeError } = await supabase
        .from('property_type_characteristics')
        .select('name')
        .eq('id', characteristicIds.property_characteristic_id)
        .maybeSingle(); // ✅ maybeSingle() no lanza error si no existe

      if (propertyTypeError) {
        formatErrorDetails(propertyTypeError, 'handleGenerateContract - Error obteniendo property_type_characteristics');
        toast.error('Error al obtener datos del tipo de propiedad');
        setIsGenerating(false);
        return;
      }

      if (!propertyTypeData) {
        console.error('❌ property_type_characteristics no encontrado para ID:', characteristicIds.property_characteristic_id);
        toast.error('No se encontraron las características del tipo de propiedad');
        setIsGenerating(false);
        return;
      }

      console.log('🔍 Obteniendo datos de rental_owner_characteristics...');
      const { data: ownerData, error: ownerError } = await supabase
        .from('rental_owner_characteristics')
        .select('name, rut')
        .eq('id', characteristicIds.rental_owner_characteristic_id)
        .maybeSingle(); // ✅ maybeSingle() no lanza error si no existe

      if (ownerError) {
        formatErrorDetails(ownerError, 'handleGenerateContract - Error obteniendo rental_owner_characteristics');
        toast.error('Error al obtener datos del propietario');
        setIsGenerating(false);
        return;
      }

      if (!ownerData) {
        console.error('❌ rental_owner_characteristics no encontrado para ID:', characteristicIds.rental_owner_characteristic_id);
        toast.error('No se encontraron las características del propietario');
        setIsGenerating(false);
        return;
      }

      // 4. Guardar condiciones del contrato con mapeo correcto
      console.log('💾 Guardando condiciones del contrato...');

      // Mapear campos del formulario a estructura de base de datos
      const contractConditionsData = mapFormDataToDatabase(formData, currentUser?.id);

      console.log('📝 Datos mapeados a guardar:', contractConditionsData);

      const { error: upsertError } = await supabase
        .from('rental_contract_conditions')
        .upsert(contractConditionsData, {
          onConflict: 'application_id'  // Evitar duplicados por application_id
        });

      if (upsertError) {
        // ✅ Usar función helper para formatear error
        formatErrorDetails(upsertError, 'handleGenerateContract - Error guardando condiciones del contrato');
        const errorMessage = getUserFriendlyErrorMessage(upsertError, 'Error al guardar las condiciones del contrato');
        throw new Error(errorMessage);
      }

      console.log('✅ Condiciones guardadas exitosamente');

      // 5. NUEVO - Crear o actualizar registro en rental_contracts
      console.log('📝 Creando registro del contrato...');
      const contractRecord = await createOrUpdateRentalContract(selectedProfile.applicationId);
      contractRecordCreated = true;
      contractId = contractRecord.id;
      console.log('✅ Registro del contrato creado/actualizado:', contractRecord.id);
      console.log('📋 Contract number:', contractRecord.contract_number);
      console.log('📄 Contract record completo:', contractRecord);

      // 6. Preparar y enviar payload al webhook con todos los datos necesarios para n8n
      const webhookPayload = {
        // ========== IDs de referencia ==========
        contract_id: contractRecord.id,
        contract_number: contractRecord.contract_number,
        application_id: selectedProfile.applicationId,
        property_id: property?.id || '',
        
        // ========== Datos del postulante ==========
        applicant_name: selectedProfile.name,
        applicant_rut: selectedProfile.rut || '',
        applicant_email: selectedProfile.profile.email,
        applicant_phone: selectedProfile.profile.phone,
        applicant_characteristic_id: selectedProfile.applicationCharacteristicId || null,

        // ========== Datos del garante (si existe) ==========
        guarantor_name: selectedProfile.guarantorName || null,
        guarantor_rut: selectedProfile.guarantorRut || null,
        guarantor_email: selectedProfile.guarantorEmail || null,
        guarantor_phone: selectedProfile.guarantorPhone || null,
        guarantor_characteristic_id: selectedProfile.guarantorCharacteristicId || null,

        // ========== Datos de la propiedad ==========
        property_address: (property?.address_street || '') + ' ' + (property?.address_number || ''),
        property_commune: property?.address_commune || '',
        property_region: property?.address_region || '',
        property_type: propertyTypeData?.name || 'No especificado',
        property_characteristic_id: (property as any)?.property_characteristic_id || null,

        // ========== Datos del propietario ==========
        owner_name: ownerData?.name || 'No especificado',
        owner_rut: ownerData?.rut || 'No especificado',
        owner_email: (ownerData as any)?.email || '',
        owner_phone: (ownerData as any)?.phone || '',
        owner_characteristic_id: (ownerData as any)?.rental_owner_characteristic_id || null,

        // ========== Condiciones del contrato ==========
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        contract_duration_months: Number(formData.duration),
        
        // Precios y montos
        monthly_rent: Number(formData.monthly_rent),
        final_rent_price: Number(formData.final_rent_price),
        warranty_amount: Number(formData.warranty_amount),
        broker_commission: Number(formData.broker_commission) || 0,
        
        // Día de pago
        payment_day: Number(formData.payment_day),
        monthly_payment_day: Number(formData.payment_day), // Alias para compatibilidad

        // ========== Información del corredor ==========
        broker_name: formData.broker_name || '',
        broker_rut: formData.broker_rut || '',

        // ========== Condiciones especiales ==========
        accepts_pets: Boolean(formData.allows_pets),
        allows_pets: Boolean(formData.allows_pets), // Alias para compatibilidad
        dicom_clause: Boolean(formData.dicom_clause),
        additional_conditions: formData.special_conditions_house || '',
        special_conditions_house: formData.special_conditions_house || '', // Alias

        // ========== Email de notificación oficial ==========
        notification_email: formData.notification_email || '',
        official_communication_email: formData.notification_email || '', // Alias

        // ========== Condiciones de pago ==========
        payment_conditions: formData.payment_conditions || '',
        payment_method: formData.payment_method || 'transferencia_bancaria',

        // ========== Datos bancarios ==========
        bank_name: formData.bank_name || '',
        account_type: formData.account_type || '',
        account_number: formData.account_number || '',
        account_holder_name: formData.account_holder_name || '',
        account_holder_rut: formData.account_holder_rut || '',

        // ========== Metadata del contrato ==========
        contract_type: 'arriendo', // rental
        contract_format: 'hybrid', // JSON + HTML
        contract_status: 'draft', // Hasta que n8n lo procese
        
        // ========== Characteristic IDs para n8n ==========
        contract_conditions_characteristic_id: (contractConditionsData as any).contract_conditions_characteristic_id || null,
        
        // ========== Timestamp ==========
        generated_at: new Date().toISOString(),
      };

      console.log('📤 Enviando al webhook de n8n...');
      console.log('🔗 URL del webhook:', import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL);
      console.log('📦 Payload completo:', webhookPayload);

      const contractWebhookUrl = import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL;

      if (!contractWebhookUrl) {
        console.error('❌ URL del webhook no configurada');
        throw new Error('URL del webhook no configurada');
      }

      console.log('🌐 Realizando petición fetch...');
      const webhookResponse = await fetch(contractWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      console.log('📡 Respuesta del webhook recibida. Status:', webhookResponse.status);

      if (!webhookResponse.ok) {
        let errorText = '';
        let errorDetails = {};
        
        try {
          // Intentar parsear como JSON primero
          const contentType = webhookResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorDetails = await webhookResponse.json();
            errorText = JSON.stringify(errorDetails, null, 2);
          } else {
            errorText = await webhookResponse.text();
          }
        } catch (parseError) {
          errorText = await webhookResponse.text();
        }
        
        console.error('❌ Error del webhook n8n. Status:', webhookResponse.status);
        console.error('❌ Error del webhook n8n. Response:', errorText);
        
        // Mensajes específicos según status code
        let userMessage = 'Error al generar el contrato en el servidor';
        
        if (webhookResponse.status === 400) {
          userMessage = 'Datos inválidos enviados al generador de contratos. Verifica todos los campos.';
        } else if (webhookResponse.status === 401 || webhookResponse.status === 403) {
          userMessage = 'No autorizado para generar contratos. Verifica la configuración del webhook.';
        } else if (webhookResponse.status === 404) {
          userMessage = 'Endpoint de generación de contratos no encontrado. Contacta al administrador.';
        } else if (webhookResponse.status === 500) {
          userMessage = 'Error interno en el servidor de generación de contratos. Intenta nuevamente.';
        } else if (webhookResponse.status === 503) {
          userMessage = 'Servicio de generación de contratos no disponible temporalmente. Intenta más tarde.';
        }
        
        throw new Error(`${userMessage} (HTTP ${webhookResponse.status})`);
      }

      const webhookResult = await webhookResponse.json();
      console.log('✅ Respuesta del webhook exitosa:', webhookResult);

      toast.success('Contrato generado y enviado exitosamente');

      // Cerrar modal y recargar datos
      setIsContractModalOpen(false);
      // Recargar datos de la propiedad si es necesario
      // fetchPropertyDetails();

    } catch (error: any) {
      // ✅ Usar función helper para formatear error
      formatErrorDetails(error, 'handleGenerateContract - Error al generar contrato');
      
      // Mostrar mensaje específico según el tipo de error
      let errorMessage = getUserFriendlyErrorMessage(error, 'Error al generar el contrato');
      
      // Si el error ya tiene un mensaje descriptivo (de mapFormDataToDatabase), usarlo directamente
      if (error?.message && (
        error.message.includes('obligatorio') ||
        error.message.includes('debe ser') ||
        error.message.includes('inválido') ||
        error.message.includes('HTTP')
      )) {
        errorMessage = error.message;
      } else if (error?.message?.includes('campos requeridos')) {
        errorMessage = 'Por favor completa todos los campos requeridos';
      } else if (error?.message?.includes('email')) {
        errorMessage = 'Por favor ingresa un correo electrónico válido';
      } else if (error?.message?.includes('propiedad')) {
        errorMessage = 'Error obteniendo datos de la propiedad';
      }

      toast.error(errorMessage);

      // Mostrar error detallado en el modal
      setError(error?.message || 'Error desconocido al generar el contrato');

      // ROLLBACK: Si se creó el registro del contrato pero falló algo después, mantenerlo
      // El registro ya está creado, pero n8n no lo procesó aún, así que queda en estado 'draft'
      // Esto es intencional para poder reintentar

    } finally {
      console.log('🔄 Finalizando proceso, cambiando isGenerating a false');
      setIsGenerating(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
        <p className="text-gray-600 mb-6">La propiedad que buscas no existe o no está disponible.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Volver a propiedades
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === property.owner_id;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          to="/portfolio" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al portafolio
        </Link>
      </div>

      <div className="space-y-6">
        {/* Photo Gallery */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {property.property_images && property.property_images.length > 0 ? (
            <div>
              {/* Main Photo */}
              <div className="h-96 relative">
                <img
                  src={property.property_images[selectedPhoto].image_url}
                  alt={`${property.address_street || ''} ${property.address_number || ''} - Foto ${selectedPhoto + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.warn('Error loading image:', property.property_images?.[selectedPhoto]?.image_url);
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                  {selectedPhoto + 1} / {property.property_images?.length || 0}
                </div>
              </div>

              {/* Photo Thumbnails */}
              {property.property_images && property.property_images.length > 1 && (
                <div className="p-4 border-t">
                  <div className="flex space-x-2 overflow-x-auto">
                    {property.property_images?.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          selectedPhoto === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.warn('Error loading thumbnail:', image.image_url);
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="64"%3E%3Crect fill="%23ddd" width="80" height="64"/%3E%3C/svg%3E';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-100">
              <Building className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Property Information Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.address_street} {property.address_number}
              </h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-1" />
                <span>{property.address_commune}, {property.address_region}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {formatPrice(property.price_clp)}
              </div>
              <div className="text-sm text-gray-500">
                {property.listing_type === 'arriendo' ? 'por mes' : 'precio total'}
              </div>
              {/* Botones de acción - solo visible para el dueño/admin */}
              {isOwner && (
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/property/edit/${property.id}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span className="mr-2">✏️</span>
                    Modificar Publicación
                  </Link>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2">📅</span>
                    Gestionar Disponibilidad
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Property Features Icons */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 py-4 border-y">
            <div className="text-center">
              <Bed className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
              <div className="text-sm text-gray-500">Dormitorios</div>
            </div>
            <div className="text-center">
              <Bath className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.bathrooms}</div>
              <div className="text-sm text-gray-500">Baños</div>
            </div>
            <div className="text-center">
              <Car className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.estacionamientos || 0}</div>
              <div className="text-sm text-gray-500">Estacionamientos</div>
            </div>
            <div className="text-center">
              <Square className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.metros_utiles || 'N/A'}</div>
              <div className="text-sm text-gray-500">m² Útiles</div>
            </div>
            <div className="text-center">
              <Square className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.metros_totales || 'N/A'}</div>
              <div className="text-sm text-gray-500">m² Totales</div>
            </div>
            <div className="text-center">
              <CalendarIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.ano_construccion || 'N/A'}</div>
              <div className="text-sm text-gray-500">Construcción</div>
            </div>
          </div>
        </div>

        {/* Sección: Link de Postulación Único */}
        {isOwner && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-md border-2 border-blue-200 p-6">
            <div className="flex items-center mb-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md mr-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Link de Postulación para Candidatos</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Comparte este enlace con los interesados que encuentres en portales externos para centralizar todas las postulaciones aquí.
                </p>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg border-2 border-gray-300 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Campo del Link (no editable) */}
                <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 border border-gray-300">
                  <p className="text-sm text-gray-900 font-mono break-all select-all">
                    {applicationLink}
                  </p>
                </div>

                {/* Botón Copiar Link */}
                <button
                  onClick={handleCopyLink}
                  className={`inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    isCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2" />
                      Copiar Link
                    </>
                  )}
                </button>
              </div>

              {/* Mensaje de confirmación adicional */}
              {isCopied && (
                <div className="mt-3 flex items-center text-green-700 text-sm animate-fade-in">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">El enlace se ha copiado al portapapeles exitosamente</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Métricas - Grid de 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Métrica 1: Postulaciones por Semana */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Postulaciones por Semana</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyApplications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {weeklyApplications[weeklyApplications.length - 1].count}
              </div>
              <div className="text-sm text-gray-500">Postulaciones esta semana</div>
            </div>
          </div>

          {/* Métrica 2: Visualizaciones por Semana */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visualizaciones por Semana</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {weeklyViews[weeklyViews.length - 1].count}
              </div>
              <div className="text-sm text-gray-500">Visualizaciones esta semana</div>
            </div>
          </div>

          {/* Métrica 3: Precio según Mercado */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Precio de Mercado</h3>
            
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Precio Actual</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatPrice(marketPriceData.currentPrice)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Promedio del Mercado</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(marketPriceData.marketAverage)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-gray-700">Diferencia</span>
                <span className="text-2xl font-bold text-green-600">
                  {marketPriceData.difference}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-800 text-center">
                {marketPriceData.recommendation}
              </p>
            </div>
          </div>

        </div>

        {/* Sección de Gestión de Postulaciones */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Postulaciones</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre del Postulante
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Postulación
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score de Riesgo
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {postulations.map((postulation) => (
                  <tr key={postulation.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {postulation.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{postulation.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(postulation.date).toLocaleDateString('es-CL', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(postulation.score)}`}>
                        {postulation.score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(postulation.status)}`}>
                        {postulation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(postulation)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                          title="Ver Detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                          title="Aprobar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                          title="Rechazar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer con resumen */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{postulations.length}</span> postulaciones
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Disponibilidad */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Seleccionar Disponibilidad de Visitas
            </h2>
            <div className="flex justify-center">
              <Calendar
                onClickDay={handleDateClick}
                tileClassName={({ date, view }) => {
                  // Solo aplica la clase si la fecha está en nuestro estado de fechas disponibles
                  if (view === 'month' && availableDates.find(d => d.getTime() === date.getTime())) {
                    return 'selected-date';
                  }
                  return null; // Devuelve null para todas las demás fechas, incluido el día de hoy
                }}
                minDate={new Date()} // No permite seleccionar fechas pasadas
                className="rounded-lg border-0 shadow-none"
              />
            </div>
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Cerrar
              </button>
              <div className="text-sm text-gray-600">
                {availableDates.length} fecha{availableDates.length !== 1 ? 's' : ''} seleccionada{availableDates.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Postulante - Dashboard de Decisión */}
      {isProfileModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            {/* Header Visual Rediseñado */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 px-8 py-10 rounded-t-2xl">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-6 right-6 text-white hover:text-gray-200 transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                {/* Avatar Grande */}
                <div className="h-28 w-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
                  <span className="text-blue-600 font-bold text-4xl">
                    {selectedProfile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                
                {/* Información Principal */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl font-bold text-white mb-3">{selectedProfile.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border-2 shadow-lg ${getStatusBadge(selectedProfile.status)}`}>
                      {selectedProfile.status}
                    </span>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg border-2 border-white/30 ${getScoreColor(selectedProfile.score)}`}>
                      📊 Score: {selectedProfile.score}
                    </span>
                  </div>
                  <p className="text-blue-100 mt-3 text-sm">
                    Postulación recibida el {new Date(selectedProfile.date).toLocaleDateString('es-CL', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del Dashboard */}
            <div className="p-8">
              
              {/* Grid de Información */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* Sección del Postulante con Íconos */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md border border-blue-100">
                  <div className="flex items-center mb-6 pb-4 border-b border-blue-200">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-2xl">👤</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 ml-4">Perfil del Postulante</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Email</label>
                          <p className="text-base text-gray-900 mt-1">{selectedProfile.profile.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Teléfono</label>
                          <p className="text-base text-gray-900 mt-1">{selectedProfile.profile.phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Renta Mensual</label>
                          <p className="text-lg font-bold text-emerald-600 mt-1">
                            {new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: 'CLP'
                            }).format(selectedProfile.profile.income)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Situación Laboral</label>
                          <p className="text-base text-gray-900 mt-1">{selectedProfile.profile.employment}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección del Aval con Íconos */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-md border border-green-100">
                  <div className="flex items-center mb-6 pb-4 border-b border-green-200">
                    <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-2xl">🛡️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 ml-4">Datos del Aval</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedProfile.guarantor ? (
                      <>
                        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <UserCheck className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Nombre del Aval</label>
                              <p className="text-base font-semibold text-gray-900 mt-1">{selectedProfile.guarantor.name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Email</label>
                              <p className="text-base text-gray-900 mt-1">{selectedProfile.guarantor.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            <div className="flex-1">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Renta Mensual</label>
                              <p className="text-lg font-bold text-emerald-600 mt-1">
                                {new Intl.NumberFormat('es-CL', {
                                  style: 'currency',
                                  currency: 'CLP'
                                }).format(selectedProfile.guarantor.income)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Esta postulación no tiene aval registrado</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tarjeta Destacada de Capacidad de Pago Total */}
                    <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-xl p-6 shadow-xl mt-6 border-4 border-blue-300 transform hover:scale-105 transition-transform">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center h-14 w-14 bg-white rounded-full mb-3 shadow-lg">
                          <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">💰 Capacidad de Pago Total</h4>
                        <p className="text-4xl font-black text-white mb-2">
                          {new Intl.NumberFormat('es-CL', {
                            style: 'currency',
                            currency: 'CLP'
                          }).format(selectedProfile.profile.income + (selectedProfile.guarantor?.income || 0))}
                        </p>
                        <p className="text-sm text-blue-100 font-medium">
                          {selectedProfile.guarantor ? 'Postulante + Aval Combinados' : 'Solo Postulante'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Panel de Acciones del Administrador */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 shadow-md border-2 border-gray-200">
                <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-300">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-2xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-4">Acciones del Administrador</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* Botón: Solicitar Informe Comercial */}
                  <button className="group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8" />
                      <span className="text-sm">Solicitar Informe</span>
                      <span className="text-xs opacity-90">Comercial</span>
                    </div>
                  </button>

                  {/* Botón: Solicitar Documentación */}
                  <button className="group relative bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-2">
                      <FileUp className="h-8 w-8" />
                      <span className="text-sm">Solicitar Documentación</span>
                      <span className="text-xs opacity-90">Respaldo</span>
                    </div>
                  </button>

                  {/* Botón: Enviar Documentos */}
                  <button className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-2">
                      <Send className="h-8 w-8" />
                      <span className="text-sm">Enviar Documentos</span>
                      <span className="text-xs opacity-90">Contrato/Otros</span>
                    </div>
                  </button>

                  {/* Botón: Aceptar Postulación */}
                  <button 
                    onClick={handleAcceptClick}
                    className="group relative bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Check className="h-8 w-8" />
                      <span className="text-sm">Aceptar Postulación</span>
                      <span className="text-xs opacity-90">Aprobar Candidato</span>
                    </div>
                  </button>

                  {/* Botón: Rechazar Postulación */}
                  <button className="group relative bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex flex-col items-center space-y-2">
                      <X className="h-8 w-8" />
                      <span className="text-sm">Rechazar Postulación</span>
                      <span className="text-xs opacity-90">Denegar Candidato</span>
                    </div>
                  </button>
                </div>

                <p className="text-xs text-gray-600 text-center mt-4 italic">
                  💡 Selecciona una acción para procesar esta postulación
                </p>
              </div>

              {/* Footer Simplificado */}
              <div className="flex justify-center items-center mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Condiciones de Contrato */}
      {isContractModalOpen && selectedProfile && property && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-8 rounded-t-2xl">
              <button
                onClick={() => setIsContractModalOpen(false)}
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
                
                {/* Campos Comunes (Siempre Visibles) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Fecha de Inicio del Contrato */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de Inicio del Contrato <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => handleContractFormChange('contract_start_date', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
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
                    {/* Fecha de Término Calculada */}
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

                {/* NUEVOS CAMPOS: Precio Final y Corredor */}
                <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💰</span>
                    Precio Final del Arriendo y Corredor
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Precio Final del Arriendo */}
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

                {/* Campos Condicionales para Casa o Departamento */}
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

                {/* Campos Condicionales para Bodega o Estacionamiento */}
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

                {/* Condiciones Especiales para Casa */}
                {(property.tipo_propiedad === 'Casa' || property.tipo_propiedad === 'Departamento' || !property.tipo_propiedad) && (
                  <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Building2 className="w-5 h-5 text-purple-600 mr-2" />
                      Condiciones Especiales para Casa
                    </h4>
                    <div className="bg-white rounded-lg p-4">
                      <textarea
                        value={formData.special_conditions_house}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          special_conditions_house: e.target.value
                        }))}
                        placeholder="Ej: Jardín compartido, uso de estacionamiento, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Cláusula DICOM - NUEVO */}
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

                {/* Sección: Condiciones de Pago */}
                <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">💰</span>
                    Condiciones de Pago
                  </h4>
                  
                  {/* Comisión de Corretaje */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Comisión de Corretaje (Opcional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.broker_commission || 0}
                      onChange={(e) => handleContractFormChange('broker_commission', parseFloat(e.target.value) || 0)}
                      placeholder="Ingrese el monto de la comisión"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Dejar en blanco si no aplica
                    </p>
                  </div>

                  {/* Modo de Pago del Arriendo */}
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

                  {/* Datos para Transferencia (Condicional) */}
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

                {/* Email de Notificación - NUEVO */}
                <div className="mt-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                    Email de Notificación
                  </h4>
                  <div className="bg-white rounded-lg p-4">
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-1 block">
                          Correo Electrónico para Notificación *
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
                      <p className="text-xs text-gray-600">
                        El contrato generado será enviado a esta dirección de correo electrónico.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setIsContractModalOpen(false)}
                  disabled={isSubmittingContract}
                  className="w-full sm:w-auto px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    console.log('🖱️ BOTÓN CLICKED - Estado del botón:', {
                      isGenerating,
                      selectedProfile: !!selectedProfile,
                      disabled: isGenerating || !selectedProfile
                    });
                    handleGenerateContract();
                  }}
                  disabled={isGenerating || !selectedProfile}
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
                      Generar y Enviar Contrato
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
      )}
    </div>
  );
};

