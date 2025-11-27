import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Save, Home, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CalendarComponent from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './PropertyAvailabilityManager.css';

interface AvailabilitySlot {
  id?: string;
  date: Date;
  timeSlots: string[]; // ['morning', 'afternoon', etc.]
  customTimes?: {
    start: string;
    end: string;
  }[];
}

interface AvailabilityEvent {
  id: string;
  property_id: string;
  title: string;
  start_date: Date;
  end_date: Date;
  type: 'availability';
  status: 'confirmed';
  created_by: string;
  created_at: Date;
  updated_at: Date;
  availability_data?: {
    timeSlots: string[];
    customTimes?: {
      start: string;
      end: string;
    }[];
  };
}

interface VisitRequest {
  id: string;
  property_id: string;
  requested_date: string;
  requested_time_slot: string;
  status: string;
  created_at: Date;
}

interface Property {
  id: string;
  address_street: string;
  address_number: string;
  address_commune: string;
  address_region: string;
  owner_id: string;
}

interface PropertyAvailabilityManagerProps {
  // Opcional para uso futuro como modal
  onClose?: () => void;
}

export const PropertyAvailabilityManager: React.FC<PropertyAvailabilityManagerProps> = ({ onClose }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [existingAvailability, setExistingAvailability] = useState<AvailabilityEvent[]>([]);
  const [confirmedVisits, setConfirmedVisits] = useState<VisitRequest[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [selectedDateForTimeConfig, setSelectedDateForTimeConfig] = useState<Date | null>(null);
  const [lastAction, setLastAction] = useState<string>('');

  // Opciones de horarios disponibles (franjas de 1 hora)
  const timeSlotOptions = [
    { id: '9-10', label: '9:00 - 10:00', time: '09:00-10:00' },
    { id: '10-11', label: '10:00 - 11:00', time: '10:00-11:00' },
    { id: '11-12', label: '11:00 - 12:00', time: '11:00-12:00' },
    { id: '12-13', label: '12:00 - 13:00', time: '12:00-13:00' },
    { id: '13-14', label: '13:00 - 14:00', time: '13:00-14:00' },
    { id: '14-15', label: '14:00 - 15:00', time: '14:00-15:00' },
    { id: '15-16', label: '15:00 - 16:00', time: '15:00-16:00' },
    { id: '16-17', label: '16:00 - 17:00', time: '16:00-17:00' },
    { id: '17-18', label: '17:00 - 18:00', time: '17:00-18:00' },
    { id: '18-19', label: '18:00 - 19:00', time: '18:00-19:00' },
    { id: '19-20', label: '19:00 - 20:00', time: '19:00-20:00' },
    { id: 'flexible', label: 'Horario flexible', time: 'A convenir' }
  ];

  useEffect(() => {
    if (id) {
      fetchPropertyData();
    }
  }, [id]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('id, address_street, address_number, address_commune, address_region, owner_id')
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;

      // Verificar que el usuario es el propietario
      if (user && propertyData.owner_id !== user.id) {
        setError('No tienes permisos para gestionar la disponibilidad de esta propiedad');
        return;
      }

      setProperty(propertyData);

      // Cargar disponibilidad existente y visitas confirmadas
      await Promise.all([
        loadExistingAvailability(),
        loadConfirmedVisits()
      ]);

    } catch (err: any) {
      console.error('Error fetching property data:', err);
      setError(err.message || 'Error al cargar los datos de la propiedad');
    } finally {
      setLoading(false);
    }
  };

  // Cargar disponibilidad existente desde la base de datos
  const loadExistingAvailability = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('property_id', id)
        .eq('type', 'availability')
        .eq('created_by', user.id)
        .order('start_date');

      if (error) throw error;

      console.log('🔍 Debug - Datos de disponibilidad cargados:', data);

      const availabilityEvents: AvailabilityEvent[] = (data || []).map(event => ({
        ...event,
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        created_at: new Date(event.created_at),
        updated_at: new Date(event.updated_at)
      }));

      console.log('🔍 Debug - Eventos de disponibilidad procesados:', availabilityEvents);

      setExistingAvailability(availabilityEvents);

      // Convertir eventos a availabilitySlots para el estado local
      const slots: AvailabilitySlot[] = availabilityEvents.map(event => ({
        id: event.id,
        date: event.start_date,
        timeSlots: event.availability_data?.timeSlots || ['10-11', '11-12', '14-15', '15-16'], // Default si no hay datos
        customTimes: event.availability_data?.customTimes || []
      }));
      setAvailabilitySlots(slots);

    } catch (error: any) {
      console.error('Error loading existing availability:', error);
      // No mostrar error al usuario, solo loggear
    }
  };

  // Cargar visitas confirmadas para la propiedad
  const loadConfirmedVisits = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('visit_requests')
        .select('id, property_id, requested_date, requested_time_slot, status, created_at')
        .eq('property_id', id)
        .eq('status', 'confirmed')
        .order('requested_date');

      if (error) throw error;

      const visits: VisitRequest[] = (data || []).map(visit => ({
        ...visit,
        created_at: new Date(visit.created_at)
      }));

      setConfirmedVisits(visits);

    } catch (error: any) {
      console.error('Error loading confirmed visits:', error);
      // No mostrar error al usuario, solo loggear
    }
  };

  // Guardar disponibilidad en la base de datos
  const saveAvailabilityToDatabase = async () => {
    if (!user || !property) return;

    console.log('🔍 Debug Save - Iniciando guardado...');
    console.log('🔍 Debug Save - Usuario:', user.id);
    console.log('🔍 Debug Save - Propiedad:', property.id);
    console.log('🔍 Debug Save - Slots a guardar:', availabilitySlots);

    try {
      // Obtener los slots que estaban disponibles anteriormente
      const previousSlots = existingAvailability.map(event => ({
        date: event.start_date.toISOString().split('T')[0],
        timeSlots: event.availability_data?.timeSlots || ['morning', 'afternoon'],
        customTimes: event.availability_data?.customTimes || []
      }));

      // Obtener los slots actuales
      const currentSlots = availabilitySlots.map(slot => ({
        date: slot.date.toISOString().split('T')[0],
        timeSlots: slot.timeSlots,
        customTimes: slot.customTimes || []
      }));

      // Crear mapas para comparación
      const previousMap = new Map(previousSlots.map(slot => [slot.date, slot]));
      const currentMap = new Map(currentSlots.map(slot => [slot.date, slot]));

      // Determinar qué slots agregar, actualizar y eliminar
      const slotsToAdd = currentSlots.filter(slot => !previousMap.has(slot.date));
      const slotsToUpdate = currentSlots.filter(slot => {
        const prev = previousMap.get(slot.date);
        return prev && (
          JSON.stringify(prev.timeSlots) !== JSON.stringify(slot.timeSlots) ||
          JSON.stringify(prev.customTimes) !== JSON.stringify(slot.customTimes)
        );
      });
      const slotsToRemove = previousSlots.filter(slot => !currentMap.has(slot.date));

      // Eliminar slots que ya no están disponibles
      if (slotsToRemove.length > 0) {
        const datesToRemove = slotsToRemove.map(slot => slot.date);
        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('property_id', property.id)
          .eq('type', 'availability')
          .eq('created_by', user.id)
          .in('start_date', datesToRemove.map(date => `${date}T00:00:00.000Z`));

        if (deleteError) throw deleteError;
      }

      // Agregar nuevos slots
      if (slotsToAdd.length > 0) {
        const eventsToInsert = slotsToAdd.map(slot => {
          const date = new Date(`${slot.date}T00:00:00.000Z`);
          const eventData = {
            property_id: property.id,
            title: `Disponible para visitas - ${property.address_street}`,
            start_date: date.toISOString(),
            end_date: date.toISOString(),
            type: 'availability',
            status: 'confirmed',
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            all_day: true,
            availability_data: {
              timeSlots: slot.timeSlots,
              customTimes: slot.customTimes
            }
          };
          console.log('🔍 Debug - Insertando evento:', eventData);
          return eventData;
        });

        console.log('🔍 Debug - Todos los eventos a insertar:', eventsToInsert);

        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert(eventsToInsert);

        if (insertError) throw insertError;
      }

      // Actualizar slots existentes
      if (slotsToUpdate.length > 0) {
        for (const slot of slotsToUpdate) {
          const { error: updateError } = await supabase
            .from('calendar_events')
            .update({
              updated_at: new Date().toISOString(),
              availability_data: {
                timeSlots: slot.timeSlots,
                customTimes: slot.customTimes
              }
            })
            .eq('property_id', property.id)
            .eq('type', 'availability')
            .eq('created_by', user.id)
            .eq('start_date', `${slot.date}T00:00:00.000Z`);

          if (updateError) throw updateError;
        }
      }

      // Recargar disponibilidad para sincronizar
      await loadExistingAvailability();

      console.log('✅ Debug - Disponibilidad guardada exitosamente');

    } catch (error: any) {
      console.error('❌ Error saving availability:', error);
      throw error;
    }
  };




  // Manejar selección de fechas en el calendario
  const handleDateClick = (date: Date) => {
    // Normalizar la fecha (solo año, mes, día)
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Verificar si la fecha ya tiene slots configurados
    const existingSlot = availabilitySlots.find(slot =>
      slot.date.getFullYear() === normalizedDate.getFullYear() &&
      slot.date.getMonth() === normalizedDate.getMonth() &&
      slot.date.getDate() === normalizedDate.getDate()
    );

    if (existingSlot) {
      // Si existe, abrir configuración de horarios
      setSelectedDateForTimeConfig(normalizedDate);
    } else {
      // Si no existe, crear slot con horarios por defecto y abrir configuración
      const newSlot: AvailabilitySlot = {
        date: normalizedDate,
        timeSlots: ['10-11', '11-12', '14-15', '15-16'], // Horarios por defecto: mañana y tarde
        customTimes: []
      };
      setAvailabilitySlots(prev => [...prev, newSlot]);
      setSelectedDateForTimeConfig(normalizedDate);
    }
  };

  // Actualizar horarios para una fecha específica
  const updateTimeSlotsForDate = (date: Date, timeSlots: string[]) => {
    setAvailabilitySlots(prev =>
      prev.map(slot =>
        slot.date.getTime() === date.getTime()
          ? { ...slot, timeSlots }
          : slot
      )
    );
  };

  // Remover una fecha de disponibilidad
  const removeAvailabilityForDate = (date: Date) => {
    setAvailabilitySlots(prev =>
      prev.filter(slot => slot.date.getTime() !== date.getTime())
    );
    setSelectedDateForTimeConfig(null);
  };

  // Limpiar todos los horarios de una fecha (dejarla sin horarios disponibles)
  const clearTimeSlotsForDate = (date: Date) => {
    setAvailabilitySlots(prev =>
      prev.map(slot =>
        slot.date.getTime() === date.getTime()
          ? { ...slot, timeSlots: [] }
          : slot
      )
    );
    setLastAction(`Horarios limpiados para ${date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}`);
    setTimeout(() => setLastAction(''), 3000);
  };

  // Obtener horarios disponibles para una fecha específica
  const getAvailableTimeSlotsForDate = (dateString: string) => {
    const slot = availabilitySlots.find(slot =>
      slot.date.toISOString().split('T')[0] === dateString
    );
    return slot?.timeSlots || [];
  };

  // Quitar un horario específico de una fecha
  const removeTimeSlotFromDate = (date: Date, timeSlotId: string) => {
    const option = timeSlotOptions.find(opt => opt.id === timeSlotId);
    setAvailabilitySlots(prev =>
      prev.map(slot =>
        slot.date.getTime() === date.getTime()
          ? { ...slot, timeSlots: slot.timeSlots.filter(id => id !== timeSlotId) }
          : slot
      )
    );
    setLastAction(`Horario ${option?.time || timeSlotId} removido de ${date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}`);
    setTimeout(() => setLastAction(''), 3000);
  };

  // Función para guardar la disponibilidad
  const handleSaveAvailability = async () => {
    if (!user || !property) return;

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await saveAvailabilityToDatabase();

      // Mostrar éxito
      setSaveSuccess(true);

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error saving availability:', error);
      setSaveError(error.message || 'Error al guardar la disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(`/portfolio/property/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-gray-600">Cargando propiedad...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleGoBack}
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
          <p className="text-gray-600 mb-6">La propiedad que buscas no existe.</p>
          <Link
            to="/portfolio"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir al Portafolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a la Propiedad
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>


            {/* Mensaje de éxito */}
            {saveSuccess && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Disponibilidad guardada correctamente
              </div>
            )}

            {/* Mensaje de éxito */}
            {saveSuccess && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Disponibilidad guardada correctamente
              </div>
            )}

            {/* Mensaje de acción */}
            {lastAction && (
              <div className="flex items-center text-blue-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                {lastAction}
              </div>
            )}

            {/* Mensaje de error */}
            {saveError && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {saveError}
              </div>
            )}
          </div>
        </div>

        {/* Property Info */}
        <div className="border-t pt-4">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Gestión de Disponibilidad
              </h1>
              <p className="text-lg text-gray-700">
                {property.address_street} {property.address_number}
              </p>
              <p className="text-gray-600">
                {property.address_commune}, {property.address_region}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario de Disponibilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario Principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">
                Selecciona tus días disponibles
              </h3>
            </div>

            <div className="flex justify-center">
              <CalendarComponent
                onClickDay={handleDateClick}
                tileClassName={({ date, view }) => {
                  if (view === 'month') {
                    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                    // Verificar si hay visitas confirmadas en esta fecha
                    const hasConfirmedVisit = confirmedVisits.some(visit =>
                      new Date(visit.requested_date).toDateString() === normalizedDate.toDateString()
                    );

                    // Verificar si la fecha está disponible
                    const isAvailable = availabilitySlots.some(slot =>
                      slot.date.getFullYear() === normalizedDate.getFullYear() &&
                      slot.date.getMonth() === normalizedDate.getMonth() &&
                      slot.date.getDate() === normalizedDate.getDate()
                    );

                    // Prioridad: visitas confirmadas > disponible > normal
                    if (hasConfirmedVisit) {
                      return 'confirmed-visit-date';
                    } else if (isAvailable) {
                      return 'available-date';
                    }
                  }
                  return null;
                }}
                minDate={new Date()}
                className="rounded-lg border-0 shadow-none w-full max-w-md"
                locale="es-CL"
              />
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              Haz clic en las fechas para seleccionar horarios específicos disponibles (franjas de 1 hora)
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">

          {/* Visitas Confirmadas */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-amber-600" />
              Visitas Confirmadas
            </h4>

            {confirmedVisits.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No hay visitas confirmadas para esta propiedad.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  {confirmedVisits.length} visita{confirmedVisits.length !== 1 ? 's' : ''} confirmada{confirmedVisits.length !== 1 ? 's' : ''}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {confirmedVisits
                    .sort((a, b) => new Date(a.requested_date).getTime() - new Date(b.requested_date).getTime())
                    .map((visit, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 flex-shrink-0">
                          <span className="text-xs">👥</span>
                        </div>
                        <div className="flex-1">
                          {new Date(visit.requested_date).toLocaleDateString('es-CL', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                          <span className="text-gray-500 ml-1">
                            ({visit.requested_time_slot})
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Leyenda</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span>Días disponibles para visitas</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-amber-500 rounded mr-3 relative">
                  <span className="absolute -top-1 -right-1 text-xs">👥</span>
                </div>
                <span>Visitas confirmadas</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
                <span>Días no disponibles</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span>Hoy</span>
              </div>
            </div>
          </div>

          {/* Próximas Funcionalidades */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Próximas Funcionalidades</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="text-green-600 font-medium">✅ Configuración de horarios por día</li>
              <li>• Vista semanal y mensual</li>
              <li>• Bloqueo de fechas específicas</li>
              <li className="text-green-600 font-medium">✅ Sincronización con visitas confirmadas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de Configuración de Horarios */}
      {selectedDateForTimeConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Configurar Horarios
                </h3>
                <button
                  onClick={() => setSelectedDateForTimeConfig(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Fecha:</strong> {selectedDateForTimeConfig.toLocaleDateString('es-CL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Horarios disponibles:</h4>

                {/* Información del estado actual */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-gray-700">
                    <strong>Horarios actualmente configurados:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getAvailableTimeSlotsForDate(selectedDateForTimeConfig.toISOString().split('T')[0]).length > 0 ? (
                        getAvailableTimeSlotsForDate(selectedDateForTimeConfig.toISOString().split('T')[0]).map(slotId => {
                          const option = timeSlotOptions.find(opt => opt.id === slotId);
                          return (
                            <span key={slotId} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              {option?.time || slotId}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500 italic">Ninguno</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de selección rápida */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => {
                      const morningSlots = ['9-10', '10-11', '11-12'];
                      const currentSlot = availabilitySlots.find(slot =>
                        slot.date.getTime() === selectedDateForTimeConfig.getTime()
                      );
                      const currentTimeSlots = currentSlot?.timeSlots || [];
                      const newTimeSlots = [...new Set([...currentTimeSlots, ...morningSlots])];
                      updateTimeSlotsForDate(selectedDateForTimeConfig, newTimeSlots);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    title="Agregar mañana completa (9:00-12:00)"
                  >
                    + Mañana
                  </button>
                  <button
                    onClick={() => {
                      const afternoonSlots = ['14-15', '15-16', '16-17'];
                      const currentSlot = availabilitySlots.find(slot =>
                        slot.date.getTime() === selectedDateForTimeConfig.getTime()
                      );
                      const currentTimeSlots = currentSlot?.timeSlots || [];
                      const newTimeSlots = [...new Set([...currentTimeSlots, ...afternoonSlots])];
                      updateTimeSlotsForDate(selectedDateForTimeConfig, newTimeSlots);
                    }}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    title="Agregar tarde completa (14:00-17:00)"
                  >
                    + Tarde
                  </button>
                  <button
                    onClick={() => {
                      updateTimeSlotsForDate(selectedDateForTimeConfig, []);
                    }}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    title="Quitar todos los horarios"
                  >
                    🗑️ Limpiar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {timeSlotOptions.map((option) => {
                    const currentSlot = availabilitySlots.find(slot =>
                      slot.date.getTime() === selectedDateForTimeConfig.getTime()
                    );
                    const isSelected = currentSlot?.timeSlots.includes(option.id) || false;

                    return (
                      <label
                        key={option.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newTimeSlots = isSelected
                              ? currentSlot!.timeSlots.filter(id => id !== option.id)
                              : [...(currentSlot?.timeSlots || []), option.id];

                            updateTimeSlotsForDate(selectedDateForTimeConfig, newTimeSlots);
                          }}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
                            {option.label}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  Selecciona los horarios en los que estás disponible para visitas
                </div>
              </div>

              <div className="space-y-3">
                {/* Información de horarios seleccionados */}
                <div className="text-sm text-gray-600">
                  Horarios seleccionados: <strong>{getAvailableTimeSlotsForDate(selectedDateForTimeConfig.toISOString().split('T')[0]).length}</strong>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => clearTimeSlotsForDate(selectedDateForTimeConfig)}
                    className="px-3 py-2 text-sm border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
                    title="Quitar todos los horarios pero mantener la fecha"
                  >
                    🗑️ Limpiar
                  </button>
                  <button
                    onClick={() => removeAvailabilityForDate(selectedDateForTimeConfig)}
                    className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    title="Eliminar completamente esta fecha de disponibilidad"
                  >
                    ❌ Remover
                  </button>
                  <button
                    onClick={() => setSelectedDateForTimeConfig(null)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✅ Listo
                  </button>
                </div>

                {/* Instrucciones */}
                <div className="text-xs text-gray-500 text-center bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-800 mb-1">💡 Cómo gestionar horarios:</div>
                  • <strong>Checkbox:</strong> Marcar/desmarcar horario<br/>
                  • <strong>Botón ✕:</strong> Quitar horario específico<br/>
                  • <strong>"Limpiar":</strong> Quita todos los horarios<br/>
                  • <strong>"Remover":</strong> Elimina la fecha completa
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fechas Seleccionadas - Debajo del Calendario */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Clock className="h-8 w-8 mr-4 text-blue-600" />
              Fechas Seleccionadas
            </h3>
            {availabilitySlots.length > 0 && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-blue-100 text-blue-800">
                {availabilitySlots.length} fecha{availabilitySlots.length !== 1 ? 's' : ''} configurada{availabilitySlots.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {availabilitySlots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Clock className="h-16 w-16 mx-auto" />
              </div>
              <h4 className="text-xl font-medium text-gray-700 mb-2">
                No hay fechas configuradas
              </h4>
              <p className="text-gray-600 text-lg">
                Haz clic en el calendario de arriba para elegir días disponibles y configurar horarios específicos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availabilitySlots
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((slot, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-lg">
                    {/* Header con fecha y acciones */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">
                            {slot.date.toLocaleDateString('es-CL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">
                            {slot.date.toLocaleDateString('es-CL', {
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedDateForTimeConfig(slot.date)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Editar horarios"
                        >
                          <span className="mr-1">✏️</span>
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar toda la disponibilidad para ${slot.date.toLocaleDateString('es-CL', { weekday: 'long', month: 'long', day: 'numeric' })}?`)) {
                              removeAvailabilityForDate(slot.date);
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Eliminar fecha completa"
                        >
                          <span className="mr-1">🗑️</span>
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Horarios disponibles */}
                    <div className="border-t border-gray-300 pt-4">
                      <div className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="mr-2">🕐</span>
                        Horarios Disponibles
                      </div>
                      {slot.timeSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {slot.timeSlots.map(slotId => {
                            const option = timeSlotOptions.find(opt => opt.id === slotId);
                            return (
                              <span
                                key={slotId}
                                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-green-100 text-green-800 rounded-lg border border-green-200 hover:bg-green-200 transition-colors"
                                title={option?.label || slotId}
                              >
                                {option?.time || slotId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-base text-orange-600 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                          <span className="mr-3 text-lg">⚠️</span>
                          <span className="font-medium">Sin horarios configurados</span>
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="border-t border-gray-300 mt-4 pt-4">
                      <div className="text-sm text-gray-600 flex items-center justify-center bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="mr-2 text-lg">📅</span>
                        <span className="font-medium">
                          {slot.timeSlots.length} horario{slot.timeSlots.length !== 1 ? 's' : ''} disponible{slot.timeSlots.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
