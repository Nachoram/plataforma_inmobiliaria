import { createClient } from '@supabase/supabase-js';
import { createDocumentFileName } from './documentNaming';

// 1. Obtener las variables de entorno con valores por defecto para desarrollo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

// Validación mejorada de variables de entorno
const validateEnvironmentVariables = () => {
  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push('VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }

  if (missingVars.length > 0) {
    const errorMessage = `Faltan las siguientes variables de entorno requeridas para Supabase:\n${missingVars.join(', ')}\n\nPor favor, verifica tu archivo .env y asegúrate de que estas variables estén definidas:\n\nVITE_SUPABASE_URL=https://tu-proyecto.supabase.co\nVITE_SUPABASE_ANON_KEY=tu-anon-key-aquí\n\nSi acabas de crear el archivo .env, reinicia el servidor de desarrollo.`;

    console.error('❌ Error de configuración de Supabase:', errorMessage);

    // En desarrollo, mostrar un error más detallado
    if (import.meta.env.DEV) {
      console.error('Variables de entorno disponibles:', {
        VITE_SUPABASE_URL: supabaseUrl ? '✓ Presente' : '✗ Faltante',
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓ Presente' : '✗ Faltante',
      });

      console.log('🔍 Estado actual de import.meta.env:');
      console.log('import.meta.env.VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('import.meta.env.VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Presente (oculto por seguridad)' : 'No presente');
    }

    throw new Error(errorMessage);
  }

  console.log('✅ Variables de entorno de Supabase cargadas correctamente');
};

validateEnvironmentVariables();

// 3. Crear y exportar el cliente de Supabase con configuración específica
// Esta es la única exportación del archivo.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'plataforma-inmobiliaria'
    }
  }
});

// 4. Cliente de Supabase inicializado y listo para uso
// La validación de entorno se realiza en main.tsx antes de cualquier inicialización

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
  monthly_income_clp?: number; // agregado
  nationality?: string; // agregado
  date_of_birth?: string | null; // agregado (ISO date)
  job_seniority?: string | null; // agregado
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  status: 'disponible' | 'arrendada' | 'vendida' | 'pausada' | 'activa';
  // Note: 'disponible' is the default status for new properties
  listing_type: 'venta' | 'arriendo';
  tipo_propiedad: 'Casa' | 'Departamento' | 'Oficina' | 'Local Comercial' | 'Estacionamiento' | 'Bodega' | 'Parcela'; // Campo principal del database
  address_street: string;
  address_number: string;
  address_department: string | null;
  address_commune: string;
  address_region: string;
  price_clp: number; // Database: bigint (large integer for Chilean pesos)
  common_expenses_clp: number | null; // Database: integer, nullable
  bedrooms: number; // Database: integer NOT NULL DEFAULT 0
  bathrooms: number; // Database: integer NOT NULL DEFAULT 0
  surface_m2: number | null; // Database: integer, nullable (deprecated, use metros_totales)
  description: string | null; // Database: text, nullable
  created_at: string; // Database: timestamptz
  // Campos opcionales agregados en migraciones recientes
  is_visible?: boolean; // Database: boolean DEFAULT true
  is_featured?: boolean; // Database: boolean DEFAULT false
  // Nuevos campos agregados en 20251015000000_update_property_form_fields.sql
  metros_utiles?: number | null; // Database: numeric(8,2), nullable
  metros_totales?: number | null; // Database: numeric(8,2), nullable
  tiene_terraza?: boolean; // Database: boolean DEFAULT false
  ano_construccion?: number | null; // Database: integer, nullable
  tiene_sala_estar?: boolean; // Database: boolean DEFAULT false
  sistema_agua_caliente?: 'Calefón' | 'Termo Eléctrico' | 'Caldera Central' | null; // Database: tipo_agua_caliente, nullable
  tipo_cocina?: 'Cerrada' | 'Americana' | 'Integrada' | null; // Database: tipo_cocina, nullable
  asesor_id?: string | null; // Database: uuid REFERENCES profiles(id), nullable
  estacionamientos?: number; // Database: integer DEFAULT 0

  // Campos del propietario agregados en 20251015130000_add_owner_fields_to_properties.sql
  owner_type?: 'natural' | 'juridica'; // Database: owner_type_enum DEFAULT 'natural'
  // Campos para persona natural
  owner_first_name?: string | null;
  owner_paternal_last_name?: string | null;
  owner_maternal_last_name?: string | null;
  owner_rut?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  // Campos para persona jurídica
  owner_company_name?: string | null;
  owner_company_rut?: string | null;
  owner_company_business?: string | null;
  owner_company_email?: string | null;
  owner_company_phone?: string | null;
  // Campos para representante legal
  owner_representative_first_name?: string | null;
  owner_representative_paternal_last_name?: string | null;
  owner_representative_maternal_last_name?: string | null;
  owner_representative_rut?: string | null;
  owner_representative_email?: string | null;
  owner_representative_phone?: string | null;

  // Campos adicionales agregados en migraciones posteriores
  tiene_bodega?: boolean; // Database: boolean DEFAULT false
  metros_bodega?: number | null; // Database: integer, nullable
  storage_number?: string | null; // Database: varchar(50), nullable
  parking_location?: string | null; // Database: varchar(100), nullable
  parcela_number?: string | null; // Database: varchar(30), nullable

  // Campo agregado en migración 20251028120000_create_property_type_characteristics.sql
  property_type_characteristics_id?: string | null; // Database: uuid REFERENCES property_type_characteristics(id), nullable
}

