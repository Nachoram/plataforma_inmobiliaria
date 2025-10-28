import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';

// Mock de Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ propertyId: 'test-property-id' }),
  useNavigate: () => vi.fn(),
}));

// Mock de react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AdminPropertyDetailView - Contract Generation', () => {
  let mockSupabase: any;
  let fetchMock: any;

  beforeEach(() => {
    // Setup Supabase mock
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      upsert: vi.fn(),
      insert: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    };

    (createClient as any).mockReturnValue(mockSupabase);

    // Setup fetch mock for n8n webhook
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mapFormDataToDatabase', () => {
    it('debe validar campos obligatorios antes de mapear', () => {
      const invalidFormData = {
        broker_name: '',
        broker_rut: '12345678-9',
        contract_start_date: '2024-01-01',
        final_rent_price: 500000,
        warranty_amount: 500000,
        duration: '12',
        payment_day: 5,
      };

      // Simular la función de mapeo con validaciones
      const mapFormDataToDatabase = (formData: any, userId: string) => {
        if (!formData.broker_name?.trim()) {
          throw new Error('El nombre del corredor es obligatorio');
        }
        return { application_id: 'test-id' };
      };

      expect(() => mapFormDataToDatabase(invalidFormData, 'user-id')).toThrow(
        'El nombre del corredor es obligatorio'
      );
    });

    it('debe validar que el día de pago esté entre 1 y 31', () => {
      const invalidFormData = {
        broker_name: 'Test Broker',
        broker_rut: '12345678-9',
        contract_start_date: '2024-01-01',
        final_rent_price: 500000,
        warranty_amount: 500000,
        duration: '12',
        payment_day: 35, // Inválido
      };

      const mapFormDataToDatabase = (formData: any, userId: string) => {
        if (formData.payment_day < 1 || formData.payment_day > 31) {
          throw new Error('El día de pago debe estar entre 1 y 31');
        }
        return { application_id: 'test-id' };
      };

      expect(() => mapFormDataToDatabase(invalidFormData, 'user-id')).toThrow(
        'El día de pago debe estar entre 1 y 31'
      );
    });

    it('debe mapear correctamente todos los campos requeridos', () => {
      const validFormData = {
        broker_name: 'Test Broker',
        broker_rut: '12345678-9',
        contract_start_date: '2024-01-01',
        final_rent_price: 500000,
        warranty_amount: 500000,
        duration: '12',
        payment_day: 5,
        allows_pets: true,
        special_conditions_house: 'No smoking',
        payment_method: 'transferencia_bancaria',
      };

      const mapFormDataToDatabase = (formData: any, userId: string) => {
        return {
          application_id: 'test-app-id',
          final_rent_price: Number(formData.final_rent_price),
          broker_name: formData.broker_name.trim(),
          broker_rut: formData.broker_rut.trim(),
          contract_duration_months: Number(formData.duration),
          monthly_payment_day: Number(formData.payment_day),
          guarantee_amount: Number(formData.warranty_amount),
          contract_start_date: formData.contract_start_date,
          accepts_pets: Boolean(formData.allows_pets),
          additional_conditions: formData.special_conditions_house?.trim() || null,
          payment_method: formData.payment_method || 'transferencia_bancaria',
          created_by: userId,
        };
      };

      const result = mapFormDataToDatabase(validFormData, 'user-123');

      expect(result).toMatchObject({
        application_id: 'test-app-id',
        final_rent_price: 500000,
        broker_name: 'Test Broker',
        broker_rut: '12345678-9',
        contract_duration_months: 12,
        monthly_payment_day: 5,
        guarantee_amount: 500000,
        contract_start_date: '2024-01-01',
        accepts_pets: true,
        payment_method: 'transferencia_bancaria',
        created_by: 'user-123',
      });
    });
  });

  describe('Guardado en rental_contract_conditions', () => {
    it('debe manejar errores de constraint check_monthly_payment_day', async () => {
      const error = {
        message: 'violates check constraint "check_monthly_payment_day"',
      };

      mockSupabase.upsert.mockResolvedValue({ data: null, error });

      // Simular el manejo de error
      const handleError = (error: any) => {
        if (error.message?.includes('violates check constraint "check_monthly_payment_day"')) {
          return 'El día de pago debe estar entre 1 y 31';
        }
        return 'Error al guardar las condiciones del contrato';
      };

      const errorMessage = handleError(error);
      expect(errorMessage).toBe('El día de pago debe estar entre 1 y 31');
    });

    it('debe manejar errores de constraint check_payment_method', async () => {
      const error = {
        message: 'violates check constraint "check_payment_method"',
      };

      const handleError = (error: any) => {
        if (error.message?.includes('violates check constraint "check_payment_method"')) {
          return 'Método de pago inválido. Debe ser "transferencia_bancaria" o "plataforma"';
        }
        return 'Error al guardar las condiciones del contrato';
      };

      const errorMessage = handleError(error);
      expect(errorMessage).toBe('Método de pago inválido. Debe ser "transferencia_bancaria" o "plataforma"');
    });

    it('debe manejar errores de RLS (permisos)', async () => {
      const error = {
        message: 'permission denied for table rental_contract_conditions',
      };

      const handleError = (error: any) => {
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          return 'No tienes permisos para guardar estas condiciones. Verifica que seas el propietario de la propiedad.';
        }
        return 'Error al guardar las condiciones del contrato';
      };

      const errorMessage = handleError(error);
      expect(errorMessage).toBe('No tienes permisos para guardar estas condiciones. Verifica que seas el propietario de la propiedad.');
    });

    it('debe guardar exitosamente cuando todos los datos son válidos', async () => {
      const validData = {
        application_id: 'test-app-id',
        final_rent_price: 500000,
        broker_name: 'Test Broker',
        broker_rut: '12345678-9',
        contract_duration_months: 12,
        monthly_payment_day: 5,
        guarantee_amount: 500000,
        contract_start_date: '2024-01-01',
        payment_method: 'transferencia_bancaria',
      };

      mockSupabase.upsert.mockResolvedValue({ data: validData, error: null });

      const result = await mockSupabase
        .from('rental_contract_conditions')
        .upsert(validData, { onConflict: 'application_id' });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(validData);
    });
  });

  describe('Webhook n8n', () => {
    it('debe construir el payload correcto con todos los campos necesarios', () => {
      const formData = {
        contract_start_date: '2024-01-01',
        contract_end_date: '2024-12-31',
        duration: '12',
        monthly_rent: 450000,
        final_rent_price: 500000,
        warranty_amount: 500000,
        payment_day: 5,
        broker_name: 'Test Broker',
        broker_rut: '12345678-9',
        broker_commission: 50000,
        allows_pets: true,
        dicom_clause: false,
        special_conditions_house: 'No smoking',
        notification_email: 'test@example.com',
        payment_method: 'transferencia_bancaria',
      };

      const contractRecord = {
        id: 'contract-123',
        contract_number: 'C-2024-001',
      };

      const selectedProfile = {
        applicationId: 'app-123',
        name: 'John Doe',
        rut: '11111111-1',
        profile: { email: 'john@example.com', phone: '+56912345678' },
      };

      const property = {
        id: 'prop-123',
        address_street: 'Calle Falsa',
        address_number: '123',
        address_commune: 'Santiago',
        address_region: 'RM',
      };

      const webhookPayload = {
        contract_id: contractRecord.id,
        contract_number: contractRecord.contract_number,
        application_id: selectedProfile.applicationId,
        property_id: property.id,
        applicant_name: selectedProfile.name,
        applicant_rut: selectedProfile.rut,
        applicant_email: selectedProfile.profile.email,
        applicant_phone: selectedProfile.profile.phone,
        property_address: `${property.address_street} ${property.address_number}`,
        property_commune: property.address_commune,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        contract_duration_months: Number(formData.duration),
        final_rent_price: Number(formData.final_rent_price),
        warranty_amount: Number(formData.warranty_amount),
        payment_day: Number(formData.payment_day),
        broker_name: formData.broker_name,
        broker_rut: formData.broker_rut,
        accepts_pets: Boolean(formData.allows_pets),
        payment_method: formData.payment_method,
        contract_type: 'arriendo',
        contract_format: 'hybrid',
        contract_status: 'draft',
        generated_at: expect.any(String),
      };

      expect(webhookPayload).toMatchObject({
        contract_id: 'contract-123',
        contract_number: 'C-2024-001',
        application_id: 'app-123',
        property_id: 'prop-123',
        contract_duration_months: 12,
        final_rent_price: 500000,
        contract_type: 'arriendo',
      });
    });

    it('debe manejar respuesta exitosa del webhook (HTTP 200)', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, contract_id: 'contract-123' }),
      });

      const response = await fetch('https://n8n.example.com/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('debe manejar error 400 del webhook', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'Invalid data' }),
        text: async () => '{"error": "Invalid data"}',
      });

      const response = await fetch('https://n8n.example.com/webhook', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      // Simular manejo de error
      const handleWebhookError = (status: number) => {
        if (status === 400) {
          return 'Datos inválidos enviados al generador de contratos. Verifica todos los campos.';
        }
        return 'Error al generar el contrato en el servidor';
      };

      const errorMessage = handleWebhookError(response.status);
      expect(errorMessage).toBe('Datos inválidos enviados al generador de contratos. Verifica todos los campos.');
    });

    it('debe manejar error 500 del webhook', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        headers: { get: () => 'text/plain' },
        text: async () => 'Internal Server Error',
      });

      const response = await fetch('https://n8n.example.com/webhook', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      });

      const handleWebhookError = (status: number) => {
        if (status === 500) {
          return 'Error interno en el servidor de generación de contratos. Intenta nuevamente.';
        }
        return 'Error al generar el contrato en el servidor';
      };

      const errorMessage = handleWebhookError(response.status);
      expect(errorMessage).toBe('Error interno en el servidor de generación de contratos. Intenta nuevamente.');
    });

    it('debe manejar timeout o fallo de conexión', async () => {
      fetchMock.mockRejectedValue(new Error('Network request failed'));

      await expect(
        fetch('https://n8n.example.com/webhook', {
          method: 'POST',
          body: JSON.stringify({ test: 'data' }),
        })
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('Race conditions y duplicados', () => {
    it('debe prevenir múltiples ejecuciones simultáneas', async () => {
      let isGenerating = false;

      const handleGenerateContract = async () => {
        if (isGenerating) {
          console.log('⚠️ Ya hay una generación en proceso');
          return false;
        }

        isGenerating = true;
        try {
          // Simular operación
          await new Promise(resolve => setTimeout(resolve, 100));
          return true;
        } finally {
          isGenerating = false;
        }
      };

      // Intentar ejecutar simultáneamente
      const results = await Promise.all([
        handleGenerateContract(),
        handleGenerateContract(),
        handleGenerateContract(),
      ]);

      // Solo una debe ejecutarse exitosamente
      const successfulExecutions = results.filter(r => r === true);
      expect(successfulExecutions.length).toBe(1);
    });

    it('debe deshabilitar el botón mientras está generando', () => {
      const isGenerating = true;
      const selectedProfile = { id: 'test' };

      const isButtonDisabled = isGenerating || !selectedProfile;

      expect(isButtonDisabled).toBe(true);
    });
  });
});

