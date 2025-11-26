/**
 * PostulantTabComponents.tsx
 * Componentes de pestañas para el panel del postulante
 */

import React, { useState } from 'react';
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Paperclip,
  X,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface ApplicationData {
  id: string;
  property_id: string;
  applicant_id: string;
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'finalizada' | 'modificada';
  message: string | null;
  created_at: string;
  updated_at: string;
  score?: number;
  application_characteristic_id?: string | null;
  has_contract_conditions?: boolean;
  has_contract?: boolean;
  contract_signed?: boolean;
  modification_count?: number;
  audit_log_count?: number;
  properties: {
    id: string;
    address_street: string;
    address_number?: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
    owner_id: string;
  };
  applicants?: any[];
  guarantors?: any[];
  application_applicants?: any[];
  application_guarantors?: any[];
}

interface MessageData {
  id: string;
  sender_id: string;
  sender_type: 'applicant' | 'landlord';
  sender_name: string;
  recipient_id: string;
  recipient_type: 'applicant' | 'landlord';
  recipient_name: string;
  subject: string;
  message: string;
  message_type: string;
  attachments: any[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  parent_message_id?: string;
  conversation_id: string;
}

interface RequestData {
  id: string;
  applicant_id: string;
  applicant_name: string;
  landlord_id: string;
  landlord_name: string;
  request_type: string;
  subject: string;
  description: string;
  requested_changes: any;
  attachments: any[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  status_changed_at: string;
  response?: string;
  response_attachments?: any[];
  responded_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  internal_notes?: string;
}

// ========================================================================
// APPLICATION DETAILS TAB
// ========================================================================

export const ApplicationDetailsTab: React.FC<{ application: ApplicationData }> = ({ application }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Postulación</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Estado Actual</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                application.status === 'aprobada' ? 'bg-green-100 text-green-800' :
                application.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                application.status === 'finalizada' ? 'bg-blue-100 text-blue-800' :
                application.status === 'modificada' ? 'bg-amber-100 text-amber-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {application.status === 'aprobada' ? 'Aprobada' :
                 application.status === 'rechazada' ? 'Rechazada' :
                 application.status === 'finalizada' ? 'Finalizada' :
                 application.status === 'modificada' ? 'Modificada' :
                 'En Revisión'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Última actualización: {new Date(application.updated_at).toLocaleDateString('es-CL')}
            </p>
          </div>

          {/* Message Card */}
          {application.message && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Mensaje Original</h4>
              <p className="text-sm text-gray-700 italic">"{application.message}"</p>
            </div>
          )}
        </div>
      </div>

      {/* TODO: Add more detailed information about applicants, guarantors, etc. */}
      <div className="text-center py-8 text-gray-500">
        <p>Información detallada de postulantes y garantes próximamente...</p>
      </div>
    </div>
  );
};

// ========================================================================
// MESSAGES TAB
// ========================================================================

