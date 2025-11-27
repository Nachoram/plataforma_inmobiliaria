import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'deadline' | 'reminder' | 'visit' | 'negotiation' | 'closing' | 'inspection';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'confirmed' | 'tentative' | 'cancelled';
  relatedOfferId?: string;
  relatedTaskId?: string;
  color?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    count?: number;
  };
  reminders?: {
    minutes: number;
    method: 'popup' | 'email' | 'push';
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  currentDate: Date;
  events: CalendarEvent[];
  filteredEvents: CalendarEvent[];
}

export interface CalendarFilters {
  types: CalendarEvent['type'][];
  priorities: CalendarEvent['priority'][];
  statuses: CalendarEvent['status'][];
  relatedOfferId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Hook personalizado para gestión de calendario integrado
 */
export const useCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<CalendarView['type']>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<CalendarFilters>({
    types: [],
    priorities: [],
    statuses: []
  });

  // Cargar eventos del calendario
  const loadEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .or(`created_by.eq.${user.id},attendees.cs.{${user.id}}`);

      // Filtrar por rango de fechas si se especifica
      if (startDate) {
        query = query.gte('start_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('end_date', endDate.toISOString());
      }

      const { data, error } = await query.order('start_date');

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (data || []).map(event => ({
        ...event,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
        attendees: event.attendees || [],
        reminders: event.reminders || []
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Crear evento
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          ...eventData,
          start_date: eventData.startDate.toISOString(),
          end_date: eventData.endDate.toISOString(),
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent: CalendarEvent = {
        ...data,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        attendees: data.attendees || [],
        reminders: data.reminders || []
      };

      setEvents(prev => [...prev, newEvent]);

      // Programar recordatorios
      if (newEvent.reminders && newEvent.reminders.length > 0) {
        scheduleReminders(newEvent);
      }

      // Sincronizar con calendario externo si está configurado
      await syncToExternalCalendar(newEvent);

      return newEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }, [user]);

  // Actualizar evento
  const updateEvent = useCallback(async (eventId: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdBy' | 'createdAt'>>) => {
    try {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };

      if (updates.startDate) {
        updateData.start_date = updates.startDate.toISOString();
      }
      if (updates.endDate) {
        updateData.end_date = updates.endDate.toISOString();
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent: CalendarEvent = {
        ...data,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        attendees: data.attendees || [],
        reminders: data.reminders || []
      };

      setEvents(prev => prev.map(event =>
        event.id === eventId ? updatedEvent : event
      ));

      // Re-programar recordatorios
      if (updatedEvent.reminders && updatedEvent.reminders.length > 0) {
        scheduleReminders(updatedEvent);
      }

      // Sincronizar con calendario externo
      await syncToExternalCalendar(updatedEvent);

      return updatedEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  }, []);

  // Eliminar evento
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));

      // Cancelar recordatorios
      cancelReminders(eventId);

      // Sincronizar eliminación con calendario externo
      await syncDeleteToExternalCalendar(eventId);

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }, []);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro por tipos
      if (filters.types.length > 0 && !filters.types.includes(event.type)) {
        return false;
      }

      // Filtro por prioridades
      if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) {
        return false;
      }

      // Filtro por estados
      if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) {
        return false;
      }

      // Filtro por oferta relacionada
      if (filters.relatedOfferId && event.relatedOfferId !== filters.relatedOfferId) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateRange) {
        const eventStart = event.startDate;
        const eventEnd = event.endDate;
        const filterStart = filters.dateRange.start;
        const filterEnd = filters.dateRange.end;

        if (eventEnd < filterStart || eventStart > filterEnd) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  // Eventos por fecha para vista de calendario
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    filteredEvents.forEach(event => {
      const startDate = new Date(event.startDate);
      startDate.setHours(0, 0, 0, 0);
      const dateKey = startDate.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);

      // Para eventos de múltiples días
      if (!event.allDay) {
        const endDate = new Date(event.endDate);
        endDate.setHours(0, 0, 0, 0);

        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate <= endDate) {
          const multiDayKey = currentDate.toISOString().split('T')[0];
          if (!grouped[multiDayKey]) {
            grouped[multiDayKey] = [];
          }
          grouped[multiDayKey].push({ ...event, isMultiDay: true });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    return grouped;
  }, [filteredEvents]);

  // Obtener eventos para una fecha específica
  const getEventsForDate = useCallback((date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate[dateKey] || [];
  }, [eventsByDate]);

  // Obtener eventos para un rango de fechas
  const getEventsForRange = useCallback((startDate: Date, endDate: Date) => {
    const eventsInRange: CalendarEvent[] = [];

    filteredEvents.forEach(event => {
      if (
        (event.startDate >= startDate && event.startDate <= endDate) ||
        (event.endDate >= startDate && event.endDate <= endDate) ||
        (event.startDate <= startDate && event.endDate >= endDate)
      ) {
        eventsInRange.push(event);
      }
    });

    return eventsInRange.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [filteredEvents]);

  // Navegar en el calendario
  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const navigateToNext = useCallback(() => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }

    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const navigateToPrevious = useCallback(() => {
    const newDate = new Date(currentDate);

    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }

    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  // Programar recordatorios
  const scheduleReminders = useCallback((event: CalendarEvent) => {
    if (!event.reminders) return;

    event.reminders.forEach((reminder, index) => {
      const reminderTime = new Date(event.startDate.getTime() - reminder.minutes * 60000);

      if (reminderTime > new Date()) {
        const timeoutId = setTimeout(() => {
          showReminder(event, reminder);
        }, reminderTime.getTime() - Date.now());

        // Guardar el timeout ID para poder cancelarlo después
        // En una implementación real, esto debería guardarse en el estado
        console.log(`Reminder scheduled for ${event.title} at ${reminderTime.toISOString()}`);
      }
    });
  }, []);

  // Mostrar recordatorio
  const showReminder = useCallback((event: CalendarEvent, reminder: CalendarEvent['reminders'][0]) => {
    if (reminder.method === 'popup') {
      // Mostrar notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Recordatorio: ${event.title}`, {
          body: `Empieza en ${reminder.minutes} minutos`,
          icon: '/logo192.png',
          tag: `reminder-${event.id}`
        });
      }
    }

    // Aquí podríamos también enviar email o push notification
    console.log(`Reminder triggered for event: ${event.title}`);
  }, []);

  // Cancelar recordatorios
  const cancelReminders = useCallback((eventId: string) => {
    // En una implementación real, cancelaríamos los timeouts programados
    console.log(`Reminders cancelled for event: ${eventId}`);
  }, []);

  // Sincronización con calendario externo (Google Calendar, Outlook, etc.)
  const syncToExternalCalendar = useCallback(async (event: CalendarEvent) => {
    // TODO: Implementar sincronización con servicios externos
    // Esto requeriría integración con Google Calendar API, Outlook API, etc.
    console.log('Sync to external calendar:', event.title);
  }, []);

  const syncDeleteToExternalCalendar = useCallback(async (eventId: string) => {
    // TODO: Implementar eliminación en calendario externo
    console.log('Delete from external calendar:', eventId);
  }, []);

  // Cargar eventos inicialmente
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Recargar eventos cuando cambie la vista o filtros
  useEffect(() => {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);

    switch (currentView) {
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
      case 'week':
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'day':
        // Ya está configurado para el día actual
        break;
      case 'agenda':
        // Mostrar próximos 30 días
        endDate.setDate(endDate.getDate() + 30);
        break;
    }

    loadEvents(startDate, endDate);
  }, [currentDate, currentView, loadEvents]);

  return {
    // Estado
    events,
    filteredEvents,
    loading,
    currentView,
    currentDate,
    filters,
    eventsByDate,

    // Acciones
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    setFilters,

    // Navegación
    navigateToDate,
    navigateToToday,
    navigateToNext,
    navigateToPrevious,
    setCurrentView,

    // Utilidades
    getEventsForDate,
    getEventsForRange,

    // Sincronización
    syncToExternalCalendar,
    syncDeleteToExternalCalendar
  };
};
