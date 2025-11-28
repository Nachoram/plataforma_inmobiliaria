import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UserCalendarSection } from '../UserCalendarSection';
import { useUserCalendar } from '../../../hooks/useUserCalendar';

// Mock del hook
jest.mock('../../../hooks/useUserCalendar');

const mockUseUserCalendar = useUserCalendar as jest.MockedFunction<typeof useUserCalendar>;

describe('UserCalendarSection', () => {
  const mockEvents = [
    {
      id: 'visit-1',
      title: 'Visita: Casa en Las Condes',
      description: 'Visita programada con María González',
      startDate: new Date('2025-01-15T10:00:00'),
      endDate: new Date('2025-01-15T11:00:00'),
      allDay: false,
      eventType: 'visit' as const,
      priority: 'normal' as const,
      status: 'scheduled',
      relatedEntityType: 'scheduled_visit' as const,
      relatedEntityId: '123',
      location: 'Las Condes 123, Las Condes',
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'contract-sign-456',
      title: 'Firma contrato: Casa en Providencia',
      description: 'Pendiente tu firma como propietario',
      startDate: new Date('2025-01-20T09:00:00'),
      endDate: new Date('2025-01-20T10:00:00'),
      allDay: true,
      eventType: 'closing' as const,
      priority: 'high' as const,
      status: 'sent_to_signature',
      relatedEntityType: 'rental_contract' as const,
      relatedEntityId: '456',
      location: 'Providencia 456, Providencia',
      color: '#10B981',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    mockUseUserCalendar.mockReturnValue({
      events: mockEvents,
      filteredEvents: mockEvents,
      loading: false,
      error: null,
      filters: { types: [], priorities: [] },
      eventStats: {
        total: 2,
        upcoming: 2,
        urgent: 0,
        today: 0,
        byType: { visit: 1, closing: 1, deadline: 0, negotiation: 0 }
      },
      loadEvents: jest.fn(),
      setFilters: jest.fn(),
      refresh: jest.fn(),
      getEventsForDate: jest.fn((date) => mockEvents.filter(event =>
        event.startDate.toDateString() === date.toDateString()
      )),
      getEventsForRange: jest.fn(),
      getUpcomingEvents: jest.fn(() => mockEvents),
      getEventsByType: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders calendar section with header', () => {
    render(<UserCalendarSection />);

    expect(screen.getByText('Mi Calendario')).toBeInTheDocument();
    expect(screen.getByText('Visitas, firmas y plazos importantes')).toBeInTheDocument();
  });

  test('displays event statistics', () => {
    render(<UserCalendarSection />);

    expect(screen.getByText('1')).toBeInTheDocument(); // Visitas
    expect(screen.getByText('1')).toBeInTheDocument(); // Firmas
    expect(screen.getByText('2')).toBeInTheDocument(); // Total
  });

  test('shows loading state', () => {
    mockUseUserCalendar.mockReturnValue({
      ...mockUseUserCalendar(),
      loading: true,
      events: []
    });

    render(<UserCalendarSection />);

    expect(screen.getByText('Cargando calendario...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    mockUseUserCalendar.mockReturnValue({
      ...mockUseUserCalendar(),
      loading: false,
      error: 'Error al cargar eventos'
    });

    render(<UserCalendarSection />);

    expect(screen.getByText('Error al cargar el calendario')).toBeInTheDocument();
    expect(screen.getByText('Error al cargar eventos')).toBeInTheDocument();
  });

  test('renders filter button', () => {
    render(<UserCalendarSection />);

    const filterButton = screen.getByText('Filtros');
    expect(filterButton).toBeInTheDocument();
  });

  test('renders refresh button', () => {
    render(<UserCalendarSection />);

    const refreshButton = screen.getByText('Actualizar');
    expect(refreshButton).toBeInTheDocument();
  });

  test('displays legend', () => {
    render(<UserCalendarSection />);

    expect(screen.getByText('Visitas agendadas')).toBeInTheDocument();
    expect(screen.getByText('Firmas de contratos')).toBeInTheDocument();
    expect(screen.getByText('Plazos importantes')).toBeInTheDocument();
    expect(screen.getByText('Negociaciones')).toBeInTheDocument();
  });

  test('shows upcoming events section', () => {
    render(<UserCalendarSection />);

    expect(screen.getByText('Próximos 7 días')).toBeInTheDocument();
  });
});

