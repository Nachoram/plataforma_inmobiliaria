import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, DollarSign, Calendar, User, Building, ArrowLeft, MessageSquare, TrendingUp, X } from 'lucide-react';
import { supabase, Property, Profile } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import RentalApplicationForm from './RentalApplicationForm';

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      // Fetch property with images
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            image_url,
            storage_path
          )
        `)
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Fetch owner profile
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', propertyData.owner_id)
        .maybeSingle();

      if (ownerError) {
        console.error('Error fetching owner profile:', ownerError);
        // Continue without owner data if profile doesn't exist
      }
      setOwner(ownerData);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
        <p className="text-gray-600 mb-6">La propiedad que buscas no existe o no está disponible.</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Volver a propiedades
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === property.owner_id;
  const canInteract = user && !isOwner;

  const handleQuickOffer = async () => {
    if (!user || !property) return;
    
    setActionLoading(true);
    
    try {
      const offerAmount = prompt('¿Cuánto quieres ofrecer por esta propiedad?');
      if (!offerAmount) return;
      
      const message = prompt('Mensaje para el propietario (opcional):') || '';
      
      const { error } = await supabase
        .from('offers')
        .insert({
          property_id: property.id,
          offerer_id: user.id,
          offer_amount: parseFloat(offerAmount),
          message: message,
          status: 'pendiente'
        });

      if (error) throw error;
      
      alert('¡Oferta enviada exitosamente!');
    } catch (error: any) {
      alert('Error enviando oferta: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplicationClick = () => {
    if (!user || !property) return;
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    // Mostrar mensaje de éxito
    alert('¡Postulación enviada exitosamente!');
  };

  const handleApplicationCancel = () => {
    setShowApplicationForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a propiedades
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {property.property_images && property.property_images.length > 0 ? (
              <div>
                {/* Main Photo */}
                <div className="h-96 relative">
                  <img
                    src={property.property_images[selectedPhoto].image_url}
                    alt={`${property.address_street || ''} ${property.address_number || ''} - Foto ${selectedPhoto + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    {selectedPhoto + 1} / {property.property_images?.length || 0}
                  </div>
                </div>

                {/* Photo Thumbnails */}
                {property.property_images && property.property_images.length > 1 && (
                  <div className="p-4 border-t">
                    <div className="flex space-x-2 overflow-x-auto">
                      {property.property_images?.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhoto(index)}
                          className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                            selectedPhoto === index ? 'border-blue-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image.image_url}
                            alt={`Miniatura ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-100">
                <Building className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Property Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.address_street} {property.address_number}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-1" />
                    <span>{property.address_commune}, {property.address_region}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(property.price_clp)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.type === 'arriendo' ? 'por mes' : 'precio total'}
                  </div>
                </div>
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-3 gap-6 py-4 border-y">
                <div className="text-center">
                  <Bed className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-500">Dormitorios</div>
                </div>
                <div className="text-center">
                  <Bath className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-500">Baños</div>
                </div>
                {property.surface_m2 && (
                  <div className="text-center">
                    <Square className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">{property.surface_m2}</div>
                    <div className="text-sm text-gray-500">m²</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            {/* Publication Date */}
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Publicado el {formatDate(property.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Contacto
            </h3>
            
            {owner && (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Nombre</div>
                  <div className="font-medium text-gray-900">{owner.full_name || 'Usuario'}</div>
                </div>
                {owner.contact_email && (
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{owner.contact_email}</div>
                  </div>
                )}
                {owner.contact_phone && (
                  <div>
                    <div className="text-sm text-gray-500">Teléfono</div>
                    <div className="font-medium text-gray-900">{owner.contact_phone}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {canInteract && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ¿Interesado en esta propiedad?
              </h3>
              
              <div className="space-y-3">
                {property.listing_type === 'arriendo' ? (
                  <button
                    onClick={handleApplicationClick}
                    disabled={actionLoading}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <MessageSquare className="h-5 w-5 inline mr-2" />
                    Postular a Arriendo
                  </button>
                ) : (
                  <button
                    onClick={handleQuickOffer}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <TrendingUp className="h-5 w-5 inline mr-2" />
                    Hacer Oferta de Compra
                  </button>
                )}
                
                <button
                  onClick={() => alert('Funcionalidad de visitas disponible próximamente')}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  📅 Solicitar Visita
                </button>
              </div>
            </div>
          )}

          {!user && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿Interesado en esta propiedad?
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Inicia sesión para postular o hacer una oferta
              </p>
              <Link
                to="/auth"
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal del formulario de postulación */}
      {showApplicationForm && property && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Postulación de Arriendo
                </h2>
                <button
                  onClick={handleApplicationCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <RentalApplicationForm
                property={property}
                onSuccess={handleApplicationSuccess}
                onCancel={handleApplicationCancel}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};