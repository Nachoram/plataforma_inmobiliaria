import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import BrokerTypeSelector from '../BrokerTypeSelector';

describe('BrokerTypeSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both broker type options', () => {
    render(
      <BrokerTypeSelector
        value="independent"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Broker Independiente')).toBeInTheDocument();
    expect(screen.getByText('Broker de Empresa')).toBeInTheDocument();
  });

  it('shows independent broker as selected by default', () => {
    render(
      <BrokerTypeSelector
        value="independent"
        onChange={mockOnChange}
      />
    );

    // Check that independent option has selection indicator
    const independentOption = screen.getByText('Broker Independiente').closest('div');
    expect(independentOption).toHaveClass('border-blue-500');
  });

  it('shows firm broker as selected when value is firm', () => {
    render(
      <BrokerTypeSelector
        value="firm"
        onChange={mockOnChange}
      />
    );

    const firmOption = screen.getByText('Broker de Empresa').closest('div');
    expect(firmOption).toHaveClass('border-blue-500');
  });

  it('shows firm name input when firm is selected', () => {
    render(
      <BrokerTypeSelector
        value="firm"
        firmName="Test Company"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Nombre de la Empresa *')).toBeInTheDocument();
  });

  it('calls onChange when independent broker is selected', () => {
    render(
      <BrokerTypeSelector
        value="firm"
        onChange={mockOnChange}
      />
    );

    const independentOption = screen.getByText('Broker Independiente').closest('div');
    fireEvent.click(independentOption!);

    expect(mockOnChange).toHaveBeenCalledWith('independent', '');
  });

  it('calls onChange when firm broker is selected', () => {
    render(
      <BrokerTypeSelector
        value="independent"
        onChange={mockOnChange}
      />
    );

    const firmOption = screen.getByText('Broker de Empresa').closest('div');
    fireEvent.click(firmOption!);

    expect(mockOnChange).toHaveBeenCalledWith('firm', '');
  });

  it('shows error message when error prop is provided', () => {
    render(
      <BrokerTypeSelector
        value="firm"
        onChange={mockOnChange}
        error="Nombre de empresa es requerido"
      />
    );

    expect(screen.getByText('Nombre de empresa es requerido')).toBeInTheDocument();
  });

  it('updates firm name when input changes', () => {
    render(
      <BrokerTypeSelector
        value="firm"
        firmName=""
        onChange={mockOnChange}
      />
    );

    const firmInput = screen.getByPlaceholderText('Ej: Inmobiliaria ABC SpA');
    fireEvent.change(firmInput, { target: { value: 'New Company' } });

    expect(mockOnChange).toHaveBeenCalledWith('firm', 'New Company');
  });
});







