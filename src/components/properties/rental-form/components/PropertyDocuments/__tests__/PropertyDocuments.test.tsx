import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PropertyDocuments } from '../PropertyDocuments';

// Mock de ProgressiveDocumentUpload
vi.mock('../../../../documents/ProgressiveDocumentUpload', () => ({
  ProgressiveDocumentUpload: ({ entityType, entityId, requiredDocuments }: any) => (
    <div data-testid="progressive-document-upload">
      ProgressiveDocumentUpload Mock - {entityType} - {entityId} - {requiredDocuments.length} docs
    </div>
  )
}));

describe('PropertyDocuments Component', () => {
  const mockOnDocumentUpload = vi.fn();
  const mockOnDocumentRemove = vi.fn();

  const defaultProps = {
    propertyType: 'Casa' as const,
    owners: [],
    onDocumentUpload: mockOnDocumentUpload,
    onDocumentRemove: mockOnDocumentRemove,
    errors: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in creation mode (default)', () => {
    render(<PropertyDocuments {...defaultProps} />);

    expect(screen.getByText('Documentos Legales')).toBeInTheDocument();
    expect(screen.getByText('Carga Progresiva de Documentos')).toBeInTheDocument();
    expect(screen.getByText('Certificado de Dominio Vigente')).toBeInTheDocument();
    expect(screen.getByText('Certificado de Avalúo Fiscal')).toBeInTheDocument();
  });

  it('renders correctly in editing mode with entityId', () => {
    render(
      <PropertyDocuments
        {...defaultProps}
        isEditing={true}
        entityId="test-property-id"
      />
    );

    expect(screen.getByText('Documentos Legales')).toBeInTheDocument();
    expect(screen.getByText('Modo Edición:')).toBeInTheDocument();
    expect(screen.getByTestId('progressive-document-upload')).toBeInTheDocument();
  });

  it('shows all required rental documents', () => {
    render(<PropertyDocuments {...defaultProps} />);

    const expectedDocuments = [
      'Certificado de Dominio Vigente',
      'Certificado de Avalúo Fiscal',
      'Certificado de Hipoteca y Gravamen',
      'Fotocopia de Cédula de Identidad del Propietario',
      'Poder (si aplica)',
      'Evaluación Comercial de la Propiedad',
      'Certificado de Personería'
    ];

    expectedDocuments.forEach(docName => {
      expect(screen.getByText(docName)).toBeInTheDocument();
    });
  });

  it('shows optional badges for all documents', () => {
    render(<PropertyDocuments {...defaultProps} />);

    const optionalBadges = screen.getAllByText('OPCIONAL');
    expect(optionalBadges).toHaveLength(7); // 7 documentos, todos opcionales
  });

  it('displays document errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: { documents: 'Error al subir documento' }
    };

    render(<PropertyDocuments {...propsWithErrors} />);

    expect(screen.getByText('Error al subir documento')).toBeInTheDocument();
  });

  it('passes correct props to ProgressiveDocumentUpload in edit mode', () => {
    render(
      <PropertyDocuments
        {...defaultProps}
        isEditing={true}
        entityId="test-property-id"
      />
    );

    const mockComponent = screen.getByTestId('progressive-document-upload');
    expect(mockComponent).toHaveTextContent('ProgressiveDocumentUpload Mock - property - test-property-id - 7 docs');
  });

  it('does not render ProgressiveDocumentUpload in creation mode', () => {
    render(<PropertyDocuments {...defaultProps} />);

    expect(screen.queryByTestId('progressive-document-upload')).not.toBeInTheDocument();
  });

  it('renders informative message in creation mode', () => {
    render(<PropertyDocuments {...defaultProps} />);

    expect(screen.getByText(/No es necesario que tengas todos los documentos ahora/)).toBeInTheDocument();
    expect(screen.getByText(/Podrás subirlos en cualquier momento/)).toBeInTheDocument();
  });

  it('renders edit mode message when in editing mode', () => {
    render(
      <PropertyDocuments
        {...defaultProps}
        isEditing={true}
        entityId="test-property-id"
      />
    );

    expect(screen.getByText('Modo Edición: Puedes gestionar los documentos directamente aquí.')).toBeInTheDocument();
  });

  it('handles empty errors object', () => {
    render(<PropertyDocuments {...defaultProps} errors={{}} />);

    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  });

  it('handles undefined errors', () => {
    render(<PropertyDocuments {...defaultProps} errors={undefined} />);

    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
  });

  it('renders with different property types', () => {
    const propertyTypes = ['Casa', 'Departamento', 'Oficina', 'Local Comercial', 'Bodega'] as const;

    propertyTypes.forEach(type => {
      const { rerender } = render(
        <PropertyDocuments
          {...defaultProps}
          propertyType={type}
        />
      );

      // El componente debería renderizarse sin errores con cualquier tipo
      expect(screen.getByText('Documentos Legales')).toBeInTheDocument();
    });
  });

  it('maintains memo optimization', () => {
    const { rerender } = render(<PropertyDocuments {...defaultProps} />);

    // Re-render con las mismas props - debería usar memo
    rerender(<PropertyDocuments {...defaultProps} />);

    // Component should still be rendered correctly
    expect(screen.getByText('Documentos Legales')).toBeInTheDocument();
  });
});
