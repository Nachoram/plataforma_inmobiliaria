/**
 * PostulationAdminPanel.tsx
 * 
 * Componente dedicado para la gestión administrativa de postulaciones de propiedades.
 * 
 * RESPONSABILIDADES:
 * - Mostrar tabla de postulaciones con información clave (nombre, fecha, score, estado)
 * - Administrar cada postulación mediante modal de detalles
 * - Proveer acciones administrativas: Solicitar Informe Comercial, Solicitar Documentación, 
 *   Enviar Documentos, Aceptar Postulación (Generar Contrato)
 * - Integración con RentalContractConditionsForm para generación de contratos
 * 
 * VENTAJAS DE LA SEPARACIÓN:
 * - Facilita el desarrollo de features y la futura integración de roles/permisos
 * - Permite escalar el panel de administración sin impactar el core inmobiliario
 * - Reduce el acoplamiento y acelera la evolución de UI/UX
 * - Mejora testabilidad y mantenibilidad del código
 * 
 * @module PostulationAdminPanel
 * @since 2025-10-28
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Mail, 
  Phone, 
  DollarSign, 
  Briefcase, 
  FileText, 
  UserCheck, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  X,
  RotateCcw,
  Edit,
  Shield
} from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { RentalContractConditionsForm } from '../contracts/RentalContractConditionsForm';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

/**
 * Perfil del postulante con información básica
 */
interface PostulantProfile {
  email: string;
  phone: string;
  income: number;
  employment: string;
}

/**
 * Información del aval (garante)
 */
interface GuarantorInfo {
  name: string;
  email: string;
  phone: string;
  income: number;
}

/**
 * Datos completos de una postulación con información extendida
 */
interface Postulation {
  id: number; // ID numérico para display en tabla
  applicationId: string; // UUID real de la aplicación
  propertyId: string; // UUID de la propiedad
  name: string;
  date: string;
  score: number;
  status: 'En Revisión' | 'Aprobado' | 'Rechazado' | 'Info Solicitada' | 'Con Contrato Firmado' | 'Anulada' | 'Modificada';
  profile: PostulantProfile;
  guarantor: GuarantorInfo | null;
  // Información adicional para gestión avanzada
  hasContractConditions: boolean; // Si existe rental_contract_conditions
  hasContract: boolean; // Si existe rental_contracts
  contractSigned: boolean; // Si el contrato está firmado
  lastModified?: string; // Última modificación
  modificationCount?: number; // Número de modificaciones
  auditLogCount?: number; // Número de entradas en auditoría
}

/**
 * Datos para modificación de aceptación
 */
interface AcceptanceModificationData {
  comments: string;
  adjustedScore?: number;
  additionalDocuments?: string;
  specialConditions?: string;
}

/**
 * Datos para anular una postulación
 */
interface CancellationData {
  reason: string;
  comments: string;
  notifyApplicant: boolean;
}

/**
 * Información de auditoría para mostrar en UI
 */
interface AuditLogEntry {
  id: string;
  actionType: string;
  previousStatus: string;
  newStatus: string;
  actionDetails: any;
  createdAt: string;
  userId: string;
}

/**
 * Información de modificación para mostrar en historial
 */
interface ModificationEntry {
  id: string;
  comments: string;
  adjustedScore?: number;
  additionalDocuments?: string;
  specialConditions?: string;
  modifiedAt: string;
  version: number;
}

/**
 * Props del componente principal
 */
interface PostulationAdminPanelProps {
  propertyId: string;
  property: Property; // Necesario para generar el contrato
}

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

/**
 * Panel de administración de postulaciones
 * 
 * Componente que encapsula toda la funcionalidad de gestión de postulaciones
 * para propietarios/administradores de propiedades.
 * 
 * @param {PostulationAdminPanelProps} props - Props del componente
 * @returns {JSX.Element} Panel de administración de postulaciones
 */