// Interface para datos transformados/calculados en el frontend
export interface PropertyWithExtras extends Omit<Property, 'description'> {
  description: string; // Override to make non-nullable for frontend use
  photos_urls?: string[] | null;
  owner_profile?: {
    first_name: string;
    paternal_last_name: string;
    phone: string;
  } | null;
}

export interface Guarantor {
  id: string;
  full_name: string;
  rut: string;
  profession: string;
  company: string;
  monthly_income: number;
  work_seniority_years: number;
  contact_email: string;
  contact_phone: string;
  address_id: string | null;
  created_at: string;
  updated_at: string;
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

// Interfaces for Sale Offers System
export type SaleOfferStatus = 
  | 'pendiente'
  | 'en_revision'
  | 'info_solicitada'
  | 'aceptada'
  | 'rechazada'
  | 'contraoferta'
  | 'estudio_titulo'
  | 'finalizada';

export interface PropertySaleOffer {
  id: string;
  property_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  offer_amount: number;
  offer_amount_currency: string;
  financing_type: string | null;
  message: string | null;
  requests_title_study: boolean;
  requests_property_inspection: boolean;
  status: SaleOfferStatus;
  seller_response: string | null;
  seller_notes: string | null;
  counter_offer_amount: number | null;
  counter_offer_terms: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

export interface PropertySaleOfferDocument {
  id: string;
  offer_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
}

export interface PropertySaleOfferHistory {
  id: string;
  offer_id: string;
  action: string;
  old_status: SaleOfferStatus | null;
  new_status: SaleOfferStatus | null;
  changed_by: string | null;
  change_notes: string | null;
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
  // Validaciones robustas para casos edge
  if (price === null || price === undefined) {
    console.warn('formatPriceCLP recibió un valor null o undefined:', price);
    return '$0 CLP';
  }

  if (typeof price !== 'number') {
    console.warn('formatPriceCLP recibió un valor no numérico:', price);
    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice)) {
      return '$0 CLP';
    }
    price = numericPrice;
  }

  if (!isFinite(price)) {
    console.warn('formatPriceCLP recibió un valor no finito:', price);
    return '$0 CLP';
  }

  if (price < 0) {
    console.warn('formatPriceCLP recibió un valor negativo:', price);
    // Permitir valores negativos pero mostrar advertencia
  }

