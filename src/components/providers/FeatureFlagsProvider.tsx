import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureFlag, FeatureFlagsState, useFeatureFlagsState } from '../../hooks/useFeatureFlags';

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
