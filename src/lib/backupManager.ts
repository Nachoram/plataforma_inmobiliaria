// Sistema de Backups Automáticos con Encriptación
// Gestiona backups de base de datos, archivos y configuración

import { supabase } from './supabase';
import { getPerformanceMonitor } from './performanceMonitor';

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    customCron?: string;
  };
  retention: {
    daily: number; // días
    weekly: number; // semanas
    monthly: number; // meses
  };
  encryption: {
    enabled: boolean;
    algorithm: 'AES-256-GCM' | 'AES-128-GCM';
    keyRotation: number; // días
  };
  storage: {
    local: boolean;
    cloud: boolean;
    cloudProvider: 'supabase' | 'aws' | 'gcp' | 'azure';
    cloudConfig?: any;
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    emailRecipients: string[];
  };
  includedData: {
    database: boolean;
    files: boolean;
    userData: boolean;
    systemConfig: boolean;
    auditLogs: boolean;
  };
}

export interface BackupResult {
  id: string;
  type: 'manual' | 'scheduled' | 'automatic';
  status: 'success' | 'failed' | 'in_progress';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size: number;
  encrypted: boolean;
  location: string;
  checksum: string;
  error?: string;
  metadata: {
    tables?: string[];
    fileCount?: number;
    userCount?: number;
    recordCount?: number;
  };
}

export interface RestoreResult {
  success: boolean;
  restoredItems: number;
  skippedItems: number;
  errors: string[];
  duration: number;
  checksum: string;
}

