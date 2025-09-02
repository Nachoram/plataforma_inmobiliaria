import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Evitar que la app se caiga si faltan variables en tiempo de ejecución
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Usar valores de respaldo para evitar crash y permitir que la UI cargue
const resolvedSupabaseUrl = supabaseUrl || 'https://invalid.supabase.co';
const resolvedSupabaseAnonKey = supabaseAnonKey || 'invalid-anon-key';

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey);

// Database types
export interface Address {
  id: string;
  street_address: string;
  apartment_number: string | null;
  region: string;
  commune: string;
  country: string;
  created_at: string;
}

export interface Applicant {
  id: string;
  user_id: string | null;
  full_name: string;
  rut: string | null;
  profession: string | null;
  company: string | null;
  monthly_income: number;
  work_seniority_years: number;
  contact_email: string;
  contact_phone: string | null;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  address?: Address;
}

export interface Guarantor {
  id: string;
  full_name: string;
  rut: string | null;
  profession: string | null;
  company: string | null;
  monthly_income: number;
  work_seniority_years: number;
  contact_email: string | null;
  contact_phone: string | null;
  address_id: string | null;
  created_at: string;
  updated_at: string;
  address?: Address;
}

export interface Document {
  id: string;
  uploader_user_id: string;
  application_id: string | null;
  property_id: string | null;
  applicant_id: string | null;
  guarantor_id: string | null;
  document_type: string;
  file_url: string;
  storage_path: string | null;
  file_size_bytes: number;
  mime_type: string | null;
  uploaded_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  listing_type: 'venta' | 'arriendo';
  address: string;
  commune: string;
  region: string;
  country: string;
  description: string | null;
  price: number;
  common_expenses: number;
  common_expenses: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  photos_urls: string[];
  documents_urls: string[];
  status: 'disponible' | 'vendida' | 'arrendada';
  created_at: string;
  address_id: string | null;
  // Legacy compatibility
  city?: string;
}

export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  structured_applicant_id: string | null;
  structured_guarantor_id: string | null;
  applicant_data: any; // Legacy JSONB data
  // Normalized data access
  structured_applicant?: Applicant;
  structured_guarantor?: Guarantor;
}

export interface Offer {
  id: string;
  property_id: string;
  buyer_id: string;
  offer_amount: number;
  message: string | null;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  financing_type: 'contado' | 'credito_preaprobado' | 'credito_tramitacion';
  selected_services: string[];
  services_total_cost: number;
  buyer_info: {
    fullName: string;
    rut: string;
    address: string;
    email: string;
    phone: string;
    maritalStatus: string;
    propertyRegime: string;
  };
  payment_status: 'no_aplica' | 'pendiente' | 'pagado' | 'cancelado';
  created_at: string;
  structured_applicant_id: string | null;
  // Normalized data access
  structured_applicant?: Applicant;
}

export interface VisitRequest {
  id: string;
  property_id: string;
  user_id: string;
  requested_date: string;
  requested_time_slot: 'morning' | 'afternoon' | 'flexible';
  message: string | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  created_at: string;
}

// Helper functions for normalized data operations
export const createNormalizedApplication = async (
  propertyId: string,
  applicantData: any,
  guarantorData?: any,
  message?: string
) => {
  const { data, error } = await supabase.rpc('create_normalized_application', {
    p_property_id: propertyId,
    p_applicant_data: applicantData,
    p_guarantor_data: guarantorData || null,
    p_message: message || null
  });
  
  return { data, error };
};

export const searchApplicants = async (criteria: {
  company?: string;
  profession?: string;
  minIncome?: number;
  region?: string;
}) => {
  const { data, error } = await supabase.rpc('search_applicants', {
    p_company: criteria.company || null,
    p_profession: criteria.profession || null,
    p_min_income: criteria.minIncome || null,
    p_region: criteria.region || null
  });
  
  return { data, error };
};

export const getPropertyStatistics = async (propertyId: string) => {
  const { data, error } = await supabase.rpc('get_property_statistics', {
    p_property_id: propertyId
  });
  
  return { data, error };
}