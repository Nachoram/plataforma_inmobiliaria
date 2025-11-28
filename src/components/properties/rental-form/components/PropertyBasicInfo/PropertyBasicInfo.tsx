import React, { memo } from 'react';
import { Building, AlertCircle } from 'lucide-react';
import { PropertyBasicInfoProps, PropertyType } from '../../types';

// Datos de regiones y comunas de Chile
const CHILE_REGIONS_COMMUNES = {
  'region-metropolitana': {
    name: 'Región Metropolitana de Santiago',
    communes: [
      'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
      'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja',
      'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo',
      'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda',
      'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal',
      'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón',
      'Santiago', 'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo',
      'Colina', 'Lampa', 'Tiltil', 'San Bernardo', 'Buin', 'Calera de Tango',
      'Paine', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro',
      'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor'
    ]
  },
  'valparaiso': {
    name: 'Región de Valparaíso',
    communes: [
      'Valparaíso', 'Viña del Mar', 'Concón', 'Quintero', 'Puchuncaví',
      'Casablanca', 'Juan Fernández', 'San Antonio', 'Santo Domingo',
      'Cartagena', 'El Tabo', 'El Quisco', 'Algarrobo', 'San Felipe',
      'Llaillay', 'Putaendo', 'Santa María', 'Catemu', 'Panquehue',
      'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban',
      'La Ligua', 'Cabildo', 'Papudo', 'Zapallar', 'Petorca', 'Chincolco',
      'Hijuelas', 'La Calera', 'La Cruz', 'Limache', 'Nogales',
      'Olmué', 'Quillota'
    ]
  }
};

