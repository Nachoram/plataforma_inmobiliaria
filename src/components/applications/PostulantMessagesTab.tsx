/**
 * PostulantMessagesTab.tsx - Sistema Avanzado de Mensajería para Postulantes
 *
 * Componente mejorado con indicadores visuales, categorización por tipo,
 * soporte para adjuntos y historial completo de conversación.
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  User,
  FileText,
  Paperclip,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import { postulantValidations } from '../../lib/postulantValidations';
import toast from 'react-hot-toast';

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

interface ApplicationData {
  id: string;
  property_id: string;
  properties: {
    owner_id: string;
  };
}

interface PostulantMessagesTabProps {
  messages: MessageData[];
  application: ApplicationData;
  onRefresh: () => void;
}

export const PostulantMessagesTab: React.FC<PostulantMessagesTabProps> = ({
  messages,
  application,
  onRefresh
}) => {
  const { user } = useAuth();
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // New message form state
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    message_type: 'general' as 'general' | 'contract_update' | 'document_request' | 'status_update' | 'clarification' | 'complaint',
    attachments: [] as File[]
  });

  // Filtrar mensajes por tipo
  const filteredMessages = filterType === 'all'
    ? messages
    : messages.filter(msg => msg.message_type === filterType);

  // Obtener tipos únicos de mensajes para el filtro
  const messageTypes = Array.from(new Set(messages.map(msg => msg.message_type)));

  // Función para enviar mensaje
  const handleSendMessage = async () => {
    if (!user || !newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    try {
      // Subir adjuntos si existen
      let attachments = [];
      if (newMessage.attachments.length > 0) {
        for (const file of newMessage.attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `message_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `messages/${application.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          attachments.push({
            name: file.name,
            url: filePath,
            size: file.size,
            type: file.type
          });
        }
      }

      const { data, error } = await supabase.rpc('send_application_message', {
        p_application_id: application.id,
        p_property_id: application.property_id,
        p_sender_id: user.id,
        p_sender_type: 'applicant',
        p_sender_name: user.user_metadata?.full_name || user.email || 'Postulante',
        p_recipient_id: application.properties.owner_id,
        p_recipient_type: 'landlord',
        p_recipient_name: 'Arrendador',
        p_subject: newMessage.subject,
        p_message: newMessage.message,
        p_message_type: newMessage.message_type,
        p_attachments: attachments,
        p_parent_message_id: null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });

      if (error) throw error;

      toast.success('Mensaje enviado correctamente');
      setNewMessage({ subject: '', message: '', message_type: 'general', attachments: [] });
      setShowNewMessageForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  // Función para marcar como leído
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

  // Función para expandir/colapsar mensaje
  const toggleMessageExpansion = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  // Función para obtener color del tipo de mensaje
  const getMessageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-blue-100 text-blue-800',
      'contract_update': 'bg-green-100 text-green-800',
      'document_request': 'bg-orange-100 text-orange-800',
      'status_update': 'bg-purple-100 text-purple-800',
      'clarification': 'bg-yellow-100 text-yellow-800',
      'complaint': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Función para obtener etiqueta del tipo de mensaje
  const getMessageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'general': 'General',
      'contract_update': 'Actualización Contrato',
      'document_request': 'Solicitud Documentos',
      'status_update': 'Actualización Estado',
      'clarification': 'Aclaración',
      'complaint': 'Reclamo'
    };
    return labels[type] || type;
  };

  // Función para manejar archivos adjuntos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate files
    const validation = postulantValidations.validateFiles(files, 5, 10);
    if (!validation.isValid) {
      toast.error(validation.error || 'Archivos no válidos');
      return;
    }

    // Check total count
    if (files.length + newMessage.attachments.length > 5) {
      toast.error('Máximo 5 archivos adjuntos permitidos');
      return;
    }

    setNewMessage(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  // Función para remover adjunto
  const removeAttachment = (index: number) => {
    setNewMessage(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Mensajes</h3>

          {/* Filtro por tipo */}
          {messageTypes.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los tipos</option>
                {messageTypes.map(type => (
                  <option key={type} value={type}>
                    {getMessageTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <CustomButton
          variant="primary"
          onClick={() => setShowNewMessageForm(true)}
          className="flex items-center space-x-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Nuevo Mensaje</span>
        </CustomButton>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-900">Total Mensajes</p>
              <p className="text-2xl font-bold text-blue-700">{messages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <EyeOff className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-900">Sin Leer</p>
              <p className="text-2xl font-bold text-orange-700">
                {messages.filter(m => !m.is_read && m.recipient_id === user?.id).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-900">Respondidos</p>
              <p className="text-2xl font-bold text-green-700">
                {messages.filter(m => m.is_read).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Nuevo Mensaje */}
      {showNewMessageForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-medium text-gray-900">Nuevo Mensaje</h4>
            <button
              onClick={() => setShowNewMessageForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Mensaje *
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
                  <option value="clarification">Petición de Aclaraciones</option>
                  <option value="complaint">Queja o Reclamo</option>
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

            {/* Adjuntos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjuntos (opcional)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <Paperclip className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {newMessage.attachments.length > 0
                      ? `${newMessage.attachments.length} archivo(s) seleccionado(s)`
                      : 'Seleccionar archivos'
                    }
                  </span>
                </label>

                {/* Lista de adjuntos */}
                {newMessage.attachments.length > 0 && (
                  <div className="space-y-2">
                    {newMessage.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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

      {/* Lista de Mensajes */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterType === 'all' ? 'No hay mensajes aún' : `No hay mensajes de tipo ${getMessageTypeLabel(filterType)}`}
          </h3>
          <p className="text-gray-500">
            {filterType === 'all' ? 'Inicia la conversación con el arrendador' : 'Cambia el filtro para ver otros mensajes'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((message) => {
              const isExpanded = expandedMessages.has(message.id);
              const isUnread = !message.is_read && message.recipient_id === user?.id;
              const isFromMe = message.sender_id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
                    isUnread ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => isUnread && markAsRead(message.id)}
                >
                  {/* Header del mensaje */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          message.sender_type === 'landlord' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <User className={`h-5 w-5 ${
                            message.sender_type === 'landlord' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">{message.sender_name}</p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMessageTypeColor(message.message_type)}`}>
                              {getMessageTypeLabel(message.message_type)}
                            </span>
                            {isUnread && (
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" title="No leído"></span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{message.sender_type === 'landlord' ? 'Arrendador' : 'Postulante'}</span>
                            <span>•</span>
                            <span>{new Date(message.created_at).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                            {message.attachments && message.attachments.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  {message.attachments.length} adjunto{message.attachments.length !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMessageExpansion(message.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Contenido del mensaje */}
                  <div className={`px-4 pb-4 ${isExpanded ? 'block' : 'hidden'}`}>
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>

                      {/* Adjuntos */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-2">Adjuntos:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map((attachment: any, index: number) => (
                              <a
                                key={index}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                              >
                                <FileText className="h-3 w-3" />
                                {attachment.name || `Adjunto ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
