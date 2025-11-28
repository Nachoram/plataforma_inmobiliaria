import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  RotateCcw,
  Download,
  Upload,
  Settings,
  X
} from 'lucide-react';
import { useTheme, ThemeMode, ColorScheme } from '../../hooks/useTheme';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const {
    config,
    isDark,
    colors,
    systemPrefersDark,
    setThemeMode,
    setColorScheme,
    updateConfig,
    toggleTheme,
    resetToDefault,
    exportConfig,
    importConfig,
    colorSchemes,
    borderRadiusOptions,
    fontSizeOptions
  } = useTheme();

  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  const handleImport = async () => {
    const success = await importConfig(importText);
    if (success) {
      setImportText('');
      alert('Configuración importada correctamente');
    } else {
      alert('Error al importar la configuración');
    }
  };

  const handleExport = () => {
    const configJson = exportConfig();
    navigator.clipboard.writeText(configJson).then(() => {
      alert('Configuración copiada al portapapeles');
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="h-6 w-6" />
            <h2 className="text-xl font-bold">Configuración de Tema</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Modo de Tema */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Modo de Tema
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setThemeMode('light')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  config.mode === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Claro</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Siempre claro</div>
              </button>

              <button
                onClick={() => setThemeMode('dark')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  config.mode === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Oscuro</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Siempre oscuro</div>
              </button>

              <button
                onClick={() => setThemeMode('auto')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  config.mode === 'auto'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <div className="text-sm font-medium text-gray-900 dark:text-white">Automático</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {systemPrefersDark ? 'Sistema oscuro' : 'Sistema claro'}
                </div>
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Toggle Actual: {isDark ? '🌙 Oscuro' : '☀️ Claro'}
              </button>
            </div>
          </div>

          {/* Esquema de Colores */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Esquema de Colores
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => setColorScheme(scheme)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    config.colorScheme === scheme
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLOR_PREVIEWS[scheme].primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLOR_PREVIEWS[scheme].secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLOR_PREVIEWS[scheme].accent }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {scheme}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuración Adicional */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Configuración Adicional
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Radio de Bordes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Radio de Bordes
                </label>
                <select
                  value={config.borderRadius}
                  onChange={(e) => updateConfig({ borderRadius: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {borderRadiusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'none' ? 'Sin radio' :
                       option === 'sm' ? 'Pequeño' :
                       option === 'md' ? 'Mediano' :
                       option === 'lg' ? 'Grande' :
                       option === 'xl' ? 'Extra grande' : option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tamaño de Fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamaño de Fuente
                </label>
                <select
                  value={config.fontSize}
                  onChange={(e) => updateConfig({ fontSize: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fontSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'sm' ? 'Pequeño' :
                       option === 'md' ? 'Mediano' :
                       option === 'lg' ? 'Grande' : option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opciones Booleanas */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Modo Compacto</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reduce el espaciado general</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.compact}
                    onChange={(e) => updateConfig({ compact: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Animaciones</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Activa las transiciones y animaciones</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.animations}
                    onChange={(e) => updateConfig({ animations: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Importar/Exportar */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Importar/Exportar Configuración
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Configuración JSON
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Pega aquí la configuración JSON exportada..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Importar
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>

                <button
                  onClick={resetToDefault}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Preview de Colores */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Vista Previa
            </h3>

            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <div className="space-y-3">
                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: colors.surface }}
                >
                  <h4 style={{ color: colors.text }}>Superficie</h4>
                  <p style={{ color: colors.textSecondary }}>Texto secundario</p>
                </div>

                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Primario
                  </button>
                  <button
                    className="px-4 py-2 rounded"
                    style={{ backgroundColor: colors.secondary, color: colors.text }}
                  >
                    Secundario
                  </button>
                  <button
                    className="px-4 py-2 rounded"
                    style={{ backgroundColor: colors.success, color: 'white' }}
                  >
                    Éxito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Previews de colores para la UI
const COLOR_PREVIEWS: Record<ColorScheme, { primary: string; secondary: string; accent: string }> = {
  blue: { primary: '#3B82F6', secondary: '#6B7280', accent: '#10B981' },
  green: { primary: '#10B981', secondary: '#6B7280', accent: '#3B82F6' },
  purple: { primary: '#8B5CF6', secondary: '#6B7280', accent: '#F59E0B' },
  orange: { primary: '#F97316', secondary: '#6B7280', accent: '#8B5CF6' },
  red: { primary: '#EF4444', secondary: '#6B7280', accent: '#10B981' },
  gray: { primary: '#6B7280', secondary: '#9CA3AF', accent: '#3B82F6' }
};


