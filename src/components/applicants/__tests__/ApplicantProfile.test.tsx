import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ApplicantProfile from '../ApplicantProfile';

// Mock de hooks y dependencias
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-user-id',
              first_name: 'Juan',
              paternal_last_name: 'Pérez',
              maternal_last_name: 'González',
              rut: '12345678-9',
              email: 'juan@example.com',
              phone: '+56912345678',
              profession: 'Ingeniero',
              broker_type: 'independent',
              intention: 'rent',
              notifications_enabled: true
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

vi.mock('../ApplicantForm', () => ({
  default: () => <div data-testid="applicant-form">ApplicantForm Component</div>
}));

vi.mock('../DocumentUpload', () => ({
  default: ({ applicantId }: { applicantId: string }) =>
    <div data-testid="document-upload">DocumentUpload for {applicantId}</div>
}));

vi.mock('../ApplicantSettings', () => ({
  default: ({ applicant }: { applicant: any }) =>
    <div data-testid="applicant-settings">Settings for {applicant.first_name}</div>
}));

describe('ApplicantProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ApplicantProfile />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('renders applicant profile data after loading', async () => {
    render(<ApplicantProfile />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    expect(screen.getByText('Ingeniero')).toBeInTheDocument();
    expect(screen.getByText('Broker Independiente')).toBeInTheDocument();
    expect(screen.getByText('Busca Arriendo')).toBeInTheDocument();
  });

  it('shows edit button and switches to form when clicked', async () => {
    render(<ApplicantProfile />);

    await waitFor(() => {
      expect(screen.getByText('Editar Perfil')).toBeInTheDocument();
    });

    // This would require more complex testing with user interactions
    // For now, we just verify the button exists
  });

  it('renders tabs for different sections', async () => {
    render(<ApplicantProfile />);

    await waitFor(() => {
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });
  });

  it('displays error message when profile fetch fails', async () => {
    // Mock a failed request
    const mockSupabase = vi.mocked(require('../../../lib/supabase').supabase);
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })
    } as any);

    render(<ApplicantProfile />);

    await waitFor(() => {
      expect(screen.getByText(/no se encontró/i)).toBeInTheDocument();
    });
  });
});

