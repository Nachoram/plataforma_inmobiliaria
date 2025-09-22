# 🏗️ **Arquitectura del Sistema**

> **Documentación técnica completa de la arquitectura y componentes del sistema**

---

## 📋 **Índice**
- [🎯 Visión General](#-visión-general)
- [📊 Esquema de Base de Datos](#-esquema-de-base-de-datos)
- [🔧 Arquitectura Frontend](#-arquitectura-frontend)
- [⚡ Sistema de Providers](#-sistema-de-providers)
- [🗃️ Gestión de Estado](#️-gestión-de-estado)
- [📡 Integración con Supabase](#-integración-con-supabase)
- [🎨 Estructura de Componentes](#-estructura-de-componentes)
- [📂 Organización de Archivos](#-organización-de-archivos)

---

## 🎯 **Visión General**

### **Arquitectura del Sistema**
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React Application                         │ │
│  │  ┌─────────────┬─────────────┬─────────────────────┐   │ │
│  │  │ Components  │   Hooks     │      Utilities      │   │ │
│  │  │             │             │                     │   │ │
│  │  │ - Auth      │ - useAuth   │ - formatters        │   │ │
│  │  │ - Properties│ - useProps  │ - validators        │   │ │
│  │  │ - Dashboard │ - useAPI    │ - constants         │   │ │
│  │  └─────────────┴─────────────┴─────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Backend Layer                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Authentication                          │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │            Database (PostgreSQL)                       │ │
│  │  ┌─────────────┬─────────────┬─────────────────────┐   │ │
│  │  │   Tables    │     RLS     │     Triggers        │   │ │
│  │  │             │  Policies   │                     │   │ │
│  │  │ - profiles  │ - Security  │ - Auto profiles     │   │ │
│  │  │ - properties│ - Access    │ - Timestamps        │   │ │
│  │  │ - apps      │ - Privacy   │ - Validation        │   │ │
│  │  └─────────────┴─────────────┴─────────────────────┘   │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                Storage Service                          │ │
│  │  ┌─────────────────────┬───────────────────────────┐   │ │
│  │  │  property-images    │    user-documents         │   │ │
│  │  │   (Public)          │     (Private)             │   │ │
│  │  └─────────────────────┴───────────────────────────┘   │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                Edge Functions                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services Layer                        │
│  ┌─────────────────┬─────────────────┬─────────────────────┐ │
│  │   n8n/Railway   │    Analytics    │     Monitoring      │ │
│  │   Webhooks      │    Services     │     Services        │ │
│  └─────────────────┴─────────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Principios Arquitecturales**

#### **1. Separación de Responsabilidades**
- **Presentación**: Componentes React puros
- **Lógica de Negocio**: Custom hooks
- **Acceso a Datos**: Clientes Supabase
- **Estado**: Context API + Local state

#### **2. Escalabilidad**
- **Code splitting** automático
- **Lazy loading** de componentes
- **Optimización** de bundles
- **Caché inteligente**

#### **3. Mantenibilidad**
- **TypeScript** para type safety
- **Estructura modular** clara
- **Documentación** integrada
- **Testing** automatizado

---

## 📊 **Esquema de Base de Datos**

### **Diagrama de Entidad-Relación**
```
                    ┌─────────────────┐
                    │   auth.users    │
                    │  (Supabase)     │
                    └─────────┬───────┘
                              │ 1:1
                              ▼
                    ┌─────────────────┐
                    │    profiles     │◄─────────────┐
                    │                 │              │
                    └─────────┬───────┘              │
                              │ 1:N                  │ 1:N
                              ▼                      │
                    ┌─────────────────┐              │
         ┌─────────►│   properties    │              │
         │          │                 │              │
         │          └─────────┬───────┘              │
         │                    │ 1:N                  │
         │                    ▼                      │
         │          ┌─────────────────┐              │
         │          │  applications   │──────────────┘
         │          │                 │ N:1
         │          └─────────┬───────┘
         │                    │ N:1
         │                    ▼
         │          ┌─────────────────┐
         │          │   guarantors    │
         │          └─────────────────┘
         │
         │ 1:N      ┌─────────────────┐
         └──────────│     offers      │
                    └─────────────────┘

    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   documents     │    │ property_images │    │ user_favorites  │
    │                 │    │                 │    │                 │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Tablas Principales**

#### **👤 profiles**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  paternal_last_name text NOT NULL,
  maternal_last_name text NOT NULL,
  rut text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  profession text NOT NULL,
  marital_status marital_status_enum NOT NULL,
  property_regime property_regime_enum,
  address_street text NOT NULL,
  address_number text NOT NULL,
  address_department text,
  address_commune text NOT NULL,
  address_region text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Funcionalidades:**
- ✅ **Vinculación automática** con auth.users
- ✅ **Validación de RUT** chileno
- ✅ **Direcciones estructuradas**
- ✅ **Información legal** (régimen patrimonial)

#### **🏠 properties**
```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status property_status_enum NOT NULL DEFAULT 'disponible',
  listing_type listing_type_enum NOT NULL,
  address_street text NOT NULL,
  address_number text NOT NULL,
  address_department text,
  address_commune text NOT NULL,
  address_region text NOT NULL,
  price_clp numeric NOT NULL,
  common_expenses_clp numeric,
  bedrooms integer NOT NULL,
  bathrooms integer NOT NULL,
  surface_m2 numeric NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  is_visible boolean DEFAULT true,
  is_featured boolean DEFAULT false
);
```

**Características:**
- ✅ **Soporte venta/arriendo** completo
- ✅ **Precios en CLP** con decimales
- ✅ **Direcciones chilenas** estructuradas
- ✅ **Estados múltiples** (disponible, vendida, etc.)
- ✅ **Soft delete** con is_visible
- ✅ **Sistema de destacados**

#### **📋 applications**
```sql
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guarantor_id uuid REFERENCES guarantors(id) ON DELETE SET NULL,
  status application_status_enum NOT NULL DEFAULT 'pendiente',
  message text NOT NULL,
  
  -- Snapshot data preservation
  snapshot_applicant_profession text NOT NULL,
  snapshot_applicant_monthly_income_clp numeric NOT NULL,
  snapshot_applicant_age integer NOT NULL,
  snapshot_applicant_nationality text NOT NULL,
  snapshot_applicant_marital_status marital_status_enum NOT NULL,
  snapshot_applicant_address_street text NOT NULL,
  snapshot_applicant_address_number text NOT NULL,
  snapshot_applicant_address_department text,
  snapshot_applicant_address_commune text NOT NULL,
  snapshot_applicant_address_region text NOT NULL,
  
  created_at timestamptz DEFAULT now()
);
```

**Funcionalidades Avanzadas:**
- ✅ **Preservación de datos snapshot** para auditoría
- ✅ **Vinculación opcional con garante**
- ✅ **Estados de aplicación** completos
- ✅ **Integridad referencial** con cascadas

### **Enums y Types**
```sql
-- Estados y tipos del sistema
CREATE TYPE marital_status_enum AS ENUM ('soltero', 'casado', 'divorciado', 'viudo');
CREATE TYPE property_regime_enum AS ENUM ('sociedad conyugal', 'separación de bienes', 'participación en los gananciales');
CREATE TYPE property_status_enum AS ENUM ('disponible', 'arrendada', 'vendida', 'pausada', 'activa');
CREATE TYPE listing_type_enum AS ENUM ('venta', 'arriendo');
CREATE TYPE application_status_enum AS ENUM ('pendiente', 'aprobada', 'rechazada', 'info_solicitada');
CREATE TYPE offer_status_enum AS ENUM ('pendiente', 'aceptada', 'rechazada');
CREATE TYPE document_entity_type_enum AS ENUM ('property_legal', 'application_applicant', 'application_guarantor');
```

### **Triggers Automáticos**
```sql
-- Trigger para crear perfiles automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔧 **Arquitectura Frontend**

### **Stack Tecnológico**

#### **Core Framework**
```json
{
  "react": "18.3.1",
  "typescript": "5.5.3",
  "vite": "5.4.2"
}
```

#### **Routing & State**
```json
{
  "react-router-dom": "7.8.2",
  "@tanstack/react-query": "^4.0.0" // Opcional para caché
}
```

#### **UI & Styling**
```json
{
  "tailwindcss": "3.4.1",
  "lucide-react": "0.344.0",
  "react-hook-form": "^7.45.0" // Para formularios
}
```

#### **Backend Integration**
```json
{
  "@supabase/supabase-js": "2.57.2",
  "@supabase/auth-ui-react": "^0.4.0" // UI components opcionales
}
```

### **Configuración de Build**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(), // Separar vendors automáticamente
  ],
  
  // Optimización de build
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react', 'tailwindcss'],
        },
      },
    },
    // Límite de advertencia de chunk
    chunkSizeWarningLimit: 1000,
  },
  
  // Optimización de desarrollo
  server: {
    port: 5173,
    open: true, // Abrir navegador automáticamente
  },
});
```

---

## ⚡ **Sistema de Providers**

### **Arquitectura de Providers Mejorada**

#### **App.tsx - Punto de entrada**
```typescript
// src/App.tsx
import React from 'react';
import { AppProviders } from './components/AppProviders';

