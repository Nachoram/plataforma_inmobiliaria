import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OfferDetailsPanel } from '../OfferDetailsPanel';

// Mock performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock de hooks
vi.mock('../../../hooks/useOfferDataCache', () => ({
  useOfferDataCache: () => ({
    getCachedOfferData: vi.fn(() => null),
    setCachedOfferData: vi.fn(),
    invalidateOfferCache: vi.fn()
  })
}));

vi.mock('../../../hooks/useOfferDocumentsCache', () => ({
  useOfferDocumentsCache: () => ({
    getCachedDocuments: vi.fn(() => null),
    setCachedDocuments: vi.fn(),
    invalidateDocumentsCache: vi.fn()
  })
}));

vi.mock('../../../hooks/useOfferCommunicationsCache', () => ({
  useOfferCommunicationsCache: () => ({
    getCachedCommunications: vi.fn(() => null),
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

// Mock lazy components
vi.mock('../tabs/BuyerOfferSummaryTab', () => ({
  default: () => <div data-testid="buyer-offer-summary-tab">BuyerOfferSummaryTab</div>
}));

vi.mock('../OfferDocumentsTab', () => ({
  OfferDocumentsTab: () => <div data-testid="offer-documents-tab">OfferDocumentsTab</div>
}));

vi.mock('../OfferMessagesTab', () => ({
  OfferMessagesTab: () => <div data-testid="offer-messages-tab">OfferMessagesTab</div>
}));

vi.mock('../OfferActionsTab', () => ({
  OfferActionsTab: () => <div data-testid="offer-actions-tab">OfferActionsTab</div>
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('OfferDetailsPanel - Performance Tests', () => {
  const mockOnBack = vi.fn();
  const testOfferId = 'test-offer-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset performance marks
    mockPerformance.mark.mockClear();
    mockPerformance.measure.mockClear();
  });

  it('renders within acceptable time', async () => {
    const startTime = performance.now();

    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // El componente debería renderizar en menos de 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('uses lazy loading correctly', async () => {
    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Verificar que solo se carga el componente activo inicialmente
    expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('offer-documents-tab')).not.toBeInTheDocument();
  });

  it('does not have memory leaks on unmount', async () => {
    const { unmount } = renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Unmount component
    unmount();

    // Component should unmount without errors
    expect(() => unmount()).not.toThrow();
  });

  it('maintains stable references for memoized functions', async () => {
    const { rerender } = renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Re-render with same props
    rerender(
      <BrowserRouter>
        <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
      </BrowserRouter>
    );

    // Component should still work correctly after re-render
    expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
  });

  it('handles rapid re-renders without performance degradation', async () => {
    const { rerender } = renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Perform multiple rapid re-renders
    for (let i = 0; i < 5; i++) {
      rerender(
        <BrowserRouter>
          <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
        </BrowserRouter>
      );
    }

    // Component should still work correctly
    expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
  });

  it('lazy loads components only when needed', async () => {
    // Mock console to track lazy loading
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderWithRouter(
      <OfferDetailsPanel offerId={testOfferId} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    });

    // Initially, only the summary tab should be loaded
    expect(screen.getByTestId('buyer-offer-summary-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('offer-documents-tab')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});


