import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Mail, UserCircle, ShoppingBag, Menu, X, DollarSign, Search, Filter } from 'lucide-react';
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
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          { path: '/portfolio', icon: Home, label: 'Portafolio', shortLabel: 'Prop.' },
          { path: '/my-applications', icon: Mail, label: 'Postulaciones', shortLabel: 'Post.' },
          { path: '/my-offers', icon: DollarSign, label: 'Ofertas', shortLabel: 'Ofer.' },
          { path: '/perfil', icon: UserCircle, label: 'Mi Perfil', shortLabel: 'Perfil' },
        ] : [
          { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
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
          { path: '/portfolio', icon: Home, label: 'Mi Portafolio', shortLabel: 'Prop.' },
          { path: '/my-applications', icon: Mail, label: 'Postulaciones', shortLabel: 'Post.' },
          { path: '/my-offers', icon: DollarSign, label: 'Mis Ofertas', shortLabel: 'Ofer.' },
          { path: '/perfil', icon: UserCircle, label: 'Mi Perfil', shortLabel: 'Perfil' },
        ] : [
          { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
        ];
    }
  };

  const navItems = getNavigationItems();

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 hidden md:block backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-20 gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
              <img
                src="/propai-logo.svg"
                alt="PROPAI Logo"
                className="h-52 w-auto drop-shadow-lg"
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
        <div className="flex justify-between items-center h-16 px-3">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center space-x-1.5 group">
            <img
              src="/propai-logo.svg"
              alt="PROPAI Logo"
              className="h-44 w-auto drop-shadow-lg"
            />
          </Link>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-1.5">
            {user ? (
              <>
                <div className="flex items-center space-x-1.5 bg-gray-50 px-1.5 py-1 rounded-lg border border-gray-200">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 hidden xs:block max-w-[80px] truncate">
                    {userName || 'Usuario'}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all border border-transparent hover:border-blue-200"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search - only for marketplace */}
        {showSearch && (
          <div className="border-t bg-gray-50 px-3 py-3">
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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && (
          <div className="border-t bg-gray-50 px-3 py-2 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {showFilters && (
              <button
                onClick={() => {
                  onFiltersToggle?.();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors w-full text-left"
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </button>
            )}
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          </div>
        )}
      </header>
    </>
  );
};
