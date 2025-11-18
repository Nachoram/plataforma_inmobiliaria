import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Mail, UserCircle, ShoppingBag, Menu, X, DollarSign, Search, Filter, Bell, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  showSearch?: boolean;
  showFilters?: boolean;
  onSearchChange?: (query: string) => void;
  onFiltersToggle?: () => void;
  variant?: 'default' | 'marketplace' | 'admin' | 'applicant';
}

export const Header: React.FC<HeaderProps> = ({
  showSearch = false,
  showFilters = false,
  onSearchChange,
  onFiltersToggle,
  variant = 'default'
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3); // Simulado

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-notifications]') && notificationsOpen) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  // Fetch user name from profile
  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, paternal_last_name, maternal_last_name')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data) {
            const { first_name, paternal_last_name, maternal_last_name } = data;
            if (first_name && paternal_last_name) {
              const fullName = `${first_name} ${paternal_last_name}${maternal_last_name ? ` ${maternal_last_name}` : ''}`;
              setUserName(fullName);
            } else {
              setUserName(user.email?.split('@')[0] || 'Usuario');
            }
          } else {
            setUserName(user.email?.split('@')[0] || 'Usuario');
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
          setUserName(user.email?.split('@')[0] || 'Usuario');
        }
      } else {
        setUserName(null);
      }
    };

    fetchUserName();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Navigation items based on variant
  const getNavigationItems = () => {
    switch (variant) {
      case 'marketplace':
        return user ? [
          { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
          { path: '/nosotros', icon: Info, label: 'Nosotros', shortLabel: 'Info' },
          { path: '/portfolio', icon: Home, label: 'Portafolio', shortLabel: 'Prop.' },
          { path: '/my-applications', icon: Mail, label: 'Postulaciones', shortLabel: 'Post.' },
          { path: '/my-offers', icon: DollarSign, label: 'Ofertas', shortLabel: 'Ofer.' },
          { path: '/perfil', icon: UserCircle, label: 'Mi Perfil', shortLabel: 'Perfil' },
        ] : [
          { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
          { path: '/nosotros', icon: Info, label: 'Nosotros', shortLabel: 'Info' },
        ];
      case 'admin':
        return [
          { path: '/admin', icon: ShoppingBag, label: 'Dashboard', shortLabel: 'Dash.' },
          { path: '/admin/properties', icon: Home, label: 'Propiedades', shortLabel: 'Prop.' },
          { path: '/admin/applications', icon: Mail, label: 'Postulaciones', shortLabel: 'Post.' },
          { path: '/admin/contracts', icon: DollarSign, label: 'Contratos', shortLabel: 'Contr.' },
        ];
      case 'applicant':
        return [
          { path: '/applicant', icon: UserCircle, label: 'Perfil', shortLabel: 'Perfil' },
          { path: '/applicant/applications', icon: Mail, label: 'Mis Postulaciones', shortLabel: 'Post.' },
          { path: '/applicant/offers', icon: DollarSign, label: 'Mis Ofertas', shortLabel: 'Ofer.' },
        ];
      default:
        return user ? [
          { path: '/', icon: ShoppingBag, label: 'Panel', shortLabel: 'Panel' },
          { path: '/nosotros', icon: Info, label: 'Nosotros', shortLabel: 'Info' },
          { path: '/portfolio', icon: Home, label: 'Mi Portafolio', shortLabel: 'Prop.' },
          { path: '/my-applications', icon: Mail, label: 'Postulaciones', shortLabel: 'Post.' },
          { path: '/my-offers', icon: DollarSign, label: 'Mis Ofertas', shortLabel: 'Ofer.' },
          { path: '/perfil', icon: UserCircle, label: 'Mi Perfil', shortLabel: 'Perfil' },
        ] : [
          { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
          { path: '/nosotros', icon: Info, label: 'Nosotros', shortLabel: 'Info' },
        ];
    }
  };

  const navItems = getNavigationItems();

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 hidden md:block backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 py-2 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
              <img
                src="/propai-logo.svg"
                alt="PROPAI Logo"
                className="h-10 w-auto drop-shadow-lg"
              />
            </Link>

            {/* Search Bar - only for marketplace */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar propiedades..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="flex space-x-1 lg:space-x-2 flex-1 justify-center overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 lg:px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 flex-shrink-0 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm'
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Filters Button - only for marketplace */}
            {showFilters && (
              <button
                onClick={onFiltersToggle}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 flex-shrink-0"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden lg:inline">Filtros</span>
              </button>
            )}

            {/* User menu */}
            <div className="flex items-center space-x-1.5 lg:space-x-2 flex-shrink-0">
              <Link
                to="/nosotros"
                className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 lg:px-3 py-1.5 rounded-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 font-medium"
              >
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs hidden lg:inline">Nosotros</span>
              </Link>
              {user ? (
                <div className="flex items-center space-x-1.5">
                  <div className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 hidden xl:block max-w-[120px] truncate">
                      {userName || 'Usuario'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1.5 text-gray-600 hover:text-white hover:bg-red-600 px-2 lg:px-3 py-1.5 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-600 font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs hidden lg:inline">Salir</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 lg:px-5 py-1.5 rounded-lg text-xs lg:text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 md:hidden backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between h-14 px-4 py-2">
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <img
              src="/propai-logo.svg"
              alt="PROPAI Logo"
              className="h-8 w-auto drop-shadow-lg"
            />
            <span className="text-lg font-bold text-gray-900 hidden sm:inline">
              PROPAI
            </span>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Search Icon */}
            {showSearch && (
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {/* Notifications */}
            <button
              data-notifications
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <Link to="/perfil" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Drawer/Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed left-0 top-0 h-full w-80 max-w-[80vw] bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                  <img
                    src="/propai-logo.svg"
                    alt="PROPAI Logo"
                    className="h-8 w-auto"
                  />
                  <span className="text-lg font-bold text-gray-900">PROPAI</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4">
                {/* User Info */}
                {user && (
                  <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userName || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  {showFilters && (
                    <button
                      onClick={() => {
                        onFiltersToggle?.();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
                    >
                      <Filter className="h-5 w-5" />
                      <span>Filtros</span>
                    </button>
                  )}
                </nav>

                {/* Logout */}
                {user && (
                  <div className="mt-8 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Salir</span>
                    </button>
                  </div>
                )}

                {/* Login for non-authenticated users */}
                {!user && (
                  <div className="mt-8 pt-4 border-t">
                    <Link
                      to="/auth"
                      className="flex items-center space-x-3 px-3 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full text-left"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Iniciar Sesión</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Dropdown */}
        {notificationsOpen && (
          <div data-notifications className="absolute top-full right-4 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {/* Mock notifications - replace with real data */}
              <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Nueva postulación</p>
                    <p className="text-xs text-gray-500">Alguien se postuló a tu propiedad</p>
                    <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Nueva oferta</p>
                    <p className="text-xs text-gray-500">Recibiste una oferta por $150.000.000</p>
                    <p className="text-xs text-gray-400 mt-1">Hace 5 horas</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Recordatorio</p>
                    <p className="text-xs text-gray-500">No olvides revisar tus postulaciones</p>
                    <p className="text-xs text-gray-400 mt-1">Hace 1 día</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Ver todas las notificaciones
              </button>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSearchModalOpen(false)}
            />
            <div className="fixed top-0 left-0 right-0 bg-white shadow-lg">
              <div className="flex items-center p-4 border-b">
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-3"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar propiedades..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-3 text-base border-0 focus:ring-0 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
              {/* Search suggestions/results could go here */}
              <div className="p-4">
                <p className="text-sm text-gray-500">Resultados de búsqueda aparecerán aquí...</p>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
