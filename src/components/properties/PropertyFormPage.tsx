import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import PropertyPublicationForm from './PropertyPublicationForm';
import { RentalPublicationForm } from './RentalPublicationForm';
import { SalePublicationForm } from './SalePublicationForm';
import { Property, supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const PropertyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(false);

  // Determinar el tipo de formulario basado en la URL y parámetros
  const getFormType = () => {
    // Si hay un ID, es edición
    if (id) return 'edit';

    // Si hay parámetro type, usar ese tipo
    const type = searchParams.get('type');
    if (type === 'venta') return 'venta';
    if (type === 'arriendo') return 'arriendo';

    // Si la ruta incluye 'rental', es arriendo
    if (window.location.pathname.includes('/rental')) return 'arriendo';

    // Por defecto, mostrar selector de tipo
    return 'selector';
  };

  const formType = getFormType();

  const handleSuccess = () => {
    // Redirigir al portfolio después de publicar
    navigate('/portfolio');
  };

  const handleCancel = () => {
    // Redirigir al portfolio al cancelar
    navigate('/portfolio');
  };

  // Cargar propiedad para edición
  useEffect(() => {
    if (formType === 'edit' && id && user) {
      loadPropertyForEdit();
    }
  }, [formType, id, user]);

  const loadPropertyForEdit = async () => {
    if (!id || !user) return;

    setLoadingProperty(true);
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Verificar que el usuario actual es el dueño
      if (property.owner_id !== user.id) {
        alert('No tienes permiso para editar esta propiedad');
        navigate('/portfolio');
        return;
      }

      setEditingProperty(property);
    } catch (error: any) {
      console.error('Error loading property for edit:', error);
      alert('Error al cargar la propiedad: ' + error.message);
      navigate('/portfolio');
    } finally {
      setLoadingProperty(false);
    }
  };

  // Si es edición, mostrar loading o el formulario correspondiente
  if (formType === 'edit') {
    if (loadingProperty) {
      return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propiedad...</p>
          </div>
        </div>
      );
    }

    if (!editingProperty) {
      return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Propiedad no encontrada</h2>
            <p className="text-gray-600 mb-6">
              No se pudo cargar la propiedad para editar.
            </p>
            <button
              onClick={() => navigate('/portfolio')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver al Portafolio
            </button>
          </div>
        </div>
      );
    }

    // Determinar qué formulario usar basado en el tipo de propiedad
    const editFormType = editingProperty.listing_type === 'arriendo' ? 'arriendo' : 'venta';

    // Renderizar formulario correspondiente con datos de edición
    if (editFormType === 'arriendo') {
      return (
        <RentalPublicationForm
          initialData={editingProperty}
          isEditing={true}
          onSuccess={() => navigate(`/property/${editingProperty.id}`)}
          onCancel={() => navigate(`/property/${editingProperty.id}`)}
        />
      );
    }

    if (editFormType === 'venta') {
      return (
        <SalePublicationForm
          initialData={editingProperty}
          isEditing={true}
          onSuccess={() => navigate(`/property/${editingProperty.id}`)}
          onCancel={() => navigate(`/property/${editingProperty.id}`)}
        />
      );
    }

    // Fallback - formulario genérico
    return (
      <PropertyPublicationForm
        initialData={editingProperty}
        isEditing={true}
        onSuccess={() => navigate(`/property/${editingProperty.id}`)}
        onCancel={() => navigate(`/property/${editingProperty.id}`)}
      />
    );
  }

  // Selector de tipo de publicación
  if (formType === 'selector') {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Publicar Nueva Propiedad
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opción Arriendo */}
          <div
            onClick={() => navigate('/property/new/rental')}
            className="cursor-pointer border-2 border-emerald-200 rounded-lg p-6 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Publicar en Arriendo</h3>
              <p className="text-gray-600 mb-4">
                Publica tu propiedad para alquiler mensual. Incluye información detallada del propietario y documentos legales.
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                Recomendado
              </span>
            </div>
          </div>

          {/* Opción Venta */}
          <div
            onClick={() => navigate('/property/new?type=venta')}
            className="cursor-pointer border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Publicar en Venta</h3>
              <p className="text-gray-600 mb-4">
                Publica tu propiedad para venta. Incluye información detallada del propietario y documentos legales.
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Venta Directa
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/portfolio')}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar formulario correspondiente
  if (formType === 'arriendo') {
    return (
      <RentalPublicationForm />
    );
  }

  if (formType === 'venta') {
    return (
      <SalePublicationForm />
    );
  }

  // Fallback - formulario genérico
  return (
    <PropertyPublicationForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

export default PropertyFormPage;
