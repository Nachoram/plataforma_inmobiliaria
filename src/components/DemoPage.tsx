import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthForm from './auth/AuthForm';
import PropertyPublicationForm from './properties/PropertyPublicationForm';
import RentalApplicationForm from './properties/RentalApplicationForm';
import UserProfileForm from './profile/UserProfileForm';
import PropertyCard from './PropertyCard';
import CustomButton from './CustomButton';

const DemoPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [loadingButton, setLoadingButton] = useState(false);

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

  // Datos de ejemplo para PropertyCard
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
    photos_urls: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'
    ],
    created_at: new Date().toISOString(),
  };

  // Callbacks para los formularios
  const handleFormSuccess = (formName: string) => {
    console.log(`✅ ${formName}: Operación completada exitosamente`);
    alert(`✅ ${formName}: ¡Operación completada exitosamente!`);
  };

  const handleFormCancel = (formName: string) => {
    console.log(`❌ ${formName}: Operación cancelada por el usuario`);
    alert(`❌ ${formName}: Operación cancelada`);
  };

  // Callbacks para PropertyCard
  const handleMakeOffer = (property: any) => {
    console.log('💰 Oferta realizada para propiedad:', property.id);
    alert('💰 ¡Oferta enviada exitosamente!');
  };

  const handleApply = (property: any) => {
    console.log('📝 Postulación realizada para propiedad:', property.id);
    alert('📝 ¡Postulación enviada exitosamente!');
  };

  const handleToggleFavorite = (propertyId: string) => {
    console.log('❤️ Favorito toggled para propiedad:', propertyId);
    alert('❤️ ¡Favorito actualizado!');
  };

  // Callbacks para botones de demostración
  const handleButtonDemo = async (action: string) => {
    setLoadingButton(true);
    console.log(`🚀 Ejecutando acción: ${action}`);

    // Simular una operación asíncrona
    setTimeout(() => {
      setLoadingButton(false);
      alert(`✅ Acción "${action}" completada`);
    }, 2000);
  };

  const sections = [
    { id: 'overview', label: 'Vista General', icon: '📊' },
    { id: 'buttons', label: 'Botones', icon: '🔘' },
    { id: 'property-card', label: 'Tarjeta Propiedad', icon: '🏠' },
    { id: 'forms', label: 'Formularios', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🏗️ Demo - Plataforma Inmobiliaria
              </h1>
              <p className="text-gray-600 mt-2">
                Showcase completo de componentes y funcionalidades
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
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Vista General del Sistema</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="text-3xl mb-2">🔐</div>
                  <h3 className="text-lg font-semibold mb-2">Autenticación</h3>
                  <p className="text-blue-100 text-sm">Sistema completo de login/registro con Supabase Auth</p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="text-3xl mb-2">👤</div>
                  <h3 className="text-lg font-semibold mb-2">Perfiles</h3>
                  <p className="text-green-100 text-sm">Gestión completa de perfiles de usuario con documentos</p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="text-3xl mb-2">🏠</div>
                  <h3 className="text-lg font-semibold mb-2">Propiedades</h3>
                  <p className="text-purple-100 text-sm">Publicación y gestión de propiedades en venta/arriendo</p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="text-lg font-semibold mb-2">Aplicaciones</h3>
                  <p className="text-orange-100 text-sm">Sistema de postulaciones con avales y documentos</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ Tecnologías Utilizadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Frontend</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• React 18 + TypeScript</li>
                      <li>• Tailwind CSS</li>
                      <li>• React Router</li>
                      <li>• Lucide Icons</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Backend</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Supabase</li>
                      <li>• PostgreSQL</li>
                      <li>• Row Level Security</li>
                      <li>• Edge Functions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Características</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Autenticación completa</li>
                      <li>• Gestión de archivos</li>
                      <li>• Formularios avanzados</li>
                      <li>• Responsive design</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons Section */}
          {activeSection === 'buttons' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔘 Componente CustomButton</h2>
              <p className="text-gray-600 mb-8">
                Variantes disponibles del componente CustomButton con diferentes estilos y estados.
              </p>

              <div className="space-y-8">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🎨 Variantes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Primary</h4>
                      <CustomButton variant="primary" onClick={() => handleButtonDemo('Primary')}>
                        Primary Button
                      </CustomButton>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Secondary</h4>
                      <CustomButton variant="secondary" onClick={() => handleButtonDemo('Secondary')}>
                        Secondary Button
                      </CustomButton>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Danger</h4>
                      <CustomButton variant="danger" onClick={() => handleButtonDemo('Danger')}>
                        Danger Button
                      </CustomButton>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Success</h4>
                      <CustomButton variant="success" onClick={() => handleButtonDemo('Success')}>
                        Success Button
                      </CustomButton>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Outline</h4>
                      <CustomButton variant="outline" onClick={() => handleButtonDemo('Outline')}>
                        Outline Button
                      </CustomButton>
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📏 Tamaños</h3>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm">Small</h4>
                      <CustomButton variant="primary" size="sm" onClick={() => handleButtonDemo('Small')}>
                        Small
                      </CustomButton>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm">Medium</h4>
                      <CustomButton variant="primary" size="md" onClick={() => handleButtonDemo('Medium')}>
                        Medium
                      </CustomButton>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm">Large</h4>
                      <CustomButton variant="primary" size="lg" onClick={() => handleButtonDemo('Large')}>
                        Large
                      </CustomButton>
                    </div>
                  </div>
                </div>

                {/* States */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 Estados</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Loading State</h4>
                      <CustomButton
                        variant="primary"
                        loading={loadingButton}
                        onClick={() => handleButtonDemo('Loading')}
                      >
                        {loadingButton ? 'Cargando...' : 'Click para loading'}
                      </CustomButton>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Disabled State</h4>
                      <CustomButton variant="primary" disabled>
                        Disabled Button
                      </CustomButton>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Full Width</h4>
                      <CustomButton variant="primary" fullWidth onClick={() => handleButtonDemo('Full Width')}>
                        Full Width Button
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Property Card Section */}
          {activeSection === 'property-card' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏠 Componente PropertyCard</h2>
              <p className="text-gray-600 mb-8">
                Tarjeta interactiva para mostrar propiedades con acciones disponibles.
              </p>

              <div className="max-w-md mx-auto">
                <PropertyCard
                  property={sampleProperty}
                  onMakeOffer={handleMakeOffer}
                  onApply={handleApply}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>

              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">ℹ️ Información del Componente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Características</h4>
                    <ul className="text-blue-600 space-y-1">
                      <li>• Imagen de propiedad</li>
                      <li>• Información completa</li>
                      <li>• Precio formateado</li>
                      <li>• Iconos descriptivos</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Acciones</h4>
                    <ul className="text-blue-600 space-y-1">
                      <li>• Marcar como favorito</li>
                      <li>• Hacer oferta (venta)</li>
                      <li>• Postular (arriendo)</li>
                      <li>• Ver detalles</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forms Section */}
          {activeSection === 'forms' && (
            <div className="space-y-8">
              {/* User Profile Form */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Formulario de Perfil de Usuario</h2>
                <p className="text-gray-600 mb-6">
                  Formulario completo para gestión de perfiles con validación y subida de documentos.
                </p>
                {user ? (
                  <UserProfileForm
                    onSuccess={() => handleFormSuccess('Perfil de Usuario')}
                    onCancel={() => handleFormCancel('Perfil de Usuario')}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">
                      Debes iniciar sesión para acceder al formulario de perfil.
                    </p>
                    <button
                      onClick={() => setActiveSection('overview')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ir a Vista General
                    </button>
                  </div>
                )}
              </div>

              {/* Property Publication Form */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🏠 Formulario de Publicación de Propiedad</h2>
                <p className="text-gray-600 mb-6">
                  Formulario avanzado para publicar propiedades con imágenes y documentos legales.
                </p>
                {user ? (
                  <PropertyPublicationForm
                    onSuccess={() => handleFormSuccess('Publicación de Propiedad')}
                    onCancel={() => handleFormCancel('Publicación de Propiedad')}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">
                      Debes iniciar sesión para publicar propiedades.
                    </p>
                    <button
                      onClick={() => setActiveSection('overview')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ir a Vista General
                    </button>
                  </div>
                )}
              </div>

              {/* Rental Application Form */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Formulario de Postulación de Arriendo</h2>
                <p className="text-gray-600 mb-6">
                  Formulario completo de postulación con información personal y datos del aval.
                </p>
                {user ? (
                  <RentalApplicationForm
                    property={sampleProperty}
                    onSuccess={() => handleFormSuccess('Postulación de Arriendo')}
                    onCancel={() => handleFormCancel('Postulación de Arriendo')}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">
                      Debes iniciar sesión para postular a propiedades.
                    </p>
                    <button
                      onClick={() => setActiveSection('overview')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Ir a Vista General
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
