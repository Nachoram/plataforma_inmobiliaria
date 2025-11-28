import React, { useState } from 'react';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { useTranslation, Language, AVAILABLE_LANGUAGES } from '../../hooks/useTranslation';

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown' | 'minimal';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showFlag = true,
  showName = true,
  className = ''
}) => {
  const { currentLanguage, currentLanguageConfig, changeLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (language: Language) => {
    await changeLanguage(language);
    setIsOpen(false);
  };

  if (variant === 'button') {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
      >
        {showFlag && <span className="text-lg">{currentLanguageConfig.flag}</span>}
        {showName && <span className="text-sm font-medium">{currentLanguageConfig.name}</span>}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
          title={`Cambiar idioma (${currentLanguageConfig.name})`}
        >
          <span className="text-lg">{currentLanguageConfig.flag}</span>
        </button>

        {isOpen && (
          <LanguageDropdown
            languages={availableLanguages}
            currentLanguage={currentLanguage}
            onSelect={handleLanguageChange}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
      >
        {showFlag && <span className="text-xl">{currentLanguageConfig.flag}</span>}
        {showName && <span className="text-sm font-medium">{currentLanguageConfig.name}</span>}
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <LanguageDropdown
          languages={availableLanguages}
          currentLanguage={currentLanguage}
          onSelect={handleLanguageChange}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

interface LanguageDropdownProps {
  languages: typeof AVAILABLE_LANGUAGES;
  currentLanguage: Language;
  onSelect: (language: Language) => void;
  onClose: () => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  languages,
  currentLanguage,
  onSelect,
  onClose
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => onSelect(language.code)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              currentLanguage === language.code ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
            }`}
          >
            <span className="text-xl">{language.flag}</span>
            <span className="text-sm font-medium">{language.name}</span>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 ml-auto text-blue-600 dark:text-blue-400" />
            )}
          </button>
        ))}
      </div>
    </>
  );
};

// Componente de configuración avanzada de idioma
interface LanguageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({ isOpen, onClose }) => {
  const { t, currentLanguage, changeLanguage, addCustomTranslation, hasTranslation } = useTranslation();
  const [newTranslationKey, setNewTranslationKey] = useState('');
  const [newTranslationValue, setNewTranslationValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddTranslation = async () => {
    if (newTranslationKey && newTranslationValue) {
      await addCustomTranslation(newTranslationKey, newTranslationValue);
      setNewTranslationKey('');
      setNewTranslationValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6" />
            <h2 className="text-xl font-bold">Configuración de Idioma</h2>
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
          {/* Selector de Idioma */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Idioma Principal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    currentLanguage === language.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {language.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {language.code.toUpperCase()}
                      </div>
                    </div>
                    {currentLanguage === language.code && (
                      <Check className="h-5 w-5 ml-auto text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Traducciones Personalizadas */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Traducciones Personalizadas
            </h3>

            <div className="space-y-4">
              {/* Agregar nueva traducción */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                  Agregar Nueva Traducción
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Clave de Traducción
                    </label>
                    <input
                      type="text"
                      value={newTranslationKey}
                      onChange={(e) => setNewTranslationKey(e.target.value)}
                      placeholder="ej: custom.greeting"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Traducción ({currentLanguage.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={newTranslationValue}
                      onChange={(e) => setNewTranslationValue(e.target.value)}
                      placeholder="ej: ¡Hola mundo!"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddTranslation}
                  disabled={!newTranslationKey || !newTranslationValue}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Agregar Traducción
                </button>
              </div>

              {/* Buscar traducciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar Traducciones
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por clave o traducción..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Lista de traducciones comunes */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Traducciones Comunes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMMON_TRANSLATIONS.map((translation) => (
                <div
                  key={translation.key}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {translation.key}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t(translation.key)}
                  </div>
                  {translation.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {translation.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Información del sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Información del Sistema
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Idioma del Sistema
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {navigator.language}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Dirección del Texto
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {document.documentElement.dir || 'ltr'}
                </p>
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

// Traducciones comunes para mostrar
const COMMON_TRANSLATIONS = [
  { key: 'common.save', description: 'Botón guardar' },
  { key: 'common.cancel', description: 'Botón cancelar' },
  { key: 'common.delete', description: 'Botón eliminar' },
  { key: 'common.edit', description: 'Botón editar' },
  { key: 'common.create', description: 'Botón crear' },
  { key: 'common.search', description: 'Campo de búsqueda' },
  { key: 'common.loading', description: 'Mensaje de carga' },
  { key: 'common.error', description: 'Mensaje de error' },
  { key: 'common.success', description: 'Mensaje de éxito' },
  { key: 'status.active', description: 'Estado activo' },
  { key: 'status.pending', description: 'Estado pendiente' },
  { key: 'status.completed', description: 'Estado completado' },
  { key: 'nav.dashboard', description: 'Navegación dashboard' },
  { key: 'nav.settings', description: 'Navegación configuración' }
];



