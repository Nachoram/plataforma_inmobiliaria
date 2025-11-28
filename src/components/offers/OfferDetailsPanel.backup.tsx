import React, { useState } from 'react';
import { FileText, Paperclip, MessageSquare, Zap, MapPin, Calendar, CheckCircle, ArrowLeft } from 'lucide-react';
import { SaleOffer, OfferDocument, OfferCommunication } from './types';
import { OfferDocumentsTab } from './OfferDocumentsTab';
import { OfferMessagesTab } from './OfferMessagesTab';
import { OfferActionsTab } from './OfferActionsTab';

interface OfferDetailsPanelProps {
  offer: SaleOffer;
  initialDocuments: OfferDocument[];
  initialCommunications: OfferCommunication[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

type TabType = 'info' | 'documents' | 'messages' | 'actions';

export const OfferDetailsPanel: React.FC<OfferDetailsPanelProps> = ({
  offer,
  initialDocuments,
  initialCommunications,
  onBack,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [documents, setDocuments] = useState<OfferDocument[]>(initialDocuments);
  const [communications, setCommunications] = useState<OfferCommunication[]>(initialCommunications);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-6">
             {/* Property Card */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                    <img
                        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="Property"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                        {offer.property?.listing_type === 'venta' ? 'En Venta' : 'En Arriendo'}
                    </div>
                </div>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {offer.property?.address_street} {offer.property?.address_number}
                    </h2>
                    <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        {offer.property?.address_commune}, {offer.property?.address_region}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                        <div className="flex items-center">
                            <span className="font-semibold text-gray-900 text-lg mr-1">
                                Precio Publicado
                            </span>
                            <span className="text-xs">$ {offer.property?.price_clp?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* Offer Info */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Detalles de tu Oferta
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-sm text-blue-800 mb-1">Monto Ofertado</p>
                        <p className="text-2xl font-bold text-blue-900">
                            $ {offer.offer_amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">{offer.offer_amount_currency}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Estado</span>
                            <span className={`font-medium px-2 py-0.5 rounded-full text-sm ${
                                offer.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                                offer.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {offer.status.toUpperCase().replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Financiamiento</span>
                            <span className="font-medium text-gray-900">{offer.financing_type || 'No especificado'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Fecha Oferta</span>
                            <span className="font-medium text-gray-900">{new Date(offer.created_at).toLocaleDateString()}</span>
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
          </div>
        );
      case 'documents':
        return (
          <OfferDocumentsTab
            offer={offer}
            documents={documents}
            onDocumentsChange={() => Promise.resolve()}
          />
        );
      case 'messages':
        return (
          <OfferMessagesTab
            offer={offer}
            communications={communications}
            onCommunicationsChange={() => Promise.resolve()}
          />
        );
      case 'actions':
        return (
            <OfferActionsTab
                offer={offer}
                onUpdateOffer={onRefresh}
                onTabChange={setActiveTab as any}
            />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
                        Oferta #{offer.id.slice(0, 8)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex space-x-8 overflow-x-auto">
                    {[
                        { id: 'info', label: 'Información', icon: FileText },
                        { id: 'documents', label: 'Documentos', icon: Paperclip, count: documents.filter(d => d.status === 'pendiente').length },
                        { id: 'messages', label: 'Mensajes', icon: MessageSquare, count: communications.length > 0 ? communications.length : undefined },
                        { id: 'actions', label: 'Acciones', icon: Zap }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
            {renderTabContent()}
        </main>
    </div>
  );
};



