import { Profile } from '../../lib/supabase';

// Tipos específicos para applicants
export type BrokerType = 'independent' | 'firm';
export type IntentionType = 'rent' | 'buy';

// Interface extendida para Applicant que incluye campos adicionales
export interface Applicant extends Profile {
  broker_type: BrokerType;
  firm_name?: string; // Solo si broker_type === 'firm'
  intention: IntentionType;
  // Campos adicionales específicos de applicants
  has_guarantor: boolean;
  guarantor_name?: string;
  guarantor_relationship?: string;
  guarantor_email?: string;
  guarantor_phone?: string;
  // Configuración y preferencias
  notifications_enabled: boolean;
  search_preferences?: {
    min_price?: number;
    max_price?: number;
    property_types?: string[];
    regions?: string[];
  };
}

// Interface para documentos del applicant
export interface ApplicantDocument {
  id: string;
  applicant_id: string;
  document_type: 'id' | 'income_proof' | 'bank_statement' | 'guarantor_id' | 'guarantor_income' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}

// Interface para formulario de applicant
export interface ApplicantFormData {
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  rut: string;
  email: string;
  phone: string;
  profession: string;
  marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo';
  address_street: string;
  address_number: string;
  address_department?: string;
  address_commune: string;
  address_region: string;
  monthly_income_clp?: number;
  nationality?: string;
  date_of_birth?: string;
  job_seniority?: string;
  broker_type: BrokerType;
  firm_name?: string;
  intention: IntentionType;
}

// Interface para formulario de guarantor
export interface GuarantorFormData {
  name: string;
  relationship: string;
  email: string;
  phone: string;
}

// Estados de validación
export interface ValidationErrors {
  [key: string]: string | undefined;
}







