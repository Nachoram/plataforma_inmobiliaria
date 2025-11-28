import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Clock,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { usePushNotifications, PushNotification } from '../../hooks/usePushNotifications';
import { NotificationSettings } from './NotificationSettings';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    notifyOfferUpdate,
    notifyTaskDue,
    notifyDocumentRequest
  } = usePushNotifications();

  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'offer_update':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'task_due':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'document_request':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'communication':
        return <Bell className="h-5 w-5 text-green-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: PushNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationAction = (notification: PushNotification, action: string) => {
    switch (action) {
      case 'view':
        // TODO: Navigate to relevant page based on notification data
        console.log('Viewing notification:', notification.data);
        break;
      case 'complete':
        // TODO: Mark task as complete
        console.log('Completing task:', notification.data);
        break;
      case 'upload':
        // TODO: Open document upload modal
        console.log('Uploading document for:', notification.data);
        break;
      case 'dismiss':
        removeNotification(notification.id);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Funciones de demo para testing
  const sendTestNotifications = () => {
    notifyOfferUpdate('offer-123', 'La oferta ha sido actualizada con nueva información');
    notifyTaskDue('task-456', 'Revisar documentos del comprador', '2024-12-15T10:00:00Z');
    notifyDocumentRequest('Cédula de identidad', 'offer-123');
  };

  if (showSettings) {
    return <NotificationSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-t-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">Notificaciones</h2>
              <p className="text-sm text-gray-300">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={sendTestNotifications}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Test Notifications
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <BellOff className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay notificaciones</h3>
              <p className="text-center text-sm">
                Cuando tengas nuevas notificaciones, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 hover:bg-gray-50 transition-colors ${
                    getPriorityColor(notification.priority)
                  } ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        {notification.body}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                            ${notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              notification.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}">
                            {notification.priority}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                            ${notification.type === 'offer_update' ? 'bg-blue-100 text-blue-800' :
                              notification.type === 'task_due' ? 'bg-orange-100 text-orange-800' :
                              notification.type === 'document_request' ? 'bg-red-100 text-red-800' :
                              notification.type === 'communication' ? 'bg-green-100 text-green-800' :
                              notification.type === 'system' ? 'bg-gray-100 text-gray-800' :
                              'bg-purple-100 text-purple-800'}">
                            {notification.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {notification.actions && notification.actions.map((action) => (
                            <button
                              key={action.action}
                              onClick={() => handleNotificationAction(notification, action.action)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              title={action.title}
                            >
                              {action.title}
                            </button>
                          ))}

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Marcar como leída"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Eliminar notificación"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



