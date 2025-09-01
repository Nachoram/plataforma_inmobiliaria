import React, { useState } from 'react';
import { X, Calendar, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface RequestVisitButtonProps {
  propertyId: string;
  propertyAddress: string;
}

export const RequestVisitButton: React.FC<RequestVisitButtonProps> = ({
  propertyId,
  propertyAddress
}) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Estado del formulario
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [message, setMessage] = useState('');

  // Generar días del calendario (próximos 30 días)
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Excluir domingos (día 0)
      if (date.getDay() !== 0) {
        days.push({
          date: date.toISOString().split('T')[0],
          day: date.getDate(),
          month: date.toLocaleDateString('es-CL', { month: 'short' }),
          weekday: date.toLocaleDateString('es-CL', { weekday: 'short' })
        });
      }
    }
    
    return days.slice(0, 21); // Mostrar solo 21 días (3 semanas aprox)
  };

  const calendarDays = generateCalendarDays();

  // Opciones de horario
  const timeSlots = [
    { value: 'morning', label: 'Mañana (9:00 - 12:00)' },
    { value: 'afternoon', label: 'Tarde (14:00 - 17:00)' },
    { value: 'flexible', label: 'A convenir' }
  ];

  // Validación del formulario
  const validateForm = (): boolean => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha para la visita');
      return false;
    }
    if (!selectedTimeSlot) {
      setError('Por favor selecciona un horario para la visita');
      return false;
    }
    setError('');
    return true;
  };

  // Envío de la solicitud
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Insertar solicitud de visita en la base de datos
      const { error: insertError } = await supabase
        .from('visit_requests')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          requested_date: selectedDate,
          requested_time_slot: selectedTimeSlot,
          message: message.trim() || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Mostrar éxito
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        // Resetear formulario
        setSelectedDate('');
        setSelectedTimeSlot('');
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error submitting visit request:', error);
      setError('Error al enviar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario al cerrar
  const handleClose = () => {
    setShowModal(false);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setMessage('');
    setError('');
    setSuccess(false);
  };

  // Formatear fecha para mostrar
  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Botón Principal */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
      >
        <Calendar className="h-5 w-5" />
        <span>Solicitar Visita</span>
      </button>

      {/* Modal de Agendamiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {success ? (
              // Pantalla de Éxito
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Solicitud Enviada!
                </h3>
                <p className="text-gray-600">
                  El propietario se pondrá en contacto contigo para confirmar la visita.
                </p>
              </div>
            ) : (
              <>
                {/* Header del Modal */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Agendar una Visita a la Propiedad
                    </h2>
                    <p className="text-gray-600 mt-1">{propertyAddress}</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenido del Modal */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Selección de Fecha */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                      Selecciona una Fecha
                    </h3>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day) => (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setSelectedDate(day.date)}
                          className={`p-3 text-center rounded-lg border transition-all hover:border-purple-300 ${
                            selectedDate === day.date
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'border-gray-200 hover:bg-purple-50'
                          }`}
                        >
                          <div className="text-xs text-gray-500 mb-1">{day.weekday}</div>
                          <div className="font-semibold">{day.day}</div>
                          <div className="text-xs text-gray-500">{day.month}</div>
                        </button>
                      ))}
                    </div>

                    {selectedDate && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-700">
                          <strong>Fecha seleccionada:</strong> {formatSelectedDate(selectedDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selección de Horario */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-purple-600" />
                      Selecciona un Horario
                    </h3>
                    
                    <div className="space-y-3">
                      {timeSlots.map((slot) => (
                        <label
                          key={slot.value}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:border-purple-300 ${
                            selectedTimeSlot === slot.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot.value}
                            checked={selectedTimeSlot === slot.value}
                            onChange={(e) => setSelectedTimeSlot(e.target.value)}
                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <span className="ml-3 font-medium text-gray-900">{slot.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mensaje Adicional */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mensaje Adicional (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ej: Prefiero visitar por la mañana temprano, tengo disponibilidad flexible..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Mensaje de Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Información Adicional */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• El propietario confirmará la disponibilidad en las próximas 24 horas</li>
                      <li>• Las visitas se realizan de lunes a sábado</li>
                      <li>• Se recomienda llegar puntual a la cita acordada</li>
                    </ul>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedDate || !selectedTimeSlot}
                      className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Confirmar y Enviar Solicitud</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};