export const MessagesTab: React.FC<{
  messages: MessageData[];
  application: ApplicationData;
  onRefresh: () => void;
}> = ({ messages, application, onRefresh }) => {
  const { user } = useAuth();
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [sending, setSending] = useState(false);

  // New message form state
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    message_type: 'general' as 'general' | 'contract_update' | 'document_request' | 'status_update'
  });

  const handleSendMessage = async () => {
    if (!user || !newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc('send_application_message', {
        p_application_id: application.id,
        p_property_id: application.property_id,
        p_sender_id: user.id,
        p_sender_type: 'applicant',
        p_sender_name: user.user_metadata?.full_name || user.email || 'Postulante',
        p_recipient_id: application.properties.owner_id,
        p_recipient_type: 'landlord',
        p_recipient_name: 'Arrendador', // TODO: Get actual landlord name
        p_subject: newMessage.subject,
        p_message: newMessage.message,
        p_message_type: newMessage.message_type,
        p_attachments: [],
        p_parent_message_id: null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (error) throw error;

      toast.success('Mensaje enviado correctamente');
      setNewMessage({ subject: '', message: '', message_type: 'general' });
      setShowNewMessageForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_message_as_read', {
        p_message_id: messageId,
        p_user_id: user.id
      });

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Mensajes</h3>
        <CustomButton
          variant="primary"
          onClick={() => setShowNewMessageForm(true)}
          className="flex items-center space-x-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Nuevo Mensaje</span>
        </CustomButton>
      </div>

      {/* New Message Form */}
      {showNewMessageForm && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Nuevo Mensaje</h4>
            <button
              onClick={() => setShowNewMessageForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Mensaje
              </label>
              <select
                value={newMessage.message_type}
                onChange={(e) => setNewMessage(prev => ({ ...prev, message_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="contract_update">Actualización de Contrato</option>
                <option value="document_request">Solicitud de Documentos</option>
                <option value="status_update">Actualización de Estado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Asunto del mensaje"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje *
              </label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe tu mensaje aquí..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <CustomButton
                variant="secondary"
                onClick={() => setShowNewMessageForm(false)}
                disabled={sending}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={handleSendMessage}
                disabled={sending || !newMessage.subject.trim() || !newMessage.message.trim()}
              >
                {sending ? 'Enviando...' : 'Enviar Mensaje'}
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes aún</h3>
          <p className="text-gray-500">Inicia la conversación con el arrendador</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white border rounded-lg p-4 ${
                !message.is_read && message.recipient_id === user?.id ? 'border-blue-300 bg-blue-50' : ''
              }`}
              onClick={() => !message.is_read && message.recipient_id === user?.id && markAsRead(message.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender_type === 'landlord' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <User className={`h-4 w-4 ${
                      message.sender_type === 'landlord' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{message.sender_name}</p>
                    <p className="text-sm text-gray-500">
                      {message.sender_type === 'landlord' ? 'Arrendador' : 'Postulante'}
                      {message.message_type !== 'general' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded">
                          {message.message_type}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {!message.is_read && message.recipient_id === user?.id && (
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2" title="No leído"></span>
                  )}
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{message.subject}</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Adjuntos:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.attachments.map((attachment: any, index: number) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                      >
                        <FileText className="h-3 w-3" />
                        {attachment.name || `Adjunto ${index + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================================================
// CONTRACT TAB
// ========================================================================

export const ContractTab: React.FC<{ application: ApplicationData }> = ({ application }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contrato</h3>

        {application.has_contract ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
              <h4 className="text-lg font-medium text-green-800">Contrato Disponible</h4>
            </div>
            <p className="text-green-700 mb-4">
              Tu contrato ha sido generado y está listo para revisión.
            </p>
            <div className="flex gap-3">
              <CustomButton variant="primary">
                <Eye className="h-4 w-4 mr-2" />
                Ver Contrato
              </CustomButton>
              <CustomButton variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Descargar PDF
              </CustomButton>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-yellow-400 mr-3" />
              <h4 className="text-lg font-medium text-yellow-800">Contrato en Preparación</h4>
            </div>
            <p className="text-yellow-700">
              El contrato está siendo preparado por el arrendador. Te notificaremos cuando esté disponible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================================================
// REQUESTS TAB
// ========================================================================

export const RequestsTab: React.FC<{
  requests: RequestData[];
  application: ApplicationData;
  onRefresh: () => void;
}> = ({ requests, application, onRefresh }) => {
  const { user } = useAuth();
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [sending, setSending] = useState(false);

  // New request form state
  const [newRequest, setNewRequest] = useState({
    request_type: 'modification' as 'condition_change' | 'extension_request' | 'early_termination' | 'modification' | 'document_request' | 'clarification' | 'complaint' | 'other',
    subject: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    requested_changes: {} as any
  });

  const requestTypeLabels = {
    condition_change: 'Cambio de Condiciones',
    extension_request: 'Solicitud de Prórroga',
    early_termination: 'Terminación Anticipada',
    modification: 'Modificación General',
    document_request: 'Solicitud de Documentos',
    clarification: 'Petición de Aclaraciones',
    complaint: 'Queja o Reclamo',
    other: 'Otro'
  };

  const handleSendRequest = async () => {
    if (!user || !newRequest.subject.trim() || !newRequest.description.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc('create_application_request', {
        p_application_id: application.id,
        p_property_id: application.property_id,
        p_applicant_id: user.id,
        p_applicant_name: user.user_metadata?.full_name || user.email || 'Postulante',
        p_landlord_id: application.properties.owner_id,
        p_landlord_name: 'Arrendador', // TODO: Get actual landlord name
        p_request_type: newRequest.request_type,
        p_subject: newRequest.subject,
        p_description: newRequest.description,
        p_requested_changes: newRequest.requested_changes,
        p_attachments: [],
        p_priority: newRequest.priority,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (error) throw error;

      toast.success('Solicitud enviada correctamente');
      setNewRequest({
        request_type: 'modification',
        subject: '',
        description: '',
        priority: 'normal',
        requested_changes: {}
      });
      setShowNewRequestForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'pending': return 'Pendiente';
      case 'under_review': return 'En Revisión';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Solicitudes</h3>
        <CustomButton
          variant="primary"
          onClick={() => setShowNewRequestForm(true)}
          className="flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>Nueva Solicitud</span>
        </CustomButton>
      </div>

      {/* New Request Form */}
      {showNewRequestForm && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Nueva Solicitud</h4>
            <button
              onClick={() => setShowNewRequestForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Solicitud *
                </label>
                <select
                  value={newRequest.request_type}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, request_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(requestTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                value={newRequest.subject}
                onChange={(e) => setNewRequest(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Asunto breve de la solicitud"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción Detallada *
              </label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe detalladamente tu solicitud..."
                required
              />
            </div>

            {/* Specific fields based on request type */}
            {newRequest.request_type === 'condition_change' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cambios Específicos Solicitados
                </label>
                <textarea
                  value={JSON.stringify(newRequest.requested_changes, null, 2)}
                  onChange={(e) => {
                    try {
                      const changes = JSON.parse(e.target.value);
                      setNewRequest(prev => ({ ...prev, requested_changes: changes }));
                    } catch {
                      // Allow invalid JSON temporarily
                      setNewRequest(prev => ({ ...prev, requested_changes: e.target.value }));
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder='{"renta": "500000", "plazo": "24 meses", ...}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Especifica los cambios en formato JSON (ej: nueva renta, plazo, etc.)
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <CustomButton
                variant="secondary"
                onClick={() => setShowNewRequestForm(false)}
                disabled={sending}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={handleSendRequest}
                disabled={sending || !newRequest.subject.trim() || !newRequest.description.trim()}
              >
                {sending ? 'Enviando...' : 'Enviar Solicitud'}
              </CustomButton>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes aún</h3>
          <p className="text-gray-500">Envía una solicitud formal al arrendador</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{request.subject}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                      {request.priority === 'urgent' ? 'Urgente' :
                       request.priority === 'high' ? 'Alta' :
                       request.priority === 'normal' ? 'Normal' : 'Baja'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Tipo: {requestTypeLabels[request.request_type] || request.request_type}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{request.description}</p>

              {request.response && (
                <div className="bg-gray-50 border-l-4 border-blue-400 p-3 mb-3">
                  <p className="text-sm font-medium text-gray-900 mb-1">Respuesta del arrendador:</p>
                  <p className="text-sm text-gray-700">{request.response}</p>
                  {request.responded_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Respondido: {new Date(request.responded_at).toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Enviada: {new Date(request.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span>
                  Estado actualizado: {new Date(request.status_changed_at).toLocaleDateString('es-CL')}
                </span>
              </div>

              {request.attachments && request.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Adjuntos:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.attachments.map((attachment: any, index: number) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                      >
                        <FileText className="h-3 w-3" />
                        {attachment.name || `Adjunto ${index + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
