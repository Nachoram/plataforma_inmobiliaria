import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, Home } from 'lucide-react';
import { supabase, Property, getPropertyTypeInfo, formatPriceCLP } from '../../lib/supabase';
import RentalApplicationForm from './RentalApplicationForm';

export const RentalApplicationPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          id,
          owner_id,
          status,
          listing_type,
          address_street,
          address_number,
          address_department,
          address_commune,
          address_region,
          tipo_propiedad,
          price_clp,
          common_expenses_clp,
          bedrooms,
          bathrooms,
          estacionamientos,
          metros_utiles,
          metros_totales,
          ano_construccion,
          tiene_terraza,
          tiene_sala_estar,
          sistema_agua_caliente,
          tipo_cocina,
          description,
          created_at
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError) {
        throw new Error(`Error cargando propiedad: ${propertyError.message}`);
      }

      setProperty(propertyData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    // Navegar de vuelta a la página de detalles de la propiedad
    navigate(`/property/${propertyId}`, {
      state: { applicationSubmitted: true }
    });
  };

  const handleApplicationCancel = () => {
    // Navegar de vuelta a la página de detalles de la propiedad
    navigate(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-gray-600">Cargando propiedad...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || 'Propiedad no encontrada'}</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header con navegación */}
      <div className="mb-8">
        <Link
          to={`/property/${propertyId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la propiedad
        </Link>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-xl text-white">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Postulación de Arriendo
              </h1>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">
                {property.address_street} {property.address_number}
              </h2>

              {/* Property Type Badge */}
              {property.tipo_propiedad && (
                <div className="flex items-center gap-2 mb-3">
                  <Home className="h-4 w-4 text-white/90" />
                  <span className="text-sm bg-white/20 px-2 py-0.5 rounded-lg backdrop-blur-sm font-medium">
                    {getPropertyTypeInfo(property.tipo_propiedad).label}
                  </span>
                </div>
              )}

              <div className="flex items-center text-blue-100 mb-4">
                <MapPin className="h-5 w-5 mr-1" />
                <span>{property.address_commune}, {property.address_region}</span>
              </div>

              {/* Price and features */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold">
                    {formatPriceCLP(property.price_clp)}
                  </span>
                  <span className="text-sm opacity-90">/ mes</span>
                </div>
                {property.common_expenses_clp && (
                  <div className="text-sm bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    + {formatPriceCLP(property.common_expenses_clp)} gastos comunes
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property features summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-lg font-bold">{property.bedrooms}</div>
              <div className="text-xs opacity-80">Dormitorios</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{property.bathrooms}</div>
              <div className="text-xs opacity-80">Baños</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{property.estacionamientos || 0}</div>
              <div className="text-xs opacity-80">Estacionamientos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{property.metros_utiles || 'N/A'}</div>
              <div className="text-xs opacity-80">m² Útiles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <RentalApplicationForm
        property={property}
        onSuccess={handleApplicationSuccess}
        onCancel={handleApplicationCancel}
      />
    </div>
  );
};


