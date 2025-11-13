import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Loader } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import SaleOfferForm from './SaleOfferForm';
import toast from 'react-hot-toast';

const SaleOfferPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  
  console.log('🟢 SaleOfferPage rendered, propertyId:', propertyId);
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    } else {
      setError('ID de propiedad no proporcionado');
      setLoading(false);
    }
  }, [propertyId]);

  const loadProperty = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Propiedad no encontrada');
      }

      // Verificar que la propiedad sea de tipo venta
      if (data.listing_type !== 'venta') {
        throw new Error('Esta propiedad no está disponible para venta');
      }

      // Verificar que la propiedad esté activa
      if (data.status !== 'disponible' && data.status !== 'activa') {
        throw new Error('Esta propiedad no está disponible');
      }

      setProperty(data as Property);
    } catch (err: any) {
      console.error('Error loading property:', err);
      setError(err.message || 'Error al cargar la propiedad');
      toast.error(err.message || 'Error al cargar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Oferta enviada exitosamente');
    navigate('/my-offers');
  };

  const handleCancel = () => {
    navigate(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <Home className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'No se pudo cargar la propiedad'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/panel')}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ir al Panel
            </button>
            {propertyId && (
              <button
                onClick={() => navigate(`/property/${propertyId}`)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Propiedad
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Back button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a la propiedad
          </button>
        </div>

        {/* Formulario de oferta */}
        <SaleOfferForm 
          property={property}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default SaleOfferPage;

