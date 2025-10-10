import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Mail, Calendar, MapPin, Building, FileText, AlertTriangle, CheckCircle2, XCircle, FileStack, MessageSquarePlus, Undo2, User } from 'lucide-react';
import { supabase, updateApplicationStatus, approveApplicationWithWebhook } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { webhookClient } from '../../lib/webhook';
import CustomButton from '../common/CustomButton';
import RentalContractConditionsForm, { RentalContractConditions } from './RentalContractConditionsForm';

interface ApplicationWithDetails {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  application_characteristic_id?: string | null;
  properties: {
    id: string;
    address_street: string;
    address_number?: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
    property_characteristic_id?: string;
    owner_id: string;
    property_images?: { image_url: string }[];
  };
  profiles?: {
    first_name: string | null;
    paternal_last_name: string | null;
    maternal_last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  structured_applicant?: {
    full_name: string | null;
    profession: string | null;
    company: string | null;
    monthly_income: number | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null;
  guarantors?: {
    first_name: string | null;
    paternal_last_name: string | null;
    maternal_last_name: string | null;
    rut: string | null;
    guarantor_characteristic_id: string | null;
  } | null;
}

const ApplicationsPage: React.FC = () => {
  console.log('🚀 ApplicationsPage component loaded');
  const { user } = useAuth();
  console.log('👤 Current user:', user);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedApplications, setReceivedApplications] = useState<ApplicationWithDetails[]>([]);
  const [sentApplications, setSentApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [messageType, setMessageType] = useState<'documents' | 'info'>('documents');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [propertyImages, setPropertyImages] = useState<Record<string, { image_url: string }[]>>({});
  const [rentalOwners, setRentalOwners] = useState<Record<string, { rental_owner_characteristic_id: string | null }>>({});
  const [contractStatus, setContractStatus] = useState<Record<string, { status: string; approved_at?: string; sent_to_signature_at?: string }>>({});
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [applicationToUndo, setApplicationToUndo] = useState<ApplicationWithDetails | null>(null);
  const [showContractConditionsModal, setShowContractConditionsModal] = useState(false);
  const [applicationToApprove, setApplicationToApprove] = useState<ApplicationWithDetails | null>(null);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  // Function to fetch property images separately
  const fetchPropertyImages = async (propertyIds: string[]) => {
    if (propertyIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('property_id, image_url')
        .in('property_id', propertyIds);
      
      if (error) throw error;
      
      // Group images by property_id
      const imagesByProperty = data?.reduce((acc, img) => {
        if (!acc[img.property_id]) acc[img.property_id] = [];
        acc[img.property_id].push(img);
        return acc;
      }, {} as Record<string, { image_url: string }[]>) || {};
      
      setPropertyImages(imagesByProperty);
    } catch (error) {
      console.error('Error fetching property images:', error);
    }
  };

  // Function to fetch rental owner data separately
  const fetchRentalOwners = async (propertyIds: string[]) => {
    if (propertyIds.length === 0) return {};
    
    console.log('🔍 Fetching rental owners for property IDs:', propertyIds);
    
    try {
      const { data, error } = await supabase
        .from('rental_owners')
        .select('property_id, rental_owner_characteristic_id')
        .in('property_id', propertyIds);
      
      if (error) throw error;
      
      console.log('📊 Raw rental owners data:', data);
      
      // Group rental owners by property_id
      const rentalOwnersByProperty = data?.reduce((acc, owner) => {
        acc[owner.property_id] = {
          rental_owner_characteristic_id: owner.rental_owner_characteristic_id
        };
        return acc;
      }, {} as Record<string, { rental_owner_characteristic_id: string | null }>) || {};
      
      console.log('📊 Grouped rental owners data:', rentalOwnersByProperty);
      
      return rentalOwnersByProperty;
    } catch (error) {
      console.error('Error fetching rental owners:', error);
      return {};
    }
  };

  // Función para cargar estado de contratos
  const fetchContractStatus = async (applicationIds: string[]) => {
    if (applicationIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('application_id, status, approved_at, sent_to_signature_at')
        .in('application_id', applicationIds);

      if (error) throw error;

      const statusMap: Record<string, { status: string; approved_at?: string; sent_to_signature_at?: string }> = {};
      data?.forEach(contract => {
        statusMap[contract.application_id] = {
          status: contract.status,
          approved_at: contract.approved_at,
          sent_to_signature_at: contract.sent_to_signature_at
        };
      });

      return statusMap;
    } catch (error) {
      console.error('Error fetching contract status:', error);
      return {};
    }
  };

  // Función para obtener postulaciones recibidas (como propietario)
  const fetchReceivedApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          application_characteristic_id,
          properties!inner(
            address_street,
            address_commune,
            price_clp,
            listing_type,
            owner_id,
            property_characteristic_id
          ),
          profiles!applicant_id(
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone
          ),
          guarantors!guarantor_id(
            first_name,
            paternal_last_name,
            maternal_last_name,
            rut,
            guarantor_characteristic_id
          )
        `)
        .eq('properties.owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cargar estado de contratos para aplicaciones aprobadas
      const approvedApplicationIds = (data || [])
        .filter(app => app.status === 'aprobada')
        .map(app => app.id);

      if (approvedApplicationIds.length > 0) {
        const contractStatusData = await fetchContractStatus(approvedApplicationIds);
        setContractStatus(contractStatusData);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching received applications:', error);
      return [];
    }
  };

  // Función para obtener postulaciones enviadas (como postulante)
  const fetchSentApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          properties(
            address_street,
            address_commune,
            price_clp,
            listing_type
          ),
          profiles!applicant_id(
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone
          )
        `)
        .eq('applicant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sent applications:', error);
      return [];
    }
  };

  const fetchApplications = async () => {
    console.log('📡 fetchApplications iniciado');
    setLoading(true);
    try {
      const [received, sent] = await Promise.all([
        fetchReceivedApplications(),
        fetchSentApplications()
      ]);
      
      console.log('📊 Postulaciones recibidas:', received.length);
      console.log('📊 Postulaciones enviadas:', sent.length);
      console.log('📋 Estados de postulaciones recibidas:', received.map(app => ({ id: app.id, status: app.status })));
      
      setReceivedApplications(received);
      setSentApplications(sent);
      
      // Fetch property images and rental owners for all properties
      const allPropertyIds = [
        ...received.map(app => app.property_id),
        ...sent.map(app => app.property_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
      
        if (allPropertyIds.length > 0) {
          await fetchPropertyImages(allPropertyIds);
          const rentalOwnersData = await fetchRentalOwners(allPropertyIds);
          
          setRentalOwners(rentalOwnersData);
          
          console.log('📊 Rental owners data loaded:', rentalOwnersData);
          console.log('📊 Property IDs processed:', allPropertyIds);
        }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar postulación (integración con webhook)
  const handleApproveApplication = async (application: ApplicationWithDetails, contractConditions?: RentalContractConditions) => {
    console.log('🚀 === handleApproveApplication INICIADA ===');
    console.log('📋 Application ID:', application.id);
    console.log('📋 Application data:', application);
    console.log('👤 Current user:', user);
    console.log('🔄 Usuario autenticado en contexto:', !!user);
    
    // Poner estado de carga para feedback visual
    setUpdating(`${application.id}-approve`);
    
    try {
      // Preparar datos del postulante
      const applicantData = {
        full_name: application.structured_applicant?.full_name || getFullName(application.profiles) || 'No especificado',
        contact_email: application.structured_applicant?.contact_email || getContactEmail(application.profiles) || 'No especificado',
        contact_phone: application.structured_applicant?.contact_phone || getContactPhone(application.profiles),
        profession: application.structured_applicant?.profession,
        company: application.structured_applicant?.company,
        monthly_income: application.structured_applicant?.monthly_income
      };

      // Preparar datos de la propiedad
      const propertyData = {
        address: application.properties.address_street,
        city: application.properties.address_commune,
        price: application.properties.price_clp,
        listing_type: application.properties.listing_type
      };

      console.log('📊 Datos preparados:', {
        applicantData,
        propertyData
      });

      // 1. Actualizar estado en la base de datos con webhook integrado
      console.log('📝 Actualizando estado en base de datos con webhook...');
      const updatedApplication = await approveApplicationWithWebhook(
        application.id,
        application.property_id,
        application.applicant_id,
        applicantData,
        propertyData
      );
      console.log('✅ Base de datos actualizada y webhook enviado correctamente');

      // 2. Crear nueva fila en rental_contracts después de la aprobación exitosa
      console.log('🏠 Creando contrato de arriendo para la aplicación aprobada...');
      let contractId: string | undefined;
      try {
        const now = new Date().toISOString();
        const { data: contractData, error: contractError } = await supabase
          .from('rental_contracts')
          .insert({
            application_id: application.id,
            status: 'draft', // Borrador - el contenido se generará externamente por N8N
            contract_content: {}, // Objeto vacío en lugar de null para cumplir constraint
            contract_format: 'html', // Formato esperado desde N8N
            approved_at: now,
            notes: 'Contrato creado automáticamente al aprobar aplicación - pendiente de HTML desde N8N',
            version: 1
          })
          .select('id, contract_number, contract_characteristic_id, application_id, status, approved_at, version')
          .single();

        if (contractError) {
          console.error('❌ Error creando contrato:', contractError);
          throw contractError;
        }

        // Capturar el contract_characteristic_id para el webhook (no el UUID)
        contractId = contractData.contract_characteristic_id;

        console.log('✅ Contrato creado exitosamente:', contractData);
        console.log('📋 Contract ID (UUID):', contractData.id);
        console.log('📋 Contract Characteristic ID:', contractData.contract_characteristic_id);
        console.log('📋 Contract Number:', contractData.contract_number);
        console.log('📋 Application ID:', contractData.application_id);
        console.log('📊 Status:', contractData.status);
        console.log('📊 Approved at:', contractData.approved_at);
        console.log('📊 Version:', contractData.version);
        console.log('\n💡 Ahora N8N debe actualizar este contrato con el HTML');
        console.log('💡 O visualizar en: /contract/' + contractData.id);
      } catch (contractError) {
        console.error('❌ Error al crear contrato de arriendo:', contractError);
        // No lanzamos el error para no interrumpir el flujo principal,
        // pero registramos el problema
      }

      // 2. Enviar webhook a Railway (solo GET - Railway no acepta POST)
      console.log('🌐 Enviando webhook optimizado a Railway con characteristic IDs...');
      try {
        // Usar el rental_owner_characteristic_id si está disponible, sino el owner_id
        const property = application.properties;
        console.log('🔍 Debugging rental owner data:');
        console.log('  - Property ID:', application.property_id);
        console.log('  - All rental owners state:', rentalOwners);
        console.log('  - Looking for property ID in rental owners:', rentalOwners[application.property_id]);
        
        console.log('🔍 Debugging application data:');
        console.log('  - Application ID (UUID):', application.id);
        console.log('  - Application characteristic ID:', application.application_characteristic_id);
        console.log('  - Property characteristic ID:', application.properties?.property_characteristic_id);
        console.log('  - Full application object:', application);
        
        const rentalOwnerData = rentalOwners[application.property_id];
        const ownerCharacteristicId = rentalOwnerData?.rental_owner_characteristic_id || property?.owner_id;
        
        // Verificar si tenemos el rental_owner_characteristic_id
        if (!rentalOwnerData?.rental_owner_characteristic_id) {
          console.warn('⚠️ No se encontró rental_owner_characteristic_id para la propiedad:', application.property_id);
          console.warn('⚠️ Esto puede deberse a:');
          console.warn('  1. La propiedad no tiene registro en rental_owners');
          console.warn('  2. El rental_owner_characteristic_id no está poblado');
          console.warn('  3. Ejecuta el script fix_missing_rental_owners.sql para corregir esto');
          console.warn('⚠️ Usando owner_id como fallback:', property?.owner_id);
        } else {
          console.log('✅ rental_owner_characteristic_id encontrado:', rentalOwnerData.rental_owner_characteristic_id);
        }
        
        console.log('🏠 Usando rental_owner_characteristic_id para identificar al propietario:', ownerCharacteristicId);
        console.log('📊 Datos de rental_owners encontrados:', rentalOwnerData);
        console.log('🏘️ Property characteristic ID:', application.properties?.property_characteristic_id);
        console.log('📋 Application characteristic ID:', application.application_characteristic_id);
        console.log('🛡️ Guarantor characteristic ID:', application.guarantors?.guarantor_characteristic_id);
        console.log('👤 Guarantor data:', application.guarantors);

        // Verificar que el application_characteristic_id no sea el mismo que property_characteristic_id
        let applicationCharacteristicId = application.application_characteristic_id;
        if (applicationCharacteristicId === application.properties?.property_characteristic_id) {
          console.warn('⚠️ application_characteristic_id es igual a property_characteristic_id, usando UUID como fallback');
          applicationCharacteristicId = application.id;
        }

        // Enviar únicamente el guarantor_characteristic_id original de la base de datos
        const guarantorIdForWebhook = application.guarantors?.guarantor_characteristic_id || undefined;

        console.log('🔍 Guarantor ID para webhook:', guarantorIdForWebhook);
        console.log('🔍 Contract conditions object:', contractConditions);
        console.log('🔍 Contract conditions characteristic ID:', contractConditions?.rental_contract_conditions_characteristic_id);
        console.log('📄 Contract characteristic ID para webhook:', contractId);

        await webhookClient.sendSimpleApprovalEvent(
          applicationCharacteristicId || application.id, // Application ID (corregido)
          application.properties?.property_characteristic_id || application.property_id, // Property ID
          application.applicant_id, // Applicant ID (mantenemos UUID, no tiene characteristic_id)
          ownerCharacteristicId, // Owner ID (usa rental_owner_characteristic_id si está disponible)
          guarantorIdForWebhook, // Guarantor ID único por aplicación
          contractConditions?.rental_contract_conditions_characteristic_id || undefined, // ID característico de las condiciones del contrato
          contractId // ID del contrato generado
        );

        console.log('✅ Webhook con characteristic IDs y condiciones del contrato enviado exitosamente');
        console.log('📊 IDs y condiciones enviados al webhook:', {
          application_characteristic_id: applicationCharacteristicId || application.id,
          property_characteristic_id: application.properties?.property_characteristic_id || application.property_id,
          rental_owner_characteristic_id: ownerCharacteristicId,
          guarantor_characteristic_id: application.guarantors?.guarantor_characteristic_id || null,
          guarantor_id_for_webhook: guarantorIdForWebhook,
          contract_conditions_characteristic_id: contractConditions?.rental_contract_conditions_characteristic_id || undefined,
          contract_characteristic_id: contractId
        });
      } catch (webhookError) {
        console.warn('⚠️ Error en webhook (no crítico):', webhookError);
      }
      
      console.log('✅ Aplicación aprobada exitosamente');

      // Actualizar el estado de la UI inmediatamente
      setReceivedApplications(prev => prev.map(app =>
        app.id === application.id ? { ...app, status: 'aprobada' } : app
      ));

      console.log('✅ Proceso de aprobación completado exitosamente');
      
      // Mostrar notificación de éxito
      const successMessage = '¡Postulación aprobada exitosamente! Se ha enviado la notificación al postulante.';
      console.log('✅', successMessage);
      
      // Crear notificación temporal en la UI
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      notification.textContent = successMessage;
      document.body.appendChild(notification);
      
      // Remover notificación después de 5 segundos
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);

    } catch (error) {
      console.error('❌ Error aprobando postulación:', error);
      
      // Revertir cambios en la UI si hubo error en la base de datos
      setReceivedApplications(prev => prev.map(app =>
        app.id === application.id ? { ...app, status: 'pendiente' } : app
      ));
      
      // Mostrar notificación de error más elegante
      const errorMessage = `Error al aprobar la postulación: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta nuevamente.`;
      console.error('❌', errorMessage);
      
      // Crear notificación de error temporal en la UI
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      errorNotification.textContent = errorMessage;
      document.body.appendChild(errorNotification);
      
      // Remover notificación después de 7 segundos
      setTimeout(() => {
        errorNotification.style.opacity = '0';
        errorNotification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (errorNotification.parentNode) {
            errorNotification.parentNode.removeChild(errorNotification);
          }
        }, 300);
      }, 7000);
    } finally {
      // Quitar estado de carga
      setUpdating(null);
    }
  };

  // Función para rechazar postulación (integración con n8n)
  const handleRejectApplication = async (application: ApplicationWithDetails) => {
    setUpdating(`${application.id}-reject`);
    try {
      // Actualizar estado en la base de datos
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rechazada' })
        .eq('id', application.id);

      if (error) throw error;

      // Actualizar estado local
      setReceivedApplications(receivedApplications.map(app =>
        app.id === application.id ? { ...app, status: 'rechazada' } : app
      ));

    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error al rechazar la postulación. Por favor, intenta nuevamente.');
    } finally {
      setUpdating(null);
    }
  };

  // Función para solicitar informe comercial (integración con n8n)
  const handleRequestCommercialReport = async (application: ApplicationWithDetails) => {
    setUpdating(`${application.id}-report`);
    try {
      // Mostrar notificación de éxito
      alert('Solicitud de informe enviada correctamente');
    } catch (error) {
      console.error('Error requesting commercial report:', error);
      alert('Error al solicitar el informe. Por favor, intenta nuevamente.');
    } finally {
      setUpdating(null);
    }
  };

  // Función para abrir modal de mensaje
  const openMessageModal = (application: ApplicationWithDetails, type: 'documents' | 'info') => {
    setSelectedApplication(application);
    setMessageType(type);
    
    // Pre-cargar texto según el tipo
    const preloadedText = type === 'documents' 
      ? `Estimado/a ${application.structured_applicant?.full_name || getFullName(application.profiles) || 'Postulante'},\n\nPara continuar con su postulación, por favor adjunte los siguientes documentos:\n\n- \n- \n- \n\nSaludos cordiales.`
      : `Estimado/a ${application.structured_applicant?.full_name || getFullName(application.profiles) || 'Postulante'},\n\nNecesitamos información adicional sobre su postulación:\n\n\n\nSaludos cordiales.`;
    
    setMessageText(preloadedText);
    setShowMessageModal(true);
  };

  // Función para enviar mensaje
  const handleSendMessage = async () => {
    if (!selectedApplication || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      // TODO: Aquí se puede guardar el mensaje en una tabla de mensajes
      // Por ahora solo simulamos el envío
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Mensaje enviado correctamente al postulante');
      setShowMessageModal(false);
      setMessageText('');
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Por favor, intenta nuevamente.');
    } finally {
      setSendingMessage(false);
    }
  };


  // Función para deshacer aceptación de postulación
  const handleUndoAcceptance = async (application: ApplicationWithDetails) => {
    setApplicationToUndo(application);
    setShowUndoModal(true);
  };

  // Función para manejar el éxito del formulario de condiciones del contrato
  const handleContractConditionsSuccess = async (conditions: RentalContractConditions) => {
    if (!applicationToApprove) return;

    console.log('✅ Condiciones del contrato guardadas:', conditions);

    // Cerrar modal de condiciones
    setShowContractConditionsModal(false);
    setApplicationToApprove(null);

    // Proceder con la aprobación normal, pasando las condiciones
    await handleApproveApplication(applicationToApprove, conditions);

    // El contrato se crea vacío, sin contenido HTML generado
    // El contenido será generado externamente (por ejemplo, por N8N u otro sistema externo)
    console.log('✅ Contrato creado en estado draft, sin contenido HTML');
  };

  // Función para cancelar el modal de condiciones del contrato
  const handleContractConditionsCancel = () => {
    setShowContractConditionsModal(false);
    setApplicationToApprove(null);
  };

  // Función para confirmar deshacer aceptación
  const confirmUndoAcceptance = async () => {
    if (!applicationToUndo) return;

    setUpdating(`${applicationToUndo.id}-undo`);
    console.log('🚀 Iniciando reversión de postulación:', applicationToUndo.id);
    
    try {
      // 1. Actualizar estado en la base de datos de 'aprobada' a 'pendiente'
      const { error } = await supabase
        .from('applications')
        .update({ status: 'pendiente' })
        .eq('id', applicationToUndo.id);

      if (error) throw error;
      console.log('✅ Base de datos actualizada correctamente');

      // 2. Cancelar contrato si existe
      if (contractStatus[applicationToUndo.id]) {
        const { error: contractError } = await supabase
          .from('rental_contracts')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationToUndo.id);

        if (contractError) {
          console.warn('⚠️ Error al cancelar contrato:', contractError);
          // No lanzamos error para no interrumpir el flujo principal
        } else {
          console.log('✅ Contrato cancelado correctamente');
        }
      }

      // 3. Actualizar el estado de la UI inmediatamente
      setReceivedApplications(receivedApplications.map(app =>
        app.id === applicationToUndo.id ? { ...app, status: 'pendiente' } : app
      ));

      // 4. Actualizar estado del contrato en el estado local
      if (contractStatus[applicationToUndo.id]) {
        setContractStatus(prev => ({
          ...prev,
          [applicationToUndo.id]: {
            ...prev[applicationToUndo.id],
            status: 'cancelled'
          }
        }));
      }

      // 5. Configurar URL del webhook de n8n
      let webhookURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
      
      // Use proxy in development to avoid CORS issues
      if (import.meta.env.DEV && webhookURL) {
        const url = new URL(webhookURL);
        webhookURL = `/api${url.pathname}`;
      }
      
      // 6. Intentar enviar webhook solo si está configurado
      if (webhookURL) {
        try {
          // Construir el payload completo con toda la información necesaria
          const webhookPayload = {
            // Información básica de la decisión
            action: 'application_reverted',
            decision: 'reverted',
            status: 'pendiente',
            timestamp: new Date().toISOString(),
            
            // Información de la aplicación
            application: {
              id: applicationToUndo.id,
              property_id: applicationToUndo.property_id,
              applicant_id: applicationToUndo.applicant_id,
              message: applicationToUndo.message,
              created_at: applicationToUndo.created_at,
              status: 'pendiente'
            },
            
            // Información de la propiedad
            property: {
              id: applicationToUndo.property_id,
              address_street: applicationToUndo.properties.address_street,
              address_commune: applicationToUndo.properties.address_commune,
              price: applicationToUndo.properties.price_clp,
              listing_type: applicationToUndo.properties.listing_type,
              photos_urls: applicationToUndo.properties.property_images?.map(img => img.image_url) || []
            },
            
            // Información del postulante
            applicant: {
              id: applicationToUndo.applicant_id,
              full_name: applicationToUndo.structured_applicant?.full_name || getFullName(applicationToUndo.profiles) || 'No especificado',
              contact_email: applicationToUndo.structured_applicant?.contact_email || getContactEmail(applicationToUndo.profiles) || 'No especificado',
              contact_phone: applicationToUndo.structured_applicant?.contact_phone || getContactPhone(applicationToUndo.profiles) || null,
              profession: applicationToUndo.structured_applicant?.profession || null,
              company: applicationToUndo.structured_applicant?.company || null,
              monthly_income: applicationToUndo.structured_applicant?.monthly_income || null
            },
            
            // Información adicional para procesamiento
            metadata: {
              source: 'propiedades_app',
              user_agent: navigator.userAgent,
              url: window.location.href,
              environment: import.meta.env.MODE || 'development'
            }
          };

          console.log('📤 Enviando payload al webhook:', webhookPayload);

          // Convertir payload a query parameters para GET request
          const queryParams = new URLSearchParams();
          queryParams.append('data', JSON.stringify(webhookPayload));
          const urlWithParams = `${webhookURL}?${queryParams.toString()}`;
          
          // Realizar la solicitud GET al webhook con las cabeceras correctas
          const response = await fetch(urlWithParams, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'PropiedadesApp/1.0'
            }
          });

          console.log('📡 Respuesta del webhook - Status:', response.status);
          
          // Verificar si la respuesta fue exitosa
          if (!response.ok) {
            // Solo registrar el error sin interrumpir el proceso
            console.warn(`⚠️ Webhook no disponible (${response.status}): El servicio de notificaciones externo no está activo`);
          } else {
            // Intentar leer la respuesta
            let result;
            try {
              result = await response.json();
              console.log('✅ Webhook de n8n ejecutado con éxito:', result);
            } catch (jsonError) {
              // Si no es JSON válido, leer como texto
              result = await response.text();
              console.log('✅ Webhook de n8n ejecutado con éxito (respuesta texto):', result);
            }
          }
        } catch (webhookError) {
          // Solo registrar el error sin mostrar alertas al usuario
          console.warn('⚠️ Servicio de notificaciones no disponible:', webhookError);
          
          // Safely extract error message
          const errorMessage = webhookError instanceof Error ? webhookError.message : JSON.stringify(webhookError);
          console.warn('⚠️ Webhook error message:', errorMessage);
        }
      } else {
        // No mostrar alerta si no hay webhook configurado, es opcional
        console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      }

      console.log('✅ Proceso de reversión completado exitosamente');

      // Cerrar modal
      setShowUndoModal(false);
      setApplicationToUndo(null);

    } catch (error) {
      console.error('❌ Error revirtiendo postulación:', error);
      
      // Revertir cambios en la UI si hubo error en la base de datos
      setReceivedApplications(receivedApplications.map(app =>
        app.id === applicationToUndo.id ? { ...app, status: 'aprobada' } : app
      ));
      
      alert(`Error al revertir la postulación: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta nuevamente.`);
    } finally {
      // Quitar estado de carga
      setUpdating(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Helper function to build full name from profile data
  const getFullName = (profiles: ApplicationWithDetails['profiles']) => {
    if (!profiles) return 'No especificado';
    const { first_name, paternal_last_name, maternal_last_name } = profiles;
    if (!first_name || !paternal_last_name) return 'No especificado';
    return `${first_name} ${paternal_last_name}${maternal_last_name ? ` ${maternal_last_name}` : ''}`;
  };

  // Helper function to get contact email from profile
  const getContactEmail = (profiles: ApplicationWithDetails['profiles']) => {
    return profiles?.email || 'No especificado';
  };

  // Helper function to get contact phone from profile
  const getContactPhone = (profiles: ApplicationWithDetails['profiles']) => {
    return profiles?.phone || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobada': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'rechazada': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      default: return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobada': return <Check className="h-4 w-4" />;
      case 'rechazada': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Componente de pestañas mejorado
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
      <nav className="-mb-px flex space-x-2 sm:space-x-4 min-w-max">
        <button
          onClick={() => setActiveTab('received')}
          className={`relative py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap rounded-t-xl ${
            activeTab === 'received'
              ? 'text-emerald-700 bg-gradient-to-b from-emerald-50 to-transparent'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {activeTab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
          )}
          <span className="flex items-center gap-2">
            📥 Recibidas
            {receivedApplications.length > 0 && (
              <span className={`py-1 px-2.5 rounded-full text-xs font-bold ${
                activeTab === 'received'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {receivedApplications.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`relative py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap rounded-t-xl ${
            activeTab === 'sent'
              ? 'text-emerald-700 bg-gradient-to-b from-emerald-50 to-transparent'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {activeTab === 'sent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" />
          )}
          <span className="flex items-center gap-2">
            📤 Enviadas
            {sentApplications.length > 0 && (
              <span className={`py-1 px-2.5 rounded-full text-xs font-bold ${
                activeTab === 'sent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {sentApplications.length}
              </span>
            )}
          </span>
        </button>
      </nav>
    </div>
  );

  // Componente para postulaciones recibidas (vista actual)
  const ReceivedApplicationsView = () => {
    console.log('📋 ReceivedApplicationsView renderizado');
    console.log('📊 Total postulaciones recibidas:', receivedApplications.length);
    console.log('📊 Postulaciones:', receivedApplications.map(app => ({ id: app.id, status: app.status })));
    
    return (
      <div className="space-y-4">
      {receivedApplications.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay postulaciones recibidas</h3>
          <p className="text-gray-500">
            Las postulaciones de arriendo aparecerán aquí cuando alguien se interese en tus propiedades.
          </p>
        </div>
      ) : (
        receivedApplications.map((application) => (
          <div key={application.id} className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="p-5 sm:p-6">
              {/* Header con diseño mejorado */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-5 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-emerald-600 transition-colors">
                        {application.properties.address_street}
                      </h3>
                      <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <span>{application.properties.address_commune}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                          <span className="font-bold text-emerald-700">{formatPrice(application.properties.price_clp)}</span>
                          <span className="text-emerald-600 text-xs">/mes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-start">
                  <span className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="hidden sm:inline">{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                    <span className="sm:hidden">{application.status.charAt(0).toUpperCase()}</span>
                  </span>
                </div>
              </div>

              {/* Applicant Information con diseño mejorado */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-5 rounded-xl mb-4 border border-gray-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">Información del Postulante</h4>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-500">Nombre: </span>
                    <span className="font-medium">{application.structured_applicant?.full_name || getFullName(application.profiles)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email: </span>
                    <span className="font-medium">{application.structured_applicant?.contact_email || getContactEmail(application.profiles)}</span>
                  </div>
                  {(application.structured_applicant?.contact_phone || getContactPhone(application.profiles)) && (
                    <div>
                      <span className="text-gray-500">Teléfono: </span>
                      <span className="font-medium">{application.structured_applicant?.contact_phone || getContactPhone(application.profiles)}</span>
                    </div>
                  )}
                  {application.structured_applicant?.profession && (
                    <div>
                      <span className="text-gray-500">Profesión: </span>
                      <span className="font-medium">{application.structured_applicant.profession}</span>
                    </div>
                  )}
                  {application.structured_applicant?.company && (
                    <div>
                      <span className="text-gray-500">Empresa: </span>
                      <span className="font-medium">{application.structured_applicant.company}</span>
                    </div>
                  )}
                  {application.structured_applicant?.monthly_income && application.structured_applicant.monthly_income > 0 && (
                    <div>
                      <span className="text-gray-500">Ingresos: </span>
                      <span className="font-medium">{formatPrice(application.structured_applicant.monthly_income)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message con diseño mejorado */}
              {application.message && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-l-4 border-emerald-500 p-4 sm:p-5 rounded-xl mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquarePlus className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900 text-sm sm:text-base">Mensaje del Postulante</h4>
                  </div>
                  <p className="text-emerald-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {application.message}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-3">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span>Recibida el {formatDate(application.created_at)}</span>
                </div>

                {/* Panel de Acciones con Botones Individuales */}
                {(() => {
                  console.log('🔍 Verificando estado de aplicación:', application.id, 'Status:', application.status);
                  return application.status === 'pendiente';
                })() && (
                  <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
                    {/* Acciones Secundarias con diseño mejorado */}
                    <button
                      onClick={() => openMessageModal(application, 'info')}
                      disabled={updating?.startsWith(application.id)}
                      className="p-2.5 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 touch-manipulation hover:scale-105 shadow-sm"
                      title="Solicitar Más Información"
                    >
                      <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    <button
                      onClick={() => openMessageModal(application, 'documents')}
                      disabled={updating?.startsWith(application.id)}
                      className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-xl transition-all duration-200 disabled:opacity-50 touch-manipulation hover:scale-105 shadow-sm"
                      title="Solicitar Documentos Faltantes"
                    >
                      <FileStack className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    <button
                      onClick={() => handleRequestCommercialReport(application)}
                      disabled={updating?.startsWith(application.id)}
                      className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50 touch-manipulation hover:scale-105 shadow-sm"
                      title="Solicitar Informe Comercial"
                    >
                      {updating === `${application.id}-report` ? (
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>

                    {/* Separador Visual */}
                    <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2"></div>

                    {/* Acciones Principales con diseño mejorado */}
                    <button
                      onClick={() => handleRejectApplication(application)}
                      disabled={updating?.startsWith(application.id)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation font-semibold"
                      title="Rechazar Postulación"
                    >
                      {updating === `${application.id}-reject` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="text-xs sm:text-sm">Rechazar</span>
                    </button>

                    <button
                      onClick={() => {
                        console.log('🖱️ BOTÓN APROBAR CLICKEADO!');
                        console.log('📋 Application:', application);
                        setApplicationToApprove(application);
                        setShowContractConditionsModal(true);
                      }}
                      disabled={updating?.startsWith(application.id)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation font-semibold"
                      title="Aprobar Postulación"
                    >
                      {updating === `${application.id}-approve` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span className="text-xs sm:text-sm">Aprobar</span>
                    </button>
                  </div>
                )}

                {/* Botón para deshacer aceptación y banner de contrato */}
                {application.status === 'aprobada' && (
                  <div className="flex items-center space-x-4">

                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUndoAcceptance(application)}
                      disabled={updating?.startsWith(application.id)}
                      className="flex items-center space-x-1"
                    >
                      <Undo2 className="h-4 w-4" />
                      <span>Deshacer Aceptación</span>
                    </CustomButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      </div>
    );
  };

  // Componente para postulaciones enviadas (nueva vista)
  const SentApplicationsView = () => (
    <div className="space-y-4">
      {sentApplications.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 px-4">No has realizado postulaciones</h3>
          <p className="text-sm sm:text-base text-gray-500 px-4">
            Las postulaciones que hagas a propiedades en arriendo aparecerán aquí para que puedas seguir su estado.
          </p>
        </div>
      ) : (
        sentApplications.map((application) => (
          <div key={application.id} className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                        {application.properties.address_street}
                      </h3>
                      <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          <span>{application.properties.address_commune}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg">
                          <span className="font-bold text-indigo-700">{formatPrice(application.properties.price_clp)}</span>
                          <span className="text-indigo-600 text-xs">/mes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-start">
                  <span className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="hidden sm:inline">{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                    <span className="sm:hidden">{application.status.charAt(0).toUpperCase()}</span>
                  </span>
                </div>
              </div>

              {/* Imagen de la propiedad con diseño mejorado */}
              <div className="flex items-start space-x-4 mb-4 bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 rounded-xl">
                <div className="w-20 h-16 sm:w-24 sm:h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  {propertyImages[application.property_id] && propertyImages[application.property_id].length > 0 ? (
                    <img 
                      src={propertyImages[application.property_id][0].image_url} 
                      alt={application.properties.address_street}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                      <Building className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">💰 Precio de arriendo</div>
                  <div className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(application.properties.price_clp)}
                  </div>
                  <div className="text-xs text-gray-500">por mes</div>
                </div>
              </div>

              {application.message && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 border-l-4 border-indigo-500 p-4 sm:p-5 rounded-xl mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquarePlus className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-bold text-indigo-900 text-sm sm:text-base">Tu mensaje</h4>
                  </div>
                  <p className="text-indigo-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {application.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-2">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span>Enviada el {formatDate(application.created_at)}</span>
                </div>
                
                {application.status === 'pendiente' && (
                  <div className="text-xs sm:text-sm text-gray-500">
                    Esperando respuesta del propietario
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header mejorado con gradiente */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50 rounded-2xl shadow-lg border border-emerald-100/50 p-5 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Postulaciones</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Administra tus postulaciones de arriendo de forma eficiente
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <TabNavigation />
        
        {activeTab === 'received' ? (
          <ReceivedApplicationsView />
        ) : (
          <SentApplicationsView />
        )}
      </div>

      {/* Modal para Enviar Mensajes */}
      {showMessageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {messageType === 'documents' ? 'Solicitar Documentos Faltantes' : 'Solicitar Más Información'}
              </h2>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageText('');
                  setSelectedApplication(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Información de la Postulación */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Postulación:</h3>
                <p className="text-gray-700">{selectedApplication.properties.address_street} {selectedApplication.properties.address_number}</p>
                <p className="text-sm text-gray-600">
                  Postulante: {selectedApplication.structured_applicant?.full_name || 
                              getFullName(selectedApplication.profiles) || 
                              'No especificado'}
                </p>
              </div>

              {/* Campo de Mensaje */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje para el Postulante
                </label>
                <textarea
                  rows={8}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Escriba su mensaje aquí..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Este mensaje será enviado al email del postulante: {
                    selectedApplication.structured_applicant?.contact_email || 
                    getContactEmail(selectedApplication.profiles)
                  }
                </p>
              </div>

              {/* Información Adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Información del Envío</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El mensaje será enviado automáticamente al email del postulante</li>
                  <li>• Se guardará un registro de la comunicación en el sistema</li>
                  <li>• El postulante podrá responder directamente a tu email</li>
                </ul>
              </div>

              {/* Botones de Acción */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageText('');
                    setSelectedApplication(null);
                  }}
                  disabled={sendingMessage}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageText.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Enviar Mensaje</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Confirmar Deshacer Aceptación */}
      {showUndoModal && applicationToUndo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Deshacer Aceptación
              </h2>
              <button
                onClick={() => {
                  setShowUndoModal(false);
                  setApplicationToUndo(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Información de la Postulación */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">¿Estás seguro?</h3>
                    <p className="text-yellow-800 text-sm">
                      Esta acción revertirá la postulación de <strong>{applicationToUndo.structured_applicant?.full_name || getFullName(applicationToUndo.profiles) || 'el postulante'}</strong> para la propiedad <strong>{applicationToUndo.properties.address_street}</strong> de estado "Aprobada" a "Pendiente".
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles de la Postulación */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Detalles de la Postulación:</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Propiedad: </span>
                    <span className="font-medium">{applicationToUndo.properties.address_street}, {applicationToUndo.properties.address_commune}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Postulante: </span>
                    <span className="font-medium">{applicationToUndo.structured_applicant?.full_name || getFullName(applicationToUndo.profiles)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email: </span>
                    <span className="font-medium">{applicationToUndo.structured_applicant?.contact_email || getContactEmail(applicationToUndo.profiles)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Precio: </span>
                    <span className="font-medium">{formatPrice(applicationToUndo.properties.price_clp)}/mes</span>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">¿Qué sucederá?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El estado de la postulación cambiará de "Aprobada" a "Pendiente"</li>
                  <li>• Se enviará una notificación al postulante sobre este cambio</li>
                  <li>• Podrás volver a evaluar la postulación más adelante</li>
                  <li>• Esta acción se registrará en el sistema</li>
                </ul>
              </div>

              {/* Botones de Acción */}
              <div className="flex space-x-3">
                <CustomButton
                  variant="outline"
                  onClick={() => {
                    setShowUndoModal(false);
                    setApplicationToUndo(null);
                  }}
                  disabled={updating?.startsWith(applicationToUndo.id)}
                  className="flex-1"
                >
                  Cancelar
                </CustomButton>
                <CustomButton
                  variant="secondary"
                  onClick={confirmUndoAcceptance}
                  disabled={updating?.startsWith(applicationToUndo.id)}
                  loading={updating === `${applicationToUndo.id}-undo`}
                  loadingText="Revirtiendo..."
                  className="flex-1"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Deshacer Aceptación
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Condiciones del Contrato de Arriendo */}
      {showContractConditionsModal && applicationToApprove && (
        <RentalContractConditionsForm
          applicationId={applicationToApprove.id}
          propertyPrice={applicationToApprove.properties.price_clp}
          onSuccess={handleContractConditionsSuccess}
          onCancel={handleContractConditionsCancel}
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
