import React, { useState } from 'react';
import { useFeatureFlags } from '../providers/FeatureFlagsProvider';
import { Settings, ToggleLeft, ToggleRight, RefreshCw, Save, AlertTriangle } from 'lucide-react';

interface FeatureFlagInfo {
  key: string;
  name: string;
  description: string;
  category: 'ui' | 'performance' | 'features';
  risk: 'low' | 'medium' | 'high';
  impact: string;
}

const featureFlagsInfo: FeatureFlagInfo[] = [
  {
    key: 'offer_details_refactor',
    name: 'Refactor OfferDetailsPanel',
    description: 'Activa la nueva arquitectura avanzada del panel de detalles de ofertas con cache inteligente, lazy loading y mejor UX',
    category: 'ui',
    risk: 'medium',
    impact: 'Mejora significativa en performance y UX del panel de ofertas'
  },
  {
    key: 'advanced_cache',
    name: 'Cache Avanzado',
    description: 'Sistema de cache inteligente con TTL y LRU eviction para optimizar carga de datos',
    category: 'performance',
    risk: 'low',
    impact: 'Reducción de ~80% en llamadas API y mejora en tiempos de carga'
  },
  {
    key: 'performance_monitoring',
    name: 'Monitoreo de Performance',
    description: 'Métricas detalladas de carga, cache hit rate y acciones del usuario',
    category: 'performance',
    risk: 'low',
    impact: 'Mejor visibilidad de performance y optimización continua'
  },
  {
    key: 'toast_notifications',
    name: 'Notificaciones Toast',
    description: 'Sistema de notificaciones contextuales para feedback de usuario',
    category: 'ui',
    risk: 'low',
    impact: 'Mejor experiencia de usuario con feedback visual'
  }
];

export const FeatureFlagsAdmin: React.FC = () => {
  const { flags, isEnabled, toggleFlag, resetFlags, saveFlagsToStorage } = useFeatureFlags();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ui': return 'text-blue-600 bg-blue-100';
      case 'performance': return 'text-purple-600 bg-purple-100';
      case 'features': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Administración de Feature Flags</h1>
                <p className="text-blue-100 mt-1">
                  Controla las funcionalidades experimentales y mejoras de la plataforma
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfirmReset(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2 inline" />
                Reset All
              </button>
              <button
                onClick={saveFlagsToStorage}
                className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Warning Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">Importante</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Los cambios en los feature flags se aplican inmediatamente. Asegúrate de probar
                    las funcionalidades antes de activarlas en producción.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Flags List */}
            <div className="space-y-4">
              {featureFlagsInfo.map((flagInfo) => {
                const isActive = isEnabled(flagInfo.key as any);

                return (
                  <div key={flagInfo.key} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {flagInfo.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(flagInfo.category)}`}>
                            {flagInfo.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(flagInfo.risk)}`}>
                            {flagInfo.risk} risk
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3">
                          {flagInfo.description}
                        </p>

                        <div className="text-sm text-gray-500">
                          <strong>Impacto esperado:</strong> {flagInfo.impact}
                        </div>
                      </div>

                      <div className="ml-6">
                        <button
                          onClick={() => toggleFlag(flagInfo.key as any)}
                          className={`relative inline-flex h-10 w-18 items-center rounded-full transition-colors ${
                            isActive ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className="sr-only">
                            {isActive ? 'Desactivar' : 'Activar'} {flagInfo.name}
                          </span>
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${
                              isActive ? 'translate-x-9' : 'translate-x-1'
                            }`}
                          />
                          <span className="absolute left-1 text-xs font-medium text-gray-600">
                            OFF
                          </span>
                          <span className="absolute right-1 text-xs font-medium text-white">
                            ON
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-4 flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Estado Actual</h3>
              <p className="text-sm text-gray-600">
                {Object.values(flags).filter(Boolean).length} de {Object.keys(flags).length} flags activos
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Última actualización</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString('es-CL')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Reset
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres resetear todos los feature flags a sus valores por defecto?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetFlags();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsAdmin;
