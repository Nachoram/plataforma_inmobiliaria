import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Eye, MessageSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import { SaleOffer } from './types';
import { useNavigate } from 'react-router-dom';

interface OfferActionsTabProps {
  offer: SaleOffer;
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onTabChange: (tab: 'messages') => void;
}

export const OfferActionsTab: React.FC<OfferActionsTabProps> = ({
  offer,
  onUpdateOffer,
  onTabChange
}) => {
  const navigate = useNavigate();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancelOffer = async () => {
    setLoading(true);
    try {
        // Here we would typically update status to 'retirada' or delete.
        // Assuming 'rechazada' or 'finalizada' for now as per SaleOfferStatus
        // There is no 'cancelada' status in the type definition in types.ts
        // Types: 'pendiente' | 'en_revision' | 'info_solicitada' | 'aceptada' | 'rechazada' | 'contraoferta' | 'estudio_titulo' | 'finalizada'
        // We'll use 'finalizada' or maybe add 'cancelada' if permitted. 
        // For now let's use 'finalizada' with a note? Or simply delete?
        // Usually canceling implies withdrawing. 
        // Let's assume 'rechazada' (by buyer) or 'finalizada'.
        await onUpdateOffer('finalizada', { message: 'Oferta cancelada por el comprador' });
    } finally {
        setLoading(false);
        setConfirmingCancel(false);
    }
  };

  const handleConfirmOffer = async () => {
      setLoading(true);
      try {
          // Move to next stage, e.g. 'estudio_titulo'
          await onUpdateOffer('estudio_titulo');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Primary Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Acciones Principales</h3>
        
        {offer.status === 'aceptada' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Confirmar Oferta</h4>
                <p className="text-gray-600 text-sm mt-1 mb-4">
                  El vendedor ha aceptado tu oferta. Confirma para iniciar el estudio de títulos y el proceso de compraventa.
                </p>
                <button 
                  onClick={handleConfirmOffer}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Procesando...' : 'Confirmar e Iniciar Proceso'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modify Offer - Available when pending, rejected or counter-offer */}
        {(offer.status === 'pendiente' || offer.status === 'contraoferta' || offer.status === 'rechazada') && (
           <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-blue-300 transition-colors">
             <div className="flex items-center gap-4">
               <div className="bg-blue-100 p-3 rounded-full">
                 <RefreshCw className="w-6 h-6 text-blue-600" />
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-gray-900">Modificar Oferta</h4>
                 <p className="text-gray-500 text-sm mt-1">
                   {offer.status === 'contraoferta' 
                     ? 'Responde a la contraoferta del vendedor con nuevos términos.' 
                     : 'Actualiza el monto o las condiciones de tu oferta.'}
                 </p>
               </div>
             </div>
             <button 
               className="mt-4 w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
               onClick={() => {
                   // TODO: Implement modify modal
                   alert('Funcionalidad de modificar oferta en desarrollo');
               }}
             >
               Modificar Términos
             </button>
           </div>
        )}

        {/* Cancel Offer */}
        {offer.status !== 'finalizada' && offer.status !== 'rechazada' && (
            <div className={`border rounded-xl p-6 transition-colors ${confirmingCancel ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                {!confirmingCancel ? (
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-full">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900">Cancelar Oferta</h4>
                            <p className="text-gray-500 text-sm mt-1">Retira tu oferta de compra. Esta acción no se puede deshacer.</p>
                        </div>
                        <button 
                            onClick={() => setConfirmingCancel(true)}
                            className="px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-900">¿Estás seguro?</h4>
                        <p className="text-gray-600 text-sm mb-4">Vas a retirar tu oferta de forma permanente.</p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setConfirmingCancel(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Mantener Oferta
                            </button>
                            <button 
                                onClick={handleCancelOffer}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                            >
                                {loading ? 'Cancelando...' : 'Sí, Cancelar Oferta'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Otras Acciones</h3>

        <button 
          onClick={() => navigate(`/property/${offer.property_id}`)}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all flex items-center justify-between group shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                    <Eye className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                    <h4 className="font-medium text-gray-900">Ver Propiedad</h4>
                    <p className="text-xs text-gray-500">Revisar detalles de la publicación</p>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </button>

        <button 
          onClick={() => onTabChange('messages')}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all flex items-center justify-between group shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-white transition-colors">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                    <h4 className="font-medium text-gray-900">Contactar Vendedor</h4>
                    <p className="text-xs text-gray-500">Enviar mensaje o consultar dudas</p>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
};

