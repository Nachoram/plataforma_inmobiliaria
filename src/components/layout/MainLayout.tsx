import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  // Header options
  headerVariant?: 'default' | 'marketplace' | 'admin' | 'applicant';
  showSearch?: boolean;
  showFilters?: boolean;
  onSearchChange?: (query: string) => void;
  onFiltersToggle?: () => void;

  // Sidebar options
  showSidebar?: boolean;
  sidebarVariant?: 'admin' | 'applicant';
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;

  // Footer options
  footerVariant?: 'default' | 'minimal' | 'auth';

  // Layout options
  maxWidth?: string;
  padding?: string;
  backgroundColor?: string;

  // Content area options
  contentClassName?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  headerVariant = 'default',
  showSearch = false,
  showFilters = false,
  onSearchChange,
  onFiltersToggle,
  showSidebar = false,
  sidebarVariant = 'admin',
  sidebarCollapsed: initialSidebarCollapsed = false,
  onSidebarToggle,
  footerVariant = 'default',
  maxWidth = 'max-w-7xl',
  padding = 'px-4 sm:px-6 lg:px-8',
  backgroundColor = 'bg-gray-50',
  contentClassName = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarCollapsed);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    onSidebarToggle?.();
  };

  return (
    <div className={`min-h-screen ${backgroundColor}`}>
      {/* Header */}
      <Header
        variant={headerVariant}
        showSearch={showSearch}
        showFilters={showFilters}
        onSearchChange={onSearchChange}
        onFiltersToggle={onFiltersToggle}
      />

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            variant={sidebarVariant}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          showSidebar && sidebarCollapsed ? 'ml-16' : showSidebar ? 'ml-0' : ''
        }`}>
          <div className={`${padding} py-8`}>
            <div className={`${maxWidth} mx-auto ${contentClassName}`}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer variant={footerVariant} />

      {/* Toast Notification Area */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2" />
    </div>
  );
};








