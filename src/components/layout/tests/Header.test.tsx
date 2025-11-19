import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';
import { vi } from 'vitest';

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com'
    },
    signOut: vi.fn()
  })
}));

// Mock supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({
            data: {
              first_name: 'John',
              paternal_last_name: 'Doe',
              maternal_last_name: 'Smith'
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

const renderHeader = (props = {}) => {
  return render(
    <BrowserRouter>
      <Header {...props} />
    </BrowserRouter>
  );
};

describe('Header', () => {
  it('renders logo', () => {
    renderHeader();
    const logo = screen.getByAltText('PROPAI Logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation items for authenticated user', () => {
    renderHeader({ variant: 'default' });
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('Mi Portafolio')).toBeInTheDocument();
  });

  it('renders search bar when showSearch is true', () => {
    renderHeader({ showSearch: true });
    const searchInput = screen.getByPlaceholderText('Buscar propiedades...');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', () => {
    const onSearchChange = vi.fn();
    renderHeader({ showSearch: true, onSearchChange });

    const searchInput = screen.getByPlaceholderText('Buscar propiedades...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(onSearchChange).toHaveBeenCalledWith('test search');
  });

  it('renders filters button when showFilters is true', () => {
    renderHeader({ showFilters: true });
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('renders user menu when authenticated', () => {
    renderHeader();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders login button when not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(require('../../../hooks/useAuth')).useAuth.mockReturnValue({
      user: null,
      signOut: vi.fn()
    });

    renderHeader();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });
});




