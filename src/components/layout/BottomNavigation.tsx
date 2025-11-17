import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Mail, DollarSign, User } from 'lucide-react';

interface BottomNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const bottomNavItems: BottomNavItem[] = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
  { icon: Mail, label: 'Postulaciones', path: '/my-applications' },
  { icon: DollarSign, label: 'Ofertas', path: '/my-offers' },
  { icon: User, label: 'Perfil', path: '/perfil' }
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll behavior - opcional según requerimientos
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navigation
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navigation
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`
        mobile-nav
        h-16
        flex justify-around items-center flex-row gap-1
        transition-all duration-300 ease-in-out
        sm:hidden
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      {bottomNavItems.map((item) => {
        const IconComponent = item.icon;
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`
              flex flex-col items-center gap-1
              px-2 py-2 rounded-lg
              transition-all duration-200
              active:scale-95
              ${active
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <IconComponent className="size-6" />
            <span className="text-xs font-medium leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
