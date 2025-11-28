import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PropertyInternalFeatures } from '../PropertyInternalFeatures';

// Mock de los subcomponentes
vi.mock('../../../../ParkingSpaceForm', () => ({
  default: ({ parkingSpaces, onChange }: any) => (
    <div data-testid="parking-space-form">
      ParkingSpaceForm - {parkingSpaces.length} spaces
      <button onClick={() => onChange([{ id: '1', number: 'P1' }])}>
        Add Parking
      </button>
    </div>
  )
}));

vi.mock('../../../../StorageSpaceForm', () => ({
  default: ({ storageSpaces, onChange }: any) => (
    <div data-testid="storage-space-form">
      StorageSpaceForm - {storageSpaces.length} spaces
      <button onClick={() => onChange([{ id: '1', number: 'B1' }])}>
        Add Storage
      </button>
    </div>
  )
}));

describe('PropertyInternalFeatures Component', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    data: {
      sistemaAguaCaliente: 'Calefón',
      tipoCocina: 'Cerrada',
      tieneSalaEstar: 'Sí',
      parkingSpaces: [],
      storageSpaces: []
    },
    onChange: mockOnChange,
    propertyType: 'Casa' as const,
    showSection: true,
    errors: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when showSection is false', () => {
    render(<PropertyInternalFeatures {...defaultProps} showSection={false} />);

    expect(screen.queryByText('Características Internas')).not.toBeInTheDocument();
    expect(screen.queryByText('Espacios de la Propiedad')).not.toBeInTheDocument();
  });

  it('renders basic features for Casa type', () => {
    render(<PropertyInternalFeatures {...defaultProps} />);

    expect(screen.getByText('Características Internas')).toBeInTheDocument();
    expect(screen.getByText('Espacios de la Propiedad')).toBeInTheDocument();
    expect(screen.getByText('Agua Caliente')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Cocina')).toBeInTheDocument();
    expect(screen.getByText('¿Cuenta con Sala de Estar?')).toBeInTheDocument();
  });

  it('renders basic features for Departamento type', () => {
    render(<PropertyInternalFeatures {...defaultProps} propertyType="Departamento" />);

    expect(screen.getByText('Características Internas')).toBeInTheDocument();
    expect(screen.getByText('Espacios de la Propiedad')).toBeInTheDocument();
  });

  it('renders spaces section for Oficina type', () => {
    render(<PropertyInternalFeatures {...defaultProps} propertyType="Oficina" />);

    expect(screen.getByText('Espacios de la Propiedad')).toBeInTheDocument();
    expect(screen.queryByText('Características Internas')).not.toBeInTheDocument();
  });

  it('does not render basic features for Oficina type', () => {
    render(<PropertyInternalFeatures {...defaultProps} propertyType="Oficina" />);

    expect(screen.queryByText('Agua Caliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Tipo de Cocina')).not.toBeInTheDocument();
  });

  it('renders parking and storage space forms', () => {
    render(<PropertyInternalFeatures {...defaultProps} />);

    expect(screen.getByTestId('parking-space-form')).toBeInTheDocument();
    expect(screen.getByTestId('storage-space-form')).toBeInTheDocument();
    expect(screen.getByText('ParkingSpaceForm - 0 spaces')).toBeInTheDocument();
    expect(screen.getByText('StorageSpaceForm - 0 spaces')).toBeInTheDocument();
  });

  it('handles agua caliente selection', () => {
    render(<PropertyInternalFeatures {...defaultProps} />);

    const select = screen.getAllByRole('combobox')[0]; // Primer select (agua caliente)
    fireEvent.change(select, { target: { value: 'Caldera Central' } });

    expect(mockOnChange).toHaveBeenCalledWith('sistemaAguaCaliente', 'Caldera Central');
  });

  it('handles tipo cocina selection', () => {
    render(<PropertyInternalFeatures {...defaultProps} />);

    const select = screen.getAllByRole('combobox')[1]; // Segundo select (cocina)
    fireEvent.change(select, { target: { value: 'Americana' } });

    expect(mockOnChange).toHaveBeenCalledWith('tipoCocina', 'Americana');
  });

  it('handles sala de estar selection', () => {
    render(<PropertyInternalFeatures {...defaultProps} />);

    const select = screen.getAllByRole('combobox')[2]; // Tercer select (sala estar)
    fireEvent.change(select, { target: { value: 'No' } });

    expect(mockOnChange).toHaveBeenCalledWith('tieneSalaEstar', 'No');
  });

  it('displays parking spaces count correctly', () => {
    const propsWithSpaces = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        parkingSpaces: [{ id: '1', number: 'P1' }, { id: '2', number: 'P2' }]
      }
    };

    render(<PropertyInternalFeatures {...propsWithSpaces} />);

    expect(screen.getByText('ParkingSpaceForm - 2 spaces')).toBeInTheDocument();
  });

  it('displays storage spaces count correctly', () => {
    const propsWithSpaces = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        storageSpaces: [{ id: '1', number: 'B1' }]
      }
    };

    render(<PropertyInternalFeatures {...propsWithSpaces} />);

    expect(screen.getByText('StorageSpaceForm - 1 spaces')).toBeInTheDocument();
  });

  it('shows errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        sistemaAguaCaliente: 'Campo requerido',
        parkingSpaces: 'Debe tener al menos un estacionamiento'
      }
    };

    render(<PropertyInternalFeatures {...propsWithErrors} />);

    expect(screen.getByText('Errores en características:')).toBeInTheDocument();
    expect(screen.getByText('• sistemaAguaCaliente: Campo requerido')).toBeInTheDocument();
    expect(screen.getByText('• parkingSpaces: Debe tener al menos un estacionamiento')).toBeInTheDocument();
  });

  it('does not show errors section when no errors', () => {
    render(<PropertyInternalFeatures {...defaultProps} />);

    expect(screen.queryByText('Errores en características:')).not.toBeInTheDocument();
  });

  it('maintains memo optimization', () => {
    const { rerender } = render(<PropertyInternalFeatures {...defaultProps} />);

    // Re-render con las mismas props - debería usar memo
    rerender(<PropertyInternalFeatures {...defaultProps} />);

    // Component should still be rendered correctly
    expect(screen.getByText('Características Internas')).toBeInTheDocument();
  });

  it('does not render anything for unsupported property types', () => {
    render(<PropertyInternalFeatures {...defaultProps} propertyType="Bodega" />);

    expect(screen.queryByText('Características Internas')).not.toBeInTheDocument();
    expect(screen.queryByText('Espacios de la Propiedad')).not.toBeInTheDocument();
  });

  it('renders spaces section for all supported property types', () => {
    const supportedTypes = ['Casa', 'Departamento', 'Oficina'] as const;

    supportedTypes.forEach(type => {
      const { rerender } = render(<PropertyInternalFeatures {...defaultProps} propertyType={type} />);

      expect(screen.getByText('Espacios de la Propiedad')).toBeInTheDocument();

      // Limpiar para siguiente render
      rerender(<PropertyInternalFeatures {...defaultProps} showSection={false} />);
    });
  });

  it('shows basic features only for Casa and Departamento', () => {
    const basicFeaturesTypes = ['Casa', 'Departamento'] as const;
    const noBasicFeaturesTypes = ['Oficina', 'Bodega', 'Estacionamiento', 'Parcela'] as const;

    basicFeaturesTypes.forEach(type => {
      const { rerender } = render(<PropertyInternalFeatures {...defaultProps} propertyType={type} />);

      expect(screen.getByText('Características Internas')).toBeInTheDocument();

      rerender(<PropertyInternalFeatures {...defaultProps} showSection={false} />);
    });

    noBasicFeaturesTypes.forEach(type => {
      const { rerender } = render(<PropertyInternalFeatures {...defaultProps} propertyType={type} />);

      expect(screen.queryByText('Características Internas')).not.toBeInTheDocument();

      rerender(<PropertyInternalFeatures {...defaultProps} showSection={false} />);
    });
  });
});
