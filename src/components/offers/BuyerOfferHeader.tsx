import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SaleOffer } from './types';
import { BuyerTabType } from './OfferDetailsPanel';

export interface BuyerOfferHeaderProps {
  offer: SaleOffer | null;
  activeTab: BuyerTabType;
  buyerTabs: any[];
  onBack: () => void;
  onTabChange: (tab: BuyerTabType) => void;
}

export const BuyerOfferHeader: React.FC<BuyerOfferHeaderProps> = ({
  offer,
  activeTab,
  buyerTabs,
  onBack,
  onTabChange
}) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      {/* Header profesional */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Volver a Mis Ofertas</span>
          </button>
          <div className="text-sm text-gray-500">
            Oferta #{offer?.id.slice(0, 8) || 'Cargando...'}
          </div>
        </div>
      </div>

      {/* Sistema de pestañas mejorado */}
      <div className="max-w-5xl mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto py-2">
          {buyerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-600 font-medium">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default BuyerOfferHeader;



