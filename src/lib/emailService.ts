// Servicio de Notificaciones por Email
// Gestiona envío de emails, plantillas y configuración SMTP

export interface EmailConfig {
  enabled: boolean;
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgridConfig?: {
    apiKey: string;
  };
  mailgunConfig?: {
    apiKey: string;
    domain: string;
  };
  sesConfig?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  defaultFrom: {
    email: string;
    name: string;
  };
  rateLimit: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  category: EmailCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMessage {
  id: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  from: {
    email: string;
    name: string;
  };
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
  category: EmailCategory;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: EmailAttachment[];
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  contentType: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryAfter?: number;
}

export interface EmailStats {
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

export type EmailCategory =
  | 'auth'
  | 'offers'
  | 'system'
  | 'marketing'
  | 'notifications'
  | 'alerts'
  | 'reports'
  | 'backups';

class EmailService {
  private config: EmailConfig;
  private templates: Map<string, EmailTemplate> = new Map();
  private sendQueue: EmailMessage[] = [];
  private isProcessing = false;
  private rateLimitTracker = {
    hourly: new Map<string, number>(),
    daily: new Map<string, number>(),
    lastReset: new Date()
  };

  constructor(config: Partial<EmailConfig> = {}) {
    this.config = {
      enabled: process.env.REACT_APP_EMAIL_ENABLED === 'true',
      provider: (process.env.REACT_APP_EMAIL_PROVIDER as any) || 'smtp',
      smtpConfig: {
        host: process.env.REACT_APP_SMTP_HOST || '',
        port: parseInt(process.env.REACT_APP_SMTP_PORT || '587'),
        secure: process.env.REACT_APP_SMTP_SECURE === 'true',
        auth: {
          user: process.env.REACT_APP_SMTP_USER || '',
          pass: process.env.REACT_APP_SMTP_PASS || ''
        }
      },
      defaultFrom: {
        email: process.env.REACT_APP_EMAIL_FROM || 'noreply@plataformainmobiliaria.com',
        name: process.env.REACT_APP_EMAIL_FROM_NAME || 'Plataforma Inmobiliaria'
      },
      rateLimit: {
        maxPerHour: 100,
        maxPerDay: 1000
      },
      ...config
    };

    if (this.config.enabled) {
      this.initialize();
      this.loadDefaultTemplates();
    }
  }

  private async initialize() {
    console.log('📧 Inicializando Email Service...');

    // Limpiar rate limits cada hora
    setInterval(() => {
      this.resetRateLimits();
    }, 60 * 60 * 1000);

    // Procesar cola de envío
    this.processQueue();

    console.log('✅ Email Service inicializado');
  }

  // ========================================================================
  // CONFIGURACIÓN Y PLANTILLAS
  // ========================================================================

