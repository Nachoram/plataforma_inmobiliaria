import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  border: string;
  borderHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontSize: 'sm' | 'md' | 'lg';
  compact: boolean;
  animations: boolean;
  customColors?: Partial<ThemeColors>;
}

const DEFAULT_CONFIG: ThemeConfig = {
  mode: 'auto',
  colorScheme: 'blue',
  borderRadius: 'md',
  fontSize: 'md',
  compact: false,
  animations: true
};

// Paletas de colores por esquema
const COLOR_SCHEMES: Record<ColorScheme, ThemeColors> = {
  blue: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    secondary: '#6B7280',
    secondaryHover: '#4B5563',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  green: {
    primary: '#10B981',
    primaryHover: '#059669',
    secondary: '#6B7280',
    secondaryHover: '#4B5563',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  purple: {
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    secondary: '#6B7280',
    secondaryHover: '#4B5563',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  orange: {
    primary: '#F97316',
    primaryHover: '#EA580C',
    secondary: '#6B7280',
    secondaryHover: '#4B5563',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  red: {
    primary: '#EF4444',
    primaryHover: '#DC2626',
    secondary: '#6B7280',
    secondaryHover: '#4B5563',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  gray: {
    primary: '#6B7280',
    primaryHover: '#4B5563',
    secondary: '#9CA3AF',
    secondaryHover: '#6B7280',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceHover: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
};

// Tema oscuro
const DARK_COLOR_SCHEMES: Record<ColorScheme, ThemeColors> = {
  blue: {
    primary: '#3B82F6',
    primaryHover: '#60A5FA',
    secondary: '#9CA3AF',
    secondaryHover: '#D1D5DB',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    borderHover: '#4B5563',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  },
  green: {
    primary: '#10B981',
    primaryHover: '#34D399',
    secondary: '#9CA3AF',
    secondaryHover: '#D1D5DB',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    borderHover: '#4B5563',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  },
  purple: {
    primary: '#8B5CF6',
    primaryHover: '#A78BFA',
    secondary: '#9CA3AF',
    secondaryHover: '#D1D5DB',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    borderHover: '#4B5563',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  },
  orange: {
    primary: '#F97316',
    primaryHover: '#FB923C',
    secondary: '#9CA3AF',
    secondaryHover: '#D1D5DB',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    borderHover: '#4B5563',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  },
  red: {
    primary: '#EF4444',
    primaryHover: '#F87171',
    secondary: '#9CA3AF',
    secondaryHover: '#D1D5DB',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    borderHover: '#4B5563',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  },
  gray: {
    primary: '#9CA3AF',
    primaryHover: '#D1D5DB',
    secondary: '#6B7280',
    secondaryHover: '#9CA3AF',
    background: '#111827',
    surface: '#1F2937',
    surfaceHover: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    borderHover: '#4B5563',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA'
  }
};

/**
 * Hook personalizado para gestión de temas
 */
export const useTheme = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_CONFIG);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  // Detectar preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Cargar configuración del usuario
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!user) {
        // Cargar del localStorage para usuarios no autenticados
        const saved = localStorage.getItem('theme-config');
        if (saved) {
          try {
            const parsedConfig = JSON.parse(saved);
            setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
          } catch (error) {
            console.error('Error parsing saved theme config:', error);
          }
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_theme_settings')
          .select('config')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading theme settings:', error);
          return;
        }

        if (data) {
          setConfig({ ...DEFAULT_CONFIG, ...data.config });
        } else {
          // Crear configuración por defecto para el usuario
          await saveUserTheme(DEFAULT_CONFIG);
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    };

    loadUserTheme();
  }, [user]);

  // Guardar configuración
  const saveUserTheme = useCallback(async (themeConfig: ThemeConfig) => {
    if (!user) {
      // Guardar en localStorage para usuarios no autenticados
      localStorage.setItem('theme-config', JSON.stringify(themeConfig));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_theme_settings')
        .upsert({
          user_id: user.id,
          config: themeConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  }, [user]);

  // Determinar si está en modo oscuro
  const isDark = useMemo(() => {
    if (config.mode === 'dark') return true;
    if (config.mode === 'light') return false;
    return systemPrefersDark;
  }, [config.mode, systemPrefersDark]);

  // Obtener colores actuales
  const colors = useMemo(() => {
    const baseColors = isDark ? DARK_COLOR_SCHEMES[config.colorScheme] : COLOR_SCHEMES[config.colorScheme];
    return { ...baseColors, ...config.customColors };
  }, [isDark, config.colorScheme, config.customColors]);

  // Aplicar tema al DOM
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar clase de tema
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Aplicar variables CSS
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Aplicar configuraciones adicionales
    root.style.setProperty('--border-radius', getBorderRadiusValue(config.borderRadius));
    root.style.setProperty('--font-size-multiplier', getFontSizeMultiplier(config.fontSize));
    root.style.setProperty('--spacing-multiplier', config.compact ? '0.75' : '1');

    // Animaciones
    if (!config.animations) {
      root.style.setProperty('--animation-duration', '0ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }

  }, [isDark, colors, config]);

  // Cambiar modo de tema
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    const newConfig = { ...config, mode };
    setConfig(newConfig);
    await saveUserTheme(newConfig);
  }, [config, saveUserTheme]);

  // Cambiar esquema de colores
  const setColorScheme = useCallback(async (colorScheme: ColorScheme) => {
    const newConfig = { ...config, colorScheme };
    setConfig(newConfig);
    await saveUserTheme(newConfig);
  }, [config, saveUserTheme]);

  // Actualizar configuración
  const updateConfig = useCallback(async (updates: Partial<ThemeConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await saveUserTheme(newConfig);
  }, [config, saveUserTheme]);

  // Resetear a configuración por defecto
  const resetToDefault = useCallback(async () => {
    setConfig(DEFAULT_CONFIG);
    await saveUserTheme(DEFAULT_CONFIG);
  }, [saveUserTheme]);

  // Toggle entre claro y oscuro
  const toggleTheme = useCallback(async () => {
    const newMode = config.mode === 'dark' ? 'light' : 'dark';
    await setThemeMode(newMode);
  }, [config.mode, setThemeMode]);

  // Exportar configuración
  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  // Importar configuración
  const importConfig = useCallback(async (configString: string) => {
    try {
      const importedConfig = JSON.parse(configString);
      const validatedConfig = { ...DEFAULT_CONFIG, ...importedConfig };
      setConfig(validatedConfig);
      await saveUserTheme(validatedConfig);
      return true;
    } catch (error) {
      console.error('Error importing theme config:', error);
      return false;
    }
  }, [saveUserTheme]);

  return {
    // Estado
    config,
    isDark,
    colors,
    systemPrefersDark,

    // Acciones
    setThemeMode,
    setColorScheme,
    updateConfig,
    toggleTheme,
    resetToDefault,
    exportConfig,
    importConfig,

    // Utilidades
    colorSchemes: Object.keys(COLOR_SCHEMES) as ColorScheme[],
    borderRadiusOptions: ['none', 'sm', 'md', 'lg', 'xl'] as const,
    fontSizeOptions: ['sm', 'md', 'lg'] as const
  };
};

// Funciones auxiliares
function getBorderRadiusValue(radius: ThemeConfig['borderRadius']): string {
  const values = {
    none: '0px',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  };
  return values[radius];
}

function getFontSizeMultiplier(size: ThemeConfig['fontSize']): string {
  const multipliers = {
    sm: '0.875',
    md: '1',
    lg: '1.125'
  };
  return multipliers[size];
}
