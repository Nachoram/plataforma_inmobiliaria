import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export type Language = 'es' | 'en';
export type TranslationKey = string;

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export interface LanguageConfig {
  code: Language;
  name: string;
  flag: string;
  rtl: boolean;
}

// Configuración de idiomas disponibles
export const AVAILABLE_LANGUAGES: LanguageConfig[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false }
];

// Traducciones por defecto
const DEFAULT_TRANSLATIONS: Record<Language, TranslationDictionary> = {
  es: {
    // Navegación
    'nav.dashboard': 'Panel',
    'nav.properties': 'Propiedades',
    'nav.offers': 'Ofertas',
    'nav.calendar': 'Calendario',
    'nav.templates': 'Plantillas',
    'nav.settings': 'Configuración',

    // Acciones comunes
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',

    // Estados
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.approved': 'Aprobado',
    'status.rejected': 'Rechazado',
    'status.completed': 'Completado',
    'status.cancelled': 'Cancelado',

    // Mensajes de error
    'error.generic': 'Ha ocurrido un error inesperado',
    'error.network': 'Error de conexión',
    'error.validation': 'Datos inválidos',
    'error.permission': 'No tienes permisos para esta acción',
    'error.not_found': 'Elemento no encontrado',

    // Dashboard
    'dashboard.welcome': 'Bienvenido al Panel',
    'dashboard.stats': 'Estadísticas',
    'dashboard.recent_activity': 'Actividad Reciente',
    'dashboard.quick_actions': 'Acciones Rápidas',

    // Ofertas
    'offers.title': 'Gestión de Ofertas',
    'offers.create': 'Crear Nueva Oferta',
    'offers.details': 'Detalles de la Oferta',
    'offers.status': 'Estado',
    'offers.property': 'Propiedad',
    'offers.buyer': 'Comprador',
    'offers.seller': 'Vendedor',
    'offers.price': 'Precio',
    'offers.date': 'Fecha',

    // Calendario
    'calendar.title': 'Calendario',
    'calendar.today': 'Hoy',
    'calendar.month': 'Mes',
    'calendar.week': 'Semana',
    'calendar.day': 'Día',
    'calendar.agenda': 'Agenda',
    'calendar.event': 'Evento',
    'calendar.meeting': 'Reunión',
    'calendar.deadline': 'Fecha límite',
    'calendar.reminder': 'Recordatorio',

    // Plantillas
    'templates.title': 'Gestión de Plantillas',
    'templates.create': 'Crear Plantilla',
    'templates.edit': 'Editar Plantilla',
    'templates.delete': 'Eliminar Plantilla',
    'templates.use': 'Usar Plantilla',
    'templates.preview': 'Vista Previa',

    // Configuración
    'settings.title': 'Configuración',
    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'settings.notifications': 'Notificaciones',
    'settings.profile': 'Perfil',
    'settings.security': 'Seguridad',

    // Tema
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'theme.auto': 'Automático',
    'theme.colors': 'Colores',
    'theme.settings': 'Configuración de Tema',

    // Notificaciones
    'notifications.title': 'Notificaciones',
    'notifications.settings': 'Configuración',
    'notifications.mark_read': 'Marcar como leída',
    'notifications.mark_all_read': 'Marcar todas como leídas',
    'notifications.clear': 'Limpiar',

    // Formularios
    'form.required': 'Campo requerido',
    'form.optional': 'Opcional',
    'form.submit': 'Enviar',
    'form.reset': 'Reiniciar',
    'form.save_draft': 'Guardar borrador',

    // Mensajes de confirmación
    'confirm.delete': '¿Estás seguro de que quieres eliminar este elemento?',
    'confirm.save': '¿Quieres guardar los cambios?',
    'confirm.exit': '¿Quieres salir sin guardar?',

    // Fechas
    'date.today': 'Hoy',
    'date.yesterday': 'Ayer',
    'date.tomorrow': 'Mañana',
    'date.days_ago': 'hace {{count}} días',
    'date.days_from_now': 'en {{count}} días',
    'date.months_ago': 'hace {{count}} meses',
    'date.months_from_now': 'en {{count}} meses'
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.properties': 'Properties',
    'nav.offers': 'Offers',
    'nav.calendar': 'Calendar',
    'nav.templates': 'Templates',
    'nav.settings': 'Settings',

    // Common actions
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',

    // Status
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',

    // Error messages
    'error.generic': 'An unexpected error occurred',
    'error.network': 'Connection error',
    'error.validation': 'Invalid data',
    'error.permission': 'You do not have permissions for this action',
    'error.not_found': 'Item not found',

    // Dashboard
    'dashboard.welcome': 'Welcome to Dashboard',
    'dashboard.stats': 'Statistics',
    'dashboard.recent_activity': 'Recent Activity',
    'dashboard.quick_actions': 'Quick Actions',

    // Offers
    'offers.title': 'Offer Management',
    'offers.create': 'Create New Offer',
    'offers.details': 'Offer Details',
    'offers.status': 'Status',
    'offers.property': 'Property',
    'offers.buyer': 'Buyer',
    'offers.seller': 'Seller',
    'offers.price': 'Price',
    'offers.date': 'Date',

    // Calendar
    'calendar.title': 'Calendar',
    'calendar.today': 'Today',
    'calendar.month': 'Month',
    'calendar.week': 'Week',
    'calendar.day': 'Day',
    'calendar.agenda': 'Agenda',
    'calendar.event': 'Event',
    'calendar.meeting': 'Meeting',
    'calendar.deadline': 'Deadline',
    'calendar.reminder': 'Reminder',

    // Templates
    'templates.title': 'Template Management',
    'templates.create': 'Create Template',
    'templates.edit': 'Edit Template',
    'templates.delete': 'Delete Template',
    'templates.use': 'Use Template',
    'templates.preview': 'Preview',

    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.profile': 'Profile',
    'settings.security': 'Security',

    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'Auto',
    'theme.colors': 'Colors',
    'theme.settings': 'Theme Settings',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.settings': 'Settings',
    'notifications.mark_read': 'Mark as read',
    'notifications.mark_all_read': 'Mark all as read',
    'notifications.clear': 'Clear',

    // Forms
    'form.required': 'Required field',
    'form.optional': 'Optional',
    'form.submit': 'Submit',
    'form.reset': 'Reset',
    'form.save_draft': 'Save draft',

    // Confirmation messages
    'confirm.delete': 'Are you sure you want to delete this item?',
    'confirm.save': 'Do you want to save the changes?',
    'confirm.exit': 'Do you want to exit without saving?',

    // Dates
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
    'date.tomorrow': 'Tomorrow',
    'date.days_ago': '{{count}} days ago',
    'date.days_from_now': 'in {{count}} days',
    'date.months_ago': '{{count}} months ago',
    'date.months_from_now': 'in {{count}} months'
  }
};

