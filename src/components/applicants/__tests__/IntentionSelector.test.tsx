import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import IntentionSelector from '../IntentionSelector';

describe('IntentionSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both intention options', () => {
    render(
      <IntentionSelector
        value="rent"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Buscar Arriendo')).toBeInTheDocument();
    expect(screen.getByText('Buscar Compra')).toBeInTheDocument();
  });

  it('shows rent intention as selected by default', () => {
    render(
      <IntentionSelector
        value="rent"
        onChange={mockOnChange}
      />
    );

    const rentOption = screen.getByText('Buscar Arriendo').closest('div');
    expect(rentOption).toHaveClass('border-blue-500');
  });

  it('shows buy intention as selected when value is buy', () => {
    render(
      <IntentionSelector
        value="buy"
        onChange={mockOnChange}
      />
    );

    const buyOption = screen.getByText('Buscar Compra').closest('div');
    expect(buyOption).toHaveClass('border-blue-500');
  });

  it('shows appropriate documents for rent intention', () => {
    render(
      <IntentionSelector
        value="rent"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Documentos que deberás proporcionar para Arriendo')).toBeInTheDocument();
    expect(screen.getByText('Cédula de Identidad')).toBeInTheDocument();
    expect(screen.getByText('Comprobante de Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Información del garante (si aplica)')).toBeInTheDocument();
  });

  it('shows appropriate documents for buy intention', () => {
    render(
      <IntentionSelector
        value="buy"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Documentos que deberás proporcionar para Compra')).toBeInTheDocument();
    expect(screen.getByText('Certificado de antigüedad laboral')).toBeInTheDocument();
    expect(screen.getByText('Información financiera adicional')).toBeInTheDocument();
  });

  it('calls onChange when rent option is clicked', () => {
    render(
      <IntentionSelector
        value="buy"
        onChange={mockOnChange}
      />
    );

    const rentOption = screen.getByText('Buscar Arriendo').closest('div');
    fireEvent.click(rentOption!);

    expect(mockOnChange).toHaveBeenCalledWith('rent');
  });

  it('calls onChange when buy option is clicked', () => {
    render(
      <IntentionSelector
        value="rent"
        onChange={mockOnChange}
      />
    );

    const buyOption = screen.getByText('Buscar Compra').closest('div');
    fireEvent.click(buyOption!);

    expect(mockOnChange).toHaveBeenCalledWith('buy');
  });

  it('shows helpful information section', () => {
    render(
      <IntentionSelector
        value="rent"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('¿Por qué es importante esta información?')).toBeInTheDocument();
    expect(screen.getByText('Generalmente requiere garante y comprobante de ingresos estables.')).toBeInTheDocument();
  });
});





