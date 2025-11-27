import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Eye,
  Star,
  Tag,
  Calendar,
  Download,
  Upload,
  X
} from 'lucide-react';
import { useTemplates, Template, TemplateVariable } from '../../hooks/useTemplates';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: Template) => void;
  mode?: 'manage' | 'select'; // manage: gestionar plantillas, select: seleccionar para usar
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  mode = 'manage'
}) => {
  const {
    templates,
    filteredTemplates,
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    useTemplate
  } = useTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, any>>({});

  // Filtrar plantillas por búsqueda
  const searchedTemplates = useMemo(() => {
    if (!searchQuery) return filteredTemplates;
    return searchTemplates(searchQuery);
  }, [filteredTemplates, searchTemplates, searchQuery]);

  const handleCreateTemplate = async (templateData: Partial<Template>) => {
    const newTemplate = await createTemplate(templateData as any);
    if (newTemplate) {
      setShowCreateForm(false);
    }
  };

  const handleEditTemplate = async (templateId: string, updates: Partial<Template>) => {
    const updated = await updateTemplate(templateId, updates);
    if (updated) {
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      await deleteTemplate(templateId);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    if (mode === 'select') {
      onSelectTemplate?.(template);
      onClose();
    } else {
      setPreviewTemplate(template);
      // Reset variables
      const initialVars: Record<string, any> = {};
      template.variables.forEach(variable => {
        initialVars[variable.key] = variable.defaultValue || '';
      });
      setTemplateVariables(initialVars);
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    const initialVars: Record<string, any> = {};
    template.variables.forEach(variable => {
      initialVars[variable.key] = variable.defaultValue || '';
    });
    setTemplateVariables(initialVars);
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = templateVariables[variable.key] || '';

    switch (variable.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable.key]: e.target.value }))}
            placeholder={variable.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={variable.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable.key]: e.target.value }))}
            placeholder={variable.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={variable.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable.key]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={variable.required}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable.key]: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{variable.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [variable.key]: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={variable.required}
          >
            <option value="">Seleccionar...</option>
            {variable.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <h2 className="text-xl font-bold">
              {mode === 'select' ? 'Seleccionar Plantilla' : 'Gestión de Plantillas'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'manage' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nueva Plantilla
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando plantillas...</span>
            </div>
          ) : searchedTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No se encontraron plantillas' : 'No hay plantillas disponibles'}
              </h3>
              <p>
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : mode === 'manage' ? 'Crea tu primera plantilla para comenzar' : 'No hay plantillas disponibles para seleccionar'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchedTemplates.map(template => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => mode === 'select' ? handleUseTemplate(template) : handlePreviewTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>

                    {template.isDefault && (
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{template.usageCount} usos</span>
                    <span>
                      {template.lastUsedAt
                        ? `Último uso: ${template.lastUsedAt.toLocaleDateString()}`
                        : 'Nunca usado'
                      }
                    </span>
                  </div>

                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{template.tags.length - 3} más
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewTemplate(template);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Vista previa"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {mode === 'manage' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplate(template);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implementar duplicar plantilla
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        mode === 'select'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mode === 'select' ? 'Seleccionar' : 'Usar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <TemplatePreviewModal
            template={previewTemplate}
            variables={templateVariables}
            onVariablesChange={setTemplateVariables}
            onClose={() => setPreviewTemplate(null)}
            onUse={async () => {
              const result = await useTemplate(previewTemplate, templateVariables);
              if (result) {
                setPreviewTemplate(null);
                // TODO: Hacer algo con el resultado renderizado
                console.log('Template rendered:', result.renderedContent);
              }
            }}
          />
        )}

        {/* Create/Edit Modal */}
        {(showCreateForm || editingTemplate) && (
          <TemplateFormModal
            template={editingTemplate}
            onSave={editingTemplate ? handleEditTemplate : handleCreateTemplate}
            onClose={() => {
              setShowCreateForm(false);
              setEditingTemplate(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Componente para vista previa de plantilla
const TemplatePreviewModal: React.FC<{
  template: Template;
  variables: Record<string, any>;
  onVariablesChange: (variables: Record<string, any>) => void;
  onClose: () => void;
  onUse: () => void;
}> = ({ template, variables, onVariablesChange, onClose, onUse }) => {
  // TODO: Implementar renderizado de preview
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Vista Previa: {template.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variables */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Variables</h3>
              <div className="space-y-4">
                {template.variables.map(variable => (
                  <div key={variable.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderVariableInput(variable, variables, onVariablesChange)}
                    {variable.description && (
                      <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-64">
                {/* TODO: Renderizar preview del template */}
                <pre className="whitespace-pre-wrap text-sm">
                  {template.content}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cerrar
          </button>
          <button onClick={onUse} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Usar Plantilla
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para crear/editar plantillas
const TemplateFormModal: React.FC<{
  template?: Template | null;
  onSave: (templateId: string, data: Partial<Template>) => void | ((data: Partial<Template>) => void);
  onClose: () => void;
}> = ({ template, onSave, onClose }) => {
  // TODO: Implementar formulario completo para crear/editar plantillas
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>
          {/* TODO: Implementar formulario completo */}
          <p className="text-gray-600">Formulario en desarrollo...</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg">
              Cancelar
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para renderizar inputs de variables
function renderVariableInput(
  variable: TemplateVariable,
  variables: Record<string, any>,
  onChange: (variables: Record<string, any>) => void
) {
  const value = variables[variable.key] || '';

  switch (variable.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange({ ...variables, [variable.key]: e.target.value })}
          placeholder={variable.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={variable.required}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange({ ...variables, [variable.key]: e.target.value })}
          placeholder={variable.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={variable.required}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange({ ...variables, [variable.key]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={variable.required}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange({ ...variables, [variable.key]: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{variable.label}</span>
        </label>
      );

    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onChange({ ...variables, [variable.key]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={variable.required}
        >
          <option value="">Seleccionar...</option>
          {variable.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    default:
      return null;
  }
}

// Función auxiliar para obtener icono de categoría
function getCategoryIcon(category: Template['category']): string {
  const icons = {
    email: '📧',
    sms: '💬',
    document: '📄',
    contract: '📋',
    notification: '🔔',
    message: '💭'
  };
  return icons[category] || '📝';
}
