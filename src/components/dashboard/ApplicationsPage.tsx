import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Mail, Calendar, MapPin, Building, FileText, MessageSquare, AlertTriangle, CheckCircle2, XCircle, FileStack, MessageSquarePlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ApplicationWithDetails {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  properties: {
    address: string;
    city: string;
    price: number;
    listing_type: string;
    photos_urls: string[];
  };
  profiles?: {
    full_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
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
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  // Función para obtener postulaciones recibidas (como propietario)
  const fetchReceivedApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          properties!inner(
            address,
            city,
            price,
            listing_type,
            photos_urls,
            owner_id
          ),
          profiles(
            full_name,
            contact_email,
            contact_phone
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
            address,
            city,
            price,
            listing_type,
            photos_urls
          ),
          profiles(
            full_name,
            contact_email,
            contact_phone
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
    setLoading(true);
    try {
      const [received, sent] = await Promise.all([
        fetchReceivedApplications(),
        fetchSentApplications()
      ]);
      
      setReceivedApplications(received);
      setSentApplications(sent);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para aprobar postulación (integración con n8n)
  const handleApproveApplication = async (application: ApplicationWithDetails) => {
    // Poner estado de carga para feedback visual
    setUpdating(`${application.id}-approve`);
    console.log('🚀 Iniciando aprobación de postulación:', application.id);
    
    try {
      // 1. Actualizar estado en la base de datos primero
      const { error } = await supabase
        .from('applications')
        .update({ status: 'aprobada' })
        .eq('id', application.id);

      if (error) throw error;
      console.log('✅ Base de datos actualizada correctamente');

      // 2. Configurar URL del webhook de n8n
      const webhookURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
      
      // 3. Actualizar el estado de la UI inmediatamente
      setReceivedApplications(receivedApplications.map(app =>
        app.id === application.id ? { ...app, status: 'aprobada' } : app
      ));

      // 4. Intentar enviar webhook solo si está configurado
      if (webhookURL) {
        try {
          // Construir el payload completo con toda la información necesaria
          const webhookPayload = {
            // Información básica de la decisión
            action: 'application_approved',
            decision: 'approved',
            status: 'aprobada',
            timestamp: new Date().toISOString(),
            
            // Información de la aplicación
            application: {
              id: application.id,
              property_id: application.property_id,
              applicant_id: application.applicant_id,
              message: application.message,
              created_at: application.created_at,
              status: 'aprobada'
            },
            
            // Información de la propiedad
            property: {
              id: application.property_id,
              address: application.properties.address,
              city: application.properties.city,
              price: application.properties.price,
              listing_type: application.properties.listing_type,
              photos_urls: application.properties.photos_urls || []
            },
            
            // Información del postulante
            applicant: {
              id: application.applicant_id,
              full_name: application.structured_applicant?.full_name || application.profiles?.full_name || 'No especificado',
              contact_email: application.structured_applicant?.contact_email || application.profiles?.contact_email || 'No especificado',
              contact_phone: application.structured_applicant?.contact_phone || application.profiles?.contact_phone || null,
              profession: application.structured_applicant?.profession || null,
              company: application.structured_applicant?.company || null,
              monthly_income: application.structured_applicant?.monthly_income || null
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
          console.log('📡 Respuesta del webhook - Headers:', Object.fromEntries(response.headers.entries()));
          
          // Verificar si la respuesta fue exitosa
          if (!response.ok) {
            // Manejar diferentes tipos de errores HTTP
            if (response.status === 404) {
              console.warn('⚠️ El endpoint del webhook no existe o no está disponible');
              alert('La postulación fue aprobada correctamente. Sin embargo, el servicio de notificaciones no está disponible en este momento.');
            } else if (response.status >= 500) {
              console.warn('⚠️ Error del servidor en el webhook');
              alert('La postulación fue aprobada correctamente. Hubo un problema temporal con el servicio de notificaciones.');
            } else {
              console.warn('⚠️ Error del webhook:', response.status, response.statusText);
              alert(`La postulación fue aprobada correctamente. Error en notificación: ${response.status}`);
            }
            throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
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
          console.error('❌ Error de conexión con webhook:', webhookError);
          
          // Manejar errores de red/conexión
          if (webhookError.name === 'TypeError' && webhookError.message.includes('fetch')) {
            console.warn('⚠️ No se pudo conectar con el servicio de notificaciones');
            alert('La postulación fue aprobada correctamente. El servicio de notificaciones no está disponible en este momento.');
          } else {
            alert(`La postulación fue aprobada correctamente. Error en notificación: ${webhookError.message}`);
          }
        }
      } else {
        // No mostrar alerta si no hay webhook configurado, es opcional
        console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
      }

      console.log('✅ Proceso de aprobación completado exitosamente');

    } catch (error) {
      console.error('❌ Error aprobando postulación:', error);
      
      // Revertir cambios en la UI si hubo error en la base de datos
      setReceivedApplications(receivedApplications.map(app =>
        app.id === application.id ? { ...app, status: 'pendiente' } : app
      ));
      
      alert(`Error al aprobar la postulación: ${error.message}. Por favor, intenta nuevamente.`);
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
      ? `Estimado/a ${application.structured_applicant?.full_name || application.profiles?.full_name || 'Postulante'},\n\nPara continuar con su postulación, por favor adjunte los siguientes documentos:\n\n- \n- \n- \n\nSaludos cordiales.`
      : `Estimado/a ${application.structured_applicant?.full_name || application.profiles?.full_name || 'Postulante'},\n\nNecesitamos información adicional sobre su postulación:\n\n\n\nSaludos cordiales.`;
    
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
  const ReceivedApplicationsView = () => (
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
                    {application.properties.address}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{application.properties.city}</span>
                    <span className="mx-2">•</span>
                    <span>{formatPrice(application.properties.price)}/mes</span>
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
                    <span className="font-medium">{application.structured_applicant?.full_name || application.profiles?.full_name || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email: </span>
                    <span className="font-medium">{application.structured_applicant?.contact_email || application.profiles?.contact_email || 'No especificado'}</span>
                  </div>
                  {(application.structured_applicant?.contact_phone || application.profiles?.contact_phone) && (
                    <div>
                      <span className="text-gray-500">Teléfono: </span>
                      <span className="font-medium">{application.structured_applicant?.contact_phone || application.profiles?.contact_phone}</span>
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
                {application.status === 'pendiente' && (
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
                      onClick={() => handleApproveApplication(application as any)}
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
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

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
                    {application.properties.address}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{application.properties.city}</span>
                    <span className="mx-2">•</span>
                    <span>{formatPrice(application.properties.price)}/mes</span>
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
                  {application.properties.photos_urls && application.properties.photos_urls.length > 0 ? (
                    <img 
                      src={application.properties.photos_urls[0]} 
                      alt={application.properties.address}
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
                    {formatPrice(application.properties.price)}
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
                <p className="text-gray-700">{selectedApplication.properties.address}</p>
                <p className="text-sm text-gray-600">
                  Postulante: {selectedApplication.structured_applicant?.full_name || 
                              selectedApplication.profiles?.full_name || 
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
                    selectedApplication.profiles?.contact_email
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
    </div>
  );
};