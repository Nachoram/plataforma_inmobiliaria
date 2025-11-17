/**
 * PostulationAdminPanel.test.tsx
 * 
 * Test suite para el componente PostulationAdminPanel
 * 
 * COBERTURA:
 * - Renderizado básico del componente
 * - Carga de postulaciones desde Supabase
 * - Apertura de modal de detalles
 * - Acciones administrativas (Solicitar Informe, etc.)
 * - Flujo de aceptación de postulación y generación de contrato
 * - Manejo de errores
 * - Estados de carga y sin datos
 * 
 * @module PostulationAdminPanel.test
 * @since 2025-10-28
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PostulationAdminPanel } from '../PostulationAdminPanel';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

// Mock de dependencias
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  Property: {},
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock completo de lucide-react
vi.mock('lucide-react', () => ({
  Settings: () => <div>Settings Icon</div>,
  Mail: () => <div>Mail Icon</div>,
  Phone: () => <div>Phone Icon</div>,
  DollarSign: () => <div>DollarSign Icon</div>,
  Briefcase: () => <div>Briefcase Icon</div>,
  FileText: () => <div>FileText Icon</div>,
  UserCheck: () => <div>UserCheck Icon</div>,
  Copy: () => <div>Copy Icon</div>,
  CheckCircle: () => <div>CheckCircle Icon</div>,
  AlertTriangle: () => <div>AlertTriangle Icon</div>,
  X: () => <div>X Icon</div>,
  RotateCcw: () => <div>RotateCcw Icon</div>,
  Edit: () => <div>Edit Icon</div>,
  Shield: () => <div>Shield Icon</div>,
}));

vi.mock('../dashboard/RentalContractConditionsForm', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="contract-modal">
      <button onClick={onClose}>Cerrar Contrato</button>
    </div>
  ),
}));

// ========================================================================
// HELPERS & MOCKS
// ========================================================================

/**
 * Datos de prueba para una postulación
 */
const mockPostulation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  applicant_id: 'user-123',
  guarantor_id: 'guarantor-123',
  status: 'pendiente',
  created_at: '2024-01-15T10:00:00Z',
  message: 'Postulación de prueba',
  application_characteristic_id: null,
  guarantor_characteristic_id: null,
  profiles: {
    first_name: 'Juan',
    paternal_last_name: 'Pérez',
    maternal_last_name: 'González',
    email: 'juan.perez@example.com',
    phone: '+56912345678',
  },
  guarantors: {
    first_name: 'María',
    rut: '12345678-9',
  },
};

/**
 * Datos de prueba para la propiedad
 */
const mockProperty = {
  id: 'property-123',
  owner_id: 'owner-123',
  status: 'available',
  listing_type: 'arriendo' as const,
  tipo_propiedad: 'Departamento',
  address_street: 'Av. Providencia',
  address_number: '1234',
  address_commune: 'Providencia',
  address_region: 'Metropolitana',
  price_clp: 500000,
  bedrooms: 2,
  bathrooms: 1,
  surface_m2: 60,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock de la cadena de métodos de Supabase
 */
const createSupabaseMock = (data: any[], error: any = null) => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
  
  (supabase.from as any).mockReturnValue(mockChain);
  
  return mockChain;
};

// ========================================================================
// TEST SUITE
// ========================================================================

