import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../AuthLayout';

const renderAuthLayout = (props = {}, children = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <AuthLayout {...props}>{children}</AuthLayout>
    </BrowserRouter>
  );
};

describe('AuthLayout', () => {
  it('renders title and subtitle', () => {
    renderAuthLayout({
      title: 'Test Title',
      subtitle: 'Test Subtitle'
    });

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderAuthLayout({}, <div>Custom Content</div>);
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('renders logo', () => {
    renderAuthLayout();
    const logo = screen.getByAltText('PROPAI Logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders footer links', () => {
    renderAuthLayout();
    expect(screen.getByText('Términos de Servicio')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
  });
});
