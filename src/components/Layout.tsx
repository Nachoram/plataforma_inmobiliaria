import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Building, Mail, DollarSign, UserCircle, ShoppingBag, BarChart3, FileText, Edit3, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Mobile navigation items
  const mobileNavItems = user ? [
    { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
    { path: '/portfolio', icon: Home, label: 'Portafolio', shortLabel: 'Prop.' },
    { path: '/applications', icon: Mail, label: 'Postulaciones', shortLabel: 'Post.' },
    { path: '/contracts', icon: FileText, label: 'Contratos', shortLabel: 'Cont.' },
    { path: '/profile', icon: UserCircle, label: 'Perfil', shortLabel: 'Perfil' },
  ] : [
    { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Desktop */}
      <header className="bg-white shadow-soft border-b sticky top-0 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <Building className="h-8 w-8 text-blue-700 group-hover:text-blue-800 transition-colors" />
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                PropiedadesApp
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <ShoppingBag className="h-5 w-5" />
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
                    <Home className="h-5 w-5" />
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
                    <Mail className="h-5 w-5" />
                    <span>Postulaciones</span>
                  </Link>
                  <Link
                    to="/contracts"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      isActive('/contracts')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Contratos</span>
                  </Link>
                  <Link
                    to="/my-activity"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      isActive('/my-activity')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
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
                    <UserCircle className="h-5 w-5" />
                    <span>Mi Perfil</span>
                  </Link>
                </>
              )}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 hidden lg:block">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition-colors mobile-btn"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm">Salir</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors mobile-btn"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-white shadow-soft border-b sticky top-0 z-40 md:hidden">
        <div className="flex justify-between items-center h-14 px-4">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Building className="h-7 w-7 text-blue-700" />
            <span className="text-lg font-bold text-gray-900">PropiedadesApp</span>
          </Link>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700 hidden xs:block">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && (
          <div className="border-t bg-gray-50 px-4 py-3 space-y-1">
            <Link
              to="/portfolio"
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Mi Portafolio</span>
            </Link>
            <Link
              to="/applications"
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Mail className="h-5 w-5" />
              <span>Postulaciones</span>
            </Link>
            <Link
              to="/contracts"
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="h-5 w-5" />
              <span>Contratos</span>
            </Link>
            <Link
              to="/my-activity"
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Mi Actividad</span>
            </Link>
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="h-5 w-5" />
              <span>Salir</span>
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className={`padding-mobile ${user ? 'pb-20 md:pb-8' : 'pb-8'}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="mobile-nav md:hidden">
          <div className="flex justify-around items-center px-2 py-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200 min-h-[48px] min-w-[48px] ${
                    active
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${active ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-xs font-medium text-center leading-tight">
                    <span className="xs:hidden">{item.shortLabel}</span>
                    <span className="hidden xs:inline">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};