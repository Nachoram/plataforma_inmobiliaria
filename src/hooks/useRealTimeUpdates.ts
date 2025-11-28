import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface RealTimeUpdate {
  eventType: string;
  table: string;
  record: any;
  oldRecord?: any;
}

export interface UseRealTimeUpdatesOptions {
  onOfferUpdate?: (update: RealTimeUpdate) => void;
  onTaskUpdate?: (update: RealTimeUpdate) => void;
  onDocumentUpdate?: (update: RealTimeUpdate) => void;
  onTimelineUpdate?: (update: RealTimeUpdate) => void;
  onCommunicationUpdate?: (update: RealTimeUpdate) => void;
  onFormalRequestUpdate?: (update: RealTimeUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook personalizado para manejar actualizaciones en tiempo real
 * usando Supabase realtime subscriptions
 */
export const useRealTimeUpdates = (
  offerId: string | undefined,
  options: UseRealTimeUpdatesOptions = {}
) => {
  const {
    onOfferUpdate,
    onTaskUpdate,
    onDocumentUpdate,
    onTimelineUpdate,
    onCommunicationUpdate,
    onFormalRequestUpdate,
    enabled = true
  } = options;

  // Función para mostrar notificaciones toast inteligentes
  const showSmartToast = useCallback((update: RealTimeUpdate, action: string) => {
    const { eventType, table, record } = update;

    switch (table) {
      case 'property_sale_offers':
        if (eventType === 'UPDATE') {
          toast.success(`Estado de la oferta actualizado a: ${record.status?.replace('_', ' ')}`, {
            duration: 4000,
            icon: '📝'
          });
        }
        break;

      case 'offer_tasks':
        if (eventType === 'INSERT') {
          toast.success('Nueva tarea asignada', { duration: 3000, icon: '✅' });
        } else if (eventType === 'UPDATE' && record.status === 'completada') {
          toast.success('Tarea completada', { duration: 3000, icon: '🎉' });
        }
        break;

      case 'offer_documents':
        if (eventType === 'INSERT') {
          toast.success('Nuevo documento subido', { duration: 3000, icon: '📄' });
        } else if (eventType === 'UPDATE' && record.status === 'validado') {
          toast.success('Documento validado', { duration: 3000, icon: '✅' });
        }
        break;

      case 'offer_timeline':
        if (eventType === 'INSERT') {
          toast.info('Nuevo evento en el timeline', { duration: 2000, icon: '📅' });
        }
        break;

      case 'offer_communications':
        if (eventType === 'INSERT') {
          toast.info('Nuevo mensaje recibido', { duration: 3000, icon: '💬' });
        }
        break;

      case 'offer_formal_requests':
        if (eventType === 'INSERT') {
          toast.success('Nueva solicitud formal recibida', { duration: 4000, icon: '📋' });
        } else if (eventType === 'UPDATE' && record.status === 'completada') {
          toast.success('Solicitud completada', { duration: 3000, icon: '✅' });
        }
        break;
    }
  }, []);

  // Manejador de actualizaciones
  const handleUpdate = useCallback((update: RealTimeUpdate) => {
    const { table } = update;

    // Mostrar notificación inteligente
    showSmartToast(update, update.eventType);

    // Llamar callbacks específicos
    switch (table) {
      case 'property_sale_offers':
        onOfferUpdate?.(update);
        break;
      case 'offer_tasks':
        onTaskUpdate?.(update);
        break;
      case 'offer_documents':
        onDocumentUpdate?.(update);
        break;
      case 'offer_timeline':
        onTimelineUpdate?.(update);
        break;
      case 'offer_communications':
        onCommunicationUpdate?.(update);
        break;
      case 'offer_formal_requests':
        onFormalRequestUpdate?.(update);
        break;
    }
  }, [
    onOfferUpdate,
    onTaskUpdate,
    onDocumentUpdate,
    onTimelineUpdate,
    onCommunicationUpdate,
    onFormalRequestUpdate,
    showSmartToast
  ]);

  useEffect(() => {
    if (!offerId || !enabled) return;

    console.log('🔄 Configurando suscripciones en tiempo real para oferta:', offerId);

    // Suscripción a cambios en la oferta principal
    const offerChannel = supabase
      .channel(`offer-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_sale_offers',
          filter: `id=eq.${offerId}`
        },
        (payload) => {
          console.log('📡 Actualización en tiempo real - Oferta:', payload);
          handleUpdate({
            eventType: payload.eventType,
            table: 'property_sale_offers',
            record: payload.new,
            oldRecord: payload.old
          });
        }
      )
      .subscribe();

    // Suscripción a tareas de la oferta
    const tasksChannel = supabase
      .channel(`offer-tasks-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_tasks',
          filter: `offer_id=eq.${offerId}`
        },
        (payload) => {
          console.log('📡 Actualización en tiempo real - Tarea:', payload);
          handleUpdate({
            eventType: payload.eventType,
            table: 'offer_tasks',
            record: payload.new,
            oldRecord: payload.old
          });
        }
      )
      .subscribe();

    // Suscripción a documentos de la oferta
    const documentsChannel = supabase
      .channel(`offer-documents-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_documents',
          filter: `offer_id=eq.${offerId}`
        },
        (payload) => {
          console.log('📡 Actualización en tiempo real - Documento:', payload);
          handleUpdate({
            eventType: payload.eventType,
            table: 'offer_documents',
            record: payload.new,
            oldRecord: payload.old
          });
        }
      )
      .subscribe();

    // Suscripción a timeline de la oferta
    const timelineChannel = supabase
      .channel(`offer-timeline-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_timeline',
          filter: `offer_id=eq.${offerId}`
        },
        (payload) => {
          console.log('📡 Actualización en tiempo real - Timeline:', payload);
          handleUpdate({
            eventType: payload.eventType,
            table: 'offer_timeline',
            record: payload.new,
            oldRecord: payload.old
          });
        }
      )
      .subscribe();

    // Suscripción a comunicaciones de la oferta
    const communicationsChannel = supabase
      .channel(`offer-communications-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_communications',
          filter: `offer_id=eq.${offerId}`
        },
        (payload) => {
          console.log('📡 Actualización en tiempo real - Comunicación:', payload);
          handleUpdate({
            eventType: payload.eventType,
            table: 'offer_communications',
            record: payload.new,
            oldRecord: payload.old
          });
        }
      )
      .subscribe();

    // Suscripción a solicitudes formales de la oferta
    const formalRequestsChannel = supabase
      .channel(`offer-formal-requests-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offer_formal_requests',
          filter: `offer_id=eq.${offerId}`
        },
        (payload) => {
          console.log('📡 Actualización en tiempo real - Solicitud Formal:', payload);
          handleUpdate({
            eventType: payload.eventType,
            table: 'offer_formal_requests',
            record: payload.new,
            oldRecord: payload.old
          });
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('🔌 Limpiando suscripciones en tiempo real');

      offerChannel.unsubscribe();
      tasksChannel.unsubscribe();
      documentsChannel.unsubscribe();
      timelineChannel.unsubscribe();
      communicationsChannel.unsubscribe();
      formalRequestsChannel.unsubscribe();
    };
  }, [offerId, enabled, handleUpdate]);

  return {
    // Método para enviar actualizaciones manuales (útil para testing)
    sendTestUpdate: (update: RealTimeUpdate) => handleUpdate(update)
  };
};



