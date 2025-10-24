import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Building, Heart, TrendingUp, MessageSquare, Eye, Edit, Trash2, Home } from 'lucide-react';
import { SupabaseProperty, formatPriceCLP, isValidPrice, getPropertyTypeInfo } from '../lib/supabase';
import CustomButton from './common/CustomButton';
import ImageGallery from './common/ImageGallery';
import PostulationsList from './portfolio/PostulationsList';

// Usar la interfaz Property de supabase.ts para consistencia
type Property = SupabaseProperty;

interface Postulation {
  id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  message: string | null;
  application_characteristic_id: string | null;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  guarantor_name: string | null;
  guarantor_email: string | null;
  guarantor_phone: string | null;
  guarantor_characteristic_id: string | null;
}

interface PropertyWithImages extends SupabaseProperty {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
  postulation_count?: number;
  postulations?: Postulation[];
}

type PropertyCardContext = 'panel' | 'portfolio';

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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  postulations?: Postulation[];
}

const PropertyCard: React.FC<PropertyCardProps> = memo(({
  property,
  context,
  showActions = true,
  onMakeOffer,
  onApply,
  onToggleFavorite,
  onEdit,
  onDelete,
  isFavorite = false,
  isExpanded = false,
  onToggleExpand,
  postulations = []
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (property.property_images && property.property_images.length > 0) {
      setGalleryIndex(0);
      setShowGallery(true);
    }
  };

  const handleGalleryClose = () => {
    setShowGallery(false);
  };

  const handleGalleryNext = () => {
    if (property.property_images) {
      setGalleryIndex((prev) =>
        prev === property.property_images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleGalleryPrevious = () => {
    if (property.property_images) {
      setGalleryIndex((prev) =>
        prev === 0 ? property.property_images!.length - 1 : prev - 1
      );
    }
  };

  // Debug property_type values
  React.useEffect(() => {
    console.log('🔍 [PropertyCard] Property:', property.id, 'property_type:', property.property_type);
    console.log('🔍 [PropertyCard] getPropertyTypeInfo result:', getPropertyTypeInfo(property.property_type));
  }, [property.id, property.property_type]);

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
    <div className="property-card-wrapper">
      <div className="mobile-card overflow-hidden hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5 active:scale-98" onClick={onToggleExpand}>
      {/* Property Image */}
      <div className="h-40 xs:h-48 bg-gray-200 relative overflow-hidden">
        {property.property_images && property.property_images.length > 0 ? (
          <button
            onClick={handleImageClick}
            className="w-full h-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-xl"
            aria-label={`Ver galería de imágenes (${property.property_images.length} imagen${property.property_images.length !== 1 ? 'es' : ''})`}
          >
            <img
              src={property.property_images[0].image_url}
              alt={`${property.address_street || ''} ${property.address_number || ''}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {property.property_images.length > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-mobile-xs rounded-full">
                +{property.property_images.length - 1}
              </div>
            )}
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="h-10 w-10 xs:h-12 xs:w-12 text-gray-400" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute inset-0 p-3 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col space-y-2">
            {/* Type Badge */}
            {context === 'panel' && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full pointer-events-auto ${
                property.listing_type === 'venta'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {property.listing_type === 'venta' ? 'Venta' : 'Arriendo'}
              </span>
            )}

            {/* Status Badge - Portfolio context */}
            {context === 'portfolio' && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full pointer-events-auto ${getStatusColor(property.status)}`}>
                {getStatusLabel(property.status)}
              </span>
            )}
          </div>

          <div className="flex flex-col space-y-2 items-end">
            {/* Favorite Button - Only show in panel context */}
            {context === 'panel' && onToggleFavorite && (
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors pointer-events-auto mobile-btn"
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

            {/* Property Type Badge */}
            {property.property_type && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full pointer-events-auto ${getPropertyTypeInfo(property.property_type).bgColor} ${getPropertyTypeInfo(property.property_type).color}`}>
                {getPropertyTypeInfo(property.property_type).label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-3 xs:p-4">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base xs:text-lg font-semibold text-gray-900 mobile-line-clamp-2 flex-1 mr-2">
            {context === 'marketplace'
              ? `${property.address_street || ''} ${property.address_number || ''}${property.address_department ? `, ${property.address_department}` : ''}`
              : property.address_street || 'Dirección no especificada'
            }
          </h3>

          {/* Edit/Delete buttons for portfolio context */}
          {context === 'portfolio' && (
            <div className="flex space-x-1 ml-2 flex-shrink-0">
              <button
                onClick={handleEdit}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mobile-btn"
                title="Editar"
                aria-label="Editar propiedad"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors mobile-btn"
                title="Eliminar"
                aria-label="Eliminar propiedad"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Property Type (visible on all contexts) */}
        {property.property_type && (
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0 text-gray-600" />
            <span className={`text-xs xs:text-sm font-semibold px-2 py-0.5 rounded ${getPropertyTypeInfo(property.property_type).bgColor} ${getPropertyTypeInfo(property.property_type).color}`}>
              {getPropertyTypeInfo(property.property_type).label}
            </span>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center text-mobile-sm text-gray-500 mb-2">
          <MapPin className="h-3 w-3 xs:h-4 xs:w-4 mr-1 flex-shrink-0" />
          <span className="mobile-truncate">
            {property.address_commune || 'Comuna no disponible'}, {property.address_region || 'Región no disponible'}
          </span>
        </div>

        {/* Description */}
        {property.description && (
          <p className="text-gray-600 text-mobile-sm mb-3 mobile-line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Property Features */}
        <div className="flex items-center justify-between text-mobile-sm text-gray-500 mb-3">
          <div className="flex space-x-3 xs:space-x-4">
            <div className="flex items-center">
              <Bed className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
              <span>{property.bedrooms || 0}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
              <span>{property.bathrooms || 0}</span>
            </div>
            <div className="flex items-center">
              <Square className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
              <span>{property.surface_m2 || 0}m²</span>
            </div>
          </div>
        </div>

        {/* Price and additional info */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg xs:text-xl font-bold text-green-600">
            {formatPriceCLP(isValidPrice(property.price_clp) ? property.price_clp : 0)}
          </div>
          {context === 'marketplace' && isValidPrice(property.common_expenses_clp) && property.common_expenses_clp > 0 && (
            <div className="text-mobile-xs text-gray-500 text-right">
              + {formatPriceCLP(property.common_expenses_clp)}<br />
              <span>gastos comunes</span>
            </div>
          )}
          {context === 'portfolio' && (
            <Link
              to={`/portfolio/property/${property.id}`}
              className="text-blue-600 hover:text-blue-800 text-mobile-sm font-medium mobile-btn px-3 py-1"
            >
              Ver detalles
            </Link>
          )}
        </div>

        {/* Action Buttons - Only for panel context */}
        {context === 'panel' && showActions && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {property.listing_type === 'venta' ? (
                <CustomButton
                  onClick={handleMakeOffer}
                  variant="primary"
                  size="sm"
                  className="w-full mobile-btn text-mobile-sm"
                >
                  <TrendingUp className="h-4 w-4 mr-1 xs:mr-2" />
                  <span className="hidden xs:inline">Ofertar</span>
                  <span className="xs:hidden">Oferta</span>
                </CustomButton>
              ) : (
                <CustomButton
                  onClick={handleApply}
                  variant="primary"
                  size="sm"
                  className="w-full mobile-btn text-mobile-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1 xs:mr-2" />
                  <span className="hidden xs:inline">Postular</span>
                  <span className="xs:hidden">Postular</span>
                </CustomButton>
              )}

              <Link to={`/property/${property.id}`} className="w-full">
                <CustomButton
                  variant="outline"
                  size="sm"
                  className="w-full mobile-btn text-mobile-sm"
                >
                  <Eye className="h-4 w-4 mr-1 xs:mr-2" />
                  <span className="hidden xs:inline">Ver detalles</span>
                  <span className="xs:hidden">Ver</span>
                </CustomButton>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Footer - Only show in portfolio context */}
      {context === 'portfolio' && (
        <div className="card-footer px-3 xs:px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-mobile-sm">
            <span className="metric text-gray-600">
              Postulaciones: <strong className="text-gray-900">{property.postulation_count || 0}</strong>
            </span>
            <span className={`status-badge px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
              {getStatusLabel(property.status)}
            </span>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && property.property_images && (
        <ImageGallery
          images={property.property_images}
          currentIndex={galleryIndex}
          onClose={handleGalleryClose}
          onNext={handleGalleryNext}
          onPrevious={handleGalleryPrevious}
        />
      )}
      </div>

      {/* Postulations List - Only show when expanded and in portfolio context */}
      {isExpanded && context === 'portfolio' && (
        <div className="mt-4 px-4 py-4 bg-gray-50 rounded-lg border border-gray-200">
          {(() => {
            console.log('🔍 [PropertyCard] Mostrando PostulationsList para property:', property.id);
            console.log('🔍 [PropertyCard] Postulations:', postulations);
            console.log('🔍 [PropertyCard] Postulation_count:', property.postulation_count);
            return null;
          })()}
          <PostulationsList postulations={postulations} propertyId={property.id} />
        </div>
      )}
    </div>
  );
});

export default PropertyCard;

