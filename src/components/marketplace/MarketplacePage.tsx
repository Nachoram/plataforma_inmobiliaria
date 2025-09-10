import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Bed, Bath, Square, DollarSign, Building, Heart, MessageSquare, TrendingUp, Eye } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { OfferModal } from './OfferModal';
import RentalApplicationForm from '../properties/RentalApplicationForm';
import { useAuth } from '../../hooks/useAuth';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    comuna: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    minSurface: '',
    maxSurface: '',
  });

  useEffect(() => {
    fetchProperties();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  // Función para validar propiedades con datos mínimos requeridos
  const isValidProperty = (property: any): boolean => {
    return (
      property &&
      typeof property === 'object' &&
      property.id &&
      typeof property.id === 'string' &&
      property.owner_id &&
      typeof property.owner_id === 'string'
    );
  };

  const fetchProperties = async () => {
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
        .eq('status', 'activa')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle RLS policy violations specifically
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: Cannot access public properties');
          // For marketplace, this shouldn't happen with public properties, but log it
        } else {
          throw error;
        }
      }

      // Filtrar propiedades inválidas - usar campos correctos de la BD
      const validProperties = (data || [])
        .filter(isValidProperty)
        .map(property => ({
          ...property,
          // Usar nombres de campos correctos de la BD (sin crear aliases inconsistentes)
          // address_street, address_commune, address_region, listing_type, price_clp, surface_m2
          // Los campos opcionales ya vienen con valores por defecto de la BD
        }));

      console.log(`📊 Fetched ${validProperties.length} valid properties out of ${(data || []).length} total`);
      setProperties(validProperties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]); // Asegurar que properties sea un array vacío en caso de error
      // Could show user-friendly error message here
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Search filter - Safe access with null checks
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(property => {
        const address = property.address_street || '';
        const comuna = property.address_commune || '';
        const region = property.address_region || '';
        const description = property.description || '';

        return address.toLowerCase().includes(searchTerm) ||
               comuna.toLowerCase().includes(searchTerm) ||
               region.toLowerCase().includes(searchTerm) ||
               description.toLowerCase().includes(searchTerm);
      });
    }

    // Type filter - Safe access
    if (filters.type) {
      filtered = filtered.filter(property => property.listing_type && property.listing_type === filters.type);
    }

    // Comuna filter - Safe access
    if (filters.comuna) {
      const comunaFilter = filters.comuna.toLowerCase();
      filtered = filtered.filter(property =>
        property.address_commune && property.address_commune.toLowerCase().includes(comunaFilter)
      );
    }

    // Price range filter - Safe access with number validation
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter(property =>
        typeof property.price_clp === 'number' && property.price_clp >= minPrice
      );
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter(property =>
        typeof property.price_clp === 'number' && property.price_clp <= maxPrice
      );
    }

    // Bedrooms filter - Safe access with number validation
    if (filters.bedrooms) {
      const minBedrooms = parseInt(filters.bedrooms);
      filtered = filtered.filter(property =>
        typeof property.bedrooms === 'number' && property.bedrooms >= minBedrooms
      );
    }

    // Surface filter - Safe access with number validation
    if (filters.minSurface) {
      const minSurface = parseInt(filters.minSurface);
      filtered = filtered.filter(property =>
        typeof property.surface_m2 === 'number' && property.surface_m2 >= minSurface
      );
    }
    if (filters.maxSurface) {
      const maxSurface = parseInt(filters.maxSurface);
      filtered = filtered.filter(property =>
        typeof property.surface_m2 === 'number' && property.surface_m2 <= maxSurface
      );
    }

    setFilteredProperties(filtered);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      comuna: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      minSurface: '',
      maxSurface: '',
    });
  };

  const formatPrice = (price: number | undefined | null) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'Precio no disponible';
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getUniqueValues = (field: keyof Property) => {
    return [...new Set(
      properties
        .map(p => p[field] as string)
        .filter(value => value && typeof value === 'string' && value.trim() !== '')
    )];
  };

  const handleMakeOffer = (property: Property) => {
    if (!user || !user.id) {
      alert('Debes iniciar sesión para hacer una oferta');
      // Optionally redirect to login page
      // window.location.href = '/auth';
      return;
    }
    setSelectedProperty(property);
    setShowOfferModal(true);
  };

  const handleApply = (property: Property) => {
    if (!user || !user.id) {
      alert('Debes iniciar sesión para postular a esta propiedad');
      // Optionally redirect to login page
      // window.location.href = '/auth';
      return;
    }
    setSelectedProperty(property);
    setShowApplicationForm(true);
  };

  const onOfferSuccess = () => {
    setShowOfferModal(false);
    setSelectedProperty(null);
    // Opcional: refrescar propiedades
  };

  const onApplicationSuccess = () => {
    setShowApplicationForm(false);
    setSelectedProperty(null);
    // Opcional: refrescar propiedades
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
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl shadow-lg text-white p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🏠 Marketplace Inmobiliario</h1>
          <p className="text-xl text-blue-100 mb-6">
            Encuentra, oferta y postula por propiedades en toda Chile
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por dirección, comuna o descripción..."
                className="w-full pl-12 pr-4 py-3 text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
          <p className="text-gray-600">Propiedades Disponibles</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{properties.filter(p => p.listing_type === 'venta').length}</p>
          <p className="text-gray-600">En Venta</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{properties.filter(p => p.listing_type === 'arriendo').length}</p>
          <p className="text-gray-600">En Arriendo</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros Avanzados
          </h2>
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="venta">Venta</option>
            <option value="arriendo">Arriendo</option>
          </select>

          <select
            value={filters.comuna}
            onChange={(e) => setFilters({ ...filters, comuna: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las comunas</option>
            {getUniqueValues('comuna').map(comuna => (
              <option key={comuna} value={comuna}>{comuna}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Precio mín"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Precio máx"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.bedrooms}
            onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Cualquier dormitorio</option>
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}+ dormitorios</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Superficie mín"
            value={filters.minSurface}
            onChange={(e) => setFilters({ ...filters, minSurface: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredProperties.length} propiedades encontradas
          </p>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay propiedades disponibles</h3>
          <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {/* Property Image */}
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {property.property_images && Array.isArray(property.property_images) && property.property_images.length > 0 ? (
                  <img
                    src={property.property_images[0].image_url}
                    alt={`${property.address_street || 'Propiedad'} ${property.address_number || ''}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(property.id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      favorites.includes(property.id) 
                        ? 'text-red-500 fill-current' 
                        : 'text-gray-600'
                    }`} 
                  />
                </button>

                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    property.listing_type === 'venta'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {property.listing_type
                      ? property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1)
                      : 'Tipo desconocido'
                    }
                  </span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
                    {property.address_street ? `${property.address_street} ${property.address_number || ''}` : 'Dirección no disponible'}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{property.address_commune || 'Comuna no disponible'}, {property.address_region || 'Región no disponible'}</span>
                  </div>
                </div>

                {property.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {property.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span>{typeof property.bedrooms === 'number' ? property.bedrooms : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span>{typeof property.bathrooms === 'number' ? property.bathrooms : 'N/A'}</span>
                    </div>
                    {typeof property.surface_m2 === 'number' && property.surface_m2 > 0 && (
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1" />
                        <span>{property.surface_m2}m²</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-lg font-bold text-gray-900">
                    <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                    <span>{formatPrice(property.price_clp)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {property.listing_type === 'venta' ? (
                      <button
                        onClick={() => handleMakeOffer(property)}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span>Ofertar</span>
                      </button>
                    ) : property.listing_type === 'arriendo' ? (
                      <button
                        onClick={() => handleApply(property)}
                        className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Postular</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-not-allowed"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Tipo desconocido</span>
                      </button>
                    )}
                    
                    <Link
                      to={`/property/${property.id}`}
                      className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver detalles</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showOfferModal && selectedProperty && (
        <OfferModal
          property={selectedProperty}
          onClose={() => setShowOfferModal(false)}
          onSuccess={onOfferSuccess}
        />
      )}

      {showApplicationForm && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <RentalApplicationForm
              property={selectedProperty}
              onSuccess={onApplicationSuccess}
              onCancel={() => setShowApplicationForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
