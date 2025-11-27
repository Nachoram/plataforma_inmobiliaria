/**
 * EditApplicationModal.tsx - Modal para edición de postulaciones
 *
 * Componente básico para edición de postulaciones.
 * Actualmente es un placeholder que puede ser expandido según necesidades.
 */

import React from 'react';

interface ApplicationData {
  id: string;
  message: string;
}

interface EditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationData | null;
  onSave: (data: any) => Promise<void>;
  isSaving?: boolean;
}

export const EditApplicationModal: React.FC<EditApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  onSave,
  isSaving = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Postulación
              </h3>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Funcionalidad de edición de postulaciones próximamente disponible.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
