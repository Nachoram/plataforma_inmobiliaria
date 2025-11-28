import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  X
} from 'lucide-react';
import { useUserCalendar, UserCalendarEvent } from '../../hooks/useUserCalendar';
import { Calendar } from '../common/Calendar';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import isSameDay from 'date-fns/isSameDay';
import es from 'date-fns/locale/es';

interface UserCalendarSectionProps {
  className?: string;
}

export const UserCalendarSection: React.FC<UserCalendarSectionProps> = ({ className = '' }) => {
  const {
    filteredEvents,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    getEventsForDate,
    getUpcomingEvents,
    eventStats
  } = useUserCalendar();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<UserCalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Obtener eventos del día seleccionado
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [getEventsForDate, selectedDate]);

  // Obtener eventos próximos
  const upcomingEvents = useMemo(() => {
    return getUpcomingEvents(7);
  }, [getUpcomingEvents]);

  // Iconos por tipo de evento
  const getEventIcon = (type: UserCalendarEvent['eventType']) => {
    switch (type) {
      case 'visit': return <CalendarIcon className="h-4 w-4" />;
      case 'closing': return <CheckCircle className="h-4 w-4" />;
      case 'deadline': return <AlertTriangle className="h-4 w-4" />;
      case 'negotiation': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Etiquetas por tipo de evento
  const getEventTypeLabel = (type: UserCalendarEvent['eventType']) => {
    switch (type) {
      case 'visit': return 'Visita';
      case 'closing': return 'Firma';
      case 'deadline': return 'Plazo';
      case 'negotiation': return 'Negociación';
      default: return type;
    }
  };

  // Prioridad en español
  const getPriorityLabel = (priority: UserCalendarEvent['priority']) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'normal': return 'Normal';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  // Manejar filtros
  const handleTypeFilter = (type: UserCalendarEvent['eventType']) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    setFilters({ types: newTypes });
  };

  const handlePriorityFilter = (priority: UserCalendarEvent['priority']) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    setFilters({ priorities: newPriorities });
  };

  // Estado de carga
  if (loading && filteredEvents.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-gray-600">Cargando calendario...</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error al cargar el calendario</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas y controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mi Calendario</h2>
            <p className="text-gray-600">Visitas, firmas y plazos importantes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Información de desarrollo si hay error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Modo Desarrollo</h3>
              <p className="text-sm text-amber-700 mt-1">
                Usando datos de ejemplo. Para datos reales, despliega la Edge Function.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Visitas</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {eventStats.byType.visit}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Firmas</span>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {eventStats.byType.closing}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Plazos</span>
          </div>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {eventStats.byType.deadline}
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Total</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 mt-1">
            {eventStats.total}
          </p>
        </div>
      </div>

      {/* Filtros (si están visibles) */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento
              </label>
              <div className="space-y-2">
                {(['visit', 'closing', 'deadline', 'negotiation'] as const).map(type => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.types.includes(type)}
                      onChange={() => handleTypeFilter(type)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{getEventTypeLabel(type)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <div className="space-y-2">
                {(['low', 'normal', 'high', 'urgent'] as const).map(priority => (
                  <label key={priority} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.priorities.includes(priority)}
                      onChange={() => handlePriorityFilter(priority)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{getPriorityLabel(priority)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Calendar
              onEventClick={(event) => setSelectedEvent(event)}
              onDateClick={setSelectedDate}
              className="w-full"
            />
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Eventos del Día Seleccionado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(selectedDate, 'EEEE d \'de\' MMMM', { locale: es })}
              {isToday(selectedDate) && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Hoy
                </span>
              )}
            </h3>

            <div className="space-y-2">
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No hay eventos programados</p>
              ) : (
                selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: event.color }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start gap-3">
                      <div style={{ color: event.color }}>
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {event.allDay
                              ? 'Todo el día'
                              : `${format(event.startDate, 'HH:mm')} - ${format(event.endDate, 'HH:mm')}`
                            }
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            event.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getPriorityLabel(event.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Próximos Eventos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Próximos 7 días</h3>

            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div style={{ color: event.color }}>
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(event.startDate, 'd MMM', { locale: es })}
                      {isSameDay(event.startDate, new Date()) && ' (Hoy)'}
                    </p>
                  </div>
                </div>
              ))}

              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-500">No hay eventos próximos</p>
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tipos de Eventos</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Visitas agendadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Firmas de contratos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Plazos importantes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm">Negociaciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Evento */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

// Componente Modal de Detalles
interface EventDetailsModalProps {
  event: UserCalendarEvent;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  const getEventIcon = (type: UserCalendarEvent['eventType']) => {
    switch (type) {
      case 'visit': return <CalendarIcon className="h-5 w-5" />;
      case 'closing': return <CheckCircle className="h-5 w-5" />;
      case 'deadline': return <AlertTriangle className="h-5 w-5" />;
      case 'negotiation': return <Clock className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getPriorityLabel = (priority: UserCalendarEvent['priority']) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'normal': return 'Normal';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: UserCalendarEvent['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Detalles del Evento</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div style={{ color: event.color }}>
              {getEventIcon(event.eventType)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{event.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 capitalize">
                  {getEventTypeLabel(event.eventType)}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                  {getPriorityLabel(event.priority)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">{event.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium">Fecha y Hora</div>
                <div className="text-gray-600">
                  {format(event.startDate, 'PPP', { locale: es })}
                  {!event.allDay && (
                    <div className="text-xs">
                      {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                    </div>
                  )}
                  {event.allDay && (
                    <div className="text-xs text-gray-500">Todo el día</div>
                  )}
                </div>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">Ubicación</div>
                  <div className="text-gray-600 text-xs">{event.location}</div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Estado:</span>
              <span className="capitalize text-gray-600">{event.status}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="font-medium">Tipo de Entidad:</span>
              <span className="capitalize text-gray-600">
                {event.relatedEntityType.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="font-medium">ID Entidad:</span>
              <span className="text-xs text-gray-500 font-mono">
                {event.relatedEntityId.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función helper para obtener etiqueta de evento
const getEventTypeLabel = (type: UserCalendarEvent['eventType']) => {
  switch (type) {
    case 'visit': return 'Visita';
    case 'closing': return 'Firma';
    case 'deadline': return 'Plazo';
    case 'negotiation': return 'Negociación';
    default: return type;
  }
};
