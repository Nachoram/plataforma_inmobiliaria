import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthForm from './auth/AuthForm';
import PropertyPublicationForm from './properties/PropertyPublicationForm';
import RentalApplicationForm from './properties/RentalApplicationForm';
import UserProfileForm from './profile/UserProfileForm';

const DemoPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('auth');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'auth', label: 'Autenticación', component: <AuthForm /> },
    { id: 'profile', label: 'Perfil de Usuario', component: <UserProfileForm /> },
    { id: 'property', label: 'Publicar Propiedad', component: <PropertyPublicationForm /> },
    { id: 'application', label: 'Postulación de Arriendo', component: <RentalApplicationForm /> },
  ];

  // Datos de ejemplo para la postulación de arriendo
  const sampleProperty = {
    id: 'sample-property-id',
    owner_id: 'sample-owner-id',
    status: 'activa' as const,
    listing_type: 'arriendo' as const,
    address_street: 'Av. Providencia',
    address_number: '1234',
    address_department: 'Apt 45',
    address_commune: 'Providencia',
    address_region: 'Metropolitana',
    price_clp: 800000,
    common_expenses_clp: 50000,
    bedrooms: 2,
    bathrooms: 2,
    surface_m2: 85,
    description: 'Hermoso departamento en el corazón de Providencia, cerca del metro y con excelente conectividad.',
    created_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Plataforma Inmobiliaria - Demo
              </h1>
              <p className="text-gray-600 mt-2">
                Sistema completo de gestión inmobiliaria con Supabase
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Usuario autenticado:</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegación por pestañas */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {activeTab === 'auth' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Autenticación
                </h2>
                <p className="text-gray-600 mb-6">
                  Registra una nueva cuenta o inicia sesión para acceder a todas las funcionalidades.
                </p>
                <AuthForm />
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Perfil de Usuario
                </h2>
                <p className="text-gray-600 mb-6">
                  Completa tu perfil con información personal, dirección y documentos.
                </p>
                {user ? (
                  <UserProfileForm />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      Debes iniciar sesión para acceder a tu perfil.
                    </p>
                    <button
                      onClick={() => setActiveTab('auth')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ir a Autenticación
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'property' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Publicar Propiedad
                </h2>
                <p className="text-gray-600 mb-6">
                  Publica una nueva propiedad para venta o arriendo con imágenes y documentos legales.
                </p>
                {user ? (
                  <PropertyPublicationForm />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      Debes iniciar sesión para publicar propiedades.
                    </p>
                    <button
                      onClick={() => setActiveTab('auth')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ir a Autenticación
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'application' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Postulación de Arriendo
                </h2>
                <p className="text-gray-600 mb-6">
                  Postula a una propiedad en arriendo con tu información personal y la de tu aval.
                </p>
                {user ? (
                  <RentalApplicationForm 
                    property={sampleProperty}
                    onSuccess={() => {
                      alert('¡Postulación enviada exitosamente!');
                    }}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      Debes iniciar sesión para postular a propiedades.
                    </p>
                    <button
                      onClick={() => setActiveTab('auth')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ir a Autenticación
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Información del sistema */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            Información del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Base de Datos</h4>
              <ul className="text-blue-600 space-y-1">
                <li>• 8 tablas normalizadas</li>
                <li>• Row Level Security (RLS)</li>
                <li>• Triggers automáticos</li>
                <li>• Políticas de seguridad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Funcionalidades</h4>
              <ul className="text-blue-600 space-y-1">
                <li>• Autenticación completa</li>
                <li>• Gestión de perfiles</li>
                <li>• Publicación de propiedades</li>
                <li>• Postulaciones de arriendo</li>
                <li>• Gestión de documentos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
