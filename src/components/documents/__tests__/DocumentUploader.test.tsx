import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DocumentUploader from '../DocumentUploader';

// Mock de dependencias
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.pdf' } }))
      }))
    }
  }
}));

vi.mock('../DocumentValidator', () => ({
  DocumentValidator: () => <div data-testid="document-validator">Validator Component</div>
}));

vi.mock('../../common/CustomButton', () => ({
  default: ({ children, onClick, loading }: any) => (
    <button onClick={onClick} disabled={loading} data-testid="custom-button">
      {loading ? 'Cargando...' : children}
    </button>
  )
}));

describe('DocumentUploader', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area', () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
      />
    );

    expect(screen.getByText(/Arrastra y suelta archivos aquí/)).toBeInTheDocument();
    expect(screen.getByText(/Cédula de Identidad - Postulante/)).toBeInTheDocument();
  });

  it('shows drag over state when dragging files', () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const uploadArea = screen.getByText(/Arrastra y suelta archivos aquí/).closest('div');

    fireEvent.dragOver(uploadArea!);
    expect(uploadArea).toHaveClass('border-blue-500');
  });

  it('handles file selection through input', async () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByDisplayValue('') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('validates files before upload', async () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
      />
    );

    // Create an invalid file (wrong type)
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByDisplayValue('') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [invalidFile] } });

    // Should not show the file in the list due to validation
    await waitFor(() => {
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    });
  });

  it('uploads valid files when upload button is clicked', async () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const validFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByDisplayValue('') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const uploadButton = screen.getByTestId('custom-button');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
    });
  });

  it('removes files from selection', async () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByDisplayValue('') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Find and click remove button (X icon)
    const removeButton = screen.getByTitle('Remover');
    fireEvent.click(removeButton);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <DocumentUploader
        documentType="applicant_id"
        onUploadComplete={mockOnUploadComplete}
        disabled={true}
      />
    );

    const uploadArea = screen.getByText(/Arrastra y suelta archivos aquí/).closest('div');
    expect(uploadArea).toHaveClass('cursor-not-allowed');
  });
});

