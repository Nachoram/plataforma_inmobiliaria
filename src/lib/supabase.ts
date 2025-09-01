import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  city: string;
  country: string;
  description: string | null;
  price: number;
  common_expenses: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  photos_urls: string[];
  documents_urls: string[];
  status: 'disponible' | 'vendida' | 'arrendada';
  created_at: string;
  address_id: string | null;
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
}