  private loadDefaultTemplates() {
    // Plantilla de bienvenida
    this.registerTemplate({
      id: 'welcome',
      name: 'Bienvenida',
      subject: '¡Bienvenido a Plataforma Inmobiliaria!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">¡Bienvenido {{userName}}!</h1>
          <p>Gracias por registrarte en Plataforma Inmobiliaria.</p>
          <p>Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a explorar propiedades y hacer ofertas.</p>
          <div style="margin: 30px 0;">
            <a href="{{loginUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Iniciar Sesión</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
      `,
      variables: ['userName', 'loginUrl'],
      category: 'auth'
    });

    // Plantilla de oferta aceptada
    this.registerTemplate({
      id: 'offer_accepted',
      name: 'Oferta Aceptada',
      subject: '¡Tu oferta ha sido aceptada!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">¡Felicitaciones!</h1>
          <p>Tu oferta por la propiedad <strong>{{propertyAddress}}</strong> ha sido aceptada.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalles de la oferta:</h3>
            <p><strong>Precio ofrecido:</strong> {{offerPrice}}</p>
            <p><strong>Fecha de aceptación:</strong> {{acceptanceDate}}</p>
          </div>
          <p>El vendedor se pondrá en contacto contigo pronto para continuar con el proceso.</p>
          <div style="margin: 30px 0;">
            <a href="{{propertyUrl}}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Ver Propiedad</a>
          </div>
        </div>
      `,
      variables: ['propertyAddress', 'offerPrice', 'acceptanceDate', 'propertyUrl'],
      category: 'offers'
    });

    // Plantilla de alerta del sistema
    this.registerTemplate({
      id: 'system_alert',
      name: 'Alerta del Sistema',
      subject: 'Alerta del Sistema: {{alertTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #d97706; margin-top: 0;">⚠️ Alerta del Sistema</h2>
            <h3>{{alertTitle}}</h3>
            <p>{{alertMessage}}</p>
            <p style="color: #92400e; font-size: 14px;">
              <strong>Severidad:</strong> {{severity}}<br>
              <strong>Hora:</strong> {{timestamp}}
            </p>
          </div>
          <p>Esta es una notificación automática del sistema. Si necesitas asistencia, contacta al administrador.</p>
        </div>
      `,
      variables: ['alertTitle', 'alertMessage', 'severity', 'timestamp'],
      category: 'alerts'
    });

    // Plantilla de reporte semanal
    this.registerTemplate({
      id: 'weekly_report',
      name: 'Reporte Semanal',
      subject: 'Reporte Semanal - Plataforma Inmobiliaria',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Reporte Semanal</h1>
          <p>Aquí tienes un resumen de la actividad de la semana pasada:</p>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📊 Estadísticas Generales</h3>
            <ul>
              <li><strong>Nuevos usuarios:</strong> {{newUsers}}</li>
              <li><strong>Nuevas propiedades:</strong> {{newProperties}}</li>
              <li><strong>Ofertas realizadas:</strong> {{totalOffers}}</li>
              <li><strong>Transacciones completadas:</strong> {{completedTransactions}}</li>
            </ul>
          </div>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">💰 Rendimiento</h3>
            <ul>
              <li><strong>Ingresos totales:</strong> {{totalRevenue}}</li>
              <li><strong>Valor promedio de ofertas:</strong> {{averageOfferValue}}</li>
              <li><strong>Tasa de conversión:</strong> {{conversionRate}}%</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">⚙️ Sistema</h3>
            <ul>
              <li><strong>Uptime:</strong> {{systemUptime}}%</li>
              <li><strong>Errores del sistema:</strong> {{systemErrors}}</li>
              <li><strong>Backups realizados:</strong> {{backupsCount}}</li>
            </ul>
          </div>

          <div style="margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Ver Dashboard Completo</a>
          </div>
        </div>
      `,
      variables: ['newUsers', 'newProperties', 'totalOffers', 'completedTransactions', 'totalRevenue', 'averageOfferValue', 'conversionRate', 'systemUptime', 'systemErrors', 'backupsCount', 'dashboardUrl'],
      category: 'reports'
    });
  }

  registerTemplate(template: Omit<EmailTemplate, 'createdAt' | 'updatedAt'>): void {
    const fullTemplate: EmailTemplate = {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(template.id, fullTemplate);
  }

  getTemplate(templateId: string): EmailTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplates(category?: EmailCategory): EmailTemplate[] {
    const templates = Array.from(this.templates.values());
    return category ? templates.filter(t => t.category === category) : templates;
  }

  updateTemplate(templateId: string, updates: Partial<EmailTemplate>): void {
    const template = this.templates.get(templateId);
    if (template) {
      this.templates.set(templateId, {
        ...template,
        ...updates,
        updatedAt: new Date()
      });
    }
  }

  // ========================================================================
  // ENVÍO DE EMAILS
  // ========================================================================

  async sendEmail(message: Omit<EmailMessage, 'id'>): Promise<EmailResult> {
    if (!this.config.enabled) {
      return { success: false, error: 'Email service is disabled' };
    }

    // Verificar rate limits
    if (!this.checkRateLimit(message.to)) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: 60 * 60 * 1000 // 1 hora
      };
    }

