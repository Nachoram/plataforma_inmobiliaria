import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureFlag, FeatureFlagsState } from '../../hooks/useFeatureFlags';

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

// Función para obtener flags iniciales
const getInitialFlags = (customInitialFlags: Partial<FeatureFlagsState> = {}): FeatureFlagsState => {
  // En desarrollo, activar flags de desarrollo
  const isDevelopment = import.meta.env.DEV;

  let flags = { ...initialFlags };

  if (isDevelopment) {
    flags = { ...flags, ...developmentFlags };
  }

  // Aplicar flags personalizados (desde props o variables de entorno)
  flags = { ...flags, ...customInitialFlags };

  return flags;
};

// Hook principal para gestión de feature flags
const useFeatureFlagsState = (customInitialFlags: Partial<FeatureFlagsState> = {}) => {
  const [flags, setFlags] = useState<FeatureFlagsState>(() => getInitialFlags(customInitialFlags));

  // Cargar flags desde localStorage al inicializar (solo en el cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('feature-flags');
        if (stored) {
          const parsedFlags = JSON.parse(stored);
          setFlags(prev => ({ ...prev, ...parsedFlags }));
        }
      } catch (error) {
        console.warn('Error loading feature flags from localStorage:', error);
      }
    }
  }, []);

  // Guardar automáticamente en localStorage cuando cambian los flags (solo en el cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('feature-flags', JSON.stringify(flags));
      } catch (error) {
        console.warn('Error saving feature flags to localStorage:', error);
      }
    }
  }, [flags]);

  // Función para verificar si un flag está habilitado
  const isEnabled = (flag: FeatureFlag): boolean => {
    return Boolean(flags[flag]);
  };

  // Función para habilitar un flag
  const enableFlag = (flag: FeatureFlag): void => {
    setFlags(prev => ({ ...prev, [flag]: true }));
  };

  // Función para deshabilitar un flag
  const disableFlag = (flag: FeatureFlag): void => {
    setFlags(prev => ({ ...prev, [flag]: false }));
  };

  // Función para alternar un flag
  const toggleFlag = (flag: FeatureFlag): void => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  // Función para resetear flags a valores iniciales
  const resetFlags = (): void => {
    setFlags(getInitialFlags(customInitialFlags));
  };

  return {
    flags,
    isEnabled,
    enableFlag,
    disableFlag,
    toggleFlag,
    resetFlags,
  };
};

// Contexto de feature flags
interface FeatureFlagsContextType {
  flags: FeatureFlagsState;
  isEnabled: (flag: FeatureFlag) => boolean;
  enableFlag: (flag: FeatureFlag) => void;
  disableFlag: (flag: FeatureFlag) => void;
  toggleFlag: (flag: FeatureFlag) => void;
  resetFlags: () => void;
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

// Provider de feature flags
interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  initialFlags?: Partial<FeatureFlagsState>;
  persistToStorage?: boolean;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  initialFlags: customInitialFlags = {},
  persistToStorage = true
}) => {
  const featureFlagsState = useFeatureFlagsState(customInitialFlags);

  const contextValue: FeatureFlagsContextType = {
    ...featureFlagsState
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Componente de debug para feature flags (solo en desarrollo)
export const FeatureFlagsDebug: React.FC = () => {
  const { flags, toggleFlag, resetFlags } = useFeatureFlags();

  // Solo mostrar en desarrollo
  if (import.meta.env.DEV !== true) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Feature Flags</h3>
        <button
          onClick={resetFlags}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Reset
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(flags).map(([flag, enabled]) => (
          <div key={flag} className="flex items-center justify-between">
            <span className="text-xs text-gray-600 capitalize">
              {flag.replace(/_/g, ' ')}
            </span>
            <button
              onClick={() => toggleFlag(flag as FeatureFlag)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
