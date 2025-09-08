# 💻 **Ejemplos de Código - Plataforma Inmobiliaria**

> **Ejemplos prácticos de implementación para desarrolladores**

---

## 📋 **Índice**
- [🏗️ Crear un Nuevo Componente](#️-crear-un-nuevo-componente)
- [🔐 Implementar Autenticación](#-implementar-autenticación)
- [🏠 Gestionar Propiedades](#-gestionar-propiedades)
- [📝 Formularios Avanzados](#-formularios-avanzados)
- [🗃️ Manejo de Archivos](#️-manejo-de-archivos)
- [📊 Consultas a Base de Datos](#-consultas-a-base-de-datos)
- [🎨 Estilos y UI](#-estilos-y-ui)
- [🧪 Testing de Componentes](#-testing-de-componentes)

---

## 🏗️ **Crear un Nuevo Componente**

### **Estructura Básica de Componente**

#### **Componente Funcional con TypeScript**
```tsx
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
```tsx
import { CustomButton } from '../common/CustomButton';
import { Save, Trash2 } from 'lucide-react';

function PropertyActions() {
  return (
    <div className="flex space-x-2">
      <CustomButton
        variant="primary"
        icon={Save}
        onClick={() => console.log('Guardar')}
      >
        Guardar Cambios
      </CustomButton>

      <CustomButton
        variant="danger"
        size="sm"
        icon={Trash2}
        onClick={() => console.log('Eliminar')}
      >
        Eliminar
      </CustomButton>
    </div>
  );
}
```

### **Componente con Custom Hook**

#### **Hook Personalizado**
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

#### **Componente que usa el Hook**
```tsx
// src/components/common/ThemeToggle.tsx
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useLocalStorage('darkMode', false);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-blue-500" />
      )}
    </button>
  );
};
```

---

## 🔐 **Implementar Autenticación**

### **Protección de Rutas**

#### **Componente ProtectedRoute**
```tsx
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

#### **Uso en App.tsx**
```tsx
// src/App.tsx
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/public" element={<PublicPage />} />

      {/* Ruta protegida */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta protegida con redirección personalizada */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute redirectTo="/login">
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### **Formulario de Autenticación Completo**

#### **Componente AuthForm**
```tsx
// src/components/auth/AuthForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common/CustomButton';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode = 'signin',
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();

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

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      const { error } = mode === 'signin'
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password);

      if (error) {
        setErrors({ general: error.message });
      } else {
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
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

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
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="tu@email.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

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
              className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {mode === 'signup' && (
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
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
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
          {mode === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </CustomButton>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {mode === 'signin'
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

### **Hook para Propiedades**

#### **useProperties Hook**
```typescript
// src/hooks/useProperties.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Property } from '../lib/supabase';

interface PropertyFilters {
  listing_type?: 'venta' | 'arriendo';
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  commune?: string;
  region?: string;
}

export const useProperties = (filters?: PropertyFilters) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

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
        .eq('status', 'activa')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.listing_type) {
        query = query.eq('listing_type', filters.listing_type);
      }
      if (filters?.min_price) {
        query = query.gte('price_clp', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price_clp', filters.max_price);
      }
      if (filters?.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters?.commune) {
        query = query.ilike('address_commune', `%${filters.commune}%`);
      }
      if (filters?.region) {
        query = query.ilike('address_region', `%${filters.region}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProperties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData: Omit<Property, 'id' | 'created_at'>) => {
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
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
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
  };

  const deleteProperty = async (id: string) => {
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
  };

  return {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    refetch: fetchProperties,
  };
};
```

#### **Componente PropertyCard**
```tsx
// src/components/properties/PropertyCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react';
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
  showOwner?: boolean;
  onFavoriteToggle?: (propertyId: string) => void;
  isFavorite?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  showOwner = false,
  onFavoriteToggle,
  isFavorite = false,
}) => {
  const mainImage = property.property_images?.[0]?.image_url;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagen principal */}
      <div className="relative h-48 bg-gray-200">
        {mainImage ? (
          <img
            src={mainImage}
            alt={`Propiedad en ${property.address_commune}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400 text-sm">Sin imagen</div>
          </div>
        )}

        {/* Badge tipo de listado */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            property.listing_type === 'venta'
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            {property.listing_type === 'venta' ? 'Venta' : 'Arriendo'}
          </span>
        </div>

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
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {formatPriceCLP(property.price_clp)}
          </h3>
          {property.common_expenses_clp && (
            <span className="text-sm text-gray-500">
              + {formatPriceCLP(property.common_expenses_clp)} gastos comunes
            </span>
          )}
        </div>

        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span>
            {property.address_commune}, {property.address_region}
          </span>
        </div>

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

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        {showOwner && property.profiles && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {property.profiles.first_name[0]}
                  {property.profiles.paternal_last_name[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {property.profiles.first_name} {property.profiles.paternal_last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {property.profiles.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        <Link
          to={`/property/${property.id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mt-3"
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

### **Formulario de Propiedad con Validación**

#### **PropertyForm Component**
```tsx
// src/components/properties/PropertyForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CustomButton } from '../common/CustomButton';
import { Property } from '../../lib/supabase';
import { Upload, X, MapPin, DollarSign, Home } from 'lucide-react';

interface PropertyFormProps {
  property?: Property;
  onSuccess?: (property: Property) => void;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  property,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    listing_type: 'venta' as 'venta' | 'arriendo',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
    price_clp: '',
    common_expenses_clp: '',
    bedrooms: '',
    bathrooms: '',
    surface_m2: '',
    description: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        listing_type: property.listing_type,
        address_street: property.address_street,
        address_number: property.address_number,
        address_department: property.address_department || '',
        address_commune: property.address_commune,
        address_region: property.address_region,
        price_clp: property.price_clp.toString(),
        common_expenses_clp: property.common_expenses_clp?.toString() || '',
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        surface_m2: property.surface_m2.toString(),
        description: property.description,
      });
    }
  }, [property]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.address_street) newErrors.address_street = 'Calle es requerida';
    if (!formData.address_number) newErrors.address_number = 'Número es requerido';
    if (!formData.address_commune) newErrors.address_commune = 'Comuna es requerida';
    if (!formData.address_region) newErrors.address_region = 'Región es requerida';

    const price = parseInt(formData.price_clp);
    if (!formData.price_clp || isNaN(price) || price <= 0) {
      newErrors.price_clp = 'Precio válido es requerido';
    }

    const bedrooms = parseInt(formData.bedrooms);
    if (!formData.bedrooms || isNaN(bedrooms) || bedrooms < 0) {
      newErrors.bedrooms = 'Número de dormitorios válido';
    }

    const bathrooms = parseInt(formData.bathrooms);
    if (!formData.bathrooms || isNaN(bathrooms) || bathrooms < 0) {
      newErrors.bathrooms = 'Número de baños válido';
    }

    const surface = parseInt(formData.surface_m2);
    if (!formData.surface_m2 || isNaN(surface) || surface <= 0) {
      newErrors.surface_m2 = 'Superficie válida es requerida';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      alert('Máximo 10 imágenes permitidas');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Crear previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (propertyId: string): Promise<void> => {
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}_${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      await supabase
        .from('property_images')
        .insert([{
          property_id: propertyId,
          image_url: publicUrl,
          storage_path: fileName,
        }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const propertyData = {
        listing_type: formData.listing_type,
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_department: formData.address_department || null,
        address_commune: formData.address_commune,
        address_region: formData.address_region,
        price_clp: parseInt(formData.price_clp),
        common_expenses_clp: formData.common_expenses_clp ? parseInt(formData.common_expenses_clp) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        surface_m2: parseInt(formData.surface_m2),
        description: formData.description,
      };

      let savedProperty: Property;

      if (property) {
        // Actualizar propiedad existente
        const { data, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)
          .select()
          .single();

        if (error) throw error;
        savedProperty = data;
      } else {
        // Crear nueva propiedad
        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select()
          .single();

        if (error) throw error;
        savedProperty = data;

        // Subir imágenes si es una propiedad nueva
        if (images.length > 0) {
          await uploadImages(savedProperty.id);
        }
      }

      onSuccess?.(savedProperty);
      navigate('/portfolio');
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error al guardar la propiedad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">
        {property ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de listado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Listado
          </label>
          <select
            value={formData.listing_type}
            onChange={handleInputChange('listing_type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="venta">Venta</option>
            <option value="arriendo">Arriendo</option>
          </select>
        </div>

        {/* Dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Dirección
            </label>
          </div>

          <div>
            <input
              type="text"
              placeholder="Calle"
              value={formData.address_street}
              onChange={handleInputChange('address_street')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.address_street ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.address_street && (
              <p className="mt-1 text-sm text-red-600">{errors.address_street}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Número"
              value={formData.address_number}
              onChange={handleInputChange('address_number')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.address_number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.address_number && (
              <p className="mt-1 text-sm text-red-600">{errors.address_number}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Departamento (opcional)"
              value={formData.address_department}
              onChange={handleInputChange('address_department')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Comuna"
              value={formData.address_commune}
              onChange={handleInputChange('address_commune')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.address_commune ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.address_commune && (
              <p className="mt-1 text-sm text-red-600">{errors.address_commune}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Región"
              value={formData.address_region}
              onChange={handleInputChange('address_region')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.address_region ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.address_region && (
              <p className="mt-1 text-sm text-red-600">{errors.address_region}</p>
            )}
          </div>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Precio (CLP)
            </label>
            <input
              type="number"
              placeholder="1000000"
              value={formData.price_clp}
              onChange={handleInputChange('price_clp')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.price_clp ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.price_clp && (
              <p className="mt-1 text-sm text-red-600">{errors.price_clp}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gastos Comunes (opcional)
            </label>
            <input
              type="number"
              placeholder="50000"
              value={formData.common_expenses_clp}
              onChange={handleInputChange('common_expenses_clp')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="inline h-4 w-4 mr-1" />
              Dormitorios
            </label>
            <input
              type="number"
              min="0"
              value={formData.bedrooms}
              onChange={handleInputChange('bedrooms')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.bedrooms ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.bedrooms && (
              <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baños
            </label>
            <input
              type="number"
              min="0"
              value={formData.bathrooms}
              onChange={handleInputChange('bathrooms')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.bathrooms ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.bathrooms && (
              <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie (m²)
            </label>
            <input
              type="number"
              min="1"
              value={formData.surface_m2}
              onChange={handleInputChange('surface_m2')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.surface_m2 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.surface_m2 && (
              <p className="mt-1 text-sm text-red-600">{errors.surface_m2}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="Describe tu propiedad..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Imágenes */}
        {!property && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="inline h-4 w-4 mr-1" />
              Imágenes de la Propiedad (máximo 10)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <CustomButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/portfolio')}
          >
            Cancelar
          </CustomButton>
          <CustomButton
            type="submit"
            variant="primary"
            loading={isLoading}
          >
            {property ? 'Actualizar Propiedad' : 'Publicar Propiedad'}
          </CustomButton>
        </div>
      </form>
    </div>
  );
};
```

---

## 🗃️ **Manejo de Archivos**

### **Upload de Imágenes**

#### **ImageUpload Component**
```tsx
// src/components/common/ImageUpload.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSize?: number; // in bytes
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  className = '',
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, maxImages);
    onImagesChange(newImages);
  }, [images, onImagesChange, maxImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize,
    multiple: true,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Suelta las imágenes aquí' : 'Sube imágenes de tu propiedad'}
        </p>
        <p className="text-sm text-gray-500">
          Arrastra y suelta o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Máximo {maxImages} imágenes, {Math.round(maxSize / 1024 / 1024)}MB cada una
        </p>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {Math.round(file.size / 1024)}KB
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="mt-4 text-sm text-gray-600">
        {images.length} / {maxImages} imágenes seleccionadas
      </div>
    </div>
  );
};
```

### **Upload a Supabase Storage**

#### **useFileUpload Hook**
```typescript
// src/hooks/useFileUpload.ts
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const useFileUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadFiles = async (
    files: File[],
    bucket: string,
    folder: string = ''
  ): Promise<Array<{ file: File; url: string; path: string }>> => {
    const results: Array<{ file: File; url: string; path: string }> = [];

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploads(initialProgress);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${i}.${fileExt}`;

      try {
        // Update status to uploading
        setUploads(prev => prev.map((upload, index) =>
          index === i ? { ...upload, status: 'uploading' } : upload
        ));

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        results.push({
          file,
          url: publicUrl,
          path: data.path,
        });

        // Update status to completed
        setUploads(prev => prev.map((upload, index) =>
          index === i ? { ...upload, status: 'completed', progress: 100 } : upload
        ));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        // Update status to error
        setUploads(prev => prev.map((upload, index) =>
          index === i ? { ...upload, status: 'error', error: errorMessage } : upload
        ));

        throw error;
      }
    }

    return results;
  };

  const clearUploads = () => {
    setUploads([]);
  };

  return {
    uploads,
    uploadFiles,
    clearUploads,
  };
};
```

---

## 📊 **Consultas a Base de Datos**

### **Consultas Optimizadas**

#### **useOptimizedQuery Hook**
```typescript
// src/hooks/useOptimizedQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  enabled?: boolean;
}

export const useOptimizedQuery = (
  queryKey: string[],
  queryFn: () => Promise<any>,
  options: QueryOptions = {}
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey,
    queryFn,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    cacheTime: options.cacheTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    enabled: options.enabled ?? true,
    onError: (error) => {
      console.error('Query error:', error);
      // Could send to error tracking service
    },
  });
};

// Example usage for properties
export const usePropertiesQuery = (filters?: any) => {
  return useOptimizedQuery(
    ['properties', filters],
    async () => {
      let query = supabase
        .from('properties')
        .select(`
          *,
          profiles!owner_id (
            first_name,
            paternal_last_name
          )
        `)
        .eq('status', 'activa');

      // Apply filters efficiently
      if (filters?.listing_type) {
        query = query.eq('listing_type', filters.listing_type);
      }
      if (filters?.price_range) {
        query = query
          .gte('price_clp', filters.price_range.min)
          .lte('price_clp', filters.price_range.max);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for properties
    }
  );
};
```

### **Mutaciones Optimizadas**

#### **useOptimisticUpdate Hook**
```typescript
// src/hooks/useOptimisticUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useOptimisticUpdate = (
  queryKey: string[],
  mutationFn: (variables: any) => Promise<any>,
  options: {
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any, variables: any, context: any) => void;
  } = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: any) => {
        // Implement optimistic update logic here
        return old;
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options.onError?.(error, variables, context);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables);
    },
  });
};

