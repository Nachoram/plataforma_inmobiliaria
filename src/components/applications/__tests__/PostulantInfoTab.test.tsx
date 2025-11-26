/**
 * PostulantInfoTab.test.tsx
 * Tests for PostulantInfoTab component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostulantInfoTab } from '../PostulantInfoTab';

// Mock dependencies
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' }
  })
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

const mockPostulation = {
  id: 'app-123',
  property_id: 'prop-123',
  applicant_id: 'user-123',
  status: 'pendiente',
  message: 'Test message',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  properties: {
    id: 'prop-123',
    address_street: 'Test Street',
    address_number: '123',
    address_commune: 'Test Commune',
    price_clp: 500000,
    listing_type: 'rental'
  }
};

describe('PostulantInfoTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders postulation information correctly', () => {
    render(<PostulantInfoTab postulation={mockPostulation} />);

    expect(screen.getByText('Información de la Postulación')).toBeInTheDocument();
    expect(screen.getByText('Test Street 123')).toBeInTheDocument();
    expect(screen.getByText('Test Commune')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });

  it('shows correct status badge', () => {
    render(<PostulantInfoTab postulation={mockPostulation} />);

    expect(screen.getByText('En Revisión')).toBeInTheDocument();
  });

  it('shows edit application button for pending status', () => {
    render(<PostulantInfoTab postulation={mockPostulation} />);

    expect(screen.getByText('Editar Postulación')).toBeInTheDocument();
  });

  it('shows cancel application button for pending status', () => {
    render(<PostulantInfoTab postulation={mockPostulation} />);

    expect(screen.getByText('Cancelar Postulación')).toBeInTheDocument();
  });

  it('opens cancel modal when cancel button is clicked', () => {
    render(<PostulantInfoTab postulation={mockPostulation} />);

    const cancelButton = screen.getByText('Cancelar Postulación');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Cancelar Postulación')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro de que quieres cancelar esta postulación?')).toBeInTheDocument();
  });

  it('shows contract section when status allows viewing', () => {
    const approvedPostulation = { ...mockPostulation, status: 'aprobada' };

    render(<PostulantInfoTab postulation={approvedPostulation} />);

    expect(screen.getByText('Estado del Contrato')).toBeInTheDocument();
  });

  it('shows quick action buttons', () => {
    render(<PostulantInfoTab postulation={mockPostulation} />);

    expect(screen.getByText('Ver Propiedad')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Documentos')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Información')).toBeInTheDocument();
  });
});
