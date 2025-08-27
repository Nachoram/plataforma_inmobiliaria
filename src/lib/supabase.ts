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
  city: string;
  country: string;
  description: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  photos_urls: string[];
  documents_urls: string[];
  status: 'disponible' | 'vendida' | 'arrendada';
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
  created_at: string;
}