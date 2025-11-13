import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Mail, UserCircle, ShoppingBag, FileText, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

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
              // If no name in profile, use email username as fallback
              setUserName(user.email?.split('@')[0] || 'Usuario');
            }
          } else {
            // If no name in profile, use email username as fallback
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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Mobile navigation items
  const mobileNavItems = user ? [
    { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
    { path: '/portfolio', icon: Home, label: 'Portafolio', shortLabel: 'Prop.' },
    { path: '/my-applications', icon: Mail, label: 'Mis Postulaciones', shortLabel: 'Post.' },
  ] : [
    { path: '/', icon: ShoppingBag, label: 'Inicio', shortLabel: 'Inicio' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Desktop */}
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

            {/* Desktop Navigation */}
            <nav className="flex space-x-1 lg:space-x-2 flex-1 justify-center overflow-x-auto scrollbar-hide">
              <Link
                to="/"
                className={`px-2 lg:px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 flex-shrink-0 ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm'
                }`}
              >
                <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xl:inline">Panel</span>
              </Link>
              {user && (
                <>
                  <Link
                    to="/portfolio"
                    className={`px-2 lg:px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 flex-shrink-0 ${
                      isActive('/portfolio')
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden xl:inline">Mi Portafolio</span>
                  </Link>
                  <Link
                    to="/my-applications"
                    className={`px-2 lg:px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 flex-shrink-0 ${
                      isActive('/my-applications')
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden xl:inline">Mis Postulaciones</span>
                  </Link>
                </>
              )}
            </nav>

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

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && (
          <div className="border-t bg-gray-50 px-3 py-2 space-y-0.5">
            <Link
              to="/portfolio"
              className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              <span>Mi Portafolio</span>
            </Link>
            <Link
              to="/my-applications"
              className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Mail className="h-4 w-4" />
              <span>Mis Postulaciones</span>
            </Link>
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