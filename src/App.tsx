import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthPage } from './components/auth/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicPropertiesPage } from './components/properties/PublicPropertiesPage';
import { PropertyDetailsPage } from './components/properties/PropertyDetailsPage';
import { PortfolioPage } from './components/portfolio/PortfolioPage';
import { PropertyForm } from './components/properties/PropertyForm';
import { RentalPublicationForm } from './components/properties/RentalPublicationForm';
import { ApplicationsPage } from './components/dashboard/ApplicationsPage';
import { OffersPage } from './components/dashboard/OffersPage';
import { UserProfile } from './components/profile/UserProfile';
import { MarketplacePage } from './components/marketplace/MarketplacePage';
import { MyActivityPage } from './components/marketplace/MyActivityPage';
import AdminSetup from './components/AdminSetup';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/properties" element={<PublicPropertiesPage />} />
          <Route path="/property/:id" element={<PropertyDetailsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/portfolio" 
            element={
              <ProtectedRoute>
                <PortfolioPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/property/new" 
            element={
              <ProtectedRoute>
                <PropertyForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/property/new/rental" 
            element={
              <ProtectedRoute>
                <RentalPublicationForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/property/edit/:id" 
            element={
              <ProtectedRoute>
                <PropertyForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/applications" 
            element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/offers" 
            element={
              <ProtectedRoute>
                <OffersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-activity" 
            element={
              <ProtectedRoute>
                <MyActivityPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin-setup" element={<AdminSetup />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;