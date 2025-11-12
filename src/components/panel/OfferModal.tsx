import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { webhookClient } from '../../lib/webhook';
import CustomButton from '../common/CustomButton';

interface OfferModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export const OfferModal: React.FC<OfferModalProps> = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    offer_amount: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.offer_amount) {
      newErrors.offer_amount = 'El monto de la oferta es requerido';
    } else if (parseFloat(formData.offer_amount) <= 0) {
      newErrors.offer_amount = 'El monto debe ser mayor a 0';
    } else if (parseFloat(formData.offer_amount) > property.price_clp * 1.5) {
      newErrors.offer_amount = 'El monto parece muy alto comparado con el precio de lista';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Un mensaje es requerido para contextualizar tu oferta';
    } else if (formData.message.length < 20) {
      newErrors.message = 'El mensaje debe tener al menos 20 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify user is authenticated
    if (!user || !user.id) {
      alert('Usuario no autenticado. Por favor, inicia sesión para continuar.');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Primero, verificar si ya existe una oferta del usuario para esta propiedad
      const { data: existingOffer, error: checkError } = await supabase
        .from('offers')
        .select('id')
        .eq('property_id', property.id)
        .eq('offerer_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      if (existingOffer) {
        alert('Ya has enviado una oferta para esta propiedad. Revisa la sección "Mis Ofertas".');
        onClose();
        return;
      }

      // Crear nueva oferta
      const { data, error } = await supabase
        .from('offers')
        .insert({
          property_id: property.id,
          offerer_id: user.id,
          offer_amount_clp: parseFloat(formData.offer_amount),
          message: formData.message.trim(),
          status: 'pendiente'
        })
        .select();

      if (error) {
        // Handle RLS policy violations specifically
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          console.error('RLS Policy violation: User does not have permission to create offers');
          alert('No tienes permisos para enviar ofertas. Verifica tu cuenta.');
        } else {
          throw error;
        }
      }

      // Enviar webhook de notificación de nueva oferta
      console.log('🌐 Enviando webhook de nueva oferta...');
      try {
        // Obtener datos completos para el webhook
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            property_images (*)
          `)
          .eq('id', property.id)
          .single();

        if (propertyError) {
          // Log the full error object to understand its structure
          console.warn('⚠️ Error obteniendo datos de propiedad para webhook:', propertyError);
          
          // Safely extract error message
          const errorMessage = propertyError?.message || propertyError?.error?.message || JSON.stringify(propertyError);
          console.warn('⚠️ Error message:', errorMessage);
        } else {
          // Obtener datos del propietario
          const { data: propertyOwner, error: ownerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', propertyData.owner_id)
            .maybeSingle();

          if (ownerError) {
            // Log the full error object to understand its structure
            console.warn('⚠️ Error obteniendo datos del propietario para webhook:', ownerError);
            
            // Safely extract error message
            const errorMessage = ownerError?.message || ownerError?.error?.message || JSON.stringify(ownerError);
            console.warn('⚠️ Error message:', errorMessage);
          } else if (!propertyOwner) {
            console.warn('⚠️ No se encontró perfil del propietario para webhook');
          } else {
            // Obtener datos del oferente (usuario actual)
            const { data: offererProfile, error: offererError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (offererError) {
              // Log the full error object to understand its structure
              console.warn('⚠️ Error obteniendo datos del oferente para webhook:', offererError);
              
              // Safely extract error message
              const errorMessage = offererError?.message || offererError?.error?.message || JSON.stringify(offererError);
              console.warn('⚠️ Error message:', errorMessage);
            } else if (!offererProfile) {
              console.warn('⚠️ No se encontró perfil del oferente para webhook');
            } else {
              // Enviar webhook usando el webhookClient
              await webhookClient.sendOfferEvent(
                'received', // Nueva oferta recibida
                {
                  ...data[0],
                  amount_clp: parseFloat(formData.offer_amount)
                },
                propertyData,
                offererProfile,
                propertyOwner
              );
              console.log('✅ Webhook de nueva oferta enviado exitosamente');
            }
          }
        }
      } catch (webhookError) {
        // El webhookClient maneja los errores internamente y no los propaga
        // Solo registrar el error sin interrumpir el proceso
        console.warn('⚠️ Servicio de notificaciones no disponible:', webhookError);
        
        // Safely extract error message
        const errorMessage = webhookError?.message || webhookError?.error?.message || JSON.stringify(webhookError);
        console.warn('⚠️ Webhook error message:', errorMessage);
      }

      alert('¡Oferta enviada exitosamente! El propietario la revisará pronto.');
      onSuccess();
    } catch (error: any) {
      console.error('Error sending offer:', error);
      let errorMessage = 'Error enviando la oferta';

      if (error.message.includes('permission denied')) {
        errorMessage = 'No tienes permisos para enviar ofertas';
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'Ya has enviado una oferta para esta propiedad';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
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

  const calculatePercentage = () => {
    if (!formData.offer_amount || !property.price_clp) return null;
    const percentage = (parseFloat(formData.offer_amount) / property.price_clp) * 100;
    return percentage.toFixed(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Hacer Oferta
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Property Info */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-medium text-gray-900 mb-1">{property.address_street} {property.address_number}</h3>
          <p className="text-sm text-gray-600 mb-2">{property.address_commune}, {property.address_region}</p>
          <div className="text-lg font-bold text-green-600">
            Precio: {formatPrice(property.price_clp)}
          </div>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Offer Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto de tu oferta *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.offer_amount}
                  onChange={(e) => setFormData({ ...formData, offer_amount: e.target.value })}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.offer_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="150000000"
                />
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
              {errors.offer_amount && (
                <p className="text-red-600 text-sm mt-1">{errors.offer_amount}</p>
              )}
              {formData.offer_amount && (
                <p className="text-sm text-gray-600 mt-1">
                  Tu oferta: {formatPrice(parseFloat(formData.offer_amount))} 
                  ({calculatePercentage()}% del precio de lista)
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje para el propietario *
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Explica por qué te interesa esta propiedad, tu situación financiera, tiempos de cierre, etc."
              />
              {errors.message && (
                <p className="text-red-600 text-sm mt-1">{errors.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length} caracteres (mínimo 20)
              </p>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para tu oferta:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sé realista con el monto ofertado</li>
                <li>• Menciona tu pre-aprobación crediticia si la tienes</li>
                <li>• Indica tus tiempos de cierre preferidos</li>
                <li>• Comparte por qué esta propiedad es ideal para ti</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <CustomButton
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              loadingText="Enviando..."
              icon={TrendingUp}
            >
              Enviar Oferta
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};
