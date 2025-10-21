import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Calendar as CalendarIcon, ArrowLeft, Building, Car, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AdminPropertyDetailView.css';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
}

// Datos de prueba para las métricas
const weeklyApplications = [
  { week: 'Hace 4 sem', count: 5 },
  { week: 'Hace 3 sem', count: 8 },
  { week: 'Hace 2 sem', count: 6 },
  { week: 'Última sem', count: 12 },
];

const weeklyViews = [
  { week: 'Hace 4 sem', count: 150 },
  { week: 'Hace 3 sem', count: 210 },
  { week: 'Hace 2 sem', count: 180 },
  { week: 'Última sem', count: 350 },
];

const marketPriceData = {
  currentPrice: 850000,
  marketAverage: 810000,
  difference: '+4.9%',
  recommendation: 'El precio es competitivo.'
};

export const AdminPropertyDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  
  // Estados para la gestión de disponibilidad
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Datos de prueba: inicializar con algunas fechas
  const [availableDates, setAvailableDates] = useState<Date[]>([
    new Date(2025, 10, 5), // 5 de Noviembre 2025
    new Date(2025, 10, 7), // 7 de Noviembre 2025
    new Date(2025, 10, 12), // 12 de Noviembre 2025
  ]);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
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
          price_clp,
          common_expenses_clp,
          bedrooms,
          bathrooms,
          estacionamientos,
          metros_utiles,
          metros_totales,
          ano_construccion,
          created_at,
          property_images (
            image_url,
            storage_path
          )
        `)
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;

      setProperty(propertyData);
    } catch (error: any) {
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

  const handleDateClick = (date: Date) => {
    const dateExists = availableDates.find(d => d.getTime() === date.getTime());
    if (dateExists) {
      setAvailableDates(availableDates.filter(d => d.getTime() !== date.getTime()));
    } else {
      setAvailableDates([...availableDates, date]);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link 
          to="/portfolio" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al portafolio
        </Link>
      </div>

      <div className="space-y-6">
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

        {/* Property Information Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.address_street} {property.address_number}
              </h1>
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
                {property.listing_type === 'arriendo' ? 'por mes' : 'precio total'}
              </div>
              {/* Botones de acción - solo visible para el dueño/admin */}
              {isOwner && (
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/property/edit/${property.id}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span className="mr-2">✏️</span>
                    Modificar Publicación
                  </Link>
                  <button
                    onClick={handleOpenModal}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Gestionar Disponibilidad
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Property Features Icons */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 py-4 border-y">
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
            <div className="text-center">
              <Car className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.estacionamientos || 0}</div>
              <div className="text-sm text-gray-500">Estacionamientos</div>
            </div>
            <div className="text-center">
              <Square className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.metros_utiles || 'N/A'}</div>
              <div className="text-sm text-gray-500">m² Útiles</div>
            </div>
            <div className="text-center">
              <Square className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.metros_totales || 'N/A'}</div>
              <div className="text-sm text-gray-500">m² Totales</div>
            </div>
            <div className="text-center">
              <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-gray-900">{property.ano_construccion || 'N/A'}</div>
              <div className="text-sm text-gray-500">Construcción</div>
            </div>
          </div>
        </div>

        {/* Métricas - Grid de 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Métrica 1: Postulaciones por Semana */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Postulaciones por Semana</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyApplications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {weeklyApplications[weeklyApplications.length - 1].count}
              </div>
              <div className="text-sm text-gray-500">Postulaciones esta semana</div>
            </div>
          </div>

          {/* Métrica 2: Visualizaciones por Semana */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visualizaciones por Semana</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {weeklyViews[weeklyViews.length - 1].count}
              </div>
              <div className="text-sm text-gray-500">Visualizaciones esta semana</div>
            </div>
          </div>

          {/* Métrica 3: Precio según Mercado */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Precio de Mercado</h3>
            
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Precio Actual</span>
                <span className="text-lg font-bold text-blue-900">
                  {formatPrice(marketPriceData.currentPrice)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Promedio del Mercado</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(marketPriceData.marketAverage)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-gray-700">Diferencia</span>
                <span className="text-2xl font-bold text-green-600">
                  {marketPriceData.difference}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-800 text-center">
                {marketPriceData.recommendation}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Gestión de Disponibilidad */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Gestión de Disponibilidad
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-blue-100 mt-2 text-sm">
                Configura las fechas disponibles para que los interesados puedan agendar visitas
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 text-white p-2 rounded-lg mt-0.5">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      ¿Cómo funciona?
                    </p>
                    <p className="text-sm text-blue-700">
                      Haz clic en las fechas del calendario para marcarlas como disponibles. Las fechas seleccionadas aparecerán resaltadas en verde.
                    </p>
                  </div>
                </div>
              </div>

              {/* Calendario */}
              <div className="flex justify-center">
                <Calendar
                  onClickDay={handleDateClick}
                  minDate={new Date()}
                  tileClassName={({ date, view }) => {
                    // Mantener la lógica para las fechas seleccionadas
                    if (view === 'month' && availableDates.find(d => d.getTime() === date.getTime())) {
                      return 'selected-date';
                    }
                    // Eliminar el estilo del día actual
                    const today = new Date();
                    if (
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear()
                    ) {
                      return 'today-no-style'; // Clase que sobrescribe el estilo por defecto
                    }
                    return null;
                  }}
                  className="custom-calendar"
                />
              </div>

              {/* Fechas Seleccionadas */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mr-2">
                      {availableDates.length}
                    </span>
                    Fechas Disponibles
                  </h3>
                  {availableDates.length > 0 && (
                    <button
                      onClick={() => setAvailableDates([])}
                      className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline"
                    >
                      Limpiar todas
                    </button>
                  )}
                </div>
                {availableDates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {availableDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => (
                        <div
                          key={index}
                          className="group flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-300 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-500 p-1.5 rounded-lg">
                              <CalendarIcon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-green-800">
                              {date.toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDateClick(date)}
                            className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar fecha"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">
                      No hay fechas disponibles seleccionadas
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Selecciona fechas en el calendario para comenzar
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {availableDates.length > 0 
                    ? `${availableDates.length} fecha${availableDates.length !== 1 ? 's' : ''} seleccionada${availableDates.length !== 1 ? 's' : ''}`
                    : 'Selecciona al menos una fecha'
                  }
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-none px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Aquí iría la lógica para guardar las fechas
                      if (availableDates.length > 0) {
                        alert(`✅ Se han guardado ${availableDates.length} fechas disponibles para visitas`);
                        handleCloseModal();
                      } else {
                        alert('⚠️ Por favor selecciona al menos una fecha');
                      }
                    }}
                    disabled={availableDates.length === 0}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardar Disponibilidad
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

