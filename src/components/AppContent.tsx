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

// Lazy loaded components for better performance
const PortfolioPage = React.lazy(() => import('./portfolio/PortfolioPage').then(module => ({ default: module.PortfolioPage })));
const ApplicationsPage = React.lazy(() => import('./dashboard/ApplicationsPage').then(module => ({ default: module.ApplicationsPage })));
const ContractManagementPage = React.lazy(() => import('./contracts/ContractManagementPage').then(module => ({ default: module.default })));
const ContractViewerPage = React.lazy(() => import('./contracts/ContractViewerPage').then(module => ({ default: module.default })));
const PropertyFormPage = React.lazy(() => import('./properties/PropertyFormPage').then(module => ({ default: module.default })));
const UserProfile = React.lazy(() => import('./profile/UserProfile').then(module => ({ default: module.UserProfile })));

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
            <Suspense fallback={<LoadingSpinner />}>
              <PropertyFormPage />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/property/new/rental" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <PropertyFormPage />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/property/edit/:id" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <PropertyFormPage />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Protected routes */}
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <PortfolioPage />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/applications" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <ApplicationsPage />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/contracts" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <ContractManagementPage />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/contract/:contractId" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <ContractViewerPage />
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/my-activity" element={
        <ProtectedRoute>
          <Layout>
            <MyActivityPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <UserProfile />
            </Suspense>
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