/**
 * Hook personalizado para internacionalización
 */
export const useTranslation = () => {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es');
  const [customTranslations, setCustomTranslations] = useState<Record<Language, TranslationDictionary>>({
    es: {},
    en: {}
  });

  // Cargar configuración de idioma del usuario
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user) {
        // Cargar del localStorage para usuarios no autenticados
        const saved = localStorage.getItem('language');
        if (saved && AVAILABLE_LANGUAGES.find(lang => lang.code === saved)) {
          setCurrentLanguage(saved as Language);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_language_settings')
          .select('language')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading language settings:', error);
          return;
        }

        if (data && AVAILABLE_LANGUAGES.find(lang => lang.code === data.language)) {
          setCurrentLanguage(data.language);
        } else {
          // Establecer idioma por defecto para el usuario
          await saveUserLanguage('es');
        }
      } catch (error) {
        console.error('Error loading language settings:', error);
      }
    };

    loadUserLanguage();
  }, [user]);

  // Cargar traducciones personalizadas
  useEffect(() => {
    const loadCustomTranslations = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_custom_translations')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading custom translations:', error);
          return;
        }

        const translationsByLang: Record<Language, TranslationDictionary> = {
          es: {},
          en: {}
        };

        data?.forEach((item: any) => {
          if (translationsByLang[item.language as Language]) {
            setNestedValue(translationsByLang[item.language as Language], item.key, item.value);
          }
        });

        setCustomTranslations(translationsByLang);
      } catch (error) {
        console.error('Error loading custom translations:', error);
      }
    };

    loadCustomTranslations();
  }, [user]);

  // Guardar configuración de idioma
  const saveUserLanguage = useCallback(async (language: Language) => {
    if (!user) {
      localStorage.setItem('language', language);
      return;
    }

    try {
      const { error } = await supabase
        .from('user_language_settings')
        .upsert({
          user_id: user.id,
          language,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving language settings:', error);
    }
  }, [user]);

  // Cambiar idioma
  const changeLanguage = useCallback(async (language: Language) => {
    setCurrentLanguage(language);
    await saveUserLanguage(language);

    // Actualizar atributo lang del documento
    document.documentElement.lang = language;
  }, [saveUserLanguage]);

  // Traducir texto
  const t = useCallback((key: TranslationKey, variables?: Record<string, any>): string => {
    // Combinar traducciones por defecto con personalizadas
    const defaultTranslations = DEFAULT_TRANSLATIONS[currentLanguage] || {};
    const userTranslations = customTranslations[currentLanguage] || {};
    const allTranslations = { ...defaultTranslations, ...userTranslations };

    // Obtener el valor de la clave
    const value = getNestedValue(allTranslations, key);

    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found for language "${currentLanguage}"`);
      return key; // Devolver la clave si no se encuentra traducción
    }

    // Reemplazar variables en el texto
    let translatedText = value;
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        translatedText = translatedText.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      });
    }

    return translatedText;
  }, [currentLanguage, customTranslations]);

  // Traducir con pluralización
  const tPlural = useCallback((key: TranslationKey, count: number, variables?: Record<string, any>): string => {
    const pluralKey = count === 1 ? key : `${key}_plural`;
    return t(pluralKey, { ...variables, count });
  }, [t]);

  // Verificar si existe una traducción
  const hasTranslation = useCallback((key: TranslationKey): boolean => {
    const defaultTranslations = DEFAULT_TRANSLATIONS[currentLanguage] || {};
    const userTranslations = customTranslations[currentLanguage] || {};
    const allTranslations = { ...defaultTranslations, ...userTranslations };

    return getNestedValue(allTranslations, key) !== undefined;
  }, [currentLanguage, customTranslations]);

  // Agregar traducción personalizada
  const addCustomTranslation = useCallback(async (key: TranslationKey, value: string) => {
    const newTranslations = {
      ...customTranslations,
      [currentLanguage]: {
        ...customTranslations[currentLanguage],
        [key]: value
      }
    };

    setCustomTranslations(newTranslations);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_custom_translations')
          .upsert({
            user_id: user.id,
            language: currentLanguage,
            key,
            value,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving custom translation:', error);
      }
    }
  }, [currentLanguage, customTranslations, user]);

  // Obtener idioma actual
  const currentLanguageConfig = useMemo(() => {
    return AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage) || AVAILABLE_LANGUAGES[0];
  }, [currentLanguage]);

  // Formatear números según el idioma
  const formatNumber = useCallback((number: number): string => {
    return new Intl.NumberFormat(currentLanguage).format(number);
  }, [currentLanguage]);

  // Formatear moneda según el idioma
  const formatCurrency = useCallback((amount: number, currency = 'CLP'): string => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency
    }).format(amount);
  }, [currentLanguage]);

  // Formatear fecha según el idioma
  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(currentLanguage, options).format(date);
  }, [currentLanguage]);

  // Formatear fecha relativa
  const formatRelativeDate = useCallback((date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('date.today');
    if (diffDays === -1) return t('date.yesterday');
    if (diffDays === 1) return t('date.tomorrow');

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      if (absDays < 30) {
        return t('date.days_ago', { count: absDays });
      } else {
        const months = Math.floor(absDays / 30);
        return t('date.months_ago', { count: months });
      }
    } else {
      if (diffDays < 30) {
        return t('date.days_from_now', { count: diffDays });
      } else {
        const months = Math.floor(diffDays / 30);
        return t('date.months_from_now', { count: months });
      }
    }
  }, [t]);

  return {
    // Estado
    currentLanguage,
    currentLanguageConfig,
    availableLanguages: AVAILABLE_LANGUAGES,

    // Funciones principales
    t,
    tPlural,
    changeLanguage,
    hasTranslation,

    // Traducciones personalizadas
    addCustomTranslation,

    // Formateadores
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeDate,

    // Utilidades
    isRTL: currentLanguageConfig.rtl
  };
};

// Funciones auxiliares para manejar objetos anidados
function getNestedValue(obj: TranslationDictionary, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

function setNestedValue(obj: TranslationDictionary, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key] as TranslationDictionary;
  }, obj);

  target[lastKey] = value;
}
