import React, { useState } from 'react';
import { X, MessageSquare, User, Building, Loader2, FileText } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ApplicationModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    full_name: '',
    profession: '',
    monthly_income: '',
    contact_phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
    }

    if (!formData.profession.trim()) {
      newErrors.profession = 'La profesión es requerida';
    }

    if (!formData.monthly_income) {
      newErrors.monthly_income = 'Los ingresos mensuales son requeridos';
    } else if (parseFloat(formData.monthly_income) <= 0) {
      newErrors.monthly_income = 'Los ingresos deben ser mayor a 0';
    }

    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'El teléfono de contacto es requerido';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Un mensaje es requerido';
    } else if (formData.message.length < 30) {
      newErrors.message = 'El mensaje debe tener al menos 30 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      // Verificar si ya existe una aplicación del usuario para esta propiedad
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('property_id', property.id)
        .eq('applicant_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingApplication) {
        alert('Ya has postulado a esta propiedad. Revisa la sección "Mis Postulaciones".');
        onClose();
        return;
      }

      // Crear o actualizar perfil del usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          contact_email: user.email,
          contact_phone: formData.contact_phone
        });

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Crear nueva aplicación
      const { error } = await supabase
        .from('applications')
        .insert({
          property_id: property.id,
          applicant_id: user.id,
          message: formData.message.trim(),
          status: 'pendiente'
        });

      if (error) throw error;

      alert('¡Postulación enviada exitosamente! El propietario la revisará pronto.');
      onSuccess();
    } catch (error: any) {
      console.error('Error sending application:', error);
      alert('Error enviando la postulación: ' + error.message);
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

  const calculateIncomeRatio = () => {
    if (!formData.monthly_income || !property.price) return null;
    const monthlyPayment = property.price * 0.005; // Estimación simple
    const ratio = (monthlyPayment / parseFloat(formData.monthly_income)) * 100;
    return ratio.toFixed(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-emerald-600" />
              Postular a Propiedad
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
          <h3 className="font-medium text-gray-900 mb-1">{property.address}</h3>
          <p className="text-sm text-gray-600 mb-2">{property.comuna}, {property.region}</p>
          <div className="flex items-center text-lg font-bold text-gray-900">
            <Building className="h-5 w-5 mr-1 text-emerald-600" />
            <span>Arriendo: {formatPrice(property.price)}/mes</span>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Personal Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Información Personal
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Tu nombre completo"
                  />
                  {errors.full_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.full_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesión/Ocupación *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      errors.profession ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Ingeniero, Médico, Contador"
                  />
                  {errors.profession && (
                    <p className="text-red-600 text-sm mt-1">{errors.profession}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingresos mensuales (CLP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      errors.monthly_income ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1500000"
                  />
                  {errors.monthly_income && (
                    <p className="text-red-600 text-sm mt-1">{errors.monthly_income}</p>
                  )}
                  {formData.monthly_income && (
                    <p className="text-sm text-gray-600 mt-1">
                      Ingresos: {formatPrice(parseFloat(formData.monthly_income))}
                      {calculateIncomeRatio() && (
                        <span> - Ratio estimado: {calculateIncomeRatio()}% de tus ingresos</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      errors.contact_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+56 9 1234 5678"
                  />
                  {errors.contact_phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.contact_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de postulación *
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Cuéntale al propietario sobre ti: por qué te interesa la propiedad, cuándo necesitas mudarte, si tienes mascotas, etc."
              />
              {errors.message && (
                <p className="text-red-600 text-sm mt-1">{errors.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length} caracteres (mínimo 30)
              </p>
            </div>

            {/* Tips */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-medium text-emerald-900 mb-2">📋 Tips para tu postulación:</h4>
              <ul className="text-sm text-emerald-800 space-y-1">
                <li>• Sé honesto sobre tu situación laboral y financiera</li>
                <li>• Menciona referencias laborales o personales</li>
                <li>• Indica cuándo podrías mudarte</li>
                <li>• Comparte tu experiencia como arrendatario</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Postulación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
