import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthErrorHandler } from './auth/AuthErrorHandler';
import { useRoutePreloader } from '../hooks/useRoutePreloader';
import { ErrorBoundary } from './common';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

// Auth components - keep loaded for fast auth
import { AuthPage } from './auth/AuthPage';

// Main pages - keep panel loaded for fast initial experience
import { PanelPage } from './panel/PanelPage';

// Property components - keep property details loaded
import { PropertyDetailsPage } from './properties/PropertyDetailsPage';
import { AdminPropertyDetailView } from './properties/AdminPropertyDetailView';
import { RentalApplicationPage } from './properties/RentalApplicationPage';

// Application components
import { PostulantAdminPanel } from './applications/PostulantAdminPanel';
import { PostulationAdminPanel } from './applications/PostulationAdminPanel';

// Sales components
import SaleOfferManagementPage from './sales/SaleOfferManagementPage';
import SalesOfferDetailView from './sales/SalesOfferDetailView';

// Diagnostic components - keep loaded
import { SupabaseDiagnostic } from './SupabaseDiagnostic';
import DatabaseQueryRunner from './DatabaseQueryRunner';

// Pages
import {
  AboutPage,
  MarketplacePage,
  LoginPage,
  NotFoundPage
} from '../pages';

// Advanced Components
import PortfolioPage from './portfolio/PortfolioPage';
import MyApplicationsPage from './dashboard/MyApplicationsPage';
import MyOffersPage from './dashboard/MyOffersPage';
import { OfferDetailsPage } from './offers';

// Temporarily disable lazy loading to debug the issue
import MySalesPage from './dashboard/MySalesPage';
import { ContractCanvasEditorPage } from './dashboard';
import PropertyFormPage from './properties/PropertyFormPage';
import UserProfilePage from './profile/UserProfilePage';
import SalePropertyAdminPanel from './sales/SalePropertyAdminPanel';
import SaleOfferPage from './sales/SaleOfferPage';

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

  console.log('🏠 AppContent renderizado - plataforma completa');

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <AuthErrorHandler>
        <Routes>
      {/* Public routes without layout */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Routes with layout */}
      <Route path="/" element={
        <Layout>
          <PanelPage />
        </Layout>
      } />

      <Route path="/panel" element={
        <Layout>
          <PanelPage />
        </Layout>
      } />

      <Route path="/nosotros" element={
        <Layout>
          <AboutPage />
        </Layout>
      } />

      <Route path="/property/:id" element={
        <Layout>
          <PropertyDetailsPage />
        </Layout>
      } />

      <Route path="/property/:propertyId/apply" element={
        <Layout>
          <RentalApplicationPage />
        </Layout>
      } />

      {/* Sale offer routes */}
      <Route path="/ofertas/nueva/:propertyId" element={
        <Layout>
          <SaleOfferPage />
        </Layout>
      } />

      <Route path="/offers/new/:propertyId" element={
        <Layout>
          <SaleOfferPage />
        </Layout>
      } />

      {/* Postulation admin routes */}
      <Route path="/postulation/:id/admin" element={
        <ProtectedRoute>
          <Layout>
            <PostulationAdminPanel />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Sale offer admin routes */}
      <Route path="/sales/offer/:id" element={
        <ProtectedRoute>
          <Layout>
            <SalesOfferDetailView />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/offer/:id/admin" element={
        <ProtectedRoute>
          <Layout>
            <SalesOfferDetailView />
          </Layout>
        </ProtectedRoute>
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

      <Route path="/portfolio/property/:id" element={
        <ProtectedRoute>
          <Layout>
            <AdminPropertyDetailView />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-applications" element={
        <ProtectedRoute>
          <Layout>
            <MyApplicationsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-applications/:applicationId/admin" element={
        <ProtectedRoute>
          <Layout>
            <PostulantAdminPanel />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-offers" element={
        <ProtectedRoute>
          <Layout>
            <MyOffersPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-offers/:offerId/details" element={
        <ProtectedRoute>
          <Layout>
            <OfferDetailsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-offers/:offerId/admin" element={
        <ProtectedRoute>
          <Layout>
            <SaleOfferManagementPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-offers/:offerId/seller-admin" element={
        <ProtectedRoute>
          <Layout>
            <SaleOfferManagementPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* DEPRECATED: /my-sales routes - Now integrated into /portfolio with tabs */}
      {/* Keeping for backwards compatibility, redirects to portfolio */}
      <Route path="/my-sales" element={
        <ProtectedRoute>
          <Layout>
            <MySalesPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-sales/:id" element={
        <ProtectedRoute>
          <Layout>
            <SalePropertyAdminPanel />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <Layout>
            <UserProfilePage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/contracts/:contractId/canvas-editor" element={
        <ProtectedRoute>
          <ContractCanvasEditorPage />
        </ProtectedRoute>
      } />



      {/* Diagnostic routes */}
      <Route path="/diagnostic" element={
        <Layout>
          <SupabaseDiagnostic />
        </Layout>
      } />

      <Route path="/db-fix" element={
        <Layout>
          <DatabaseQueryRunner />
        </Layout>
      } />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthErrorHandler>
    </ErrorBoundary>
  );
};
