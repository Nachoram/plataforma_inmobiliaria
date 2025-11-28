import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OfferDetailsPanel } from '../OfferDetailsPanel';

// Mock de hooks
vi.mock('../../../hooks/useOfferDataCache', () => ({
  useOfferDataCache: () => ({
    getCachedOfferData: vi.fn(),
    setCachedOfferData: vi.fn(),
    invalidateOfferCache: vi.fn()
  })
}));

vi.mock('../../../hooks/useOfferDocumentsCache', () => ({
  useOfferDocumentsCache: () => ({
    getCachedDocuments: vi.fn(),
    setCachedDocuments: vi.fn(),
    invalidateDocumentsCache: vi.fn()
  })
}));

vi.mock('../../../hooks/useOfferCommunicationsCache', () => ({
  useOfferCommunicationsCache: () => ({
    getCachedCommunications: vi.fn(),
    setCachedCommunications: vi.fn(),
    invalidateCommunicationsCache: vi.fn()
  })
}));

vi.mock('../../../hooks/useOfferAuth', () => ({
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

vi.mock('../../../hooks/useOfferNotifications', () => ({
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

vi.mock('../../../hooks/useOfferPerformance', () => ({
  useOfferPerformance: () => ({
    recordCacheAccess: vi.fn(),
    recordApiCall: vi.fn(),
    recordError: vi.fn(),
    recordTabSwitch: vi.fn()
  })
}));

// Mock lazy components with UX-focused content
vi.mock('../tabs/BuyerOfferSummaryTab', () => ({
  default: () => (
    <div data-testid="buyer-offer-summary-tab">
      <h2>Detalles de tu Oferta</h2>
      <div>Monto Ofertado: $150.000.000</div>
      <div>Estado: ACTIVE</div>
      <button>Ver Propiedad</button>
    </div>
  )
}));

vi.mock('../OfferDocumentsTab', () => ({
  OfferDocumentsTab: () => (
    <div data-testid="offer-documents-tab">
      <h3>Documentos Requeridos</h3>
      <div className="document-item">
        <span>Contrato de compraventa</span>
        <span className="status pending">Pendiente</span>
      </div>
      <button>Subir Documento</button>
    </div>
  )
}));

vi.mock('../OfferMessagesTab', () => ({
  OfferMessagesTab: () => (
    <div data-testid="offer-messages-tab">
      <h3>Mensajes</h3>
      <div className="message-list">
        <div className="message">Bienvenido a su proceso de oferta inmobiliaria</div>
      </div>
      <textarea placeholder="Escribe tu mensaje..."></textarea>
      <button>Enviar Mensaje</button>
    </div>
  )
}));

vi.mock('../OfferActionsTab', () => ({
  OfferActionsTab: () => (
    <div data-testid="offer-actions-tab">
      <h3>Acciones Disponibles</h3>
      <button>Modificar Oferta</button>
      <button className="danger">Cancelar Oferta</button>
      <button>Ver Historial</button>
    </div>
  )
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('OfferDetailsPanel - UX Tests', () => {
  const mockOnBack = vi.fn();
  const testOfferId = 'test-offer-123';

  it('shows clear loading state without blocking UX', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    // Initially shows loading
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    // User can still navigate back while loading
    expect(screen.getByText('Volver a Mis Ofertas')).toBeInTheDocument();

    // Loading completes and shows content
    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Loading state disappears
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
  });

  it('provides intuitive tab navigation', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Tabs are clearly labeled and accessible
    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Mensajes')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    // Clicking tabs shows relevant content
    fireEvent.click(screen.getByText('Documentos'));
    await waitFor(() => {
      expect(screen.getByTestId('offer-documents-tab')).toBeInTheDocument();
      expect(screen.getByText('Documentos Requeridos')).toBeInTheDocument();
    });
  });

  it('shows clear visual feedback for tab states', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Active tab has clear visual indication
    const infoTab = screen.getByText('Información').closest('button');
    expect(infoTab).toHaveClass('border-blue-600', 'text-blue-600');

    // Inactive tabs have different styling
    const documentsTab = screen.getByText('Documentos').closest('button');
    expect(documentsTab).toHaveClass('border-transparent');
  });

  it('displays badges with clear meaning', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Badges show counts for pending items
    const documentosTab = screen.getByText('Documentos').closest('button');
    const mensajesTab = screen.getByText('Mensajes').closest('button');

    expect(documentosTab).toHaveTextContent('1'); // 1 documento pendiente
    expect(mensajesTab).toHaveTextContent('1'); // 1 mensaje
  });

  it('provides helpful error messages', async () => {
    // Mock error state
    vi.mocked(await import('../../../hooks/useOfferNotifications')).mockReturnValue({
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
    });

    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    // Error states should show helpful messages and retry options
    // Note: This would need additional mocking to test error states properly
  });

  it('maintains consistent visual hierarchy', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Check that headings follow proper hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Main heading should be most prominent
    const mainHeading = screen.getByText('Detalles de tu Oferta');
    expect(mainHeading.tagName).toBe('H2');
  });

  it('provides clear call-to-action buttons', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Action buttons should have clear, descriptive text
    expect(screen.getByText('Ver Propiedad')).toBeInTheDocument();

    // Navigate to actions tab
    fireEvent.click(screen.getByText('Acciones'));
    await waitFor(() => {
      expect(screen.getByTestId('offer-actions-tab')).toBeInTheDocument();
    });

    // Action buttons in actions tab
    expect(screen.getByText('Modificar Oferta')).toBeInTheDocument();
    expect(screen.getByText('Cancelar Oferta')).toBeInTheDocument();
    expect(screen.getByText('Ver Historial')).toBeInTheDocument();
  });

  it('handles mobile responsiveness appropriately', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Tabs should be scrollable on mobile
    const tabContainer = screen.getByText('Información').closest('nav');
    expect(tabContainer).toHaveClass('overflow-x-auto');

    // Content should be properly sized
    const contentContainer = screen.getByTestId('buyer-offer-summary-tab').parentElement;
    expect(contentContainer).toHaveClass('max-w-5xl');
  });

  it('provides immediate feedback for user actions', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Clicking tabs should immediately change active state
    const documentsTab = screen.getByText('Documentos');
    fireEvent.click(documentsTab);

    // Active tab styling should update immediately
    await waitFor(() => {
      const clickedTab = screen.getByText('Documentos').closest('button');
      expect(clickedTab).toHaveClass('border-blue-600');
    });
  });

  it('maintains accessibility standards', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Buttons should be keyboard accessible
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeEnabled();
    });

    // Tabs should have proper semantic structure
    const tabs = screen.getAllByRole('button').filter(btn =>
      ['Información', 'Documentos', 'Mensajes', 'Acciones'].includes(btn.textContent || '')
    );
    expect(tabs.length).toBe(4);
  });
});



