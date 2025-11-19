import React, { useState } from 'react';
import { User, Building, AlertCircle } from 'lucide-react';
import { BrokerType } from './types';

interface BrokerTypeSelectorProps {
  value: BrokerType;
  firmName?: string;
  onChange: (brokerType: BrokerType, firmName?: string) => void;
  error?: string;
}

const BrokerTypeSelector: React.FC<BrokerTypeSelectorProps> = ({
  value,
  firmName = '',
  onChange,
  error
}) => {
  const [localFirmName, setLocalFirmName] = useState(firmName);

  const handleBrokerTypeChange = (brokerType: BrokerType) => {
    onChange(brokerType, brokerType === 'firm' ? localFirmName : '');
  };

  const handleFirmNameChange = (name: string) => {
    setLocalFirmName(name);
    if (value === 'firm') {
      onChange('firm', name);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tipo de Broker
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Selecciona si eres un broker independiente o perteneces a una empresa
      </p>

      <div className="space-y-4">
        {/* Opción: Broker Independiente */}
        <div
          onClick={() => handleBrokerTypeChange('independent')}
          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
            value === 'independent'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              value === 'independent'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {value === 'independent' && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="text-base font-medium text-gray-900">
                  Broker Independiente
                </h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Trabajo de forma independiente sin representar a una empresa específica.
              </p>
            </div>
          </div>
        </div>

        {/* Opción: Broker de Empresa */}
        <div
          onClick={() => handleBrokerTypeChange('firm')}
          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
            value === 'firm'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              value === 'firm'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {value === 'firm' && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-base font-medium text-gray-900">
                  Broker de Empresa
                </h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Represento a una empresa inmobiliaria o agencia.
              </p>

              {/* Campo adicional para nombre de empresa */}
              {value === 'firm' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    value={localFirmName}
                    onChange={(e) => handleFirmNameChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Evitar que se deseleccione la opción
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      error ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Inmobiliaria ABC SpA"
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el nombre completo de la empresa que representas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">
          ¿Por qué es importante esta información?
        </h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ayuda a los propietarios a identificar tu rol profesional</li>
          <li>• Permite mostrar credenciales apropiadas según tu tipo</li>
          <li>• Facilita la comunicación y negociación de acuerdos</li>
        </ul>
      </div>
    </div>
  );
};

export default BrokerTypeSelector;