export const PostulationAdminPanel: React.FC<PostulationAdminPanelProps> = ({
  propertyId,
  property
}) => {
  // ========================================================================
  // HOOKS
  // ========================================================================

  const navigate = useNavigate();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [postulations, setPostulations] = useState<Postulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Postulation | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isModifyAcceptanceModalOpen, setIsModifyAcceptanceModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isAcceptingApplication, setIsAcceptingApplication] = useState(false);
  const [isUndoingAcceptance, setIsUndoingAcceptance] = useState(false);
  const [isCancellingApplication, setIsCancellingApplication] = useState(false);
  const [modificationData, setModificationData] = useState<AcceptanceModificationData>({
    comments: '',
    adjustedScore: undefined,
    additionalDocuments: '',
    specialConditions: '',
  });
  const [cancellationData, setCancellationData] = useState<CancellationData>({
    reason: '',
    comments: '',
    notifyApplicant: true,
  });
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [modificationHistory, setModificationHistory] = useState<ModificationEntry[]>([]);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (propertyId) {
      fetchPostulations();
    }
  }, [propertyId]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  /**
   * Obtiene las postulaciones de la propiedad desde Supabase
   * Incluye información del postulante, aval y características
   */
  const fetchPostulations = async () => {
    console.log('🔍 [PostulationAdminPanel] Cargando postulaciones para property:', propertyId);

    // Validación: prevenir consultas con ID undefined/null
    if (!propertyId) {
      console.error('❌ [PostulationAdminPanel] Property ID es undefined/null, no se puede cargar postulaciones');
      toast.error('Error: ID de propiedad no válido');
      setLoading(false);
      return;
    }

    try {
      // Primera consulta: obtener aplicaciones básicas
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          property_id,
          applicant_id,
          guarantor_id,
          status,
          created_at,
          updated_at,
          message,
          application_characteristic_id,
          guarantor_characteristic_id
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        formatErrorDetails(applicationsError, 'fetchPostulations - Error cargando aplicaciones');
        const userMessage = getUserFriendlyErrorMessage(applicationsError, 'Error al cargar las postulaciones');
        toast.error(userMessage);
        setLoading(false);
        return;
      }

      // Segunda consulta: obtener perfiles de manera segura
      const applicantIds = applicationsData?.map(app => app.applicant_id).filter(Boolean) || [];
      const guarantorIds = applicationsData?.map(app => app.guarantor_id).filter(Boolean) || [];

      let profilesMap = new Map();
      let guarantorsMap = new Map();

      if (applicantIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone,
            profession
          `)
          .in('id', applicantIds);

        if (!profilesError && profilesData) {
          profilesMap = new Map(profilesData.map(p => [p.id, p]));
        }
      }

      if (guarantorIds.length > 0) {
        const { data: guarantorsData, error: guarantorsError } = await supabase
          .from('guarantors')
          .select(`
            id,
            first_name,
            rut,
            contact_email,
            contact_phone,
            monthly_income
          `)
          .in('id', guarantorIds);

        if (!guarantorsError && guarantorsData) {
          guarantorsMap = new Map(guarantorsData.map(g => [g.id, g]));
        }
      }

      console.log('✅ [PostulationAdminPanel] Aplicaciones cargadas:', applicationsData?.length || 0);

      // Obtener información adicional para cada postulación
      const postulationsWithDetails = await Promise.all((applicationsData || []).map(async (app: any, index: number) => {
        // Obtener perfil del postulante desde el mapa
        const profile = profilesMap.get(app.applicant_id);
        const guarantor = guarantorsMap.get(app.guarantor_id);

        // Verificar si existe rental_contract_conditions
        const { data: contractConditions } = await supabase
          .from('rental_contract_conditions')
          .select('id')
          .eq('application_id', app.id)
          .limit(1);

        // Verificar si existe rental_contracts
        const { data: contract } = await supabase
          .from('rental_contracts')
          .select('id, status')
          .eq('application_id', app.id)
          .maybeSingle();

        // Obtener conteo de modificaciones
        const { count: modificationCount } = await supabase
          .from('application_modifications')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', app.id);

        // Obtener conteo de auditoría
        const { count: auditCount } = await supabase
          .from('application_audit_log')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', app.id);

        return {
          id: index + 1, // ID numérico para la tabla (display)
          applicationId: app.id, // ID REAL de la aplicación (UUID)
          propertyId: app.property_id, // ID de la propiedad
          name: profile
            ? `${profile.first_name} ${profile.paternal_last_name} ${profile.maternal_last_name || ''}`.trim()
            : 'Sin nombre',
          date: new Date(app.created_at).toISOString().split('T')[0],
          score: 750, // TODO: Calcular score real basado en datos del perfil
          status: mapApplicationStatus(app.status),
          profile: {
            email: profile?.email || 'Sin email',
            phone: profile?.phone || 'Sin teléfono',
            income: profile?.monthly_income_clp || profile?.monthly_income || 0,
            employment: profile?.job_seniority || profile?.profession || 'N/A'
          },
          guarantor: guarantor ? {
            name: guarantor.first_name || 'Sin nombre',
            email: guarantor.contact_email || 'N/A',
            phone: guarantor.contact_phone || 'N/A',
            income: guarantor.monthly_income || 0
          } : null,
          hasContractConditions: !!contractConditions,
          hasContract: !!contract,
          contractSigned: contract?.status === 'signed' || false,
          lastModified: app.updated_at,
          modificationCount: modificationCount || 0,
          auditLogCount: auditCount || 0
        };
      }));

      console.log('📊 [PostulationAdminPanel] Postulaciones formateadas:', postulationsWithDetails);
      setPostulations(postulationsWithDetails);
    } catch (error: any) {
      formatErrorDetails(error, 'fetchPostulations - Error en catch');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error inesperado al cargar postulaciones');
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mapea el status de la base de datos al formato de display
   */
  const mapApplicationStatus = (dbStatus: string): Postulation['status'] => {
    switch (dbStatus) {
      case 'pendiente': return 'En Revisión';
      case 'aprobada': return 'Aprobado';
      case 'rechazada': return 'Rechazado';
      case 'info_solicitada': return 'Info Solicitada';
      case 'con_contrato_firmado': return 'Con Contrato Firmado';
      case 'anulada': return 'Anulada';
      case 'modificada': return 'Modificada';
      default: return 'En Revisión';
    }
  };

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  /**
   * Obtiene el color del badge según el score de riesgo
   * @param {number} score - Score de riesgo del postulante
   * @returns {string} Clases CSS para el color del badge
   */
  const getScoreColor = (score: number): string => {
    if (score > 750) return 'text-green-600 bg-green-50';
    if (score >= 650) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  /**
   * Obtiene el estilo del badge según el estado de la postulación
   * @param {string} status - Estado de la postulación
   * @returns {string} Clases CSS para el estilo del badge
   */
  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Anulada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Con Contrato Firmado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Modificada':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Info Solicitada':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'En Revisión':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // ========================================================================
  // AUDIT & LOGGING FUNCTIONS
  // ========================================================================

  /**
   * Registra una acción en el sistema de auditoría
   */
  const logAuditAction = async (
    actionType: string,
    previousStatus: string,
    newStatus: string,
    actionDetails: any = {},
    notes: string = ''
  ) => {
    if (!selectedProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase.rpc('log_application_audit', {
        p_application_id: selectedProfile.applicationId,
        p_property_id: selectedProfile.propertyId,
        p_user_id: user.id,
        p_action_type: actionType,
        p_previous_status: previousStatus,
        p_new_status: newStatus,
        p_action_details: actionDetails,
        p_notes: notes
      });

      if (error) {
        console.error('❌ Error al registrar auditoría:', error);
        // No lanzamos error para no interrumpir el flujo principal
      }
    } catch (error) {
      console.error('❌ Error en logAuditAction:', error);
    }
  };

  /**
   * Carga el historial de auditoría para la postulación seleccionada
   */
  const loadAuditHistory = async () => {
    if (!selectedProfile) return;

    try {
      const { data, error } = await supabase
        .from('application_audit_log')
        .select('*')
        .eq('application_id', selectedProfile.applicationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando historial de auditoría:', error);
        return;
      }

      setAuditLog(data || []);
    } catch (error) {
      console.error('Error en loadAuditHistory:', error);
    }
  };

  /**
   * Carga el historial de modificaciones para la postulación seleccionada
   */
  const loadModificationHistory = async () => {
    if (!selectedProfile) return;

    try {
      const { data, error } = await supabase.rpc('get_application_modifications', {
        p_application_id: selectedProfile.applicationId
      });

      if (error) {
        console.error('Error cargando historial de modificaciones:', error);
        return;
      }

      setModificationHistory(data || []);
    } catch (error) {
      console.error('Error en loadModificationHistory:', error);
    }
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  /**
   * Abre el modal de detalles de una postulación
   * @param {Postulation} postulation - Postulación seleccionada
   */
  const handleViewDetails = async (postulation: Postulation) => {
    console.log('👁️ [PostulationAdminPanel] Abriendo detalles de postulación:', postulation.id);
    setSelectedProfile(postulation);
    setIsProfileModalOpen(true);

    // Cargar historial de auditoría y modificaciones
    await loadAuditHistory();
    await loadModificationHistory();
  };

  /**
   * Maneja el click en "Aceptar Postulación"
   * Solo disponible si status = 'En Revisión'
   */
  const handleAcceptClick = async () => {
    if (!selectedProfile) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    // Validaciones de reglas de negocio
    if (selectedProfile.status !== 'En Revisión') {
      toast.error('Solo se pueden aceptar postulaciones en estado "En Revisión"');
      return;
    }

    if (selectedProfile.hasContract) {
      toast.error('Esta postulación ya tiene un contrato generado. No se puede aceptar nuevamente.');
      return;
    }

    // Validación adicional: verificar que la aplicación aún existe
    console.log('🔍 Verificando que la aplicación existe antes de generar contrato...');
    const { data: appCheck, error: appCheckError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', selectedProfile.applicationId)
      .single();

    if (appCheckError || !appCheck) {
      console.error('❌ La aplicación ya no existe:', selectedProfile.applicationId);
      toast.error('Esta postulación ya no existe en el sistema. Por favor, recarga la página.');
      // Recargar postulaciones para actualizar la vista
      fetchPostulations();
      return;
    }

    console.log('✅ [PostulationAdminPanel] Iniciando proceso de aceptación de postulación');
    console.log('👤 Perfil seleccionado:', selectedProfile);

    // Registrar auditoría
    await logAuditAction(
      'approve',
      'pendiente',
      'aprobada',
      { action: 'accept_application' },
      'Inicio del proceso de aceptación de postulación'
    );

    // Actualizar estado de la aplicación
    setIsAcceptingApplication(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'aprobada',
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedProfile.applicationId);

      if (error) {
        formatErrorDetails(error, 'handleAcceptClick - Error actualizando estado');
        const userMessage = getUserFriendlyErrorMessage(error, 'Error al aceptar la postulación');
        toast.error(userMessage);
        return;
      }

      toast.success('Postulación aceptada correctamente. Ahora puede generar las condiciones del contrato.');

      // Cerrar modal de perfil y abrir modal de contrato
      setIsProfileModalOpen(false);
      setIsContractModalOpen(true);

      // Recargar postulaciones para reflejar cambios
      fetchPostulations();

    } catch (error: any) {
      formatErrorDetails(error, 'handleAcceptClick - Error en catch');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error inesperado al aceptar postulación');
      toast.error(userMessage);
    } finally {
      setIsAcceptingApplication(false);
    }
  };

  /**
   * Maneja el click en "Solicitar Informe Comercial"
   * TODO: Implementar integración con servicio de informes comerciales
   */
  const handleRequestCommercialReport = () => {
    console.log('📄 [PostulationAdminPanel] Solicitando informe comercial');
    toast.success('Funcionalidad en desarrollo: Solicitar Informe Comercial');
  };

  /**
   * Maneja el click en "Solicitar Documentación"
   * TODO: Implementar sistema de solicitud de documentos
   */
  const handleRequestDocumentation = () => {
    console.log('📋 [PostulationAdminPanel] Solicitando documentación');
    toast.success('Funcionalidad en desarrollo: Solicitar Documentación');
  };

  /**
   * Maneja el click en "Enviar Documentos"
   * TODO: Implementar sistema de envío de documentos
   */
  const handleSendDocuments = () => {
    console.log('📤 [PostulationAdminPanel] Enviando documentos');
    toast.success('Funcionalidad en desarrollo: Enviar Documentos');
  };

  /**
   * Callback ejecutado cuando el contrato se genera exitosamente
   */
  const handleContractSuccess = () => {
    console.log('✅ [PostulationAdminPanel] Contrato generado con éxito');
    setIsContractModalOpen(false);
    setSelectedProfile(null);
    // Recargar las postulaciones para reflejar cambios
    fetchPostulations();
  };

  // ========================================================================
  // POST-ACCEPTANCE MANAGEMENT HANDLERS
  // ========================================================================

  /**
   * Maneja el click en "Deshacer Aceptación"
   * Revierte el estado de la postulación de "Aprobado" a "En Revisión"
   */
  const handleUndoAcceptance = async () => {
    if (!selectedProfile) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    // Confirmación del usuario
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas deshacer la aceptación de esta postulación? ' +
      'Esto revertirá el estado a "En Revisión" y puede requerir regenerar el contrato.'
    );

    if (!confirmed) return;

    console.log('🔄 [PostulationAdminPanel] Deshaciendo aceptación:', selectedProfile.applicationId);
    setIsUndoingAcceptance(true);

    try {
      // TODO: Validar si existe un contrato asociado y manejarlo apropiadamente
      
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'pendiente',
          // TODO: Agregar campos de auditoría (undo_date, undo_by, undo_reason)
        })
        .eq('id', selectedProfile.applicationId);

      if (error) {
        formatErrorDetails(error, 'handleUndoAcceptance - Error al actualizar estado');
        const userMessage = getUserFriendlyErrorMessage(error, 'Error al deshacer la aceptación');
        toast.error(userMessage);
        return;
      }

      console.log('✅ [PostulationAdminPanel] Aceptación deshecha exitosamente');
      toast.success('Aceptación deshecha correctamente. La postulación vuelve a estar en revisión.');

      // Actualizar el perfil seleccionado localmente
      setSelectedProfile({
        ...selectedProfile,
        status: 'En Revisión'
      });

      // Recargar todas las postulaciones
      fetchPostulations();

      // TODO: Enviar notificación al postulante sobre la reversión
      // TODO: Registrar en log de auditoría
      
    } catch (error: any) {
      formatErrorDetails(error, 'handleUndoAcceptance - Error en catch');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error inesperado al deshacer aceptación');
      toast.error(userMessage);
    } finally {
      setIsUndoingAcceptance(false);
    }
  };

  /**
   * Maneja el click en "Modificar Aceptación"
   * Abre el modal para editar datos asociados a la aceptación
   */
  const handleModifyAcceptance = () => {
    if (!selectedProfile) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    console.log('✏️ [PostulationAdminPanel] Abriendo modal de modificación de aceptación');
    
    // TODO: Cargar datos existentes de modificación desde la BD si existen
    
    setIsModifyAcceptanceModalOpen(true);
  };

  /**
   * Guarda las modificaciones de la aceptación
   */
  const handleSaveModification = async () => {
    if (!selectedProfile) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    // Validaciones de reglas de negocio
    if (selectedProfile.status !== 'En Revisión' && selectedProfile.status !== 'Aprobado') {
      toast.error('Solo se pueden modificar postulaciones en estado "En Revisión" o "Aprobado"');
      return;
    }

    if (selectedProfile.contractSigned) {
      toast.error('No se pueden modificar postulaciones con contrato firmado');
      return;
    }

    console.log('💾 [PostulationAdminPanel] Guardando modificaciones de aceptación:', modificationData);

    // Validaciones básicas
    if (!modificationData.comments.trim()) {
      toast.error('Debes agregar al menos un comentario');
      return;
    }

    if (modificationData.adjustedScore && (modificationData.adjustedScore < 300 || modificationData.adjustedScore > 850)) {
      toast.error('El score ajustado debe estar entre 300 y 850');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Registrar modificación en la nueva tabla
      const { error: modError } = await supabase.rpc('log_application_modification', {
        p_application_id: selectedProfile.applicationId,
        p_property_id: selectedProfile.propertyId,
        p_modified_by: user.id,
        p_comments: modificationData.comments,
        p_adjusted_score: modificationData.adjustedScore,
        p_additional_documents: modificationData.additionalDocuments,
        p_special_conditions: modificationData.specialConditions,
        p_modification_reason: 'Modificación administrativa de postulación'
      });

      if (modError) {
        formatErrorDetails(modError, 'handleSaveModification - Error guardando modificación');
        const userMessage = getUserFriendlyErrorMessage(modError, 'Error al guardar las modificaciones');
        toast.error(userMessage);
        return;
      }

      // Registrar en auditoría
      await logAuditAction(
        'modify_acceptance',
        selectedProfile.status === 'Aprobado' ? 'aprobada' : 'pendiente',
        'modificada',
        {
          comments: modificationData.comments,
          adjusted_score: modificationData.adjustedScore,
          additional_documents: modificationData.additionalDocuments,
          special_conditions: modificationData.specialConditions
        },
        'Modificación administrativa de términos de aceptación'
      );

      console.log('✅ [PostulationAdminPanel] Modificaciones guardadas exitosamente');
      toast.success('Modificaciones guardadas correctamente');

      // Cerrar modal y limpiar datos
      setIsModifyAcceptanceModalOpen(false);
      setModificationData({
        comments: '',
        adjustedScore: undefined,
        additionalDocuments: '',
        specialConditions: '',
      });

      // Recargar postulaciones e historial
      fetchPostulations();
      await loadModificationHistory();
      await loadAuditHistory();

    } catch (error: any) {
      formatErrorDetails(error, 'handleSaveModification - Error en catch');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error inesperado al guardar modificaciones');
      toast.error(userMessage);
    }
  };

  /**
   * Cierra el modal de modificación sin guardar
   */
  const handleCancelModification = () => {
    const hasChanges = modificationData.comments.trim() ||
                      modificationData.adjustedScore ||
                      modificationData.additionalDocuments?.trim() ||
                      modificationData.specialConditions?.trim();

    if (hasChanges) {
      const confirmed = window.confirm('¿Deseas cerrar sin guardar los cambios?');
      if (!confirmed) return;
    }

    setIsModifyAcceptanceModalOpen(false);
    setModificationData({
      comments: '',
      adjustedScore: undefined,
      additionalDocuments: '',
      specialConditions: '',
    });
  };

  // ========================================================================
  // CANCELLATION MANAGEMENT HANDLERS
  // ========================================================================

  /**
   * Maneja el click en "Anular Postulación"
   */
  const handleCancelApplication = () => {
    if (!selectedProfile) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    // Validaciones de reglas de negocio
    if (selectedProfile.status !== 'Aprobado') {
      toast.error('Solo se pueden anular postulaciones en estado "Aprobado"');
      return;
    }

    if (selectedProfile.contractSigned) {
      toast.error('No se pueden anular postulaciones con contrato firmado. Debe cancelar el contrato primero.');
      return;
    }

    console.log('🚫 [PostulationAdminPanel] Abriendo modal de anulación');
    setIsCancellationModalOpen(true);
  };

  /**
   * Confirma y ejecuta la anulación de la postulación
   */
  const handleConfirmCancellation = async () => {
    if (!selectedProfile) {
      toast.error('No hay postulación seleccionada');
      return;
    }

    // Validaciones de datos de anulación
    if (!cancellationData.reason.trim()) {
      toast.error('Debes especificar el motivo de la anulación');
      return;
    }

    if (!cancellationData.comments.trim()) {
      toast.error('Debes agregar comentarios explicando la anulación');
      return;
    }

    console.log('🚫 [PostulationAdminPanel] Ejecutando anulación:', cancellationData);

    setIsCancellingApplication(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Actualizar estado de la aplicación a 'anulada'
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'anulada',
          updated_at: new Date().toISOString(),
          internal_notes: `ANULADA: ${cancellationData.reason} - ${cancellationData.comments}`
        })
        .eq('id', selectedProfile.applicationId);

      if (updateError) {
        formatErrorDetails(updateError, 'handleConfirmCancellation - Error anulando aplicación');
        const userMessage = getUserFriendlyErrorMessage(updateError, 'Error al anular la postulación');
        toast.error(userMessage);
        return;
      }

      // Si existe rental_contract_conditions, marcar como inactiva (no eliminar)
      if (selectedProfile.hasContractConditions) {
        const { error: conditionsError } = await supabase
          .from('rental_contract_conditions')
          .update({
            special_conditions_house: `CONTRATO ANULADO: ${cancellationData.reason} - ${cancellationData.comments}`,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', selectedProfile.applicationId);

        if (conditionsError) {
          console.warn('⚠️ Error actualizando condiciones de contrato:', conditionsError);
          // No fallar la operación principal por esto
        }
      }

      // Si existe rental_contracts, actualizar estado
      if (selectedProfile.hasContract) {
        const { error: contractError } = await supabase
          .from('rental_contracts')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('application_id', selectedProfile.applicationId);

        if (contractError) {
          console.warn('⚠️ Error actualizando contrato:', contractError);
          // No fallar la operación principal por esto
        }
      }

      // Registrar en auditoría
      await logAuditAction(
        'cancel_contract',
        'aprobada',
        'anulada',
        {
          reason: cancellationData.reason,
          comments: cancellationData.comments,
          notify_applicant: cancellationData.notifyApplicant
        },
        `Anulación de postulación: ${cancellationData.reason}`
      );

      console.log('✅ [PostulationAdminPanel] Postulación anulada exitosamente');
      toast.success('Postulación anulada correctamente');

      // Cerrar modales y limpiar datos
      setIsCancellationModalOpen(false);
      setIsProfileModalOpen(false);
      setCancellationData({
        reason: '',
        comments: '',
        notifyApplicant: true,
      });
      setSelectedProfile(null);

      // Recargar postulaciones
      fetchPostulations();

      // TODO: Enviar notificación al postulante si notifyApplicant es true

    } catch (error: any) {
      formatErrorDetails(error, 'handleConfirmCancellation - Error en catch');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error inesperado al anular postulación');
      toast.error(userMessage);
    } finally {
      setIsCancellingApplication(false);
    }
  };

  /**
   * Cierra el modal de anulación sin guardar
   */
  const handleCancelCancellation = () => {
    const hasData = cancellationData.reason.trim() || cancellationData.comments.trim();

    if (hasData) {
      const confirmed = window.confirm('¿Deseas cerrar sin completar la anulación?');
      if (!confirmed) return;
    }

    setIsCancellationModalOpen(false);
    setCancellationData({
      reason: '',
      comments: '',
      notifyApplicant: true,
    });
  };

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  /**
   * Renderiza el estado de carga
   */
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Postulaciones</h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  /**
   * Renderiza el mensaje cuando no hay postulaciones
   */
  if (postulations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Postulaciones</h2>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay postulaciones</h3>
          <p className="text-gray-500">
            Aún no hay postulantes para esta propiedad. Las postulaciones aparecerán aquí cuando los usuarios se postulen.
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <>
      {/* Sección de Gestión de Postulaciones */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Postulaciones</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra las solicitudes de arrendamiento para esta propiedad
          </p>
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
                    <button
                      onClick={() => navigate(`/postulation/${postulation.applicationId}/admin`)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      title="Administrar Postulación"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Administrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer con resumen */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{postulations.length}</span> postulación{postulations.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Postulante - Dashboard de Decisión */}
      {isProfileModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            {/* Header Visual */}
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
                
                {/* Sección del Postulante */}
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

                {/* Sección del Aval */}
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
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(selectedProfile.status)}`}>
                      {selectedProfile.status}
                    </span>
                  </div>
                </div>

                {/* Información del estado actual */}
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Estado Actual</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedProfile.hasContractConditions && '✓ Condiciones de contrato generadas'}
                        {selectedProfile.hasContract && ' ✓ Contrato creado'}
                        {selectedProfile.contractSigned && ' ✓ Contrato firmado'}
                        {(selectedProfile.modificationCount || 0) > 0 && ` ✓ ${selectedProfile.modificationCount} modificaciones`}
                        {(selectedProfile.auditLogCount || 0) > 0 && ` ✓ ${selectedProfile.auditLogCount} acciones auditadas`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {selectedProfile.lastModified && `Última modificación: ${new Date(selectedProfile.lastModified).toLocaleDateString('es-CL')}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Botón: Aceptar Postulación */}
                  <button
                    onClick={handleAcceptClick}
                    disabled={selectedProfile.status !== 'En Revisión' || selectedProfile.hasContract || isAcceptingApplication}
                    className={`group relative font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform ${
                      selectedProfile.status === 'En Revisión' && !selectedProfile.hasContract && !isAcceptingApplication
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-xl hover:from-green-700 hover:to-green-800 hover:-translate-y-1'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      selectedProfile.status !== 'En Revisión'
                        ? 'Solo disponible para postulaciones en revisión'
                        : selectedProfile.hasContract
                        ? 'Ya existe un contrato para esta postulación'
                        : 'Aceptar postulación y generar condiciones de contrato'
                    }
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {isAcceptingApplication ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="h-8 w-8" />
                      )}
                      <span className="text-sm">Aceptar Postulación</span>
                      <span className="text-xs opacity-90">
                        {selectedProfile.status !== 'En Revisión'
                          ? 'No disponible'
                          : selectedProfile.hasContract
                          ? 'Contrato existente'
                          : 'Generar Contrato'
                        }
                      </span>
                    </div>
                  </button>

                  {/* Botón: Modificar Aceptación */}
                  <button
                    onClick={handleModifyAcceptance}
                    disabled={(selectedProfile.status !== 'En Revisión' && selectedProfile.status !== 'Aprobado') || selectedProfile.contractSigned}
                    className={`group relative font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform ${
                      (selectedProfile.status === 'En Revisión' || selectedProfile.status === 'Aprobado') && !selectedProfile.contractSigned
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-1'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      selectedProfile.contractSigned
                        ? 'No se puede modificar con contrato firmado'
                        : (selectedProfile.status !== 'En Revisión' && selectedProfile.status !== 'Aprobado')
                        ? 'Solo disponible para postulaciones en revisión o aceptadas'
                        : 'Modificar términos de la aceptación'
                    }
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Edit className="h-8 w-8" />
                      <span className="text-sm">Modificar Aceptación</span>
                      <span className="text-xs opacity-90">
                        {selectedProfile.contractSigned
                          ? 'Contrato firmado'
                          : (selectedProfile.status !== 'En Revisión' && selectedProfile.status !== 'Aprobado')
                          ? 'No disponible'
                          : 'Editar términos'
                        }
                      </span>
                    </div>
                  </button>

                  {/* Botón: Anular Postulación */}
                  <button
                    onClick={handleCancelApplication}
                    disabled={selectedProfile.status !== 'Aprobado' || selectedProfile.contractSigned}
                    className={`group relative font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform ${
                      selectedProfile.status === 'Aprobado' && !selectedProfile.contractSigned
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-xl hover:from-red-700 hover:to-red-800 hover:-translate-y-1'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      selectedProfile.contractSigned
                        ? 'No se puede anular con contrato firmado'
                        : selectedProfile.status !== 'Aprobado'
                        ? 'Solo disponible para postulaciones aceptadas'
                        : 'Anular postulación con motivo obligatorio'
                    }
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <X className="h-8 w-8" />
                      <span className="text-sm">Anular Postulación</span>
                      <span className="text-xs opacity-90">
                        {selectedProfile.contractSigned
                          ? 'Contrato firmado'
                          : selectedProfile.status !== 'Aprobado'
                          ? 'No disponible'
                          : 'Requiere motivo'
                        }
                      </span>
                    </div>
                  </button>
                </div>

                {/* Acciones adicionales (siempre disponibles) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-300">
                  {/* Botón: Solicitar Informe Comercial */}
                  <button
                    onClick={handleRequestCommercialReport}
                    className="group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <FileText className="h-6 w-6" />
                      <span className="text-xs">Informe Comercial</span>
                    </div>
                  </button>

                  {/* Botón: Solicitar Documentación */}
                  <button
                    onClick={handleRequestDocumentation}
                    className="group relative bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Copy className="h-6 w-6" />
                      <span className="text-xs">Documentación</span>
                    </div>
                  </button>

                  {/* Botón: Enviar Documentos */}
                  <button
                    onClick={handleSendDocuments}
                    className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <Mail className="h-6 w-6" />
                      <span className="text-xs">Enviar Docs</span>
                    </div>
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                  <p className="text-xs text-blue-800">
                    💡 Las acciones principales respetan reglas de negocio estrictas.
                    Los botones se deshabilitan automáticamente cuando no son aplicables.
                  </p>
                </div>
              </div>

              {/* ========================================================================
                  SECCIÓN: ADMINISTRAR ACEPTACIÓN
                  
                  Esta sección se muestra SOLO cuando la postulación ha sido aceptada (status: 'Aprobado')
                  
                  FUNCIONALIDADES:
                  - Deshacer Aceptación: Revierte el estado a "En Revisión"
                  - Modificar Aceptación: Permite editar datos asociados a la decisión
                  
                  TODO: Agregar botones futuros:
                  - [ ] "Ver Contrato Generado" - Link directo al contrato PDF
                  - [ ] "Reenviar Contrato" - Reenvía el contrato al postulante
                  - [ ] "Agregar Anexo" - Permite agregar anexos al contrato
                  - [ ] "Actualizar Términos" - Modifica términos específicos del contrato
                  - [ ] "Solicitar Firma Digital" - Integración con firma electrónica
                  - [ ] "Programar Entrega de Llaves" - Calendario de entrega
                  - [ ] "Generar Checklist de Ingreso" - Lista de verificación
                  - [ ] "Registrar Pago de Garantía" - Control de depósitos
                  - [ ] "Enviar Bienvenida" - Email de bienvenida al nuevo arrendatario
                  - [ ] "Marcar como Contrato Firmado" - Actualiza estado final
                  
                  PERMISOS FUTUROS:
                  - Solo propietarios y administradores autorizados
                  - Log de auditoría de todas las acciones
                  - Notificaciones automáticas de cambios
                  ======================================================================== */}
              {selectedProfile.status === 'Aprobado' && (
                <div className="mt-6 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-xl p-6 shadow-lg border-2 border-green-300">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-green-400">
                    <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-2xl font-bold text-gray-900">ADMINISTRAR ACEPTACIÓN</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Gestiona la postulación aceptada: reversa la decisión o modifica los términos
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-full shadow-md">
                        ✓ ACEPTADA
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Botón: Deshacer Aceptación */}
                    <button
                      onClick={handleUndoAcceptance}
                      disabled={isUndoingAcceptance}
                      className="group relative bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-6 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <div className="flex flex-col items-center space-y-3">
                        {isUndoingAcceptance ? (
                          <>
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                            <span className="text-base">Procesando...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-10 w-10" />
                            <div className="text-center">
                              <span className="text-base block">Deshacer Aceptación</span>
                              <span className="text-xs opacity-90 block mt-1">Revierte a "En Revisión"</span>
                            </div>
                          </>
                        )}
                      </div>
                    </button>

                    {/* Botón: Modificar Aceptación */}
                    <button
                      onClick={handleModifyAcceptance}
                      className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-6 px-6 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-1"
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <Edit className="h-10 w-10" />
                        <div className="text-center">
                          <span className="text-base block">Modificar Aceptación</span>
                          <span className="text-xs opacity-90 block mt-1">Editar términos y comentarios</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-700">
                      <strong>ℹ️ Importante:</strong> Deshacer la aceptación revertirá el estado y puede requerir regenerar el contrato. 
                      Modificar la aceptación te permite ajustar términos sin cambiar el estado principal.
                    </p>
                  </div>

                  {/* TODO: Agregar más acciones post-aceptación aquí
                      - Ver/Descargar contrato generado
                      - Reenviar contrato al postulante
                      - Agregar anexos o documentos adicionales
                      - Programar entrega de llaves
                      - Generar checklist de ingreso
                  */}
                </div>
              )}

              {/* ========================================================================
                  SECCIÓN: HISTORIAL Y AUDITORÍA

                  Muestra el historial completo de acciones realizadas en esta postulación
                  ======================================================================== */}
              {(auditLog.length > 0 || modificationHistory.length > 0) && (
                <div className="mt-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 shadow-md border-2 border-gray-200">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-300">
                    <div className="h-12 w-12 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-2xl">📋</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 ml-4">Historial de Gestión</h3>
                    <div className="ml-auto flex space-x-2">
                      {auditLog.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {auditLog.length} acciones
                        </span>
                      )}
                      {modificationHistory.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                          {modificationHistory.length} modificaciones
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Historial de Auditoría */}
                  {auditLog.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-blue-600 mr-2">🔍</span>
                        Acciones de Auditoría
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {auditLog.map((entry) => (
                          <div key={entry.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-bold text-gray-900 capitalize">
                                    {entry.actionType?.replace('_', ' ') || 'Acción desconocida'}
                                  </span>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    entry.actionType === 'approve' ? 'bg-green-100 text-green-800' :
                                    entry.actionType === 'modify_acceptance' ? 'bg-blue-100 text-blue-800' :
                                    entry.actionType === 'cancel_contract' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {entry.actionType === 'approve' ? '✅ Aprobada' :
                                     entry.actionType === 'modify_acceptance' ? '✏️ Modificada' :
                                     entry.actionType === 'cancel_contract' ? '🚫 Anulada' :
                                     entry.actionType || 'Acción desconocida'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">
                                  Estado: {entry.previousStatus || 'N/A'} → {entry.newStatus || 'N/A'}
                                </p>
                                {entry.actionDetails && Object.keys(entry.actionDetails).length > 0 && (
                                  <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                                    <strong>Detalles:</strong>
                                    <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">
                                      {JSON.stringify(entry.actionDetails, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                {new Date(entry.createdAt).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Historial de Modificaciones */}
                  {modificationHistory.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-purple-600 mr-2">📝</span>
                        Modificaciones Realizadas
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {modificationHistory.map((mod) => (
                          <div key={mod.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-bold text-gray-900">
                                    Modificación #{mod.version}
                                  </span>
                                  {mod.adjustedScore && (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                                      Score: {mod.adjustedScore}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{mod.comments}</p>
                                {mod.additionalDocuments && (
                                  <p className="text-xs text-gray-600 mb-1">
                                    <strong>Documentos:</strong> {mod.additionalDocuments}
                                  </p>
                                )}
                                {mod.specialConditions && (
                                  <p className="text-xs text-gray-600">
                                    <strong>Condiciones:</strong> {mod.specialConditions}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                {new Date(mod.modifiedAt).toLocaleDateString('es-CL', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <p className="text-xs text-blue-800">
                      📊 Este historial muestra todas las acciones administrativas realizadas en esta postulación.
                      Cada acción queda registrada para auditorías y seguimiento.
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
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
        <RentalContractConditionsForm
          property={property}
          selectedProfile={selectedProfile}
          onSuccess={handleContractSuccess}
          onClose={() => setIsContractModalOpen(false)}
        />
      )}

      {/* ========================================================================
          MODAL: MODIFICAR ACEPTACIÓN
          
          Modal para editar datos asociados a una postulación aceptada
          
          CAMPOS EDITABLES:
          - Comentarios (obligatorio)
          - Score Ajustado (opcional)
          - Documentos Adicionales (opcional)
          - Condiciones Especiales (opcional)
          
          TODO: Campos futuros a agregar:
          - [ ] Fecha de inicio ajustada
          - [ ] Monto de arriendo modificado
          - [ ] Descuentos o bonificaciones
          - [ ] Requerimientos especiales de mantenimiento
          - [ ] Notas sobre mascotas o restricciones
          - [ ] Ajustes de depósito de garantía
          ======================================================================== */}
      {isModifyAcceptanceModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-8 rounded-t-2xl">
              <button
                onClick={handleCancelModification}
                className="absolute top-6 right-6 text-white hover:text-gray-200 transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Edit className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">Modificar Aceptación</h2>
                  <p className="text-blue-100 text-sm">
                    Edita los términos y condiciones de la postulación aceptada de <strong>{selectedProfile.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-6">
              
              {/* Comentarios (Obligatorio) */}
              <div>
                <label htmlFor="comments" className="block text-sm font-bold text-gray-700 mb-2">
                  Comentarios de Modificación <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="comments"
                  value={modificationData.comments}
                  onChange={(e) => setModificationData({ ...modificationData, comments: e.target.value })}
                  placeholder="Describe los cambios realizados y la razón de la modificación..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este comentario se registrará en el historial de la postulación
                </p>
              </div>

              {/* Score Ajustado (Opcional) */}
              <div>
                <label htmlFor="adjustedScore" className="block text-sm font-bold text-gray-700 mb-2">
                  Score de Riesgo Ajustado (Opcional)
                </label>
                <input
                  type="number"
                  id="adjustedScore"
                  value={modificationData.adjustedScore || ''}
                  onChange={(e) => setModificationData({ 
                    ...modificationData, 
                    adjustedScore: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Ej: 750"
                  min="300"
                  max="850"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rango válido: 300-850. Deja vacío para mantener el score actual ({selectedProfile.score})
                </p>
              </div>

              {/* Documentos Adicionales (Opcional) */}
              <div>
                <label htmlFor="additionalDocuments" className="block text-sm font-bold text-gray-700 mb-2">
                  Documentos Adicionales Solicitados (Opcional)
                </label>
                <textarea
                  id="additionalDocuments"
                  value={modificationData.additionalDocuments}
                  onChange={(e) => setModificationData({ ...modificationData, additionalDocuments: e.target.value })}
                  placeholder="Lista de documentos extra requeridos..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ej: Certificado de trabajo actualizado, comprobante de domicilio, etc.
                </p>
              </div>

              {/* Condiciones Especiales (Opcional) */}
              <div>
                <label htmlFor="specialConditions" className="block text-sm font-bold text-gray-700 mb-2">
                  Condiciones Especiales (Opcional)
                </label>
                <textarea
                  id="specialConditions"
                  value={modificationData.specialConditions}
                  onChange={(e) => setModificationData({ ...modificationData, specialConditions: e.target.value })}
                  placeholder="Condiciones adicionales o ajustes al contrato..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ej: Descuento especial, fecha de ingreso flexible, permite mascotas, etc.
                </p>
              </div>

              {/* Nota Informativa */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Nota Importante</h4>
                    <p className="text-xs text-blue-800">
                      Estos cambios quedarán registrados en el historial de modificaciones. 
                      El postulante NO será notificado automáticamente de estos ajustes.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer con Botones de Acción */}
            <div className="bg-gray-50 px-8 py-6 rounded-b-2xl flex flex-col sm:flex-row justify-end gap-3 border-t">
              <button
                onClick={handleCancelModification}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModification}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Guardar Modificaciones</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL: ANULAR POSTULACIÓN

          Modal para anular una postulación aceptada con motivo obligatorio

          CAMPOS REQUERIDOS:
          - Motivo de anulación (select/textarea)
          - Comentarios adicionales (textarea)
          - Confirmación de notificación al postulante (checkbox)
          ======================================================================== */}
      {isCancellationModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-8 py-8 rounded-t-2xl">
              <button
                onClick={handleCancelCancellation}
                className="absolute top-6 right-6 text-white hover:text-gray-200 transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">Anular Postulación</h2>
                  <p className="text-red-100 text-sm">
                    Anular la postulación de <strong>{selectedProfile.name}</strong> - Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-6">
              {/* Advertencia */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-900 mb-1">⚠️ Acción Irreversible</h4>
                    <p className="text-xs text-red-800">
                      Esta acción cambiará el estado de la postulación a "Anulada" y actualizará todas las tablas relacionadas.
                      {selectedProfile.hasContractConditions && ' Las condiciones de contrato serán marcadas como anuladas.'}
                      {selectedProfile.hasContract && ' El contrato será cancelado.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivo de Anulación */}
              <div>
                <label htmlFor="cancellationReason" className="block text-sm font-bold text-gray-700 mb-2">
                  Motivo de Anulación <span className="text-red-500">*</span>
                </label>
                <select
                  id="cancellationReason"
                  value={cancellationData.reason}
                  onChange={(e) => setCancellationData({ ...cancellationData, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                >
                  <option value="">Selecciona un motivo...</option>
                  <option value="Error administrativo">Error administrativo</option>
                  <option value="Información incompleta">Información incompleta del postulante</option>
                  <option value="Cambio de criterios">Cambio en criterios de aceptación</option>
                  <option value="Solicitud del propietario">Solicitud del propietario</option>
                  <option value="Incumplimiento de requisitos">Incumplimiento de requisitos previos</option>
                  <option value="Otro">Otro motivo (especificar en comentarios)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Este motivo será registrado en el historial de auditoría
                </p>
              </div>

              {/* Comentarios Adicionales */}
              <div>
                <label htmlFor="cancellationComments" className="block text-sm font-bold text-gray-700 mb-2">
                  Comentarios Adicionales <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="cancellationComments"
                  value={cancellationData.comments}
                  onChange={(e) => setCancellationData({ ...cancellationData, comments: e.target.value })}
                  placeholder="Explica detalladamente el motivo de la anulación..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Estos comentarios serán visibles en el historial y pueden ser utilizados para auditorías futuras
                </p>
              </div>

              {/* Notificación al Postulante */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cancellationData.notifyApplicant}
                    onChange={(e) => setCancellationData({ ...cancellationData, notifyApplicant: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notificar al postulante</span>
                    <p className="text-xs text-gray-500">Enviar email automático informando la anulación</p>
                  </div>
                </label>
              </div>

              {/* Resumen de Cambios */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Resumen de Cambios</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Estado de la postulación: "Aprobado" → "Anulado"</li>
                  {selectedProfile.hasContractConditions && <li>• Condiciones de contrato: Marcadas como anuladas</li>}
                  {selectedProfile.hasContract && <li>• Contrato: Estado cambiado a "Cancelado"</li>}
                  <li>• Auditoría: Registro completo de la acción</li>
                  {cancellationData.notifyApplicant && <li>• Notificación: Email enviado al postulante</li>}
                </ul>
              </div>

            </div>

            {/* Footer con Botones de Acción */}
            <div className="bg-gray-50 px-8 py-6 rounded-b-2xl flex flex-col sm:flex-row justify-end gap-3 border-t">
              <button
                onClick={handleCancelCancellation}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCancellation}
                disabled={isCancellingApplication || !cancellationData.reason.trim() || !cancellationData.comments.trim()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-2">
                  {isCancellingApplication ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                  <span>{isCancellingApplication ? 'Anulando...' : 'Confirmar Anulación'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

