import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Mail,
  DollarSign,
  UserCircle,
  FileText,
  Settings,
  Users,
  Building,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string | number;
}

interface SidebarProps {
  variant?: 'admin' | 'applicant';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  variant = 'admin',
  isCollapsed = false,
  onToggleCollapse,
  mobileDrawer = false,
  onCloseMobileDrawer
}) => {
  const location = useLocation();

  const adminItems: SidebarItem[] = [
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    {
      path: '/admin/properties',
      icon: Building,
      label: 'Propiedades'
    },
    {
      path: '/admin/applications',
      icon: Mail,
      label: 'Postulaciones'
    },
    {
      path: '/admin/contracts',
      icon: FileText,
      label: 'Contratos'
    },
    {
      path: '/admin/offers',
      icon: DollarSign,
      label: 'Ofertas'
    },
    {
      path: '/admin/users',
      icon: Users,
      label: 'Usuarios'
    },
    {
      path: '/admin/analytics',
      icon: BarChart3,
      label: 'Analytics'
    },
    {
      path: '/admin/calendar',
      icon: Calendar,
      label: 'Calendario'
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: 'Configuración'
    }
  ];

  const applicantItems: SidebarItem[] = [
    {
      path: '/applicant',
      icon: UserCircle,
      label: 'Mi Perfil'
    },
    {
      path: '/applicant/applications',
      icon: Mail,
      label: 'Mis Postulaciones'
    },
    {
      path: '/applicant/offers',
      icon: DollarSign,
      label: 'Mis Ofertas'
    },
    {
      path: '/applicant/properties',
      icon: Home,
      label: 'Propiedades Favoritas'
    },
    {
      path: '/applicant/documents',
      icon: FileText,
      label: 'Mis Documentos'
    },
    {
      path: '/applicant/settings',
      icon: Settings,
      label: 'Configuración'
    }
  ];

  const items = variant === 'admin' ? adminItems : applicantItems;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">
              {variant === 'admin' ? 'Administración' : 'Mi Cuenta'}
            </h2>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={mobileDrawer ? onCloseMobileDrawer : undefined}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
                } ${isCollapsed ? '' : 'mr-3'}`} />

                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        typeof item.badge === 'number' && item.badge > 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {isCollapsed && item.badge && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              PROPAI v1.0.0
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
