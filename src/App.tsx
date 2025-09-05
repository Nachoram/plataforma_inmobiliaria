import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import DemoPage from './components/DemoPage';
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
import EnvTest from './components/EnvTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Demo Route - Nueva implementación */}
          <Route path="/demo" element={<DemoPage />} />

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
      </Router>
    </AuthProvider>
  );
}

export default App;