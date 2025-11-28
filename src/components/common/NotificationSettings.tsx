import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Moon, Sun, Clock, Settings } from 'lucide-react';
import { usePushNotifications, PushNotificationSettings } from '../../hooks/usePushNotifications';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const {
    isSupported,
    permission,
    settings,
    updateSettings,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    isSubscribed
  } = usePushNotifications();

  const [localSettings, setLocalSettings] = useState<PushNotificationSettings>(settings);

  // Sincronizar configuración local con la del hook
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(localSettings);
    onClose();
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribeToPush();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h2 className="text-xl font-bold">Configuración de Notificaciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Soporte y permisos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Estado de Notificaciones</h3>

            {!isSupported ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <BellOff className="h-5 w-5" />
                  <span className="font-medium">Notificaciones no soportadas</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Tu navegador no soporta notificaciones push.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Permisos del navegador</span>
                  <div className="flex items-center gap-2">
                    {permission === 'granted' ? (
                      <span className="text-green-600 font-medium">Concedidos</span>
                    ) : permission === 'denied' ? (
                      <span className="text-red-600 font-medium">Denegados</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">Pendiente</span>
                    )}
                    <div className={`w-3 h-3 rounded-full ${
                      permission === 'granted' ? 'bg-green-500' :
                      permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                </div>

                {permission !== 'granted' && (
                  <button
                    onClick={handlePermissionRequest}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Solicitar permisos de notificación
                  </button>
                )}

                {permission === 'granted' && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Suscripción Push</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          isSubscribed
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {isSubscribed ? 'Desactivar' : 'Activar'}
                      </button>
                      <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuración general */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Configuración General</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <span className="font-medium">Notificaciones activadas</span>
                    <p className="text-sm text-gray-600">Recibir notificaciones push</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.enabled}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-gray-600" />
                  <div>
                    <span className="font-medium">Sonido</span>
                    <p className="text-sm text-gray-600">Reproducir sonido con notificaciones</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.soundEnabled}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      soundEnabled: e.target.checked
                    }))}
                    className="sr-only peer"
                    disabled={!localSettings.enabled}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                    !localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-400 rounded animate-pulse"></div>
                  <div>
                    <span className="font-medium">Vibración</span>
                    <p className="text-sm text-gray-600">Vibrar dispositivo con notificaciones</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.vibrationEnabled}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      vibrationEnabled: e.target.checked
                    }))}
                    className="sr-only peer"
                    disabled={!localSettings.enabled}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                    !localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
                  <div>
                    <span className="font-medium">Mostrar badge</span>
                    <p className="text-sm text-gray-600">Mostrar contador en el icono de la app</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.showBadge}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      showBadge: e.target.checked
                    }))}
                    className="sr-only peer"
                    disabled={!localSettings.enabled}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                    !localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* Horas de silencio */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Horas de Silencio</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-gray-600" />
                  <div>
                    <span className="font-medium">Horas de silencio</span>
                    <p className="text-sm text-gray-600">No mostrar notificaciones en horario específico</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.quietHours.enabled}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        enabled: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                    disabled={!localSettings.enabled}
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                    !localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}></div>
                </label>
              </div>

              {localSettings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde
                    </label>
                    <input
                      type="time"
                      value={localSettings.quietHours.start}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        quietHours: {
                          ...prev.quietHours,
                          start: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!localSettings.enabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta
                    </label>
                    <input
                      type="time"
                      value={localSettings.quietHours.end}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        quietHours: {
                          ...prev,
                          quietHours: {
                            ...prev.quietHours,
                            end: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!localSettings.enabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tipos de notificación */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Tipos de Notificación</h3>

            <div className="space-y-3">
              {Object.entries(localSettings.types).map(([type, config]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <div>
                      <span className="font-medium capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <p className="text-sm text-gray-600">
                        {getNotificationTypeDescription(type as keyof PushNotificationSettings['types'])}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={config.priority}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        types: {
                          ...prev.types,
                          [type]: {
                            ...prev.types[type as keyof PushNotificationSettings['types']],
                            priority: e.target.value as any
                          }
                        }
                      }))}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                      disabled={!localSettings.enabled}
                    >
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setLocalSettings(prev => ({
                          ...prev,
                          types: {
                            ...prev.types,
                            [type]: {
                              ...prev.types[type as keyof PushNotificationSettings['types']],
                              enabled: e.target.checked
                            }
                          }
                        }))}
                        className="sr-only peer"
                        disabled={!localSettings.enabled}
                      />
                      <div className={`w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 ${
                        !localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                      }`}></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

function getNotificationTypeDescription(type: keyof PushNotificationSettings['types']): string {
  const descriptions = {
    offer_update: 'Cambios en ofertas inmobiliarias',
    task_due: 'Recordatorios de tareas pendientes',
    document_request: 'Solicitudes de documentos',
    communication: 'Mensajes y comunicaciones',
    system: 'Notificaciones del sistema',
    reminder: 'Recordatorios programados'
  };
  return descriptions[type] || 'Notificación general';
}



