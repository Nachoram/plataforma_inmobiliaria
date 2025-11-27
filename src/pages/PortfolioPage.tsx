import React, { useState } from 'react';
import { Calendar, Home, Settings } from 'lucide-react';
import { ScheduledVisitsManager } from '../components/properties/ScheduledVisitsManager';

export const PortfolioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'properties' | 'visits'>('properties');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Home className="h-8 w-8 mr-3 text-blue-600" />
            Mi Portafolio Inmobiliario
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus propiedades y visitas agendadas
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'properties'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Mis Propiedades
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'visits'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Visitas Agendadas
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'properties' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder para propiedades - se puede expandir después */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tus Propiedades</h3>
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                Gestiona tus propiedades desde el menú lateral o haz clic en cada propiedad individual.
              </p>
              <div className="text-sm text-gray-500">
                Próximamente: Vista completa de todas tus propiedades aquí.
              </div>
            </div>
          </div>
        ) : (
          <ScheduledVisitsManager />
        )}
      </div>
    </div>
  );
};
