# 🏢 Plataforma Inmobiliaria - Documentación Técnica Completa

Una plataforma inmobiliaria completa y escalable construida con tecnologías modernas para la gestión integral de propiedades, ofertas y transacciones inmobiliarias.

## 📋 Tabla de Contenidos

- [🆕 Últimas Actualizaciones](#-últimas-actualizaciones)
- [🏗️ Arquitectura](#-arquitectura)
- [🛠️ Tecnologías](#️-tecnologías)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [📊 Base de Datos](#-base-de-datos)
- [🔧 APIs y Servicios](#-apis-y-servicios)
- [⚛️ Componentes Frontend](#️-componentes-frontend)
- [🔒 Autenticación y Seguridad](#-autenticación-y-seguridad)
- [📈 Dashboard Ejecutivo](#-dashboard-ejecutivo)
- [📧 Sistema de Notificaciones](#-sistema-de-notificaciones)
- [🔄 Sistema de Backups](#-sistema-de-backups)
- [📝 Logging y Monitoreo](#-logging-y-monitoreo)
- [⚡ Optimizaciones de Performance](#-optimizaciones-de-performance)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [📚 API Reference](#-api-reference)
- [🤝 Contribución](#-contribución)

## 🆕 Últimas Actualizaciones

### v2.1.0 - Gestión Mejorada de Estacionamientos (Commit: 21b267c)

**🎯 Mejoras en Formulario de Propiedades de Alquiler:**

- **✅ Eliminada duplicación** de campos de estacionamientos para **Casa** y **Departamento**
- **✅ Habilitados estacionamientos** para **Bodegas** con sistema completo de gestión
- **✅ Optimizada experiencia** de usuario por tipo de propiedad

**📊 Comportamiento por Tipo de Propiedad:**

| Tipo | Campo Simple | Sección Completa | Estado |
|------|-------------|-----------------|---------|
| Casa | ❌ No | ✅ Sí | Optimizado |
| Departamento | ❌ No | ✅ Sí | Optimizado |
| Bodega | ❌ No | ✅ Sí | **Nuevo** |
| Oficina | ✅ Sí | ✅ Sí | Completo |
| Local Comercial | ✅ Sí | ❌ No | Básico |

**🔧 Detalles Técnicos:**
- Componente `ParkingSpaceForm` extendido a Bodegas
- Lógica de BD actualizada para persistencia correcta
- Compatibilidad total con propiedades existentes

*Ver documentación completa: [`ESTACIONAMIENTOS_POR_TIPO_PROPIEDAD.md`](ESTACIONAMIENTOS_POR_TIPO_PROPIEDAD.md)*

---

## 🏗️ Arquitectura

### Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • Components    │    │ • REST API      │    │ • Users         │
│ • Hooks         │    │ • Real-time     │    │ • Properties    │
│ • Services      │    │ • Auth          │    │ • Offers        │
│ • Utils         │    │ • Storage       │    │ • Tasks         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Services      │
                    │                 │
                    │ • Email Service │
                    │ • Backup System │
                    │ • Logging       │
                    │ • Performance   │
                    │ • Notifications │
                    └─────────────────┘
```

### Arquitectura de Componentes

```
App
├── AppProviders
│   ├── AuthProvider
│   ├── FeatureFlagsProvider
│   └── ThemeProvider
├── AppContent
│   ├── Layout
│   │   ├── Header
│   │   ├── Sidebar
│   │   └── Footer
│   ├── Routes
│   │   ├── Protected Routes
│   │   └── Public Routes
│   └── Error Boundaries
└── Services Layer
    ├── API Layer
    ├── Cache Layer
    └── Offline Support
```

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **React Router** - Routing
- **React Query** - Data fetching y caching
- **React Hook Form** - Form management
- **Lucide React** - Iconos

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Edge Functions

### Librerías Principales
- **@supabase/supabase-js** - Cliente Supabase
- **react-router-dom** - Routing
- **@tanstack/react-query** - Data fetching
- **react-hook-form** - Form handling
- **date-fns** - Date utilities
- **clsx** - Conditional CSS classes
- **react-error-boundary** - Error handling

### DevOps & Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Commitlint** - Commit message linting
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Git

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd plataforma-inmobiliaria
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```

   Configurar las siguientes variables:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Email (opcional)
   REACT_APP_EMAIL_ENABLED=true
   REACT_APP_EMAIL_PROVIDER=smtp
   REACT_APP_SMTP_HOST=smtp.gmail.com
   REACT_APP_SMTP_PORT=587
   REACT_APP_SMTP_USER=your-email@gmail.com
   REACT_APP_SMTP_PASS=your-app-password

   # Logging
   REACT_APP_ENABLE_ADVANCED_LOGGING=true
   ```

4. **Configurar Supabase**
   - Crear proyecto en Supabase
   - Ejecutar las migraciones de base de datos
   - Configurar políticas RLS
   - Configurar storage buckets

5. **Ejecutar migraciones**
   ```bash
   # Ejecutar desde el panel de Supabase o CLI
   supabase db push
   ```

### Configuración de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview

# Ejecutar tests
npm run test

# Ejecutar linting
npm run lint

# Formatear código
npm run format
```

## 📊 Base de Datos

### Esquema Principal

#### Tablas Core

```sql
-- Usuarios y perfiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Propiedades
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES user_profiles(id),
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_region TEXT NOT NULL,
  property_type TEXT NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'CLP',
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  area_sqm DECIMAL(8,2),
  description TEXT,
  features JSONB DEFAULT '[]',
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ofertas de venta
CREATE TABLE property_sale_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  buyer_id UUID REFERENCES user_profiles(id),
  offered_price DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'CLP',
  status TEXT DEFAULT 'pendiente',
  conditions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tareas de ofertas
CREATE TABLE offer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES property_sale_offers(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES user_profiles(id),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documentos de ofertas
CREATE TABLE offer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES property_sale_offers(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Timeline de ofertas
CREATE TABLE offer_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES property_sale_offers(id),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Solicitudes formales
CREATE TABLE offer_formal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES property_sale_offers(id),
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comunicaciones
CREATE TABLE offer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES property_sale_offers(id),
  sender_id UUID REFERENCES user_profiles(id),
  recipient_id UUID REFERENCES user_profiles(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'email',
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Eventos de calendario
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location TEXT,
  attendees UUID[] DEFAULT '{}',
  related_offer_id UUID REFERENCES property_sale_offers(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notificaciones de usuario
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Logs de auditoría
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sale_offers ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Políticas de ejemplo
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can view offers for their properties" ON property_sale_offers
  FOR SELECT USING (
    buyer_id = auth.uid() OR
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
  );
```

## 🔧 APIs y Servicios

### API de Supabase

#### Autenticación
```typescript
import { supabase } from '../lib/supabase';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Registro
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});

// Logout
await supabase.auth.signOut();
```

#### Operaciones CRUD
```typescript
// Crear propiedad
const { data, error } = await supabase
  .from('properties')
  .insert({
    address_street: 'Calle Principal',
    address_number: '123',
    price: 150000000,
    property_type: 'casa'
  })
  .select();

// Leer propiedades con filtros
const { data, error } = await supabase
  .from('properties')
  .select(`
    *,
    owner:user_profiles(full_name, email)
  `)
  .eq('status', 'available')
  .range(0, 9);

// Actualizar oferta
const { data, error } = await supabase
  .from('property_sale_offers')
  .update({ status: 'aceptada' })
  .eq('id', offerId)
  .select();

// Eliminar documento
const { error } = await supabase
  .from('offer_documents')
  .delete()
  .eq('id', documentId);
```

#### Real-time Subscriptions
```typescript
// Suscribirse a cambios en ofertas
const channel = supabase
  .channel('offers-changes')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'property_sale_offers'
    },
    (payload) => {
      console.log('Cambio en oferta:', payload);
      // Actualizar UI
    }
  )
  .subscribe();

// Suscribirse a notificaciones del usuario
const notificationsChannel = supabase
  .channel('user-notifications')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'user_notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Mostrar notificación
    }
  )
  .subscribe();
```

#### Storage
```typescript
// Subir archivo
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`offers/${offerId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Obtener URL pública
const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(`offers/${offerId}/${fileName}`);

// Listar archivos
const { data, error } = await supabase.storage
  .from('documents')
  .list('offers/', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
```

### Servicios Personalizados

#### Email Service
```typescript
import { emailService } from '../lib/emailService';

// Enviar email personalizado
await emailService.send({
  to: 'user@example.com',
  subject: 'Bienvenido',
  html: '<h1>Hola!</h1>',
  category: 'auth'
});

// Enviar email con template
await emailService.sendTemplate('welcome', 'user@example.com', {
  userName: 'John Doe',
  loginUrl: 'https://app.com/login'
});
```

#### Backup Service
```typescript
import { getBackupManager } from '../lib/backupManager';

const backupManager = getBackupManager();

// Crear backup manual
const result = await backupManager.createBackup('manual');

// Restaurar backup
await backupManager.restoreBackup(backupId);
```

#### Logger Service
```typescript
import { logger } from '../lib/advancedLogger';

// Logging básico
logger.info('auth', 'User logged in', { userId: '123' });
logger.error('api', 'API call failed', { error: 'Timeout' });

// Logging avanzado
logger.logApiCall('GET', '/api/users', 200, 150);
logger.logPerformance('page_load', 1200, 2000);
```

## ⚛️ Componentes Frontend

### Estructura de Componentes

```
src/components/
├── auth/                    # Autenticación
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── AuthRecoveryGuard.tsx
│   └── ProtectedRoute.tsx
├── common/                  # Componentes compartidos
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   ├── VirtualizedList.tsx
│   ├── BackupManager.tsx
│   ├── EmailManager.tsx
│   ├── LogViewer.tsx
│   ├── PerformanceAnalyzer.tsx
│   └── ExecutiveDashboard.tsx
├── dashboard/               # Dashboard y métricas
│   ├── DashboardPage.tsx
│   ├── KPICards.tsx
│   └── Charts.tsx
├── layout/                  # Layout principal
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── offers/                  # Gestión de ofertas
│   ├── OfferList.tsx
│   ├── OfferDetail.tsx
│   ├── OfferForm.tsx
│   ├── OfferTasksTab.tsx
│   ├── OfferDocumentsTab.tsx
│   └── OfferCommunicationTab.tsx
├── properties/              # Gestión de propiedades
│   ├── PropertyList.tsx
│   ├── PropertyDetail.tsx
│   ├── PropertyForm.tsx
│   └── PropertyCard.tsx
├── sales/                   # Venta de propiedades
│   └── SalesOfferDetailView.tsx
└── AppContent.tsx
```

### Hooks Personalizados

#### useAuth
```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn('email', 'password')}>
          Sign In
        </button>
      )}
    </div>
  );
}
```

#### useExecutiveDashboard
```typescript
import { useExecutiveDashboard } from '../hooks/useExecutiveDashboard';

function Dashboard() {
  const { dashboardData, loading, formatCurrency } = useExecutiveDashboard();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard Ejecutivo</h1>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <h3>Usuarios Totales</h3>
          <p>{dashboardData.businessKPIs.totalUsers}</p>
        </div>
        <div>
          <h3>Ingresos del Mes</h3>
          <p>{formatCurrency(dashboardData.businessKPIs.revenueThisMonth)}</p>
        </div>
        {/* ... más KPIs */}
      </div>
    </div>
  );
}
```

### Context Providers

#### OfferProvider
```typescript
import { OfferProvider, useOfferContext } from '../hooks/useOfferContext';

function OfferDetail({ offerId }: { offerId: string }) {
  return (
    <OfferProvider offerId={offerId}>
      <OfferDetailContent />
    </OfferProvider>
  );
}

function OfferDetailContent() {
  const { offer, loading, updateOffer } = useOfferContext();

  // Component logic
}
```

## 🔒 Autenticación y Seguridad

### Autenticación con Supabase

La aplicación utiliza Supabase Auth para:
- Registro e inicio de sesión de usuarios
- Recuperación de contraseña
- Autenticación social (opcional)
- JWT tokens automáticos
- Sesiones persistentes

### Políticas de Seguridad

#### Row Level Security (RLS)
- Todas las tablas tienen RLS habilitado
- Políticas basadas en usuario autenticado
- Acceso granular por roles

#### Validación de Datos
- Validación en frontend con React Hook Form + Zod
- Validación en backend con PostgreSQL constraints
- Sanitización de inputs

#### Seguridad de API
- Rate limiting por usuario
- Validación de tokens JWT
- CORS configurado correctamente
- Headers de seguridad

## 📈 Dashboard Ejecutivo

### KPIs Principales

- **Usuarios**: Total, activos, nuevos por mes
- **Propiedades**: Total, disponibles, vendidas
- **Ofertas**: Activas, completadas, tasa de conversión
- **Ingresos**: Mensuales, crecimiento, promedio por usuario
- **Sistema**: Uptime, errores, performance

### Métricas en Tiempo Real

- Actividad reciente de usuarios
- Alertas del sistema
- Tendencias de 24h/7d/30d
- Gráficos interactivos

### Reportes Automáticos

- Reporte semanal por email
- Exportación a CSV/PDF
- Dashboards personalizables

## 📧 Sistema de Notificaciones

### Tipos de Notificaciones

#### Email
- Bienvenida de usuarios
- Actualizaciones de ofertas
- Alertas del sistema
- Reportes periódicos

#### Push Notifications
- Navegador (service worker)
- Mobile (PWA)
- Notificaciones en tiempo real

### Templates de Email

```html
<!-- Template de bienvenida -->
<h1>¡Bienvenido {{userName}}!</h1>
<p>Gracias por registrarte...</p>
<a href="{{loginUrl}}">Iniciar Sesión</a>
```

### Configuración SMTP

```env
# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=user@gmail.com
SMTP_PASS=app-password

# SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key

# Mailgun
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.com
```

## 🔄 Sistema de Backups

### Tipos de Backup

- **Manual**: Iniciado por usuario
- **Programado**: Diario, semanal, mensual
- **Automático**: En cambios críticos

### Encriptación

- AES-256-GCM por defecto
- Rotación automática de claves
- Encriptación de datos sensibles

### Almacenamiento

- **Local**: IndexedDB/localStorage
- **Nube**: Supabase Storage
- **Híbrido**: Ambos simultáneamente

### Restauración

```typescript
const backupManager = getBackupManager();

// Restaurar backup
const result = await backupManager.restoreBackup(backupId);

if (result.success) {
  console.log(`${result.restoredItems} items restored`);
} else {
  console.error('Restore failed:', result.errors);
}
```

## 📝 Logging y Monitoreo

### Niveles de Log

- **DEBUG**: Información detallada para desarrollo
- **INFO**: Información general de funcionamiento
- **WARN**: Advertencias que no detienen el flujo
- **ERROR**: Errores que afectan funcionalidad
- **CRITICAL**: Errores críticos del sistema

### Categorías

- **auth**: Autenticación y autorización
- **api**: Llamadas a API
- **ui**: Interfaz de usuario
- **performance**: Métricas de rendimiento
- **error**: Manejo de errores
- **security**: Eventos de seguridad
- **business**: Lógica de negocio
- **system**: Sistema operativo

### Monitoreo de Performance

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

#### Métricas Personalizadas
- Tiempo de carga de componentes
- Uso de memoria
- Peticiones de red por minuto
- Errores de JavaScript

## ⚡ Optimizaciones de Performance

### Lazy Loading

```typescript
import { lazyLoadComponent } from '../lib/performanceOptimizer';

// Componente lazy con configuración
const LazyOfferDetail = lazyLoadComponent(
  () => import('../components/offers/OfferDetail'),
  { delay: 100, threshold: 0.1 }
);

// Imagen lazy
const { ref, src, loaded } = optimizer.lazyLoadImage(
  '/images/property.jpg',
  '/images/placeholder.jpg'
);
```

### Code Splitting

```typescript
// Por rutas
const offerRoutes = await optimizer.loadRoute('offers', import('./routes/offers'));

// Por componentes
const chartComponent = await optimizer.loadComponentChunk(
  'charts',
  import('./components/Charts'),
  { webpackChunkName: 'charts' }
);
```

### Optimización de Assets

```typescript
// Optimización de imágenes
const result = await optimizer.optimizeImage(imageFile, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'webp'
});

console.log(`Ahorro: ${result.savingsPercent}%`);
```

### Caching Avanzado

- **Service Worker**: Para offline-first
- **API Cache**: Cache de responses con TTL
- **Component Cache**: Cache de componentes React
- **Asset Cache**: Cache de imágenes y fuentes

## 🚀 Deployment

### Variables de Entorno

```env
# Producción
NODE_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Email
REACT_APP_EMAIL_ENABLED=true
REACT_APP_EMAIL_PROVIDER=sendgrid
REACT_APP_SENDGRID_API_KEY=your-key

# Logging
REACT_APP_ENABLE_ADVANCED_LOGGING=true

# Performance
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
```

### Build de Producción

```bash
# Construir aplicación
npm run build

# Vista previa local
npm run preview

# Desplegar archivos de dist/
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Firebase Hosting
```

### Configuración de Supabase

```bash
# Configurar proyecto
supabase init
supabase link --project-ref your-project-id

# Ejecutar migraciones
supabase db push

# Desplegar Edge Functions (opcional)
supabase functions deploy
```

### Monitoreo en Producción

```typescript
// Error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production',
  tracesSampleRate: 1.0
});

// Performance monitoring
import { getPerformanceMonitor } from './lib/performanceMonitor';

const monitor = getPerformanceMonitor();
monitor.startTracking();
```

## 🧪 Testing

### Estrategia de Testing

```
tests/
├── unit/                    # Tests unitarios
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── services/
├── integration/             # Tests de integración
│   ├── api/
│   └── workflows/
├── e2e/                     # Tests end-to-end
│   ├── auth.flow.test.ts
│   ├── offers.flow.test.ts
│   └── properties.flow.test.ts
└── utils/                   # Utilidades de testing
    ├── test-utils.tsx
    ├── mocks/
    └── fixtures/
```

### Ejemplos de Tests

#### Test Unitario de Componente
```typescript
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../components/properties/PropertyCard';

const mockProperty = {
  id: '1',
  address_street: 'Calle Principal',
  address_number: '123',
  price: 150000000,
  property_type: 'casa'
};

test('renders property information correctly', () => {
  render(<PropertyCard property={mockProperty} />);

  expect(screen.getByText('Calle Principal 123')).toBeInTheDocument();
  expect(screen.getByText('$150.000.000')).toBeInTheDocument();
  expect(screen.getByText('Casa')).toBeInTheDocument();
});
```

#### Test de Hook
```typescript
import { renderHook, act } from '@testing-library/react';
import { useOfferContext } from '../hooks/useOfferContext';

test('should update offer status', () => {
  const { result } = renderHook(() => useOfferContext(), {
    wrapper: ({ children }) => (
      <OfferProvider offerId="test-offer">{children}</OfferProvider>
    )
  });

  act(() => {
    result.current.updateOfferStatus('aceptada');
  });

  expect(result.current.offer?.status).toBe('aceptada');
});
```

#### Test E2E
```typescript
import { test, expect } from '@playwright/test';

test('complete offer workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Navigate to offers
  await page.click('[data-testid="offers-nav"]');

  // Create new offer
  await page.click('[data-testid="new-offer-button"]');
  await page.fill('[data-testid="property-search"]', 'Calle Principal');
  await page.fill('[data-testid="offer-price"]', '150000000');
  await page.click('[data-testid="submit-offer"]');

  // Verify offer created
  await expect(page.locator('[data-testid="offer-status"]')).toHaveText('Pendiente');
});
```

### Configuración de CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:e2e
      - run: npm run build
```

## 📚 API Reference

### Hooks

#### useAuth
```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

#### useExecutiveDashboard
```typescript
interface UseExecutiveDashboardReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  calculatedMetrics: Record<string, number>;
  loadDashboardData: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
  formatPercent: (value: number) => string;
}
```

### Servicios

#### EmailService
```typescript
interface EmailService {
  sendEmail(message: EmailMessage): Promise<EmailResult>;
  sendBulkEmails(messages: EmailMessage[], batchSize?: number): Promise<EmailResult[]>;
  registerTemplate(template: EmailTemplate): void;
  getTemplates(category?: EmailCategory): EmailTemplate[];
  getStats(): EmailStats;
}
```

#### BackupManager
```typescript
interface BackupManager {
  createBackup(type?: BackupResult['type']): Promise<BackupResult>;
  restoreBackup(backupId: string): Promise<RestoreResult>;
  getBackupHistory(limit?: number): Promise<BackupResult[]>;
  updateConfig(config: Partial<BackupConfig>): void;
}
```

#### AdvancedLogger
```typescript
interface AdvancedLogger {
  log(level: LogLevel, category: LogCategory, message: string, data?: any): void;
  getEntries(limit?: number, filter?: LogFilter): LogEntry[];
  getStats(timeRange?: string): LogStats;
  exportLogs(format?: 'json' | 'csv'): string;
}
```

## 🤝 Contribución

### Guías de Desarrollo

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. **Commit** tus cambios (`git commit -m 'Add amazing feature'`)
4. **Push** a la rama (`git push origin feature/amazing-feature`)
5. **Abrir** un Pull Request

### Estándares de Código

- Usar TypeScript para todo el código nuevo
- Seguir las convenciones de ESLint y Prettier
- Escribir tests para nuevas funcionalidades
- Actualizar documentación según corresponda
- Usar commits convencionales

### Commit Messages

```
feat: add new dashboard component
fix: resolve memory leak in chart component
docs: update API documentation
style: format code with prettier
refactor: simplify authentication logic
test: add unit tests for user service
chore: update dependencies
```

### Versionado

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Cambios incompatibles
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Corrección de bugs compatibles

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Soporte

- 📧 **Email**: support@plataformainmobiliaria.com
- 📖 **Documentación**: [docs.plataformainmobiliaria.com](https://docs.plataformainmobiliaria.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/plataforma-inmobiliaria/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/plataforma-inmobiliaria/discussions)

---

**Desarrollado con ❤️ por el equipo de Plataforma Inmobiliaria**