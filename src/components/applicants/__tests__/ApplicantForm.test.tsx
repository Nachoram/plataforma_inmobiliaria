import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ApplicantForm from '../ApplicantForm';

// Mock de CustomButton
vi.mock('../../common/CustomButton', () => ({
  default: ({ children, onClick, loading, type }: any) => (
    <button
      onClick={onClick}
      disabled={loading}
      type={type || 'button'}
      data-testid="custom-button"
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}));

describe('ApplicantForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with required fields', () => {
    render(
      <ApplicantForm
        initialData={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Completar Perfil')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido paterno \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido materno \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rut \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ApplicantForm
        initialData={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /guardar perfil/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nombre es requerido')).toBeInTheDocument();
      expect(screen.getByText('Apellido paterno es requerido')).toBeInTheDocument();
      expect(screen.getByText('RUT es requerido')).toBeInTheDocument();
      expect(screen.getByText('Email es requerido')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates RUT format', async () => {
    render(
      <ApplicantForm
        initialData={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const rutInput = screen.getByLabelText(/rut \*/i);
    fireEvent.change(rutInput, { target: { value: 'invalid-rut' } });

    const submitButton = screen.getByRole('button', { name: /guardar perfil/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('RUT inválido')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <ApplicantForm
        initialData={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const emailInput = screen.getByLabelText(/email \*/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /guardar perfil/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ApplicantForm
        initialData={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('pre-fills form with initial data', () => {
    const initialData = {
      first_name: 'Juan',
      email: 'juan@example.com',
      rut: '12345678-9'
    };

    render(
      <ApplicantForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('juan@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345678-9')).toBeInTheDocument();
    expect(screen.getByText('Editar Perfil')).toBeInTheDocument();
  });
});








