import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  X,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { SearchFilters } from '../../hooks/useAdvancedSearch';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onUpdateSearchTerm: (term: string) => void;
  onUpdateDateRange: (start: Date | null, end: Date | null) => void;
  onUpdateFilter: (key: keyof SearchFilters, value: any) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalItems: number;
  filteredItems: number;

  // Configuración de filtros disponibles
  availableFilters?: {
    status?: { label: string; value: string; color: string }[];
    type?: { label: string; value: string; color: string }[];
    priority?: { label: string; value: string; color: string }[];
    userRole?: { label: string; value: string; color: string }[];
  };

  // Configuración de ordenamiento
  sortOptions?: { label: string; value: SearchFilters['sortBy'] }[];

  placeholder?: string;
  className?: string;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onUpdateSearchTerm,
  onUpdateDateRange,
  onUpdateFilter,
  onClearFilters,
  hasActiveFilters,
  totalItems,
  filteredItems,
  availableFilters = {},
  sortOptions = [
    { label: 'Más recientes', value: 'date_desc' },
    { label: 'Más antiguos', value: 'date_asc' },
    { label: 'Por prioridad', value: 'priority' },
    { label: 'Por estado', value: 'status' },
    { label: 'Por tipo', value: 'type' }
  ],
  placeholder = 'Buscar...',
  className = ''
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateInputs, setDateInputs] = useState({
    start: filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : '',
    end: filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : ''
  });

  // Manejar cambios en inputs de fecha
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setDateInputs(prev => ({ ...prev, [type]: value }));

    const date = value ? new Date(value) : null;
    if (type === 'start') {
      onUpdateDateRange(date, filters.dateRange?.end || null);
    } else {
      onUpdateDateRange(filters.dateRange?.start || null, date);
    }
  };

  // Toggle para filtros de array
  const toggleArrayFilter = (filterKey: keyof SearchFilters, value: string) => {
    const currentValues = (filters[filterKey] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    onUpdateFilter(filterKey, newValues);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={placeholder}
            value={filters.searchTerm}
            onChange={(e) => onUpdateSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Botón de filtros avanzados */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            showAdvancedFilters || hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {[
                filters.searchTerm && 1,
                filters.dateRange?.start && 1,
                filters.dateRange?.end && 1,
                filters.status?.length || 0,
                filters.type?.length || 0,
                filters.priority?.length || 0,
                filters.userRole?.length || 0
              ].reduce((acc, curr) => acc + (curr || 0), 0)}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Selector de ordenamiento */}
        <div className="relative">
          <select
            value={filters.sortBy || 'date_desc'}
            onChange={(e) => onUpdateFilter('sortBy', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SortDesc className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="text-sm text-gray-600">
        {hasActiveFilters ? (
          <>
            Mostrando {filteredItems} de {totalItems} elementos
            <button
              onClick={onClearFilters}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Limpiar filtros
            </button>
          </>
        ) : (
          <>Total: {totalItems} elementos</>
        )}
      </div>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por fecha */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="inline h-4 w-4 mr-1" />
                Rango de fechas
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateInputs.start}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Desde"
                />
                <input
                  type="date"
                  value={dateInputs.end}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hasta"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            {availableFilters.status && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <div className="flex flex-wrap gap-1">
                  {availableFilters.status.map(status => (
                    <button
                      key={status.value}
                      onClick={() => toggleArrayFilter('status', status.value)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.status?.includes(status.value)
                          ? status.color + ' border-transparent'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por tipo */}
            {availableFilters.type && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <div className="flex flex-wrap gap-1">
                  {availableFilters.type.map(type => (
                    <button
                      key={type.value}
                      onClick={() => toggleArrayFilter('type', type.value)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.type?.includes(type.value)
                          ? type.color + ' border-transparent'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por prioridad */}
            {availableFilters.priority && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <div className="flex flex-wrap gap-1">
                  {availableFilters.priority.map(priority => (
                    <button
                      key={priority.value}
                      onClick={() => toggleArrayFilter('priority', priority.value)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.priority?.includes(priority.value)
                          ? priority.color + ' border-transparent'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por rol de usuario */}
            {availableFilters.userRole && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <div className="flex flex-wrap gap-1">
                  {availableFilters.userRole.map(role => (
                    <button
                      key={role.value}
                      onClick={() => toggleArrayFilter('userRole', role.value)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.userRole?.includes(role.value)
                          ? role.color + ' border-transparent'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