function App() {
  return <AppProviders />;
}

export default App;
```

#### **AppProviders.tsx - Centralización**
```typescript
// src/components/AppProviders.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { AppContent } from './AppContent';

export const AppProviders: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};
```

#### **AppContent.tsx - Manejo de Estados**
```typescript
// src/components/AppContent.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AppContent: React.FC = () => {
  const { loading, user } = useAuth();

  // Estado de carga global
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas de la aplicación */}
      <Route path="/" element={<MarketplacePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      {/* Más rutas... */}
    </Routes>
  );
};
```

### **Beneficios de la Arquitectura**

#### **1. Prevención de Errores**
- ✅ **Eliminación completa** del error "useAuth must be used within an AuthProvider"
- ✅ **Garantía** de inicialización secuencial
- ✅ **Estados de carga** manejados centralmente

#### **2. Escalabilidad**
- ✅ **Fácil agregar providers** (Theme, Notifications, etc.)
- ✅ **Separación clara** de responsabilidades
- ✅ **Testing** mejorado con providers mockeable

#### **3. Debugging**
- ✅ **Estados visibles** en toda la aplicación
- ✅ **Logs centralizados** de inicialización
- ✅ **Error boundaries** implementables

---

## 🗃️ **Gestión de Estado**

### **Estrategia de Estado**

#### **1. Context API para Estado Global**
```typescript
// src/hooks/useAuth.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: any}>;
  signUp: (email: string, password: string) => Promise<{error: any}>;
  signOut: () => Promise<{error: any}>;
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
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const result = await supabase.auth.signInWithPassword({ email, password });
      return { error: result.error };
    },
    signUp: async (email: string, password: string) => {
      const result = await supabase.auth.signUp({ email, password });
      return { error: result.error };
    },
    signOut: async () => {
      const result = await supabase.auth.signOut();
      return { error: result.error };
    },
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

