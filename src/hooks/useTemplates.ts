import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[]; // Para type 'select'
  placeholder?: string;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: 'email' | 'sms' | 'document' | 'contract' | 'notification' | 'message';
  type: 'text' | 'html' | 'markdown' | 'pdf';
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  isPublic: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateInstance {
  templateId: string;
  variables: Record<string, any>;
  renderedContent: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templates: Template[];
}

/**
 * Hook personalizado para gestión de plantillas
 */
export const useTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cargar plantillas
  const loadTemplates = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Cargar plantillas del usuario y públicas
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .or(`created_by.eq.${user.id},is_public.eq.true`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const loadedTemplates: Template[] = (data || []).map(template => ({
        ...template,
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.updated_at),
        lastUsedAt: template.last_used_at ? new Date(template.last_used_at) : undefined
      }));

      setTemplates(loadedTemplates);

      // Organizar por categorías
      const categorizedTemplates = loadedTemplates.reduce((acc, template) => {
        const category = acc.find(cat => cat.id === template.category);
        if (category) {
          category.templates.push(template);
        } else {
          acc.push({
            id: template.category,
            name: getCategoryName(template.category),
            description: getCategoryDescription(template.category),
            icon: getCategoryIcon(template.category),
            color: getCategoryColor(template.category),
            templates: [template]
          });
        }
        return acc;
      }, [] as TemplateCategory[]);

      setCategories(categorizedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Crear plantilla
  const createTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          ...templateData,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      const newTemplate: Template = {
        ...data,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined
      };

      setTemplates(prev => [newTemplate, ...prev]);

      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }, [user]);

  // Actualizar plantilla
  const updateTemplate = useCallback(async (templateId: string, updates: Partial<Omit<Template, 'id' | 'createdBy' | 'createdAt' | 'usageCount'>>) => {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      const updatedTemplate: Template = {
        ...data,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined
      };

      setTemplates(prev => prev.map(template =>
        template.id === templateId ? updatedTemplate : template
      ));

      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }, []);

  // Eliminar plantilla
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(template => template.id !== templateId));

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }, []);

  // Incrementar contador de uso
  const incrementUsageCount = useCallback(async (templateId: string) => {
    try {
      const { error } = await supabase.rpc('increment_template_usage', {
        template_id: templateId
      });

      if (error) throw error;

      setTemplates(prev => prev.map(template =>
        template.id === templateId
          ? { ...template, usageCount: template.usageCount + 1, lastUsedAt: new Date() }
          : template
      ));
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
  }, []);

  // Renderizar plantilla con variables
  const renderTemplate = useCallback((template: Template, variables: Record<string, any>): string => {
    let content = template.content;

    // Reemplazar variables en el contenido
    template.variables.forEach(variable => {
      const value = variables[variable.key] ?? variable.defaultValue ?? '';
      const placeholder = `{{${variable.key}}}`;

      if (variable.type === 'date' && value) {
        const dateValue = new Date(value);
        content = content.replace(new RegExp(placeholder, 'g'),
          dateValue.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        );
      } else if (variable.type === 'currency' && value) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        content = content.replace(new RegExp(placeholder, 'g'),
          `$${numValue.toLocaleString('es-CL')}`
        );
      } else {
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });

    return content;
  }, []);

  // Validar variables requeridas
  const validateTemplateVariables = useCallback((template: Template, variables: Record<string, any>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    template.variables.forEach(variable => {
      const value = variables[variable.key];

      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push(`La variable "${variable.label}" es requerida`);
      }

      if (value !== undefined && value !== null && value !== '') {
        switch (variable.type) {
          case 'number':
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (isNaN(numValue)) {
              errors.push(`La variable "${variable.label}" debe ser un número válido`);
            }
            break;
          case 'date':
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              errors.push(`La variable "${variable.label}" debe ser una fecha válida`);
            }
            break;
          case 'select':
            if (variable.options && !variable.options.some(opt => opt.value === value)) {
              errors.push(`La variable "${variable.label}" debe ser una opción válida`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`La variable "${variable.label}" debe ser verdadero o falso`);
            }
            break;
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }, []);

  // Usar plantilla (renderizar y registrar uso)
  const useTemplate = useCallback(async (template: Template, variables: Record<string, any>): Promise<TemplateInstance | null> => {
    try {
      // Validar variables
      const validation = validateTemplateVariables(template, variables);
      if (!validation.valid) {
        console.error('Template validation failed:', validation.errors);
        return null;
      }

      // Renderizar contenido
      const renderedContent = renderTemplate(template, variables);

      // Registrar uso
      await incrementUsageCount(template.id);

      return {
        templateId: template.id,
        variables,
        renderedContent
      };
    } catch (error) {
      console.error('Error using template:', error);
      return null;
    }
  }, [validateTemplateVariables, renderTemplate, incrementUsageCount]);

  // Obtener plantillas por categoría
  const getTemplatesByCategory = useCallback((category: Template['category']) => {
    return templates.filter(template => template.category === category);
  }, [templates]);

  // Obtener plantillas por tags
  const getTemplatesByTags = useCallback((tags: string[]) => {
    return templates.filter(template =>
      tags.some(tag => template.tags.includes(tag))
    );
  }, [templates]);

  // Buscar plantillas
  const searchTemplates = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [templates]);

  // Obtener plantillas más usadas
  const getMostUsedTemplates = useCallback((limit = 10) => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [templates]);

  // Obtener plantillas recientes
  const getRecentTemplates = useCallback((limit = 10) => {
    return [...templates]
      .sort((a, b) => (b.lastUsedAt?.getTime() || 0) - (a.lastUsedAt?.getTime() || 0))
      .slice(0, limit);
  }, [templates]);

  // Plantillas filtradas por categoría seleccionada
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter(template => template.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Cargar plantillas al montar
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    // Estado
    templates,
    filteredTemplates,
    categories,
    loading,
    selectedCategory,

    // Acciones CRUD
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,

    // Uso de plantillas
    renderTemplate,
    validateTemplateVariables,
    useTemplate,

    // Búsqueda y filtrado
    getTemplatesByCategory,
    getTemplatesByTags,
    searchTemplates,
    setSelectedCategory,

    // Estadísticas
    getMostUsedTemplates,
    getRecentTemplates,

    // Utilidades
    incrementUsageCount
  };
};

// Funciones auxiliares para categorías
function getCategoryName(category: Template['category']): string {
  const names = {
    email: 'Correos Electrónicos',
    sms: 'Mensajes SMS',
    document: 'Documentos',
    contract: 'Contratos',
    notification: 'Notificaciones',
    message: 'Mensajes'
  };
  return names[category] || category;
}

function getCategoryDescription(category: Template['category']): string {
  const descriptions = {
    email: 'Plantillas para correos electrónicos profesionales',
    sms: 'Mensajes de texto cortos y efectivos',
    document: 'Documentos legales y administrativos',
    contract: 'Contratos y acuerdos formales',
    notification: 'Alertas y notificaciones del sistema',
    message: 'Mensajes internos y comunicaciones'
  };
  return descriptions[category] || '';
}

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

function getCategoryColor(category: Template['category']): string {
  const colors = {
    email: '#3B82F6',
    sms: '#10B981',
    document: '#F59E0B',
    contract: '#EF4444',
    notification: '#8B5CF6',
    message: '#06B6D4'
  };
  return colors[category] || '#6B7280';
}



