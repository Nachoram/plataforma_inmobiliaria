# 🔧 **Documentación Técnica - Plataforma Inmobiliaria**

> **Documentación técnica detallada para desarrolladores**

---

## 📋 **Índice**
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [📊 Esquema de Base de Datos](#-esquema-de-base-de-datos)
- [🔐 Sistema de Autenticación](#-sistema-de-autenticación)
- [📡 API y Funciones](#-api-y-funciones)
- [🎭 Roles y Permisos](#-roles-y-permisos)
- [🧪 Testing](#-testing)
- [🌐 Despliegue](#-despliegue)
- [📈 Optimización](#-optimización)

---

## 🏗️ **Arquitectura del Sistema**

```
┌─────────────────────────────────────────┐
│              Frontend                   │
│  ┌─────────────────────────────────────┐ │
│  │         React App (Vite)           │ │
│  │  ┌─────────────────┬─────────────┐  │ │
│  │  │   Components    │   Pages     │  │ │
│  │  └─────────────────┴─────────────┘  │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│              Supabase                   │
│  ┌─────────────────────────────────────┐ │
│  │         Auth Service               │ │
│  ├─────────────────────────────────────┤ │
│  │         Database (PostgreSQL)      │ │
│  │  ┌─────────────────┬─────────────┐  │ │
│  │  │    Tables       │   RLS      │  │ │
│  │  │                 │ Policies    │  │ │
│  │  └─────────────────┴─────────────┘  │ │
│  ├─────────────────────────────────────┤ │
│  │         Storage Service            │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Capas de Arquitectura**

#### **1. Frontend Layer**
- **React 18.3.1** con hooks y context avanzado
- **TypeScript 5.5.3** para type safety completo
- **Tailwind CSS 3.4.1** para styling moderno
- **Vite 5.4.2** para build y dev server optimizado
- **React Router DOM 7.8.2** para navegación avanzada
- **Lucide React 0.344.0** para iconografía moderna

#### **2. Backend Layer**
- **Supabase** como BaaS
- **PostgreSQL** como base de datos
- **Supabase Auth** para autenticación
- **Supabase Storage** para archivos
- **Edge Functions** para lógica serverless

#### **3. Data Layer**
- **Normalized database schema** (3NF)
- **Row Level Security** (RLS)
- **Automated triggers** para perfiles
- **Snapshot preservation** para aplicaciones

---

## 📊 **Esquema de Base de Datos**

### **Tablas Principales**

#### 👤 **profiles**
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
  created_at timestamp with time zone DEFAULT now()
);
```

#### 🏠 **properties**
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  is_visible boolean DEFAULT true,
  is_featured boolean DEFAULT false
);
```

#### 📋 **applications**
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
  created_at timestamp with time zone DEFAULT now()
);
```

### **Relaciones Clave**
- `profiles` ↔ `auth.users` (1:1)
- `properties` → `profiles` (N:1)
- `applications` → `properties` (N:1)
- `applications` → `profiles` (N:1, applicant)
- `applications` → `guarantors` (N:1)
- `offers` → `properties` (N:1)
- `offers` → `profiles` (N:1, offerer)

### **Enums Definidos**
```sql
CREATE TYPE marital_status_enum AS ENUM ('soltero', 'casado', 'divorciado', 'viudo');
CREATE TYPE property_regime_enum AS ENUM ('sociedad conyugal', 'separación de bienes', 'participación en los gananciales');
CREATE TYPE property_status_enum AS ENUM ('disponible', 'arrendada', 'vendida', 'pausada', 'activa');
CREATE TYPE listing_type_enum AS ENUM ('venta', 'arriendo');
CREATE TYPE application_status_enum AS ENUM ('pendiente', 'aprobada', 'rechazada', 'info_solicitada');
CREATE TYPE offer_status_enum AS ENUM ('pendiente', 'aceptada', 'rechazada');
CREATE TYPE document_entity_type_enum AS ENUM ('property_legal', 'application_applicant', 'application_guarantor');
```

---

## 🔐 **Sistema de Autenticación**

### **Configuración en Supabase**

#### **URL Configuration**
```json
{
  "site_url": "https://tu-proyecto.vercel.app",
  "redirect_urls": [
    "http://localhost:5173/",
    "https://tu-proyecto.vercel.app/"
  ]
}
```

#### **Email Provider Settings**
```json
{
  "enabled": true,
  "confirm_email": false,  // Desactivar para desarrollo
  "secure_email_change_enabled": true
}
```

### **Row Level Security Policies**

#### **Profiles Policies**
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

#### **Properties Policies**
```sql
-- Anyone can view available properties
CREATE POLICY "Anyone can view available properties"
ON properties FOR SELECT
USING (status = 'disponible');

-- Users can view own properties
CREATE POLICY "Users can view own properties"
ON properties FOR SELECT
USING (auth.uid() = owner_id);

-- Users can manage own properties
CREATE POLICY "Users can manage own properties"
ON properties FOR ALL
USING (auth.uid() = owner_id);
```

### **Arquitectura de Providers**

#### **AppProviders Component**
```typescript
// src/components/AppProviders.tsx
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};
```

#### **AppContent con Estado de Carga**
```typescript
// src/components/AppContent.tsx
export const AppContent: React.FC = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          <p className="text-gray-600 mt-4">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas de la aplicación */}
    </Routes>
  );
};
```

**Beneficios:**
- ✅ **Inicialización secuencial** de providers
- ✅ **Estado de carga global** que previene errores de contexto
- ✅ **Separación clara** de responsabilidades
- ✅ **Escalabilidad** para agregar nuevos providers
- ✅ **Debugging mejorado** con estados de carga visibles

### **Hooks de Autenticación**

#### **useAuth Hook**
```typescript
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 📡 **API y Funciones**

### **Cliente Supabase**

#### **Configuración**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### **Funciones Helper**

#### **Formateadores**
```typescript
// Formatear precios en CLP
export const formatPriceCLP = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Formatear RUT chileno
export const formatRUT = (rut: string): string => {
  const cleanRut = rut.replace(/[.-]/g, '');
  const rutNumber = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedNumber}-${dv}`;
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
```

#### **Funciones de Autenticación**
```typescript
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
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
```

### **Integración con Webhooks Externos**

#### **Configuración de n8n Webhooks**
```typescript
// Configuración de variables de entorno
VITE_RAILWAY_WEBHOOK_URL=https://your-n8n-webhook-url.com/webhook/real-estate-events
```

#### **Estructura de Payload para n8n**
```typescript
interface WebhookPayload {
  // Información básica del evento
  action: 'application_approved' | 'application_rejected' | 'offer_received';
  decision: 'approved' | 'rejected';
  status: 'aprobada' | 'rechazada';
  timestamp: string;

  // Información de la aplicación/oferta
  application?: {
    id: string;
    property_id: string;
    applicant_id: string;
    message: string;
    created_at: string;
  };

  // Información de la propiedad
  property?: {
    id: string;
    address: string;
    comuna: string;
    price: number;
    type: string;
    photos_urls: string[];
  };

  // Información del usuario
  applicant?: {
    id: string;
    full_name: string;
    contact_email: string;
    contact_phone: string;
    profession: string;
    monthly_income: number;
  };

  // Metadata adicional
  metadata: {
    source: 'propiedades_app';
    user_agent: string;
    url: string;
    environment: 'development' | 'production';
  };
}
```

#### **Manejo de Respuestas de Webhook**
```typescript
const sendWebhookNotification = async (payload: WebhookPayload): Promise<void> => {
  const webhookURL = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;

  if (!webhookURL) {
    console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
    return;
  }

  try {
    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PropiedadesApp/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`⚠️ Webhook no disponible (${response.status})`);
    } else {
      const result = await response.json();
      console.log('✅ Webhook ejecutado con éxito:', result);
    }
  } catch (error) {
    console.warn('⚠️ Servicio de notificaciones no disponible:', error.message);
  }
};
```

**Casos de Uso:**
- 📧 **Notificaciones por email** automáticas
- 📱 **SMS a postulantes** cuando se aprueba/rechaza
- 📊 **Actualización de CRMs** externos
- 📈 **Analytics y tracking** de conversiones
- 🤖 **Procesos automatizados** de validación

### **Edge Functions**

#### **approve-application**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { applicationId, status } = await req.json();

  // Configuración del cliente Supabase con service role key para operaciones administrativas
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role para bypass RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data, error } = await supabaseClient
    .from('applications')
    .update({
      status,
      approved_at: status === 'aprobada' ? new Date().toISOString() : null
    })
    .eq('id', applicationId)
    .select(`
      *,
      properties(title, address),
      profiles(full_name, contact_email)
    `);

  // Integración opcional con sistemas externos (n8n, etc.)
  if (!error && status === 'aprobada') {
    // Lógica adicional para notificaciones, etc.
  }

  return new Response(
    JSON.stringify({ data, error }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    }
  );
});
```

**Características:**
- ✅ **Service Role Key** para operaciones administrativas
- ✅ **Bypass RLS** cuando es necesario
- ✅ **Timestamps automáticos** para auditoría
- ✅ **CORS configurado** para integración frontend
- ✅ **Integración preparada** para webhooks externos

---

## 🎭 **Roles y Permisos**

### **Sistema RLS Completo**

#### **Applications Policies**
```sql
-- Users can view applications for their properties
CREATE POLICY "Users can view applications for their properties"
ON applications FOR SELECT
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON applications FOR SELECT
USING (auth.uid() = applicant_id);

-- Users can create applications
CREATE POLICY "Users can create applications"
ON applications FOR INSERT
WITH CHECK (auth.uid() = applicant_id);
```

#### **Offers Policies**
```sql
-- Users can view offers for their properties
CREATE POLICY "Users can view offers for their properties"
ON offers FOR SELECT
USING (
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
);

-- Users can view their own offers
CREATE POLICY "Users can view their own offers"
ON offers FOR SELECT
USING (auth.uid() = offerer_id);

-- Users can create offers
CREATE POLICY "Users can create offers"
ON offers FOR INSERT
WITH CHECK (auth.uid() = offerer_id);
```

### **Storage Policies**

#### **Buckets Configuration**
```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('property-images', 'property-images', true),
  ('documents', 'documents', false);

-- Property images policies
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents policies
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🧪 **Testing**

### **Configuración de Testing**
```bash
# Instalar dependencias de testing
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev vitest jsdom
```

### **Configuración Vitest**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### **Ejemplo de Test**
```typescript
// src/components/AuthForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from './AuthForm';
import { vi } from 'vitest';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    user: null,
    loading: false,
  }),
}));

describe('AuthForm', () => {
  it('renders login form', () => {
    render(<AuthForm />);
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('calls signIn when form is submitted', async () => {
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
});
```

### **Ejecutar Tests**
```bash
npm run test
npm run test:watch
npm run test:coverage
npm run test:ui  # Vitest UI
```

---

## 🌐 **Despliegue**

### **Variables de Entorno para Producción**
```bash
# .env.production
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-produccion
NODE_ENV=production
```

### **Opciones de Despliegue**

#### **1. Vercel (Recomendado)**
```bash
npm install -g vercel
vercel --prod
```

**Configuración vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### **2. Netlify**
```bash
npm run build
# Subir carpeta 'dist' a Netlify
```

**Configuración netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### **3. Railway**
```bash
# Conectar repositorio a Railway
# Configurar variables de entorno en dashboard
```

### **Configuración de Producción en Supabase**

#### **Authentication Settings**
```sql
-- Enable email confirmation for production
ALTER TABLE auth.users
ADD CONSTRAINT users_email_check
CHECK (email IS NOT NULL);

-- Update site URL
UPDATE auth.config
SET site_url = 'https://tu-dominio.com';
```

#### **Database Optimization**
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_properties_owner_id ON properties(owner_id);
CREATE INDEX CONCURRENTLY idx_properties_status ON properties(status);
CREATE INDEX CONCURRENTLY idx_applications_property_id ON applications(property_id);
CREATE INDEX CONCURRENTLY idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX CONCURRENTLY idx_offers_property_id ON offers(property_id);
CREATE INDEX CONCURRENTLY idx_offers_offerer_id ON offers(offerer_id);
```

---

## 📈 **Optimización**

### **Performance Frontend**

#### **Code Splitting**
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const MarketplacePage = lazy(() => import('./components/marketplace/MarketplacePage'));
const PropertyDetailsPage = lazy(() => import('./components/properties/PropertyDetailsPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/property/:id" element={<PropertyDetailsPage />} />
      </Routes>
    </Suspense>
  );
}
```

#### **Image Optimization**
```typescript
// src/components/PropertyImage.tsx
import { useState } from 'react';

interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};
```

### **Database Optimization**

#### **Query Optimization**
```typescript
// Optimized query with joins
const { data, error } = await supabase
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
  .order('created_at', { ascending: false })
  .limit(20);
```

#### **Caching Strategy**
```typescript
// src/hooks/useProperties.ts
import { useQuery } from '@tanstack/react-query';

export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### **Bundle Optimization**

#### **Vite Configuration**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],
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
    chunkSizeWarningLimit: 1000,
  },
});
```

---

## 📊 **Monitoreo y Analytics**

### **Error Tracking**
```typescript
// src/lib/errorTracking.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### **Performance Monitoring**
```typescript
// src/lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## 🔧 **Mantenimiento**

### **Database Maintenance**
```sql
-- Vacuum analyze for performance
VACUUM ANALYZE;

-- Reindex if needed
REINDEX TABLE CONCURRENTLY properties;
REINDEX TABLE CONCURRENTLY applications;

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Backup Strategy**
```bash
# Automated backup script
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"

# Database backup
pg_dump -h $SUPABASE_DB_HOST -U $SUPABASE_DB_USER -d $SUPABASE_DB_NAME > $BACKUP_DIR/db_$TIMESTAMP.sql

# Storage backup
supabase storage cp --recursive gs://property-images $BACKUP_DIR/images_$TIMESTAMP/
supabase storage cp --recursive gs://documents $BACKUP_DIR/documents_$TIMESTAMP/
```

---

*Esta documentación técnica se actualiza constantemente. Para las últimas versiones, consulta el repositorio principal.*