// Utilidad para obtener comunas disponibles
const getAvailableCommunes = (regionKey: string) => {
  return CHILE_REGIONS_COMMUNES[regionKey as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
};

/**
 * Componente PropertyBasicInfo - Información básica de la propiedad
 *
 * Responsabilidades:
 * - Tipo de propiedad con lógica condicional compleja
 * - Dirección completa (calle, número, departamento, región, comuna)
 * - Precio de arriendo y gastos comunes
 * - Descripción de la propiedad
 * - Campos específicos por tipo de propiedad (número de bodega, estacionamiento)
 */
export const PropertyBasicInfo: React.FC<PropertyBasicInfoProps> = memo(({
  data,
  onChange,
  onPropertyTypeChange,
  errors
}) => {
  // Función para manejar cambio de región
  const handleRegionChange = (regionKey: string) => {
    onChange('region', regionKey);
    onChange('commune', ''); // Limpiar comuna al cambiar región
  };

  // Función para manejar cambio de tipo de propiedad con lógica compleja
  const handlePropertyTypeChange = (newType: PropertyType) => {
    // Limpiar valores específicos según el tipo de propiedad - EXACTAMENTE como se envía a BD
    const updatedData = { ...data, tipoPropiedad: newType };

    if (newType === 'Bodega') {
      // CORREGIDO: Bodega - numeroBodega requerido, campos de bodega permitidos, limpiar campos tradicionales
      updatedData.bedrooms = '0';
      updatedData.bathrooms = '0';
      // estacionamientos se mantiene para permitir configuración de espacios
      updatedData.metrosUtiles = ''; // NULL en BD
      // metrosTotales se mantiene (M² de la Bodega)
      updatedData.tieneTerraza = 'No';
      updatedData.tieneSalaEstar = 'No';
      // campos de bodega se mantienen para permitir configuración de espacios adicionales
      updatedData.parcela_number = '';
      // numeroBodega se mantiene (requerido)

    } else if (newType === 'Estacionamiento') {
      // CORREGIDO: Estacionamiento - Mínimos campos aplicables
      updatedData.bedrooms = '0';
      updatedData.bathrooms = '0';
      updatedData.estacionamientos = '0'; // No cuenta estacionamientos para este tipo
      updatedData.metrosUtiles = ''; // NULL
      updatedData.metrosTotales = ''; // NULL
      updatedData.tieneTerraza = 'No';
      updatedData.tieneSalaEstar = 'No';
      updatedData.tieneBodega = 'No';
      updatedData.metrosBodega = '';
      updatedData.ubicacionBodega = '';
      updatedData.numeroBodega = '';
      updatedData.parcela_number = '';
      // ubicacionEstacionamiento opcional

    } else if (newType === 'Parcela') {
      // CORREGIDO: Parcela - Campos limitados
      updatedData.bedrooms = '0';
      updatedData.bathrooms = '0';
      updatedData.metrosUtiles = ''; // NULL
      // metrosTotales se mantiene (M² del terreno)
      updatedData.tieneSalaEstar = 'No';
      updatedData.tieneBodega = 'No';
      updatedData.metrosBodega = '';
      updatedData.ubicacionBodega = '';
      updatedData.numeroBodega = '';
      // parcela_number opcional, estacionamientos permitidos, terraza permitida

    } else if (newType === 'Oficina') {
      // CORREGIDO: Oficina - Campos completos más campos específicos de bodega
      updatedData.tieneTerraza = 'No'; // Oficinas generalmente no tienen terraza
      // Mantener todos los demás campos, tieneBodega/metrosBodega/ubicacionBodega condicionales

    } else {
      // Casa, Departamento - Campos tradicionales completos
      // Para Casa y Departamento, mantener campos de bodega ya que son permitidos
      // Limpiar solo parcela_number que no aplica
      updatedData.parcela_number = '';
      // Mantener tieneBodega, metrosBodega, ubicacionBodega, numeroBodega
      // Mantener bedrooms, bathrooms, estacionamientos, metrosUtiles, metrosTotales, terraza
    }

    // Aplicar todos los cambios
    Object.entries(updatedData).forEach(([key, value]) => {
      onChange(key, value);
    });

    // Notificar cambio de tipo de propiedad
    onPropertyTypeChange(newType);
  };

  const propertyType = data.tipoPropiedad;
  const isParking = propertyType === 'Estacionamiento';

  return (
    <div className="space-y-3">
      <div className="border-b pb-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Building className="h-6 w-6 mr-2 text-emerald-600" />
          Información de la Propiedad
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Tipo de Propiedad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tipo de Propiedad *
          </label>
          <select
            required
            value={data.tipoPropiedad}
            onChange={(e) => handlePropertyTypeChange(e.target.value as PropertyType)}
            className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="Casa">Casa</option>
            <option value="Departamento">Departamento</option>
            <option value="Oficina">Oficina</option>
            <option value="Estacionamiento">Estacionamiento</option>
            <option value="Bodega">Bodega</option>
            <option value="Parcela">Parcela</option>
          </select>
        </div>

        {/* Campo específico: Número de Bodega - SOLO PARA BODEGA */}
        {propertyType === 'Bodega' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">📦</span>
              Información de la Bodega
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Bodega *
              </label>
              <input
                type="text"
                value={data.numeroBodega || ''}
                onChange={(e) => onChange('numeroBodega', e.target.value)}
                placeholder="Ej: B-115 (piso -1)"
                maxLength={50}
                required={propertyType === 'Bodega'}
                className={`w-full px-3 py-2 text-sm border-2 sm:border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors?.numeroBodega ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors?.numeroBodega && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.numeroBodega}
                </p>
              )}
              <p className="mt-1.5 text-xs text-gray-600">
                Ingrese el número o ubicación específica de la bodega
              </p>
            </div>
          </div>
        )}

        {/* Calle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Calle *
          </label>
          <input
            type="text"
            required
            value={data.address_street}
            onChange={(e) => onChange('address_street', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors?.address_street ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: Av. Libertador"
          />
          {errors?.address_street && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.address_street}
            </p>
          )}
        </div>

        {/* Número */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Número *
          </label>
          <input
            type="text"
            required
            value={data.address_number}
            onChange={(e) => onChange('address_number', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors?.address_number ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: 1234"
          />
          {errors?.address_number && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.address_number}
            </p>
          )}
        </div>

        {/* Número de Estacionamiento - solo para tipo Estacionamiento */}
        {data.tipoPropiedad === 'Estacionamiento' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Estacionamiento *
            </label>
            <input
              type="text"
              required={data.tipoPropiedad === 'Estacionamiento'}
              value={data.ubicacionEstacionamiento || ''}
              onChange={(e) => onChange('ubicacionEstacionamiento', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors?.ubicacionEstacionamiento ? 'border-red-500 bg-red-50' : ''
              }`}
              placeholder="Ej: 25B"
              maxLength={16}
            />
            {errors?.ubicacionEstacionamiento && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.ubicacionEstacionamiento}
              </p>
            )}
          </div>
        )}

        {/* Departamento / Oficina - Ocultar si es Estacionamiento, Bodega o Parcela */}
        {!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela' && (
          <div className="transition-all duration-300">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Departamento / Oficina (Opcional)
            </label>
            <input
              type="text"
              value={data.address_department || ''}
              onChange={(e) => onChange('address_department', e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Ej: 45A"
            />
          </div>
        )}

        {/* Región y Comuna */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Región *
            </label>
            <select
              required
              value={data.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors?.region ? 'border-red-500 bg-red-50' : ''
              }`}
            >
              <option value="">Seleccionar región</option>
              {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                <option key={key} value={key}>{region.name}</option>
              ))}
            </select>
            {errors?.region && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.region}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comuna *
            </label>
            <select
              required
              value={data.commune}
              onChange={(e) => onChange('commune', e.target.value)}
              disabled={!data.region}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors?.commune ? 'border-red-500 bg-red-50' : ''
              }`}
            >
              <option value="">
                {data.region ? 'Seleccionar comuna' : 'Primero seleccione región'}
              </option>
              {data.region && getAvailableCommunes(data.region).map(commune => (
                <option key={commune} value={commune}>{commune}</option>
              ))}
            </select>
            {errors?.commune && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.commune}
              </p>
            )}
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Precio Arriendo (mensual) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
            <input
              type="number"
              required
              min="0"
              value={data.price}
              onChange={(e) => onChange('price', e.target.value)}
              className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors?.price ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="500000"
            />
          </div>
          {errors?.price && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.price}
            </p>
          )}
        </div>

        {/* Gastos Comunes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gastos Comunes (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
            <input
              type="number"
              min="0"
              value={data.common_expenses}
              onChange={(e) => onChange('common_expenses', e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="50000"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descripción {propertyType === 'Bodega' && '(Opcional)'}
          </label>
          <textarea
            required={propertyType !== 'Bodega'}
            rows={4}
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-vertical min-h-[80px]"
            placeholder={
              propertyType === 'Bodega'
                ? "Ej: Bodega amplia en subterráneo, acceso por ascensor, ideal para almacenamiento"
                : "Describe las características principales de la propiedad, ubicación, amenidades, etc."
            }
          />
          {errors?.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

PropertyBasicInfo.displayName = 'PropertyBasicInfo';
