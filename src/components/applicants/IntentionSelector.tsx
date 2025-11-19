import React from 'react';
import { Home, Building2, FileText, Shield } from 'lucide-react';
import { IntentionType } from './types';

interface IntentionSelectorProps {
  value: IntentionType;
  onChange: (intention: IntentionType) => void;
}

const IntentionSelector: React.FC<IntentionSelectorProps> = ({
  value,
  onChange
}) => {
  const intentions = [
    {
      id: 'rent' as IntentionType,
      label: 'Buscar Arriendo',
      shortLabel: 'Arriendo',
      icon: Home,
      color: 'blue',
      description: 'Estoy buscando propiedades para arrendar',
      documents: [
        'Cédula de Identidad',
        'Comprobante de ingresos',
        'Extracto bancario',
        'Certificado de antigüedad laboral',
        'Información del garante (si aplica)'
      ]
    },
    {
      id: 'buy' as IntentionType,
      label: 'Buscar Compra',
      shortLabel: 'Compra',
      icon: Building2,
      color: 'green',
      description: 'Estoy buscando propiedades para comprar',
      documents: [
        'Cédula de Identidad',
        'Comprobante de ingresos',
        'Extracto bancario',
        'Certificado de antigüedad laboral',
        'Información financiera adicional'
      ]
    }
  ];

  const selectedIntention = intentions.find(i => i.id === value);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        ¿Qué tipo de operación buscas realizar?
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Selecciona tu intención principal para que podamos adaptar el proceso y documentos requeridos
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {intentions.map((intention) => {
          const Icon = intention.icon;
          const isSelected = value === intention.id;

          return (
            <div
              key={intention.id}
              onClick={() => onChange(intention.id)}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? `border-${intention.color}-500 bg-${intention.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? `border-${intention.color}-500 bg-${intention.color}-500`
                    : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 text-${intention.color}-600 mr-2`} />
                    <h4 className="text-base font-medium text-gray-900">
                      {intention.label}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {intention.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Documentos requeridos según la selección */}
      {selectedIntention && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <FileText className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="text-base font-medium text-gray-900">
              Documentos que deberás proporcionar para {selectedIntention.shortLabel.toLowerCase()}
            </h4>
          </div>
          <ul className="space-y-2">
            {selectedIntention.documents.map((document, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <Shield className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                {document}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            * Los documentos específicos pueden variar según la propiedad y requisitos del propietario
          </p>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-900 mb-2">
          Información importante
        </h5>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            <strong>Arriendo:</strong> Generalmente requiere garante y comprobante de ingresos estables.
          </p>
          <p>
            <strong>Compra:</strong> Puede requerir financiamiento y evaluación crediticia más detallada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntentionSelector;




