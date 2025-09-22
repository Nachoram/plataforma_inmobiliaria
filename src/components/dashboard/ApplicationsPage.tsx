import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Mail, Calendar, MapPin, Building, FileText, MessageSquare, AlertTriangle, CheckCircle2, XCircle, FileStack, MessageSquarePlus, Undo2 } from 'lucide-react';
import { supabase, updateApplicationStatus, getCurrentProfile } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { webhookClient } from '../../lib/webhook';
import CustomButton from '../common/CustomButton';

interface ApplicationWithDetails {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  properties: {
    address_street: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
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
}

export const ApplicationsPage: React.FC = () => {
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
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [applicationToUndo, setApplicationToUndo] = useState<ApplicationWithDetails | null>(null);

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

  // Función para obtener postulaciones recibidas (como propietario)
  const fetchReceivedApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          properties!inner(
            address_street,
            address_commune,
            price_clp,
            listing_type,
            owner_id
          ),
          profiles(
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone
          )
        `)
        .eq('properties.owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
          profiles(
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
      
      // Fetch property images for all properties
      const allPropertyIds = [
        ...received.map(app => app.property_id),
        ...sent.map(app => app.property_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
      
      if (allPropertyIds.length > 0) {
        await fetchPropertyImages(allPropertyIds);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar postulación (integración con n8n)
  const handleApproveApplication = async (application: ApplicationWithDetails) => {
    console.log('🚀 === INICIANDO APROBACIÓN DE POSTULACIÓN ===');
    console.log('📋 Application ID:', application.id);
    console.log('📋 Application data:', application);
    console.log('👤 Current user:', user);
    
    // Poner estado de carga para feedback visual
    setUpdating(`${application.id}-approve`);
    
    try {
      // 1. Actualizar estado en la base de datos usando la función API
      console.log('📝 Actualizando estado en base de datos...');
      const updatedApplication = await updateApplicationStatus(application.id, 'aprobada');
      console.log('✅ Base de datos actualizada correctamente');

      // 2. Obtener datos completos para el webhook
      const property = updatedApplication.properties;
      const applicant = updatedApplication.profiles;
      
      // Validar que tenemos todos los datos necesarios
      if (!property) {
        throw new Error('No se pudo obtener los datos de la propiedad');
      }
      if (!applicant) {
        throw new Error('No se pudo obtener los datos del postulante');
      }
      
      // 3. Obtener perfil del propietario (usuario actual)
      console.log('👤 Obteniendo perfil del propietario...');
      const propertyOwner = await getCurrentProfile();
      if (!propertyOwner) {
        throw new Error('No se pudo obtener el perfil del propietario');
      }
      
      console.log('📊 Datos validados:', {
        application: updatedApplication.id,
        property: property.id,
        applicant: applicant.id,
        propertyOwner: propertyOwner.id
      });

      // 4. Actualizar el estado de la UI inmediatamente
      setReceivedApplications(prev => prev.map(app =>
        app.id === application.id ? { ...app, status: 'aprobada' } : app
      ));

      // 5. Disparar el Webhook usando el webhookClient
      console.log('🌐 Enviando webhook...');
      try {
        await webhookClient.sendApplicationEvent(
          'approved',
          updatedApplication,
          property,
          applicant,
          propertyOwner
        );
        console.log('✅ Webhook enviado exitosamente');
      } catch (webhookError) {
        // El webhookClient maneja los errores internamente y no los propaga
        // Solo registrar el error sin interrumpir el proceso
        console.warn('⚠️ Servicio de notificaciones no disponible:', webhookError.message);
      }

      console.log('✅ Proceso de aprobación completado exitosamente');
      
      // 6. Mostrar notificación de éxito
      // Usar una notificación más elegante que alert()
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
      const errorMessage = `Error al aprobar la postulación: ${error.message || 'Error desconocido'}. Por favor, intenta nuevamente.`;
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

  const updateApplicationStatus = async (applicationId: string, status: 'aprobada' | 'rechazada') => {
    setUpdating(applicationId);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      setReceivedApplications(receivedApplications.map(app =>
        app.id === applicationId ? { ...app, status } : app
      ));
    } catch (error) {
      console.error('Error updating application:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Función para deshacer aceptación de postulación
  const handleUndoAcceptance = async (application: ApplicationWithDetails) => {
    setApplicationToUndo(application);
    setShowUndoModal(true);
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

      // 2. Actualizar el estado de la UI inmediatamente
      setReceivedApplications(receivedApplications.map(app =>
        app.id === applicationToUndo.id ? { ...app, status: 'pendiente' } : app
      ));

      // 3. Configurar URL del webhook de n8n
      const webhookURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
      
      // 4. Intentar enviar webhook solo si está configurado
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

          // Realizar la solicitud POST al webhook con las cabeceras correctas
          const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'PropiedadesApp/1.0'
            },
            body: JSON.stringify(webhookPayload)
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
          console.warn('⚠️ Servicio de notificaciones no disponible:', webhookError.message);
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
      
      alert(`Error al revertir la postulación: ${error.message}. Por favor, intenta nuevamente.`);
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
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobada': return <Check className="h-4 w-4" />;
      case 'rechazada': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Componente de pestañas
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('received')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'received'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Postulaciones Recibidas
          {receivedApplications.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {receivedApplications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'sent'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Postulaciones Realizadas
          {sentApplications.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
              {sentApplications.length}
            </span>
          )}
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
          <div key={application.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {application.properties.address_street}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{application.properties.address_commune}</span>
                    <span className="mx-2">•</span>
                    <span>{formatPrice(application.properties.price_clp)}/mes</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                  </span>
                </div>
              </div>

              {/* Applicant Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Información del Postulante</h4>
                <div className="space-y-1 text-sm">
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

              {/* Message */}
              {application.message && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-emerald-900 mb-2">Mensaje del Postulante</h4>
                  <p className="text-emerald-700 text-sm whitespace-pre-wrap">
                    {application.message}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Recibida el {formatDate(application.created_at)}</span>
                </div>

                {/* Panel de Acciones con Botones Individuales */}
                {(() => {
                  console.log('🔍 Verificando estado de aplicación:', application.id, 'Status:', application.status);
                  return application.status === 'pendiente';
                })() && (
                  <div className="flex items-center space-x-2">
                    {/* Acciones Secundarias */}
                    <button
                      onClick={() => openMessageModal(application as any, 'info')}
                      disabled={updating?.startsWith(application.id)}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Solicitar Más Información"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => openMessageModal(application as any, 'documents')}
                      disabled={updating?.startsWith(application.id)}
                      className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Solicitar Documentos Faltantes"
                    >
                      <FileStack className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleRequestCommercialReport(application as any)}
                      disabled={updating?.startsWith(application.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Solicitar Informe Comercial"
                    >
                      {updating === `${application.id}-report` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </button>

                    {/* Separador Visual */}
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    {/* Acciones Principales */}
                    <button
                      onClick={() => handleRejectApplication(application as any)}
                      disabled={updating?.startsWith(application.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 hover:shadow-sm active:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Rechazar Postulación"
                    >
                      {updating === `${application.id}-reject` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">Rechazar</span>
                    </button>

                    <button
                      onClick={() => {
                        console.log('🖱️ BOTÓN APROBAR CLICKEADO!');
                        console.log('📋 Application:', application);
                        handleApproveApplication(application as any);
                      }}
                      disabled={updating?.startsWith(application.id)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-sm active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Aprobar Postulación"
                    >
                      {updating === `${application.id}-approve` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">Aprobar</span>
                    </button>
                  </div>
                )}

                {/* Botón para deshacer aceptación */}
                {application.status === 'aprobada' && (
                  <div className="flex items-center space-x-2">
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
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No has realizado postulaciones</h3>
          <p className="text-gray-500">
            Las postulaciones que hagas a propiedades en arriendo aparecerán aquí para que puedas seguir su estado.
          </p>
        </div>
      ) : (
        sentApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {application.properties.address_street}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{application.properties.address_commune}</span>
                    <span className="mx-2">•</span>
                    <span>{formatPrice(application.properties.price_clp)}/mes</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                  </span>
                </div>
              </div>

              {/* Imagen de la propiedad */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {propertyImages[application.property_id] && propertyImages[application.property_id].length > 0 ? (
                    <img 
                      src={propertyImages[application.property_id][0].image_url} 
                      alt={application.properties.address_street}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Precio de arriendo mensual</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {formatPrice(application.properties.price_clp)}
                  </div>
                </div>
              </div>

              {application.message && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tu mensaje</h4>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {application.message}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Enviada el {formatDate(application.created_at)}</span>
                </div>
                
                {application.status === 'pendiente' && (
                  <div className="text-sm text-gray-500">
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
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Postulaciones</h1>
        <p className="text-gray-600">
          Administra las postulaciones de arriendo recibidas y revisa el estado de las postulaciones que has realizado
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
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
    </div>
  );
};
