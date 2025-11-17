import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DocumentValidator } from '../DocumentValidator';

describe('DocumentValidator', () => {
  it('renders validation results for valid file', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    render(
      <DocumentValidator
        file={file}
        documentType="applicant_id"
        showResults={true}
      />
    );

    expect(screen.getByText('Documento válido')).toBeInTheDocument();
  });

  it('renders validation errors for invalid file type', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(
      <DocumentValidator
        file={file}
        documentType="applicant_id"
        showResults={true}
      />
    );

    expect(screen.getByText('Errores de validación')).toBeInTheDocument();
    expect(screen.getByText(/Tipo de archivo no permitido/)).toBeInTheDocument();
  });

  it('renders validation errors for oversized file', () => {
    // Create a file larger than 5MB (max for applicant_id)
    const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

    render(
      <DocumentValidator
        file={file}
        documentType="applicant_id"
        showResults={true}
      />
    );

    expect(screen.getByText('Errores de validación')).toBeInTheDocument();
    expect(screen.getByText(/demasiado grande/)).toBeInTheDocument();
  });

  it('renders warnings for large files', () => {
    // Create a file larger than 80% of max size
    const largeContent = 'x'.repeat(4.5 * 1024 * 1024); // 4.5MB (90% of 5MB)
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

    render(
      <DocumentValidator
        file={file}
        documentType="applicant_id"
        showResults={true}
      />
    );

    expect(screen.getByText('Advertencias')).toBeInTheDocument();
    expect(screen.getByText(/bastante grande/)).toBeInTheDocument();
  });

  it('does not render when showResults is false', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(
      <DocumentValidator
        file={file}
        documentType="applicant_id"
        showResults={false}
      />
    );

    expect(screen.queryByText('Errores de validación')).not.toBeInTheDocument();
    expect(screen.queryByText('Documento válido')).not.toBeInTheDocument();
  });

  it('renders file info display component', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf', size: 1024 });

    render(
      <DocumentValidator
        file={file}
        documentType="applicant_id"
        showResults={true}
      />
    );

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('application/pdf')).toBeInTheDocument();
  });
});
