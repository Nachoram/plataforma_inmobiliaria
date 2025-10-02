import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth components
import { AuthPage } from './auth/AuthPage';

// Main pages
import { MarketplacePage } from './marketplace/MarketplacePage';
import { PortfolioPage } from './portfolio/PortfolioPage';
import { ApplicationsPage } from './dashboard/ApplicationsPage';
import ContractManagementPage from './contracts/ContractManagementPage';
import { MyActivityPage } from './marketplace/MyActivityPage';
import { UserProfile } from './profile/UserProfile';

// Property components
import { PropertyDetailsPage } from './properties/PropertyDetailsPage';
import PropertyFormPage from './properties/PropertyFormPage';


// Diagnostic components
import { SupabaseDiagnostic } from './SupabaseDiagnostic';

export const AppContent: React.FC = () => {
  console.log('🏠 AppContent renderizado - plataforma completa');

  return (
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
            <UserProfile />
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
  );
};
