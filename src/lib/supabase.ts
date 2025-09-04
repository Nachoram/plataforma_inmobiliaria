import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Environment variables check removed - using hardcoded configuration

// Usar valores de respaldo para evitar crash y permitir que la UI cargue
// Fixed configuration - hardcoded to avoid environment variable issues
const resolvedSupabaseUrl = 'https://uodpyvhgerxwoibdfths.supabase.co';
const resolvedSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZHB5dmhnZXJ4d29pYmRmdGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTg0NzgsImV4cCI6MjA3MjQ5NDQ3OH0.FOcJw4ROb2mJ2eOkIBW5vkZ2LjUeJXiX3fkF9-5SL18';

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
  type: 'venta' | 'arriendo';
  address: string;
  street: string;
  number: string;
  apartment?: string | null;
  region: string;
  comuna: string;
  description: string;
  price: number;
  common_expenses?: number | null;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  photos_urls?: string[];
  documents_urls?: string[];
  status: 'active' | 'rented' | 'sold' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Ofertas para propiedades en venta
export interface Offer {
  id: string;
  property_id: string;
  buyer_id: string;
  offer_amount: number;
  message: string;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  created_at: string;
}

// Aplicaciones para propiedades en arriendo
export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
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