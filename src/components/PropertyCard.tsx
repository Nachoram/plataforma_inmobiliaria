import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, DollarSign, Building, Heart, TrendingUp, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
import { Property as SupabaseProperty, formatPriceCLP, isValidPrice } from '../lib/supabase';
import CustomButton from './common/CustomButton';

// Usar la interfaz Property de supabase.ts para consistencia
type Property = SupabaseProperty;

interface PropertyWithImages extends SupabaseProperty {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

type PropertyCardContext = 'marketplace' | 'portfolio';

interface PropertyCardProps {
  property: PropertyWithImages;
  context: PropertyCardContext;
  showActions?: boolean;
  onMakeOffer?: (property: PropertyWithImages) => void;
  onApply?: (property: PropertyWithImages) => void;
  onToggleFavorite?: (propertyId: string) => void;
  onEdit?: (property: PropertyWithImages) => void;
  onDelete?: (propertyId: string) => void;
  isFavorite?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  context,
  showActions = true,
  onMakeOffer,
  onApply,
  onToggleFavorite,
  onEdit,
  onDelete,
  isFavorite = false
}) => {

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

  const handleEdit = () => {
    onEdit?.(property);
  };

  const handleDelete = () => {
    onDelete?.(property.id);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
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

        {/* Favorite Button - Only show in marketplace context */}
        {context === 'marketplace' && onToggleFavorite && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-pressed={isFavorite}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite
                  ? 'text-red-500 fill-current'
                  : 'text-gray-600'
              }`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Status Badge - Portfolio context */}
        {context === 'portfolio' && (
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
              {getStatusLabel(property.status)}
            </span>
          </div>
        )}

        {/* Type Badge */}
        {context === 'marketplace' && (
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              property.listing_type === 'venta'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1)}
            </span>
          </div>
        )}

        {/* Type Badge - Portfolio context (right side) */}
        {context === 'portfolio' && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || 'Tipo no especificado'}
            </span>
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4">
        <div className="mb-2">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {context === 'marketplace' 
                ? `${property.address_street} ${property.address_number}${property.address_department ? `, ${property.address_department}` : ''}`
                : property.address_street || 'Dirección no especificada'
              }
            </h3>
            {/* Edit/Delete buttons for portfolio context */}
            {context === 'portfolio' && (
              <div className="flex space-x-2 ml-2">
                <button
                  onClick={handleEdit}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
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
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1" />
              <span>{property.surface_m2 ?? 0}m²</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-lg font-bold text-gray-900">
            <DollarSign className="h-5 w-5 mr-1 text-green-600" />
            <span>{formatPriceCLP(isValidPrice(property.price_clp) ? property.price_clp : 0)}</span>
          </div>
          {context === 'marketplace' && isValidPrice(property.common_expenses_clp) && property.common_expenses_clp > 0 && (
            <div className="text-sm text-gray-500">
              + {formatPriceCLP(property.common_expenses_clp)} gastos comunes
            </div>
          )}
          {context === 'portfolio' && (
            <Link
              to={`/property/${property.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver detalles
            </Link>
          )}
        </div>

        {/* Action Buttons - Only for marketplace context */}
        {context === 'marketplace' && showActions && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {property.listing_type === 'venta' ? (
                <CustomButton
                  onClick={handleMakeOffer}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ofertar
                </CustomButton>
              ) : (
                <CustomButton
                  onClick={handleApply}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Postular
                </CustomButton>
              )}

              <Link to={`/property/${property.id}`} className="w-full">
                <CustomButton
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalles
                </CustomButton>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;

