import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building, Home, TrendingUp, Package } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import PropertyCard from '../PropertyCard';

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

interface PropertyWithImages extends Property {
  property_images?: Array<{
    image_url: string;
    storage_path: string;
  }>;
  postulation_count?: number;
  postulations?: Postulation[];
}



type TabType = 'todos' | 'arriendo' | 'venta';

const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('todos');

  const fetchPortfolioData = useCallback(async () => {
    // Verify user is authenticated before making any database queries
    if (!user || !user.id) {
      console.warn('User not authenticated, cannot fetch portfolio data');
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('🔍 [DEBUG] Fetching portfolio for user:', user.id);
    
    try {
      // Use the new RPC function to get properties with postulations
      console.log('🔍 [DEBUG] Calling RPC function: get_portfolio_with_postulations');
      const { data: propertiesData, error: propertiesError } = await supabase
        .rpc('get_portfolio_with_postulations', {
          user_id_param: user.id
        });

      console.log('🔍 [DEBUG] RPC Response:', { data: propertiesData, error: propertiesError });

      // Debug tipo_propiedad values from API response
      if (propertiesData) {
        console.log('🔍 [DEBUG] Properties from API:', propertiesData.map(p => ({
          id: p.id,
          tipo_propiedad: p.tipo_propiedad,
          status: p.status
        })));
      }

      if (propertiesError) {
        console.error('❌ [ERROR] Error fetching portfolio:', propertiesError);
        console.error('❌ [ERROR] Error completo:', JSON.stringify(propertiesError, null, 2));
        console.error('❌ [ERROR] Error details:', {
          message: propertiesError.message,
          code: propertiesError.code,
          details: propertiesError.details,
          hint: propertiesError.hint
        });
        
        // FALLBACK: Usar método anterior si RPC falla
        console.warn('⚠️ [FALLBACK] La función RPC falló, usando método de respaldo...');
        
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('properties')
            .select(`
              id,
              owner_id,
              status,
              listing_type,
              tipo_propiedad,
              address_street,
              address_number,
              address_department,
              address_commune,
              address_region,
              price_clp,
              common_expenses_clp,
              bedrooms,
              bathrooms,
              surface_m2,
              description,
              created_at,
              property_images!inner (
                image_url,
                storage_path
              )
            `)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('❌ [FALLBACK ERROR] También falló el método de respaldo:', fallbackError);
            setProperties([]);
          } else {
            console.log('✅ [FALLBACK SUCCESS] Propiedades cargadas con método de respaldo:', fallbackData?.length || 0);
            
            // Agregar conteos de postulaciones y ofertas manualmente
            const propertiesWithCounts = await Promise.all(
              (fallbackData || []).map(async (property) => {
                let postulationCount = 0;
                let offerCount = 0;

                // Obtener conteo de postulaciones para arriendos
                if (property.listing_type === 'arriendo') {
                  const { count: postCount } = await supabase
                    .from('applications')
                    .select('*', { count: 'exact', head: true })
                    .eq('property_id', property.id);
                  postulationCount = postCount || 0;
                }

                // Obtener conteo de ofertas para ventas
                if (property.listing_type === 'venta') {
                  const { count: offerCountResult } = await supabase
                    .from('property_sale_offers')
                    .select('*', { count: 'exact', head: true })
                    .eq('property_id', property.id);
                  offerCount = offerCountResult || 0;
                }

                return {
                  ...property,
                  postulation_count: postulationCount,
                  offer_count: offerCount,
                  postulations: [] // Vacío por ahora, se cargará al expandir
                };
              })
            );
            
            setProperties(propertiesWithCounts);
          }
        } catch (fallbackError) {
          console.error('❌ [FALLBACK CATCH] Error en método de respaldo:', fallbackError);
          setProperties([]);
        }
      } else {
        console.log('✅ [SUCCESS] Properties loaded:', propertiesData?.length || 0, 'properties');
        console.log('📊 [DATA] Properties:', propertiesData);

        // Agregar conteos de postulaciones y ofertas
        const propertiesWithCounts = await Promise.all(
          (propertiesData || []).map(async (property) => {
            let postulationCount = property.postulation_count || 0;
            let offerCount = 0;

            // Obtener conteo de ofertas para ventas si no viene de la RPC
            if (property.listing_type === 'venta' && !property.offer_count) {
              const { count: offerCountResult } = await supabase
                .from('property_sale_offers')
                .select('*', { count: 'exact', head: true })
                .eq('property_id', property.id);
              offerCount = offerCountResult || 0;
            } else {
              offerCount = property.offer_count || 0;
            }

            return {
              ...property,
              postulation_count: postulationCount,
              offer_count: offerCount,
              postulations: property.postulations || []
            };
          })
        );

        setProperties(propertiesWithCounts);
      }

    } catch (error) {
      console.error('❌ [CATCH] Error fetching portfolio data:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user, fetchPortfolioData]);

  const deleteProperty = async (id: string) => {
    // Verify user is authenticated
    if (!user || !user.id) {
      console.error('User not authenticated, cannot delete property');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id); // Additional RLS check - ensure user owns the property

      if (error) {
        // Handle RLS policy violations
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: User does not have permission to delete this property');
          alert('No tienes permisos para eliminar esta propiedad');
        } else {
          throw error;
        }
      } else {
        // Update local state only if deletion was successful
        setProperties(properties.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error al eliminar la propiedad. Por favor, intenta nuevamente.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleToggleExpand = (propertyId: string) => {
    setExpandedPropertyId(currentId =>
      currentId === propertyId ? null : propertyId
    );
  };

  // Check authentication before showing any content
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Acceso Restringido
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Necesitas iniciar sesión para ver tu portafolio de propiedades.
          </p>
          <div className="mt-6">
            <CustomButton
              onClick={() => window.location.href = '/auth'}
              variant="primary"
            >
              Ir a Iniciar Sesión
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando tus propiedades...</p>
      </div>
    );
  }

  // Filtrar propiedades según tab activo
  const filteredProperties = properties.filter(property => {
    if (activeTab === 'todos') return true;
    return property.listing_type === activeTab;
  });

  // Contar propiedades por tipo
  const arriendoCount = properties.filter(p => p.listing_type === 'arriendo').length;
  const ventaCount = properties.filter(p => p.listing_type === 'venta').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg border p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Mi Portafolio</h1>
        <p className="text-blue-100 mb-6">Gestiona tus propiedades y las interacciones relacionadas</p>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-200" />
              <div>
                <p className="text-2xl font-bold">{properties.length}</p>
                <p className="text-sm text-blue-200">Total Propiedades</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-emerald-200" />
              <div>
                <p className="text-2xl font-bold">{arriendoCount}</p>
                <p className="text-sm text-blue-200">En Arriendo</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-yellow-200" />
              <div>
                <p className="text-2xl font-bold">{ventaCount}</p>
                <p className="text-sm text-blue-200">En Venta</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/property/new?type=venta"
            className="flex items-center justify-center space-x-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Propiedad en Venta</span>
          </Link>
          <Link
            to="/property/new/rental"
            className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors border-2 border-white/20"
          >
            <Plus className="h-5 w-5" />
            <span>Publicar Propiedad en Arriendo</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('todos')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'todos'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Todas ({properties.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('arriendo')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'arriendo'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Mis Arriendos ({arriendoCount})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('venta')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'venta'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Mis Ventas ({ventaCount})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'todos' 
                ? 'No tienes propiedades aún' 
                : activeTab === 'arriendo' 
                  ? 'No tienes propiedades en arriendo' 
                  : 'No tienes propiedades en venta'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'todos'
                ? 'Comienza publicando tu primera propiedad'
                : activeTab === 'arriendo'
                  ? 'Publica tu primera propiedad en arriendo'
                  : 'Publica tu primera propiedad en venta'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(activeTab === 'todos' || activeTab === 'venta') && (
                <Link
                  to="/property/new?type=venta"
                  className="flex items-center justify-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Publicar en Venta</span>
                </Link>
              )}
              {(activeTab === 'todos' || activeTab === 'arriendo') && (
                <Link
                  to="/property/new/rental"
                  className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Publicar en Arriendo</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                context="portfolio"
                isExpanded={expandedPropertyId === property.id}
                onToggleExpand={() => handleToggleExpand(property.id)}
                postulations={property.postulations}
                onEdit={(property) => {
                  // Navigate to edit page
                  window.location.href = `/property/edit/${property.id}`;
                }}
                onDelete={deleteProperty}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
