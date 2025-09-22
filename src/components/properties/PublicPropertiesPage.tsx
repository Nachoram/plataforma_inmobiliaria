import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Bed, Bath, Square, DollarSign, Building } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';

export const PublicPropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    listingType: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(image_url)
        `)
        .eq('status', 'disponible')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle RLS policy violations specifically
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: Cannot access public properties');
          setProperties([]);
        } else {
          throw error;
        }
      } else {
        setProperties(data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]); // Clear properties on error
      // Could show user-friendly error message here
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(property => {
        const fullAddress = `${property.address_street || ''} ${property.address_number || ''}${property.address_department ? `, ${property.address_department}` : ''}`.toLowerCase();
        return fullAddress.includes(filters.search.toLowerCase()) ||
               (property.address_commune || '').toLowerCase().includes(filters.search.toLowerCase()) ||
               (property.address_region || '').toLowerCase().includes(filters.search.toLowerCase()) ||
               (property.description || '').toLowerCase().includes(filters.search.toLowerCase());
      });
    }

    // Listing type filter
    if (filters.listingType) {
      filtered = filtered.filter(property => property.listing_type === filters.listingType);
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(property =>
        (property.address_commune || '').toLowerCase().includes(filters.city.toLowerCase()) ||
        (property.address_region || '').toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Price range filter
    if (filters.minPrice) {
      filtered = filtered.filter(property => (property.price_clp || 0) >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(property => (property.price_clp || 0) <= parseFloat(filters.maxPrice));
    }

    // Bedrooms filter
    if (filters.bedrooms) {
      filtered = filtered.filter(property => property.bedrooms >= parseInt(filters.bedrooms));
    }

    setFilteredProperties(filtered);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      listingType: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getUniqueValues = (field: keyof Property) => {
    return [...new Set(properties.map(p => p[field] as string).filter(value => value && value.trim() !== ''))];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl shadow-lg text-white p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Encuentra tu Propiedad Ideal</h1>
          <p className="text-xl text-blue-100 mb-6">
            Explora miles de propiedades en venta y arriendo
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por dirección, ciudad o descripción..."
                className="w-full pl-12 pr-4 py-3 text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Operación
            </label>
            <select
              value={filters.listingType}
              onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="venta">Venta</option>
              <option value="arriendo">Arriendo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Cualquier ciudad"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Mínimo
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dormitorios Mín.
            </label>
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredProperties.length} de {properties.length} propiedades
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay propiedades disponibles
          </h3>
          <p className="text-gray-500">
            {properties.length === 0 
              ? 'Aún no hay propiedades publicadas' 
              : 'Intenta ajustar los filtros para ver más resultados'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            // Validación básica de datos requeridos
            if (!property || !property.id) {
              console.warn('Property missing required data:', property);
              return null;
            }

            return (
            <Link
              key={property.id}
              to={`/property/${property.id}`}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              {/* Property Image */}
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {property.property_images && property.property_images.length > 0 ? (
                  <img
                    src={property.property_images[0].image_url}
                    alt={`${property.address_street || ''} ${property.address_number || ''}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Listing Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    property.listing_type === 'venta'
                      ? 'bg-blue-100 text-blue-800'
                      : property.listing_type === 'arriendo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {property.listing_type && typeof property.listing_type === 'string'
                      ? property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1)
                      : 'Tipo desconocido'}
                  </span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
                    {`${property.address_street || ''} ${property.address_number || ''}${property.address_department ? `, ${property.address_department}` : ''}`}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{property.address_commune || ''}, {property.address_region || ''}</span>
                  </div>
                </div>

                {property.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {property.description}
                  </p>
                )}

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
                    {property.surface_m2 && (
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        <span>{property.surface_m2}m²</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-lg font-bold text-gray-900">
                    <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                    <span>{formatPrice(property.price_clp || 0)}</span>
                  </div>
                  <span className="text-blue-600 font-medium text-sm hover:text-blue-800">
                    Ver detalles →
                  </span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};