  // Redondear a entero más cercano para evitar problemas de precisión
  const roundedPrice = Math.round(price);

  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedPrice);
  } catch (error) {
    console.error('Error formateando precio:', error, 'Valor recibido:', price);
    // Fallback a formateo manual si Intl falla
    return `$${roundedPrice.toLocaleString('es-CL')} CLP`;
  }
};

// Función adicional para validar precios antes de formatear
export const isValidPrice = (price: unknown): boolean => {
  if (price === null || price === undefined) return false;
  if (typeof price !== 'number') {
    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice)) return false;
    price = numericPrice;
  }
  return isFinite(Number(price)) && Number(price) >= 0;
};

// Custom hooks for consistent state management
import { useState, useCallback } from 'react';

export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await operation();

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      if (options.successMessage) {
        console.log('✅', options.successMessage);
      }

      return result;
    } catch (err: any) {
      const errorMsg = options.errorMessage || err?.message || 'Operation failed';
      setError(errorMsg);

      if (options.onError) {
        options.onError(err);
      }

      console.error('❌', errorMsg, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    executeAsync,
    clearError,
    setError,
  };
};

// Hook for form state management
export const useFormState = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [errors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  }, [errors]);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const validateField = useCallback((field: string, validator: (value: any) => string | null) => {
    const value = formData[field as keyof T];
    const error = validator(value);
    setFieldError(field, error || '');
    return !error;
  }, [formData, setFieldError]);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  const isValid = Object.values(errors).every(error => !error);

  return {
    formData,
    errors,
    touched,
    handleInputChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateField,
    resetForm,
    isValid,
  };
};

// Hook for managing lists with loading states
export const useListState = <T>() => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadItems = useCallback(async (
    loader: () => Promise<T[]>,
    options: {
      append?: boolean;
      onSuccess?: (items: T[]) => void;
    } = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const newItems = await loader();

      if (options.append) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      setHasMore(newItems.length > 0);

      if (options.onSuccess) {
        options.onSuccess(newItems);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load items');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback((item: T) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const updateItem = useCallback((id: string | number, updates: Partial<T>) => {
    setItems(prev => prev.map(item =>
      (item as any).id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setItems(prev => prev.filter(item => (item as any).id !== id));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
    setError(null);
    setHasMore(true);
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadItems,
    addItem,
    updateItem,
    removeItem,
    clearItems,
    setError,
  };
};

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return isValidEmail(email);
};

// Validar RUT chileno
export const validateRUT = (rut: string): boolean => {
  const cleanRut = rut.replace(/[.-]/g, '');
  const rutNumber = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  if (!/^\d+$/.test(rutNumber) || rutNumber.length < 7) {
    return false;
  }

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

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password || password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT(VALIDATION_RULES.PASSWORD_MIN_LENGTH));
  }

  if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
    errors.push(ERROR_MESSAGES.PASSWORD_TOO_LONG(VALIDATION_RULES.PASSWORD_MAX_LENGTH));
  }

  // Check for at least one uppercase, one lowercase, and one number
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return ERROR_MESSAGES.REQUIRED_FIELD(fieldName);
  }
  return null;
};

export const validateFileSize = (file: File, maxSize: number = FILE_SIZE_LIMITS.IMAGE_MAX_SIZE): string | null => {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return `Archivo demasiado grande. Tamaño máximo: ${maxSizeMB}MB`;
  }
  return null;
};

