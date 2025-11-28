import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserCalendar } from '../useUserCalendar';

// Mock de supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

// Mock de useAuth
jest.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

import { supabase } from '../../lib/supabase';

const mockSupabase = supabase as any;

describe('useUserCalendar', () => {
  const mockEvents = [
    {
      id: 'visit-1',
      title: 'Visita: Casa en Las Condes',
      description: 'Visita programada con María González',
      startDate: '2025-01-15T10:00:00.000Z',
      endDate: '2025-01-15T11:00:00.000Z',
      allDay: false,
      eventType: 'visit',
      priority: 'normal',
      status: 'scheduled',
      relatedEntityType: 'scheduled_visit',
      relatedEntityId: '123',
      location: 'Las Condes 123, Las Condes',
      color: '#3B82F6',
      createdAt: '2025-01-10T09:00:00.000Z',
      updatedAt: '2025-01-10T09:00:00.000Z'
    }
  ];

  beforeEach(() => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { events: mockEvents },
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('loads events on mount', async () => {
    const { result } = renderHook(() => useUserCalendar());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    expect(result.current.events[0].title).toBe('Visita: Casa en Las Condes');
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('get-user-calendar-events', {
      body: {},
      headers: { 'Content-Type': 'application/json' }
    });
  });

  test('handles loading state', () => {
    const { result } = renderHook(() => useUserCalendar());

    expect(result.current.loading).toBe(true);
  });

  test('handles error state', async () => {
    mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserCalendar());

    await waitFor(() => {
      expect(result.current.error).toBe('Error desconocido al cargar eventos');
    });

    expect(result.current.loading).toBe(false);
  });

  test('refreshes events', async () => {
    const { result } = renderHook(() => useUserCalendar());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    act(() => {
      result.current.refresh();
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
  });

  test('applies type filters', async () => {
    const { result } = renderHook(() => useUserCalendar());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    act(() => {
      result.current.setFilters({ types: ['visit'] });
    });

    expect(result.current.filters.types).toEqual(['visit']);
  });

  test('applies priority filters', async () => {
    const { result } = renderHook(() => useUserCalendar());

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    act(() => {
      result.current.setFilters({ priorities: ['high', 'urgent'] });
    });

    expect(result.current.filters.priorities).toEqual(['high', 'urgent']);
  });

  test('calculates event statistics', async () => {
    const { result } = renderHook(() => useUserCalendar());

    await waitFor(() => {
      expect(result.current.eventStats.total).toBe(1);
      expect(result.current.eventStats.byType.visit).toBe(1);
      expect(result.current.eventStats.byType.closing).toBe(0);
    });
  });

  test('returns no events when user is null', () => {
    // Mock useAuth to return null user
    jest.doMock('../useAuth', () => ({
      useAuth: () => ({ user: null })
    }));

    const { result } = renderHook(() => useUserCalendar());

    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
