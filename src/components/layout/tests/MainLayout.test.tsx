import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MainLayout } from '../MainLayout';

const renderMainLayout = (props = {}, children = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <MainLayout {...props}>{children}</MainLayout>
    </BrowserRouter>
  );
};

describe('MainLayout', () => {
  it('renders children content', () => {
    renderMainLayout({}, <div>Main Content</div>);
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('applies custom maxWidth', () => {
    const { container } = renderMainLayout({ maxWidth: 'max-w-4xl' });
    const mainContent = container.querySelector('[class*="max-w-4xl"]');
    expect(mainContent).toBeInTheDocument();
  });

  it('renders sidebar when showSidebar is true', () => {
    renderMainLayout({ showSidebar: true, sidebarVariant: 'admin' });
    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  it('renders search bar when showSearch is true', () => {
    renderMainLayout({ showSearch: true });
    expect(screen.getByPlaceholderText('Buscar propiedades...')).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests
  it.todo('handles all configuration options');
  it.todo('integrates with all variants');
});






