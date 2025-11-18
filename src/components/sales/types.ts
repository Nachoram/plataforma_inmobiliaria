// ========================================================================
// INTERFACES Y TIPOS PARA GESTIÓN COMPLETA DE OFERTAS
// ========================================================================

export interface SaleOffer {
  id: string;
  buyer_id: string;
  property_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  offer_amount: number;
  offer_amount_currency: string;
  financing_type?: string;
  message?: string;
  status: SaleOfferStatus;
  created_at: string;
  updated_at: string;
  requests_title_study: boolean;
  requests_property_inspection: boolean;
  seller_response?: string;
  seller_notes?: string;
  counter_offer_amount?: number;
  counter_offer_terms?: string;
  responded_at?: string;
  property?: {
    id: string;
    address_street: string;
    address_number: string;
    address_commune: string;
    address_region: string;
    price?: number;
  };
}

export interface OfferTask {
  id: string;
  offer_id: string;
  task_type: 'evaluó_comercial' | 'estudio_titulo' | 'promesa_compraventa' | 'inspección_precompra' | 'documentación' | 'modificación_título';
  status: 'pendiente' | 'en_progreso' | 'completada' | 'rechazada';
  description?: string;
  priority: 'baja' | 'normal' | 'alta' | 'urgente';
  assigned_to?: string;
  assigned_by?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OfferDocument {
  id: string;
  offer_id: string;
  document_name: string;
  document_type: 'cedula' | 'comprobante_ingresos' | 'certificado_dominio' | 'boleta_agua' | 'boleta_luz' | 'boleta_gas' | 'contrato_arriendo' | 'declaracion_renta' | 'certificado_matrimonio' | 'poder_notarial' | 'otro';
  file_url: string;
  file_size?: number;
  file_type?: string;
  status: 'pendiente' | 'recibido' | 'validado' | 'rechazado';
  notes?: string;
  validated_by?: string;
  requested_by?: string;
  is_required: boolean;
  uploaded_at: string;
  validated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OfferTimeline {
  id: string;
  offer_id: string;
  event_type: string;
  event_title: string;
  event_description?: string;
  triggered_by: string;
  triggered_by_name?: string;
  triggered_by_role: 'seller' | 'buyer' | 'admin';
  related_data?: Record<string, any>;
  created_at: string;
}

export interface OfferFormalRequest {
  id: string;
  offer_id: string;
  request_type: 'promesa_compraventa' | 'modificación_título' | 'inspección_precompra' | 'información_adicional';
  request_title: string;
  request_description?: string;
  required_documents?: string[];
  status: 'solicitada' | 'recibida' | 'en_proceso' | 'completada' | 'rechazada';
  requested_by: string;
  requested_to: string;
  response_text?: string;
  response_documents?: string[];
  responded_at?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface OfferCommunication {
  id: string;
  offer_id: string;
  message: string;
  message_type?: 'nota_interna' | 'comunicación' | 'seguimiento';
  author_id: string;
  author_name?: string;
  author_role: 'seller' | 'buyer' | 'admin';
  is_private: boolean;
  visible_to_buyer: boolean;
  attachment_ids?: string[];
  created_at: string;
  updated_at: string;
}

export type UserRole = 'seller' | 'buyer' | 'admin';

export type SaleOfferStatus = 'pendiente' | 'en_revision' | 'info_solicitada' | 'aceptada' | 'rechazada' | 'contraoferta' | 'estudio_titulo' | 'finalizada';

// ========================================================================
// TIPOS PARA COMPONENTES Y FUNCIONES
// ========================================================================

export type TabType = 'summary' | 'tasks' | 'documents' | 'requests' | 'timeline' | 'communication';

export interface OfferManagementState {
  offerId: string;
  offer: SaleOffer | null;
  tasks: OfferTask[];
  documents: OfferDocument[];
  timeline: OfferTimeline[];
  formalRequests: OfferFormalRequest[];
  communications: OfferCommunication[];
  currentUserRole: UserRole | null;
  activeTab: TabType;
  loading: boolean;
  error: string | null;
}

// ========================================================================
// TIPOS PARA FORMULARIOS Y MODALES
// ========================================================================

export interface TaskFormData {
  task_type: OfferTask['task_type'];
  description?: string;
  priority: OfferTask['priority'];
  assigned_to?: string;
  due_date?: string;
}

export interface DocumentRequestFormData {
  document_name: string;
  document_type: OfferDocument['document_type'];
  description?: string;
  is_required: boolean;
  due_date?: string;
}

export interface FormalRequestFormData {
  request_type: OfferFormalRequest['request_type'];
  request_title: string;
  request_description?: string;
  required_documents?: string[];
  due_date?: string;
}

export interface CommunicationFormData {
  message: string;
  message_type?: OfferCommunication['message_type'];
  is_private: boolean;
  attachment_ids?: string[];
}

export interface CounterOfferFormData {
  counter_offer_amount: number;
  counter_offer_terms?: string;
  seller_response?: string;
}

// ========================================================================
// TIPOS PARA EVENTOS DE TIMELINE
// ========================================================================

export interface TimelineEventData {
  event_type: string;
  event_title: string;
  event_description?: string;
  triggered_by: string;
  triggered_by_name?: string;
  triggered_by_role: UserRole;
  related_data?: Record<string, any>;
}

// ========================================================================
// CONSTANTES Y ENUMERACIONES
// ========================================================================

export const TASK_TYPES = {
  'evaluó_comercial': 'Evaluación Comercial',
  'estudio_titulo': 'Estudio de Título',
  'promesa_compraventa': 'Promesa de Compraventa',
  'inspección_precompra': 'Inspección Precompra',
  'documentación': 'Documentación',
  'modificación_título': 'Modificación de Título'
} as const;

export const DOCUMENT_TYPES = {
  'cedula': 'Cédula de Identidad',
  'comprobante_ingresos': 'Comprobante de Ingresos',
  'certificado_dominio': 'Certificado de Dominio',
  'boleta_agua': 'Boleta de Agua',
  'boleta_luz': 'Boleta de Luz',
  'boleta_gas': 'Boleta de Gas',
  'contrato_arriendo': 'Contrato de Arriendo',
  'declaracion_renta': 'Declaración de Renta',
  'certificado_matrimonio': 'Certificado de Matrimonio',
  'poder_notarial': 'Poder Notarial',
  'otro': 'Otro Documento'
} as const;

export const FORMAL_REQUEST_TYPES = {
  'promesa_compraventa': 'Promesa de Compraventa',
  'modificación_título': 'Modificación de Título',
  'inspección_precompra': 'Inspección Precompra',
  'información_adicional': 'Información Adicional'
} as const;

export const PRIORITY_LEVELS = {
  'baja': { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  'normal': { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  'alta': { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
} as const;

export const STATUS_COLORS = {
  'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'en_progreso': 'bg-blue-100 text-blue-800 border-blue-200',
  'completada': 'bg-green-100 text-green-800 border-green-200',
  'rechazada': 'bg-red-100 text-red-800 border-red-200',
  'recibido': 'bg-blue-100 text-blue-800 border-blue-200',
  'validado': 'bg-green-100 text-green-800 border-green-200',
  'solicitada': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'en_proceso': 'bg-blue-100 text-blue-800 border-blue-200'
} as const;