    const emailMessage: EmailMessage = {
      id: this.generateEmailId(),
      ...message
    };

    // Procesar plantilla si se especifica
    if (emailMessage.templateId) {
      const processed = this.processTemplate(emailMessage);
      if (!processed) {
        return { success: false, error: 'Template processing failed' };
      }
      emailMessage.html = processed.html;
      emailMessage.subject = processed.subject;
      if (processed.text) emailMessage.text = processed.text;
    }

    // Agregar a cola de envío
    this.sendQueue.push(emailMessage);

    // Procesar inmediatamente si no hay cola
    if (!this.isProcessing) {
      this.processQueue();
    }

    // Log del envío
    console.log(`📧 Email queued: ${emailMessage.subject} to ${Array.isArray(emailMessage.to) ? emailMessage.to.join(', ') : emailMessage.to}`);

    return { success: true, messageId: emailMessage.id };
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.sendQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.sendQueue.length > 0) {
        const message = this.sendQueue.shift();
        if (message) {
          await this.sendEmailViaProvider(message);
          // Pequeña pausa entre envíos para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendEmailViaProvider(message: EmailMessage): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'smtp':
          await this.sendViaSMTP(message);
          break;
        case 'sendgrid':
          await this.sendViaSendGrid(message);
          break;
        case 'mailgun':
          await this.sendViaMailgun(message);
          break;
        case 'ses':
          await this.sendViaSES(message);
          break;
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }

      // Actualizar rate limits
      this.updateRateLimits(message.to);

      // Log de éxito
      console.log(`✅ Email sent: ${message.id} - ${message.subject}`);

    } catch (error) {
      console.error(`❌ Email send failed: ${message.id}`, error);

      // Reintentar más tarde (simulado)
      setTimeout(() => {
        this.sendQueue.unshift(message);
      }, 5 * 60 * 1000); // 5 minutos
    }
  }

  private async sendViaSMTP(message: EmailMessage): Promise<void> {
    // En producción, esto usaría nodemailer u otra librería SMTP
    // Aquí simulamos el envío

    if (!this.config.smtpConfig) {
      throw new Error('SMTP configuration missing');
    }

    // Simular validación
    if (!this.config.smtpConfig.auth.user || !this.config.smtpConfig.auth.pass) {
      throw new Error('SMTP credentials missing');
    }

    // Simular envío con delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simular error aleatorio (5% de probabilidad)
    if (Math.random() < 0.05) {
      throw new Error('SMTP connection failed');
    }
  }

  private async sendViaSendGrid(message: EmailMessage): Promise<void> {
    // Implementación SendGrid
    console.log('SendGrid sending not implemented in demo');
  }

  private async sendViaMailgun(message: EmailMessage): Promise<void> {
    // Implementación Mailgun
    console.log('Mailgun sending not implemented in demo');
  }

  private async sendViaSES(message: EmailMessage): Promise<void> {
    // Implementación AWS SES
    console.log('SES sending not implemented in demo');
  }

  // ========================================================================
  // PROCESAMIENTO DE PLANTILLAS
  // ========================================================================