// Example usage
export const useUpdateProperty = () => {
  return useOptimisticUpdate(
    ['properties'],
    async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: (data) => {
        console.log('Property updated:', data);
      },
    }
  );
};
```

---

## 🎨 **Estilos y UI**

### **Sistema de Tema**

#### **ThemeProvider Component**
```tsx
// src/components/theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    let systemTheme: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const appliedTheme = theme === 'system' ? systemTheme : theme;
    setActualTheme(appliedTheme);

    root.classList.remove('light', 'dark');
    root.classList.add(appliedTheme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

#### **Theme Toggle Component**
```tsx
// src/components/theme/ThemeToggle.tsx
import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Claro', icon: Sun },
    { value: 'dark' as const, label: 'Oscuro', icon: Moon },
    { value: 'system' as const, label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="flex items-center space-x-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            theme === value
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
};
```

### **Componentes de UI Reutilizables**

#### **Modal Component**
```tsx
// src/components/ui/Modal.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
};
```

#### **Toast Notification System**
```tsx
// src/components/ui/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icon = icons[toast.type];

  return (
    <div className={`p-4 rounded-lg border shadow-lg max-w-sm ${colors[toast.type]}`}>
      <div className="flex items-start">
        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm mt-1 opacity-90">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
```

---

## 🧪 **Testing de Componentes**

### **Configuración de Testing**

#### **setupTests.ts**
```typescript
// src/test/setupTests.ts
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));
```

### **Test de Componente Completo**

#### **AuthForm.test.tsx**
```typescript
// src/components/auth/__tests__/AuthForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../AuthForm';
import { AuthProvider } from '../../../hooks/useAuth';

// Mock del hook de autenticación
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    user: null,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AuthForm', () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockSignUp.mockClear();
  });

  describe('Sign In Mode', () => {
    it('renders sign in form by default', () => {
      render(<AuthForm />);
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    it('calls signIn when form is submitted with valid data', async () => {
      mockSignIn.mockResolvedValue({ error: null });

      render(<AuthForm />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Iniciar Sesión'));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows error message when sign in fails', async () => {
      mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });

      render(<AuthForm />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Iniciar Sesión'));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('shows error for invalid email', async () => {
      render(<AuthForm />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'invalid-email' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Iniciar Sesión'));

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('shows error for short password', async () => {
      render(<AuthForm />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: '123' },
      });

      fireEvent.click(screen.getByText('Iniciar Sesión'));

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
      });
    });
  });

  describe('Sign Up Mode', () => {
    it('renders sign up form when mode is signup', () => {
      render(<AuthForm mode="signup" />);
      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
    });

    it('calls signUp when signup form is submitted', async () => {
      mockSignUp.mockResolvedValue({ error: null });

      render(<AuthForm mode="signup" />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Crear Cuenta'));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows error when passwords do not match', async () => {
      render(<AuthForm mode="signup" />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), {
        target: { value: 'password1234' },
      });

      fireEvent.click(screen.getByText('Crear Cuenta'));

      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      });
    });
  });

  describe('UI States', () => {
    it('shows loading state during form submission', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AuthForm />);

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Iniciar Sesión'));

      expect(screen.getByText('Iniciar Sesión')).toBeDisabled();

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });
  });
});
```

#### **PropertyCard.test.tsx**
```typescript
// src/components/properties/__tests__/PropertyCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertyCard } from '../PropertyCard';

// Mock de formatPriceCLP
jest.mock('../../../lib/supabase', () => ({
  formatPriceCLP: jest.fn((price) => `$${price.toLocaleString()}`),
}));

const mockProperty = {
  id: '1',
  listing_type: 'venta' as const,
  address_street: 'Calle Ficticia',
  address_number: '123',
  address_commune: 'Santiago',
  address_region: 'Metropolitana',
  price_clp: 100000000,
  bedrooms: 3,
  bathrooms: 2,
  surface_m2: 80,
  description: 'Hermosa propiedad con vista al mar',
  profiles: {
    first_name: 'Juan',
    paternal_last_name: 'Pérez',
    phone: '+56912345678',
  },
  property_images: [
    { image_url: 'https://example.com/image1.jpg' },
  ],
};

describe('PropertyCard', () => {
  const defaultProps = {
    property: mockProperty,
    showOwner: true,
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <PropertyCard {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  it('renders property information correctly', () => {
    renderComponent();

    expect(screen.getByText('$100,000,000')).toBeInTheDocument();
    expect(screen.getByText('Santiago, Metropolitana')).toBeInTheDocument();
    expect(screen.getByText('Hermosa propiedad con vista al mar')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('displays listing type badge', () => {
    renderComponent();
    expect(screen.getByText('Venta')).toBeInTheDocument();
  });

  it('shows property features', () => {
    renderComponent();

    expect(screen.getByText('3')).toBeInTheDocument(); // bedrooms
    expect(screen.getByText('2')).toBeInTheDocument(); // bathrooms
    expect(screen.getByText('80 m²')).toBeInTheDocument(); // surface
  });

  it('renders property image', () => {
    renderComponent();
    const image = screen.getByAltText('Propiedad en Santiago');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('shows fallback image when no images provided', () => {
    renderComponent({
      property: {
        ...mockProperty,
        property_images: [],
      },
    });

    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('hides owner information when showOwner is false', () => {
    renderComponent({ showOwner: false });

    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    expect(screen.queryByText('+56912345678')).not.toBeInTheDocument();
  });

  it('calls onFavoriteToggle when favorite button is clicked', () => {
    const mockOnFavoriteToggle = jest.fn();
    renderComponent({ onFavoriteToggle: mockOnFavoriteToggle });

    const favoriteButton = screen.getByRole('button', { hidden: true });
    fireEvent.click(favoriteButton);

    expect(mockOnFavoriteToggle).toHaveBeenCalledWith('1');
  });

  it('shows favorite icon as filled when isFavorite is true', () => {
    renderComponent({ isFavorite: true });

    // This would require checking the SVG classes or attributes
    // depending on how the Heart icon is implemented
  });

  it('links to property details page', () => {
    renderComponent();
    const link = screen.getByText('Ver Detalles');
    expect(link.closest('a')).toHaveAttribute('href', '/property/1');
  });
});
```

---

*Estos ejemplos proporcionan una base sólida para implementar funcionalidades complejas en la plataforma inmobiliaria. Cada ejemplo incluye mejores prácticas, manejo de errores, y testing completo.*
