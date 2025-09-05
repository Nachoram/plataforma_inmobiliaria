import { createClient } from '@supabase/supabase-js';

// Configuración del proyecto Supabase - Plataforma Inmobiliaria
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN3oCSVQlaYaPkPmXS2w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types - Nuevo esquema normalizado
export interface Profile {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  rut: string;
  email: string;
  phone: string;
  profession: string;
  marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo';
  property_regime: 'sociedad conyugal' | 'separación de bienes' | 'participación en los gananciales' | null;
  address_street: string;
  address_number: string;
  address_department: string | null;
  address_commune: string;
  address_region: string;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  status: 'activa' | 'arrendada' | 'vendida' | 'pausada';
  listing_type: 'venta' | 'arriendo';
  address_street: string;
  address_number: string;
  address_department: string | null;
  address_commune: string;
  address_region: string;
  price_clp: number;
  common_expenses_clp: number | null;
  bedrooms: number;
  bathrooms: number;
  surface_m2: number;
  description: string;
  created_at: string;
}

export interface Guarantor {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  rut: string;
  profession: string;
  monthly_income_clp: number;
  address_street: string;
  address_number: string;
  address_department: string | null;
  address_commune: string;
  address_region: string;
  created_at: string;
}

export interface Application {
  id: string;
  property_id: string;
  applicant_id: string;
  guarantor_id: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'info_solicitada';
  message: string;
  snapshot_applicant_profession: string;
  snapshot_applicant_monthly_income_clp: number;
  snapshot_applicant_age: number;
  snapshot_applicant_nationality: string;
  snapshot_applicant_marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo';
  snapshot_applicant_address_street: string;
  snapshot_applicant_address_number: string;
  snapshot_applicant_address_department: string | null;
  snapshot_applicant_address_commune: string;
  snapshot_applicant_address_region: string;
  created_at: string;
}

export interface Offer {
  id: string;
  property_id: string;
  offerer_id: string;
  offer_amount_clp: number;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  message: string;
  created_at: string;
}

export interface Document {
  id: string;
  uploader_id: string;
  related_entity_id: string;
  related_entity_type: 'property_legal' | 'application_applicant' | 'application_guarantor';
  document_type: string;
  storage_path: string;
  file_name: string;
  created_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path: string;
  created_at: string;
}

export interface UserFavorite {
  user_id: string;
  property_id: string;
  created_at: string;
}

// Helper functions para operaciones de base de datos
export const formatPriceCLP = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatRUT = (rut: string): string => {
  // Remover puntos y guiones
  const cleanRut = rut.replace(/[.-]/g, '');
  
  // Separar número y dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Formatear número con puntos
  const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedNumber}-${dv}`;
};

export const validateRUT = (rut: string): boolean => {
  const cleanRut = rut.replace(/[.-]/g, '');
  const rutNumber = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  if (!/^\d+$/.test(rutNumber) || rutNumber.length < 7) {
    return false;
  }
  
  // Algoritmo de validación de RUT chileno
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
  
  return dv === calculatedDV;
};

// Funciones de autenticación
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};