#### **2. Local State para Componentes**
```typescript
// Estado local para formularios complejos
const [formData, setFormData] = useState({
  listing_type: 'venta',
  address_street: '',
  price_clp: '',
  // ... más campos
});

// Estado local para UI
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
const [showModal, setShowModal] = useState(false);
```

#### **3. Server State con React Query (Opcional)**
```typescript
// src/hooks/useProperties.ts
import { useQuery } from '@tanstack/react-query';

export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};
```

---

## 📡 **Integración con Supabase**

### **Cliente Supabase Configurado**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Tipos TypeScript generados
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          // ... más campos
        };
        Insert: {
          id: string;
          first_name: string;
          // ... más campos
        };
        Update: {
          id?: string;
          first_name?: string;
          // ... más campos
        };
      };
      // ... más tablas
    };
  };
}

// Helper types
export type Property = Database['public']['Tables']['properties']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Application = Database['public']['Tables']['applications']['Row'];
```

### **Funciones Helper**
```typescript
// src/lib/supabase.ts

// Formateo de precios en CLP
export const formatPriceCLP = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Validación de RUT chileno
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

// Formateo de RUT
export const formatRUT = (rut: string): string => {
  const cleanRut = rut.replace(/[.-]/g, '');
  const rutNumber = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedNumber}-${dv}`;
};
```

---

## 🎨 **Estructura de Componentes**

### **Jerarquía de Componentes**
```
src/components/
├── 🔐 auth/
│   ├── AuthForm.tsx           # Formulario login/registro
│   ├── AuthPage.tsx           # Página de autenticación
│   └── AuthRecoveryGuard.tsx  # Recuperación de sesión
│
├── 📊 dashboard/
│   ├── ApplicationsPage.tsx   # Gestión de postulaciones
│   └── OffersPage.tsx         # Gestión de ofertas
│
├── 🛒 marketplace/
│   ├── MarketplacePage.tsx    # Página principal
│   ├── MyActivityPage.tsx     # Actividad del usuario
│   └── OfferModal.tsx         # Modal de ofertas
│
├── 📁 portfolio/
│   └── PortfolioPage.tsx      # Portafolio personal
│
├── 👤 profile/
│   ├── UserProfile.tsx        # Perfil público
│   └── UserProfileForm.tsx    # Formulario de perfil
│
├── 🏠 properties/
│   ├── PropertyForm.tsx           # Formulario base
│   ├── PropertyPublicationForm.tsx# Publicación completa
│   ├── PropertyDetailsPage.tsx    # Detalles de propiedad
│   ├── PublicPropertiesPage.tsx   # Listado público
│   ├── RentalApplicationForm.tsx  # Formulario postulación
│   ├── AdvancedOfferForm.tsx      # Formulario ofertas
│   ├── OfferForm.tsx              # Oferta simple
│   ├── RentalPublicationForm.tsx  # Publicación arriendo
│   └── PropertyCard.tsx           # Tarjeta de propiedad
│
├── 🧩 common/
│   └── CustomButton.tsx       # Botones reutilizables
│
├── 🛡️ Layout.tsx              # Layout principal
├── 🔒 ProtectedRoute.tsx       # Rutas protegidas
└── 📱 AppContent.tsx           # Contenido principal
```

