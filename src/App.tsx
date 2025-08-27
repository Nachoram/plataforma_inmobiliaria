import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthPage } from './components/auth/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicPropertiesPage } from './components/properties/PublicPropertiesPage';
import { PropertyDetailsPage } from './components/properties/PropertyDetailsPage';
import { PortfolioPage } from './components/portfolio/PortfolioPage';
import { PropertyForm } from './components/properties/PropertyForm';
import { ApplicationsPage } from './components/dashboard/ApplicationsPage';
import { OffersPage } from './components/dashboard/OffersPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicPropertiesPage />} />
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;