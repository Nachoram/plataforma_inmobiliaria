import { renderHook, act } from '@testing-library/react';
import { useAdvancedSearch } from '../useAdvancedSearch';

interface MockItem {
  id: string;
  name: string;
  type: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

describe('useAdvancedSearch', () => {
  const mockData: MockItem[] = [
    {
      id: '1',
      name: 'Task 1',
      type: 'bug',
      status: 'open',
      priority: 'high',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Task 2',
      type: 'feature',
      status: 'closed',
      priority: 'low',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      name: 'Task 3',
      type: 'bug',
      status: 'open',
      priority: 'medium',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ];

  const searchFields: (keyof MockItem)[] = ['name', 'type'];

  it('should return all items when no filters applied', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    expect(result.current.filteredData).toHaveLength(3);
    expect(result.current.totalItems).toBe(3);
    expect(result.current.filteredItems).toBe(3);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should filter by search term', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateSearchTerm('Task 1');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].id).toBe('1');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should filter by status', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateFilter('status', ['open']);
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.every(item => item.status === 'open')).toBe(true);
  });

  it('should filter by type', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateFilter('type', ['bug']);
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.every(item => item.type === 'bug')).toBe(true);
  });

  it('should filter by priority', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateFilter('priority', ['high', 'low']);
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.some(item => item.priority === 'high')).toBe(true);
    expect(result.current.filteredData.some(item => item.priority === 'low')).toBe(true);
  });

  it('should combine multiple filters', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateSearchTerm('Task');
      result.current.updateFilter('status', ['open']);
      result.current.updateFilter('type', ['bug']);
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.every(item => item.status === 'open')).toBe(true);
    expect(result.current.filteredData.every(item => item.type === 'bug')).toBe(true);
  });

  it('should sort by date descending by default', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    expect(result.current.filteredData[0].id).toBe('3'); // Más reciente primero
    expect(result.current.filteredData[2].id).toBe('1'); // Más antiguo último
  });

  it('should sort by date ascending', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateFilter('sortBy', 'date_asc');
    });

    expect(result.current.filteredData[0].id).toBe('1'); // Más antiguo primero
    expect(result.current.filteredData[2].id).toBe('3'); // Más reciente último
  });

  it('should sort by priority', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateFilter('sortBy', 'priority');
    });

    expect(result.current.filteredData[0].priority).toBe('high');
    expect(result.current.filteredData[1].priority).toBe('medium');
    expect(result.current.filteredData[2].priority).toBe('low');
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    act(() => {
      result.current.updateSearchTerm('Task 1');
      result.current.updateFilter('status', ['open']);
    });

    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.filteredItems).toBe(1);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredItems).toBe(3);
    expect(result.current.filters.searchTerm).toBe('');
  });

  it('should handle date range filtering', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    const startDate = new Date('2024-01-02T00:00:00Z');
    const endDate = new Date('2024-01-03T00:00:00Z');

    act(() => {
      result.current.updateDateRange(startDate, endDate);
    });

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.some(item => item.id === '2')).toBe(true);
    expect(result.current.filteredData.some(item => item.id === '3')).toBe(true);
  });

  it('should handle custom filter functions', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields,
        filterFunctions: {
          customFilter: (item) => item.name.includes('Task')
        }
      })
    );

    act(() => {
      result.current.updateFilter('customFilter', true);
    });

    expect(result.current.filteredData).toHaveLength(3);
  });

  it('should return correct statistics', () => {
    const { result } = renderHook(() =>
      useAdvancedSearch({
        data: mockData,
        searchFields
      })
    );

    expect(result.current.totalItems).toBe(3);
    expect(result.current.filteredItems).toBe(3);
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.hasResults).toBe(true);

    act(() => {
      result.current.updateSearchTerm('nonexistent');
    });

    expect(result.current.filteredItems).toBe(0);
    expect(result.current.isFiltered).toBe(true);
    expect(result.current.hasResults).toBe(false);
  });
});



