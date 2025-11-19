import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../AdminLayout';

const renderAdminLayout = (props = {}, children = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <AdminLayout {...props}>{children}</AdminLayout>
    </BrowserRouter>
  );
};

describe('AdminLayout', () => {
  it('renders children content', () => {
    renderAdminLayout({}, <div>Admin Content</div>);
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderAdminLayout({ title: 'Admin Dashboard' });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    renderAdminLayout();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests
  it.todo('handles custom breadcrumbs');
  it.todo('toggles sidebar collapse');
  it.todo('renders sidebar navigation');
});





