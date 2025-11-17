import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Menu, X } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  breadcrumbs = [],
  title,
  subtitle
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  // Generate default breadcrumbs from current path
  const defaultBreadcrumbs = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Inicio', path: '/admin' }];

    pathSegments.forEach((segment, index) => {
      if (segment !== 'admin') {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        crumbs.push({ label, path });
      }
    });

    return crumbs;
  }, [location.pathname]);

  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header variant="admin" />

      {/* Mobile Drawer Trigger - Only visible on mobile */}
      <button
        onClick={handleMobileDrawerToggle}
        className="fixed top-20 left-4 z-40 md:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar
            variant="admin"
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />
        </div>

        {/* Main Content - Full width on mobile */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-0'
        }`}>
          <div className="p-4 sm:p-6">
            {/* Breadcrumbs */}
            <nav className="flex mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {displayBreadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                    )}
                    {crumb.path && index < displayBreadcrumbs.length - 1 ? (
                      <Link
                        to={crumb.path}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center"
                      >
                        {index === 0 && <Home className="h-4 w-4 mr-1" />}
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-900 font-medium flex items-center">
                        {index === 0 && <Home className="h-4 w-4 mr-1" />}
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            {/* Page Header */}
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Page Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeMobileDrawer}
          />

          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[80vw] bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/admin" className="flex items-center space-x-2" onClick={closeMobileDrawer}>
                <img
                  src="/propai-logo.svg"
                  alt="PROPAI Logo"
                  className="h-8 w-auto"
                />
                <span className="text-lg font-bold text-gray-900">PROPAI</span>
              </Link>
              <button
                onClick={closeMobileDrawer}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content - Sidebar */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                variant="admin"
                isCollapsed={false}
                onToggleCollapse={() => {}} // Not used in mobile drawer
                mobileDrawer={true}
                onCloseMobileDrawer={closeMobileDrawer}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Area */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2" />
    </div>
  );
};
