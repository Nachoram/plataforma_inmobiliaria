import { useState, useCallback } from 'react';
import { getPerformanceMonitor } from '../lib/performanceMonitor';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'short' | 'long' | 'iso';
  delimiter?: string;
  encoding?: string;
  pageSize?: 'a4' | 'letter' | 'a3';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  logo?: string;
  footer?: string;
}

export interface ExportColumn<T = any> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean';
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  duration: number;
  error?: string;
}

/**
 * Hook personalizado para exportación de datos en múltiples formatos
 */
export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Función auxiliar para formatear valores
  const formatValue = useCallback((value: any, type?: ExportColumn['type'], dateFormat?: ExportOptions['dateFormat']): string => {
    if (value === null || value === undefined) return '';

    switch (type) {
      case 'date':
        if (value instanceof Date) {
          switch (dateFormat) {
            case 'iso':
              return value.toISOString();
            case 'long':
              return value.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            case 'short':
            default:
              return value.toLocaleDateString('es-ES');
          }
        }
        return String(value);

      case 'currency':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(numValue) ? String(value) : `$${numValue.toLocaleString('es-CL')}`;

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? String(value) : num.toLocaleString('es-ES');

      case 'boolean':
        return value ? 'Sí' : 'No';

      case 'text':
      default:
        return String(value);
    }
  }, []);

  // Exportar a CSV
  const exportToCSV = useCallback(async <T>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    const startTime = performance.now();

    try {
      setIsExporting(true);
      setProgress(0);

      const {
        filename = 'export.csv',
        includeHeaders = true,
        delimiter = ';',
        encoding = 'utf-8',
        dateFormat = 'short'
      } = options;

      // Preparar headers
      const headers = includeHeaders ? columns.map(col => col.label) : [];
      setProgress(10);

      // Preparar filas de datos
      const rows = data.map((row, index) => {
        const rowData = columns.map(col => {
          const value = typeof col.key === 'string' ? (row as any)[col.key] : col.key;
          const formatted = col.format ? col.format(value, row) : formatValue(value, col.type, dateFormat);

          // Escapar comillas y delimitadores en CSV
          const escaped = formatted.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        setProgress(10 + ((index + 1) / data.length) * 70);
        return rowData;
      });

      // Combinar headers y filas
      const csvContent = [headers, ...rows]
        .filter(row => row.length > 0)
        .map(row => row.join(delimiter))
        .join('\n');

      setProgress(90);

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: `text/csv;charset=${encoding}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const duration = performance.now() - startTime;
      setProgress(100);

      // Track performance
      getPerformanceMonitor().recordMetric('export_csv', duration, 'custom', {
        filename,
        rowCount: data.length,
        columnCount: columns.length
      });

      return {
        success: true,
        filename,
        size: blob.size,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        filename: options.filename || 'export.csv',
        size: 0,
        duration,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [formatValue]);

  // Exportar a Excel (usando una librería como xlsx o generando HTML table)
  const exportToExcel = useCallback(async <T>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    const startTime = performance.now();

    try {
      setIsExporting(true);
      setProgress(0);

      const {
        filename = 'export.xlsx',
        includeHeaders = true,
        title,
        subtitle,
        dateFormat = 'short'
      } = options;

      // Para este ejemplo, generaremos un HTML table que Excel puede abrir
      // En producción, usaríamos una librería como xlsx o exceljs

      let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title || 'Export'}</title>
    <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 14px; color: #666; }
    </style>
</head>
<body>`;

      if (title) {
        html += `
    <div class="header">
        <div class="title">${title}</div>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </div>`;
      }

      html += `\n    <table>`;

      setProgress(20);

      // Headers
      if (includeHeaders) {
        html += `\n        <tr>`;
        columns.forEach(col => {
          html += `<th>${col.label}</th>`;
        });
        html += `</tr>`;
      }

      setProgress(30);

      // Data rows
      data.forEach((row, index) => {
        html += `\n        <tr>`;
        columns.forEach(col => {
          const value = typeof col.key === 'string' ? (row as any)[col.key] : col.key;
          const formatted = col.format ? col.format(value, row) : formatValue(value, col.type, dateFormat);
          html += `<td>${formatted}</td>`;
        });
        html += `</tr>`;

        setProgress(30 + ((index + 1) / data.length) * 60);
      });

      html += `\n    </table>\n</body>\n</html>`;

      setProgress(95);

      // Crear y descargar archivo
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace('.xlsx', '.xls'); // Excel abrirá .xls como HTML
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const duration = performance.now() - startTime;
      setProgress(100);

      // Track performance
      getPerformanceMonitor().recordMetric('export_excel', duration, 'custom', {
        filename,
        rowCount: data.length,
        columnCount: columns.length
      });

      return {
        success: true,
        filename,
        size: blob.size,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        filename: options.filename || 'export.xlsx',
        size: 0,
        duration,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [formatValue]);

  // Exportar a PDF
  const exportToPDF = useCallback(async <T>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    const startTime = performance.now();

    try {
      setIsExporting(true);
      setProgress(0);

      const {
        filename = 'export.pdf',
        pageSize = 'a4',
        orientation = 'portrait',
        title,
        subtitle,
        logo,
        footer,
        dateFormat = 'short'
      } = options;

      // Para este ejemplo, usaremos html2canvas + jsPDF
      // En producción, necesitaríamos instalar estas dependencias

      // Crear contenido HTML para el PDF
      let htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          ${title ? `<h1 style="text-align: center; margin-bottom: 10px;">${title}</h1>` : ''}
          ${subtitle ? `<h2 style="text-align: center; color: #666; margin-bottom: 20px;">${subtitle}</h2>` : ''}
          <p style="text-align: center; color: #999; margin-bottom: 30px;">
            Generado el ${new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
      `;

      setProgress(10);

      // Headers
      htmlContent += '<thead><tr>';
      columns.forEach(col => {
        htmlContent += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold;">${col.label}</th>`;
      });
      htmlContent += '</tr></thead><tbody>';

      setProgress(20);

      // Data rows
      data.forEach((row, index) => {
        htmlContent += '<tr>';
        columns.forEach(col => {
          const value = typeof col.key === 'string' ? (row as any)[col.key] : col.key;
          const formatted = col.format ? col.format(value, row) : formatValue(value, col.type, dateFormat);
          htmlContent += `<td style="border: 1px solid #ddd; padding: 8px;">${formatted}</td>`;
        });
        htmlContent += '</tr>';

        setProgress(20 + ((index + 1) / data.length) * 70);
      });

      htmlContent += '</tbody></table>';

      if (footer) {
        htmlContent += `<div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">${footer}</div>`;
      }

      setProgress(95);

      // En producción, aquí usaríamos html2canvas y jsPDF para generar el PDF
      // Por ahora, crearemos un HTML simple descargable

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace('.pdf', '.html'); // Temporal hasta implementar PDF real
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const duration = performance.now() - startTime;
      setProgress(100);

      // Track performance
      getPerformanceMonitor().recordMetric('export_pdf', duration, 'custom', {
        filename,
        rowCount: data.length,
        columnCount: columns.length
      });

      return {
        success: true,
        filename,
        size: blob.size,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        filename: options.filename || 'export.pdf',
        size: 0,
        duration,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [formatValue]);

  // Función genérica de exportación
  const exportData = useCallback(async <T>(
    data: T[],
    columns: ExportColumn<T>[],
    format: 'csv' | 'excel' | 'pdf',
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    const defaultOptions: ExportOptions = {
      filename: `export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`,
      includeHeaders: true,
      ...options
    };

    switch (format) {
      case 'csv':
        return exportToCSV(data, columns, defaultOptions);
      case 'excel':
        return exportToExcel(data, columns, defaultOptions);
      case 'pdf':
        return exportToPDF(data, columns, defaultOptions);
      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
  }, [exportToCSV, exportToExcel, exportToPDF]);

  // Función para exportar múltiples formatos a la vez
  const exportMultipleFormats = useCallback(async <T>(
    data: T[],
    columns: ExportColumn<T>[],
    formats: ('csv' | 'excel' | 'pdf')[],
    options: ExportOptions = {}
  ): Promise<ExportResult[]> => {
    const results: ExportResult[] = [];

    for (const format of formats) {
      try {
        const result = await exportData(data, columns, format, {
          ...options,
          filename: options.filename?.replace(/\.[^.]+$/, `.${format === 'excel' ? 'xlsx' : format}`)
        });
        results.push(result);

        // Pequeña pausa entre exportaciones para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          success: false,
          filename: `export.${format === 'excel' ? 'xlsx' : format}`,
          size: 0,
          duration: 0,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return results;
  }, [exportData]);

  return {
    // Estados
    isExporting,
    progress,

    // Funciones de exportación
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportData,
    exportMultipleFormats,

    // Utilidades
    formatValue
  };
};


