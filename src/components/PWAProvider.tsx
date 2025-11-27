/**
 * PWAProvider.tsx
 *
 * Provider component that manages all PWA functionality
 * including service worker, offline detection, and install prompts
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { useAdvancedCaching } from '../hooks/useAdvancedCaching';
import toast from 'react-hot-toast';

interface PWAContextValue {
  // Service Worker
  isOnline: boolean;
  isSWRegistered: boolean;
  isSWInstalling: boolean;
  updateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;

  // Background Sync
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  pendingSyncCount: number;
  failedSyncCount: number;

  // Cache
  cacheStats: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };

  // Actions
  installPWA: () => Promise<boolean>;
  updateSW: () => void;
  syncNow: () => Promise<void>;
  clearCache: () => Promise<void>;
  showInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextValue | null>(null);

interface PWAProviderProps {
  children: React.ReactNode;
  enableOfflineSupport?: boolean;
  enableBackgroundSync?: boolean;
  enableCaching?: boolean;
  onUpdateAvailable?: () => void;
  onInstallPrompt?: (prompt: BeforeInstallPromptEvent) => void;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({
  children,
  enableOfflineSupport = true,
  enableBackgroundSync = true,
  enableCaching = true,
  onUpdateAvailable,
  onInstallPrompt
}) => {
  // Service Worker management
  const sw = useServiceWorker({
    autoUpdate: true,
    onUpdateAvailable: () => {
      onUpdateAvailable?.();
      toast.success('Nueva versión disponible. Actualizando...', {
        duration: 3000,
        icon: '🔄'
      });
    },
    onSyncCompleted: (data) => {
      toast.success(`${data.syncedCount} elementos sincronizados`, {
        icon: '✅'
      });
    },
    onSyncFailed: (error) => {
      toast.error('Error en sincronización. Reintentando...', {
        icon: '⚠️'
      });
    }
  });

  // Background sync management
  const sync = useBackgroundSync({
    enableBackgroundSync,
    onSyncSuccess: () => {
      toast.success('Sincronización completada', { icon: '🔄' });
    },
    onSyncError: (operation, error) => {
      toast.error(`Error sincronizando ${operation.type}`, { icon: '❌' });
    }
  });

  // Advanced caching
  const cache = useAdvancedCaching({
    namespace: 'pwa-cache',
    maxSize: 100 * 1024 * 1024, // 100MB
    enableStats: true,
    onCacheHit: (key) => {
      console.log('Cache hit:', key);
    },
    onCacheMiss: (key) => {
      console.log('Cache miss:', key);
    }
  });

  // Install prompt state
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallUI, setShowInstallUI] = useState(false);

  // PWA install prompt detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const prompt = event as BeforeInstallPromptEvent;
      setInstallPrompt(prompt);
      onInstallPrompt?.(prompt);

      // Auto-show install prompt after 30 seconds of activity
      setTimeout(() => {
        if (!prompt.userChoice) {
          setShowInstallUI(true);
        }
      }, 30000);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallUI(false);
      toast.success('¡Aplicación instalada correctamente!', {
        icon: '🎉',
        duration: 5000
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallUI(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstallPrompt]);

  // Offline/online detection with visual feedback
  useEffect(() => {
    if (!sw.isOnline) {
      toast('Sin conexión. Trabajando en modo offline.', {
        icon: '📱',
        duration: 3000
      });
    } else if (sw.isOnline && !sw.isRegistered) {
      // Back online and SW not registered, try to register
      sw.register();
    }
  }, [sw.isOnline, sw.isRegistered]);

  // Install PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      toast.error('No se puede instalar la aplicación en este momento');
      return false;
    }

    try {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        toast.success('Instalando aplicación...');
        setInstallPrompt(null);
        setShowInstallUI(false);
        return true;
      } else {
        toast('Instalación cancelada');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Error al instalar la aplicación');
      return false;
    }
  }, [installPrompt]);

  // Update service worker
  const updateSW = useCallback(() => {
    sw.skipWaiting();
  }, [sw]);

  // Sync now
  const syncNow = useCallback(async () => {
    await sync.syncNow();
  }, [sync]);

  // Clear cache
  const clearCache = useCallback(async () => {
    await cache.clear();
    toast.success('Cache limpiado', { icon: '🗑️' });
  }, [cache]);

  // Show install prompt
  const showInstallPrompt = useCallback(() => {
    setShowInstallUI(true);
  }, []);

  // Context value
  const contextValue: PWAContextValue = {
    // Service Worker
    isOnline: sw.isOnline,
    isSWRegistered: sw.isRegistered,
    isSWInstalling: sw.isInstalling,
    updateAvailable: sw.updateAvailable,
    installPrompt,

    // Background Sync
    syncStatus: sync.syncStatus,
    pendingSyncCount: sync.pendingCount,
    failedSyncCount: sync.failedCount,

    // Cache
    cacheStats: {
      hits: cache.stats.hits,
      misses: cache.stats.misses,
      size: cache.stats.size,
      hitRate: cache.stats.hitRate
    },

    // Actions
    installPWA,
    updateSW,
    syncNow,
    clearCache,
    showInstallPrompt
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}

      {/* PWA Install Prompt */}
      {showInstallUI && installPrompt && (
        <PWAInstallPrompt
          onInstall={installPWA}
          onDismiss={() => setShowInstallUI(false)}
        />
      )}

      {/* Offline Indicator */}
      {!sw.isOnline && (
        <OfflineIndicator />
      )}

      {/* Background Sync Indicator */}
      {sync.syncStatus !== 'idle' && (
        <SyncIndicator status={sync.syncStatus} />
      )}
    </PWAContext.Provider>
  );
};

