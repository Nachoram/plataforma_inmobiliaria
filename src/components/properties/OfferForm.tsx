import React, { useState } from 'react';
import { X, DollarSign, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface OfferFormProps {
  propertyId: string;
  propertyAddress: string;
  askingPrice: number;
  onClose: () => void;
}

export const OfferForm: React.FC<OfferFormProps> = ({
  propertyId,
  propertyAddress,
  askingPrice,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !offerAmount) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          property_id: propertyId,
          offerer_id: user.id,
          offer_amount_clp: parseFloat(offerAmount),
          message: message.trim() || null,
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const offerPercentage = offerAmount ? ((parseFloat(offerAmount) / askingPrice) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Hacer Oferta de Compra
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Oferta Enviada!
              </h3>
              <p className="text-gray-600">
                Tu oferta ha sido enviada al vendedor. Te contactarán pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Propiedad:</h4>
                <p className="text-sm text-gray-600 mb-2">{propertyAddress}</p>
                <div className="text-sm">
                  <span className="text-gray-500">Precio de venta: </span>
                  <span className="font-semibold text-gray-900">{formatPrice(askingPrice)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu Oferta *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Monto de tu oferta"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {offerAmount && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Tu oferta: {formatPrice(parseFloat(offerAmount))}
                    </span>
                    <span className={`font-medium ${
                      parseFloat(offerPercentage) >= 95 ? 'text-green-600' :
                      parseFloat(offerPercentage) >= 85 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {offerPercentage}% del precio
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje para el Vendedor
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hola, estoy interesado en comprar esta propiedad. Mi oferta incluye..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional: Explica los términos de tu oferta o solicita más información
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Información de Contacto
                </h4>
                <p className="text-sm text-blue-700">
                  El vendedor podrá ver tu email ({user?.email}) para contactarte directamente.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !offerAmount}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Enviar Oferta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};