import React, { useState, useEffect } from 'react';
import { Search, Filter, Building, Heart, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { OfferModal } from './OfferModal';
import RentalApplicationForm from '../properties/RentalApplicationForm';
import { useAuth } from '../../hooks/useAuth';
import PropertyCard from '../PropertyCard';
import { usePropertyRoutePreloader } from '../../hooks/useRoutePreloader';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();

  // Preload rutas relacionadas con propiedades para mejor UX
  usePropertyRoutePreloader();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
        .eq('status', 'disponible')
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
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl shadow-soft text-white padding-mobile">
        <div className="text-center">
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold mb-3 xs:mb-4">
            🏠 Marketplace Inmobiliario
          </h1>
          <p className="text-base xs:text-lg md:text-xl text-blue-100 mb-4 xs:mb-6">
            Encuentra, oferta y postula por propiedades en toda Chile
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por dirección, comuna o descripción..."
                className="w-full pl-12 pr-4 py-3 xs:py-4 text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-blue-300 text-base mobile-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 xs:gap-6">
        <div className="bg-white rounded-xl shadow-soft border p-4 xs:p-6 text-center mobile-card">
          <Building className="h-6 w-6 xs:h-8 xs:w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-xl xs:text-2xl font-bold text-gray-900">{properties.length}</p>
          <p className="text-mobile-sm text-gray-600">Propiedades Disponibles</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft border p-4 xs:p-6 text-center mobile-card">
          <TrendingUp className="h-6 w-6 xs:h-8 xs:w-8 text-green-600 mx-auto mb-2" />
          <p className="text-xl xs:text-2xl font-bold text-gray-900">{properties.filter(p => p.listing_type === 'venta').length}</p>
          <p className="text-mobile-sm text-gray-600">En Venta</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft border p-4 xs:p-6 text-center mobile-card">
          <Heart className="h-6 w-6 xs:h-8 xs:w-8 text-red-600 mx-auto mb-2" />
          <p className="text-xl xs:text-2xl font-bold text-gray-900">{properties.filter(p => p.listing_type === 'arriendo').length}</p>
          <p className="text-mobile-sm text-gray-600">En Arriendo</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl shadow-soft border p-4 xs:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-lg font-semibold text-gray-900 mobile-btn"
          >
            <Filter className="h-5 w-5 mr-2" />
            <span>Filtros Avanzados</span>
            {showFilters ? (
              <ChevronUp className="h-5 w-5 ml-2" />
            ) : (
              <ChevronDown className="h-5 w-5 ml-2" />
            )}
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-mobile-sm text-gray-600 hidden xs:block">
              {filteredProperties.length} propiedades
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 text-mobile-sm font-medium mobile-btn px-3 py-1"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Mobile Filters Toggle */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-between text-mobile-sm text-gray-600">
            <span>{filteredProperties.length} propiedades encontradas</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-blue-600 mobile-btn"
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              {showFilters ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Filters Content */}
        <div className={`transition-all duration-300 overflow-hidden ${
          showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
        }`}>
          <div className="space-mobile">
            {/* Primary filters - always visible on desktop */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 xs:gap-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="mobile-input text-mobile-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="venta">Venta</option>
                <option value="arriendo">Arriendo</option>
              </select>

              <select
                value={filters.comuna}
                onChange={(e) => setFilters({ ...filters, comuna: e.target.value })}
                className="mobile-input text-mobile-sm"
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
                className="mobile-input text-mobile-sm"
              />

              <input
                type="number"
                placeholder="Precio máx"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="mobile-input text-mobile-sm"
              />

              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                className="mobile-input text-mobile-sm"
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
                className="mobile-input text-mobile-sm"
              />
            </div>

            {/* Results count - desktop only */}
            <div className="hidden md:flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredProperties.length} propiedades encontradas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-8 xs:py-12">
          <Building className="h-12 w-12 xs:h-16 xs:w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-2">No hay propiedades disponibles</h3>
          <p className="text-mobile-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid-mobile-cards">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              context="marketplace"
              onMakeOffer={handleMakeOffer}
              onApply={handleApply}
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.includes(property.id)}
            />
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
