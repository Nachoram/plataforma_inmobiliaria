import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Settings,
  BarChart3,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Edit,
  Plus,
  Trash2,
  Eye,
  Copy,
  RefreshCw
} from 'lucide-react';
import { getEmailService, EmailTemplate, EmailStats, EmailConfig } from '../../lib/emailService';

interface EmailManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailManager: React.FC<EmailManagerProps> = ({ isOpen, onClose }) => {
  const emailService = getEmailService();
  const [activeTab, setActiveTab] = useState<'templates' | 'stats' | 'settings' | 'send'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [config, setConfig] = useState<EmailConfig>(emailService.getConfig());
  const [loading, setLoading] = useState(false);

  // Estados para envío de email
  const [sendForm, setSendForm] = useState({
    to: '',
    templateId: '',
    subject: '',
    message: '',
    variables: {} as Record<string, string>
  });

  // Estados para edición de plantillas
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    subject: '',
    html: '',
    text: '',
    variables: [] as string[],
    category: 'notifications' as any
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const templatesData = emailService.getTemplates();
      const statsData = emailService.getStats();
      const configData = emailService.getConfig();

      setTemplates(templatesData);
      setStats(statsData);
      setConfig(configData);
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendForm.to || !sendForm.subject || !sendForm.message) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const result = await emailService.sendEmail({
        to: sendForm.to,
        subject: sendForm.subject,
        html: sendForm.message,
        text: sendForm.message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        category: 'notifications',
        priority: 'normal',
        from: config.defaultFrom,
        variables: sendForm.variables
      });

      if (result.success) {
        alert('Email enviado exitosamente');
        setSendForm({
          to: '',
          templateId: '',
          subject: '',
          message: '',
          variables: {}
        });
      } else {
        alert(`Error al enviar email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar el email');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSendForm(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        variables: template.variables.reduce((acc, varName) => ({
          ...acc,
          [varName]: prev.variables[varName] || ''
        }), {})
      }));
    }
  };

  const handleSaveTemplate = () => {
    if (!templateForm.id || !templateForm.name || !templateForm.subject || !templateForm.html) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      if (editingTemplate) {
        // Actualizar plantilla existente
        emailService.updateTemplate(editingTemplate.id, {
          name: templateForm.name,
          subject: templateForm.subject,
          html: templateForm.html,
          text: templateForm.text,
          variables: templateForm.variables,
          category: templateForm.category
        });
      } else {
        // Crear nueva plantilla
        emailService.registerTemplate({
          id: templateForm.id,
          name: templateForm.name,
          subject: templateForm.subject,
          html: templateForm.html,
          text: templateForm.text,
          variables: templateForm.variables,
          category: templateForm.category
        });
      }

      loadData();
      setEditingTemplate(null);
      setTemplateForm({
        id: '',
        name: '',
        subject: '',
        html: '',
        text: '',
        variables: [],
        category: 'notifications'
      });
      alert(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error al guardar la plantilla');
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      id: template.id,
      name: template.name,
      subject: template.subject,
      html: template.html,
      text: template.text || '',
      variables: template.variables,
      category: template.category
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      // Nota: La API no tiene método delete, así que esto es solo visual
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleUpdateConfig = (newConfig: Partial<EmailConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    emailService.updateConfig(newConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6" />
            <h2 className="text-xl font-bold">Administrador de Email</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Actualizar datos"
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
          <nav className="flex">
            {[
              { id: 'templates', label: 'Plantillas', icon: FileText },
              { id: 'send', label: 'Enviar Email', icon: Send },
              { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
              { id: 'settings', label: 'Configuración', icon: Settings }
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
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Plantillas de Email</h3>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({
                      id: '',
                      name: '',
                      subject: '',
                      html: '',
                      text: '',
                      variables: [],
                      category: 'notifications'
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Plantilla
                </button>
              </div>

              {/* Template Form */}
              {(editingTemplate || templateForm.id) && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border">
                  <h4 className="font-semibold mb-4">
                    {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">ID</label>
                      <input
                        type="text"
                        value={templateForm.id}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, id: e.target.value }))}
                        disabled={!!editingTemplate}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        placeholder="template_id"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre</label>
                      <input
                        type="text"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Nombre de la plantilla"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Categoría</label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="auth">Autenticación</option>
                        <option value="offers">Ofertas</option>
                        <option value="system">Sistema</option>
                        <option value="marketing">Marketing</option>
                        <option value="notifications">Notificaciones</option>
                        <option value="alerts">Alertas</option>
                        <option value="reports">Reportes</option>
                        <option value="backups">Backups</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Asunto</label>
                      <input
                        type="text"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Asunto del email"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Variables</label>
                    <input
                      type="text"
                      value={templateForm.variables.join(', ')}
                      onChange={(e) => setTemplateForm(prev => ({
                        ...prev,
                        variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="variable1, variable2, variable3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variables disponibles: {templateForm.variables.join(', ')}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">HTML</label>
                    <textarea
                      value={templateForm.html}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, html: e.target.value }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="<div>Hola {{userName}}...</div>"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Texto Plano (opcional)</label>
                    <textarea
                      value={templateForm.text}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, text: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="Hola {{userName}}..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTemplate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
                    </button>
                    <button
                      onClick={() => {
                        setEditingTemplate(null);
                        setTemplateForm({
                          id: '',
                          name: '',
                          subject: '',
                          html: '',
                          text: '',
                          variables: [],
                          category: 'notifications'
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Templates List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.category === 'auth' ? 'bg-purple-100 text-purple-800' :
                        template.category === 'offers' ? 'bg-green-100 text-green-800' :
                        template.category === 'alerts' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {template.category}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {template.subject}
                    </p>

                    <div className="text-xs text-gray-500 mb-3">
                      Variables: {template.variables.join(', ') || 'Ninguna'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Email Tab */}
          {activeTab === 'send' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold">Enviar Email</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Destinatario</label>
                  <input
                    type="email"
                    value={sendForm.to}
                    onChange={(e) => setSendForm(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Plantilla (opcional)</label>
                  <select
                    value={sendForm.templateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Asunto</label>
                  <input
                    type="text"
                    value={sendForm.subject}
                    onChange={(e) => setSendForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Asunto del email"
                  />
                </div>

                {sendForm.templateId && sendForm.variables && Object.keys(sendForm.variables).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Variables</label>
                    <div className="space-y-2">
                      {Object.keys(sendForm.variables).map(varName => (
                        <div key={varName} className="flex gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-24">
                            {varName}:
                          </span>
                          <input
                            type="text"
                            value={sendForm.variables[varName]}
                            onChange={(e) => setSendForm(prev => ({
                              ...prev,
                              variables: { ...prev.variables, [varName]: e.target.value }
                            }))}
                            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder={`Valor para ${varName}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Mensaje HTML</label>
                  <textarea
                    value={sendForm.message}
                    onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="<div>Hola...</div>"
                  />
                </div>

                <button
                  onClick={handleSendEmail}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Enviar Email
                </button>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Estadísticas de Email</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.sent.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Enviados</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.delivered.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Entregados</div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.opened.toLocaleString()}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Abiertos</div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.clicked.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Clicks</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {stats.bounced}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Rebotados</div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.complained}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Quejas</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
                    {stats.unsubscribed}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Desuscritos</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold mb-4">Métricas de Rendimiento</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tasa de Entrega:</span>
                    <span className="ml-2 font-medium">
                      {((stats.delivered / stats.sent) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tasa de Apertura:</span>
                    <span className="ml-2 font-medium">
                      {((stats.opened / stats.delivered) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tasa de Click:</span>
                    <span className="ml-2 font-medium">
                      {((stats.clicked / stats.delivered) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tasa de Rebotado:</span>
                    <span className="ml-2 font-medium">
                      {((stats.bounced / stats.sent) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold">Configuración de Email</h3>

              <div className="space-y-6">
                {/* Servicio Habilitado */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Servicio de Email</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Habilitar/deshabilitar el envío de emails
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleUpdateConfig({ enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium mb-2">Proveedor de Email</label>
                  <select
                    value={config.provider}
                    onChange={(e) => handleUpdateConfig({ provider: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">AWS SES</option>
                  </select>
                </div>

                {/* Configuración SMTP */}
                {config.provider === 'smtp' && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium">Configuración SMTP</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Host</label>
                        <input
                          type="text"
                          value={config.smtpConfig?.host || ''}
                          onChange={(e) => handleUpdateConfig({
                            smtpConfig: { ...config.smtpConfig!, host: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="smtp.example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Puerto</label>
                        <input
                          type="number"
                          value={config.smtpConfig?.port || 587}
                          onChange={(e) => handleUpdateConfig({
                            smtpConfig: { ...config.smtpConfig!, port: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Usuario</label>
                        <input
                          type="text"
                          value={config.smtpConfig?.auth.user || ''}
                          onChange={(e) => handleUpdateConfig({
                            smtpConfig: {
                              ...config.smtpConfig!,
                              auth: { ...config.smtpConfig!.auth, user: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Contraseña</label>
                        <input
                          type="password"
                          value={config.smtpConfig?.auth.pass || ''}
                          onChange={(e) => handleUpdateConfig({
                            smtpConfig: {
                              ...config.smtpConfig!,
                              auth: { ...config.smtpConfig!.auth, pass: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email por Defecto */}
                <div className="space-y-4">
                  <h4 className="font-medium">Email Remitente por Defecto</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={config.defaultFrom.email}
                        onChange={(e) => handleUpdateConfig({
                          defaultFrom: { ...config.defaultFrom, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre</label>
                      <input
                        type="text"
                        value={config.defaultFrom.name}
                        onChange={(e) => handleUpdateConfig({
                          defaultFrom: { ...config.defaultFrom, name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Rate Limiting */}
                <div className="space-y-4">
                  <h4 className="font-medium">Límite de Envío</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Máximo por hora</label>
                      <input
                        type="number"
                        value={config.rateLimit.maxPerHour}
                        onChange={(e) => handleUpdateConfig({
                          rateLimit: { ...config.rateLimit, maxPerHour: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Máximo por día</label>
                      <input
                        type="number"
                        value={config.rateLimit.maxPerDay}
                        onChange={(e) => handleUpdateConfig({
                          rateLimit: { ...config.rateLimit, maxPerDay: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



