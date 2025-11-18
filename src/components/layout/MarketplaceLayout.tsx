import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface MarketplaceLayoutProps {
  children: React.ReactNode;
  onSearchChange?: (query: string) => void;
  filtersContent?: React.ReactNode;
  showFilters?: boolean;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  children,
  onSearchChange,
  filtersContent,
  showFilters = true
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFiltersToggle = () => {
    setFiltersOpen(!filtersOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <Header
        variant="marketplace"
        showSearch={true}
        showFilters={showFilters}
        onSearchChange={onSearchChange}
        onFiltersToggle={handleFiltersToggle}
      />

      {/* Main Content Area */}
      <div className="flex">
        {/* Filters Sidebar - Desktop */}
        {showFilters && (
          <aside className={`hidden lg:block bg-white border-r border-gray-200 transition-all duration-300 ${
            filtersOpen ? 'w-80' : 'w-0 overflow-hidden'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={handleFiltersToggle}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Cerrar filtros"
                >
                  ✕
                </button>
              </div>
              {filtersContent}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Filters Overlay */}
      {showFilters && filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleFiltersToggle}
          />

          {/* Mobile Filters Panel */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={handleFiltersToggle}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Cerrar filtros"
                >
                  ✕
                </button>
              </div>
              {filtersContent}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Toast Notification Area */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2" />
    </div>
  );
};


