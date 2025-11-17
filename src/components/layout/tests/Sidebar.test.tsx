import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { vi } from 'vitest';

const renderSidebar = (props = {}) => {
  return render(
    <BrowserRouter>
      <Sidebar {...props} />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  it('renders admin sidebar with correct items', () => {
    renderSidebar({ variant: 'admin' });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByText('Postulaciones')).toBeInTheDocument();
  });

  it('renders applicant sidebar with correct items', () => {
    renderSidebar({ variant: 'applicant' });

    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Mis Postulaciones')).toBeInTheDocument();
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
  });

  it('shows collapsed state when isCollapsed is true', () => {
    renderSidebar({ variant: 'admin', isCollapsed: true });

    // When collapsed, text labels should not be visible
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when toggle button is clicked', () => {
    const onToggleCollapse = vi.fn();
    renderSidebar({ variant: 'admin', onToggleCollapse });

    const toggleButton = screen.getByLabelText('Colapsar sidebar');
    fireEvent.click(toggleButton);

    expect(onToggleCollapse).toHaveBeenCalled();
  });
});
