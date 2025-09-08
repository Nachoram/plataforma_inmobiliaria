import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from './Layout';
import { AuthPage } from './auth/AuthPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicPropertiesPage } from './properties/PublicPropertiesPage';
import { PropertyDetailsPage } from './properties/PropertyDetailsPage';
import { PortfolioPage } from './portfolio/PortfolioPage';
import { PropertyForm } from './properties/PropertyForm';
import { RentalPublicationForm } from './properties/RentalPublicationForm';
import { ApplicationsPage } from './dashboard/ApplicationsPage';
import { OffersPage } from './dashboard/OffersPage';
import { UserProfile } from './profile/UserProfile';
import { MarketplacePage } from './marketplace/MarketplacePage';
import { MyActivityPage } from './marketplace/MyActivityPage';
import AdminSetup from './AdminSetup';
import EnvTest from './EnvTest';
import DemoPage from './DemoPage';

export const AppContent: React.FC = () => {
  const { loading } = useAuth();

  // Mostrar pantalla de carga mientras se inicializa la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Demo Route - Nueva implementación */}
      <Route
        path="/demo"
        element={
          <ProtectedRoute>
            <Layout><DemoPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Environment Variables Test Route */}
      <Route path="/env-test" element={<Layout><EnvTest /></Layout>} />

      {/* Rutas existentes */}
      <Route path="/" element={<Layout><MarketplacePage /></Layout>} />
      <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
      <Route path="/properties" element={<Layout><PublicPropertiesPage /></Layout>} />
      <Route path="/property/:id" element={<Layout><PropertyDetailsPage /></Layout>} />
      <Route path="/auth" element={<Layout><AuthPage /></Layout>} />

      {/* Protected Routes */}
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Layout><PortfolioPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/property/new"
        element={
          <ProtectedRoute>
            <Layout><PropertyForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/property/new/rental"
        element={
          <ProtectedRoute>
            <Layout><RentalPublicationForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/property/edit/:id"
        element={
          <ProtectedRoute>
            <Layout><PropertyForm /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <Layout><ApplicationsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/offers"
        element={
          <ProtectedRoute>
            <Layout><OffersPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-activity"
        element={
          <ProtectedRoute>
            <Layout><MyActivityPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout><UserProfile /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin-setup" element={<Layout><AdminSetup /></Layout>} />
    </Routes>
  );
};
