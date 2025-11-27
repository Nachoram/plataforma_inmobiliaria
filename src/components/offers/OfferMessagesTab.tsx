import React, { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { SaleOffer, OfferCommunication, UserRole } from './types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface OfferMessagesTabProps {
  offer: SaleOffer;
  communications: OfferCommunication[];
  onCommunicationsChange?: () => Promise<void>;
  userRole?: 'buyer' | 'seller' | 'admin';
  onRefreshData?: () => Promise<void>;
  onSendMessage?: (message: string) => Promise<void>;
}

export const OfferMessagesTab: React.FC<OfferMessagesTabProps> = ({
  offer,
  communications,
  onCommunicationsChange
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [communications]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !offer.id) return;

    setSending(true);
    try {
      // Create new communication record
      const { error } = await supabase
        .from('offer_communications')
        .insert({
          offer_id: offer.id,
          message: newMessage.trim(),
          author_id: user.id,
          author_role: 'buyer',
          is_private: false,
          visible_to_buyer: true,
          created_at: new Date().toISOString()
        });

      if (error) {
          // Fallback if table doesn't exist or other error, maybe update offer message?
          // But we want to persist history. 
          // If table doesn't exist, we can't do much about history.
          throw error;
      }

      setNewMessage('');
      await onCommunicationsChange();
      toast.success('Mensaje enviado');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  // Combine initial offer message and seller response with communications if needed, 
  // or assume they are already in communications if migration script did that.
  // For now, we'll display them if communications is empty, or just rely on communications.
  // Actually, let's include the initial message as the first "chat bubble" if it's not in communications.
  
  // Sorting messages: oldest first for chat view
  const sortedMessages = [...communications].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Mensajes con el Vendedor
        </h3>
        <p className="text-sm text-gray-500">Historial de comunicación de esta oferta</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {/* Initial Offer Message */}
        {offer.message && (
            <div className="flex justify-end">
                <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-none p-4 shadow-sm">
                    <p className="text-sm">{offer.message}</p>
                    <div className="flex items-center justify-end gap-1 mt-2 text-blue-100 text-xs">
                        <span>{new Date(offer.created_at).toLocaleDateString()} {new Date(offer.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <CheckCircle className="w-3 h-3" />
                    </div>
                </div>
            </div>
        )}

        {/* Initial Seller Response */}
        {offer.seller_response && (
            <div className="flex justify-start">
                <div className="max-w-[80%] bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 mb-1">Vendedor</p>
                    <p className="text-sm">{offer.seller_response}</p>
                    <div className="flex items-center gap-1 mt-2 text-gray-400 text-xs">
                        <span>{offer.responded_at ? new Date(offer.responded_at).toLocaleDateString() : 'Fecha desconocida'}</span>
                    </div>
                </div>
            </div>
        )}

        {sortedMessages.map((msg) => {
          const isMe = msg.author_role === 'buyer' || msg.author_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                isMe 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                {!isMe && (
                  <p className="text-xs font-bold text-gray-500 mb-1">
                    {msg.author_name || (msg.author_role === 'seller' ? 'Vendedor' : 'Administrador')}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs ${isMe ? 'text-blue-100 justify-end' : 'text-gray-400'}`}>
                  <span>
                    {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {sortedMessages.length === 0 && !offer.message && !offer.seller_response && (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p>No hay mensajes aún.</p>
                <p className="text-sm">Envía un mensaje para comenzar la conversación.</p>
             </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default OfferMessagesTab;

