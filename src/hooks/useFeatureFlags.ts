import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Tipos para feature flags
export type FeatureFlag = 'offer_details_refactor' | 'advanced_cache' | 'performance_monitoring' | 'toast_notifications';

export interface FeatureFlagsState {
  offer_details_refactor: boolean;
  advanced_cache: boolean;
  performance_monitoring: boolean;
  toast_notifications: boolean;
}

// Estado inicial - todos los flags en false por defecto (producción segura)
const initialFlags: FeatureFlagsState = {
  offer_details_refactor: false,
  advanced_cache: false,
  performance_monitoring: false,
  toast_notifications: false,
};

// Flags de desarrollo - activados en desarrollo
const developmentFlags: Partial<FeatureFlagsState> = {
  offer_details_refactor: true,
  advanced_cache: true,
  performance_monitoring: true,
  toast_notifications: true,
};

// Contexto de feature flags
interface FeatureFlagsContextType {
  flags: FeatureFlagsState;
  isEnabled: (flag: FeatureFlag) => boolean;
  enableFlag: (flag: FeatureFlag) => void;
  disableFlag: (flag: FeatureFlag) => void;
  toggleFlag: (flag: FeatureFlag) => void;
  resetFlags: () => void;
  loadFlagsFromStorage: () => void;
  saveFlagsToStorage: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

// Hook personalizado para usar feature flags
export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

// Función helper para determinar flags iniciales
const getInitialFlags = (customInitialFlags: Partial<FeatureFlagsState> = {}): FeatureFlagsState => {
  const isDevelopment = import.meta.env.DEV === true;
  const isPreview = import.meta.env.VITE_VERCEL_ENV === 'preview';

  let flags = { ...initialFlags };

  // En desarrollo, activar flags de desarrollo
  if (isDevelopment) {
    flags = { ...flags, ...developmentFlags };
  }

  // En preview, activar algunos flags para testing
  if (isPreview) {
    flags = {
      ...flags,
      offer_details_refactor: true,
      toast_notifications: true
    };
  }

  // Aplicar flags personalizados (por ejemplo, desde variables de entorno)
  flags = { ...flags, ...customInitialFlags };

  return flags;
};

// Hook principal para gestión de feature flags
export const useFeatureFlagsState = (customInitialFlags: Partial<FeatureFlagsState> = {}) => {
  const [flags, setFlags] = useState<FeatureFlagsState>(() => getInitialFlags(customInitialFlags));

  // Cargar flags desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('feature-flags');
        if (stored) {
          const parsedFlags = JSON.parse(stored);
          setFlags(prev => ({ ...prev, ...parsedFlags }));
        }
      } catch (error) {
        console.warn('Error loading feature flags from storage:', error);
      }
    }
  }, []);

  // Guardar flags a localStorage cuando cambien
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('feature-flags', JSON.stringify(flags));
      } catch (error) {
        console.warn('Error saving feature flags to storage:', error);
      }
    }
  }, [flags]);

  const isEnabled = (flag: FeatureFlag): boolean => {
    return flags[flag] || false;
  };

  const enableFlag = (flag: FeatureFlag): void => {
    setFlags(prev => ({ ...prev, [flag]: true }));
  };

  const disableFlag = (flag: FeatureFlag): void => {
    setFlags(prev => ({ ...prev, [flag]: false }));
  };

  const toggleFlag = (flag: FeatureFlag): void => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const resetFlags = (): void => {
    setFlags(getInitialFlags(customInitialFlags));
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('feature-flags');
      } catch (error) {
        console.warn('Error removing feature flags from storage:', error);
      }
    }
  };

  return {
    flags,
    isEnabled,
    enableFlag,
    disableFlag,
    toggleFlag,
    resetFlags
  };
};

// Hook específico para el refactor del OfferDetailsPanel
export const useOfferDetailsRefactor = () => {
  // Para compatibilidad, usar directamente el provider
  // En producción esto debería ser implementado correctamente
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    isEnabled: isDevelopment, // Solo activado en desarrollo por ahora
    useAdvancedCache: isDevelopment,
    usePerformanceMonitoring: isDevelopment,
    useToastNotifications: isDevelopment
  };
};

// Componente de debug para feature flags (implementado en archivo separado)
export const FeatureFlagsDebug: React.FC = () => null;

export default useFeatureFlags;
