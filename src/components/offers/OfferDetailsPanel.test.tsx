import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OfferDetailsPanel } from './OfferDetailsPanel';

// Mock de hooks y dependencias
vi.mock('../../hooks/useOfferDataCache', () => ({
  useOfferDataCache: () => ({
    getCachedOfferData: vi.fn(),
    setCachedOfferData: vi.fn(),
    invalidateOfferCache: vi.fn()
  })
}));

vi.mock('../../hooks/useOfferDocumentsCache', () => ({
  useOfferDocumentsCache: () => ({
    getCachedDocuments: vi.fn(),
    setCachedDocuments: vi.fn(),
    invalidateDocumentsCache: vi.fn()
  })
}));

vi.mock('../../hooks/useOfferCommunicationsCache', () => ({
  useOfferCommunicationsCache: () => ({
    getCachedCommunications: vi.fn(),
    setCachedCommunications: vi.fn(),
    invalidateCommunicationsCache: vi.fn()
  })
}));

vi.mock('../../hooks/useOfferAuth', () => ({
  useOfferAuth: () => ({
    isAuthenticated: true,
    userId: 'test-user',
    userRole: 'buyer',
    permissions: {
      canViewOffer: true,
      canEditOffer: false,
      canDeleteOffer: false,
      canUploadDocuments: true,
      canSendMessages: true
    },
    isLoading: false,
    error: null,
    hasPermission: vi.fn(() => true),
    canAccessOffer: vi.fn(() => Promise.resolve(true))
  })
}));

vi.mock('../../hooks/useOfferNotifications', () => ({
  useOfferNotifications: () => ({
    offerLoaded: vi.fn(),
    offerLoadError: vi.fn(),
    documentsLoaded: vi.fn(),
    documentsLoadError: vi.fn(),
    messagesLoaded: vi.fn(),
    messageSent: vi.fn(),
    messageSendError: vi.fn(),
    documentUploaded: vi.fn(),
    documentUploadError: vi.fn(),
    offerUpdated: vi.fn(),
    offerUpdateError: vi.fn(),
    permissionDenied: vi.fn(),
    sessionExpired: vi.fn(),
    networkError: vi.fn(),
    cacheCleared: vi.fn(),
    dataRefreshed: vi.fn()
  })
}));

vi.mock('../../hooks/useOfferPerformance', () => ({
  useOfferPerformance: () => ({
    recordCacheAccess: vi.fn(),
    recordApiCall: vi.fn(),
    recordError: vi.fn(),
    recordTabSwitch: vi.fn()
  })
}));

// Mock de lazy components
vi.mock('./tabs/BuyerOfferSummaryTab', () => ({
  default: ({ offer }: any) => <div data-testid="buyer-offer-summary-tab">BuyerOfferSummaryTab: {offer?.id}</div>
}));

vi.mock('./OfferDocumentsTab', () => ({
  OfferDocumentsTab: ({ viewMode }: any) => <div data-testid="offer-documents-tab">OfferDocumentsTab: {viewMode}</div>
}));

vi.mock('./OfferMessagesTab', () => ({
  OfferMessagesTab: () => <div data-testid="offer-messages-tab">OfferMessagesTab</div>
}));

vi.mock('./OfferActionsTab', () => ({
  OfferActionsTab: () => <div data-testid="offer-actions-tab">OfferActionsTab</div>
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('OfferDetailsPanel', () => {
  const mockOnBack = vi.fn();
  const testOfferId = 'test-offer-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders offer header with correct ID after loading', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText(`Oferta #${testOfferId.slice(0, 8)}`)).toBeInTheDocument();
    });
  });

  it('renders all tab buttons', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('Información')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Mensajes')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
    });
  });

  it('shows badges on tabs with data', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      // Los badges se muestran en los datos de muestra (1 documento, 1 mensaje)
      const documentosTab = screen.getByText('Documentos').closest('button');
      const mensajesTab = screen.getByText('Mensajes').closest('button');

      expect(documentosTab).toHaveTextContent('1');
      expect(mensajesTab).toHaveTextContent('1');
    });
  });

  it('renders default tab content (BuyerOfferSummaryTab)', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });
  });

  it('changes tab content when clicking tabs', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Click on Documents tab
    fireEvent.click(screen.getByText('Documentos'));

    await waitFor(() => {
      expect(screen.getByTestId('offer-documents-tab')).toBeInTheDocument();
      expect(screen.getByText('buyer')).toBeInTheDocument(); // viewMode prop
    });

    // Click on Messages tab
    fireEvent.click(screen.getByText('Mensajes'));

    await waitFor(() => {
      expect(screen.getByTestId('offer-messages-tab')).toBeInTheDocument();
    });

    // Click on Actions tab
    fireEvent.click(screen.getByText('Acciones'));

    await waitFor(() => {
      expect(screen.getByTestId('offer-actions-tab')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('Volver a Mis Ofertas')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Volver a Mis Ofertas'));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('displays offer data correctly in summary tab', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      const summaryTab = screen.getByTestId('buyer-offer-summary-tab');
      expect(summaryTab).toHaveTextContent(testOfferId);
    });
  });

  it('handles tab switching correctly', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Click different tabs and verify active states
    const documentosTab = screen.getByText('Documentos');
    fireEvent.click(documentosTab);

    await waitFor(() => {
      expect(screen.getByTestId('offer-documents-tab')).toBeInTheDocument();
    });

    // Verify we can go back to info tab
    const infoTab = screen.getByText('Información');
    fireEvent.click(infoTab);

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });
  });
});
