import { useCallback } from 'react';
import toast from 'react-hot-toast';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  className?: string;
  icon?: string;
  role?: 'status' | 'alert';
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

class OfferNotificationManager {
  // Notificaciones de carga
  loading(message: string, options?: NotificationOptions) {
    return toast.loading(message, {
      duration: 3000,
      ...options
    });
  }

  // Notificaciones de éxito
  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      duration: 4000,
      icon: '✅',
      ...options
    });
  }

  // Notificaciones de error
  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      duration: 5000,
      icon: '❌',
      role: 'alert',
      ...options
    });
  }

  // Notificaciones de advertencia
  warning(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b'
      },
      ...options
    });
  }

  // Notificaciones de información
  info(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: 3000,
      icon: 'ℹ️',
      style: {
        background: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #3b82f6'
      },
      ...options
    });
  }

  // Dismiss specific toast
  dismiss(toastId: string) {
    toast.dismiss(toastId);
  }

  // Dismiss all toasts
  dismissAll() {
    toast.dismiss();
  }

  // Notificaciones específicas para ofertas
  offerLoaded() {
    this.success('Detalles de la oferta cargados correctamente');
  }

  offerLoadError(error?: string) {
    this.error(error || 'Error al cargar los detalles de la oferta');
  }

  documentsLoaded() {
    this.success('Documentos cargados correctamente');
  }

  documentsLoadError() {
    this.error('Error al cargar los documentos');
  }

  messagesLoaded() {
    this.info('Mensajes actualizados');
  }

  messageSent() {
    this.success('Mensaje enviado correctamente');
  }

  messageSendError() {
    this.error('Error al enviar el mensaje');
  }

  documentUploaded(fileName: string) {
    this.success(`Documento "${fileName}" subido correctamente`);
  }

  documentUploadError(fileName?: string) {
    this.error(`Error al subir${fileName ? ` "${fileName}"` : ' el documento'}`);
  }

  offerUpdated() {
    this.success('Oferta actualizada correctamente');
  }

  offerUpdateError() {
    this.error('Error al actualizar la oferta');
  }

  permissionDenied(action?: string) {
    this.warning(`No tienes permisos para${action ? ` ${action}` : ' realizar esta acción'}`);
  }

  sessionExpired() {
    this.warning('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
      duration: 6000
    });
  }

  networkError() {
    this.error('Error de conexión. Verifica tu conexión a internet.', {
      duration: 6000
    });
  }

  cacheCleared() {
    this.info('Cache limpiado. Los datos se recargarán.');
  }

  dataRefreshed() {
    this.info('Datos actualizados desde el servidor');
  }
}

// Singleton instance
const offerNotifications = new OfferNotificationManager();

// Hook personalizado para notificaciones de ofertas
export const useOfferNotifications = () => {
  const notify = useCallback((type: keyof OfferNotificationManager, ...args: any[]) => {
    const method = offerNotifications[type as keyof OfferNotificationManager] as Function;
    if (method) {
      return method.apply(offerNotifications, args);
    }
  }, []);

  return {
    // Instancia del manager
    notifications: offerNotifications,

    // Métodos directos
    loading: useCallback((message: string, options?: NotificationOptions) =>
      offerNotifications.loading(message, options), []),

    success: useCallback((message: string, options?: NotificationOptions) =>
      offerNotifications.success(message, options), []),

    error: useCallback((message: string, options?: NotificationOptions) =>
      offerNotifications.error(message, options), []),

    warning: useCallback((message: string, options?: NotificationOptions) =>
      offerNotifications.warning(message, options), []),

    info: useCallback((message: string, options?: NotificationOptions) =>
      offerNotifications.info(message, options), []),

    // Notificaciones específicas para ofertas
    offerLoaded: useCallback(() => offerNotifications.offerLoaded(), []),
    offerLoadError: useCallback((error?: string) => offerNotifications.offerLoadError(error), []),

    documentsLoaded: useCallback(() => offerNotifications.documentsLoaded(), []),
    documentsLoadError: useCallback(() => offerNotifications.documentsLoadError(), []),

    messagesLoaded: useCallback(() => offerNotifications.messagesLoaded(), []),
    messageSent: useCallback(() => offerNotifications.messageSent(), []),
    messageSendError: useCallback(() => offerNotifications.messageSendError(), []),

    documentUploaded: useCallback((fileName: string) => offerNotifications.documentUploaded(fileName), []),
    documentUploadError: useCallback((fileName?: string) => offerNotifications.documentUploadError(fileName), []),

    offerUpdated: useCallback(() => offerNotifications.offerUpdated(), []),
    offerUpdateError: useCallback(() => offerNotifications.offerUpdateError(), []),

    permissionDenied: useCallback((action?: string) => offerNotifications.permissionDenied(action), []),
    sessionExpired: useCallback(() => offerNotifications.sessionExpired(), []),
    networkError: useCallback(() => offerNotifications.networkError(), []),

    cacheCleared: useCallback(() => offerNotifications.cacheCleared(), []),
    dataRefreshed: useCallback(() => offerNotifications.dataRefreshed(), []),

    // Utilidades
    dismiss: useCallback((toastId: string) => offerNotifications.dismiss(toastId), []),
    dismissAll: useCallback(() => offerNotifications.dismissAll(), []),

    // Método genérico
    notify
  };
};

// Hook para mostrar notificaciones de carga con cleanup automático
export const useLoadingNotification = (message: string) => {
  const { loading, dismiss } = useOfferNotifications();

  const startLoading = useCallback(() => {
    return loading(message);
  }, [loading, message]);

  const stopLoading = useCallback((toastId: string) => {
    dismiss(toastId);
  }, [dismiss]);

  return { startLoading, stopLoading };
};

export default useOfferNotifications;


