/**
 * Servicio de Firma Electrónica
 *
 * Este servicio proporciona integración con proveedores de firma electrónica.
 * Actualmente implementa una simulación, pero puede ser extendido para integrar
 * con servicios reales como DocuSign, Adobe Sign, o proveedores locales chilenos.
 */

export interface SignatureRequest {
  contractId: string;
  signerType: 'owner' | 'tenant' | 'guarantor';
  signerName: string;
  signerEmail: string;
  documentContent: string;
  callbackUrl?: string;
}

export interface SignatureResponse {
  success: boolean;
  signatureRequestId?: string;
  signatureUrl?: string;
  error?: string;
}

export interface SignatureStatus {
  signatureRequestId: string;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired' | 'cancelled';
  signedAt?: Date;
  certificateUrl?: string;
}

/**
 * Clase principal del servicio de firma electrónica
 */
export class ElectronicSignatureService {
  private static instance: ElectronicSignatureService;
  private apiKey: string;
  private apiUrl: string;

  private constructor() {
    // En producción, estas configuraciones vendrían de variables de entorno
    this.apiKey = import.meta.env.VITE_ELECTRONIC_SIGNATURE_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_ELECTRONIC_SIGNATURE_API_URL || '';
  }

  public static getInstance(): ElectronicSignatureService {
    if (!ElectronicSignatureService.instance) {
      ElectronicSignatureService.instance = new ElectronicSignatureService();
    }
    return ElectronicSignatureService.instance;
  }

  /**
   * Envía un documento para firma electrónica
   */
  async sendForSignature(request: SignatureRequest): Promise<SignatureResponse> {
    try {
      // En desarrollo, simulamos la respuesta
      if (import.meta.env.DEV || !this.apiKey) {
        return this.simulateSignatureRequest(request);
      }

      // En producción, aquí iría la integración real
      const response = await this.callSignatureAPI(request);
      return response;
    } catch (error) {
      console.error('Error sending document for signature:', error);
      return {
        success: false,
        error: 'Error al enviar documento para firma electrónica'
      };
    }
  }

  /**
   * Verifica el estado de una firma
   */
  async checkSignatureStatus(signatureRequestId: string): Promise<SignatureStatus | null> {
    try {
      if (import.meta.env.DEV || !this.apiKey) {
        return this.simulateSignatureStatus(signatureRequestId);
      }

      const response = await this.callStatusAPI(signatureRequestId);
      return response;
    } catch (error) {
      console.error('Error checking signature status:', error);
      return null;
    }
  }

  /**
   * Cancela una solicitud de firma
   */
  async cancelSignature(signatureRequestId: string): Promise<boolean> {
    try {
      if (import.meta.env.DEV || !this.apiKey) {
        return true; // Simulación siempre exitosa
      }

      const response = await this.callCancelAPI(signatureRequestId);
      return response;
    } catch (error) {
      console.error('Error cancelling signature:', error);
      return false;
    }
  }

  /**
   * Simula el envío de un documento para firma (desarrollo)
   */
  private async simulateSignatureRequest(request: SignatureRequest): Promise<SignatureResponse> {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generar ID único para la simulación
    const signatureRequestId = `sim_${request.contractId}_${request.signerType}_${Date.now()}`;

    // URL simulada para firma
    const signatureUrl = `${window.location.origin}/signature/${signatureRequestId}`;

    console.log('📝 Firma electrónica simulada:', {
      requestId: signatureRequestId,
      signer: request.signerName,
      email: request.signerEmail,
      url: signatureUrl
    });

    return {
      success: true,
      signatureRequestId,
      signatureUrl
    };
  }

  /**
   * Simula verificación de estado de firma (desarrollo)
   */
  private async simulateSignatureStatus(signatureRequestId: string): Promise<SignatureStatus> {
    // Simular diferentes estados basado en el tiempo
    const now = Date.now();
    const requestTime = parseInt(signatureRequestId.split('_').pop() || '0');
    const elapsedMinutes = (now - requestTime) / (1000 * 60);

    let status: SignatureStatus['status'] = 'pending';
    let signedAt: Date | undefined;

    if (elapsedMinutes > 30) {
      status = 'expired';
    } else if (elapsedMinutes > 20) {
      status = 'signed';
      signedAt = new Date(requestTime + 20 * 60 * 1000);
    } else if (elapsedMinutes > 10) {
      status = 'viewed';
    } else if (elapsedMinutes > 2) {
      status = 'sent';
    }

    return {
      signatureRequestId,
      status,
      signedAt,
      certificateUrl: status === 'signed' ? `/certificates/${signatureRequestId}.pdf` : undefined
    };
  }

  /**
   * Integración real con API de firma electrónica (producción)
   * Este método debería ser implementado según el proveedor elegido
   */
  private async callSignatureAPI(request: SignatureRequest): Promise<SignatureResponse> {
    // Ejemplo de integración con DocuSign o similar
    const payload = {
      emailSubject: `Contrato de Arriendo - Firma Electrónica`,
      emailBlurb: `Por favor, revise y firme el contrato de arriendo adjunto.`,
      documents: [{
        documentBase64: btoa(request.documentContent),
        documentId: '1',
        fileExtension: 'html',
        name: `Contrato_${request.contractId}.html`
      }],
      recipients: {
        signers: [{
          email: request.signerEmail,
          name: request.signerName,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '400',
              yPosition: '600'
            }]
          }
        }]
      },
      status: 'sent'
    };

    const response = await fetch(`${this.apiUrl}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      signatureRequestId: data.envelopeId,
      signatureUrl: data.envelopeUrl || `${this.apiUrl}/signing/${data.envelopeId}`
    };
  }

  /**
   * Verificación de estado con API real
   */
  private async callStatusAPI(signatureRequestId: string): Promise<SignatureStatus> {
    const response = await fetch(`${this.apiUrl}/envelopes/${signatureRequestId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    return {
      signatureRequestId,
      status: this.mapAPIStatus(data.status),
      signedAt: data.completedDateTime ? new Date(data.completedDateTime) : undefined,
      certificateUrl: data.certificateUri
    };
  }

  /**
   * Cancelación de firma con API real
   */
  private async callCancelAPI(signatureRequestId: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/envelopes/${signatureRequestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'voided',
        voidedReason: 'Cancelado por el usuario'
      })
    });

    return response.ok;
  }

  /**
   * Mapea estados de API externa a nuestros estados internos
   */
  private mapAPIStatus(apiStatus: string): SignatureStatus['status'] {
    const statusMap: Record<string, SignatureStatus['status']> = {
      'sent': 'sent',
      'delivered': 'viewed',
      'completed': 'signed',
      'declined': 'rejected',
      'voided': 'cancelled',
      'expired': 'expired'
    };

    return statusMap[apiStatus] || 'pending';
  }
}

// Instancia singleton del servicio
export const electronicSignatureService = ElectronicSignatureService.getInstance();

/**
 * Hook personalizado para usar el servicio de firma electrónica
 */
export function useElectronicSignature() {
  return {
    sendForSignature: electronicSignatureService.sendForSignature.bind(electronicSignatureService),
    checkSignatureStatus: electronicSignatureService.checkSignatureStatus.bind(electronicSignatureService),
    cancelSignature: electronicSignatureService.cancelSignature.bind(electronicSignatureService)
  };
}
