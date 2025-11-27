import React, { useState, useEffect } from 'react';
import {
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  ExternalLink,
  Key,
  Database,
  Users,
  Target,
  Play,
  Pause,
  TestTube,
  BarChart3,
  X
} from 'lucide-react';
import { createHubSpotIntegration, HubSpotConfig } from '../../lib/integrations/hubspot';
import { getExternalApiService } from '../../lib/externalApi';

interface CrmIntegrationsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationConfig {
  id: string;
  name: string;
  type: 'hubspot' | 'pipedrive' | 'zoho' | 'salesforce';
  config: HubSpotConfig | any;
  isActive: boolean;
  lastSync?: Date;
  syncStatus?: 'idle' | 'running' | 'success' | 'error';
  lastError?: string;
}

export const CrmIntegrationsManager: React.FC<CrmIntegrationsManagerProps> = ({ isOpen, onClose }) => {
  const externalApi = getExternalApiService();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'hubspot' | 'pipedrive' | 'zoho' | 'salesforce'>('overview');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Estado para configuración de HubSpot
  const [hubspotConfig, setHubspotConfig] = useState<HubSpotConfig>({
    apiKey: '',
    portalId: '',
    syncEnabled: true,
    syncProperties: true,
    syncOffers: true,
    syncContacts: true,
    customProperties: {
      propertyType: 'property_type',
      offerStatus: 'offer_status',
      propertyValue: 'property_value'
    }
  });

  // Cargar integraciones existentes
  useEffect(() => {
    if (isOpen) {
      loadIntegrations();
    }
  }, [isOpen]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      // En una implementación real, cargaríamos desde base de datos
      // Por ahora, simulamos integraciones existentes
      const mockIntegrations: IntegrationConfig[] = [
        {
          id: 'hubspot_001',
          name: 'HubSpot CRM',
          type: 'hubspot',
          config: {
            apiKey: '••••••••••••••••',
            portalId: '12345678',
            syncEnabled: true,
            syncProperties: true,
            syncOffers: true,
            syncContacts: true
          },
          isActive: true,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
          syncStatus: 'success'
        }
      ];

      setIntegrations(mockIntegrations);

      // Cargar configuración de HubSpot si existe
      const hubspotIntegration = mockIntegrations.find(i => i.type === 'hubspot');
      if (hubspotIntegration) {
        setHubspotConfig(hubspotIntegration.config as HubSpotConfig);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test de conexión
  const testConnection = async (integration: IntegrationConfig) => {
    try {
      if (integration.type === 'hubspot') {
        const hubspot = createHubSpotIntegration(integration.config as HubSpotConfig);
        const result = await hubspot.testConnection();

        if (result.success) {
          alert('✅ Conexión exitosa con HubSpot');
        } else {
          alert(`❌ Error de conexión: ${result.message}`);
        }
      }
    } catch (error) {
      alert(`❌ Error al probar conexión: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Sincronización completa
  const runFullSync = async (integration: IntegrationConfig) => {
    if (!integration.isActive) {
      alert('La integración debe estar activada para sincronizar');
      return;
    }

    setSyncing(integration.id);

    try {
      // Obtener API key del usuario (en implementación real vendría del contexto)
      const apiKey = 'user-api-key-here'; // TODO: Obtener del contexto

      if (integration.type === 'hubspot') {
        const hubspot = createHubSpotIntegration(integration.config as HubSpotConfig);
        const result = await hubspot.fullSync(apiKey);

        // Actualizar estado de la integración
        setIntegrations(prev => prev.map(i =>
          i.id === integration.id
            ? {
                ...i,
                lastSync: new Date(),
                syncStatus: result.totalErrors > 0 ? 'error' : 'success',
                lastError: result.totalErrors > 0
                  ? `${result.totalErrors} errores en sincronización`
                  : undefined
              }
            : i
        ));

        alert(`✅ Sincronización completada:
- Contactos: ${result.contacts.synced} sincronizados
- Propiedades: ${result.properties.synced} sincronizadas
- Ofertas: ${result.offers.synced} sincronizadas
- Total: ${result.totalSynced} elementos
- Errores: ${result.totalErrors}`);
      }
    } catch (error) {
      setIntegrations(prev => prev.map(i =>
        i.id === integration.id
          ? {
              ...i,
              syncStatus: 'error',
              lastError: error instanceof Error ? error.message : 'Unknown error'
            }
          : i
      ));

      alert(`❌ Error en sincronización: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(null);
    }
  };

  // Guardar configuración de HubSpot
  const saveHubspotConfig = async () => {
    if (!hubspotConfig.apiKey.trim() || !hubspotConfig.portalId.trim()) {
      alert('Por favor completa la API Key y Portal ID');
      return;
    }

    try {
      // Test de conexión primero
      const hubspot = createHubSpotIntegration(hubspotConfig);
      const testResult = await hubspot.testConnection();

      if (!testResult.success) {
        alert(`❌ Error de conexión: ${testResult.message}`);
        return;
      }

      // Crear o actualizar integración
      const integration: IntegrationConfig = {
        id: 'hubspot_001',
        name: 'HubSpot CRM',
        type: 'hubspot',
        config: hubspotConfig,
        isActive: true,
        syncStatus: 'idle'
      };

      // Actualizar lista de integraciones
      setIntegrations(prev => {
        const existing = prev.find(i => i.type === 'hubspot');
        if (existing) {
          return prev.map(i => i.type === 'hubspot' ? integration : i);
        } else {
          return [...prev, integration];
        }
      });

      alert('✅ Configuración de HubSpot guardada exitosamente');
    } catch (error) {
      alert(`❌ Error al guardar configuración: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Toggle integración activa/inactiva
  const toggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === integrationId
        ? { ...i, isActive: !i.isActive }
        : i
    ));
  };

  // Información de integraciones soportadas
  const supportedIntegrations = [
    {
      type: 'hubspot' as const,
      name: 'HubSpot CRM',
      description: 'CRM completo con marketing automation',
      icon: '🎯',
      features: ['Contacts', 'Deals', 'Companies', 'Marketing'],
      setupUrl: 'https://developers.hubspot.com/docs/api/overview'
    },
    {
      type: 'pipedrive' as const,
      name: 'Pipedrive',
      description: 'CRM enfocado en ventas y pipeline management',
      icon: '📊',
      features: ['Deals', 'Contacts', 'Organizations', 'Activities'],
      setupUrl: 'https://developers.pipedrive.com/docs/api/v1/'
    },
    {
      type: 'zoho' as const,
      name: 'Zoho CRM',
      description: 'Suite completa de productividad y CRM',
      icon: '🏢',
      features: ['Leads', 'Contacts', 'Deals', 'Campaigns'],
      setupUrl: 'https://www.zoho.com/crm/developer/docs/api/v2/'
    },
    {
      type: 'salesforce' as const,
      name: 'Salesforce',
      description: 'Plataforma CRM enterprise líder',
      icon: '☁️',
      features: ['Accounts', 'Contacts', 'Opportunities', 'Leads'],
      setupUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <h2 className="text-xl font-bold">Gestor de Integraciones CRM</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadIntegrations}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Actualizar integraciones"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
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
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Resumen
            </button>

            {supportedIntegrations.map(integration => (
              <button
                key={integration.type}
                onClick={() => setActiveTab(integration.type)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === integration.type
                    ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <span className="text-base">{integration.icon}</span>
                {integration.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Integraciones Activas</h3>

                {integrations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">No hay integraciones configuradas</h4>
                    <p>Configura una integración con tu CRM favorito para sincronizar automáticamente tus datos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map(integration => (
                      <div key={integration.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">
                              {supportedIntegrations.find(i => i.type === integration.type)?.icon}
                            </div>
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  integration.isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                  {integration.isActive ? 'Activa' : 'Inactiva'}
                                </span>
                                {integration.syncStatus && (
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    integration.syncStatus === 'success'
                                      ? 'bg-green-100 text-green-800'
                                      : integration.syncStatus === 'error'
                                      ? 'bg-red-100 text-red-800'
                                      : integration.syncStatus === 'running'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {integration.syncStatus === 'success' ? 'OK' :
                                     integration.syncStatus === 'error' ? 'Error' :
                                     integration.syncStatus === 'running' ? 'Syncing' : 'Idle'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => testConnection(integration)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Probar conexión"
                            >
                              <TestTube className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => runFullSync(integration)}
                              disabled={!integration.isActive || syncing === integration.id}
                              className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-colors"
                              title="Sincronizar ahora"
                            >
                              {syncing === integration.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              onClick={() => toggleIntegration(integration.id)}
                              className={`p-2 transition-colors ${
                                integration.isActive
                                  ? 'text-green-600 hover:text-gray-400'
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                              title={integration.isActive ? 'Desactivar' : 'Activar'}
                            >
                              {integration.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {integration.lastSync && (
                          <div className="text-sm text-gray-500 mb-2">
                            Última sync: {integration.lastSync.toLocaleString('es-ES')}
                          </div>
                        )}

                        {integration.lastError && (
                          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900 p-2 rounded">
                            Error: {integration.lastError}
                          </div>
                        )}

                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {supportedIntegrations.find(i => i.type === integration.type)?.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Integraciones Disponibles */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Integraciones Disponibles</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportedIntegrations.map(integration => {
                    const isConfigured = integrations.some(i => i.type === integration.type);

                    return (
                      <div key={integration.type} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{integration.icon}</span>
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {integration.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isConfigured ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Características:</div>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.map(feature => (
                              <span key={feature} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveTab(integration.type)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <Settings className="h-3 w-3" />
                            Configurar
                          </button>

                          <a
                            href={integration.setupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Docs
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* HubSpot Configuration Tab */}
          {activeTab === 'hubspot' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold">Configuración de HubSpot</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Conecta tu cuenta de HubSpot para sincronizar contactos, propiedades y ofertas.
                </p>
              </div>

              <div className="space-y-6">
                {/* API Key y Portal ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <input
                      type="password"
                      value={hubspotConfig.apiKey}
                      onChange={(e) => setHubspotConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., pat-na1-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Obtén tu API key desde HubSpot Settings &gt; Integrations &gt; Private Apps
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Portal ID</label>
                    <input
                      type="text"
                      value={hubspotConfig.portalId}
                      onChange={(e) => setHubspotConfig(prev => ({ ...prev, portalId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="e.g., 12345678"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tu Portal ID se encuentra en la URL de HubSpot
                    </p>
                  </div>
                </div>

                {/* Opciones de sincronización */}
                <div>
                  <h4 className="font-medium mb-3">¿Qué sincronizar?</h4>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={hubspotConfig.syncContacts}
                        onChange={(e) => setHubspotConfig(prev => ({ ...prev, syncContacts: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Contactos (Usuarios)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={hubspotConfig.syncProperties}
                        onChange={(e) => setHubspotConfig(prev => ({ ...prev, syncProperties: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>Propiedades</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={hubspotConfig.syncOffers}
                        onChange={(e) => setHubspotConfig(prev => ({ ...prev, syncOffers: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Ofertas</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Configuración avanzada */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <h4 className="font-medium mb-3">Configuración Avanzada</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pipeline de Propiedades</label>
                      <input
                        type="text"
                        value={hubspotConfig.propertyPipelineId || ''}
                        onChange={(e) => setHubspotConfig(prev => ({ ...prev, propertyPipelineId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="default"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Pipeline de Ofertas</label>
                      <input
                        type="text"
                        value={hubspotConfig.offerPipelineId || ''}
                        onChange={(e) => setHubspotConfig(prev => ({ ...prev, offerPipelineId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="offers"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={saveHubspotConfig}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    Guardar Configuración
                  </button>

                  <button
                    onClick={() => {
                      const hubspot = createHubSpotIntegration(hubspotConfig);
                      testConnection({
                        id: 'test',
                        name: 'Test HubSpot',
                        type: 'hubspot',
                        config: hubspotConfig,
                        isActive: true
                      });
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Probar Conexión
                  </button>
                </div>

                {/* Instrucciones */}
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📋 Cómo configurar HubSpot
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>1. Ve a HubSpot Settings &gt; Integrations &gt; Private Apps</li>
                    <li>2. Crea una nueva Private App con permisos para CRM</li>
                    <li>3. Copia la API Key generada</li>
                    <li>4. Obtén tu Portal ID desde la URL de HubSpot</li>
                    <li>5. Configura los pipelines deseados en HubSpot</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder para otras integraciones */}
          {(activeTab === 'pipedrive' || activeTab === 'zoho' || activeTab === 'salesforce') && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Próximamente</h3>
              <p className="text-gray-600 dark:text-gray-400">
                La integración con {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} estará disponible próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
