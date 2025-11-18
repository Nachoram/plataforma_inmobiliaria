'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase, PropertySaleOffer, SaleOfferStatus } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  DollarSign,
  MapPin,
  Calendar,
  User,
  Filter,
  Search,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  X,
  ArrowLeft,
  MoreVertical,
  FileText,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

// Extender la interfaz para incluir datos unidos
interface ExtendedSalesOffer extends PropertySaleOffer {
  properties?: {
    id: string;
    title: string;
    address_street: string;
    address_number: string;
    address_commune: string;
    city: string;
    price_clp: number;
  };
  buyer_profile?: {
    first_name: string;
    paternal_last_name: string;
    email: string;
    phone: string;
  };
}

interface FilterState {
  status: string[];
  search: string;
  sortBy: 'fecha' | 'precio' | 'diferencia';
  minPrice?: number;
  maxPrice?: number;
}

export const SalesOfferAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State Management
  const [offers, setOffers] = useState<ExtendedSalesOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<ExtendedSalesOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<ExtendedSalesOffer | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    search: '',
    sortBy: 'fecha',
  });

  // Cargar ofertas
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from('property_sale_offers')
          .select(`
            *,
            properties:property_id (
              id,
              address_street,
              address_number,
              address_commune,
              price_clp
            ),
            buyer_profile:buyer_id (
              first_name,
              paternal_last_name,
              email,
              phone
            )
          `)
          .eq('properties.owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
             console.error('Error fetching offers', error);
             throw error;
        }

        const mappedOffers: ExtendedSalesOffer[] = (data || []).map((offer: any) => ({
          ...offer,
          properties: {
             ...offer.properties,
             title: `${offer.properties?.address_street} ${offer.properties?.address_number}`,
             city: offer.properties?.address_commune
          }
        }));

        setOffers(mappedOffers);
      } catch (err) {
        console.error('Error:', err);
        toast.error('Error al cargar las ofertas');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user?.id]);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [offers, filters]);

  const applyFilters = () => {
    let filtered = [...offers];

    // Filtro por status
    if (filters.status.length > 0) {
      filtered = filtered.filter(o => filters.status.includes(o.status));
    }

    // Filtro por búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.properties?.title?.toLowerCase().includes(search) ||
          o.properties?.address_street?.toLowerCase().includes(search) ||
          o.buyer_profile?.first_name?.toLowerCase().includes(search) ||
          o.buyer_profile?.paternal_last_name?.toLowerCase().includes(search)
      );
    }

    // Filtro por rango de precios (si existe)
    if (filters.minPrice !== undefined) {
        filtered = filtered.filter(o => o.offer_amount >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(o => o.offer_amount <= filters.maxPrice!);
    }

    // Ordenamiento
    switch (filters.sortBy) {
      case 'precio':
        filtered.sort((a, b) => b.offer_amount - a.offer_amount);
        break;
      case 'diferencia':
        filtered.sort((a, b) => {
          const diffA = ((a.properties?.price_clp || 0) - a.offer_amount) / (a.properties?.price_clp || 1);
          const diffB = ((b.properties?.price_clp || 0) - b.offer_amount) / (b.properties?.price_clp || 1);
          return diffA - diffB;
        });
        break;
      default: // fecha
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredOffers(filtered);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.sortBy !== 'fecha') count++;
    return count;
  };

  // Acciones de oferta
  const handleStatusUpdate = async (offerId: string, newStatus: SaleOfferStatus, extraData?: any) => {
    try {
      const { error } = await supabase
        .from('property_sale_offers')
        .update({ status: newStatus, ...extraData })
        .eq('id', offerId);

      if (error) throw error;

      const updatedOffers = offers.map(o => 
        o.id === offerId ? { ...o, status: newStatus, ...extraData } : o
      );
      
      setOffers(updatedOffers);
      // applyFilters will run due to useEffect
      
      if (selectedOffer?.id === offerId) {
          setSelectedOffer({ ...selectedOffer, status: newStatus, ...extraData });
      }

      setShowDrawer(false);
      toast.success(`Oferta ${newStatus === 'aceptada' ? 'aceptada' : newStatus === 'rechazada' ? 'rechazada' : 'actualizada'} correctamente`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al actualizar la oferta');
    }
  };

  const handleAcceptOffer = (offerId: string) => handleStatusUpdate(offerId, 'aceptada', { responded_at: new Date().toISOString() });
  const handleRejectOffer = (offerId: string) => handleStatusUpdate(offerId, 'rechazada', { responded_at: new Date().toISOString() });
  const handleCounterOffer = (offerId: string, newPrice: number) => 
    handleStatusUpdate(offerId, 'contraoferta', { 
        counter_offer_amount: newPrice,
        responded_at: new Date().toISOString() 
    });

  const handleBack = () => {
    navigate(-1);
  };

  const handleOfferClick = (offer: ExtendedSalesOffer) => {
      setSelectedOffer(offer);
      setShowDrawer(true);
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER COMPONENTS
  // ═══════════════════════════════════════════════════════════════

  const renderMobileHeader = () => (
    <header className="flex items-center justify-between h-14 bg-white border-b px-4 py-2 md:hidden">
      <button
        onClick={handleBack}
        className="p-2 -ml-2 text-gray-600 hover:text-gray-800"
        aria-label="Volver"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-bold text-gray-900">Ofertas</h1>
      <button
        className="p-2 -mr-2 text-gray-600 hover:text-gray-800"
        aria-label="Menú"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </header>
  );

  const renderToolbar = () => (
    <div className="flex gap-2 p-4 border-b bg-white">
      <button
        onClick={() => setShowFiltersModal(true)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        <span>Filtro</span>
        {getActiveFiltersCount() > 0 && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {getActiveFiltersCount()}
          </span>
        )}
      </button>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por propiedad o comprador..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'aceptada': return 'bg-green-100 text-green-700';
        case 'rechazada': return 'bg-red-100 text-red-700';
        case 'contraoferta': return 'bg-blue-100 text-blue-700';
        case 'pendiente': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderDesktopTable = () => (
    <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propiedad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comprador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oferta
              </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diferencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOffers.map((offer) => {
               const askingPrice = offer.properties?.price_clp || 0;
               const offeredPrice = offer.offer_amount;
               const diff = askingPrice - offeredPrice;
               const percentageDiff = askingPrice > 0 ? (diff / askingPrice) * 100 : 0;

              return (
              <tr key={offer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{offer.properties?.title}</div>
                  <div className="text-sm text-gray-500">{offer.properties?.city}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-xs">
                        {offer.buyer_profile?.first_name?.charAt(0).toUpperCase()}
                        {offer.buyer_profile?.paternal_last_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">{offer.buyer_profile?.first_name} {offer.buyer_profile?.paternal_last_name}</div>
                        <div className="text-xs text-gray-500">{offer.buyer_profile?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                    {offer.status.charAt(0).toUpperCase() + offer.status.slice(1).replace('_', ' ')}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                  ${offer.offer_amount.toLocaleString('es-CL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   <span className={diff > 0 ? 'text-red-500' : 'text-green-500'}>
                     {diff > 0 ? '-' : '+'}{Math.abs(percentageDiff).toFixed(1)}%
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(offer.created_at).toLocaleDateString('es-CL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleOfferClick(offer)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                    title="Administrar Oferta"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Administrar
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFiltersModal = () => (
    <div className={`fixed inset-0 z-50 md:hidden ${showFiltersModal ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowFiltersModal(false)} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <button
            onClick={() => setShowFiltersModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="space-y-2">
              {['pendiente', 'aceptada', 'rechazada', 'contraoferta', 'en_revision'].map((status) => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                      } else {
                        setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
              <select 
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full p-2 border rounded-lg"
              >
                  <option value="fecha">Fecha (Más reciente)</option>
                  <option value="precio">Precio (Mayor a menor)</option>
                  <option value="diferencia">Diferencia (Mayor a menor)</option>
              </select>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={() => {
              setFilters({
                status: [],
                search: '',
                sortBy: 'fecha'
              });
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            onClick={() => setShowFiltersModal(false)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ofertas de Compraventa</h1>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron ofertas</p>
            </div>
          ) : (
            filteredOffers.map((offer, idx) => (
              <SalesOfferCard
                key={offer.id}
                offer={offer}
                index={idx}
                onSelect={() => handleOfferClick(offer)}
              />
            ))
          )}
        </div>

        {/* Desktop Table */}
        {renderDesktopTable()}

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500">
          {filteredOffers.length} ofertas encontradas
        </div>
      </div>

      {/* Modals */}
      {renderFiltersModal()}
      <AnimatePresence>
        {showDrawer && selectedOffer && (
            <SalesOfferDetailDrawer
            offer={selectedOffer}
            onClose={() => setShowDrawer(false)}
            onAccept={() => handleAcceptOffer(selectedOffer.id)}
            onReject={() => handleRejectOffer(selectedOffer.id)}
            onCounterOffer={(price) => handleCounterOffer(selectedOffer.id, price)}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE CARD (Mobile)
// ═══════════════════════════════════════════════════════════════

interface SalesOfferCardProps {
  offer: ExtendedSalesOffer;
  index: number;
  onSelect: () => void;
}

const SalesOfferCard: React.FC<SalesOfferCardProps> = ({ offer, index, onSelect }) => {
  const askingPrice = offer.properties?.price_clp || 0;
  const offeredPrice = offer.offer_amount;
  const diff = askingPrice - offeredPrice;
  const percentageDiff = askingPrice > 0 ? (diff / askingPrice) * 100 : 0;
  
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'aceptada': return 'bg-green-100 text-green-700';
          case 'rechazada': return 'bg-red-100 text-red-700';
          case 'contraoferta': return 'bg-blue-100 text-blue-700';
          default: return 'bg-yellow-100 text-yellow-700';
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {offer.properties?.title || 'Propiedad sin título'}
          </h3>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {offer.properties?.city}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full font-medium text-xs ${getStatusColor(offer.status)}`}>
          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1).replace('_', ' ')}
        </span>
      </div>

      <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded">
        <div>
            <p className="text-xs text-gray-500">Oferta</p>
            <p className="text-lg font-bold text-blue-600">
                ${offeredPrice.toLocaleString('es-CL')}
            </p>
        </div>
        <div className="text-right">
             <p className="text-xs text-gray-500">Diferencia</p>
             <div className={`font-bold ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                 {diff > 0 ? '-' : '+'}{Math.abs(percentageDiff).toFixed(1)}%
             </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{offer.buyer_profile?.first_name}</span>
          </div>
          <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(offer.created_at).toLocaleDateString('es-CL')}</span>
          </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DRAWER
// ═══════════════════════════════════════════════════════════════

interface SalesOfferDetailDrawerProps {
    offer: ExtendedSalesOffer;
    onClose: () => void;
    onAccept: () => void;
    onReject: () => void;
    onCounterOffer: (price: number) => void;
}

const SalesOfferDetailDrawer: React.FC<SalesOfferDetailDrawerProps> = ({
    offer, onClose, onAccept, onReject, onCounterOffer
}) => {
    const [counterPrice, setCounterPrice] = useState<string>(offer.offer_amount.toString());
    const [isCounterOffering, setIsCounterOffering] = useState(false);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/50"
            onClick={onClose}
        >
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-xl bg-white h-full overflow-y-auto p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Detalles de Oferta</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Property Info */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Propiedad</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-semibold text-lg">{offer.properties?.title}</p>
                            <p className="text-gray-600 flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4" />
                                {offer.properties?.address_street} {offer.properties?.address_number}, {offer.properties?.address_commune}
                            </p>
                            <p className="text-gray-600 mt-2">Precio lista: <span className="font-semibold">${offer.properties?.price_clp?.toLocaleString('es-CL')}</span></p>
                        </div>
                    </section>

                    {/* Buyer Info */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Comprador</h3>
                        <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                {offer.buyer_profile?.first_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold">{offer.buyer_profile?.first_name} {offer.buyer_profile?.paternal_last_name}</p>
                                <p className="text-sm text-gray-600">{offer.buyer_profile?.email}</p>
                                <p className="text-sm text-gray-600">{offer.buyer_profile?.phone}</p>
                            </div>
                        </div>
                    </section>

                    {/* Offer Details */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Detalles de la Oferta</h3>
                        <div className="border rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Monto Ofertado</p>
                                    <p className="text-2xl font-bold text-blue-600">${offer.offer_amount.toLocaleString('es-CL')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Fecha</p>
                                    <p className="text-lg font-semibold">{new Date(offer.created_at).toLocaleDateString('es-CL')}</p>
                                </div>
                            </div>
                            {offer.financing_type && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500">Financiamiento</p>
                                    <p className="font-medium">{offer.financing_type}</p>
                                </div>
                            )}
                            {offer.message && (
                                <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-sm text-gray-800">
                                    <p className="font-bold text-xs text-yellow-700 mb-1">Mensaje del comprador:</p>
                                    "{offer.message}"
                                </div>
                            )}
                             <div className="mt-4 flex flex-wrap gap-2">
                                {offer.requests_title_study && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">Solicita estudio títulos</span>
                                )}
                                {offer.requests_property_inspection && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md font-medium">Solicita inspección</span>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    {offer.status === 'pendiente' || offer.status === 'en_revision' ? (
                        <section className="pt-4 border-t">
                             {!isCounterOffering ? (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={onAccept}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Aceptar Oferta
                                    </button>
                                    <button 
                                        onClick={() => setIsCounterOffering(true)}
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-5 h-5" /> Contraofertar
                                    </button>
                                    <button 
                                        onClick={onReject}
                                        className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-5 h-5" /> Rechazar
                                    </button>
                                </div>
                             ) : (
                                 <div className="bg-gray-50 p-4 rounded-lg border">
                                     <h4 className="font-bold text-gray-900 mb-2">Nueva Contraoferta</h4>
                                     <div className="mb-4">
                                         <label className="block text-sm text-gray-600 mb-1">Monto propuesto (CLP)</label>
                                         <input 
                                            type="number" 
                                            value={counterPrice}
                                            onChange={(e) => setCounterPrice(e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                         />
                                     </div>
                                     <div className="flex gap-3">
                                         <button 
                                             onClick={() => onCounterOffer(Number(counterPrice))}
                                             className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                         >
                                             Enviar Contraoferta
                                         </button>
                                         <button 
                                             onClick={() => setIsCounterOffering(false)}
                                             className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded"
                                         >
                                             Cancelar
                                         </button>
                                     </div>
                                 </div>
                             )}
                        </section>
                    ) : (
                         <div className="bg-gray-100 p-4 rounded-lg text-center">
                             <p className="text-gray-600 font-medium">
                                 Esta oferta se encuentra en estado: <span className="font-bold text-gray-900">{offer.status.toUpperCase()}</span>
                             </p>
                             {offer.seller_response && (
                                 <p className="text-sm text-gray-500 mt-2">Respuesta: {offer.seller_response}</p>
                             )}
                         </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