/**
 * Hook to use PWA context
 */
export const usePWA = (): PWAContextValue => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

/**
 * PWA Install Prompt Component
 */
const PWAInstallPrompt: React.FC<{
  onInstall: () => void;
  onDismiss: () => void;
}> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Instalar Aplicación
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Instala Postulación Admin para acceder más rápido y trabajar offline.
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={onInstall}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={onDismiss}
                className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Después
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Offline Indicator Component
 */
const OfflineIndicator: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 18.364M12 3a9 9 0 110 18 9 9 0 010-18z" />
        </svg>
        <span className="text-sm font-medium">Sin conexión</span>
      </div>
    </div>
  );
};

/**
 * Background Sync Indicator Component
 */
const SyncIndicator: React.FC<{ status: 'syncing' | 'completed' | 'failed' }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          bg: 'bg-blue-500',
          icon: '🔄',
          text: 'Sincronizando...',
          animate: 'animate-spin'
        };
      case 'completed':
        return {
          bg: 'bg-green-500',
          icon: '✅',
          text: 'Sincronizado',
          animate: ''
        };
      case 'failed':
        return {
          bg: 'bg-red-500',
          icon: '❌',
          text: 'Error de sync',
          animate: ''
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className="fixed top-16 right-4 z-50">
      <div className={`text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${config.bg}`}>
        <span className={config.animate}>{config.icon}</span>
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  );
};

/**
 * PWA Status Dashboard Component (for debugging/admin)
 */
export const PWAStatusDashboard: React.FC = () => {
  const pwa = usePWA();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">PWA Status</div>
      <div>Online: {pwa.isOnline ? '✅' : '❌'}</div>
      <div>SW Registered: {pwa.isSWRegistered ? '✅' : '❌'}</div>
      <div>SW Installing: {pwa.isSWInstalling ? '⏳' : '❌'}</div>
      <div>Update Available: {pwa.updateAvailable ? '🔄' : '❌'}</div>
      <div>Sync Status: {pwa.syncStatus}</div>
      <div>Pending Sync: {pwa.pendingSyncCount}</div>
      <div>Failed Sync: {pwa.failedSyncCount}</div>
      <div>Cache Hits: {pwa.cacheStats.hits}</div>
      <div>Cache Misses: {pwa.cacheStats.misses}</div>
      <div>Cache Hit Rate: {(pwa.cacheStats.hitRate * 100).toFixed(1)}%</div>
      <div>Cache Size: {(pwa.cacheStats.size / 1024 / 1024).toFixed(2)} MB</div>
    </div>
  );
};
