import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, DollarSign, Building, Heart, TrendingUp, MessageSquare, Eye } from 'lucide-react';

interface Property {
  id: string;
  owner_id: string;
  status: 'activa' | 'inactiva' | 'vendida' | 'alquilada';
  listing_type: 'venta' | 'arriendo';
  address_street: string;
  address_number: string;
  address_department?: string;
  address_commune: string;
  address_region: string;
  price_clp: number;
  common_expenses_clp?: number;
  bedrooms: number;
  bathrooms: number;
  surface_m2: number;
  description?: string;
  photos_urls?: string[];
  created_at: string;
}

interface PropertyCardProps {
  property: Property;
  showActions?: boolean;
  onMakeOffer?: (property: Property) => void;
  onApply?: (property: Property) => void;
  onToggleFavorite?: (propertyId: string) => void;
  isFavorite?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showActions = true,
  onMakeOffer,
  onApply,
  onToggleFavorite,
  isFavorite = false
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleMakeOffer = () => {
    onMakeOffer?.(property);
  };

  const handleApply = () => {
    onApply?.(property);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleFavorite?.(property.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Property Image */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        {property.photos_urls && property.photos_urls.length > 0 ? (
          <img
            src={property.photos_urls[0]}
            alt={`${property.address_street} ${property.address_number}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite
                  ? 'text-red-500 fill-current'
                  : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            property.listing_type === 'venta'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1)}
          </span>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
            {property.address_street} {property.address_number}
            {property.address_department && `, ${property.address_department}`}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{property.address_commune}, {property.address_region}</span>
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
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.surface_m2}m²</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-lg font-bold text-gray-900">
            <DollarSign className="h-5 w-5 mr-1 text-green-600" />
            <span>{formatPrice(property.price)}</span>
          </div>
          {property.common_expenses_clp && property.common_expenses_clp > 0 && (
            <div className="text-sm text-gray-500">
              + {formatPrice(property.common_expenses_clp)} gastos comunes
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {property.listing_type === 'venta' ? (
                <button
                  onClick={handleMakeOffer}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Ofertar</span>
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Postular</span>
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
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
