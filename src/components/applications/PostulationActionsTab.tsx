/**
 * PostulationActionsTab.tsx
 *
 * Componente que centraliza todas las acciones administrativas
 * para la gestión de postulaciones.
 *
 * Incluye: Aprobar, Revertir aprobación, Solicitar info, Rechazar,
 * Modificar aceptación, Cancelar postulación.
 *
 * @since 2025-11-26
 */

import React, { useState } from 'react';

interface PostulationData {
  id: string;
  status: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface PostulationActionsTabProps {
  postulation: PostulationData;
  hasContractConditions: boolean;
  onApprove: () => void;
  onRevertApproval: () => void;
  onRequestInfo: () => void;
  onReject: () => void;
  onModifyAcceptance: () => void;
  onCancel: () => void;
}

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationActionsTab: React.FC<PostulationActionsTabProps> = ({
  postulation,
  hasContractConditions,
  onApprove,
  onRevertApproval,
  onRequestInfo,
  onReject,
  onModifyAcceptance,
  onCancel
}) => {
  const [showConfirmRevert, setShowConfirmRevert] = useState(false);
  const [revertReason, setRevertReason] = useState('');

  const handleRevertApproval = () => {
    if (!revertReason.trim()) {
      alert('Por favor, indique el motivo de la anulación.');
      return;
    }
    onRevertApproval();
    setShowConfirmRevert(false);
    setRevertReason('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Acciones Administrativas
        </h3>

        <div className="space-y-3">
          {/* Aprobar Postulación */}
          <button
            onClick={onApprove}
            disabled={!hasContractConditions || postulation?.status === 'aprobada'}
            className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              (!hasContractConditions || postulation?.status === 'aprobada')
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={
              postulation?.status === 'aprobada'
                ? 'Postulación ya aprobada - no se puede aprobar nuevamente'
                : hasContractConditions
                ? 'Aprobar postulación y enviar contrato para generación automática'
                : 'Primero debe crear las condiciones del contrato'
            }
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Aprobar Postulación</span>
          </button>

          {/* Anular Aprobación (solo si está aprobada) */}
          {postulation?.status === 'aprobada' && (
            <div className="space-y-3">
              {!showConfirmRevert ? (
                <button
                  onClick={() => setShowConfirmRevert(true)}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                  title="Revertir la aprobación de esta postulación"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Anular Aprobación</span>
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="font-medium text-red-900">Confirmar Anulación</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo de la anulación *
                    </label>
                    <textarea
                      value={revertReason}
                      onChange={(e) => setRevertReason(e.target.value)}
                      placeholder="Explique por qué se anula la aprobación..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowConfirmRevert(false);
                        setRevertReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRevertApproval}
                      disabled={!revertReason.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anular Aprobación
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Solicitar Información */}
          <button
            onClick={onRequestInfo}
            className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Solicitar Información</span>
          </button>

          {/* Modificar Aceptación */}
          <button
            onClick={onModifyAcceptance}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Modificar Aceptación</span>
          </button>

          {/* Rechazar Postulación */}
          <button
            onClick={onReject}
            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Rechazar Postulación</span>
          </button>

          {/* Cancelar Postulación */}
          <button
            onClick={onCancel}
            className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancelar Postulación</span>
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Información sobre acciones</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Aprobar:</strong> Genera contrato automáticamente</li>
              <li>• <strong>Anular:</strong> Revierte aprobación (solo si no está firmado)</li>
              <li>• <strong>Solicitar info:</strong> Pide documentos adicionales</li>
              <li>• <strong>Modificar:</strong> Ajusta términos de aceptación</li>
              <li>• <strong>Rechazar:</strong> Finaliza postulación negativamente</li>
              <li>• <strong>Cancelar:</strong> Anula postulación por otros motivos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Estado Actual
        </h4>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Estado de postulación:</span>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              postulation.status === 'aprobada' ? 'bg-green-100 text-green-800' :
              postulation.status === 'rechazada' ? 'bg-red-100 text-red-800' :
              postulation.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {postulation.status === 'aprobada' ? 'Aprobada' :
               postulation.status === 'rechazada' ? 'Rechazada' :
               postulation.status === 'pendiente' ? 'En Revisión' :
               postulation.status.charAt(0).toUpperCase() + postulation.status.slice(1)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Condiciones contractuales:</span>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              hasContractConditions ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {hasContractConditions ? 'Configuradas' : 'No configuradas'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Última actualización:</span>
            <span className="text-sm text-gray-900">
              {new Date(postulation.updated_at).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