### **Patrones de Componentes**

#### **1. Componente de Página Completa**
```typescript
// Estructura típica de página
const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    // Lógica de fetching
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <FilterComponent filters={filters} onChange={setFilters} />
        <PropertyGrid properties={properties} loading={loading} />
      </div>
    </Layout>
  );
};
```

#### **2. Formulario Complejo**
```typescript
// src/components/properties/PropertyPublicationForm.tsx
const PropertyPublicationForm: React.FC<Props> = ({ onSuccess }) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    // Validación completa
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Lógica de submit
      onSuccess?.(result);
    } catch (error) {
      // Manejo de errores
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos del formulario */}
    </form>
  );
};
```

#### **3. Hook Personalizado**
```typescript
// src/hooks/useProperties.ts
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
          profiles!owner_id (first_name, paternal_last_name),
          property_images (image_url)
        `)
        .eq('status', 'disponible');

      // Aplicar filtros
      if (filters?.listing_type) {
        query = query.eq('listing_type', filters.listing_type);
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

  return { properties, loading, error, refetch: fetchProperties };
};
```

---

## 📂 **Organización de Archivos**

### **Estructura Completa**
```
src/
├── components/           # Componentes React
│   ├── auth/            # Autenticación
│   ├── dashboard/       # Dashboards
│   ├── marketplace/     # Marketplace
│   ├── portfolio/       # Portafolio
│   ├── profile/         # Perfiles
│   ├── properties/      # Propiedades
│   ├── common/          # Componentes reutilizables
│   ├── AppProviders.tsx # Providers centralizados
│   ├── AppContent.tsx   # Contenido principal
│   ├── Layout.tsx       # Layout base
│   └── ProtectedRoute.tsx # Rutas protegidas
│
├── hooks/               # Custom hooks
│   ├── useAuth.tsx      # Hook de autenticación
│   ├── useProperties.ts # Hook de propiedades
│   └── useLocalStorage.ts # Hook de storage local
│
├── lib/                 # Librerías y utilidades
│   ├── supabase.ts      # Cliente Supabase
│   ├── validators.ts    # Funciones de validación
│   ├── formatters.ts    # Funciones de formateo
│   └── constants.ts     # Constantes de la aplicación
│
├── types/               # Tipos TypeScript
│   ├── database.ts      # Tipos de BD generados
│   ├── forms.ts         # Tipos de formularios
│   └── api.ts           # Tipos de API
│
├── styles/              # Estilos globales
│   ├── globals.css      # Estilos globales
│   └── components.css   # Estilos de componentes
│
├── utils/               # Utilidades
│   ├── api.ts           # Helpers de API
│   ├── errors.ts        # Manejo de errores
│   └── logger.ts        # Sistema de logging
│
└── test/                # Testing
    ├── setup.ts         # Configuración de tests
    ├── mocks/           # Mocks para testing
    └── utils.ts         # Utilidades de testing
```

### **Convenciones de Nomenclatura**

#### **Archivos**
- **PascalCase** para componentes: `PropertyForm.tsx`
- **camelCase** para hooks: `useProperties.ts`
- **kebab-case** para utilidades: `format-currency.ts`

#### **Componentes**
- **Props interface** con sufijo `Props`: `PropertyFormProps`
- **Export named** para componentes reutilizables
- **Default export** para páginas principales

#### **Funciones**
- **camelCase** para funciones: `validateRUT()`
- **Verbos descriptivos**: `handleSubmit()`, `fetchData()`
- **Prefijos consistentes**: `is`, `has`, `get`, `set`

---

## 📚 **Documentación Relacionada**

### **🔧 Desarrollo y APIs**
- 📖 **[README-API.md](README-API.md)** - APIs, webhooks y Edge Functions
- 💻 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Ejemplos prácticos y mejores prácticas
- 👥 **[README-CONTRIBUCION.md](README-CONTRIBUCION.md)** - Guías de contribución y estándares

### **🛠️ Configuración y Seguridad**
- 🚀 **[README-INSTALACION.md](README-INSTALACION.md)** - Instalación y configuración inicial
- 🔐 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - Seguridad, RLS y autenticación
- 🗄️ **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones y fixes de base de datos

### **🚀 Producción y Debugging**
- 🚀 **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)** - Despliegue y producción
- 🐛 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Debugging y troubleshooting

---

**✅ Con esta arquitectura, tienes una base sólida para desarrollar y escalar tu plataforma inmobiliaria.**
