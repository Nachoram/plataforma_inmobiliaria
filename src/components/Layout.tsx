import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Building, Mail, DollarSign, UserCircle, ShoppingBag, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <Building className="h-8 w-8 text-blue-700 group-hover:text-blue-800 transition-colors" />
              <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                PropiedadesApp
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Marketplace</span>
              </Link>
              {user && (
                <>
                  <Link
                    to="/portfolio"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      isActive('/portfolio')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Home className="h-4 w-4" />
                    <span>Mi Portafolio</span>
                  </Link>
                  <Link
                    to="/applications"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      isActive('/applications')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Postulaciones</span>
                  </Link>
                  <Link
                    to="/my-activity"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      isActive('/my-activity')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Mi Actividad</span>
                  </Link>
                  <Link
                    to="/profile"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      isActive('/profile')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </>
              )}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Salir</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="md:hidden border-t bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-2">
              <div className="flex space-x-1 overflow-x-auto">
                <Link 
                  to="/portfolio" 
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive('/portfolio') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Portafolio</span>
                </Link>
                <Link 
                  to="/applications" 
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive('/applications') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Postulaciones</span>
                </Link>
                <Link 
                  to="/profile" 
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    isActive('/profile') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};