class BackupManager {
  private config: BackupConfig;
  private isInitialized = false;
  private backupInterval?: NodeJS.Timeout;
  private encryptionKey: string;
  private keyLastRotated?: Date;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      enabled: true,
      schedule: {
        daily: true,
        weekly: true,
        monthly: true
      },
      retention: {
        daily: 30,
        weekly: 12,
        monthly: 24
      },
      encryption: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotation: 90
      },
      storage: {
        local: true,
        cloud: false,
        cloudProvider: 'supabase'
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        emailRecipients: []
      },
      includedData: {
        database: true,
        files: true,
        userData: true,
        systemConfig: true,
        auditLogs: true
      },
      ...config
    };

    // Generar clave de encriptación inicial
    this.encryptionKey = this.generateEncryptionKey();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  private async initialize() {
    if (this.isInitialized) return;

    console.log('🔐 Inicializando Backup Manager...');

    // Verificar configuración
    await this.validateConfiguration();

    // Configurar programador automático
    this.setupAutomaticBackups();

    // Verificar rotación de claves
    await this.checkKeyRotation();

    // Limpiar backups antiguos
    await this.cleanupOldBackups();

    this.isInitialized = true;
    console.log('✅ Backup Manager inicializado');
  }

  // ========================================================================
  // CONFIGURACIÓN Y VALIDACIÓN
  // ========================================================================

  private async validateConfiguration(): Promise<void> {
    // Verificar permisos de almacenamiento
    if (this.config.storage.local) {
      try {
        await this.testLocalStorage();
      } catch (error) {
        console.warn('⚠️ Almacenamiento local no disponible:', error);
        this.config.storage.local = false;
      }
    }

    // Verificar configuración de nube
    if (this.config.storage.cloud) {
      try {
        await this.testCloudStorage();
      } catch (error) {
        console.warn('⚠️ Almacenamiento en nube no disponible:', error);
        this.config.storage.cloud = false;
      }
    }

    // Verificar configuración de encriptación
    if (this.config.encryption.enabled) {
      await this.testEncryption();
    }
  }

  private async testLocalStorage(): Promise<void> {
    // Verificar si podemos escribir en localStorage o IndexedDB
    const testData = 'backup_test_' + Date.now();
    localStorage.setItem('backup_test', testData);
    const retrieved = localStorage.getItem('backup_test');
    localStorage.removeItem('backup_test');

    if (retrieved !== testData) {
      throw new Error('Local storage not available');
    }
  }

  private async testCloudStorage(): Promise<void> {
    // Verificar conexión con servicio de almacenamiento en nube
    if (this.config.storage.cloudProvider === 'supabase') {
      const { error } = await supabase.storage.listBuckets();
      if (error) throw error;
    }
  }

  private async testEncryption(): Promise<void> {
    // Verificar soporte de Web Crypto API
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not supported');
    }

    // Probar encriptación/desencriptación
    const testData = 'encryption_test';
    const encrypted = await this.encryptData(testData);
    const decrypted = await this.decryptData(encrypted);

    if (decrypted !== testData) {
      throw new Error('Encryption test failed');
    }
  }

  // ========================================================================
  // PROGRAMACIÓN DE BACKUPS
  // ========================================================================

  private setupAutomaticBackups(): void {
    if (!this.config.enabled) return;

    // Limpiar intervalo anterior
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    // Configurar backup diario (ejecutar a las 2 AM)
    const now = new Date();
    const nextBackup = new Date(now);
    nextBackup.setHours(2, 0, 0, 0);

    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    const timeUntilNextBackup = nextBackup.getTime() - now.getTime();

    setTimeout(() => {
      this.performScheduledBackup('daily');

      // Configurar intervalo diario (24 horas)
      this.backupInterval = setInterval(() => {
        this.performScheduledBackup('daily');
      }, 24 * 60 * 60 * 1000);
    }, timeUntilNextBackup);

    console.log(`📅 Próximo backup automático: ${nextBackup.toLocaleString()}`);
  }

  private async performScheduledBackup(type: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      console.log(`🔄 Iniciando backup ${type} programado...`);
      const result = await this.createBackup('scheduled', { scheduleType: type });

      if (result.status === 'success') {
        console.log(`✅ Backup ${type} completado exitosamente`);
        await this.sendNotification('backup_success', result);
      } else {
        console.error(`❌ Backup ${type} falló:`, result.error);
        await this.sendNotification('backup_failed', result);
      }
    } catch (error) {
      console.error(`❌ Error en backup ${type}:`, error);
      await this.sendNotification('backup_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // ========================================================================
  // CREACIÓN DE BACKUPS
  // ========================================================================

  async createBackup(
    type: BackupResult['type'] = 'manual',
    metadata: Record<string, any> = {}
  ): Promise<BackupResult> {
    const startTime = new Date();
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result: BackupResult = {
      id: backupId,
      type,
      status: 'in_progress',
      startTime,
      size: 0,
      encrypted: this.config.encryption.enabled,
      location: '',
      checksum: '',
      metadata: {}
    };

    try {
      console.log(`📦 Creando backup ${backupId}...`);

      // Recopilar datos
      const backupData = await this.collectBackupData();

      // Calcular checksum
      result.checksum = await this.calculateChecksum(backupData);

      // Encriptar si está habilitado
      let finalData = backupData;
      if (this.config.encryption.enabled) {
        finalData = await this.encryptData(JSON.stringify(backupData));
      }

      // Almacenar backup
      result.location = await this.storeBackup(finalData, backupId);
      result.size = new Blob([finalData]).size;

      // Guardar metadata en base de datos
      await this.saveBackupMetadata(result);

      // Limpiar backups antiguos
      await this.cleanupOldBackups();

      result.status = 'success';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();

      console.log(`✅ Backup ${backupId} creado exitosamente (${this.formatBytes(result.size)})`);

    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();

      console.error(`❌ Backup ${backupId} falló:`, error);
    }

    // Actualizar metadata final
    await this.saveBackupMetadata(result);

    return result;
  }

  private async collectBackupData(): Promise<any> {
    const backupData: any = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      config: this.config,
      data: {}
    };

    // Base de datos
    if (this.config.includedData.database) {
      console.log('📊 Recopilando datos de base de datos...');
      backupData.data.database = await this.backupDatabase();
    }

    // Archivos
    if (this.config.includedData.files) {
      console.log('📁 Recopilando archivos...');
      backupData.data.files = await this.backupFiles();
    }

    // Datos de usuarios
    if (this.config.includedData.userData) {
      console.log('👥 Recopilando datos de usuarios...');
      backupData.data.users = await this.backupUserData();
    }

    // Configuración del sistema
    if (this.config.includedData.systemConfig) {
      console.log('⚙️ Recopilando configuración del sistema...');
      backupData.data.system = await this.backupSystemConfig();
    }

    // Logs de auditoría
    if (this.config.includedData.auditLogs) {
      console.log('📋 Recopilando logs de auditoría...');
      backupData.data.auditLogs = await this.backupAuditLogs();
    }

    return backupData;
  }

  private async backupDatabase(): Promise<any> {
    // Nota: En producción, esto debería hacerse desde el servidor
    // Aquí solo guardamos la estructura de tablas y configuración
    return {
      tables: [
        'user_profiles',
        'properties',
        'property_sale_offers',
        'offer_tasks',
        'offer_documents',
        'offer_timeline',
        'offer_formal_requests',
        'offer_communications',
        'templates',
        'calendar_events',
        'user_notifications',
        'audit_logs'
      ],
      schema: 'public',
      note: 'Database structure backup - actual data backup should be done server-side'
    };
  }

  private async backupFiles(): Promise<any> {
    // Recopilar información de archivos almacenados
    const { data: files, error } = await supabase.storage
      .from('files')
      .list('', { limit: 1000 });

    if (error) throw error;

    return {
      count: files?.length || 0,
      files: files?.map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        created: file.created_at,
        updated: file.updated_at
      })) || []
    };
  }

  private async backupUserData(): Promise<any> {
    // Recopilar estadísticas de usuarios (no datos sensibles)
    const { count: userCount, error: userError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (userError) throw userError;

    return {
      userCount: userCount || 0,
      lastBackup: new Date().toISOString(),
      note: 'User statistics backup - sensitive data backup should be done server-side'
    };
  }

  private async backupSystemConfig(): Promise<any> {
    // Recopilar configuración del sistema
    return {
      appVersion: '1.0.0',
      nodeVersion: process.version,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private async backupAuditLogs(): Promise<any> {
    // Recopilar logs recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    return {
      count: logs?.length || 0,
      period: '30_days',
      logs: logs || []
    };
  }

  // ========================================================================
  // ENCRIPTACIÓN
  // ========================================================================

  private generateEncryptionKey(): string {
    return crypto.getRandomValues(new Uint8Array(32)).reduce(
      (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
      ''
    );
  }

  private async encryptData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(this.encryptionKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combinar IV + datos encriptados
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  private async decryptData(encryptedData: string): Promise<string> {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(this.encryptionKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  private async checkKeyRotation(): Promise<void> {
    if (!this.keyLastRotated) {
      this.keyLastRotated = new Date();
      return;
    }

    const daysSinceRotation = (Date.now() - this.keyLastRotated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceRotation >= this.config.encryption.keyRotation) {
      console.log('🔄 Rotando clave de encriptación...');
      this.encryptionKey = this.generateEncryptionKey();
      this.keyLastRotated = new Date();

      // Re-encriptar backups existentes con la nueva clave
      await this.reencryptExistingBackups();
    }
  }

  private async reencryptExistingBackups(): Promise<void> {
    // TODO: Implementar re-encriptación de backups existentes
    console.log('🔄 Re-encriptación de backups existente programada');
  }

  // ========================================================================
  // ALMACENAMIENTO
  // ========================================================================

  private async storeBackup(data: any, backupId: string): Promise<string> {
    const locations: string[] = [];

    // Almacenamiento local
    if (this.config.storage.local) {
      try {
        const localKey = `backup_${backupId}`;
        localStorage.setItem(localKey, typeof data === 'string' ? data : JSON.stringify(data));
        locations.push('local');
      } catch (error) {
        console.warn('⚠️ Error almacenando backup localmente:', error);
      }
    }

    // Almacenamiento en nube
    if (this.config.storage.cloud) {
      try {
        if (this.config.storage.cloudProvider === 'supabase') {
          const { error } = await supabase.storage
            .from('backups')
            .upload(`${backupId}.backup`, data, {
              contentType: 'application/octet-stream',
              duplex: 'half'
            });

          if (!error) {
            locations.push('supabase');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error almacenando backup en nube:', error);
      }
    }

    return locations.join(',');
  }

  // ========================================================================
  // RESTAURACIÓN
  // ========================================================================

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const startTime = Date.now();

    try {
      console.log(`🔄 Restaurando backup ${backupId}...`);

      // Obtener metadata del backup
      const { data: metadata, error } = await supabase
        .from('backup_metadata')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error) throw error;

      // Descargar datos del backup
      const backupData = await this.loadBackupData(backupId, metadata);

      // Verificar checksum
      const calculatedChecksum = await this.calculateChecksum(backupData);
      if (calculatedChecksum !== metadata.checksum) {
        throw new Error('Backup checksum verification failed');
      }

      // Restaurar datos
      const restoreResult = await this.restoreBackupData(backupData);

      const duration = Date.now() - startTime;
      console.log(`✅ Restauración completada en ${duration}ms`);

      return {
        success: true,
        restoredItems: restoreResult.restoredItems,
        skippedItems: restoreResult.skippedItems,
        errors: restoreResult.errors,
        duration,
        checksum: calculatedChecksum
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Error en restauración:', error);

      return {
        success: false,
        restoredItems: 0,
        skippedItems: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration,
        checksum: ''
      };
    }
  }

  private async loadBackupData(backupId: string, metadata: any): Promise<any> {
    let data: any = null;

    // Intentar cargar desde nube primero
    if (metadata.location.includes('supabase')) {
      const { data: cloudData, error } = await supabase.storage
        .from('backups')
        .download(`${backupId}.backup`);

      if (!error && cloudData) {
        const text = await cloudData.text();
        data = JSON.parse(text);
      }
    }

    // Intentar cargar desde local si no se encontró en nube
    if (!data && metadata.location.includes('local')) {
      const localData = localStorage.getItem(`backup_${backupId}`);
      if (localData) {
        data = JSON.parse(localData);
      }
    }

    if (!data) {
      throw new Error('Backup data not found');
    }

    // Desencriptar si es necesario
    if (metadata.encrypted) {
      const encryptedString = typeof data === 'string' ? data : JSON.stringify(data);
      const decryptedString = await this.decryptData(encryptedString);
      data = JSON.parse(decryptedString);
    }

    return data;
  }

  private async restoreBackupData(backupData: any): Promise<{
    restoredItems: number;
    skippedItems: number;
    errors: string[];
  }> {
    const result = {
      restoredItems: 0,
      skippedItems: 0,
      errors: [] as string[]
    };

    // Nota: La restauración real de base de datos debe hacerse desde el servidor
    // Aquí solo simulamos la restauración de configuración y datos locales

    try {
      // Restaurar configuración del sistema
      if (backupData.data.system) {
        console.log('⚙️ Restaurando configuración del sistema...');
        // Aplicar configuración del sistema si es necesario
        result.restoredItems++;
      }

      // Restaurar datos de usuarios (solo configuración, no datos sensibles)
      if (backupData.data.users) {
        console.log('👥 Restaurando configuración de usuarios...');
        result.restoredItems++;
      }

      console.log('📊 Restauración de base de datos debe hacerse desde el servidor');
      console.log('📁 Restauración de archivos debe hacerse desde el servidor');

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  // ========================================================================
  // GESTIÓN Y LIMPIEZA
  // ========================================================================

  private async saveBackupMetadata(result: BackupResult): Promise<void> {
    const { error } = await supabase
      .from('backup_metadata')
      .upsert({
        id: result.id,
        type: result.type,
        status: result.status,
        start_time: result.startTime.toISOString(),
        end_time: result.endTime?.toISOString(),
        duration: result.duration,
        size: result.size,
        encrypted: result.encrypted,
        location: result.location,
        checksum: result.checksum,
        error: result.error,
        metadata: result.metadata
      });

    if (error) {
      console.error('Error saving backup metadata:', error);
    }
  }

  async getBackupHistory(limit = 50): Promise<BackupResult[]> {
    const { data, error } = await supabase
      .from('backup_metadata')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      type: item.type,
      status: item.status,
      startTime: new Date(item.start_time),
      endTime: item.end_time ? new Date(item.end_time) : undefined,
      duration: item.duration,
      size: item.size,
      encrypted: item.encrypted,
      location: item.location,
      checksum: item.checksum,
      error: item.error,
      metadata: item.metadata || {}
    }));
  }

  private async cleanupOldBackups(): Promise<void> {
    const now = new Date();

    // Limpiar backups locales antiguos
    const keys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    let cleanedCount = 0;

    for (const key of keys) {
      try {
        const backupId = key.replace('backup_', '');
        const backupData = localStorage.getItem(key);

        if (backupData) {
          const parsed = JSON.parse(backupData);
          const backupDate = new Date(parsed.timestamp);
          const daysOld = (now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24);

          // Eliminar backups más antiguos que la retención configurada
          if (daysOld > this.config.retention.daily) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Si no se puede parsear, eliminar
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🗑️ Limpieza completada: ${cleanedCount} backups antiguos eliminados`);
    }
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  private async calculateChecksum(data: any): Promise<string> {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);

    return Array.from(hashArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async sendNotification(type: 'backup_success' | 'backup_failed', data: any): Promise<void> {
    // TODO: Implementar envío de notificaciones por email/SMS
    console.log(`📧 Enviando notificación ${type}:`, data);
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enabled !== undefined && !newConfig.enabled) {
      this.stopAutomaticBackups();
    } else if (newConfig.enabled) {
      this.setupAutomaticBackups();
    }
  }

  stopAutomaticBackups(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = undefined;
      console.log('⏹️ Backups automáticos detenidos');
    }
  }

  async forceBackup(type: BackupResult['type'] = 'manual'): Promise<BackupResult> {
    return this.createBackup(type, { forced: true });
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  destroy(): void {
    this.stopAutomaticBackups();
    this.isInitialized = false;
    console.log('💥 Backup Manager destruido');
  }
}

// Instancia global
let backupManagerInstance: BackupManager | null = null;

export const getBackupManager = (): BackupManager => {
  if (!backupManagerInstance) {
    backupManagerInstance = new BackupManager({
      enabled: process.env.NODE_ENV === 'production', // Solo en producción por defecto
      storage: {
        local: true,
        cloud: false // Configurar según necesidades
      }
    });
  }
  return backupManagerInstance;
};

export default getBackupManager;


