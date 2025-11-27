import React from 'react';
import { FileText, MapPin, CheckCircle } from 'lucide-react';
import { SaleOffer } from '../types';
import { formatPriceCLP } from '../../../lib/supabase';

interface BuyerOfferSummaryTabProps {
  offer: SaleOffer;
  userRole: 'buyer';
  onRefreshData: () => Promise<void>;
}

export const BuyerOfferSummaryTab: React.FC<BuyerOfferSummaryTabProps> = ({
  offer
}) => {
  // Si no hay oferta, mostrar mensaje de carga
  if (!offer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-gray-600">Cargando detalles de la oferta...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Property Card - Versión simplificada para compradores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-48 bg-gray-200 relative">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Property"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
            En Venta
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {offer.property?.address_street || 'Dirección no disponible'} {offer.property?.address_number || ''}
          </h2>
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-1" />
            {offer.property?.address_commune || 'Comuna no disponible'}, {offer.property?.address_region || 'Región no disponible'}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 text-lg mr-1">
                {offer.property?.price_clp ? formatPriceCLP(offer.property.price_clp) : 'Precio no disponible'}
              </span>
              <span className="text-xs">Precio Publicado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Info - Versión comprador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Detalles de tu Oferta
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-blue-800 mb-1">Monto Ofertado</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatPriceCLP(offer.offer_amount || 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">{offer.offer_amount_currency || 'CLP'}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Estado</span>
              <span className={`font-medium px-2 py-0.5 rounded-full text-sm ${
                offer.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                offer.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {(offer.status || 'pendiente').toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Financiamiento</span>
              <span className="font-medium text-gray-900">{offer.financing_type || 'No especificado'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Fecha Oferta</span>
              <span className="font-medium text-gray-900">{offer.created_at ? new Date(offer.created_at).toLocaleDateString() : 'Fecha no disponible'}</span>
            </div>
          </div>
        </div>

        {/* Additional Requests */}
        {(offer.requests_title_study || offer.requests_property_inspection) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-3">Solicitudes Adicionales:</p>
            <div className="flex flex-wrap gap-2">
              {offer.requests_title_study && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> Estudio de Títulos
                </span>
              )}
              {offer.requests_property_inspection && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> Inspección Técnica
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mensaje del comprador (si existe) */}
      {offer.message && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Tu Mensaje</h3>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-gray-700 italic">
              "{offer.message}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOfferSummaryTab;
