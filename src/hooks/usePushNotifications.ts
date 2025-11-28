import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  timestamp: number;
  read: boolean;
  type: 'offer_update' | 'task_due' | 'document_request' | 'communication' | 'system' | 'reminder';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actions?: NotificationAction[];
  expiresAt?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showBadge: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  types: {
    [K in PushNotification['type']]: {
      enabled: boolean;
      priority: PushNotification['priority'];
    };
  };
}

const DEFAULT_SETTINGS: PushNotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  showBadge: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  types: {
    offer_update: { enabled: true, priority: 'high' },
    task_due: { enabled: true, priority: 'high' },
    document_request: { enabled: true, priority: 'normal' },
    communication: { enabled: true, priority: 'normal' },
    system: { enabled: true, priority: 'low' },
    reminder: { enabled: true, priority: 'normal' }
  }
};

/**
 * Hook personalizado para manejar notificaciones push avanzadas
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<PushNotificationSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  // Verificar soporte y permisos
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        // Cargar configuración del usuario
        if (user) {
          await loadUserSettings();
        }
      }
    };

    checkSupport();
  }, [user]);

  // Cargar configuración del usuario desde Supabase
  const loadUserSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading notification settings:', error);
        return;
      }

      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      } else {
        // Crear configuración por defecto para el usuario
        await saveUserSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, [user]);

  // Guardar configuración del usuario
  const saveUserSettings = useCallback(async (newSettings: PushNotificationSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          settings: newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }, [user]);

  // Solicitar permisos de notificación
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
      }

      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Suscribirse a push notifications
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return;

    try {
      // Registrar service worker si no está registrado
      if (!registrationRef.current) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        registrationRef.current = registration;
      }

      // Suscribirse a push
      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // Esta clave debería venir de las variables de entorno
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      subscriptionRef.current = subscription;
      setIsSubscribed(true);

      // Enviar suscripción al servidor
      await sendSubscriptionToServer(subscription);

      console.log('✅ Push notifications subscribed');
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
    }
  }, [isSupported, permission]);

  // Desuscribirse de push notifications
  const unsubscribeFromPush = useCallback(async () => {
    if (!subscriptionRef.current) return;

    try {
      await subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      setIsSubscribed(false);

      // Remover suscripción del servidor
      await removeSubscriptionFromServer();

      console.log('✅ Push notifications unsubscribed');
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
    }
  }, []);

  // Enviar suscripción al servidor
  const sendSubscriptionToServer = useCallback(async (subscription: PushSubscription) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }, [user]);

  // Remover suscripción del servidor
  const removeSubscriptionFromServer = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }, [user]);

  // Mostrar notificación local
  const showNotification = useCallback((
    title: string,
    options: NotificationOptions & { type?: PushNotification['type'] }
  ) => {
    if (!isSupported || permission !== 'granted') return;

    const { type = 'system', ...notificationOptions } = options;

    // Verificar configuración y horas de silencio
    if (!isNotificationAllowed(type)) return;

    try {
      const notification = new Notification(title, {
        ...notificationOptions,
        icon: notificationOptions.icon || '/logo192.png',
        badge: notificationOptions.badge || '/logo192.png',
        tag: notificationOptions.tag || `notification-${Date.now()}`,
        requireInteraction: options.priority === 'urgent'
      });

      // Guardar en el estado local
      const pushNotification: PushNotification = {
        id: `local-${Date.now()}-${Math.random()}`,
        title,
        body: notificationOptions.body || '',
        icon: notificationOptions.icon,
        badge: notificationOptions.badge,
        tag: notificationOptions.tag,
        data: notificationOptions.data,
        timestamp: Date.now(),
        read: false,
        type,
        priority: options.priority || 'normal',
        actions: notificationOptions.actions,
        expiresAt: options.expiresAt
      };

      setNotifications(prev => [pushNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Auto-expirar si tiene expiresAt
      if (pushNotification.expiresAt) {
        setTimeout(() => {
          notification.close();
          removeNotification(pushNotification.id);
        }, pushNotification.expiresAt - Date.now());
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission]);

  // Verificar si la notificación está permitida
  const isNotificationAllowed = useCallback((type: PushNotification['type']) => {
    if (!settings.enabled) return false;
    if (!settings.types[type].enabled) return false;

    // Verificar horas de silencio
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMinute] = settings.quietHours.start.split(':').map(Number);
      const [endHour, endMinute] = settings.quietHours.end.split(':').map(Number);

      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (startTime < endTime) {
        // Horas de silencio en el mismo día
        if (currentTime >= startTime && currentTime <= endTime) return false;
      } else {
        // Horas de silencio cruzando medianoche
        if (currentTime >= startTime || currentTime <= endTime) return false;
      }
    }

    return true;
  }, [settings]);

  // Remover notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marcar notificación como leída
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Limpiar notificaciones expiradas
  const clearExpiredNotifications = useCallback(() => {
    const now = Date.now();
    setNotifications(prev => prev.filter(n => !n.expiresAt || n.expiresAt > now));
  }, []);

  // Actualizar configuración
  const updateSettings = useCallback(async (newSettings: Partial<PushNotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await saveUserSettings(updatedSettings);
  }, [settings, saveUserSettings]);

  // Notificaciones específicas por tipo
  const notifyOfferUpdate = useCallback((offerId: string, message: string, data?: any) => {
    showNotification('Actualización de Oferta', {
      body: message,
      icon: '/logo192.png',
      tag: `offer-${offerId}`,
      data: { offerId, ...data },
      type: 'offer_update',
      priority: settings.types.offer_update.priority,
      actions: [
        { action: 'view', title: 'Ver Oferta' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    });
  }, [showNotification, settings.types.offer_update.priority]);

  const notifyTaskDue = useCallback((taskId: string, title: string, dueDate: string) => {
    showNotification('Tarea Pendiente', {
      body: `${title} - Vence: ${new Date(dueDate).toLocaleDateString('es-ES')}`,
      icon: '/logo192.png',
      tag: `task-${taskId}`,
      data: { taskId, dueDate },
      type: 'task_due',
      priority: settings.types.task_due.priority,
      actions: [
        { action: 'complete', title: 'Marcar Completa' },
        { action: 'view', title: 'Ver Tarea' }
      ]
    });
  }, [showNotification, settings.types.task_due.priority]);

  const notifyDocumentRequest = useCallback((documentType: string, offerId: string) => {
    showNotification('Documento Requerido', {
      body: `Se requiere un ${documentType} para la oferta`,
      icon: '/logo192.png',
      tag: `document-${offerId}`,
      data: { documentType, offerId },
      type: 'document_request',
      priority: settings.types.document_request.priority,
      actions: [
        { action: 'upload', title: 'Subir Documento' },
        { action: 'view', title: 'Ver Oferta' }
      ]
    });
  }, [showNotification, settings.types.document_request.priority]);

  // Limpiar notificaciones expiradas periódicamente
  useEffect(() => {
    const interval = setInterval(clearExpiredNotifications, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [clearExpiredNotifications]);

  return {
    // Estado
    isSupported,
    isSubscribed,
    permission,
    settings,
    notifications,
    unreadCount,

    // Acciones principales
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updateSettings,

    // Gestión de notificaciones
    showNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearExpiredNotifications,

    // Notificaciones específicas
    notifyOfferUpdate,
    notifyTaskDue,
    notifyDocumentRequest,

    // Utilidades
    isNotificationAllowed
  };
};

// Función auxiliar para convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}



