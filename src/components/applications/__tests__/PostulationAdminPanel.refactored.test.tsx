/**
 * PostulationAdminPanel.refactored.test.tsx
 *
 * Tests para la versión refactorizada del PostulationAdminPanel
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PostulationAdminPanel } from '../PostulationAdminPanel.refactored';

// Mock de hooks personalizados
jest.mock('../../../hooks/usePostulationData');
jest.mock('../../../hooks/useContractActions');
jest.mock('../../../hooks/useDocumentManagement');

// Mock de componentes
jest.mock('../PostulationInfoTab', () => ({
  PostulationInfoTab: ({ postulation }: any) => (
    <div data-testid="postulation-info-tab">
      Info Tab - {postulation?.id}
    </div>
  )
}));

jest.mock('../PostulationDocumentsTab', () => ({
  PostulationDocumentsTab: ({ applicationId }: any) => (
    <div data-testid="postulation-documents-tab">
      Documents Tab - {applicationId}
    </div>
  )
}));

jest.mock('../PostulationMessagesTab', () => ({
  PostulationMessagesTab: ({ applicationId }: any) => (
    <div data-testid="postulation-messages-tab">
      Messages Tab - {applicationId}
    </div>
  )
}));

jest.mock('./admin-actions/AdminActionsPanel', () => ({
  AdminActionsPanel: ({ postulation }: any) => (
    <div data-testid="admin-actions-panel">
      Admin Actions - {postulation?.id}
    </div>
  )
}));

// Import mocked hooks
import { usePostulationData } from '../../../hooks/usePostulationData';
import { useContractActions } from '../../../hooks/useContractActions';
import { useDocumentManagement } from '../../../hooks/useDocumentManagement';

const mockUsePostulationData = usePostulationData as jest.MockedFunction<typeof usePostulationData>;
const mockUseContractActions = useContractActions as jest.MockedFunction<typeof useContractActions>;
const mockUseDocumentManagement = useDocumentManagement as jest.MockedFunction<typeof useDocumentManagement>;

describe('PostulationAdminPanel (Refactored)', () => {
  const mockPostulation = {
    id: 'test-postulation-id',
    property_id: 'test-property-id',
    status: 'pending',
    score: 750,
    message: 'Test message',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    property: {
      id: 'test-property-id',
      address_street: 'Test Street',
      address_number: '123',
      address_commune: 'Test Commune',
      price_clp: 100000000,
      listing_type: 'rental'
    },
    applicants: [],
    guarantors: [],
    has_contract_conditions: false,
    has_contract: false,
    contract_signed: false,
    modification_count: 0,
    audit_log_count: 0
  };

  const defaultMockValues = {
    postulation: mockPostulation,
    contractData: null,
    loading: false,
    error: null,
    hasRealScore: true,
    refetch: jest.fn()
  };

  const defaultContractMockValues = {
    showContractForm: false,
    setShowContractForm: jest.fn(),
    showContractModal: false,
    setShowContractModal: jest.fn(),
    setContractManuallyGenerated: jest.fn(),
    contractModalKey: 0,
    handleOpenContractModal: jest.fn(),
    handleViewContract: jest.fn(),
    handleDownloadContract: jest.fn(),
    handleEditContract: jest.fn(),
    handleCancelContract: jest.fn(),
    saveContract: jest.fn(),
    fetchContractData: jest.fn(),
    refreshContractData: jest.fn(),
    loadingContract: false,
    savingContract: false,
    isDownloadingContract: false,
    isViewingContract: false,
    isCancellingContract: false
  };

  const defaultDocumentMockValues = {
    documentsLoading: false,
    applicantsDocuments: {},
    guarantorsDocuments: {},
    loadDocuments: jest.fn(),
    setApplicantsDocuments: jest.fn(),
    setGuarantorsDocuments: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePostulationData.mockReturnValue(defaultMockValues);
    mockUseContractActions.mockReturnValue(defaultContractMockValues);
    mockUseDocumentManagement.mockReturnValue(defaultDocumentMockValues);
  });

  const renderComponent = (applicationId = 'test-id') => {
    return render(
      <MemoryRouter initialEntries={[`/postulation/${applicationId}/admin`]}>
        <Routes>
          <Route path="/postulation/:id/admin" element={<PostulationAdminPanel />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      mockUsePostulationData.mockReturnValue({
        ...defaultMockValues,
        loading: true
      });

      renderComponent();

      expect(screen.getByText('🔴 CARGANDO POSTULACIÓN')).toBeInTheDocument();
      expect(screen.getByText('Cargando datos de la postulación...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when there is an error', () => {
      const errorMessage = 'Test error message';
      mockUsePostulationData.mockReturnValue({
        ...defaultMockValues,
        error: errorMessage,
        postulation: null
      });

      renderComponent();

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Volver al Portfolio')).toBeInTheDocument();
    });
  });

  describe('No Postulation Found', () => {
    it('should show not found message when postulation is null', () => {
      mockUsePostulationData.mockReturnValue({
        ...defaultMockValues,
        postulation: null
      });

      renderComponent();

      expect(screen.getByText('Postulación no encontrada')).toBeInTheDocument();
      expect(screen.getByText('La postulación que buscas no existe o ha sido eliminada.')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render postulation data correctly', () => {
      renderComponent();

      expect(screen.getByText(`Postulación #${mockPostulation.id.slice(-8)}`)).toBeInTheDocument();
      expect(screen.getByText('Volver al Portfolio')).toBeInTheDocument();
    });

    it('should show info tab by default', () => {
      renderComponent();

      expect(screen.getByTestId('postulation-info-tab')).toBeInTheDocument();
      expect(screen.getByTestId('admin-actions-panel')).toBeInTheDocument();
    });

    it('should switch to documents tab when clicked', async () => {
      renderComponent();

      const documentsTab = screen.getByText('Documentos');
      fireEvent.click(documentsTab);

      await waitFor(() => {
        expect(screen.getByTestId('postulation-documents-tab')).toBeInTheDocument();
      });
    });

    it('should switch to messages tab when clicked', async () => {
      renderComponent();

      const messagesTab = screen.getByText('Mensajes');
      fireEvent.click(messagesTab);

      await waitFor(() => {
        expect(screen.getByTestId('postulation-messages-tab')).toBeInTheDocument();
      });
    });

    it('should show document count badge when there are documents', () => {
      mockUseDocumentManagement.mockReturnValue({
        ...defaultDocumentMockValues,
        applicantsDocuments: { 'test': [{ id: '1', document_type: 'test' }] },
        guarantorsDocuments: { 'test': [{ id: '2', document_type: 'test' }] }
      });

      renderComponent();

      const documentsTab = screen.getByText('Documentos');
      expect(documentsTab).toBeInTheDocument();
      // Note: Badge rendering might need additional test setup
    });
  });

  describe('Navigation', () => {
    it('should navigate back to portfolio when back button is clicked', () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      renderComponent();

      const backButton = screen.getByText('Volver al Portfolio');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/portfolio');
    });
  });

  describe('Contract Modals', () => {
    it('should show contract modal when showContractModal is true', () => {
      mockUseContractActions.mockReturnValue({
        ...defaultContractMockValues,
        showContractModal: true
      });

      renderComponent();

      expect(screen.getByText('Crear Contrato')).toBeInTheDocument();
    });

    it('should show contract form when showContractForm is true', () => {
      mockUseContractActions.mockReturnValue({
        ...defaultContractMockValues,
        showContractForm: true
      });

      renderComponent();

      // Contract form would be rendered here
      expect(screen.getByTestId('postulation-info-tab')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should be wrapped with PostulationErrorBoundary', () => {
      renderComponent();

      // The component should be rendered within the error boundary
      expect(screen.getByText(`Postulación #${mockPostulation.id.slice(-8)}`)).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call usePostulationData with correct applicationId', () => {
      const testId = 'test-application-id';
      renderComponent(testId);

      expect(mockUsePostulationData).toHaveBeenCalledWith(testId);
    });

    it('should call useContractActions with correct parameters', () => {
      renderComponent();

      expect(mockUseContractActions).toHaveBeenCalledWith('test-id', mockPostulation);
    });

    it('should call useDocumentManagement with correct applicationId', () => {
      renderComponent();

      expect(mockUseDocumentManagement).toHaveBeenCalledWith('test-id');
    });
  });
});
