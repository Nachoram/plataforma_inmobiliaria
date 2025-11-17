import React, { useState, useEffect } from 'react';
import { Plus, Building, MapPin, DollarSign, Eye, Search, Filter, TrendingUp, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserSaleProperties, Property, formatPriceCLP } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

interface PropertyWithOffers extends Property {
  offer_count?: number;
  latest_offer_amount?: number;
  property_images?: Array<{ image_url: string }>;
}

const MySalesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyWithOffers[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithOffers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    if (user) {
      fetchSaleProperties();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [properties, searchTerm, statusFilter]);

  const fetchSaleProperties = async () => {
    setLoading(true);
    try {
      const data = await getUserSaleProperties();
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching sale properties:', error);
      toast.error('Error al cargar las propiedades en venta');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(prop =>
        prop.address_street.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.address_commune.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(prop => prop.status === statusFilter);
    }

    setFilteredProperties(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'vendida': return 'bg-blue-100 text-blue-800';
      case 'pausada': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'vendida': return 'Vendida';
      case 'pausada': return 'Pausada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando tus propiedades en venta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg border p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Propiedades en Venta</h1>
            <p className="text-blue-100">
              Administra tus propiedades publicadas y gestiona las ofertas recibidas
            </p>
          </div>

          <Link to="/property/new?type=venta">
            <CustomButton variant="secondary" className="flex items-center space-x-2 bg-white text-blue-700 hover:bg-blue-50">
              <Plus className="h-5 w-5" />
              <span>Publicar Propiedad</span>
            </CustomButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-200" />
              <div>
                <p className="text-2xl font-bold">{properties.length}</p>
                <p className="text-sm text-blue-200">Propiedades</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-green-200" />
              <div>
                <p className="text-2xl font-bold">
                  {properties.filter(p => p.status === 'disponible').length}
                </p>
                <p className="text-sm text-blue-200">Disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-yellow-200" />
              <div>
                <p className="text-2xl font-bold">
                  {properties.reduce((acc, p) => acc + (p.offer_count || 0), 0)}
                </p>
                <p className="text-sm text-blue-200">Ofertas Totales</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por dirección o comuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="vendida">Vendida</option>
              <option value="pausada">Pausada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              {properties.length === 0 ? (
                <>
                  <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes propiedades en venta publicadas
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Comienza publicando tu primera propiedad en venta
                  </p>
                  <Link to="/property/new?type=venta">
                    <CustomButton variant="primary" className="flex items-center space-x-2 mx-auto">
                      <Plus className="h-5 w-5" />
                      <span>Publicar Propiedad</span>
                    </CustomButton>
                  </Link>
                </>
              ) : (
                <>
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron propiedades
                  </h3>
                  <p className="text-gray-500">
                    No hay propiedades que coincidan con los filtros aplicados
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/my-sales/${property.id}`)}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {property.property_images && property.property_images.length > 0 ? (
                      <img
                        src={property.property_images[0].image_url}
                        alt={property.address_street}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <Building className="h-16 w-16 text-blue-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                        {getStatusLabel(property.status)}
                      </span>
                    </div>

                    {/* Offers Badge */}
                    {property.offer_count && property.offer_count > 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{property.offer_count} {property.offer_count === 1 ? 'oferta' : 'ofertas'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {property.address_street} {property.address_number}
                    </h3>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{property.address_commune}</span>
                    </div>

                    <div className="flex items-center text-xl font-bold text-blue-600 mb-4">
                      <DollarSign className="h-5 w-5" />
                      <span>{formatPriceCLP(property.price_clp)}</span>
                    </div>

                    {/* Latest Offer */}
                    {property.latest_offer_amount && (
                      <div className="bg-orange-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-orange-700 font-medium">Última oferta:</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatPriceCLP(property.latest_offer_amount)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/my-sales/${property.id}`);
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Administrar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySalesPage;

