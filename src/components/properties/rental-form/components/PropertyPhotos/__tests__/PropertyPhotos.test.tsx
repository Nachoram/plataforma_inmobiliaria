import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PropertyPhotos } from '../PropertyPhotos';

// Mock de FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null as any,
  result: 'data:image/jpeg;base64,mock'
};

global.FileReader = vi.fn(() => mockFileReader) as any;

describe('PropertyPhotos Component', () => {
  const mockOnPhotosChange = vi.fn();
  const defaultProps = {
    photoFiles: [] as File[],
    photoPreviews: [] as string[],
    onPhotosChange: mockOnPhotosChange,
    maxPhotos: 5,
    uploading: false,
    errors: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with empty state', () => {
    render(<PropertyPhotos {...defaultProps} />);

    expect(screen.getByText('Fotos de la Propiedad (Opcional)')).toBeInTheDocument();
    expect(screen.getByText('No hay fotos seleccionadas')).toBeInTheDocument();
    expect(screen.getByText('Haz clic para subir fotos o arrastra y suelta')).toBeInTheDocument();
  });

  it('shows photo previews when photos are present', () => {
    const propsWithPhotos = {
      ...defaultProps,
      photoFiles: [new File([''], 'test.jpg')],
      photoPreviews: ['data:image/jpeg;base64,test']
    };

    render(<PropertyPhotos {...propsWithPhotos} />);

    expect(screen.getByText('Fotos Seleccionadas (1)')).toBeInTheDocument();
    expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
  });

  it('handles file upload correctly', async () => {
    render(<PropertyPhotos {...defaultProps} />);

    const fileInput = screen.getByTestId('photo-upload');
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    // Simular la carga del FileReader
    mockFileReader.onload?.({ target: { result: 'data:image/jpeg;base64,test' } });

    await waitFor(() => {
      expect(mockOnPhotosChange).toHaveBeenCalledWith(
        [testFile],
        ['data:image/jpeg;base64,test']
      );
    });
  });

  it('removes photo when delete button is clicked', () => {
    const propsWithPhotos = {
      ...defaultProps,
      photoFiles: [new File([''], 'test.jpg')],
      photoPreviews: ['data:image/jpeg;base64,test']
    };

    render(<PropertyPhotos {...propsWithPhotos} />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(mockOnPhotosChange).toHaveBeenCalledWith([], []);
  });

  it('shows uploading state when uploading is true', () => {
    render(<PropertyPhotos {...defaultProps} uploading={true} />);

    expect(screen.getByText('Subiendo fotos...')).toBeInTheDocument();
  });

  it('displays errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: { photo: 'Error al subir foto' }
    };

    render(<PropertyPhotos {...propsWithErrors} />);

    expect(screen.getByText('Error al subir foto')).toBeInTheDocument();
  });

  it('validates file type', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PropertyPhotos {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(alertMock).toHaveBeenCalledWith('El archivo test.txt no es una imagen válida');
    alertMock.mockRestore();
  });

  it('validates file size', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PropertyPhotos {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(alertMock).toHaveBeenCalledWith('La imagen large.jpg es demasiado grande (máximo 10MB)');
    alertMock.mockRestore();
  });

  it('respects maxPhotos limit', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const propsNearLimit = {
      ...defaultProps,
      photoFiles: Array(5).fill(new File([''], 'test.jpg')),
      maxPhotos: 5
    };

    render(<PropertyPhotos {...propsNearLimit} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const newFile = new File(['test'], 'new.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [newFile] } });

    expect(alertMock).toHaveBeenCalledWith('Máximo 5 fotos permitidas');
    alertMock.mockRestore();
  });
});
