import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuyerOfferHeader } from './BuyerOfferHeader';
import { SaleOffer } from './types';

const mockOffer: SaleOffer = {
  id: 'test-offer-123',
  buyer_id: 'buyer-123',
  status: 'active',
  offer_amount: 150000000,
  offer_amount_currency: 'CLP',
  created_at: '2025-01-27T10:00:00Z',
  updated_at: '2025-01-27T10:00:00Z',
  property: {
    id: 'property-123',
    address_street: 'Calle Test',
    address_number: '123',
    address_commune: 'Providencia',
    address_region: 'Metropolitana'
  }
};

describe('BuyerOfferHeader', () => {
  const mockOnBack = vi.fn();
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders back button with correct text', () => {
    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={[]}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('Volver a Mis Ofertas')).toBeInTheDocument();
  });

  it('renders offer ID correctly', () => {
    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={[]}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('Oferta #test-off')).toBeInTheDocument();
  });

  it('renders loading state when offer is null', () => {
    render(
      <BuyerOfferHeader
        offer={null}
        activeTab="info"
        buyerTabs={[]}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('Oferta #Cargando...')).toBeInTheDocument();
  });

  it('renders all tab buttons', () => {
    const tabs = [
      { id: 'info', label: 'Información', icon: vi.fn() },
      { id: 'documents', label: 'Documentos', icon: vi.fn() },
      { id: 'messages', label: 'Mensajes', icon: vi.fn() }
    ];

    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={tabs}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Mensajes')).toBeInTheDocument();
  });

  it('shows active tab styling correctly', () => {
    const tabs = [
      { id: 'info', label: 'Información', icon: vi.fn() },
      { id: 'documents', label: 'Documentos', icon: vi.fn() }
    ];

    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={tabs}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    const infoTab = screen.getByText('Información').closest('button');
    const documentsTab = screen.getByText('Documentos').closest('button');

    expect(infoTab).toHaveClass('border-blue-600', 'text-blue-600');
    expect(documentsTab).toHaveClass('border-transparent');
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={[]}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    fireEvent.click(screen.getByText('Volver a Mis Ofertas'));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onTabChange when tab is clicked', () => {
    const tabs = [
      { id: 'info', label: 'Información', icon: vi.fn() },
      { id: 'documents', label: 'Documentos', icon: vi.fn() }
    ];

    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={tabs}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    fireEvent.click(screen.getByText('Documentos'));

    expect(mockOnTabChange).toHaveBeenCalledWith('documents');
    expect(mockOnTabChange).toHaveBeenCalledTimes(1);
  });

  it('displays badges on tabs with count', () => {
    const tabs = [
      { id: 'documents', label: 'Documentos', icon: vi.fn(), badge: 3 },
      { id: 'messages', label: 'Mensajes', icon: vi.fn(), badge: 0 }
    ];

    render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={tabs}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    const documentosButton = screen.getByText('Documentos').closest('button');
    const mensajesButton = screen.getByText('Mensajes').closest('button');

    expect(documentosButton).toHaveTextContent('3');
    expect(mensajesButton).not.toHaveTextContent('0'); // No mostrar badge si es 0
  });

  it('has sticky positioning', () => {
    const { container } = render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={[]}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    const header = container.firstChild;
    expect(header).toHaveClass('sticky', 'top-0', 'z-10');
  });

  it('has proper responsive classes', () => {
    const { container } = render(
      <BuyerOfferHeader
        offer={mockOffer}
        activeTab="info"
        buyerTabs={[]}
        onBack={mockOnBack}
        onTabChange={mockOnTabChange}
      />
    );

    const headerContainer = container.querySelector('.max-w-5xl');
    expect(headerContainer).toBeInTheDocument();
  });
});


