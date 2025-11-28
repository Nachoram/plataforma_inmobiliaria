/**
 * AdminActionsPanel.tsx
 *
 * Componente que agrupa todas las acciones administrativas disponibles
 * para una postulación en el panel de administración.
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface PostulationData {
  id: string;
  status: string;
  // ... otros campos
}

interface AdminActionsPanelProps {
  postulation: PostulationData;
  hasContractConditions: boolean;
  onShowContractForm: (show: boolean) => void;
  onOpenContractModal: () => void;
  onSetContractManuallyGenerated: (generated: boolean) => void;
}

export const AdminActionsPanel: React.FC<AdminActionsPanelProps> = ({
  postulation,
  hasContractConditions,
  onShowContractForm,
  onOpenContractModal,
  onSetContractManuallyGenerated
}) => {
  const [revertingApproval, setRevertingApproval] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);

  const handleApproveApplication = async () => {
    try {
      // TODO: Implementar lógica de aprobación
      console.log('🔄 Aprobando aplicación...');
      toast.info('Funcionalidad de aprobación en desarrollo');
    } catch (error) {
      console.error('❌ Error aprobando aplicación:', error);
      toast.error('Error al aprobar la aplicación');
    }
  };

  const handleConfirmRevert = async () => {
    try {
      setRevertingApproval(true);
      console.log('🔄 Revirtiendo aprobación de la aplicación...');

      // TODO: Implementar lógica real de revertir aprobación
      // Por ahora solo mostrar mensaje
      toast.info('Funcionalidad de revertir aprobación en desarrollo');

      // Aquí iría la lógica para:
      // 1. Cambiar el status de la aplicación
      // 2. Actualizar en Supabase
      // 3. Registrar en audit log

    } catch (error) {
      console.error('❌ Error revirtiendo aprobación:', error);
      toast.error('Error al revertir la aprobación');
    } finally {
      setRevertingApproval(false);
      setShowRevertModal(false);
    }
  };

  const handleRequestInfo = () => {
    // TODO: Implement request info functionality
    toast.info('Funcionalidad de solicitar información en desarrollo');
  };

  const handleRejectApplication = () => {
    // TODO: Implement reject functionality
    toast.info('Funcionalidad de rechazar en desarrollo');
  };

  const handleModifyAcceptance = () => {
    // TODO: Implement modify acceptance functionality
    toast.info('Funcionalidad de modificar aceptación en desarrollo');
  };

  const handleCancelApplication = () => {
    // TODO: Implement cancel functionality
    toast.info('Funcionalidad de cancelar en desarrollo');
  };

  const handleGenerateContract = () => {
    onSetContractManuallyGenerated(true);
    onOpenContractModal();
  };

  const handleGenerateCommercialReport = () => {
    // TODO: Implement commercial report generation
    toast.info('Funcionalidad de generar informe comercial en desarrollo');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Acciones Administrativas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleApproveApplication}
            disabled={!hasContractConditions || postulation?.status === 'aprobada'}
            className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              (!hasContractConditions || postulation?.status === 'aprobada')
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
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

          {postulation?.status === 'aprobada' && (
            <button
              onClick={() => setShowRevertModal(true)}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              title="Revertir la aprobación de esta postulación"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Anular Aprobación</span>
            </button>
          )}

          <button
            onClick={handleRequestInfo}
            className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Solicitar Información</span>
          </button>

          <button
            onClick={handleRejectApplication}
            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Rechazar Postulación</span>
          </button>

          <button
            onClick={handleModifyAcceptance}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Modificar Aceptación</span>
          </button>

          <button
            onClick={handleCancelApplication}
            className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancelar Postulación</span>
          </button>

          <button
            onClick={handleGenerateContract}
            disabled={!hasContractConditions}
            className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
              !hasContractConditions
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title={!hasContractConditions ? 'Primero debe establecer las condiciones contractuales' : 'Generar contrato basado en las condiciones establecidas'}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generar Contrato</span>
          </button>

          <button
            onClick={() => onShowContractForm(true)}
            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            title="Establecer o modificar las condiciones contractuales de la postulación"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Establecer Condiciones Contractuales</span>
          </button>

          <button
            onClick={handleGenerateCommercialReport}
            className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
            title="Generar informe comercial con datos del postulante"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Generar Informe Comercial Postulante</span>
          </button>
        </div>
      </div>

      {/* Revert Modal */}
      <RevertModal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        onConfirm={handleConfirmRevert}
        loading={revertingApproval}
      />
    </>
  );
};

// Componente Modal para Revertir Aprobación
const RevertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Revertir Aprobación
              </h3>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres revertir la aprobación de esta postulación?
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Revertir Aprobación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



