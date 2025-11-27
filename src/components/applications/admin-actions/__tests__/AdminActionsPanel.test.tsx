/**
 * AdminActionsPanel.test.tsx
 *
 * Tests para el componente AdminActionsPanel
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminActionsPanel } from '../AdminActionsPanel';

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  }
}));

import toast from 'react-hot-toast';

const mockToast = toast as jest.Mocked<typeof toast>;

describe('AdminActionsPanel', () => {
  const mockPostulation = {
    id: 'test-postulation-id',
    status: 'pending'
  };

  const defaultProps = {
    postulation: mockPostulation,
    hasContractConditions: false,
    onShowContractForm: jest.fn(),
    onOpenContractModal: jest.fn(),
    onSetContractManuallyGenerated: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all admin action buttons', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      expect(screen.getByText('Acciones Administrativas')).toBeInTheDocument();
      expect(screen.getByText('Aprobar Postulación')).toBeInTheDocument();
      expect(screen.getByText('Solicitar Información')).toBeInTheDocument();
      expect(screen.getByText('Rechazar Postulación')).toBeInTheDocument();
      expect(screen.getByText('Modificar Aceptación')).toBeInTheDocument();
      expect(screen.getByText('Cancelar Postulación')).toBeInTheDocument();
      expect(screen.getByText('Generar Contrato')).toBeInTheDocument();
      expect(screen.getByText('Establecer Condiciones Contractuales')).toBeInTheDocument();
      expect(screen.getByText('Generar Informe Comercial Postulante')).toBeInTheDocument();
    });

    it('should show approved postulation actions when status is approved', () => {
      const approvedPostulation = { ...mockPostulation, status: 'aprobada' };
      render(<AdminActionsPanel {...defaultProps} postulation={approvedPostulation} />);

      expect(screen.getByText('Anular Aprobación')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should disable approve button when no contract conditions exist', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const approveButton = screen.getByText('Aprobar Postulación');
      expect(approveButton).toBeDisabled();
      expect(approveButton).toHaveClass('cursor-not-allowed');
    });

    it('should enable approve button when contract conditions exist', () => {
      render(<AdminActionsPanel {...defaultProps} hasContractConditions={true} />);

      const approveButton = screen.getByText('Aprobar Postulación');
      expect(approveButton).not.toBeDisabled();
      expect(approveButton).toHaveClass('bg-blue-600');
    });

    it('should disable generate contract button when no contract conditions exist', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const generateButton = screen.getByText('Generar Contrato');
      expect(generateButton).toBeDisabled();
    });

    it('should enable generate contract button when contract conditions exist', () => {
      render(<AdminActionsPanel {...defaultProps} hasContractConditions={true} />);

      const generateButton = screen.getByText('Generar Contrato');
      expect(generateButton).not.toBeDisabled();
    });
  });

  describe('Button Actions', () => {
    it('should call onShowContractForm when contract conditions button is clicked', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const conditionsButton = screen.getByText('Establecer Condiciones Contractuales');
      fireEvent.click(conditionsButton);

      expect(defaultProps.onShowContractForm).toHaveBeenCalledWith(true);
    });

    it('should call onOpenContractModal and onSetContractManuallyGenerated when generate contract button is clicked', () => {
      render(<AdminActionsPanel {...defaultProps} hasContractConditions={true} />);

      const generateButton = screen.getByText('Generar Contrato');
      fireEvent.click(generateButton);

      expect(defaultProps.onSetContractManuallyGenerated).toHaveBeenCalledWith(true);
      expect(defaultProps.onOpenContractModal).toHaveBeenCalled();
    });

    it('should show revert modal when anular button is clicked', () => {
      const approvedPostulation = { ...mockPostulation, status: 'aprobada' };
      render(<AdminActionsPanel {...defaultProps} postulation={approvedPostulation} />);

      const revertButton = screen.getByText('Anular Aprobación');
      fireEvent.click(revertButton);

      expect(screen.getByText('Revertir Aprobación')).toBeInTheDocument();
      expect(screen.getByText('¿Estás seguro de que quieres revertir la aprobación de esta postulación?')).toBeInTheDocument();
    });
  });

  describe('Toast Notifications', () => {
    it('should show info toast for approve application (placeholder)', () => {
      render(<AdminActionsPanel {...defaultProps} hasContractConditions={true} />);

      const approveButton = screen.getByText('Aprobar Postulación');
      fireEvent.click(approveButton);

      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de aprobación en desarrollo');
    });

    it('should show info toast for request info button', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const infoButton = screen.getByText('Solicitar Información');
      fireEvent.click(infoButton);

      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de solicitar información en desarrollo');
    });

    it('should show info toast for reject button', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const rejectButton = screen.getByText('Rechazar Postulación');
      fireEvent.click(rejectButton);

      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de rechazar en desarrollo');
    });

    it('should show info toast for modify acceptance button', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const modifyButton = screen.getByText('Modificar Aceptación');
      fireEvent.click(modifyButton);

      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de modificar aceptación en desarrollo');
    });

    it('should show info toast for cancel button', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const cancelButton = screen.getByText('Cancelar Postulación');
      fireEvent.click(cancelButton);

      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de cancelar en desarrollo');
    });

    it('should show info toast for commercial report button', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const reportButton = screen.getByText('Generar Informe Comercial Postulante');
      fireEvent.click(reportButton);

      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de generar informe comercial en desarrollo');
    });
  });

  describe('Revert Modal', () => {
    it('should close revert modal when cancel button is clicked', () => {
      const approvedPostulation = { ...mockPostulation, status: 'aprobada' };
      render(<AdminActionsPanel {...defaultProps} postulation={approvedPostulation} />);

      // Open modal
      const revertButton = screen.getByText('Anular Aprobación');
      fireEvent.click(revertButton);

      // Close modal
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Revertir Aprobación')).not.toBeInTheDocument();
    });

    it('should show loading state during revert confirmation', async () => {
      const approvedPostulation = { ...mockPostulation, status: 'aprobada' };
      render(<AdminActionsPanel {...defaultProps} postulation={approvedPostulation} />);

      // Open modal
      const revertButton = screen.getByText('Anular Aprobación');
      fireEvent.click(revertButton);

      // Click confirm
      const confirmButton = screen.getByText('Revertir Aprobación');
      fireEvent.click(confirmButton);

      // Should show placeholder message (no actual revert logic implemented)
      expect(mockToast.info).toHaveBeenCalledWith('Funcionalidad de revertir aprobación en desarrollo');
    });
  });

  describe('Tooltips and Titles', () => {
    it('should show correct tooltip for approve button when disabled', () => {
      render(<AdminActionsPanel {...defaultProps} />);

      const approveButton = screen.getByText('Aprobar Postulación');
      expect(approveButton).toHaveAttribute('title', 'Primero debe crear las condiciones del contrato');
    });

    it('should show correct tooltip for approve button when enabled', () => {
      render(<AdminActionsPanel {...defaultProps} hasContractConditions={true} />);

      const approveButton = screen.getByText('Aprobar Postulación');
      expect(approveButton).toHaveAttribute('title', 'Aprobar postulación y enviar contrato para generación automática');
    });

    it('should show tooltip for contract generation button', () => {
      render(<AdminActionsPanel {...defaultProps} hasContractConditions={true} />);

      const generateButton = screen.getByText('Generar Contrato');
      expect(generateButton).toHaveAttribute('title', 'Generar contrato basado en las condiciones establecidas');
    });
  });
});
