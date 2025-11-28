import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle,
  AlertCircle,
  Loader,
  X
} from 'lucide-react';
import { useDataExport, ExportColumn, ExportOptions, ExportResult } from '../../hooks/useDataExport';

export interface ExportConfig<T = any> {
  id: string;
  name: string;
  description?: string;
  data: T[];
  columns: ExportColumn<T>[];
  defaultOptions?: Partial<ExportOptions>;
}

interface DataExportProps<T = any> {
  configs: ExportConfig<T>[];
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const DataExport = <T,>({
  configs,
  isOpen,
  onClose,
  title = 'Exportar Datos'
}: DataExportProps<T>) => {
  const {
    isExporting,
    progress,
    exportData,
    exportMultipleFormats
  } = useDataExport();

  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [selectedFormats, setSelectedFormats] = useState<Set<'csv' | 'excel' | 'pdf'>>(new Set());
  const [customOptions, setCustomOptions] = useState<Partial<ExportOptions>>({});
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);

  const selectedConfig = useMemo(() => {
    return configs.find(config => config.id === selectedConfigId);
  }, [configs, selectedConfigId]);

  const availableFormats = [
    { id: 'csv', name: 'CSV', icon: FileText, description: 'Archivo de valores separados por comas' },
    { id: 'excel', name: 'Excel', icon: FileSpreadsheet, description: 'Hoja de cálculo compatible con Excel' },
    { id: 'pdf', name: 'PDF', icon: File, description: 'Documento PDF con formato' }
  ] as const;

  const handleFormatToggle = (formatId: 'csv' | 'excel' | 'pdf') => {
    const newFormats = new Set(selectedFormats);
    if (newFormats.has(formatId)) {
      newFormats.delete(formatId);
    } else {
      newFormats.add(formatId);
    }
    setSelectedFormats(newFormats);
  };

  const handleExport = async () => {
    if (!selectedConfig || selectedFormats.size === 0) return;

    const options: ExportOptions = {
      ...selectedConfig.defaultOptions,
      ...customOptions,
      filename: `${selectedConfig.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
    };

    setExportResults([]);

    try {
      if (selectedFormats.size === 1) {
        // Exportar un solo formato
        const format = Array.from(selectedFormats)[0];
        const result = await exportData(selectedConfig.data, selectedConfig.columns, format, options);
        setExportResults([result]);
      } else {
        // Exportar múltiples formatos
        const formats = Array.from(selectedFormats);
        const results = await exportMultipleFormats(selectedConfig.data, selectedConfig.columns, formats, options);
        setExportResults(results);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportResults([{
        success: false,
        filename: 'error',
        size: 0,
        duration: 0,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }]);
    }
  };

  const resetForm = () => {
    setSelectedConfigId('');
    setSelectedFormats(new Set());
    setCustomOptions({});
    setExportResults([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Progress Indicator */}
          {isExporting && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">Exportando datos...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-blue-700 mt-1">{progress}% completado</p>
            </div>
          )}

          {/* Export Results */}
          {exportResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Resultados de Exportación</h3>
              <div className="space-y-2">
                {exportResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {result.filename}
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.success ? (
                            <>
                              {Math.round(result.size / 1024)} KB • {result.duration.toFixed(0)}ms
                            </>
                          ) : (
                            result.error
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Seleccionar Datos</h3>
            <div className="grid grid-cols-1 gap-3">
              {configs.map((config) => (
                <label
                  key={config.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedConfigId === config.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="data-config"
                      value={config.id}
                      checked={selectedConfigId === config.id}
                      onChange={(e) => setSelectedConfigId(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{config.name}</h4>
                      {config.description && (
                        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {config.data.length} registros • {config.columns.length} columnas
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          {selectedConfig && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Seleccionar Formatos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableFormats.map((format) => (
                  <label
                    key={format.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormats.has(format.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFormats.has(format.id)}
                        onChange={() => handleFormatToggle(format.id)}
                        className="text-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        <format.icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">{format.name}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{format.description}</p>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Options */}
          {selectedConfig && selectedFormats.size > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Opciones Personalizadas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Documento
                  </label>
                  <input
                    type="text"
                    value={customOptions.title || ''}
                    onChange={(e) => setCustomOptions(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder={`Exportación de ${selectedConfig.name}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={customOptions.subtitle || ''}
                    onChange={(e) => setCustomOptions(prev => ({
                      ...prev,
                      subtitle: e.target.value
                    }))}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Archivo
                  </label>
                  <input
                    type="text"
                    value={customOptions.filename || ''}
                    onChange={(e) => setCustomOptions(prev => ({
                      ...prev,
                      filename: e.target.value
                    }))}
                    placeholder="Se generará automáticamente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato de Fecha
                  </label>
                  <select
                    value={customOptions.dateFormat || 'short'}
                    onChange={(e) => setCustomOptions(prev => ({
                      ...prev,
                      dateFormat: e.target.value as 'short' | 'long' | 'iso'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="short">Corto (DD/MM/YYYY)</option>
                    <option value="long">Largo (DD de MMMM de YYYY)</option>
                    <option value="iso">ISO (YYYY-MM-DDTHH:mm:ssZ)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedConfig || selectedFormats.size === 0 || isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  );
};


