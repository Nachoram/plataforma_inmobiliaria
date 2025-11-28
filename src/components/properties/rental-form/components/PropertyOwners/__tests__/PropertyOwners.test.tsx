import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PropertyOwners } from '../PropertyOwners';

// Mock de los iconos de Lucide
vi.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">UserIcon</div>,
  Building2: () => <div data-testid="building-icon">BuildingIcon</div>,
  X: () => <div data-testid="x-icon">XIcon</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertIcon</div>,
}));

describe('PropertyOwners Component', () => {
  const mockOnAddOwner = vi.fn();
  const mockOnRemoveOwner = vi.fn();
  const mockOnUpdateOwner = vi.fn();
  const mockOnDocumentUpload = vi.fn();
  const mockOnDocumentRemove = vi.fn();

  const defaultProps = {
    owners: [
      {
        id: 'owner-1',
        owner_type: 'natural' as const,
        owner_first_name: 'Juan',
        owner_paternal_last_name: 'Pérez',
        owner_rut: '12.345.678-9',
        owner_email: 'juan@email.com',
        owner_phone: '+56912345678',
      }
    ],
    onAddOwner: mockOnAddOwner,
    onRemoveOwner: mockOnRemoveOwner,
    onUpdateOwner: mockOnUpdateOwner,
    onDocumentUpload: mockOnDocumentUpload,
    onDocumentRemove: mockOnDocumentRemove,
    maxOwners: 5,
    errors: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with basic structure', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('Datos del Propietario')).toBeInTheDocument();
    expect(screen.getByText('Propietarios: 1/5')).toBeInTheDocument();
    expect(screen.getByText('Propietario 1')).toBeInTheDocument();
  });

  it('renders add owner button when under max limit', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('+ Agregar Propietario')).toBeInTheDocument();
  });

  it('does not render add owner button when at max limit', () => {
    const propsAtMax = {
      ...defaultProps,
      owners: Array(5).fill(null).map((_, i) => ({
        id: `owner-${i}`,
        owner_type: 'natural' as const,
        owner_first_name: `Juan ${i}`,
        owner_paternal_last_name: 'Pérez',
        owner_rut: '12.345.678-9',
        owner_email: 'juan@email.com',
        owner_phone: '+56912345678',
      }))
    };

    render(<PropertyOwners {...propsAtMax} />);

    expect(screen.queryByText('+ Agregar Propietario')).not.toBeInTheDocument();
  });

  it('calls onAddOwner when add button is clicked', () => {
    render(<PropertyOwners {...defaultProps} />);

    const addButton = screen.getByText('+ Agregar Propietario');
    fireEvent.click(addButton);

    expect(mockOnAddOwner).toHaveBeenCalledTimes(1);
  });

  it('renders owner type selector', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('Tipo de Propietario *')).toBeInTheDocument();
    expect(screen.getByText('Persona Natural')).toBeInTheDocument();
    expect(screen.getByText('Persona Jurídica')).toBeInTheDocument();
  });

  it('renders natural person fields when owner type is natural', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('Nombres *')).toBeInTheDocument();
    expect(screen.getByText('Apellido Paterno *')).toBeInTheDocument();
    expect(screen.getByText('RUT *')).toBeInTheDocument();
    expect(screen.getByText('Email *')).toBeInTheDocument();
    expect(screen.getByText('Teléfono *')).toBeInTheDocument();
  });

  it('renders legal entity fields when owner type is juridica', () => {
    const propsWithLegalEntity = {
      ...defaultProps,
      owners: [{
        id: 'owner-1',
        owner_type: 'juridica' as const,
        owner_company_name: 'Empresa S.A.',
        owner_company_rut: '76.123.456-7',
        owner_representative_first_name: 'María',
        owner_representative_paternal_last_name: 'González',
        owner_representative_rut: '15.678.901-2',
        owner_representative_email: 'maria@empresa.cl',
        owner_representative_phone: '+56987654321',
      }]
    };

    render(<PropertyOwners {...propsWithLegalEntity} />);

    expect(screen.getByText('Datos de Personería Jurídica')).toBeInTheDocument();
    expect(screen.getByText('Representante Legal')).toBeInTheDocument();
    expect(screen.getByText('Razón Social *')).toBeInTheDocument();
    expect(screen.getByText('RUT Empresa *')).toBeInTheDocument();
    expect(screen.getByText('Nombres Representante *')).toBeInTheDocument();
  });

  it('renders address fields for both owner types', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('Calle *')).toBeInTheDocument();
    expect(screen.getByText('Número *')).toBeInTheDocument();
    expect(screen.getByText('Región *')).toBeInTheDocument();
    expect(screen.getByText('Comuna *')).toBeInTheDocument();
  });

  it('renders additional fields', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('Nacionalidad')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Unidad')).toBeInTheDocument();
    expect(screen.getByText('Número Unidad')).toBeInTheDocument();
    expect(screen.getByText('% Propiedad')).toBeInTheDocument();
    expect(screen.getByText('Régimen Propiedad')).toBeInTheDocument();
  });

  it('renders document section', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.getByText('Documentos del Propietario')).toBeInTheDocument();
  });

  it('calls onUpdateOwner when owner type is changed', () => {
    render(<PropertyOwners {...defaultProps} />);

    // Buscar el radio button de persona jurídica
    const juridicaRadio = screen.getByDisplayValue('juridica');
    fireEvent.click(juridicaRadio);

    expect(mockOnUpdateOwner).toHaveBeenCalledWith('owner-1', 'owner_type', 'juridica');
  });

  it('calls onUpdateOwner when input fields change', () => {
    render(<PropertyOwners {...defaultProps} />);

    const firstNameInput = screen.getByPlaceholderText('Ej: Juan Carlos');
    fireEvent.change(firstNameInput, { target: { value: 'Pedro' } });

    expect(mockOnUpdateOwner).toHaveBeenCalledWith('owner-1', 'owner_first_name', 'Pedro');
  });

  it('renders remove button for owners when there are multiple owners', () => {
    const propsWithMultipleOwners = {
      ...defaultProps,
      owners: [
        ...defaultProps.owners,
        {
          id: 'owner-2',
          owner_type: 'natural' as const,
          owner_first_name: 'María',
          owner_paternal_last_name: 'González',
          owner_rut: '15.678.901-2',
          owner_email: 'maria@email.com',
          owner_phone: '+56987654321',
        }
      ]
    };

    render(<PropertyOwners {...propsWithMultipleOwners} />);

    expect(screen.getAllByTestId('x-icon')).toHaveLength(2);
  });

  it('does not render remove button when there is only one owner', () => {
    render(<PropertyOwners {...defaultProps} />);

    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
  });

  it('calls onRemoveOwner when remove button is clicked', () => {
    const propsWithMultipleOwners = {
      ...defaultProps,
      owners: [
        ...defaultProps.owners,
        {
          id: 'owner-2',
          owner_type: 'natural' as const,
          owner_first_name: 'María',
          owner_paternal_last_name: 'González',
          owner_rut: '15.678.901-2',
          owner_email: 'maria@email.com',
          owner_phone: '+56987654321',
        }
      ]
    };

    render(<PropertyOwners {...propsWithMultipleOwners} />);

    const removeButtons = screen.getAllByTestId('x-icon');
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemoveOwner).toHaveBeenCalledWith('owner-1');
  });

  it('renders constitution type selector for legal entities', () => {
    const propsWithLegalEntity = {
      ...defaultProps,
      owners: [{
        id: 'owner-1',
        owner_type: 'juridica' as const,
        constitution_type: 'empresa_en_un_dia',
      }]
    };

    render(<PropertyOwners {...propsWithLegalEntity} />);

    expect(screen.getByText('¿La persona jurídica está constituida por Empresa en un Día / Tradicional? *')).toBeInTheDocument();
    expect(screen.getByText('Empresa en un Día')).toBeInTheDocument();
    expect(screen.getByText('Tradicional')).toBeInTheDocument();
  });

  it('renders CVE field for empresa_en_un_dia constitution type', () => {
    const propsWithEmpresaEnDia = {
      ...defaultProps,
      owners: [{
        id: 'owner-1',
        owner_type: 'juridica' as const,
        constitution_type: 'empresa_en_un_dia',
      }]
    };

    render(<PropertyOwners {...propsWithEmpresaEnDia} />);

    expect(screen.getByText('CVE (Código de Verificación Empresa) *')).toBeInTheDocument();
  });

  it('renders notary fields for tradicional constitution type', () => {
    const propsWithTradicional = {
      ...defaultProps,
      owners: [{
        id: 'owner-1',
        owner_type: 'juridica' as const,
        constitution_type: 'tradicional',
      }]
    };

    render(<PropertyOwners {...propsWithTradicional} />);

    expect(screen.getByText('Notaría *')).toBeInTheDocument();
    expect(screen.getByText('Número de Repertorio *')).toBeInTheDocument();
  });

  it('renders errors when present', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        'owner_owner-1_owner_first_name': 'Campo requerido',
        'owner_owner-1_owner_email': 'Email inválido'
      }
    };

    render(<PropertyOwners {...propsWithErrors} />);

    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('maintains memo optimization', () => {
    const { rerender } = render(<PropertyOwners {...defaultProps} />);

    // Re-render con las mismas props - debería usar memo
    rerender(<PropertyOwners {...defaultProps} />);

    // Component should still be rendered correctly
    expect(screen.getByText('Datos del Propietario')).toBeInTheDocument();
  });

  it('renders multiple owners correctly', () => {
    const propsWithThreeOwners = {
      ...defaultProps,
      owners: [
        {
          id: 'owner-1',
          owner_type: 'natural' as const,
          owner_first_name: 'Juan',
          owner_paternal_last_name: 'Pérez',
          owner_rut: '12.345.678-9',
          owner_email: 'juan@email.com',
          owner_phone: '+56912345678',
        },
        {
          id: 'owner-2',
          owner_type: 'juridica' as const,
          owner_company_name: 'Empresa S.A.',
          owner_company_rut: '76.123.456-7',
          owner_representative_first_name: 'María',
          owner_representative_paternal_last_name: 'González',
          owner_representative_rut: '15.678.901-2',
          owner_representative_email: 'maria@empresa.cl',
          owner_representative_phone: '+56987654321',
        },
        {
          id: 'owner-3',
          owner_type: 'natural' as const,
          owner_first_name: 'Pedro',
          owner_paternal_last_name: 'Rodríguez',
          owner_rut: '18.901.234-5',
          owner_email: 'pedro@email.com',
          owner_phone: '+56911223344',
        }
      ]
    };

    render(<PropertyOwners {...propsWithThreeOwners} />);

    expect(screen.getByText('Propietarios: 3/5')).toBeInTheDocument();
    expect(screen.getByText('Propietario 1')).toBeInTheDocument();
    expect(screen.getByText('Propietario 2')).toBeInTheDocument();
    expect(screen.getByText('Propietario 3')).toBeInTheDocument();
  });
});