export const validateFileType = (file: File, allowedTypes: string[]): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(', ')}`;
  }
  return null;
};

// Helper functions for Property data validation and conversion
export const sanitizePropertyData = (data: any): Partial<Property> => {
  return {
    ...data,
    price_clp: typeof data.price_clp === 'string' ? parseInt(data.price_clp) || 0 : Number(data.price_clp) || 0,
    common_expenses_clp: data.common_expenses_clp === null || data.common_expenses_clp === undefined || data.common_expenses_clp === ''
      ? null
      : (typeof data.common_expenses_clp === 'string' ? parseInt(data.common_expenses_clp) : Number(data.common_expenses_clp)) || null,
    bedrooms: typeof data.bedrooms === 'string' ? parseInt(data.bedrooms) || 0 : Number(data.bedrooms) || 0,
    bathrooms: typeof data.bathrooms === 'string' ? parseInt(data.bathrooms) || 0 : Number(data.bathrooms) || 0,
    surface_m2: data.surface_m2 === null || data.surface_m2 === undefined || data.surface_m2 === ''
      ? null
      : (typeof data.surface_m2 === 'string' ? parseInt(data.surface_m2) : Number(data.surface_m2)) || null,
    description: data.description?.trim() || null,
  };
};

// Función de validación de email consistente y robusta
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();

  // Verificar longitud mínima y máxima
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }

  // Expresión regular robusta para validación de email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  // Verificar que no tenga espacios consecutivos o al inicio/final
  if (trimmedEmail.includes('  ') || trimmedEmail.startsWith(' ') || trimmedEmail.endsWith(' ')) {
    return false;
  }

  // Verificar que tenga exactamente un @ y al menos un punto después
  const atIndex = trimmedEmail.indexOf('@');
  const dotIndex = trimmedEmail.lastIndexOf('.');

  if (atIndex === -1 || dotIndex === -1 || atIndex === 0 || dotIndex < atIndex + 1) {
    return false;
  }

  // Verificar que el dominio tenga al menos 2 caracteres después del último punto
  const domain = trimmedEmail.substring(atIndex + 1);
  if (domain.length < 4) { // mínimo: x.co
    return false;
  }

  return true;
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


// Funciones de autenticación
export const signUp = async (email: string, password: string, userMetadata?: any) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata || {}
    }
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
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// API function to get current user profile
export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('Usuario no autenticado');
    }
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get current profile:', error);
    throw error;
  }
};

// Constantes compartidas para mantener consistencia

// File size limits
export const FILE_SIZE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB for images
  DOCUMENT_MAX_SIZE: 50 * 1024 * 1024, // 50MB for documents
} as const;

// Validation constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 72,
  RUT_MIN_LENGTH: 8,
  RUT_MAX_LENGTH: 9,
  DESCRIPTION_MIN_LENGTH: 20,
  EMAIL_MAX_LENGTH: 254,
} as const;

// UI constants
export const UI_CONSTANTS = {
  MAX_IMAGES_PER_PROPERTY: 10,
  MAX_DOCUMENTS_PER_APPLICATION: 5,
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
} as const;

// API constants
export const API_CONSTANTS = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Error message constants for consistency
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: 'Debes iniciar sesión para continuar',
  AUTH_FAILED: 'Error de autenticación. Por favor, inicia sesión nuevamente',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',

  // Network errors
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta nuevamente',

  // Validation errors
  REQUIRED_FIELD: (field: string) => `${field} es requerido`,
  INVALID_EMAIL: 'Por favor, ingresa un email válido',
  INVALID_RUT: 'RUT no es válido',
  PASSWORD_TOO_SHORT: (min: number) => `La contraseña debe tener al menos ${min} caracteres`,
  PASSWORD_TOO_LONG: (max: number) => `La contraseña no puede tener más de ${max} caracteres`,
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',

  // File upload errors
  FILE_TOO_LARGE: (maxSize: string) => `Archivo demasiado grande. Tamaño máximo: ${maxSize}`,
  INVALID_FILE_TYPE: (allowedTypes: string) => `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes}`,

  // Permission errors
  PERMISSION_DENIED: 'No tienes permisos para realizar esta acción',
  UNAUTHORIZED: 'Acceso no autorizado',

  // Generic errors
  OPERATION_FAILED: 'La operación falló. Por favor, intenta nuevamente',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado',
  LOADING_FAILED: 'Error al cargar los datos',

  // Property specific errors
  PROPERTY_NOT_FOUND: 'Propiedad no encontrada',
  PROPERTY_SAVE_FAILED: 'Error al guardar la propiedad',
  PROPERTY_DELETE_FAILED: 'Error al eliminar la propiedad',

  // Application specific errors
  APPLICATION_SUBMIT_FAILED: 'Error al enviar la postulación',
  APPLICATION_ALREADY_EXISTS: 'Ya has enviado una postulación para esta propiedad',
} as const;

export const CHILE_REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: 'soltero', label: 'Soltero/a' },
  { value: 'casado', label: 'Casado/a' },
  { value: 'divorciado', label: 'Divorciado/a' },
  { value: 'viudo', label: 'Viudo/a' }
] as const;

export const PROPERTY_REGIME_OPTIONS = [
  { value: 'sociedad conyugal', label: 'Sociedad Conyugal' },
  { value: 'separación de bienes', label: 'Separación de Bienes' },
  { value: 'participación en los gananciales', label: 'Participación en los Gananciales' }
] as const;

export const LISTING_TYPE_OPTIONS = [
  { value: 'venta', label: 'Venta' },
  { value: 'arriendo', label: 'Arriendo' }
] as const;

export const PROPERTY_STATUS_OPTIONS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'arrendada', label: 'Arrendada' },
  { value: 'vendida', label: 'Vendida' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'activa', label: 'Activa' }
] as const;

export const APPLICATION_STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'info_solicitada', label: 'Información Solicitada' }
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'Casa', label: 'Casa' },
  { value: 'Departamento', label: 'Departamento' },
  { value: 'Oficina', label: 'Oficina' },
  { value: 'Local Comercial', label: 'Local Comercial' },
  { value: 'Estacionamiento', label: 'Estacionamiento' },
  { value: 'Bodega', label: 'Bodega' },
  { value: 'Parcela', label: 'Parcela' }
] as const;

// Tipos para las constantes
export type ChileRegion = typeof CHILE_REGIONS[number];
export type MaritalStatus = typeof MARITAL_STATUS_OPTIONS[number]['value'];
export type PropertyRegime = typeof PROPERTY_REGIME_OPTIONS[number]['value'];
export type ListingType = typeof LISTING_TYPE_OPTIONS[number]['value'];
export type PropertyStatus = typeof PROPERTY_STATUS_OPTIONS[number]['value'];
export type ApplicationStatus = typeof APPLICATION_STATUS_OPTIONS[number]['value'];
export type PropertyType = typeof PROPERTY_TYPE_OPTIONS[number]['value'];

// Utility function to get property type display name and badge color
export const getPropertyTypeInfo = (propertyType?: string) => {
  // Remove hardcoded default - show actual value or fallback to "No especificado"
  const type = propertyType || 'No especificado';
  const typeMap: Record<string, { label: string; color: string; bgColor: string }> = {
    'Casa': { label: 'Casa', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    'Departamento': { label: 'Departamento', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    'Oficina': { label: 'Oficina', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    'Local Comercial': { label: 'Local Comercial', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    'Estacionamiento': { label: 'Estacionamiento', color: 'text-green-700', bgColor: 'bg-green-100' },
    'Bodega': { label: 'Bodega', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    'Parcela': { label: 'Parcela', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    'No especificado': { label: 'No especificado', color: 'text-gray-500', bgColor: 'bg-gray-100' }
  };
  return typeMap[type] || typeMap['No especificado'];
};

// API function to update application status
export const updateApplicationStatus = async (
  applicationId: string, 
  status: 'aprobada' | 'rechazada' | 'info_solicitada',
  message?: string
) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .update({ 
        status,
        ...(message && { response_message: message })
      })
      .eq('id', applicationId)
      .select(`
        *,
        properties (
          *,
          owner_id,
          profiles!owner_id (
            first_name,
            paternal_last_name,
            email,
            phone
          ),
          property_images (image_url)
        ),
        profiles!applicant_id (
          first_name,
          paternal_last_name,
          email,
          phone
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// API function to approve application with webhook integration
export const approveApplicationWithWebhook = async (
  applicationId: string,
  propertyId: string,
  applicantId: string,
  applicantData: {
    full_name: string;
    contact_email: string;
    contact_phone?: string;
    profession?: string;
    company?: string;
    monthly_income?: number;
  },
  propertyData: {
    address: string;
    city: string;
    price: number;
    listing_type: string;
  }
) => {
  console.log('🚀 === approveApplicationWithWebhook LLAMADA ===');
  console.log('📋 applicationId:', applicationId);
  console.log('🏠 propertyId:', propertyId);
  console.log('👤 applicantId:', applicantId);

  try {
    // VALIDACIÓN CRÍTICA: Verificar que la propiedad tenga property_type_characteristics_id
    console.log('🔍 Validando propiedad antes de aprobar aplicación...');
    const { data: propertyValidation, error: propertyValidationError } = await supabase
      .from('properties')
      .select('id, property_type_characteristics_id, address_street, address_number')
      .eq('id', propertyId)
      .single();

    if (propertyValidationError) {
      console.error('❌ Error consultando propiedad para validación:', propertyValidationError);
      throw new Error('Error al validar la propiedad. Contacte al administrador.');
    }

    if (!propertyValidation) {
      throw new Error('Propiedad no encontrada.');
    }

    if (!propertyValidation.property_type_characteristics_id) {
      const addressInfo = `${propertyValidation.address_street || 'Sin calle'} ${propertyValidation.address_number || 'S/N'}`;
      throw new Error(`La propiedad "${addressInfo}" no tiene configurado el tipo de propiedad. ` +
                     'Edite la propiedad desde el panel de administración y seleccione un tipo de propiedad válido antes de aprobar postulaciones.');
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(propertyValidation.property_type_characteristics_id)) {
      throw new Error('El tipo de propiedad de la propiedad tiene un formato inválido. Contacte al administrador.');
    }

    console.log('✅ Validación de propiedad exitosa:', {
      property_id: propertyValidation.id,
      property_type_characteristics_id: propertyValidation.property_type_characteristics_id
    });

    // Get current user (who is approving)
    console.log('🔐 Obteniendo sesión del usuario...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 Resultado de getSession:', { session: !!session, sessionError });

    if (sessionError || !session?.user) {
      console.error('❌ Error de autenticación:', sessionError);
      throw new Error('User not authenticated - no active session');
    }
    const user = session.user;
    console.log('✅ Usuario autenticado:', user.id);

    // Get existing application to retrieve created_by (applicant_id)
    console.log('📊 Consultando aplicación existente...');
    const { data: existingApplication, error: fetchError } = await supabase
      .from('applications')
      .select('applicant_id')
      .eq('id', applicationId)
      .single();

    console.log('🔍 Resultado consulta aplicación:', { existingApplication, fetchError });

    if (fetchError) {
      console.error('❌ Error consultando aplicación:', fetchError);
      throw fetchError;
    }

    console.log('✅ Aplicación encontrada - created_by (applicant_id):', existingApplication.applicant_id);

    // 1. Update application status in database with approval tracking
    console.log('💾 Actualizando base de datos...');
    console.log('📝 Datos a actualizar:', {
      status: 'aprobada',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    });

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'aprobada',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select('*')
      .single();

    console.log('🔍 Resultado actualización BD:', { updatedApplication: !!updatedApplication, updateError });

    if (updateError) {
      console.error('❌ Error actualizando BD:', updateError);
      throw updateError;
    }

    console.log('✅ Base de datos actualizada exitosamente');
    console.log('📋 Aplicación actualizada:', {
      id: updatedApplication.id,
      status: updatedApplication.status,
      approved_by: updatedApplication.approved_by,
      approved_at: updatedApplication.approved_at
    });

    // 2. Send webhook to Supabase Edge Function with additional tracking info
    const webhookPayload = {
      application_id: applicationId,
      created_by: existingApplication.applicant_id,
      approved_by: user.id,
      property_id: propertyId,
      applicant_id: applicantId,
      applicant_data: applicantData,
      property_data: propertyData,
      timestamp: new Date().toISOString(),
      action: 'application_approved'
    };

    console.log('🌐 === WEBHOOK PAYLOAD ===');
    console.log('📋 application_id:', webhookPayload.application_id);
    console.log('👤 created_by:', webhookPayload.created_by);
    console.log('✅ approved_by:', webhookPayload.approved_by);
    console.log('🏠 property_id:', webhookPayload.property_id);
    console.log('👨‍💼 applicant_id:', webhookPayload.applicant_id);
    console.log('⏰ timestamp:', webhookPayload.timestamp);
    console.log('🎯 action:', webhookPayload.action);
    console.log('🌐 Enviando webhook completo a Edge Function...');

    try {
      // Por ahora, intentar con el token de Supabase (temporal)
      // TODO: Configurar WEBHOOK_SECRET en las variables de entorno de Supabase
      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke(
        'approve-application',
        {
          body: webhookPayload,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );

      if (webhookError) {
        console.warn('⚠️ Error en webhook (puede que la función no esté desplegada):', webhookError.message);
        console.warn('💡 SOLUCIÓN TEMPORAL: La aprobación funciona correctamente sin webhook por ahora');
        console.warn('💡 PARA SOLUCIÓN DEFINITIVA: Despliega la función Edge Function desde el dashboard de Supabase');
        console.warn('📋 Instrucciones: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/functions');
      } else {
        console.log('✅ Webhook enviado exitosamente:', webhookResponse);
      }
    } catch (webhookError) {
      console.warn('⚠️ Error al enviar webhook:', webhookError.message);
      console.warn('💡 SOLUCIÓN TEMPORAL: La aprobación funciona correctamente sin webhook por ahora');
      console.warn('💡 PARA SOLUCIÓN DEFINITIVA: Despliega la función Edge Function desde el dashboard de Supabase');
      console.warn('📋 Instrucciones: https://supabase.com/dashboard/project/phnkervuiijqmapgswkc/functions');
      console.warn('💡 Datos que se intentarían enviar:', {
        application_id: applicationId,
        created_by: existingApplication.applicant_id,
        approved_by: user.id
      });
    }

    return updatedApplication;
  } catch (error) {
    console.error('Error approving application with webhook:', error);
    throw error;
  }
};

// =====================================================
// GENERAL FILE UPLOAD FUNCTION
// =====================================================

export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
  options?: {
    user?: { name?: string; last_name?: string; first_name?: string; paternal_last_name?: string };
    property?: { 
      street?: string; 
      number?: string; 
      address?: string; 
      address_street?: string;
      address_number?: string;
      id?: string;
    };
    fieldLabel?: string;
    upsert?: boolean;
    contentType?: string;
  }
) {
  let fileName = file.name; // nombre por defecto
  
  // Si se proporcionan todos los datos, renombrar
  if (options?.user && options?.property && options?.fieldLabel) {
    fileName = createDocumentFileName(
      options.user,
      options.property,
      options.fieldLabel,
      file.name
    );
  }
  
  // Clean path to avoid double slashes
  const cleanPath = path.endsWith('/') ? path : `${path}/`;
  const fullPath = `${cleanPath}${fileName}`;

  console.log(`📤 Subiendo archivo: ${fullPath} a bucket: ${bucket}`);
  
  // Subir a Supabase Storage
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(fullPath, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType || file.type
    });
  
  if (error) {
    console.error('❌ Error subiendo archivo:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fullPath);

  return { ...data, fileName, publicUrl };
}

// =====================================================
// SALE OFFERS MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Create a new sale offer for a property
 */
export const createSaleOffer = async (offerData: {
  property_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  offer_amount: number;
  offer_amount_currency?: string;
  financing_type?: string;
  message?: string;
  requests_title_study?: boolean;
  requests_property_inspection?: boolean;
}): Promise<PropertySaleOffer> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('property_sale_offers')
      .insert({
        ...offerData,
        buyer_id: user.id,
        offer_amount_currency: offerData.offer_amount_currency || 'CLP',
        requests_title_study: offerData.requests_title_study || false,
        requests_property_inspection: offerData.requests_property_inspection || false,
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Oferta creada exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error creating sale offer:', error);
    throw error;
  }
};

/**
 * Get all offers for a specific property
 */
export const getPropertySaleOffers = async (propertyId: string): Promise<PropertySaleOffer[]> => {
  try {
    const { data, error } = await supabase
      .from('property_sale_offers')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching property sale offers:', error);
    throw error;
  }
};

/**
 * Get offers made by the current user
 */
export const getUserSaleOffers = async (): Promise<PropertySaleOffer[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('property_sale_offers')
      .select(`
        *,
        properties:property_id (
          id,
          address_street,
          address_number,
          address_commune,
          price_clp,
          listing_type,
          property_images (
            image_url
          )
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user sale offers:', error);
    throw error;
  }
};

/**
 * Get offers received for user's properties
 */
export const getReceivedSaleOffers = async (): Promise<PropertySaleOffer[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('property_sale_offers')
      .select(`
        *,
        properties:property_id!inner (
          id,
          address_street,
          address_number,
          address_commune,
          price_clp,
          owner_id,
          property_images (
            image_url
          )
        )
      `)
      .eq('properties.owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching received sale offers:', error);
    throw error;
  }
};

/**
 * Update sale offer status
 */
export const updateSaleOfferStatus = async (
  offerId: string,
  status: SaleOfferStatus,
  additionalData?: {
    seller_response?: string;
    seller_notes?: string;
    counter_offer_amount?: number;
    counter_offer_terms?: string;
  }
): Promise<PropertySaleOffer> => {
  try {
    const updateData: any = {
      status,
      ...additionalData,
    };

    const { data, error } = await supabase
      .from('property_sale_offers')
      .update(updateData)
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Estado de oferta actualizado:', data);
    return data;
  } catch (error) {
    console.error('Error updating sale offer status:', error);
    throw error;
  }
};

/**
 * Upload document to a sale offer
 */
export const uploadSaleOfferDocument = async (
  offerId: string,
  file: File,
  docType: string,
  notes?: string
): Promise<PropertySaleOfferDocument> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `sale_offers/${offerId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save document metadata
    const { data, error } = await supabase
      .from('property_sale_offer_documents')
      .insert({
        offer_id: offerId,
        doc_type: docType,
        file_name: file.name,
        file_url: publicUrl,
        storage_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        notes: notes,
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Documento subido exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error uploading sale offer document:', error);
    throw error;
  }
};

/**
 * Get documents for a sale offer
 */
export const getSaleOfferDocuments = async (offerId: string): Promise<PropertySaleOfferDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('property_sale_offer_documents')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sale offer documents:', error);
    throw error;
  }
};

/**
 * Get offer history
 */
export const getSaleOfferHistory = async (offerId: string): Promise<PropertySaleOfferHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('property_sale_offer_history')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching sale offer history:', error);
    throw error;
  }
};

/**
 * Get sale properties owned by current user
 */
export const getUserSaleProperties = async (): Promise<Property[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          image_url,
          storage_path
        )
      `)
      .eq('owner_id', user.id)
      .eq('listing_type', 'venta')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user sale properties:', error);
    throw error;
  }
};