import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MarketplaceLayout } from '../MarketplaceLayout';

const renderMarketplaceLayout = (props = {}, children = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <MarketplaceLayout {...props}>{children}</MarketplaceLayout>
    </BrowserRouter>
  );
};

describe('MarketplaceLayout', () => {
  it('renders children content', () => {
    renderMarketplaceLayout({}, <div>Marketplace Content</div>);
    expect(screen.getByText('Marketplace Content')).toBeInTheDocument();
  });

  it('renders filters when showFilters is true', () => {
    renderMarketplaceLayout({ showFilters: true });
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests
  it.todo('handles search functionality');
  it.todo('toggles filters sidebar');
  it.todo('renders filters content');
});





