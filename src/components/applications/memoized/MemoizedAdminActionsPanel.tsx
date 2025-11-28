/**
 * MemoizedAdminActionsPanel.tsx
 *
 * Memoized version of AdminActionsPanel with performance optimizations
 */

import React, { memo, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

interface PostulationData {
  id: string;
  status: string;
}

interface MemoizedAdminActionsPanelProps {
  postulation: PostulationData;
  hasContractConditions: boolean;
  onShowContractForm: (show: boolean) => void;
  onOpenContractModal: () => void;
  onSetContractManuallyGenerated: (generated: boolean) => void;
  className?: string;
}

// Action button component - memoized
const ActionButton = memo<{
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  title?: string;
  children: React.ReactNode;
  className?: string;
}>(({ onClick, disabled = false, variant, title, children, className = '' }) => {
  const buttonClasses = useMemo(() => {
    const baseClasses = 'w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium';

    const variantClasses = {
      primary: disabled
        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
        : 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      success: disabled
        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
        : 'bg-green-600 text-white hover:bg-green-700',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700'
    };

    return `${baseClasses} ${variantClasses[variant]} ${className}`;
  }, [variant, disabled, className]);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

// Main memoized admin actions panel
export const MemoizedAdminActionsPanel = memo<MemoizedAdminActionsPanelProps>(({
  postulation,
  hasContractConditions,
  onShowContractForm,
  onOpenContractModal,
  onSetContractManuallyGenerated,
  className = ''
}) => {
  // Memoize action handlers to prevent unnecessary re-renders
  const handleApproveApplication = useCallback(() => {
    toast.info('Funcionalidad de aprobación en desarrollo');
  }, []);

  const handleRequestInfo = useCallback(() => {
    toast.info('Funcionalidad de solicitar información en desarrollo');
  }, []);

  const handleRejectApplication = useCallback(() => {
    toast.info('Funcionalidad de rechazar en desarrollo');
  }, []);

  const handleModifyAcceptance = useCallback(() => {
    toast.info('Funcionalidad de modificar aceptación en desarrollo');
  }, []);

  const handleCancelApplication = useCallback(() => {
    toast.info('Funcionalidad de cancelar en desarrollo');
  }, []);

  const handleGenerateContract = useCallback(() => {
    onSetContractManuallyGenerated(true);
    onOpenContractModal();
  }, [onSetContractManuallyGenerated, onOpenContractModal]);

  const handleGenerateCommercialReport = useCallback(() => {
    toast.info('Funcionalidad de generar informe comercial en desarrollo');
  }, []);

  // Memoize button configurations
  const buttonConfigs = useMemo(() => [
    {
      key: 'approve',
      onClick: handleApproveApplication,
      disabled: !hasContractConditions || postulation?.status === 'aprobada',
      variant: 'primary' as const,
      title: postulation?.status === 'aprobada'
        ? 'Postulación ya aprobada - no se puede aprobar nuevamente'
        : hasContractConditions
        ? 'Aprobar postulación y enviar contrato para generación automática'
        : 'Primero debe crear las condiciones del contrato',
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Aprobar Postulación</span>
        </>
      )
    },
    {
      key: 'request-info',
      onClick: handleRequestInfo,
      variant: 'warning' as const,
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Solicitar Información</span>
        </>
      )
    },
    {
      key: 'reject',
      onClick: handleRejectApplication,
      variant: 'danger' as const,
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Rechazar Postulación</span>
        </>
      )
    },
    {
      key: 'modify',
      onClick: handleModifyAcceptance,
      variant: 'secondary' as const,
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Modificar Aceptación</span>
        </>
      )
    },
    {
      key: 'cancel',
      onClick: handleCancelApplication,
      variant: 'secondary' as const,
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Cancelar Postulación</span>
        </>
      )
    },
    {
      key: 'generate-contract',
      onClick: handleGenerateContract,
      disabled: !hasContractConditions,
      variant: 'success' as const,
      title: !hasContractConditions ? 'Primero debe establecer las condiciones contractuales' : 'Generar contrato basado en las condiciones establecidas',
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Generar Contrato</span>
        </>
      )
    },
    {
      key: 'contract-conditions',
      onClick: () => onShowContractForm(true),
      variant: 'primary' as const,
      title: "Establecer o modificar las condiciones contractuales de la postulación",
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Establecer Condiciones Contractuales</span>
        </>
      )
    },
    {
      key: 'commercial-report',
      onClick: handleGenerateCommercialReport,
      variant: 'primary' as const,
      title: "Generar informe comercial con datos del postulante",
      children: (
        <>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Generar Informe Comercial Postulante</span>
        </>
      )
    }
  ], [
    postulation?.status,
    hasContractConditions,
    handleApproveApplication,
    handleRequestInfo,
    handleRejectApplication,
    handleModifyAcceptance,
    handleCancelApplication,
    handleGenerateContract,
    handleGenerateCommercialReport,
    onShowContractForm
  ]);

  // Special handling for revert approval button
  const showRevertButton = postulation?.status === 'aprobada';

  const revertButtonConfig = useMemo(() => ({
    key: 'revert-approval',
    onClick: () => {
      // This would typically be handled by a modal manager
      toast.info('Funcionalidad de revertir aprobación en desarrollo');
    },
    variant: 'danger' as const,
    title: "Revertir la aprobación de esta postulación",
    children: (
      <>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        <span>Anular Aprobación</span>
      </>
    )
  }), []);

  const containerClasses = useMemo(() =>
    `bg-white rounded-xl shadow-lg p-6 ${className}`,
    [className]
  );

  return (
    <div className={containerClasses}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Acciones Administrativas
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buttonConfigs.map(config => (
          <ActionButton
            key={config.key}
            onClick={config.onClick}
            disabled={config.disabled}
            variant={config.variant}
            title={config.title}
            className={config.key === 'contract-conditions' ? 'md:col-span-2' : ''}
          >
            {config.children}
          </ActionButton>
        ))}

        {showRevertButton && (
          <ActionButton
            key={revertButtonConfig.key}
            onClick={revertButtonConfig.onClick}
            variant={revertButtonConfig.variant}
            title={revertButtonConfig.title}
          >
            {revertButtonConfig.children}
          </ActionButton>
        )}
      </div>
    </div>
  );
});

MemoizedAdminActionsPanel.displayName = 'MemoizedAdminActionsPanel';


