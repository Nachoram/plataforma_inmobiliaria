import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  updateAvailable: boolean;
  offlineReady: boolean;
  cacheStats?: {
    cacheSize: number;
    cacheNames: string[];
  };
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  updateServiceWorker: () => void;
  clearCache: () => Promise<void>;
  getCacheStats: () => Promise<void>;
  sendMessage: (message: any) => void;
}

/**
 * Hook personalizado para manejar Service Worker y funcionalidades offline
 */
export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    updateAvailable: false,
    offlineReady: false
  });

  // Función para registrar mensajes del Service Worker
  const handleMessage = useCallback((event: MessageEvent) => {
    const { type, ...data } = event.data;

    switch (type) {
      case 'BACKGROUND_SYNC_COMPLETE':
        console.log('🔄 Background sync completed');
        // Notificar al usuario que los datos se sincronizaron
        break;

      case 'CACHE_STATS':
        setState(prev => ({
          ...prev,
          cacheStats: data
        }));
        break;

      default:
        console.log('Service Worker message:', type, data);
    }
  }, []);

  // Función para registrar el Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!state.isSupported) return;

    try {
      console.log('🔧 Registering Service Worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Escuchar cambios en el estado del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          console.log('📦 New Service Worker installing...');

          setState(prev => ({ ...prev, isInstalling: true }));

          newWorker.addEventListener('statechange', () => {
            console.log('🔄 Service Worker state:', newWorker.state);

            switch (newWorker.state) {
              case 'installed':
                if (navigator.serviceWorker.controller) {
                  // Hay una actualización disponible
                  console.log('🔄 Service Worker update available');
                  setState(prev => ({
                    ...prev,
                    isInstalling: false,
                    isWaiting: true,
                    updateAvailable: true
                  }));
                } else {
                  // Primera instalación
                  console.log('🎉 Service Worker installed for first time');
                  setState(prev => ({
                    ...prev,
                    isInstalling: false,
                    offlineReady: true
                  }));
                }
                break;

              case 'activated':
                console.log('🚀 Service Worker activated');
                setState(prev => ({
                  ...prev,
                  isWaiting: false,
                  isActive: true,
                  updateAvailable: false
                }));
                break;

              case 'redundant':
                console.log('❌ Service Worker installation failed');
                setState(prev => ({
                  ...prev,
                  isInstalling: false,
                  isWaiting: false
                }));
                break;
            }
          });
        }
      });

      // Verificar si ya hay un Service Worker activo
      if (registration.active) {
        console.log('✅ Service Worker already active');
        setState(prev => ({
          ...prev,
          isRegistered: true,
          isActive: true,
          offlineReady: true
        }));
      }

      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', handleMessage);

      setState(prev => ({ ...prev, isRegistered: true }));

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      setState(prev => ({ ...prev, isSupported: false }));
    }
  }, [state.isSupported, handleMessage]);

  // Función para actualizar el Service Worker
  const updateServiceWorker = useCallback(() => {
    if (!state.isWaiting) return;

    console.log('🔄 Updating Service Worker...');

    // Enviar mensaje al Service Worker para que se active
    navigator.serviceWorker.controller?.postMessage({
      type: 'SKIP_WAITING'
    });
  }, [state.isWaiting]);

  // Función para limpiar cache
  const clearCache = useCallback(async () => {
    try {
      console.log('🗑️ Clearing Service Worker cache...');

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Enviar mensaje al Service Worker para limpiar cache
        const messageChannel = new MessageChannel();

        registration.active?.postMessage({
          type: 'CLEAR_CACHE'
        }, [messageChannel.port2]);

        await new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              console.log('✅ Cache cleared successfully');
              setState(prev => ({
                ...prev,
                cacheStats: undefined
              }));
            }
            resolve(event.data);
          };
        });
      }
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }, []);

  // Función para obtener estadísticas del cache
  const getCacheStats = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const messageChannel = new MessageChannel();

        registration.active?.postMessage({
          type: 'GET_CACHE_STATS'
        }, [messageChannel.port2]);

        // El resultado se maneja en handleMessage
      }
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
    }
  }, []);

  // Función para enviar mensajes al Service Worker
  const sendMessage = useCallback((message: any) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }, []);

  // Efecto para registrar el Service Worker
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  // Efecto para obtener estadísticas iniciales del cache
  useEffect(() => {
    if (state.isActive) {
      getCacheStats();
    }
  }, [state.isActive, getCacheStats]);

  // Efecto para detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connection restored');
      // Intentar sincronizar datos pendientes
      sendMessage({ type: 'SYNC_PENDING_DATA' });
    };

    const handleOffline = () => {
      console.log('📴 Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sendMessage]);

  // Efecto para manejar actualizaciones automáticas (opcional)
  useEffect(() => {
    if (state.updateAvailable) {
      // Auto-update después de 10 segundos si el usuario no interactúa
      const autoUpdateTimer = setTimeout(() => {
        console.log('⏰ Auto-updating Service Worker...');
        updateServiceWorker();
      }, 10000);

      return () => clearTimeout(autoUpdateTimer);
    }
  }, [state.updateAvailable, updateServiceWorker]);

  return {
    ...state,
    updateServiceWorker,
    clearCache,
    getCacheStats,
    sendMessage
  };
};