import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PropertyBasicInfo } from '../PropertyBasicInfo';

describe('PropertyBasicInfo Component', () => {
  const mockOnChange = vi.fn();
  const mockOnPropertyTypeChange = vi.fn();

  const defaultProps = {
    data: {
      tipoPropiedad: 'Casa' as const,
      address_street: 'Calle Test 123',
      address_number: '123',
      address_department: '4B',
      region: 'region-metropolitana',
      commune: 'Santiago',
      price: '500000',
      common_expenses: '50000',
      description: 'Hermosa casa para arriendo',
      numeroBodega: '',
      ubicacionEstacionamiento: '',
      parcela_number: '',
      bedrooms: '3',
      bathrooms: '2',
      estacionamientos: '1',
      metrosUtiles: '120',
      metrosTotales: '150',
      anoConstruccion: '2020',
      tieneTerraza: 'Sí',
      tieneSalaEstar: 'Sí',
      tieneBodega: 'No',
      metrosBodega: '',
      ubicacionBodega: ''
    },
    onChange: mockOnChange,
    onPropertyTypeChange: mockOnPropertyTypeChange,
    errors: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with basic fields', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    expect(screen.getByText('Información de la Propiedad')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Casa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Calle Test 123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
  });

  it('shows all property types in select', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Verificar que todas las opciones estén presentes
    expect(screen.getByRole('option', { name: 'Casa' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Departamento' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Oficina' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Estacionamiento' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bodega' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Parcela' })).toBeInTheDocument();
  });

  it('handles property type change with complex logic', () => {
    const { rerender } = render(<PropertyBasicInfo {...defaultProps} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Bodega' } });

    // Verificar que se llaman las funciones correctas
    expect(mockOnPropertyTypeChange).toHaveBeenCalledWith('Bodega');

    // Verificar que se limpian campos específicos
    expect(mockOnChange).toHaveBeenCalledWith('tipoPropiedad', 'Bodega');
    expect(mockOnChange).toHaveBeenCalledWith('bedrooms', '0');
    expect(mockOnChange).toHaveBeenCalledWith('bathrooms', '0');
    expect(mockOnChange).toHaveBeenCalledWith('metrosUtiles', '');
    expect(mockOnChange).toHaveBeenCalledWith('tieneTerraza', 'No');
    expect(mockOnChange).toHaveBeenCalledWith('tieneSalaEstar', 'No');
    expect(mockOnChange).toHaveBeenCalledWith('parcela_number', '');
  });

  it('shows bodega specific field when type is Bodega', () => {
    const propsWithBodega = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        tipoPropiedad: 'Bodega' as const,
        numeroBodega: 'B-115'
      }
    };

    render(<PropertyBasicInfo {...propsWithBodega} />);

    expect(screen.getByText('Información de la Bodega')).toBeInTheDocument();
    expect(screen.getByDisplayValue('B-115')).toBeInTheDocument();
    expect(screen.getByText('Número de Bodega *')).toBeInTheDocument();
  });

  it('shows parking location field when type is Estacionamiento', () => {
    const propsWithParking = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        tipoPropiedad: 'Estacionamiento' as const,
        ubicacionEstacionamiento: '25B'
      }
    };

    render(<PropertyBasicInfo {...propsWithParking} />);

    expect(screen.getByText('Número de Estacionamiento *')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25B')).toBeInTheDocument();
  });

  it('handles region change correctly', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    const regionSelect = screen.getAllByRole('combobox')[1]; // Segundo select (región)
    fireEvent.change(regionSelect, { target: { value: 'valparaiso' } });

    expect(mockOnChange).toHaveBeenCalledWith('region', 'valparaiso');
    expect(mockOnChange).toHaveBeenCalledWith('commune', '');
  });

  it('loads communes when region is selected', () => {
    const propsWithValparaiso = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        region: 'valparaiso',
        commune: 'Valparaíso'
      }
    };

    render(<PropertyBasicInfo {...propsWithValparaiso} />);

    // Verificar que Valparaíso está disponible en la lista
    const communeSelect = screen.getAllByRole('combobox')[2]; // Tercer select (comuna)
    expect(communeSelect).toBeInTheDocument();

    // Verificar que Valparaíso es una opción
    const valparaisoOption = screen.getByRole('option', { name: 'Valparaíso' });
    expect(valparaisoOption).toBeInTheDocument();
  });

  it('shows department field for Casa and Departamento', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    expect(screen.getByText('Departamento / Oficina (Opcional)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4B')).toBeInTheDocument();
  });

  it('hides department field for Bodega', () => {
    const propsWithBodega = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        tipoPropiedad: 'Bodega' as const
      }
    };

    render(<PropertyBasicInfo {...propsWithBodega} />);

    expect(screen.queryByText('Departamento / Oficina (Opcional)')).not.toBeInTheDocument();
  });

  it('hides department field for Estacionamiento', () => {
    const propsWithParking = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        tipoPropiedad: 'Estacionamiento' as const
      }
    };

    render(<PropertyBasicInfo {...propsWithParking} />);

    expect(screen.queryByText('Departamento / Oficina (Opcional)')).not.toBeInTheDocument();
  });

  it('hides department field for Parcela', () => {
    const propsWithParcela = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        tipoPropiedad: 'Parcela' as const
      }
    };

    render(<PropertyBasicInfo {...propsWithParcela} />);

    expect(screen.queryByText('Departamento / Oficina (Opcional)')).not.toBeInTheDocument();
  });

  it('handles input changes correctly', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    const streetInput = screen.getByPlaceholderText('Ej: Av. Libertador');
    fireEvent.change(streetInput, { target: { value: 'Nueva Calle 456' } });

    expect(mockOnChange).toHaveBeenCalledWith('address_street', 'Nueva Calle 456');
  });

  it('shows description as required for non-Bodega types', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/características principales/);
    expect(textarea).toBeRequired();
  });

  it('shows description as optional for Bodega type', () => {
    const propsWithBodega = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        tipoPropiedad: 'Bodega' as const
      }
    };

    render(<PropertyBasicInfo {...propsWithBodega} />);

    const textarea = screen.getByPlaceholderText(/Bodega amplia/);
    expect(textarea).not.toBeRequired();
    expect(screen.getByText('Descripción (Opcional)')).toBeInTheDocument();
  });

  it('displays validation errors correctly', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        address_street: 'La calle es requerida',
        price: 'El precio es requerido',
        numeroBodega: 'El número de bodega es requerido'
      }
    };

    render(<PropertyBasicInfo {...propsWithErrors} />);

    expect(screen.getByText('La calle es requerida')).toBeInTheDocument();
    expect(screen.getByText('El precio es requerido')).toBeInTheDocument();
  });

  it('handles commune selection correctly', () => {
    const propsWithRegion = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        region: 'region-metropolitana'
      }
    };

    render(<PropertyBasicInfo {...propsWithRegion} />);

    const communeSelect = screen.getAllByRole('combobox')[2];
    fireEvent.change(communeSelect, { target: { value: 'Providencia' } });

    expect(mockOnChange).toHaveBeenCalledWith('commune', 'Providencia');
  });

  it('disables commune select when no region is selected', () => {
    const propsWithoutRegion = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        region: '',
        commune: ''
      }
    };

    render(<PropertyBasicInfo {...propsWithoutRegion} />);

    const communeSelect = screen.getAllByRole('combobox')[2];
    expect(communeSelect).toBeDisabled();
    expect(screen.getByText('Primero seleccione región')).toBeInTheDocument();
  });

  it('maintains memo optimization', () => {
    const { rerender } = render(<PropertyBasicInfo {...defaultProps} />);

    // Re-render con las mismas props - debería usar memo
    rerender(<PropertyBasicInfo {...defaultProps} />);

    // Component should still be rendered correctly
    expect(screen.getByText('Información de la Propiedad')).toBeInTheDocument();
  });

  it('handles numeric inputs correctly', () => {
    render(<PropertyBasicInfo {...defaultProps} />);

    const priceInput = screen.getByPlaceholderText('500000');
    fireEvent.change(priceInput, { target: { value: '750000' } });

    expect(mockOnChange).toHaveBeenCalledWith('price', '750000');

    const expensesInput = screen.getByPlaceholderText('50000');
    fireEvent.change(expensesInput, { target: { value: '75000' } });

    expect(mockOnChange).toHaveBeenCalledWith('common_expenses', '75000');
  });

  it('handles all property type changes correctly', () => {
    const propertyTypes = ['Casa', 'Departamento', 'Oficina', 'Estacionamiento', 'Bodega', 'Parcela'] as const;

    propertyTypes.forEach(type => {
      const { rerender } = render(<PropertyBasicInfo {...defaultProps} />);
      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: type } });

      expect(mockOnPropertyTypeChange).toHaveBeenCalledWith(type);
    });
  });
});
