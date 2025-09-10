import { createClient } from '@supabase/supabase-js';

// 1. Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    }

    throw new Error(errorMessage);
  }
};

validateEnvironmentVariables();

// 3. Crear y exportar el cliente de Supabase
// Esta es la única exportación del archivo.
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
  status: 'disponible' | 'arrendada' | 'vendida' | 'pausada' | 'activa';
  // Note: 'disponible' is the default status for new properties
  listing_type: 'venta' | 'arriendo';
  address_street: string;
  address_number: string;
  address_department: string | null;
  address_commune: string;
  address_region: string;
  price_clp: number; // Database: bigint (large integer for Chilean pesos)
  common_expenses_clp: number | null; // Database: integer, nullable
  bedrooms: number; // Database: integer NOT NULL DEFAULT 0
  bathrooms: number; // Database: integer NOT NULL DEFAULT 0
  surface_m2: number | null; // Database: integer, nullable
  description: string | null; // Database: text, nullable
  created_at: string; // Database: timestamptz
  // Campos opcionales agregados en migraciones recientes
  updated_at?: string; // Database: timestamptz, nullable
  is_visible?: boolean; // Database: boolean DEFAULT true
  is_featured?: boolean; // Database: boolean DEFAULT false
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
import { useState, useCallback, useEffect } from 'react';

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

export const validateRUT = (rut: string): boolean => {
  const cleanRut = rut.replace(/[.-]/g, '');
  const rutNumber = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  if (!/^\d+$/.test(rutNumber) || rutNumber.length < VALIDATION_RULES.RUT_MIN_LENGTH) {
    return false;
  }

  if (cleanRut.length > VALIDATION_RULES.RUT_MAX_LENGTH) {
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

// Tipos para las constantes
export type ChileRegion = typeof CHILE_REGIONS[number];
export type MaritalStatus = typeof MARITAL_STATUS_OPTIONS[number]['value'];
export type PropertyRegime = typeof PROPERTY_REGIME_OPTIONS[number]['value'];
export type ListingType = typeof LISTING_TYPE_OPTIONS[number]['value'];
export type PropertyStatus = typeof PROPERTY_STATUS_OPTIONS[number]['value'];
export type ApplicationStatus = typeof APPLICATION_STATUS_OPTIONS[number]['value'];