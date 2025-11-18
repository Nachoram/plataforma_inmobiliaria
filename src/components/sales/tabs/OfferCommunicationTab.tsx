import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Lock,
  Unlock,
  Paperclip,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { SaleOffer, OfferCommunication, UserRole, CommunicationFormData } from '../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';

interface OfferCommunicationTabProps {
  offer: SaleOffer;
  userRole: UserRole | null;
  communications: OfferCommunication[];
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onCommunicationsChange: () => Promise<void>;
}

const OfferCommunicationTab: React.FC<OfferCommunicationTabProps> = ({
  offer,
  userRole,
  communications,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData,
  onCommunicationsChange
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [newMessage, setNewMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    scrollToBottom();
  }, [communications]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ========================================================================
  // COMMUNICATION FUNCTIONS
  // ========================================================================

  const handleSendMessage = async () => {
    if (!user || !offer.id || !newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_communications')
        .insert({
          offer_id: offer.id,
          message: newMessage.trim(),
          message_type: isPrivate ? 'nota_interna' : 'comunicación',
          author_id: user.id,
          author_role: userRole,
          is_private: isPrivate,
          visible_to_buyer: !isPrivate
        });

      if (error) throw error;

      toast.success('Mensaje enviado exitosamente');
      setNewMessage('');
      await onCommunicationsChange();

      await onAddTimelineEvent({
        event_type: 'comunicacion',
        event_title: isPrivate ? 'Nota privada agregada' : 'Mensaje enviado',
        event_description: isPrivate ? 'Se agregó una nota privada al proceso' : 'Se envió un mensaje de comunicación',
        related_data: { is_private: isPrivate }
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_communications')
        .update({
          message: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Mensaje editado exitosamente');
      setEditingMessage(null);
      setEditContent('');
      await onCommunicationsChange();

    } catch (error: any) {
      console.error('Error editing message:', error);
      toast.error('Error al editar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offer_communications')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Mensaje eliminado exitosamente');
      await onCommunicationsChange();

    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error('Error al eliminar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller': return 'bg-purple-100 text-purple-800';
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller': return 'Vendedor';
      case 'buyer': return 'Comprador';
      case 'admin': return 'Administrador';
      default: return role;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const canEditMessage = (message: OfferCommunication) => {
    return message.author_id === user?.id && userRole === 'admin';
  };

  const canDeleteMessage = (message: OfferCommunication) => {
    return message.author_id === user?.id || userRole === 'admin';
  };

  // Filtrar mensajes visibles según el rol del usuario
  const visibleCommunications = communications.filter(comm => {
    if (userRole === 'admin') return true;
    if (userRole === 'seller') return true; // Vendedores ven todo
    return comm.visible_to_buyer; // Compradores solo ven mensajes públicos
  });

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comunicación</h2>
          <p className="text-gray-600">Sistema de mensajes y notas para esta oferta</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MessageSquare className="w-4 h-4" />
          <span>{visibleCommunications.length} mensaje{visibleCommunications.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Messages List */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {visibleCommunications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay mensajes aún</h3>
              <p className="text-gray-600 max-w-sm">
                Los mensajes y notas de esta oferta aparecerán aquí. Comienza la conversación enviando tu primer mensaje.
              </p>
            </div>
          ) : (
            visibleCommunications.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getInitials(message.author_name)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {message.author_name || 'Usuario'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(message.author_role)}`}>
                      {getRoleLabel(message.author_role)}
                    </span>
                    {message.is_private && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        Privado
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>

                  {/* Message Text */}
                  {editingMessage === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessage(null);
                            setEditContent('');
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">
                        {message.message}
                      </p>

                      {/* Attachments */}
                      {message.attachment_ids && message.attachment_ids.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Paperclip className="w-3 h-3" />
                            <span>{message.attachment_ids.length} archivo{message.attachment_ids.length !== 1 ? 's' : ''} adjunto{message.attachment_ids.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.attachment_ids.map((attachmentId, index) => (
                              <button
                                key={attachmentId}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                              >
                                Archivo {index + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    {canEditMessage(message) && editingMessage !== message.id && (
                      <button
                        onClick={() => {
                          setEditingMessage(message.id);
                          setEditContent(message.message);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    {canDeleteMessage(message) && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-xs text-red-600 hover:text-red-800 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-3">
            {/* Private Message Toggle */}
            {(userRole === 'seller' || userRole === 'admin') && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1">
                    {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    Nota privada (solo visible para vendedores y admin)
                  </span>
                </label>

                <div className="text-xs text-gray-500">
                  {isPrivate ? 'Este mensaje será privado' : 'Este mensaje será visible para el comprador'}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isPrivate ? "Escribe una nota privada..." : "Escribe tu mensaje..."}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Presiona Ctrl+Enter para enviar
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Guías de Comunicación</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Mantén una comunicación profesional y respetuosa</li>
              <li>• Las notas privadas solo son visibles para vendedores y administradores</li>
              <li>• Incluye detalles específicos cuando solicites información adicional</li>
              <li>• Confirma recepciones importantes para mantener el proceso fluido</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferCommunicationTab;