  private processTemplate(message: EmailMessage): { html: string; subject: string; text?: string } | null {
    const template = this.templates.get(message.templateId!);
    if (!template) return null;

    let html = template.html;
    let subject = template.subject;
    let text = template.text;

    // Reemplazar variables
    const variables = message.variables || {};

    // Función de reemplazo
    const replaceVariables = (content: string): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] !== undefined ? String(variables[varName]) : match;
      });
    };

    html = replaceVariables(html);
    subject = replaceVariables(subject);
    if (text) text = replaceVariables(text);

    return { html, subject, text };
  }

  // ========================================================================
  // RATE LIMITING
  // ========================================================================

  private checkRateLimit(recipient: string | string[]): boolean {
    const recipients = Array.isArray(recipient) ? recipient : [recipient];
    const now = new Date();

    // Reset daily counters if needed
    if (now.getDate() !== this.rateLimitTracker.lastReset.getDate()) {
      this.rateLimitTracker.daily.clear();
      this.rateLimitTracker.lastReset = now;
    }

    // Reset hourly counters if needed
    if (now.getHours() !== this.rateLimitTracker.lastReset.getHours()) {
      this.rateLimitTracker.hourly.clear();
    }

    for (const email of recipients) {
      const hourlyCount = this.rateLimitTracker.hourly.get(email) || 0;
      const dailyCount = this.rateLimitTracker.daily.get(email) || 0;

      if (hourlyCount >= this.config.rateLimit.maxPerHour ||
          dailyCount >= this.config.rateLimit.maxPerDay) {
        return false;
      }
    }

    return true;
  }

  private updateRateLimits(recipient: string | string[]): void {
    const recipients = Array.isArray(recipient) ? recipient : [recipient];

    for (const email of recipients) {
      this.rateLimitTracker.hourly.set(
        email,
        (this.rateLimitTracker.hourly.get(email) || 0) + 1
      );
      this.rateLimitTracker.daily.set(
        email,
        (this.rateLimitTracker.daily.get(email) || 0) + 1
      );
    }
  }

  private resetRateLimits(): void {
    const now = new Date();

    // Reset hourly
    if (now.getHours() !== this.rateLimitTracker.lastReset.getHours()) {
      this.rateLimitTracker.hourly.clear();
    }

    // Reset daily
    if (now.getDate() !== this.rateLimitTracker.lastReset.getDate()) {
      this.rateLimitTracker.daily.clear();
      this.rateLimitTracker.lastReset = now;
    }
  }

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  updateConfig(newConfig: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): EmailConfig {
    return { ...this.config };
  }

  getQueueLength(): number {
    return this.sendQueue.length;
  }

  getStats(): EmailStats {
    // En producción, estos datos vendrían de la base de datos o servicio externo
    return {
      sent: 1250,
      delivered: 1200,
      bounced: 25,
      complained: 5,
      opened: 450,
      clicked: 125,
      unsubscribed: 15
    };
  }

  // Método para envío masivo (con precauciones)
  async sendBulkEmails(
    messages: Omit<EmailMessage, 'id'>[],
    batchSize: number = 10,
    delayMs: number = 1000
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      const batchPromises = batch.map(message => this.sendEmail(message));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay entre batches
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  destroy(): void {
    this.sendQueue = [];
    this.templates.clear();
    this.isProcessing = false;
    console.log('💥 Email Service destruido');
  }
}

// Instancia global
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

// Funciones de conveniencia
export const emailService = {
  // Envío directo
  send: (message: Omit<EmailMessage, 'id'>) => getEmailService().sendEmail(message),

  // Envío con plantilla
  sendTemplate: (
    templateId: string,
    to: string | string[],
    variables: Record<string, any>,
    overrides?: Partial<EmailMessage>
  ) => {
    return getEmailService().sendEmail({
      to,
      templateId,
      variables,
      category: 'notifications',
      priority: 'normal',
      from: getEmailService().getConfig().defaultFrom,
      ...overrides
    });
  },

  // Notificaciones comunes
  sendWelcome: (to: string, userName: string) => {
    return emailService.sendTemplate('welcome', to, {
      userName,
      loginUrl: `${window.location.origin}/login`
    }, {
      category: 'auth',
      priority: 'high'
    });
  },

  sendOfferAccepted: (to: string, offerData: any) => {
    return emailService.sendTemplate('offer_accepted', to, offerData, {
      category: 'offers',
      priority: 'urgent'
    });
  },

  sendSystemAlert: (to: string | string[], alertData: any) => {
    return emailService.sendTemplate('system_alert', to, alertData, {
      category: 'alerts',
      priority: 'high'
    });
  },

  sendWeeklyReport: (to: string, reportData: any) => {
    return emailService.sendTemplate('weekly_report', to, reportData, {
      category: 'reports',
      priority: 'normal'
    });
  }
};

export default getEmailService;


