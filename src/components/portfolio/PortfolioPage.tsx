import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, Bed, Bath, Square, DollarSign, Building } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CustomButton from '../common/CustomButton';

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    // Verify user is authenticated before making any database queries
    if (!user || !user.id) {
      console.warn('User not authenticated, cannot fetch properties');
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            image_url,
            storage_path
          )
        `)
        .eq('owner_id', user.id) // Use user.id directly since we verified it exists
        .order('created_at', { ascending: false });

      if (error) {
        // Handle RLS policy violations specifically
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: User does not have permission to view properties');
          setProperties([]);
        } else {
          throw error;
        }
      } else {
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]); // Clear properties on error to prevent stale data
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    // Verify user is authenticated
    if (!user || !user.id) {
      console.error('User not authenticated, cannot delete property');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Additional RLS check - ensure user owns the property

      if (error) {
        // Handle RLS policy violations
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: User does not have permission to delete this property');
          alert('No tienes permisos para eliminar esta propiedad');
        } else {
          throw error;
        }
      } else {
        // Update local state only if deletion was successful
        setProperties(properties.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad. Por favor, intenta nuevamente.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'rented': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Disponible';
      case 'sold': return 'Vendida';
      case 'rented': return 'Arrendada';
      case 'inactive': return 'Inactiva';
      default: return status;
    }
  };

  // Check authentication before showing any content
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Acceso Restringido
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Necesitas iniciar sesión para ver tu portafolio de propiedades.
          </p>
          <div className="mt-6">
            <CustomButton
              onClick={() => window.location.href = '/auth'}
              variant="primary"
            >
              Ir a Iniciar Sesión
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando tus propiedades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Portafolio</h1>
        <p className="text-gray-600 mb-6">Gestiona todas tus propiedades desde aquí</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/property/new?type=venta"
            className="flex items-center justify-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Propiedad en Venta</span>
          </Link>
          <Link
            to="/property/new/rental"
            className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Propiedad en Arriendo</span>
          </Link>
        </div>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes propiedades aún</h3>
          <p className="text-gray-500 mb-6">Comienza publicando tu primera propiedad</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/property/new?type=venta"
              className="flex items-center justify-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Publicar en Venta</span>
            </Link>
            <Link
              to="/property/new/rental"
              className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Publicar en Arriendo</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Property Image */}
              <div className="h-48 bg-gray-200 relative">
                {property.property_images && property.property_images.length > 0 ? (
                  <img
                    src={property.property_images[0].image_url}
                    alt={`${property.address_street || ''} ${property.address_number || ''}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                    {getStatusLabel(property.status)}
                  </span>
                </div>

                {/* Listing Type Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || 'Tipo no especificado'}
                  </span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {property.address || 'Dirección no especificada'}
                  </h3>
                  <div className="flex space-x-2 ml-2">
                    <Link
                      to={`/property/edit/${property.id}`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteProperty(property.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.comuna || 'Comuna no especificada'}, {property.region || 'Región no especificada'}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{property.bathrooms}</span>
                    </div>
                    {property.surface && (
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        <span>{property.surface}m²</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-lg font-bold text-gray-900">
                    <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                    <span>{formatPrice(property.price)}</span>
                  </div>
                  <Link
                    to={`/property/${property.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};