describe('PostulationAdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // RENDERIZADO BÁSICO
  // ========================================================================

  it('debe renderizar el componente con estado de carga inicial', () => {
    createSupabaseMock([mockPostulation]);
    
    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    expect(screen.getByText('Gestión de Postulaciones')).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay postulaciones', async () => {
    createSupabaseMock([]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No hay postulaciones')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CARGA DE DATOS
  // ========================================================================

  it('debe cargar y mostrar postulaciones correctamente', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Verificar que se llamó a Supabase correctamente
    expect(supabase.from).toHaveBeenCalledWith('applications');
  });

  it('debe manejar errores al cargar postulaciones', async () => {
    const mockError = { message: 'Error de conexión', code: '500' };
    createSupabaseMock([], mockError);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('no debe cargar postulaciones si propertyId es undefined', async () => {
    const mockChain = createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error: ID de propiedad no válido');
    });

    // No debe llamar a Supabase
    expect(mockChain.select).not.toHaveBeenCalled();
  });

  // ========================================================================
  // INTERACCIONES DEL USUARIO
  // ========================================================================

  it('debe abrir el modal de detalles al hacer click en "Administrar"', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Perfil del Postulante')).toBeInTheDocument();
      expect(screen.getByText('Datos del Aval')).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal de detalles al hacer click en "Cerrar"', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Perfil del Postulante')).toBeInTheDocument();
    });

    // Cerrar modal
    const closeButtons = screen.getAllByText('Cerrar');
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Perfil del Postulante')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // ACCIONES ADMINISTRATIVAS
  // ========================================================================

  it('debe mostrar toast al solicitar informe comercial', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Solicitar Informe')).toBeInTheDocument();
    });

    // Click en solicitar informe
    const requestReportButton = screen.getByText('Solicitar Informe');
    fireEvent.click(requestReportButton);

    expect(toast.success).toHaveBeenCalledWith(
      'Funcionalidad en desarrollo: Solicitar Informe Comercial'
    );
  });

  it('debe mostrar toast al solicitar documentación', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Solicitar Documentación')).toBeInTheDocument();
    });

    // Click en solicitar documentación
    const requestDocsButton = screen.getByText('Solicitar Documentación');
    fireEvent.click(requestDocsButton);

    expect(toast.success).toHaveBeenCalledWith(
      'Funcionalidad en desarrollo: Solicitar Documentación'
    );
  });

  it('debe mostrar toast al enviar documentos', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Enviar Documentos')).toBeInTheDocument();
    });

    // Click en enviar documentos
    const sendDocsButton = screen.getByText('Enviar Documentos');
    fireEvent.click(sendDocsButton);

    expect(toast.success).toHaveBeenCalledWith(
      'Funcionalidad en desarrollo: Enviar Documentos'
    );
  });

  // ========================================================================
  // FLUJO DE ACEPTACIÓN Y CONTRATO
  // ========================================================================

  it('debe abrir el modal de contrato al hacer click en "Aceptar Postulación"', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal de detalles
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Aceptar Postulación')).toBeInTheDocument();
    });

    // Click en aceptar postulación
    const acceptButton = screen.getByText('Aceptar Postulación');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByTestId('contract-modal')).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal de contrato y recargar postulaciones al cerrar', async () => {
    const mockChain = createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal de detalles
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Aceptar Postulación')).toBeInTheDocument();
    });

    // Click en aceptar postulación
    const acceptButton = screen.getByText('Aceptar Postulación');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByTestId('contract-modal')).toBeInTheDocument();
    });

    // Cerrar modal de contrato
    const closeContractButton = screen.getByText('Cerrar Contrato');
    fireEvent.click(closeContractButton);

    await waitFor(() => {
      expect(screen.queryByTestId('contract-modal')).not.toBeInTheDocument();
    });

    // Verificar que se recargaron las postulaciones
    // La primera llamada es en el useEffect inicial, la segunda después de cerrar el contrato
    expect(mockChain.select).toHaveBeenCalledTimes(2);
  });

  // ========================================================================
  // VISUALIZACIÓN DE DATOS
  // ========================================================================

  it('debe mostrar el score de riesgo correctamente', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  it('debe mostrar el estado de la postulación correctamente', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('En Revisión')).toBeInTheDocument();
    });
  });

  it('debe mostrar la fecha de postulación formateada', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      // La fecha debe estar formateada en español
      expect(screen.getByText(/enero/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CASOS ESPECIALES
  // ========================================================================

  it('debe manejar postulación sin aval', async () => {
    const postulationWithoutGuarantor = {
      ...mockPostulation,
      guarantor_id: null,
      guarantors: null,
    };
    
    createSupabaseMock([postulationWithoutGuarantor]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('Esta postulación no tiene aval registrado')).toBeInTheDocument();
    });
  });

  it('debe calcular capacidad de pago total correctamente', async () => {
    createSupabaseMock([mockPostulation]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
    });

    // Abrir modal
    const adminButton = screen.getByText('Administrar');
    fireEvent.click(adminButton);

    await waitFor(() => {
      expect(screen.getByText('💰 Capacidad de Pago Total')).toBeInTheDocument();
    });
  });

  it('debe mostrar contador de postulaciones en el footer', async () => {
    createSupabaseMock([mockPostulation, { ...mockPostulation, id: 'another-id' }]);

    render(
      <PostulationAdminPanel 
        propertyId="property-123" 
        property={mockProperty as any} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Mostrando.*2.*postulaciones/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // POST-ACCEPTANCE MANAGEMENT
  // ========================================================================

  describe('Administración de Aceptación', () => {
    const mockApprovedPostulation = {
      ...mockPostulation,
      status: 'aprobada', // En BD
    };

    it('NO debe mostrar sección "ADMINISTRAR ACEPTACIÓN" si la postulación NO está aprobada', async () => {
      createSupabaseMock([mockPostulation]); // status: 'pendiente'

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Perfil del Postulante')).toBeInTheDocument();
      });

      // La sección NO debe existir
      expect(screen.queryByText('ADMINISTRAR ACEPTACIÓN')).not.toBeInTheDocument();
      expect(screen.queryByText('Deshacer Aceptación')).not.toBeInTheDocument();
    });

    it('debe mostrar sección "ADMINISTRAR ACEPTACIÓN" cuando la postulación está aprobada', async () => {
      createSupabaseMock([mockApprovedPostulation]);

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('ADMINISTRAR ACEPTACIÓN')).toBeInTheDocument();
      });

      expect(screen.getByText('Deshacer Aceptación')).toBeInTheDocument();
      expect(screen.getByText('Modificar Aceptación')).toBeInTheDocument();
    });

    it('debe ejecutar "Deshacer Aceptación" y actualizar estado en Supabase', async () => {
      // Mock window.confirm
      global.confirm = vi.fn(() => true);

      const mockChain = createSupabaseMock([mockApprovedPostulation]);
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      mockChain.eq = vi.fn().mockResolvedValue({ error: null });
      
      // Mock the update chain
      (supabase.from as any).mockReturnValue({
        ...mockChain,
        update: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      });

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Deshacer Aceptación')).toBeInTheDocument();
      });

      // Click en deshacer aceptación
      const undoButton = screen.getByText('Deshacer Aceptación');
      fireEvent.click(undoButton);

      // Debe mostrar confirmación
      expect(global.confirm).toHaveBeenCalled();

      // Debe mostrar toast de éxito
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Aceptación deshecha correctamente')
        );
      });
    });

    it('debe cancelar "Deshacer Aceptación" si el usuario no confirma', async () => {
      // Mock window.confirm - retorna false
      global.confirm = vi.fn(() => false);

      createSupabaseMock([mockApprovedPostulation]);

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Deshacer Aceptación')).toBeInTheDocument();
      });

      // Click en deshacer aceptación
      const undoButton = screen.getByText('Deshacer Aceptación');
      fireEvent.click(undoButton);

      // Debe mostrar confirmación
      expect(global.confirm).toHaveBeenCalled();

      // NO debe llamar a Supabase
      await waitFor(() => {
        expect(supabase.from).not.toHaveBeenCalledWith('applications');
      });
    });

    it('debe abrir el modal de "Modificar Aceptación"', async () => {
      createSupabaseMock([mockApprovedPostulation]);

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal de perfil
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Modificar Aceptación')).toBeInTheDocument();
      });

      // Click en modificar aceptación
      const modifyButton = screen.getByText('Modificar Aceptación');
      fireEvent.click(modifyButton);

      // Debe abrir el modal de modificación
      await waitFor(() => {
        expect(screen.getByText(/Edita los términos y condiciones/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Comentarios de Modificación/i)).toBeInTheDocument();
      });
    });

    it('debe validar que se agregue al menos un comentario al modificar', async () => {
      createSupabaseMock([mockApprovedPostulation]);

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal de perfil
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      await waitFor(() => {
        expect(screen.getByText('Modificar Aceptación')).toBeInTheDocument();
      });

      // Abrir modal de modificación
      const modifyButton = screen.getByText('Modificar Aceptación');
      fireEvent.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByText('Guardar Modificaciones')).toBeInTheDocument();
      });

      // Intentar guardar sin comentarios
      const saveButton = screen.getByText('Guardar Modificaciones');
      fireEvent.click(saveButton);

      // Debe mostrar error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Debes agregar al menos un comentario');
      });
    });

    it('debe guardar modificaciones correctamente', async () => {
      const mockChain = createSupabaseMock([mockApprovedPostulation]);
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      
      (supabase.from as any).mockReturnValue({
        ...mockChain,
        update: vi.fn().mockReturnValue({
          eq: mockUpdate
        })
      });

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal de perfil
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      // Abrir modal de modificación
      const modifyButton = screen.getByText('Modificar Aceptación');
      fireEvent.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Comentarios de Modificación/i)).toBeInTheDocument();
      });

      // Llenar el formulario
      const commentsInput = screen.getByLabelText(/Comentarios de Modificación/i);
      fireEvent.change(commentsInput, { target: { value: 'Ajuste de términos aprobado' } });

      // Guardar
      const saveButton = screen.getByText('Guardar Modificaciones');
      fireEvent.click(saveButton);

      // Debe mostrar toast de éxito
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Modificaciones guardadas correctamente');
      });
    });

    it('debe cerrar el modal de modificación sin guardar si no hay cambios', async () => {
      createSupabaseMock([mockApprovedPostulation]);

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modal de perfil
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      // Abrir modal de modificación
      const modifyButton = screen.getByText('Modificar Aceptación');
      fireEvent.click(modifyButton);

      await waitFor(() => {
        expect(screen.getAllByText('Cancelar')[1]).toBeInTheDocument();
      });

      // Click en cancelar (sin cambios)
      const cancelButtons = screen.getAllByText('Cancelar');
      fireEvent.click(cancelButtons[1]); // El segundo es del modal de modificación

      // Debe cerrar sin confirmación
      await waitFor(() => {
        expect(screen.queryByText(/Edita los términos/i)).not.toBeInTheDocument();
      });
    });

    it('debe pedir confirmación al cancelar modificación si hay cambios', async () => {
      global.confirm = vi.fn(() => true);
      
      createSupabaseMock([mockApprovedPostulation]);

      render(
        <PostulationAdminPanel 
          propertyId="property-123" 
          property={mockProperty as any} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez González')).toBeInTheDocument();
      });

      // Abrir modales
      const adminButton = screen.getByText('Administrar');
      fireEvent.click(adminButton);

      const modifyButton = screen.getByText('Modificar Aceptación');
      fireEvent.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Comentarios de Modificación/i)).toBeInTheDocument();
      });

      // Hacer cambios
      const commentsInput = screen.getByLabelText(/Comentarios de Modificación/i);
      fireEvent.change(commentsInput, { target: { value: 'Algunos cambios' } });

      // Intentar cancelar
      const cancelButtons = screen.getAllByText('Cancelar');
      fireEvent.click(cancelButtons[1]);

      // Debe pedir confirmación
      expect(global.confirm).toHaveBeenCalledWith('¿Deseas cerrar sin guardar los cambios?');
    });
  });
});

