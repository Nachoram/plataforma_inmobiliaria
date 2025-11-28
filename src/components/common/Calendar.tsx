import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Filter,
  X
} from 'lucide-react';
import { useCalendar, CalendarEvent } from '../../hooks/useCalendar';
import format from 'date-fns/format';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import addDays from 'date-fns/addDays';
import isSameMonth from 'date-fns/isSameMonth';
import isSameDay from 'date-fns/isSameDay';
import isToday from 'date-fns/isToday';
import es from 'date-fns/locale/es';

interface CalendarProps {
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  className = '',
  onEventClick,
  onDateClick,
  onCreateEvent
}) => {
  const {
    currentView,
    currentDate,
    filteredEvents,
    eventsByDate,
    navigateToPrevious,
    navigateToNext,
    navigateToToday,
    setCurrentView,
    getEventsForDate
  } = useCalendar();

  const [showFilters, setShowFilters] = useState(false);

  // Generar días del mes para vista mensual
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Renderizar vista mensual
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {/* Headers de días */}
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
        <div key={day} className="p-2 text-center font-semibold text-gray-600 border-b">
          {day}
        </div>
      ))}

      {/* Días del mes */}
      {monthDays.map((day, index) => {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isCurrentDay = isToday(day);

        return (
          <div
            key={index}
            className={`min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
              !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
            } ${isCurrentDay ? 'bg-blue-50 border-blue-300' : ''}`}
            onClick={() => onDateClick?.(day)}
          >
            <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : ''}`}>
              {format(day, 'd')}
            </div>

            {/* Eventos del día */}
            <div className="space-y-1 max-h-20 overflow-hidden">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded truncate cursor-pointer ${
                    event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    event.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}

              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 px-1">
                  +{dayEvents.length - 3} más
                </div>
              )}
            </div>

            {/* Botón para crear evento */}
            <button
              className="w-full mt-1 opacity-0 hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800"
              onClick={(e) => {
                e.stopPropagation();
                onCreateEvent?.(day);
              }}
            >
              <Plus className="h-3 w-3 mx-auto" />
            </button>
          </div>
        );
      })}
    </div>
  );

  // Renderizar vista semanal
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-8 gap-1">
        {/* Header con horas */}
        <div className="p-2"></div>
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-2 text-center border-b">
            <div className="font-semibold text-sm">{format(day, 'EEE', { locale: es })}</div>
            <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {/* Horas del día */}
        {Array.from({ length: 24 }, (_, hour) => (
          <React.Fragment key={hour}>
            <div className="p-2 text-right text-sm text-gray-500 border-t">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {/* Eventos por día */}
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day).filter(event =>
                !event.allDay && event.startDate.getHours() === hour
              );

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="p-1 border border-gray-200 min-h-12 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onDateClick?.(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                >
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 mb-1 rounded truncate ${
                        event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        event.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={`${event.title} - ${format(event.startDate, 'HH:mm')} a ${format(event.endDate, 'HH:mm')}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Renderizar vista diaria
  const renderDayView = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">{format(currentDate, 'EEEE d \'de\' MMMM', { locale: es })}</h2>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 24 }, (_, hour) => {
          const hourEvents = filteredEvents.filter(event =>
            !event.allDay &&
            isSameDay(event.startDate, currentDate) &&
            event.startDate.getHours() === hour
          );

          return (
            <div key={hour} className="flex border-b border-gray-200 pb-2">
              <div className="w-16 text-right pr-4 text-sm text-gray-500 font-mono">
                {hour.toString().padStart(2, '0')}:00
              </div>

              <div className="flex-1 space-y-1">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-2 rounded cursor-pointer ${
                      event.priority === 'urgent' ? 'bg-red-100 border-l-4 border-red-500' :
                      event.priority === 'high' ? 'bg-orange-100 border-l-4 border-orange-500' :
                      event.priority === 'normal' ? 'bg-blue-100 border-l-4 border-blue-500' :
                      'bg-gray-100 border-l-4 border-gray-500'
                    }`}
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees.length} asistentes
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <div className="text-sm text-gray-700 mt-1">{event.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Renderizar vista de agenda
  const renderAgendaView = () => (
    <div className="space-y-4">
      {Object.entries(
        filteredEvents.reduce((acc, event) => {
          const dateKey = format(event.startDate, 'yyyy-MM-dd');
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(event);
          return acc;
        }, {} as Record<string, CalendarEvent[]>)
      ).map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-gray-900">
            {format(new Date(dateKey), 'EEEE d \'de\' MMMM', { locale: es })}
          </h3>

          <div className="space-y-2">
            {dayEvents
              .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
              .map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onEventClick?.(event)}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    event.priority === 'urgent' ? 'bg-red-500' :
                    event.priority === 'high' ? 'bg-orange-500' :
                    event.priority === 'normal' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`} />

                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.allDay
                          ? 'Todo el día'
                          : `${format(event.startDate, 'HH:mm')} - ${format(event.endDate, 'HH:mm')}`
                        }
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    event.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.status === 'confirmed' ? 'Confirmado' :
                     event.status === 'tentative' ? 'Tentativo' : 'Cancelado'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay eventos programados</h3>
          <p>Los próximos eventos aparecerán aquí cuando sean programados.</p>
        </div>
      )}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={navigateToPrevious}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={navigateToToday}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Hoy
              </button>

              <button
                onClick={navigateToNext}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day', 'agenda'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                    currentView === view
                      ? 'bg-white shadow text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view === 'month' ? 'Mes' :
                   view === 'week' ? 'Semana' :
                   view === 'day' ? 'Día' : 'Agenda'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>{filteredEvents.length} eventos</span>
          <span>
            {filteredEvents.filter(e => e.priority === 'urgent').length} urgentes
          </span>
          <span>
            {filteredEvents.filter(e => isSameDay(e.startDate, new Date())).length} hoy
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderCurrentView()}
      </div>

      {/* Filtros (si están visibles) */}
      {showFilters && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filtros</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Aquí irían los controles de filtro */}
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option>Todos</option>
                <option>Reunión</option>
                <option>Fecha límite</option>
                <option>Visita</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prioridad</label>
              <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option>Todas</option>
                <option>Urgente</option>
                <option>Alta</option>
                <option>Normal</option>
                <option>Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                <option>Todos</option>
                <option>Confirmado</option>
                <option>Tentativo</option>
                <option>Cancelado</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


