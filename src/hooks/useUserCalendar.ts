import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface UserCalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  eventType: 'visit' | 'closing' | 'deadline' | 'negotiation';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  relatedEntityType: 'scheduled_visit' | 'rental_contract' | 'property_sale_offer';
  relatedEntityId: string;
  location: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCalendarFilters {
  types: UserCalendarEvent['eventType'][];
  priorities: UserCalendarEvent['priority'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface UserCalendarState {
  events: UserCalendarEvent[];
  filteredEvents: UserCalendarEvent[];
  loading: boolean;
  error: string | null;
  filters: UserCalendarFilters;
}

/**
 * Hook personalizado para gestión de calendario integrado del usuario
 * Se conecta con la Edge Function get-user-calendar-events
 */
export const useUserCalendar = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UserCalendarState>({
    events: [],
    filteredEvents: [],
    loading: false,
    error: null,
    filters: {
      types: [],
      priorities: []
    }
  });

  // Cargar eventos del calendario
  const loadEvents = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, events: [], filteredEvents: [], loading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📅 Loading calendar events for user:', user.id);

      // Intentar llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('get-user-calendar-events', {
        body: {},
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.warn('⚠️ Edge Function not available, using mock data for development');

        // Fallback: Usar datos mock para desarrollo
        const mockEvents: UserCalendarEvent[] = [
          {
            id: 'visit-mock-1',
            title: 'Visita: Casa en Las Condes',
            description: 'Visita programada con María González - Inspección de propiedad',
            startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
            endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hora después
            allDay: false,
            eventType: 'visit' as const,
            priority: 'normal' as const,
            status: 'scheduled',
            relatedEntityType: 'scheduled_visit' as const,
            relatedEntityId: 'mock-123',
            location: 'Las Condes 123, Las Condes, Santiago',
            color: '#3B82F6',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'contract-mock-1',
            title: 'Firma contrato: Depto. en Providencia',
            description: 'Pendiente tu firma como propietario - Contrato de arriendo',
            startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // En 5 días
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hora después
            allDay: true,
            eventType: 'closing' as const,
            priority: 'high' as const,
            status: 'sent_to_signature',
            relatedEntityType: 'rental_contract' as const,
            relatedEntityId: 'mock-456',
            location: 'Providencia 456, Providencia, Santiago',
            color: '#10B981',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'deadline-mock-1',
            title: 'Plazo oferta: Casa en Vitacura',
            description: 'Oferta de Juan Pérez vence en 3 días - $150.000.000',
            startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
            endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000), // Todo el día
            allDay: true,
            eventType: 'deadline' as const,
            priority: 'urgent' as const,
            status: 'pending',
            relatedEntityType: 'property_sale_offer' as const,
            relatedEntityId: 'mock-789',
            location: 'Vitacura 789, Vitacura, Santiago',
            color: '#EF4444',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'negotiation-mock-1',
            title: 'Negociación activa: Local comercial',
            description: 'Negociación en curso con Ana López - Contraoferta pendiente',
            startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Mañana
            endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 horas después
            allDay: false,
            eventType: 'negotiation' as const,
            priority: 'normal' as const,
            status: 'en_revision',
            relatedEntityType: 'property_sale_offer' as const,
            relatedEntityId: 'mock-101',
            location: 'Centro 101, Santiago Centro',
            color: '#F97316',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        console.log('✅ Loaded mock calendar events for development');

        setState(prev => ({
          ...prev,
          events: mockEvents,
          filteredEvents: mockEvents,
          loading: false,
          error: null
        }));

        return;
      }

      if (!data || !data.events) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Transformar eventos a objetos Date
      const calendarEvents: UserCalendarEvent[] = data.events.map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      }));

      console.log(`✅ Loaded ${calendarEvents.length} calendar events from production`);

      setState(prev => ({
        ...prev,
        events: calendarEvents,
        filteredEvents: calendarEvents,
        loading: false,
        error: null
      }));

    } catch (err) {
      console.error('❌ Error loading calendar events:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar eventos';

      // Si hay error, intentar con datos mock
      console.warn('⚠️ Using fallback mock data due to error');

      const fallbackEvents: UserCalendarEvent[] = [
        {
          id: 'error-fallback-1',
          title: 'Datos de desarrollo (Edge Function no disponible)',
          description: 'La Edge Function no está desplegada. Usando datos de ejemplo.',
          startDate: new Date(),
          endDate: new Date(Date.now() + 60 * 60 * 1000),
          allDay: false,
          eventType: 'visit' as const,
          priority: 'normal' as const,
          status: 'scheduled',
          relatedEntityType: 'scheduled_visit' as const,
          relatedEntityId: 'fallback-1',
          location: 'Desarrollo Local',
          color: '#6B7280',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setState(prev => ({
        ...prev,
        events: fallbackEvents,
        filteredEvents: fallbackEvents,
        loading: false,
        error: `Modo desarrollo: ${errorMessage}`
      }));
    }
  }, [user]);

  // Aplicar filtros a los eventos
  const applyFilters = useCallback(() => {
    setState(prev => {
      let filtered = [...prev.events];

      // Filtro por tipos
      if (prev.filters.types.length > 0) {
        filtered = filtered.filter(event => prev.filters.types.includes(event.eventType));
      }

      // Filtro por prioridades
      if (prev.filters.priorities.length > 0) {
        filtered = filtered.filter(event => prev.filters.priorities.includes(event.priority));
      }

      // Filtro por rango de fechas
      if (prev.filters.dateRange) {
        const { start, end } = prev.filters.dateRange;
        filtered = filtered.filter(event =>
          event.startDate >= start && event.startDate <= end
        );
      }

      return {
        ...prev,
        filteredEvents: filtered
      };
    });
  }, []);

  // Actualizar filtros
  const setFilters = useCallback((newFilters: Partial<UserCalendarFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  // Eventos filtrados (memoized)
  const filteredEvents = useMemo(() => {
    return state.filteredEvents;
  }, [state.filteredEvents]);

  // Eventos por fecha para vista de calendario
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, UserCalendarEvent[]> = {};

    state.filteredEvents.forEach(event => {
      const date = new Date(event.startDate);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }, [state.filteredEvents]);

  // Obtener eventos para una fecha específica
  const getEventsForDate = useCallback((date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate[dateKey] || [];
  }, [eventsByDate]);

  // Obtener eventos para un rango de fechas
  const getEventsForRange = useCallback((startDate: Date, endDate: Date) => {
    return state.filteredEvents.filter(event => {
      return event.startDate >= startDate && event.startDate <= endDate;
    }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [state.filteredEvents]);

  // Obtener eventos próximos (7 días por defecto)
  const getUpcomingEvents = useCallback((days: number = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    return getEventsForRange(today, futureDate);
  }, [getEventsForRange]);

  // Obtener eventos por tipo
  const getEventsByType = useCallback((type: UserCalendarEvent['eventType']) => {
    return state.filteredEvents.filter(event => event.eventType === type);
  }, [state.filteredEvents]);

  // Estadísticas de eventos
  const eventStats = useMemo(() => {
    const total = state.events.length;
    const upcoming = getUpcomingEvents().length;
    const urgent = state.events.filter(e => e.priority === 'urgent').length;
    const today = getEventsForDate(new Date()).length;

    const byType = {
      visit: state.events.filter(e => e.eventType === 'visit').length,
      closing: state.events.filter(e => e.eventType === 'closing').length,
      deadline: state.events.filter(e => e.eventType === 'deadline').length,
      negotiation: state.events.filter(e => e.eventType === 'negotiation').length,
    };

    return {
      total,
      upcoming,
      urgent,
      today,
      byType
    };
  }, [state.events, getUpcomingEvents, getEventsForDate]);

  // Refrescar datos
  const refresh = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  // Cargar eventos inicialmente cuando el usuario cambia
  useEffect(() => {
    if (user) {
      loadEvents();
    } else {
      setState({
        events: [],
        filteredEvents: [],
        loading: false,
        error: null,
        filters: {
          types: [],
          priorities: []
        }
      });
    }
  }, [user, loadEvents]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    // Estado
    events: state.events,
    filteredEvents,
    loading: state.loading,
    error: state.error,
    filters: state.filters,

    // Utilidades
    eventsByDate,
    eventStats,

    // Acciones
    loadEvents,
    setFilters,
    refresh,

    // Métodos de consulta
    getEventsForDate,
    getEventsForRange,
    getUpcomingEvents,
    getEventsByType,
  };
};
