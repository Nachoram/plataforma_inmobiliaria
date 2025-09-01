import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
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
  apartment_number: string | null;
  region: string;
  commune: string;
  description: string | null;
  price: number;
  common_expenses: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  photos_urls: string[];
  documents_urls: string[];
  status: 'disponible' | 'vendida' | 'arrendada';
  owner_full_name: string;
  owner_address: string | null;
  owner_apartment_number: string | null;
  owner_region: string;
  owner_commune: string;
  marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo';
  property_regime: string | null;
  available_days: string[];
  available_time_slots: string[];
  created_at: string;
}

export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
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
}