import { useState, useMemo, useCallback } from 'react';

export interface SearchFilters {
  searchTerm: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  status?: string[];
  type?: string[];
  priority?: string[];
  userRole?: string[];
  sortBy?: 'date_desc' | 'date_asc' | 'priority' | 'status' | 'type';
}

export interface UseAdvancedSearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFunctions?: {
    [K in keyof SearchFilters]?: (item: T, value: any) => boolean;
  };
  initialFilters?: Partial<SearchFilters>;
}

/**
 * Hook personalizado para búsqueda y filtros avanzados
 * Soporta búsqueda de texto, filtros por fecha, estado, tipo, etc.
 */
export const useAdvancedSearch = <T extends Record<string, any>>({
  data,
  searchFields,
  filterFunctions = {},
  initialFilters = {}
}: UseAdvancedSearchOptions<T>) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    sortBy: 'date_desc',
    ...initialFilters
  });

  // Función de búsqueda de texto
  const searchText = useCallback((item: T, searchTerm: string): boolean => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return searchFields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      // Manejar diferentes tipos de datos
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchLower);
      }
      if (Array.isArray(value)) {
        return value.some(v =>
          typeof v === 'string' ? v.toLowerCase().includes(searchLower) : false
        );
      }
      return false;
    });
  }, [searchFields]);

  // Función de filtro por fecha
  const filterByDate = useCallback((item: T, dateRange: { start: Date | null; end: Date | null }): boolean => {
    if (!dateRange.start && !dateRange.end) return true;

    // Buscar campo de fecha (created_at, updated_at, etc.)
    const dateFields = ['created_at', 'updated_at', 'date', 'timestamp'] as const;
    const dateField = dateFields.find(field => item[field]);

    if (!dateField) return true;

    const itemDate = new Date(item[dateField]);
    if (isNaN(itemDate.getTime())) return true;

    if (dateRange.start && itemDate < dateRange.start) return false;
    if (dateRange.end && itemDate > dateRange.end) return false;

    return true;
  }, []);

  // Función de filtro por arrays (status, type, priority, etc.)
  const filterByArray = useCallback((item: T, values: string[], field: keyof T): boolean => {
    if (!values.length) return true;

    const itemValue = item[field];
    if (Array.isArray(itemValue)) {
      return itemValue.some(val => values.includes(val));
    }
    return values.includes(String(itemValue));
  }, []);

  // Aplicar todos los filtros
  const filteredData = useMemo(() => {
    let result = data.filter(item => {
      // Filtro de búsqueda de texto
      if (!searchText(item, filters.searchTerm)) return false;

      // Filtro por fecha
      if (filters.dateRange && !filterByDate(item, filters.dateRange)) return false;

      // Filtros por arrays
      if (filters.status?.length && !filterByArray(item, filters.status, 'status')) return false;
      if (filters.type?.length && !filterByArray(item, filters.type, 'type')) return false;
      if (filters.priority?.length && !filterByArray(item, filters.priority, 'priority')) return false;
      if (filters.userRole?.length && !filterByArray(item, filters.userRole, 'userRole')) return false;

      // Filtros personalizados
      for (const [filterKey, filterFn] of Object.entries(filterFunctions)) {
        const filterValue = filters[filterKey as keyof SearchFilters];
        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          if (!filterFn(item, filterValue)) return false;
        }
      }

      return true;
    });

    // Aplicar ordenamiento
    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        switch (filters.sortBy) {
          case 'date_desc':
            const dateA = new Date(a.created_at || a.updated_at || a.date || 0);
            const dateB = new Date(b.created_at || b.updated_at || b.date || 0);
            return dateB.getTime() - dateA.getTime();

          case 'date_asc':
            const dateAscA = new Date(a.created_at || a.updated_at || a.date || 0);
            const dateAscB = new Date(b.created_at || b.updated_at || b.date || 0);
            return dateAscA.getTime() - dateAscB.getTime();

          case 'priority':
            const priorityOrder = { 'urgente': 4, 'alta': 3, 'normal': 2, 'baja': 1 };
            const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            return priorityB - priorityA;

          case 'status':
            return String(a.status || '').localeCompare(String(b.status || ''));

          case 'type':
            return String(a.type || '').localeCompare(String(b.type || ''));

          default:
            return 0;
        }
      });
    }

    return result;
  }, [data, filters, searchText, filterByDate, filterByArray, filterFunctions]);

  // Funciones para actualizar filtros
  const updateSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const updateDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, []);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      sortBy: 'date_desc',
      ...initialFilters
    });
  }, [initialFilters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.trim() !== '' ||
      (filters.dateRange?.start || filters.dateRange?.end) ||
      (filters.status?.length || 0) > 0 ||
      (filters.type?.length || 0) > 0 ||
      (filters.priority?.length || 0) > 0 ||
      (filters.userRole?.length || 0) > 0
    );
  }, [filters]);

  return {
    // Datos filtrados
    filteredData,

    // Estado de filtros
    filters,

    // Estadísticas
    totalItems: data.length,
    filteredItems: filteredData.length,
    hasActiveFilters,

    // Funciones de actualización
    updateSearchTerm,
    updateDateRange,
    updateFilter,
    clearFilters,

    // Utilidades
    isFiltered: hasActiveFilters,
    hasResults: filteredData.length > 0
  };
};



