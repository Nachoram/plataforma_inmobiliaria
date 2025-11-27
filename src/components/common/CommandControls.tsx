import React from 'react';
import { Undo, Redo, History, Download } from 'lucide-react';
import { CustomButton } from './buttons';

interface CommandControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  isExecuting: boolean;
  lastCommandName?: string;
  commandHistoryLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
  className?: string;
}

export const CommandControls: React.FC<CommandControlsProps> = ({
  canUndo,
  canRedo,
  isExecuting,
  lastCommandName,
  commandHistoryLength,
  onUndo,
  onRedo,
  onClearHistory,
  onExportHistory,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      {/* Controles principales */}
      <div className="flex items-center gap-1">
        <CustomButton
          onClick={onUndo}
          disabled={!canUndo || isExecuting}
          variant="outline"
          size="sm"
          className="p-1"
          title="Deshacer última acción"
        >
          <Undo className="h-4 w-4" />
        </CustomButton>

        <CustomButton
          onClick={onRedo}
          disabled={!canRedo || isExecuting}
          variant="outline"
          size="sm"
          className="p-1"
          title="Rehacer acción deshecha"
        >
          <Redo className="h-4 w-4" />
        </CustomButton>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-gray-300"></div>

      {/* Información del historial */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <History className="h-4 w-4" />
        <span>{commandHistoryLength} acciones</span>
        {lastCommandName && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-800 font-medium truncate max-w-32" title={lastCommandName}>
              {lastCommandName}
            </span>
          </>
        )}
      </div>

      {/* Controles avanzados */}
      <div className="flex items-center gap-1 ml-auto">
        <CustomButton
          onClick={onExportHistory}
          disabled={commandHistoryLength === 0}
          variant="ghost"
          size="sm"
          className="p-1"
          title="Exportar historial de acciones"
        >
          <Download className="h-4 w-4" />
        </CustomButton>

        <CustomButton
          onClick={onClearHistory}
          disabled={commandHistoryLength === 0}
          variant="ghost"
          size="sm"
          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Limpiar historial"
        >
          <History className="h-4 w-4" />
        </CustomButton>
      </div>

      {/* Indicador de ejecución */}
      {isExecuting && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span>Ejecutando...</span>
        </div>
      )}
    </div>
  );
};
