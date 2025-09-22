# 💻 **Guía de Desarrollo**

> **Ejemplos prácticos, mejores prácticas y patrones de desarrollo**

---

## 📋 **Índice**
- [🏗️ Crear Componentes](#️-crear-componentes)
- [🔐 Implementar Autenticación](#-implementar-autenticación)
- [🏠 Gestionar Propiedades](#-gestionar-propiedades)
- [📝 Formularios Avanzados](#-formularios-avanzados)
- [🗃️ Manejo de Archivos](#️-manejo-de-archivos)
- [📊 Consultas de Base de Datos](#-consultas-de-base-de-datos)
- [🎨 Componentes UI](#-componentes-ui)
- [🧪 Testing](#-testing)
- [⚡ Optimización](#-optimización)

---

## 🏗️ **Crear Componentes**

### **Estructura Básica de Componente**

#### **Componente Funcional con TypeScript**
```typescript
// src/components/common/CustomButton.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CustomButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {Icon && !loading && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};
```

#### **Uso del Componente**
```typescript
import { CustomButton } from '../common/CustomButton';
import { Save, Trash2 } from 'lucide-react';

function PropertyActions() {
  return (
    <div className="flex space-x-2">
      <CustomButton
        variant="primary"
        icon={Save}
        onClick={() => console.log('Guardar')}
        loading={isSubmitting}
      >
        Guardar Cambios
      </CustomButton>

      <CustomButton
        variant="danger"
        size="sm"
        icon={Trash2}
        onClick={() => handleDelete()}
      >
        Eliminar
      </CustomButton>
    </div>
  );
}
```

### **Custom Hook Avanzado**

#### **useLocalStorage Hook**
```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

#### **useDebounce Hook**
```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 🔐 **Implementar Autenticación**

### **Hook de Autenticación Completo**

#### **useAuth Hook Robusto**
```typescript
// src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userMetadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicialización del estado de auth
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Manejo de eventos específicos
        if (event === 'SIGNED_OUT') {
          // Limpieza adicional si es necesario
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userMetadata?: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata || {}
        }
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### **ProtectedRoute Avanzado**

#### **Componente con Redirección Inteligente**
```typescript
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth',
  requiredRole
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Guardar la URL que el usuario intentaba acceder
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar roles si es necesario
  if (requiredRole) {
    const userRole = user.user_metadata?.role;
    if (!requiredRole.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
```

### **Formulario de Autenticación Completo**

#### **AuthForm con Estados Avanzados**
```typescript
// src/components/auth/AuthForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { CustomButton } from '../common/CustomButton';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { validateRUT, formatRUT } from '../../lib/validators';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode = 'signin',
  onSuccess
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    paternalLastName: '',
    rut: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (currentMode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }

      if (!formData.firstName) {
        newErrors.firstName = 'El nombre es requerido';
      }

      if (!formData.paternalLastName) {
        newErrors.paternalLastName = 'El apellido paterno es requerido';
      }

      if (!formData.rut) {
        newErrors.rut = 'El RUT es requerido';
      } else if (!validateRUT(formData.rut)) {
        newErrors.rut = 'RUT inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = currentMode === 'signin'
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password, {
            first_name: formData.firstName,
            paternal_last_name: formData.paternalLastName,
            rut: formData.rut
          });

      if (error) {
        setErrors({ general: error.message });
      } else {
        // Redirección inteligente
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
        onSuccess?.();
      }
    } catch (error) {
      setErrors({ general: 'Ocurrió un error inesperado' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // Formateo automático para RUT
    if (field === 'rut') {
      value = formatRUT(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        {currentMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        {/* Campos de registro */}
        {currentMode === 'signup' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Juan"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno
                </label>
                <input
                  type="text"
                  value={formData.paternalLastName}
                  onChange={handleInputChange('paternalLastName')}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.paternalLastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Pérez"
                />
                {errors.paternalLastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.paternalLastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={handleInputChange('rut')}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.rut ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12.345.678-9"
                maxLength={12}
              />
              {errors.rut && (
                <p className="mt-1 text-sm text-red-600">{errors.rut}</p>
              )}
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              className={`w-full pl-10 pr-10 py-2 border rounded-md ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirmar contraseña */}
        {currentMode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        <CustomButton
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          {currentMode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </CustomButton>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setCurrentMode(currentMode === 'signin' ? 'signup' : 'signin')}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {currentMode === 'signin'
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'
          }
        </button>
      </div>
    </div>
  );
};
```

---

## 🏠 **Gestionar Propiedades**

### **Hook useProperties Avanzado**

#### **Gestión Completa de Estados**
```typescript
// src/hooks/useProperties.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Property } from '../lib/supabase';
import { useDebounce } from './useDebounce';

interface PropertyFilters {
  listing_type?: 'venta' | 'arriendo';
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  commune?: string;
  region?: string;
  search?: string;
}

interface UsePropertiesReturn {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: PropertyFilters;
  setFilters: (filters: PropertyFilters) => void;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  createProperty: (property: Omit<Property, 'id' | 'created_at'>) => Promise<Property>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
}

export const useProperties = (initialFilters: PropertyFilters = {}): UsePropertiesReturn => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [page, setPage] = useState(0);
  
  const debouncedFilters = useDebounce(filters, 500);
  const pageSize = 12;

  const buildQuery = useCallback((pageNum: number = 0) => {
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!owner_id (
          first_name,
          paternal_last_name,
          phone
        ),
        property_images (
          image_url,
          storage_path
        )
      `)
      .eq('status', 'disponible')
      .order('created_at', { ascending: false })
      .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

    // Aplicar filtros
    if (debouncedFilters.listing_type) {
      query = query.eq('listing_type', debouncedFilters.listing_type);
    }
    if (debouncedFilters.min_price) {
      query = query.gte('price_clp', debouncedFilters.min_price);
    }
    if (debouncedFilters.max_price) {
      query = query.lte('price_clp', debouncedFilters.max_price);
    }
    if (debouncedFilters.bedrooms) {
      query = query.gte('bedrooms', debouncedFilters.bedrooms);
    }
    if (debouncedFilters.bathrooms) {
      query = query.gte('bathrooms', debouncedFilters.bathrooms);
    }
    if (debouncedFilters.commune) {
      query = query.ilike('address_commune', `%${debouncedFilters.commune}%`);
    }
    if (debouncedFilters.region) {
      query = query.ilike('address_region', `%${debouncedFilters.region}%`);
    }
    if (debouncedFilters.search) {
      query = query.or(`description.ilike.%${debouncedFilters.search}%,address_street.ilike.%${debouncedFilters.search}%`);
    }

    return query;
  }, [debouncedFilters]);

  const fetchProperties = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      const query = buildQuery(pageNum);
      const { data, error } = await query;

      if (error) throw error;

      const newProperties = data || [];
      
      if (append) {
        setProperties(prev => [...prev, ...newProperties]);
      } else {
        setProperties(newProperties);
      }

      setHasMore(newProperties.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchProperties(nextPage, true);
  }, [page, hasMore, loading, fetchProperties]);

  const refetch = useCallback(async () => {
    setPage(0);
    await fetchProperties(0, false);
  }, [fetchProperties]);

  const createProperty = useCallback(async (propertyData: Omit<Property, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;

      setProperties(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear propiedad');
      throw err;
    }
  }, []);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProperties(prev =>
        prev.map(prop => prop.id === id ? data : prop)
      );
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar propiedad');
      throw err;
    }
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProperties(prev => prev.filter(prop => prop.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar propiedad');
      throw err;
    }
  }, []);

  // Efecto para recargar cuando cambien los filtros
  useEffect(() => {
    setPage(0);
    fetchProperties(0, false);
  }, [debouncedFilters]);

  return {
    properties,
    loading,
    error,
    hasMore,
    filters,
    setFilters,
    loadMore,
    refetch,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};
```

### **Componente PropertyCard Optimizado**

#### **Tarjeta con Lazy Loading**
```typescript
// src/components/properties/PropertyCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Eye } from 'lucide-react';
import { Property, formatPriceCLP } from '../../lib/supabase';

interface PropertyCardProps {
  property: Property & {
    profiles?: {
      first_name: string;
      paternal_last_name: string;
      phone: string;
    };
    property_images?: Array<{
      image_url: string;
      storage_path: string;
    }>;
  };
  onFavoriteToggle?: (propertyId: string) => void;
  isFavorite?: boolean;
  loading?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavoriteToggle,
  isFavorite = false,
  loading = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const mainImage = property.property_images?.[0]?.image_url;
  const hasImages = property.property_images && property.property_images.length > 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Imagen principal */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {mainImage && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-sm">Cargando...</div>
              </div>
            )}
            <img
              src={mainImage}
              alt={`Propiedad en ${property.address_commune}`}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              } group-hover:scale-105`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
              <Eye className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm">Sin imagen</div>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            property.listing_type === 'venta'
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {property.listing_type === 'venta' ? 'Venta' : 'Arriendo'}
          </span>
          
          {property.is_featured && (
            <span className="bg-yellow-500 text-white px-2 py-1 text-xs font-medium rounded">
              Destacada
            </span>
          )}
        </div>

        {/* Indicador de imágenes múltiples */}
        {hasImages && property.property_images.length > 1 && (
          <div className="absolute top-3 right-12 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded">
            +{property.property_images.length - 1} fotos
          </div>
        )}

        {/* Botón favorito */}
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle(property.id);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Precio */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {formatPriceCLP(property.price_clp)}
          </h3>
          {property.common_expenses_clp && (
            <span className="text-sm text-gray-500 text-right">
              + {formatPriceCLP(property.common_expenses_clp)}
              <br />
              <span className="text-xs">gastos comunes</span>
            </span>
          )}
        </div>

        {/* Ubicación */}
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">
            {property.address_commune}, {property.address_region}
          </span>
        </div>

        {/* Características */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {property.bedrooms > 0 && (
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span>{property.surface_m2} m²</span>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {property.description}
        </p>

        {/* Propietario */}
        {property.profiles && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {property.profiles.first_name[0]}
                  {property.profiles.paternal_last_name[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {property.profiles.first_name} {property.profiles.paternal_last_name}
                </p>
                {property.profiles.phone && (
                  <p className="text-sm text-gray-500">
                    {property.profiles.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón de acción */}
        <Link
          to={`/property/${property.id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Ver Detalles
        </Link>
      </div>
    </div>
  );
};
```

---

## 📝 **Formularios Avanzados**

### **Hook useForm Personalizado**

#### **Gestión de Estados de Formulario**
```typescript
// src/hooks/useForm.ts
import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T) => void;
  setErrors: (errors: Record<string, string>) => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error si existe
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleChange = useCallback((field: keyof T) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFieldValue(field, e.target.value);
  }, [setFieldValue]);

  const handleBlur = useCallback((field: keyof T) => () => {
    setFieldTouched(field);
    
    if (validate) {
      const fieldErrors = validate(values);
      if (fieldErrors[field as string]) {
        setErrors(prev => ({ ...prev, [field]: fieldErrors[field as string] }));
      }
    }
  }, [values, validate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos los campos como touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);

    // Validar
    let formErrors: Record<string, string> = {};
    if (validate) {
      formErrors = validate(values);
      setErrors(formErrors);
    }

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setFieldValue,
    setFieldTouched,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
}
```

### **Componente de Campo Reutilizable**

#### **FormField Avanzado**
```typescript
// src/components/common/FormField.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  placeholder,
  icon: Icon,
  options,
  disabled,
  className = '',
  rows = 3
}) => {
  const hasError = error && touched;
  
  const inputClasses = `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors
    ${Icon ? 'pl-10' : ''}
    ${hasError 
      ? 'border-red-300 focus:ring-red-500' 
      : 'border-gray-300 focus:ring-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={inputClasses}
          />
        );
        
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">Seleccionar...</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        )}
        
        {renderInput()}
      </div>
      
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

## 🗃️ **Manejo de Archivos**

### **Hook useFileUpload Avanzado**

#### **Upload con Progreso y Validación**
```typescript
// src/hooks/useFileUpload.ts
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
  path?: string;
}

interface UseFileUploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export const useFileUpload = (options: UseFileUploadOptions) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    if (options.maxSize && file.size > options.maxSize) {
      return `El archivo excede el tamaño máximo de ${Math.round(options.maxSize / 1024 / 1024)}MB`;
    }

    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Permitidos: ${options.allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = useCallback(async (file: File): Promise<UploadProgress> => {
    const validationError = validateFile(file);
    if (validationError) {
      return {
        file,
        progress: 0,
        status: 'error',
        error: validationError
      };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${options.folder || 'uploads'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const uploadProgress: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading'
    };

    try {
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return {
        file,
        progress: 100,
        status: 'completed',
        url: publicUrl,
        path: data.path
      };

    } catch (error) {
      return {
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Error de upload'
      };
    }
  }, [options]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadProgress[]> => {
    if (options.maxFiles && files.length > options.maxFiles) {
      throw new Error(`Máximo ${options.maxFiles} archivos permitidos`);
    }

    // Inicializar progreso
    const initialProgress = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setUploads(initialProgress);

    // Subir archivos en paralelo
    const uploadPromises = files.map((file, index) => {
      return uploadFile(file).then(result => {
        // Actualizar progreso individual
        setUploads(prev => prev.map((upload, i) => 
          i === index ? result : upload
        ));
        return result;
      });
    });

    const results = await Promise.all(uploadPromises);

    // Calcular progreso total
    const completedUploads = results.filter(r => r.status === 'completed').length;
    setTotalProgress((completedUploads / files.length) * 100);

    return results;
  }, [uploadFile, options.maxFiles]);

  const removeUpload = useCallback((index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
    setTotalProgress(0);
  }, []);

  const isUploading = uploads.some(upload => upload.status === 'uploading');
  const hasErrors = uploads.some(upload => upload.status === 'error');
  const completedUploads = uploads.filter(upload => upload.status === 'completed');

  return {
    uploads,
    totalProgress,
    isUploading,
    hasErrors,
    completedUploads,
    uploadFiles,
    removeUpload,
    clearUploads,
  };
};
```

### **Componente FileDropzone**

#### **Zona de Arrastrar y Soltar**
```typescript
// src/components/common/FileDropzone.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';

interface FileDropzoneProps {
  onFilesUploaded: (files: Array<{ url: string; path: string; file: File }>) => void;
  bucket: string;
  folder?: string;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesUploaded,
  bucket,
  folder,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/*', 'application/pdf'],
  className = ''
}) => {
  const [dragError, setDragError] = useState<string | null>(null);

  const { uploads, isUploading, uploadFiles, removeUpload, clearUploads } = useFileUpload({
    bucket,
    folder,
    maxFiles,
    maxSize,
    allowedTypes
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setDragError(null);
    
    try {
      const results = await uploadFiles(acceptedFiles);
      const completedFiles = results
        .filter(result => result.status === 'completed')
        .map(result => ({
          url: result.url!,
          path: result.path!,
          file: result.file
        }));
      
      if (completedFiles.length > 0) {
        onFilesUploaded(completedFiles);
      }
    } catch (error) {
      setDragError(error instanceof Error ? error.message : 'Error al subir archivos');
    }
  }, [uploadFiles, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: maxFiles > 1,
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />;
    }
    return <FileText className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject 
            ? 'border-blue-500 bg-blue-50' 
            : isDragReject 
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          isDragActive ? 'text-blue-500' : 'text-gray-400'
        }`} />
        
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
        </p>
        
        <p className="text-sm text-gray-500">
          o haz clic para seleccionar archivos
        </p>
        
        <p className="text-xs text-gray-400 mt-2">
          Máximo {maxFiles} archivos, {Math.round(maxSize / 1024 / 1024)}MB cada uno
        </p>
      </div>

      {/* Errores */}
      {(dragError || isDragReject) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {dragError || 'Tipo de archivo no permitido'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de archivos subiendo/subidos */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-500">
                  {getFileIcon(upload.file)}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.file.size)}
                  </p>
                  
                  {/* Barra de progreso */}
                  {upload.status === 'uploading' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Estado */}
                  <div className="mt-1">
                    {upload.status === 'completed' && (
                      <span className="text-xs text-green-600">✓ Completado</span>
                    )}
                    {upload.status === 'error' && (
                      <span className="text-xs text-red-600">✗ {upload.error}</span>
                    )}
                    {upload.status === 'uploading' && (
                      <span className="text-xs text-blue-600">Subiendo...</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => removeUpload(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {uploads.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={clearUploads}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Limpiar lista
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

**📖 Para más ejemplos de código, consulta las secciones específicas de cada README temático.**
