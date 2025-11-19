import React, { useState, useEffect } from 'react';
import { Archive, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomButton } from '../common';

export interface StorageSpace {
  id: string;
  number: string;
  size_m2: number;
  location: string;
  description?: string;
}

interface StorageSpaceFormProps {
  storageSpaces: StorageSpace[];
  onChange: (storageSpaces: StorageSpace[]) => void;
  maxSpaces?: number;
  propertyId?: string;
  className?: string;
}

export const StorageSpaceForm: React.FC<StorageSpaceFormProps> = ({
  storageSpaces,
  onChange,
  maxSpaces = 10,
  propertyId,
  className = ''
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const commonLocations = [
    'Subsuelo',
    'Primer piso',
    'Segundo piso',
    'Tercer piso',
    'Ático',
    'Garaje',
    'Exterior',
    'Sótano'
  ];

  const addStorageSpace = () => {
    if (storageSpaces.length >= maxSpaces) {
      setErrors({ general: `Máximo ${maxSpaces} espacios de bodega permitidos` });
      return;
    }

    const newSpace: StorageSpace = {
      id: `storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      number: '',
      size_m2: 0,
      location: '',
      description: ''
    };

    onChange([...storageSpaces, newSpace]);
    setErrors({});
  };

  const removeStorageSpace = (id: string) => {
    const updatedSpaces = storageSpaces.filter(space => space.id !== id);
    onChange(updatedSpaces);
    setErrors({});
  };

  const updateStorageSpace = (id: string, updates: Partial<StorageSpace>) => {
    const updatedSpaces = storageSpaces.map(space =>
      space.id === id ? { ...space, ...updates } : space
    );
    onChange(updatedSpaces);

    // Clear specific error for this space
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const validateStorageSpace = (space: StorageSpace): string | null => {
    if (!space.number.trim()) {
      return 'El número de la bodega es requerido';
    }

    // Check for duplicate numbers
    const duplicates = storageSpaces.filter(s =>
      s.id !== space.id && s.number.trim() === space.number.trim()
    );

    if (duplicates.length > 0) {
      return 'Este número de bodega ya está en uso';
    }

    if (!space.location.trim()) {
      return 'La ubicación es requerida';
    }

    if (space.size_m2 <= 0) {
      return 'El tamaño debe ser mayor a 0 m²';
    }

    return null;
  };

  const validateAllSpaces = () => {
    const newErrors: Record<string, string> = {};

    storageSpaces.forEach(space => {
      const error = validateStorageSpace(space);
      if (error) {
        newErrors[space.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate on change
  useEffect(() => {
    validateAllSpaces();
  }, [storageSpaces]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Archive className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Espacios de Bodega
            </h3>
            <p className="text-sm text-gray-600">
              {storageSpaces.length} de {maxSpaces} bodegas configuradas
            </p>
          </div>
        </div>

        <CustomButton
          onClick={addStorageSpace}
          disabled={storageSpaces.length >= maxSpaces}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Bodega
        </CustomButton>
      </div>

      {/* Storage Spaces List */}
      {storageSpaces.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay espacios de bodega
          </h3>
          <p className="text-gray-600 mb-4">
            Agrega espacios de bodega para esta propiedad
          </p>
          <CustomButton onClick={addStorageSpace}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primera Bodega
          </CustomButton>
        </div>
      ) : (
        <div className="space-y-4">
          {storageSpaces.map((space, index) => (
            <div
              key={space.id}
              className={`border rounded-lg p-4 ${
                errors[space.id] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Space Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <Archive className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    Bodega #{index + 1}
                  </h4>
                  {space.number && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      #{space.number}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeStorageSpace(space.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remover bodega"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Error Message */}
              {errors[space.id] && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <p className="text-sm text-red-800">{errors[space.id]}</p>
                  </div>
                </div>
              )}

              {/* Space Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Storage Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Bodega *
                  </label>
                  <input
                    type="text"
                    value={space.number}
                    onChange={(e) => updateStorageSpace(space.id, { number: e.target.value })}
                    placeholder="Ej: B-01, 101, S1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors[space.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identificador único del espacio de bodega
                  </p>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño (m²) *
                  </label>
                  <input
                    type="number"
                    value={space.size_m2 || ''}
                    onChange={(e) => updateStorageSpace(space.id, {
                      size_m2: parseFloat(e.target.value) || 0
                    })}
                    placeholder="Ej: 5.5"
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors[space.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Superficie en metros cuadrados
                  </p>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={space.location}
                      onChange={(e) => updateStorageSpace(space.id, { location: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors[space.id] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar ubicación</option>
                      {commonLocations.map(location => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="O especificar ubicación personalizada..."
                      value={space.location && !commonLocations.includes(space.location) ? space.location : ''}
                      onChange={(e) => updateStorageSpace(space.id, { location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={space.description || ''}
                    onChange={(e) => updateStorageSpace(space.id, { description: e.target.value })}
                    placeholder="Describe las características de la bodega..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Información adicional sobre la bodega
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {storageSpaces.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Resumen de Bodegas</h4>
              <p className="text-sm text-gray-600 mt-1">
                {storageSpaces.length} bodega{storageSpaces.length !== 1 ? 's' : ''} configurada{storageSpaces.length !== 1 ? 's' : ''}
                {storageSpaces.length > 0 && (
                  <span> • Total: {storageSpaces.reduce((sum, space) => sum + space.size_m2, 0).toFixed(1)} m²</span>
                )}
              </p>
            </div>

            {hasErrors ? (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Errores pendientes</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Configuración completa</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageSpaceForm;






