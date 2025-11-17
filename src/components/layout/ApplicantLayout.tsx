import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, User } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface ApplicantLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
}

export const ApplicantLayout: React.FC<ApplicantLayoutProps> = ({
  children,
  breadcrumbs = [],
  title,
  subtitle
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Generate default breadcrumbs from current path
  const defaultBreadcrumbs = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Inicio', path: '/applicant' }];

    pathSegments.forEach((segment, index) => {
      if (segment !== 'applicant') {
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
      <Header variant="applicant" />

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          variant="applicant"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
        />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-0'
        } pb-20 sm:pb-0`}>
          <div className="p-6">
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

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />

      {/* Toast Notification Area */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2" />
    </div>
  );
};
