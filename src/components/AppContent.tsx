import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { useRoutePreloader } from '../hooks/useRoutePreloader';
import ErrorBoundary from './common/ErrorBoundary';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

// Auth components - keep loaded for fast auth
import { AuthPage } from './auth/AuthPage';

// Main pages - keep marketplace loaded for fast initial experience
import { MarketplacePage } from './marketplace/MarketplacePage';
import { MyActivityPage } from './marketplace/MyActivityPage';

// Property components - keep property details loaded
import { PropertyDetailsPage } from './properties/PropertyDetailsPage';

// Diagnostic components - keep loaded
import { SupabaseDiagnostic } from './SupabaseDiagnostic';

// Temporarily disable lazy loading to debug the issue
import PortfolioPage from './portfolio/PortfolioPage';
import ApplicationsPage from './dashboard/ApplicationsPage';
import ContractManagementPage from './contracts/ContractManagementPage';
import ContractViewerPage from './contracts/ContractViewerPage';
import ContractCanvasEditorPage from './contracts/ContractCanvasEditorPage';
import PropertyFormPage from './properties/PropertyFormPage';

// Loading component for lazy loaded routes
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

export const AppContent: React.FC = () => {
  console.log('🏠 AppContent renderizado - plataforma completa');

  // Performance monitoring
  const { markRouteChange } = usePerformanceMonitor()

  // Preload rutas críticas para mejor performance
  useRoutePreloader();

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <Routes>
      {/* Public routes without layout */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Routes with layout */}
      <Route path="/" element={
        <Layout>
          <MarketplacePage />
        </Layout>
      } />

      <Route path="/property/:id" element={
        <Layout>
          <PropertyDetailsPage />
        </Layout>
      } />

      {/* Property publication routes */}
      <Route path="/property/new" element={
        <ProtectedRoute>
          <Layout>
            <PropertyFormPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/property/new/rental" element={
        <ProtectedRoute>
          <Layout>
            <PropertyFormPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/property/edit/:id" element={
        <ProtectedRoute>
          <Layout>
            <PropertyFormPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Protected routes */}
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <Layout>
            <PortfolioPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/applications" element={
        <ProtectedRoute>
          <Layout>
            <ApplicationsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/contracts" element={
        <ProtectedRoute>
          <Layout>
            <ContractManagementPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/contracts/:contractId/canvas-editor" element={
        <ProtectedRoute>
          <ContractCanvasEditorPage />
        </ProtectedRoute>
      } />

      <Route path="/contract/:contractId" element={
        <ProtectedRoute>
          <ContractViewerPage />
        </ProtectedRoute>
      } />

      <Route path="/my-activity" element={
        <ProtectedRoute>
          <Layout>
            <MyActivityPage />
          </Layout>
        </ProtectedRoute>
      } />


      {/* Diagnostic routes */}
      <Route path="/diagnostic" element={
        <Layout>
          <SupabaseDiagnostic />
        </Layout>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};
