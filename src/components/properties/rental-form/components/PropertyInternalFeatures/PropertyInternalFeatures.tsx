import React, { memo } from 'react';
import { Building, Car, Archive } from 'lucide-react';
import { PropertyInternalFeaturesProps } from '../../types';
import ParkingSpaceForm from '../../../ParkingSpaceForm';
import StorageSpaceForm from '../../../StorageSpaceForm';

/**
 * Componente PropertyInternalFeatures - Características internas y espacios de la propiedad
 *
 * Responsabilidades:
 * - Características básicas (agua caliente, cocina, sala de estar) - Solo para Casa/Departamento
 * - Espacios adicionales (estacionamientos y bodegas) - Para Casa/Departamento/Oficina
 * - Gestión de estado condicional según tipo de propiedad
 */
export const PropertyInternalFeatures: React.FC<PropertyInternalFeaturesProps> = memo(({
  data,
  onChange,
  propertyType,
  showSection,
  errors
}) => {
  if (!showSection) {
    return null;
  }

  // Determinar si mostrar secciones específicas
  const showBasicFeatures = ['Casa', 'Departamento'].includes(propertyType);
  const showSpacesSection = ['Casa', 'Departamento', 'Oficina'].includes(propertyType);

  return (
    <div className="space-y-6">
      {/* Sección 2: Características Internas - Solo para Casa y Departamento */}
      {showBasicFeatures && (
        <div className="space-y-3">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900">Características Internas</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Sistema de Agua Caliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agua Caliente
              </label>
              <select
                value={data.sistemaAguaCaliente}
                onChange={(e) => onChange('sistemaAguaCaliente', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="Calefón">Calefón</option>
                <option value="Termo Eléctrico">Termo Eléctrico</option>
                <option value="Caldera Central">Caldera Central</option>
              </select>
            </div>

            {/* Tipo de Cocina */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Cocina
              </label>
              <select
                value={data.tipoCocina}
                onChange={(e) => onChange('tipoCocina', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="Cerrada">Cerrada</option>
                <option value="Americana">Americana</option>
                <option value="Integrada">Integrada</option>
              </select>
            </div>

            {/* Sala de Estar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Cuenta con Sala de Estar?
              </label>
              <select
                value={data.tieneSalaEstar}
                onChange={(e) => onChange('tieneSalaEstar', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sección 2.5: Espacios de la Propiedad - Para Casa, Departamento y Oficina */}
      {showSpacesSection && (
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Building className="h-6 w-6 mr-2 text-indigo-600" />
              Espacios de la Propiedad
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configura estacionamientos y espacios de almacenamiento disponibles
            </p>
          </div>

          {/* Sub-sección: Estacionamientos */}
          <div className="space-y-3">
            <div className="border-b pb-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Car className="h-5 w-5 mr-2 text-blue-600" />
                Estacionamientos
              </h3>
              <p className="text-sm text-gray-600">
                Configura los espacios de estacionamiento disponibles
              </p>
            </div>

            <ParkingSpaceForm
              parkingSpaces={data.parkingSpaces || []}
              onChange={(parkingSpaces) => onChange('parkingSpaces', parkingSpaces)}
              propertyId={undefined} // Se setea desde el padre según el contexto
              maxSpaces={10}
            />
          </div>

          {/* Sub-sección: Espacios de Almacenamiento */}
          <div className="space-y-3">
            <div className="border-b pb-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Archive className="h-5 w-5 mr-2 text-amber-600" />
                Espacios de Almacenamiento
              </h3>
              <p className="text-sm text-gray-600">
                Configura bodegas y espacios de almacenamiento disponibles
              </p>
            </div>

            <StorageSpaceForm
              storageSpaces={data.storageSpaces || []}
              onChange={(storageSpaces) => onChange('storageSpaces', storageSpaces)}
              propertyId={undefined} // Se setea desde el padre según el contexto
              maxSpaces={5}
            />
          </div>
        </div>
      )}

      {/* Mostrar errores si existen */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Errores en características:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {field}: {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

PropertyInternalFeatures.displayName = 'PropertyInternalFeatures';
