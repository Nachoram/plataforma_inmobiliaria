import React, { useState, useEffect } from 'react';
import { Car, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomButton } from '../common';

export interface ParkingSpace {
  id: string;
  number: string;
  type: 'techado' | 'descubierto' | 'combo';
  location: string;
  additionalCost?: number;
}

interface ParkingSpaceFormProps {
  parkingSpaces: ParkingSpace[];
  onChange: (parkingSpaces: ParkingSpace[]) => void;
  maxSpaces?: number;
  propertyId?: string;
  className?: string;
}

export const ParkingSpaceForm: React.FC<ParkingSpaceFormProps> = ({
  parkingSpaces,
  onChange,
  maxSpaces = 10,
  propertyId,
  className = ''
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parkingTypes = [
    { value: 'techado', label: 'Techado', description: 'Estacionamiento cubierto' },
    { value: 'descubierto', label: 'Descubierto', description: 'Estacionamiento al aire libre' },
    { value: 'combo', label: 'Combo', description: 'Opción techado o descubierto' }
  ];

  const commonLocations = [
    'Subsuelo',
    'Primer piso',
    'Segundo piso',
    'Tercer piso',
    'Exterior delantero',
    'Exterior trasero',
    'Garaje individual',
    'Garaje compartido'
  ];

  const addParkingSpace = () => {
    if (parkingSpaces.length >= maxSpaces) {
      setErrors({ general: `Máximo ${maxSpaces} espacios de estacionamiento permitidos` });
      return;
    }

    const newSpace: ParkingSpace = {
      id: `parking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      number: '',
      type: 'descubierto',
      location: '',
      additionalCost: undefined
    };

    onChange([...parkingSpaces, newSpace]);
    setErrors({});
  };

  const removeParkingSpace = (id: string) => {
    const updatedSpaces = parkingSpaces.filter(space => space.id !== id);
    onChange(updatedSpaces);
    setErrors({});
  };

  const updateParkingSpace = (id: string, updates: Partial<ParkingSpace>) => {
    const updatedSpaces = parkingSpaces.map(space =>
      space.id === id ? { ...space, ...updates } : space
    );
    onChange(updatedSpaces);

    // Clear specific error for this space
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const validateParkingSpace = (space: ParkingSpace): string | null => {
    if (!space.number.trim()) {
      return 'El número del espacio es requerido';
    }

    // Check for duplicate numbers
    const duplicates = parkingSpaces.filter(s =>
      s.id !== space.id && s.number.trim() === space.number.trim()
    );

    if (duplicates.length > 0) {
      return 'Este número de espacio ya está en uso';
    }

    if (!space.location.trim()) {
      return 'La ubicación es requerida';
    }

    if (space.additionalCost !== undefined && space.additionalCost < 0) {
      return 'El costo adicional no puede ser negativo';
    }

    return null;
  };

  const validateAllSpaces = () => {
    const newErrors: Record<string, string> = {};

    parkingSpaces.forEach(space => {
      const error = validateParkingSpace(space);
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
  }, [parkingSpaces]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Car className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Espacios de Estacionamiento
            </h3>
            <p className="text-sm text-gray-600">
              {parkingSpaces.length} de {maxSpaces} espacios configurados
            </p>
          </div>
        </div>

        <CustomButton
          onClick={addParkingSpace}
          disabled={parkingSpaces.length >= maxSpaces}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Espacio
        </CustomButton>
      </div>

      {/* Parking Spaces List */}
      {parkingSpaces.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay espacios de estacionamiento
          </h3>
          <p className="text-gray-600 mb-4">
            Agrega espacios de estacionamiento para esta propiedad
          </p>
          <CustomButton onClick={addParkingSpace}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Espacio
          </CustomButton>
        </div>
      ) : (
        <div className="space-y-4">
          {parkingSpaces.map((space, index) => (
            <div
              key={space.id}
              className={`border rounded-lg p-4 ${
                errors[space.id] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Space Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <Car className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    Espacio #{index + 1}
                  </h4>
                  {space.number && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      #{space.number}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeParkingSpace(space.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remover espacio"
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
                {/* Space Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número del Espacio *
                  </label>
                  <input
                    type="text"
                    value={space.number}
                    onChange={(e) => updateParkingSpace(space.id, { number: e.target.value })}
                    placeholder="Ej: A-01, 101, S1"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors[space.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identificador único del espacio de estacionamiento
                  </p>
                </div>

                {/* Space Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Estacionamiento
                  </label>
                  <select
                    value={space.type}
                    onChange={(e) => updateParkingSpace(space.id, { type: e.target.value as ParkingSpace['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {parkingTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={space.location}
                      onChange={(e) => updateParkingSpace(space.id, { location: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                      onChange={(e) => updateParkingSpace(space.id, { location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Additional Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Adicional (CLP)
                  </label>
                  <input
                    type="number"
                    value={space.additionalCost || ''}
                    onChange={(e) => updateParkingSpace(space.id, {
                      additionalCost: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Costo extra por usar este espacio (opcional)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {parkingSpaces.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Resumen de Estacionamientos</h4>
              <p className="text-sm text-gray-600 mt-1">
                {parkingSpaces.filter(s => s.type === 'techado').length} techados, {' '}
                {parkingSpaces.filter(s => s.type === 'descubierto').length} descubiertos, {' '}
                {parkingSpaces.filter(s => s.type === 'combo').length} combos
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

export default ParkingSpaceForm;



