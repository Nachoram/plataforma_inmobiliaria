import React, { useState, useEffect } from 'react';
import {
  Key,
  Webhook,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Code,
  Settings,
  X,
  Download,
  Upload,
  Activity
} from 'lucide-react';
import { getExternalApiService, ApiKey, WebhookConfig, ApiPermission, WebhookEvent } from '../../lib/externalApi';
import { getAdvancedLogger } from '../../lib/advancedLogger';

interface ApiIntegrationsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiIntegrationsManager: React.FC<ApiIntegrationsManagerProps> = ({ isOpen, onClose }) => {
  const externalApi = getExternalApiService();
  const logger = getAdvancedLogger();
  const [activeTab, setActiveTab] = useState<'apikeys' | 'webhooks' | 'logs'>('apikeys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para formularios
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);

  // Formularios
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    permissions: [] as ApiPermission[],
    rateLimit: { requests: 1000, period: 3600 }
  });

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: [] as WebhookEvent[],
    secret: '',
    retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
    headers: {} as Record<string, string>
  });

  // Cargar datos
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // En una implementación real, obtendríamos el userId del contexto de autenticación
      const userId = 'current-user-id'; // TODO: Obtener del contexto

      const [keysData, webhooksData] = await Promise.all([
        externalApi.listApiKeys(userId),
        loadWebhooks(userId)
      ]);

      setApiKeys(keysData);
      setWebhooks(webhooksData);
    } catch (error) {
      console.error('Error loading integrations data:', error);
      logger.error('ui', 'Failed to load integrations data', { error });
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para cargar webhooks (no está implementada en el servicio aún)
  const loadWebhooks = async (userId: string): Promise<WebhookConfig[]> => {
    // TODO: Implementar en el servicio
    return [];
  };

  // Handlers para API Keys
  const handleCreateApiKey = async () => {
    if (!apiKeyForm.name.trim()) {
      alert('Por favor ingresa un nombre para la API key');
      return;
    }

    try {
      const userId = 'current-user-id'; // TODO: Obtener del contexto
      const apiKey = await externalApi.createApiKey(
        userId,
        apiKeyForm.name,
        apiKeyForm.permissions,
        apiKeyForm.rateLimit
      );

      setApiKeys(prev => [apiKey, ...prev]);
      setShowApiKeyForm(false);
      setApiKeyForm({
        name: '',
        permissions: [],
        rateLimit: { requests: 1000, period: 3600 }
      });

      alert(`API Key creada exitosamente. Guárdala en un lugar seguro:\n\n${apiKey.key}`);
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Error al crear la API key');
    }
  };

  const handleRevokeApiKey = async (apiKeyId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres revocar esta API key? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const userId = 'current-user-id'; // TODO: Obtener del contexto
      await externalApi.revokeApiKey(apiKeyId, userId);

      setApiKeys(prev => prev.filter(key => key.id !== apiKeyId));
      logger.info('ui', 'API key revoked', { apiKeyId });
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Error al revocar la API key');
    }
  };

  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      alert('API key copiada al portapapeles');
    } catch (error) {
      alert(`API Key: ${key}`);
    }
  };

  // Handlers para Webhooks
  const handleCreateWebhook = async () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim() || webhookForm.events.length === 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const webhook = await externalApi.createWebhook({
        ...webhookForm,
        isActive: true,
        filters: {},
        secret: webhookForm.secret || generateWebhookSecret()
      });

      setWebhooks(prev => [...prev, webhook]);
      setShowWebhookForm(false);
      setWebhookForm({
        name: '',
        url: '',
        events: [],
        secret: '',
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
        headers: {}
      });

      logger.info('ui', 'Webhook created', { webhookId: webhook.id });
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Error al crear el webhook');
    }
  };

  // Utilidades
  const generateWebhookSecret = (): string => {
    return `whs_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;
  };

  const formatRateLimit = (rateLimit: { requests: number; period: number }) => {
    const periodText = rateLimit.period === 3600 ? 'hora' :
                      rateLimit.period === 86400 ? 'día' : `${rateLimit.period}s`;
    return `${rateLimit.requests} requests por ${periodText}`;
  };

  const getPermissionDescription = (resource: string, actions: string[]) => {
    const descriptions: Record<string, string> = {
      properties: 'Propiedades',
      offers: 'Ofertas',
      users: 'Usuarios',
      tasks: 'Tareas',
      documents: 'Documentos',
      communications: 'Comunicaciones',
      templates: 'Plantillas',
      analytics: 'Analytics',
      webhooks: 'Webhooks'
    };

    return `${descriptions[resource] || resource}: ${actions.join(', ')}`;
  };

  const availablePermissions: Array<{ resource: string; actions: string[] }> = [
    { resource: 'properties', actions: ['read', 'create', 'update'] },
    { resource: 'offers', actions: ['read', 'create', 'update'] },
    { resource: 'users', actions: ['read'] },
    { resource: 'tasks', actions: ['read', 'update'] },
    { resource: 'documents', actions: ['read'] },
    { resource: 'communications', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] }
  ];

  const availableEvents: WebhookEvent[] = [
    'property.created',
    'property.updated',
    'property.deleted',
    'offer.created',
    'offer.updated',
    'offer.status_changed',
    'user.created',
    'user.updated',
    'task.created',
    'task.updated',
    'task.completed',
    'communication.sent',
    'document.uploaded'
  ];

  const togglePermission = (resource: string, action: string) => {
    setApiKeyForm(prev => {
      const existingPermission = prev.permissions.find(p => p.resource === resource);

      if (existingPermission) {
        const hasAction = existingPermission.actions.includes(action);
        if (hasAction) {
          // Remover acción
          const newActions = existingPermission.actions.filter(a => a !== action);
          if (newActions.length === 0) {
            // Remover permiso completamente
            return {
              ...prev,
              permissions: prev.permissions.filter(p => p.resource !== resource)
            };
          } else {
            return {
              ...prev,
              permissions: prev.permissions.map(p =>
                p.resource === resource ? { ...p, actions: newActions } : p
              )
            };
          }
        } else {
          // Agregar acción
          return {
            ...prev,
            permissions: prev.permissions.map(p =>
              p.resource === resource ? { ...p, actions: [...p.actions, action] } : p
            )
          };
        }
      } else {
        // Agregar nuevo permiso
        return {
          ...prev,
          permissions: [...prev.permissions, { resource, actions: [action] }]
        };
      }
    });
  };

  const toggleEvent = (event: WebhookEvent) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="h-6 w-6" />
            <h2 className="text-xl font-bold">Gestor de Integraciones API</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Actualizar datos"
            >
              <Activity className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <nav className="flex">
            {[
              { id: 'apikeys', label: 'API Keys', icon: Key },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'logs', label: 'Logs', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* API Keys Tab */}
          {activeTab === 'apikeys' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">API Keys</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gestiona las claves de acceso para la API externa
                  </p>
                </div>
                <button
                  onClick={() => setShowApiKeyForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nueva API Key
                </button>
              </div>

              {/* API Key Form */}
              {showApiKeyForm && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border">
                  <h4 className="font-semibold mb-4">Crear Nueva API Key</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre</label>
                      <input
                        type="text"
                        value={apiKeyForm.name}
                        onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Mi API Key"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Permisos</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availablePermissions.map(({ resource, actions }) => (
                          <div key={resource} className="space-y-1">
                            <div className="text-sm font-medium capitalize">{resource}</div>
                            <div className="flex gap-2">
                              {actions.map(action => (
                                <label key={action} className="flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={apiKeyForm.permissions
                                      .find(p => p.resource === resource)?.actions.includes(action) || false}
                                    onChange={() => togglePermission(resource, action)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  {action}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Requests por hora</label>
                        <input
                          type="number"
                          value={apiKeyForm.rateLimit.requests}
                          onChange={(e) => setApiKeyForm(prev => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, requests: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          min="1"
                          max="10000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Período (segundos)</label>
                        <select
                          value={apiKeyForm.rateLimit.period}
                          onChange={(e) => setApiKeyForm(prev => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, period: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="60">1 minuto</option>
                          <option value="3600">1 hora</option>
                          <option value="86400">1 día</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleCreateApiKey}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Crear API Key
                      </button>
                      <button
                        onClick={() => {
                          setShowApiKeyForm(false);
                          setApiKeyForm({
                            name: '',
                            permissions: [],
                            rateLimit: { requests: 1000, period: 3600 }
                          });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys List */}
              <div className="space-y-4">
                {apiKeys.map(apiKey => (
                  <div key={apiKey.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Creada: {apiKey.createdAt.toLocaleDateString('es-ES')}
                          </span>
                          {apiKey.lastUsed && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Último uso: {apiKey.lastUsed.toLocaleDateString('es-ES')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {formatRateLimit(apiKey.rateLimit)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          apiKey.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {apiKey.isActive ? 'Activa' : 'Revocada'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Permisos:</div>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {getPermissionDescription(permission.resource, permission.actions)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyApiKey(apiKey.key)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar Key
                      </button>

                      <button
                        onClick={() => handleRevokeApiKey(apiKey.id)}
                        disabled={!apiKey.isActive}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revocar
                      </button>
                    </div>
                  </div>
                ))}

                {apiKeys.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <Key className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay API keys</h3>
                    <p>Crea tu primera API key para comenzar a integrar con servicios externos.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Webhooks</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configura notificaciones automáticas para eventos del sistema
                  </p>
                </div>
                <button
                  onClick={() => setShowWebhookForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Webhook
                </button>
              </div>

              {/* Webhook Form */}
              {showWebhookForm && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border">
                  <h4 className="font-semibold mb-4">Crear Nuevo Webhook</h4>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <input
                          type="text"
                          value={webhookForm.name}
                          onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Mi Webhook"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <input
                          type="url"
                          value={webhookForm.url}
                          onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="https://mi-app.com/webhook"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Eventos</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {availableEvents.map(event => (
                          <label key={event} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={webhookForm.events.includes(event)}
                              onChange={() => toggleEvent(event)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <code className="text-xs bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded">
                              {event}
                            </code>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Secret (opcional)</label>
                        <input
                          type="text"
                          value={webhookForm.secret}
                          onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                          placeholder="whs_abcd1234..."
                        />
                        {!webhookForm.secret && (
                          <p className="text-xs text-gray-500 mt-1">
                            Se generará automáticamente si se deja vacío
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Máx. Reintentos</label>
                        <input
                          type="number"
                          value={webhookForm.retryPolicy.maxRetries}
                          onChange={(e) => setWebhookForm(prev => ({
                            ...prev,
                            retryPolicy: { ...prev.retryPolicy, maxRetries: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          min="0"
                          max="10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleCreateWebhook}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Crear Webhook
                      </button>
                      <button
                        onClick={() => {
                          setShowWebhookForm(false);
                          setWebhookForm({
                            name: '',
                            url: '',
                            events: [],
                            secret: '',
                            retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
                            headers: {}
                          });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Webhooks List */}
              <div className="space-y-4">
                {webhooks.map(webhook => (
                  <div key={webhook.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{webhook.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {webhook.url}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Creado: {webhook.createdAt.toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          webhook.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {webhook.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Eventos:</div>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map(event => (
                          <code
                            key={event}
                            className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded"
                          >
                            {event}
                          </code>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                        <Edit className="h-3 w-3" />
                        Editar
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {webhooks.length === 0 && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <Webhook className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay webhooks configurados</h3>
                    <p>Configura webhooks para recibir notificaciones automáticas de eventos.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Logs de Integración</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Historial de requests a la API y entregas de webhooks
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                      Funcionalidad en Desarrollo
                    </h4>
                    <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                      Los logs de integración estarán disponibles próximamente. Esta funcionalidad
                      permitirá monitorear todas las llamadas a la API externa y entregas de webhooks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Placeholder para logs futuros */}
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">API Request - GET /api/properties</span>
                    <span className="text-xs text-gray-500 ml-auto">2024-01-15 10:30:00</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: 200, Response Time: 45ms, User: user123
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Webhook - offer.created</span>
                    <span className="text-xs text-gray-500 ml-auto">2024-01-15 09:15:00</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Delivered to: https://mi-app.com/webhook, Status: 200, Attempt: 1
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con documentación rápida */}
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              <strong>API Base URL:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">
                https://tu-app.com/api/v1
              </code>
            </div>
            <div>
              <strong>Documentación:</strong>{' '}
              <a
                href="/api/docs"
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



