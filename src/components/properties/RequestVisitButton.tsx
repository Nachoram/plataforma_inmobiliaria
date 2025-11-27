import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface RequestVisitButtonProps {
  propertyId: string;
  propertyAddress: string;
}

interface AvailabilitySlot {
  date: Date;
  timeSlots: string[];
}

// Función de test global para debugging
(window as any).testCalendarQuery = async (propertyId: string) => {
  console.log('🧪 TEST GLOBAL - Probando consulta directa...');
  const { createClient } = await import('../../lib/supabase');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('property_id', propertyId)
    .eq('type', 'availability');

  console.log('🧪 TEST GLOBAL - Resultado:', { data, error });
  return { data, error };
};

export const RequestVisitButton: React.FC<RequestVisitButtonProps> = ({
  propertyId,
  propertyAddress
}) => {
  const { user } = useAuth();

  console.log('🔍 Debug RequestVisitButton - Props recibidas:', { propertyId, propertyAddress });
  console.log('🔍 Debug RequestVisitButton - Usuario:', user?.id);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [ownerAvailability, setOwnerAvailability] = useState<AvailabilitySlot[]>([]);

  // Estado del formulario
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [message, setMessage] = useState('');
  const [visitorName, setVisitorName] = useState<string>('');
  const [visitorEmail, setVisitorEmail] = useState<string>('');
  const [visitorPhone, setVisitorPhone] = useState<string>('');

  // Cargar disponibilidad del propietario cuando se abre el modal
  useEffect(() => {
    console.log('🔍 Debug RequestVisitButton - useEffect ejecutado:', { showModal, propertyId });
    if (showModal && propertyId) {
      console.log('🔍 Debug RequestVisitButton - Llamando loadOwnerAvailability');
      loadOwnerAvailability();
    } else {
      console.log('🔍 Debug RequestVisitButton - No se llama loadOwnerAvailability:', { showModal, propertyId });
    }
  }, [showModal, propertyId]);

  // Cargar disponibilidad del propietario desde calendar_events
  const loadOwnerAvailability = async () => {
    if (!propertyId) return;

    setAvailabilityLoading(true);
    try {
      console.log('🔍 Debug RequestVisit - Buscando disponibilidad para propertyId:', propertyId);
      console.log('🔍 Debug RequestVisit - Fecha actual para filtro:', new Date().toISOString().split('T')[0]);

      // Primero verificar si hay algún dato en calendar_events
      const { data: allData, error: allError } = await supabase
        .from('calendar_events')
        .select('id, property_id, type, start_date, availability_data, created_by')
        .limit(10);

      console.log('🔍 Debug RequestVisit - TODOS los eventos en calendar_events:', allData);

      if (allError) {
        console.error('🔍 Debug RequestVisit - Error consultando todos los datos:', allError);
      }

      // PRIMERO: Consulta sin filtros para verificar que funciona
      console.log('🔍 Debug RequestVisit - HACIENDO CONSULTA SIN FILTROS...');
      const { data: testData, error: testError } = await supabase
        .from('calendar_events')
        .select('start_date, availability_data, property_id, type, created_by')
        .eq('property_id', propertyId)
        .eq('type', 'availability')
        .order('start_date');

      console.log('🔍 Debug RequestVisit - CONSULTA SIN FILTROS - Datos obtenidos:', testData);
      console.log('🔍 Debug RequestVisit - CONSULTA SIN FILTROS - Error:', testError);

      // SEGUNDO: Consulta sin filtro de fechas para debug
      console.log('🔍 Debug RequestVisit - HACIENDO CONSULTA CON FILTRO DE FECHAS...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      console.log('🔍 Debug RequestVisit - Fecha de hoy para filtro:', todayString);

      // Consulta con filtro de fechas (solo futuras)
      const { data: filteredData, error: filteredError } = await supabase
        .from('calendar_events')
        .select('start_date, availability_data, property_id, type, created_by')
        .eq('property_id', propertyId)
        .eq('type', 'availability')
        .gte('start_date', todayString)
        .order('start_date');

      console.log('🔍 Debug RequestVisit - CONSULTA CON FILTRO - Datos obtenidos:', filteredData);
      console.log('🔍 Debug RequestVisit - CONSULTA CON FILTRO - Error:', filteredError);

      // Usar datos filtrados
      const data = filteredData;
      const error = filteredError;

      if (error) {
        console.error('🔍 Debug RequestVisit - Error en consulta específica:', error);
        console.error('🔍 Debug RequestVisit - Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('🔍 Debug RequestVisit - Consulta específica - propertyId:', propertyId);
      console.log('🔍 Debug RequestVisit - Consulta específica - type: availability');
      console.log('🔍 Debug RequestVisit - Consulta específica - start_date >=', new Date().toISOString().split('T')[0]);
      console.log('🔍 Debug RequestVisit - Datos obtenidos de consulta específica:', data);
      console.log('🔍 Debug RequestVisit - Usuario actual:', user?.id);

      // Verificar si hay datos pero fueron filtrados
      if (data && data.length > 0) {
        console.log('🔍 Debug RequestVisit - Datos crudos antes del filtro:', data);
        const filteredData = data.filter(event => event.availability_data?.timeSlots?.length > 0);
        console.log('🔍 Debug RequestVisit - Datos después del filtro:', filteredData);
      }

      // Verificar conversión de fechas
      if (data && data.length > 0) {
        data.forEach((event, index) => {
          console.log(`🔍 Debug RequestVisit - Evento ${index}:`, {
            start_date: event.start_date,
            parsed_date: new Date(event.start_date),
            availability_data: event.availability_data
          });
        });
      }

      // Convertir los datos a formato de availability slots
      const slots: AvailabilitySlot[] = (data || [])
        .filter(event => event.availability_data?.timeSlots?.length > 0)
        .map(event => ({
          date: new Date(event.start_date),
          timeSlots: event.availability_data.timeSlots || []
        }));

      setOwnerAvailability(slots);
    } catch (error: any) {
      console.error('Error loading owner availability:', error);
      // En caso de error, permitir selección libre (fallback)
      setOwnerAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Generar días del calendario basados en disponibilidad del propietario
  const generateCalendarDays = () => {
    if (availabilityLoading) {
      return []; // Mostrar loading mientras carga
    }

    // Si no hay disponibilidad configurada, mostrar mensaje
    if (ownerAvailability.length === 0) {
      return [];
    }

    // Solo mostrar fechas que tienen disponibilidad configurada
    return ownerAvailability.slice(0, 21).map(slot => {
      const date = slot.date;
      return {
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        month: date.toLocaleDateString('es-CL', { month: 'short' }),
        weekday: date.toLocaleDateString('es-CL', { weekday: 'short' }),
        availableTimeSlots: slot.timeSlots
      };
    });
  };

  const calendarDays = generateCalendarDays();

  // Opciones de horario (franjas de 1 hora, coincidiendo con el sistema de disponibilidad)
  const timeSlots = [
    { value: '9-10', label: '9:00 - 10:00' },
    { value: '10-11', label: '10:00 - 11:00' },
    { value: '11-12', label: '11:00 - 12:00' },
    { value: '14-15', label: '14:00 - 15:00' },
    { value: '15-16', label: '15:00 - 16:00' },
    { value: '16-17', label: '16:00 - 17:00' },
    { value: 'flexible', label: 'Horario flexible' }
  ];

  // Obtener horarios disponibles para una fecha específica
  const getAvailableTimeSlotsForDate = (dateString: string) => {
    const availabilitySlot = ownerAvailability.find(slot =>
      slot.date.toISOString().split('T')[0] === dateString
    );
    return availabilitySlot?.timeSlots || [];
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha para la visita');
      return false;
    }

    // Verificar que la fecha seleccionada tenga disponibilidad
    const availableSlotsForDate = getAvailableTimeSlotsForDate(selectedDate);
    if (availableSlotsForDate.length === 0) {
      setError('Esta fecha no tiene horarios disponibles');
      return false;
    }

    if (!selectedTimeSlot) {
      setError('Por favor selecciona un horario para la visita');
      return false;
    }

    // Verificar que el horario seleccionado esté disponible para esta fecha
    if (!availableSlotsForDate.includes(selectedTimeSlot) && selectedTimeSlot !== 'flexible') {
      setError('El horario seleccionado no está disponible para esta fecha');
      return false;
    }

    // Validar información del visitante
    if (!visitorName.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return false;
    }

    if (!visitorEmail.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visitorEmail)) {
      setError('Por favor ingresa un correo electrónico válido');
      return false;
    }

    if (!visitorPhone.trim()) {
      setError('Por favor ingresa tu número de celular');
      return false;
    }

    // Validar formato de teléfono (aceptar números, espacios, guiones, paréntesis)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(visitorPhone)) {
      setError('Por favor ingresa un número de celular válido');
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

    // Validaciones de seguridad adicionales
    if (!propertyId) {
      setError('Error: ID de propiedad no válido');
      return;
    }

    // Verificar que la propiedad existe y está disponible
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('id, status')
        .eq('id', propertyId)
        .single();

      if (propertyError || !propertyData) {
        setError('Error: La propiedad no existe o no está disponible');
        return;
      }

      // Permitir visitas en propiedades que no estén vendidas o arrendadas
      if (propertyData.status === 'vendida' || propertyData.status === 'arrendada') {
        setError('Esta propiedad no está disponible para visitas (ya está vendida/arrendada)');
        return;
      }
    } catch (err) {
      setError('Error al verificar la propiedad');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar que no haya una solicitud pendiente para la misma fecha y horario
      const { data: existingRequests, error: checkError } = await supabase
        .from('visit_requests')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .eq('requested_date', selectedDate)
        .eq('requested_time_slot', selectedTimeSlot)
        .eq('status', 'pending');

      if (checkError) throw checkError;

      if (existingRequests && existingRequests.length > 0) {
        setError('Ya tienes una solicitud pendiente para esta fecha y horario');
        return;
      }

      // Insertar solicitud de visita en la base de datos
      const { data: requestData, error: insertError } = await supabase
        .from('visit_requests')
        .insert({
          property_id: propertyId,
          user_id: user.id,
          requested_date: selectedDate,
          requested_time_slot: selectedTimeSlot,
          message: message.trim() || null,
          visitor_name: visitorName.trim(),
          visitor_email: visitorEmail.trim().toLowerCase(),
          visitor_phone: visitorPhone.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Si la visita ya está confirmada automáticamente (por disponibilidad del propietario),
      // crear entrada en scheduled_visits
      if (requestData && requestData.status === 'confirmed') {
        console.log('🔄 Visita confirmada automáticamente, creando entrada en scheduled_visits');
        // El trigger se encargará de crear la entrada en scheduled_visits
      }

      // Mostrar éxito
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        // Resetear formulario
        setSelectedDate('');
        setSelectedTimeSlot('');
        setMessage('');
        setVisitorName('');
        setVisitorEmail('');
        setVisitorPhone('');
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
    setVisitorName('');
    setVisitorEmail('');
    setVisitorPhone('');
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
      <div className="space-y-2">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          <Calendar className="h-5 w-5" />
          <span>Solicitar Visita</span>
        </button>

      </div>

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
                      Agendar Visita a la Propiedad
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
                      Selecciona una Fecha Disponible
                    </h3>

                    {availabilityLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Cargando disponibilidad...</p>
                        <p className="text-xs text-gray-500 mt-2">Property ID: {propertyId}</p>
                        <p className="text-xs text-gray-500">Usuario: {user?.id}</p>
                      </div>
                    ) : calendarDays.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          No hay fechas disponibles
                        </h4>
                        <p className="text-gray-600">
                          El propietario aún no ha configurado sus horarios disponibles.
                          <br />
                          Puedes intentar contactarlo directamente o esperar a que configure su disponibilidad.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day) => (
                          <button
                            key={day.date}
                            type="button"
                            onClick={() => {
                              setSelectedDate(day.date);
                              // Resetear selección de horario cuando cambia la fecha
                              setSelectedTimeSlot('');
                            }}
                            className={`p-3 text-center rounded-lg border transition-all hover:border-purple-300 relative ${
                              selectedDate === day.date
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'border-gray-200 hover:bg-purple-50'
                            }`}
                            title={`${day.availableTimeSlots.length} horarios disponibles`}
                          >
                            <div className="text-xs text-gray-500 mb-1">{day.weekday}</div>
                            <div className="font-semibold">{day.day}</div>
                            <div className="text-xs text-gray-500">{day.month}</div>
                            {/* Indicador de disponibilidad */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">{day.availableTimeSlots.length}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

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
                      Selecciona un Horario Disponible
                    </h3>

                    {selectedDate ? (
                      (() => {
                        const availableSlotsForDate = getAvailableTimeSlotsForDate(selectedDate);
                        const availableTimeSlots = timeSlots.filter(slot =>
                          availableSlotsForDate.includes(slot.value) || slot.value === 'flexible'
                        );

                        return (
                          <div className="space-y-3">
                            {availableTimeSlots.length === 0 ? (
                              <p className="text-gray-600 text-center py-4">
                                No hay horarios disponibles para esta fecha.
                              </p>
                            ) : (
                              availableTimeSlots.map((slot) => (
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
                                  <div className="ml-3">
                                    <div className="font-medium text-gray-900">{slot.label}</div>
                                    {slot.value === 'flexible' && (
                                      <div className="text-sm text-gray-600">
                                        Coordinar horario directamente con el propietario
                                      </div>
                                    )}
                                  </div>
                                  {availableSlotsForDate.includes(slot.value) && (
                                    <div className="ml-auto">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Disponible
                                      </span>
                                    </div>
                                  )}
                                </label>
                              ))
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Selecciona primero una fecha para ver los horarios disponibles</p>
                      </div>
                    )}
                  </div>

                  {/* Información del Visitante */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>

                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Ingresa tu nombre completo"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="tu.email@ejemplo.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Celular */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Número de Celular *
                      </label>
                      <input
                        type="tel"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        placeholder="+569 1234 5678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
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
                      <li>• Solo se muestran fechas y horarios disponibles según la configuración del propietario</li>
                      <li>• Las visitas se confirman automáticamente cuando hay disponibilidad</li>
                      <li>• Recibirás una confirmación inmediata si la visita es aprobada</li>
                      <li>• Las visitas agendadas aparecen en el panel de gestión del propietario</li>
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
                          <span>Enviar Solicitud de Visita</span>
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
