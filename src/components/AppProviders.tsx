import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { FeatureFlagsProvider } from './providers/FeatureFlagsProvider';
import { AppContent } from './AppContent';

// Flags iniciales desde variables de entorno
const getInitialFlags = () => {
  const flags: any = {};

  // Leer flags desde variables de entorno (para CI/CD) - usando import.meta.env para Vite
  if (import.meta.env.VITE_ENABLE_OFFER_DETAILS_REFACTOR === 'true') {
    flags.offer_details_refactor = true;
  }
  if (import.meta.env.VITE_ENABLE_ADVANCED_CACHE === 'true') {
    flags.advanced_cache = true;
  }
  if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
    flags.performance_monitoring = true;
  }
  if (import.meta.env.VITE_ENABLE_TOAST_NOTIFICATIONS === 'true') {
    flags.toast_notifications = true;
  }

  return flags;
};

export const AppProviders: React.FC = () => {
  const initialFlags = getInitialFlags();

  return (
    <FeatureFlagsProvider initialFlags={initialFlags}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </FeatureFlagsProvider>
  );
};
