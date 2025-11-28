import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Trash2,
  Eye,
  Calendar,
  Shield,
  HardDrive,
  Cloud,
  X
} from 'lucide-react';
import { getBackupManager, BackupResult, BackupConfig } from '../../lib/backupManager';

interface BackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ isOpen, onClose }) => {
  const backupManager = getBackupManager();
  const [backups, setBackups] = useState<BackupResult[]>([]);
  const [config, setConfig] = useState<BackupConfig>(backupManager.getConfig());
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const history = await backupManager.getBackupHistory();
      setBackups(history);
      setConfig(backupManager.getConfig());
    } catch (error) {
      console.error('Error loading backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (type: 'manual' | 'forced' = 'manual') => {
    setCreatingBackup(true);
    try {
      const result = await backupManager.forceBackup(type);
      setBackups(prev => [result, ...prev]);
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setRestoringBackup(backupId);
    try {
      const result = await backupManager.restoreBackup(backupId);
      if (result.success) {
        alert(`Restauración completada. ${result.restoredItems} elementos restaurados.`);
      } else {
        alert(`Error en restauración: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error al restaurar el backup');
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleUpdateConfig = (newConfig: Partial<BackupConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    backupManager.updateConfig(newConfig);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusIcon = (status: BackupResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: BackupResult['status']) => {
    switch (status) {
      case 'success':
        return 'Completado';
      case 'failed':
        return 'Falló';
      case 'in_progress':
        return 'En progreso';
      default:
        return 'Desconocido';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="h-6 w-6" />
            <h2 className="text-xl font-bold">Administrador de Backups</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Actions Bar */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleCreateBackup('manual')}
                  disabled={creatingBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingBackup ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Crear Backup
                </button>

                <button
                  onClick={() => handleCreateBackup('forced')}
                  disabled={creatingBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Backup Forzado
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  {backups.length} backups
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {config.encryption.enabled ? 'Encriptado' : 'Sin encriptación'}
                </span>
                <span className="flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  {config.storage.cloud ? 'Nube activada' : 'Solo local'}
                </span>
              </div>
            </div>

            {/* Backup List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Cargando backups...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <HardDrive className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay backups disponibles</h3>
                <p>Crea tu primer backup para comenzar a proteger tus datos.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(backup.status)}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Backup {backup.type === 'manual' ? 'Manual' : backup.type === 'scheduled' ? 'Programado' : 'Automático'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {backup.startTime.toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          backup.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : backup.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {getStatusText(backup.status)}
                        </span>

                        {backup.encrypted && (
                          <Shield className="h-4 w-4 text-green-500" title="Encriptado" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tamaño:</span>
                        <span className="ml-1 font-medium">{formatBytes(backup.size)}</span>
                      </div>

                      {backup.duration && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                          <span className="ml-1 font-medium">{formatDuration(backup.duration)}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Ubicación:</span>
                        <span className="ml-1 font-medium capitalize">{backup.location}</span>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Checksum:</span>
                        <span className="ml-1 font-mono text-xs">{backup.checksum.substring(0, 8)}...</span>
                      </div>
                    </div>

                    {backup.metadata && Object.keys(backup.metadata).length > 0 && (
                      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Detalles:</span>
                        {backup.metadata.tables && (
                          <span className="ml-2">Tablas: {backup.metadata.tables.length}</span>
                        )}
                        {backup.metadata.fileCount && (
                          <span className="ml-2">Archivos: {backup.metadata.fileCount}</span>
                        )}
                        {backup.metadata.userCount && (
                          <span className="ml-2">Usuarios: {backup.metadata.userCount}</span>
                        )}
                      </div>
                    )}

                    {backup.error && (
                      <div className="mb-3 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-200">
                        <strong>Error:</strong> {backup.error}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {/* TODO: Show backup details */}}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Ver detalles
                        </button>

                        <button
                          onClick={() => {/* TODO: Download backup */}}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          Descargar
                        </button>
                      </div>

                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={restoringBackup === backup.id || backup.status !== 'success'}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {restoringBackup === backup.id ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        Restaurar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Configuración
              </h3>

              <div className="space-y-6">
                {/* Programación */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                    Programación Automática
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.schedule.daily}
                        onChange={(e) => handleUpdateConfig({
                          schedule: { ...config.schedule, daily: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Backup diario</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.schedule.weekly}
                        onChange={(e) => handleUpdateConfig({
                          schedule: { ...config.schedule, weekly: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Backup semanal</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.schedule.monthly}
                        onChange={(e) => handleUpdateConfig({
                          schedule: { ...config.schedule, monthly: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Backup mensual</span>
                    </label>
                  </div>
                </div>

                {/* Retención */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                    Política de Retención
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Retención diaria (días)
                      </label>
                      <input
                        type="number"
                        value={config.retention.daily}
                        onChange={(e) => handleUpdateConfig({
                          retention: { ...config.retention, daily: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="365"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Retención semanal (semanas)
                      </label>
                      <input
                        type="number"
                        value={config.retention.weekly}
                        onChange={(e) => handleUpdateConfig({
                          retention: { ...config.retention, weekly: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="52"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Retención mensual (meses)
                      </label>
                      <input
                        type="number"
                        value={config.retention.monthly}
                        onChange={(e) => handleUpdateConfig({
                          retention: { ...config.retention, monthly: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="24"
                      />
                    </div>
                  </div>
                </div>

                {/* Encriptación */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                    Encriptación
                  </h4>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.encryption.enabled}
                        onChange={(e) => handleUpdateConfig({
                          encryption: { ...config.encryption, enabled: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Habilitar encriptación AES-256-GCM</span>
                    </label>

                    {config.encryption.enabled && (
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Rotación de clave (días)
                        </label>
                        <input
                          type="number"
                          value={config.encryption.keyRotation}
                          onChange={(e) => handleUpdateConfig({
                            encryption: { ...config.encryption, keyRotation: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="30"
                          max="365"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Almacenamiento */}
                <div>
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                    Almacenamiento
                  </h4>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.storage.local}
                        onChange={(e) => handleUpdateConfig({
                          storage: { ...config.storage, local: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Almacenamiento local</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.storage.cloud}
                        onChange={(e) => handleUpdateConfig({
                          storage: { ...config.storage, cloud: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Almacenamiento en nube</span>
                    </label>
                  </div>
                </div>

                {/* Sistema activado/desactivado */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Sistema de backups activado</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



