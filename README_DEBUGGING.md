# 🔧 **Guía de Debugging - Plataforma Inmobiliaria**

> **Soluciones a problemas comunes y técnicas de debugging**

---

## 📋 **Índice**
- [🚨 Problemas Comunes](#-problemas-comunes)
- [🔍 Debugging de Autenticación](#-debugging-de-autenticación)
- [📊 Debugging de Base de Datos](#-debugging-de-base-de-datos)
- [🎨 Debugging de UI](#-debugging-de-ui)
- [⚡ Debugging de Performance](#-debugging-de-performance)
- [🗃️ Debugging de Storage](#️-debugging-de-storage)
- [🧪 Debugging de Tests](#-debugging-de-tests)
- [📱 Debugging Mobile](#-debugging-mobile)

---

## 🚨 **Problemas Comunes**

### **1. Error: "useAuth must be used within an AuthProvider"**

#### **Síntomas:**
- Error en consola: `useAuth must be used within an AuthProvider`
- Componentes no renderizan correctamente
- Pantalla en blanco o componentes faltantes
- Errores de contexto en componentes autenticados

#### **Causas:**
- **Arquitectura de providers desordenada**
- **Condición de carrera** entre inicialización de AuthProvider y renderizado
- **Componentes renderizados** antes de que AuthProvider esté listo

#### **Soluciones:**

**a) Verificar estructura de AppProviders:**
```typescript
// src/components/AppProviders.tsx debe existir y ser correcto
export const AppProviders: React.FC = ({ children }) => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};
```

**b) Verificar AppContent con estado de carga:**
```typescript
// src/components/AppContent.tsx debe manejar loading state
export const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>; // O componente de loading
  }

  return <Routes>...</Routes>;
};
```

**c) Verificar orden en main.tsx:**
```typescript
// src/main.tsx debe usar AppProviders
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
```

### **2. Error: "Webhook no disponible" o "Servicio de notificaciones no disponible"**

#### **Síntomas:**
- Notificaciones no se envían al aprobar/rechazar postulaciones
- Mensajes de advertencia en consola sobre webhook
- Aplicación funciona pero sin notificaciones externas
- Logs muestran "⚠️ Webhook no disponible" o "⚠️ Servicio de notificaciones no disponible"

#### **Causas:**
- **Variable de entorno faltante**: `VITE_RAILWAY_WEBHOOK_URL` no configurada
- **URL del webhook incorrecta**: Endpoint de n8n no accesible
- **Configuración de CORS**: El servidor n8n no permite requests desde el frontend
- **Formato de payload incorrecto**: Estructura de datos no compatible con n8n

#### **Soluciones:**

**a) Verificar variable de entorno:**
```bash
# Verificar que existe la variable
echo $VITE_RAILWAY_WEBHOOK_URL

# O verificar en .env
cat .env | grep VITE_RAILWAY_WEBHOOK_URL
```

**b) Verificar formato de la URL:**
```bash
# URL correcta debe ser similar a:
VITE_RAILWAY_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/real-estate-events
```

**c) Probar conectividad del webhook:**
```bash
# Probar con curl
curl -X POST https://tu-n8n-instance.com/webhook/real-estate-events \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```

**d) Verificar payload structure:**
```typescript
// El payload debe coincidir con lo esperado por n8n
const testPayload = {
  action: 'test_connection',
  timestamp: new Date().toISOString(),
  source: 'propiedades_app'
};
```

**e) Configuración opcional (no bloqueante):**
```typescript
// Si no hay webhook configurado, la app funciona sin notificaciones
console.log('ℹ️ Webhook no configurado - funcionando sin notificaciones externas');
```

### **3. Error: "Supabase URL or Anon Key is missing"**

#### **Síntomas:**
- Aplicación no carga completamente
- Error en consola: `Supabase URL or Anon Key is missing. Check your .env file.`
- Variables de entorno no se cargan correctamente
- Errores de contexto en componentes autenticados

#### **Causas:**
- **Arquitectura de providers desordenada**
- **Condición de carrera** entre inicialización de AuthProvider y renderizado
- **Componentes renderizados** antes de que AuthProvider esté listo

#### **Soluciones:**

**a) Verificar estructura de AppProviders:**
```typescript
// src/components/AppProviders.tsx debe existir y ser correcto
export const AppProviders: React.FC = ({ children }) => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};
```

**b) Verificar AppContent con estado de carga:**
```typescript
// src/components/AppContent.tsx debe manejar loading state
export const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>; // O componente de loading
  }

  return <Routes>...</Routes>;
};
```

**c) Verificar orden en main.tsx:**
```typescript
// src/main.tsx debe usar AppProviders
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
```

#### **2. Error: "Supabase URL or Anon Key is missing"**

#### **Síntomas:**
- Aplicación no carga
- Error en consola: `Supabase URL or Anon Key is missing. Check your .env file.`
- Variables de entorno no se cargan

#### **Soluciones:**

**a) Verificar archivo .env:**
```bash
# Asegurarse de que existe .env en la raíz
ls -la | grep .env

# Verificar contenido
cat .env
```

**b) Verificar formato correcto:**
```bash
# Archivo .env correcto
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**c) Reiniciar servidor:**
```bash
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

**d) Verificar variables en navegador:**
```javascript
// En consola del navegador
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### **2. Error: "relation 'public.profiles' does not exist"**

#### **Síntomas:**
- Errores al registrar usuarios
- Consultas a tablas fallan
- Base de datos parece vacía

#### **Soluciones:**

**a) Ejecutar migración:**
```sql
-- En SQL Editor de Supabase
-- Copiar y ejecutar TODO el contenido de:
-- supabase/migrations/20250101000000_complete_real_estate_schema.sql
```

**b) Verificar tablas creadas:**
```sql
-- En SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**c) Verificar trigger de perfil:**
```sql
-- Verificar que existe el trigger
SELECT * FROM pg_trigger WHERE tgname LIKE '%profile%';
```

### **3. Error: "JWT expired"**

#### **Síntomas:**
- Usuario pierde sesión automáticamente
- Requests fallan con 401 Unauthorized
- Necesidad constante de re-login

#### **Soluciones:**

**a) Verificar configuración JWT:**
```sql
-- En Supabase Dashboard → Authentication → Settings
-- Verificar JWT Expiry (debe ser razonable, ej: 3600 segundos = 1 hora)
```

**b) Implementar refresh automático:**
```typescript
// En useAuth.tsx
const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Error refreshing session:', error);
    // Redirect to login
  }
};
```

### **4. Error: "Row Level Security policy violated"**

#### **Síntomas:**
- No se pueden crear/actualizar registros
- Consultas devuelven resultados vacíos
- Operaciones CRUD fallan

#### **Soluciones:**

**a) Verificar políticas RLS:**
```sql
-- Ver todas las políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Ver políticas de una tabla específica
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

**b) Verificar permisos del usuario:**
```typescript
// En consola del navegador
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
console.log('User ID:', user?.id);
```

**c) Desactivar RLS temporalmente para testing:**
```sql
-- SOLO PARA TESTING - NO USAR EN PRODUCCIÓN
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
```

---

## 🔍 **Debugging de Autenticación**

### **Debugging del Login Flow**

#### **Script de debugging:**
```typescript
// src/utils/authDebug.ts
export const debugAuthFlow = async () => {
  console.log('🔍 === AUTH DEBUGGING ===');

  // 1. Verificar configuración de Supabase
  console.log('1. Supabase Config:');
  console.log('- URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('- Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  // 2. Verificar sesión actual
  console.log('2. Current Session:');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('- Session exists:', !!session);
  console.log('- Session error:', sessionError);
  if (session) {
    console.log('- User ID:', session.user.id);
    console.log('- User email:', session.user.email);
  }

  // 3. Verificar perfil del usuario
  console.log('3. User Profile:');
  if (session?.user?.id) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    console.log('- Profile exists:', !!profile);
    console.log('- Profile error:', profileError);
    console.log('- Profile data:', profile);
  }

  // 4. Verificar listener de auth state
  console.log('4. Auth State Listener:');
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('- Auth event:', event);
    console.log('- Session after event:', !!session);
  });

  console.log('🔍 === END AUTH DEBUGGING ===');

  return () => subscription.unsubscribe();
};
```

#### **Uso en componente:**
```tsx
import { debugAuthFlow } from '../utils/authDebug';

const AuthDebugComponent = () => {
  React.useEffect(() => {
    debugAuthFlow();
  }, []);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3 className="font-bold text-yellow-800">Auth Debugging Active</h3>
      <p className="text-yellow-700">Check console for auth debugging info</p>
    </div>
  );
};
```

### **Debugging de Registro de Usuario**

#### **Script de debugging de registro:**
```typescript
// src/utils/registrationDebug.ts
export const debugRegistration = async (email: string, password: string) => {
  console.log('📝 === REGISTRATION DEBUGGING ===');

  try {
    // 1. Intentar registro
    console.log('1. Attempting registration...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: 'Test',
          paternal_last_name: 'User',
        }
      }
    });

    console.log('2. Registration result:');
    console.log('- Success:', !error);
    console.log('- Error:', error);
    console.log('- User created:', !!data.user);
    console.log('- Session created:', !!data.session);

    if (data.user) {
      console.log('- User ID:', data.user.id);
      console.log('- User email:', data.user.email);
      console.log('- Email confirmed:', data.user.email_confirmed_at);
    }

    // 2. Verificar creación de perfil
    if (data.user && !error) {
      console.log('3. Checking profile creation...');

      // Esperar un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      console.log('- Profile created:', !!profile);
      console.log('- Profile error:', profileError);
      console.log('- Profile data:', profile);
    }

    return { data, error };

  } catch (error) {
    console.error('❌ Registration debugging failed:', error);
    return { data: null, error };
  }
};
```

---

## 📊 **Debugging de Base de Datos**

### **Debugging de Consultas**

#### **Logger de consultas:**
```typescript
// src/utils/queryLogger.ts
export const createQueryLogger = () => {
  const originalFrom = supabase.from;

  supabase.from = function(table: string) {
    console.log(`📊 Querying table: ${table}`);

    const builder = originalFrom.call(this, table);

    // Override methods to add logging
    const originalSelect = builder.select;
    builder.select = function(query: string) {
      console.log(`🔍 SELECT from ${table}:`, query);
      return originalSelect.call(this, query);
    };

    const originalInsert = builder.insert;
    builder.insert = function(values: any) {
      console.log(`➕ INSERT into ${table}:`, values);
      return originalInsert.call(this, values);
    };

    const originalUpdate = builder.update;
    builder.update = function(values: any) {
      console.log(`✏️ UPDATE ${table}:`, values);
      return originalUpdate.call(this, values);
    };

    const originalDelete = builder.delete;
    builder.delete = function() {
      console.log(`🗑️ DELETE from ${table}`);
      return originalDelete.call(this);
    };

    return builder;
  };
};

// Activar en desarrollo
if (import.meta.env.DEV) {
  createQueryLogger();
}
```

### **Debugging de RLS Policies**

#### **Script para verificar políticas:**
```sql
-- Verificar políticas activas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar si RLS está activado en tablas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Simular consulta como usuario específico
-- (Cambiar 'user-uuid' por el ID real del usuario)
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid", "role": "authenticated"}';
SELECT * FROM properties LIMIT 5;
```

### **Debugging de Performance de Consultas**

#### **Analizar queries lentas:**
```sql
-- Ver queries activas
SELECT
  pid,
  age(clock_timestamp(), query_start),
  usename,
  query
FROM pg_stat_activity
WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start DESC;

-- Ver índices disponibles
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Analizar uso de índices
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

---

## 🎨 **Debugging de UI**

### **Debugging de Componentes React**

#### **Componente de debugging:**
```tsx
// src/components/debug/ComponentDebugger.tsx
import React from 'react';

interface ComponentDebuggerProps {
  name: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  children?: React.ReactNode;
}

export const ComponentDebugger: React.FC<ComponentDebuggerProps> = ({
  name,
  props,
  state,
  children
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    console.log(`🔧 ${name} - Component mounted`);
    return () => console.log(`🔧 ${name} - Component unmounted`);
  }, [name]);

  React.useEffect(() => {
    console.log(`📝 ${name} - Props changed:`, props);
  }, [name, props]);

  React.useEffect(() => {
    console.log(`🔄 ${name} - State changed:`, state);
  }, [name, state]);

  if (!import.meta.env.DEV) return <>{children}</>;

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-2 right-2 z-10 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-mono"
      >
        🐛 {name}
      </button>

      {isExpanded && (
        <div className="absolute top-8 right-2 z-20 bg-black text-green-400 p-4 rounded font-mono text-sm max-w-md max-h-96 overflow-auto">
          <div className="mb-2">
            <strong>Props:</strong>
            <pre className="text-xs">{JSON.stringify(props, null, 2)}</pre>
          </div>
          {state && (
            <div>
              <strong>State:</strong>
              <pre className="text-xs">{JSON.stringify(state, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
```

#### **Uso:**
```tsx
import { ComponentDebugger } from '../debug/ComponentDebugger';

const MyComponent: React.FC<MyComponentProps> = (props) => {
  const [count, setCount] = React.useState(0);

  return (
    <ComponentDebugger
      name="MyComponent"
      props={props}
      state={{ count }}
    >
      <div>
        <h1>My Component</h1>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </div>
    </ComponentDebugger>
  );
};
```

### **Debugging de Estilos CSS**

#### **Utilidades de debugging CSS:**
```typescript
// src/utils/cssDebug.ts
export const debugCSS = () => {
  // Agregar borde rojo a todos los elementos
  const style = document.createElement('style');
  style.textContent = '* { outline: 1px solid red !important; }';
  document.head.appendChild(style);

  // Función para remover debugging
  return () => document.head.removeChild(style);
};

// Debug de box model
export const debugBoxModel = (element: HTMLElement) => {
  const computed = window.getComputedStyle(element);
  console.log('📦 Box Model Debug:', {
    display: computed.display,
    position: computed.position,
    width: computed.width,
    height: computed.height,
    margin: {
      top: computed.marginTop,
      right: computed.marginRight,
      bottom: computed.marginBottom,
      left: computed.marginLeft,
    },
    padding: {
      top: computed.paddingTop,
      right: computed.paddingRight,
      bottom: computed.paddingBottom,
      left: computed.paddingLeft,
    },
    border: {
      top: computed.borderTop,
      right: computed.borderRight,
      bottom: computed.borderBottom,
      left: computed.borderLeft,
    },
  });
};
```

### **Debugging de Responsive Design**

#### **Componente responsive debugger:**
```tsx
// src/components/debug/ResponsiveDebugger.tsx
import React from 'react';

export const ResponsiveDebugger: React.FC = () => {
  const [dimensions, setDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!import.meta.env.DEV) return null;

  const getBreakpoint = (width: number) => {
    if (width < 640) return '📱 sm';
    if (width < 768) return '📱 md';
    if (width < 1024) return '💻 lg';
    if (width < 1280) return '💻 xl';
    return '🖥️ 2xl';
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-3 rounded-lg font-mono text-sm z-50">
      <div>📐 {dimensions.width} x {dimensions.height}</div>
      <div>{getBreakpoint(dimensions.width)}</div>
      <div className="text-xs text-gray-400 mt-1">
        Responsive Debugger
      </div>
    </div>
  );
};
```

---

## ⚡ **Debugging de Performance**

### **Debugging de Componentes Lentos**

#### **Performance profiler:**
```tsx
// src/components/debug/PerformanceProfiler.tsx
import React from 'react';

interface PerformanceProfilerProps {
  id: string;
  children: React.ReactNode;
}

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  id,
  children
}) => {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    if (import.meta.env.DEV) {
      console.log(`⚡ ${id} render #${renderCount.current} (+${timeSinceLastRender}ms)`);
    }

    lastRenderTime.current = now;
  });

  return <>{children}</>;
};
```

#### **Hook de performance:**
```typescript
// src/hooks/usePerformanceDebug.ts
import { useEffect, useRef } from 'react';

export const usePerformanceDebug = (componentName: string, dependencies?: any[]) => {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();

    if (import.meta.env.DEV) {
      console.log(`🚀 ${componentName}:`, {
        renderCount: renderCount.current,
        timeSinceMount: now - mountTime.current,
        dependencies: dependencies,
      });
    }
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`📍 ${componentName} mounted`);
    }

    return () => {
      if (import.meta.env.DEV) {
        console.log(`📍 ${componentName} unmounted`);
      }
    };
  }, []);
};
```

### **Debugging de Memoria**

#### **Memory leak detector:**
```typescript
// src/utils/memoryDebug.ts
export const detectMemoryLeaks = () => {
  if (!import.meta.env.DEV) return;

  // Track component instances
  const componentInstances = new Map<string, number>();

  // Override React.createElement to track instances
  const originalCreateElement = React.createElement;
  React.createElement = function(...args) {
    const [type] = args;

    if (typeof type === 'function' && type.name) {
      const count = componentInstances.get(type.name) || 0;
      componentInstances.set(type.name, count + 1);

      // Log if too many instances
      if (count > 50) {
        console.warn(`🚨 Possible memory leak: ${type.name} has ${count} instances`);
      }
    }

    return originalCreateElement.apply(this, args);
  };

  // Log memory usage periodically
  setInterval(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log('💾 Memory usage:', {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB',
      });
    }
  }, 10000);
};
```

---

## 🗃️ **Debugging de Storage**

### **Debugging de Upload de Archivos**

#### **Logger de storage:**
```typescript
// src/utils/storageDebug.ts
export const debugStorageUpload = async (
  bucket: string,
  fileName: string,
  file: File
) => {
  console.log('📤 === STORAGE UPLOAD DEBUG ===');
  console.log('Bucket:', bucket);
  console.log('File name:', fileName);
  console.log('File size:', (file.size / 1024).toFixed(2) + 'KB');
  console.log('File type:', file.type);

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    console.log('Upload result:', { data, error });

    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('Public URL:', publicUrl);
    }

    return { data, error };
  } catch (error) {
    console.error('Upload failed:', error);
    return { data: null, error };
  }
};
```

### **Debugging de Políticas de Storage**

#### **Verificar permisos de storage:**
```sql
-- Ver políticas de storage
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- Ver objetos en storage
SELECT
  bucket_id,
  name,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🧪 **Debugging de Tests**

### **Debugging de Tests que Fallan**

#### **Debug helper para tests:**
```typescript
// src/test/utils/testDebug.ts
export const debugTest = (description: string, data: any) => {
  if (process.env.DEBUG_TESTS) {
    console.log(`🧪 ${description}:`, data);
  }
};

export const waitForDebug = async (condition: () => boolean, timeout = 5000) => {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    if (process.env.DEBUG_TESTS) {
      console.log('⏳ Waiting for condition...');
    }
  }
};
```

#### **Test debugging setup:**
```typescript
// En test que está fallando
describe('AuthForm', () => {
  it('should handle login correctly', async () => {
    // Agregar debugging
    console.log('🧪 Starting login test');

    render(<AuthForm />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByText('Iniciar Sesión');

    console.log('🧪 Elements found:', {
      emailInput: !!emailInput,
      passwordInput: !!passwordInput,
      submitButton: !!submitButton,
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    console.log('🧪 Form filled');

    fireEvent.click(submitButton);

    console.log('🧪 Submit clicked');

    // Agregar timeout más largo para debugging
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    }, { timeout: 10000 });

    console.log('🧪 Test completed');
  });
});
```

### **Debugging de Cobertura de Tests**

#### **Script para verificar cobertura:**
```bash
# Ver reporte de cobertura
npm run test:coverage

# Ver archivos no cubiertos
npx nyc report --reporter=text | grep -E "(lines|functions|branches)"
```

---

## 📱 **Debugging Mobile**

### **Debugging de Responsive Design**

#### **Media query debugger:**
```typescript
// src/utils/responsiveDebug.ts
export const debugMediaQueries = () => {
  if (!import.meta.env.DEV) return;

  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  };

  const updateDebugInfo = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let currentBreakpoint = 'xs';
    for (const [name, size] of Object.entries(breakpoints)) {
      if (width >= size) {
        currentBreakpoint = name;
      }
    }

    console.log(`📱 Responsive Debug: ${width}x${height} (${currentBreakpoint})`);
  };

  window.addEventListener('resize', updateDebugInfo);
  updateDebugInfo();

  // Agregar indicadores visuales
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
  `;
  document.body.appendChild(indicator);

  const updateIndicator = () => {
    const width = window.innerWidth;
    let breakpoint = 'xs';
    for (const [name, size] of Object.entries(breakpoints)) {
      if (width >= size) {
        breakpoint = name;
      }
    }
    indicator.textContent = `${width}px (${breakpoint})`;
  };

  window.addEventListener('resize', updateIndicator);
  updateIndicator();
};
```

### **Debugging de Touch Events**

#### **Touch event logger:**
```typescript
// src/utils/touchDebug.ts
export const debugTouchEvents = (element: HTMLElement) => {
  if (!import.meta.env.DEV) return;

  const events = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];

  events.forEach(eventType => {
    element.addEventListener(eventType, (e: TouchEvent) => {
      console.log(`👆 ${eventType}:`, {
        touches: e.touches.length,
        targetTouches: e.targetTouches.length,
        changedTouches: e.changedTouches.length,
        touch: e.touches[0] ? {
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY,
        } : null,
      });
    });
  });
};
```

---

## 🔧 **Herramientas de Debugging**

### **Browser DevTools Snippets**

#### **Snippet para debugging de React:**
```javascript
// Agregar a DevTools Snippets
// Nombre: React Debug
(function() {
  const reactInternals = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (reactInternals) {
    console.log('🔧 React DevTools disponibles');

    // Log cuando componentes se actualizan
    const originalRender = reactInternals.render;
    reactInternals.render = function(...args) {
      console.log('⚛️ React render:', args);
      return originalRender.apply(this, args);
    };
  } else {
    console.log('⚠️ React DevTools no disponibles');
  }
})();
```

#### **Snippet para debugging de red:**
```javascript
// Agregar a DevTools Snippets
// Nombre: Network Debug
(function() {
  const originalFetch = window.fetch;

  window.fetch = function(...args) {
    console.log('🌐 Fetch request:', args[0], args[1]);

    return originalFetch.apply(this, args)
      .then(response => {
        console.log('✅ Fetch response:', response.status, response.url);
        return response;
      })
      .catch(error => {
        console.error('❌ Fetch error:', error);
        throw error;
      });
  };

  console.log('🌐 Network debugging activado');
})();
```

### **Scripts de Debugging para Terminal**

#### **Script de health check:**
```bash
#!/bin/bash
# health-check.sh

echo "🔍 Health Check - Plataforma Inmobiliaria"
echo "========================================"

# Verificar archivos críticos
echo "📁 Verificando archivos..."
files=(".env" "package.json" "vite.config.ts" "src/App.tsx")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file existe"
  else
    echo "❌ $file no encontrado"
  fi
done

# Verificar dependencias
echo ""
echo "📦 Verificando dependencias..."
if command -v node &> /dev/null; then
  echo "✅ Node.js instalado: $(node --version)"
else
  echo "❌ Node.js no encontrado"
fi

if command -v npm &> /dev/null; then
  echo "✅ npm instalado: $(npm --version)"
else
  echo "❌ npm no encontrado"
fi

# Verificar variables de entorno
echo ""
echo "🔧 Verificando variables de entorno..."
if [ -f ".env" ]; then
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo "✅ VITE_SUPABASE_URL configurado"
  else
    echo "❌ VITE_SUPABASE_URL no encontrado"
  fi

  if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo "✅ VITE_SUPABASE_ANON_KEY configurado"
  else
    echo "❌ VITE_SUPABASE_ANON_KEY no encontrado"
  fi
else
  echo "❌ Archivo .env no encontrado"
fi

echo ""
echo "🎯 Próximos pasos:"
echo "1. Ejecutar: npm install"
echo "2. Ejecutar: npm run dev"
echo "3. Abrir: http://localhost:5173"
```

---

## 🚨 **Casos de Emergencia**

### **Recuperación de Base de Datos**

#### **Script de respaldo de datos:**
```sql
-- Crear respaldo antes de cambios críticos
CREATE OR REPLACE FUNCTION backup_table_data(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('CREATE TABLE %I_backup_%s AS SELECT * FROM %I',
                 table_name,
                 to_char(now(), 'YYYYMMDD_HH24MI'),
                 table_name);
END;
$$ LANGUAGE plpgsql;

-- Usar: SELECT backup_table_data('properties');
```

### **Rollback de Cambios**

#### **Script de rollback:**
```typescript
// src/utils/rollback.ts
export const rollbackChanges = async (changes: Array<{
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
}>) => {
  console.log('🔄 Iniciando rollback...');

  for (const change of changes.reverse()) {
    try {
      switch (change.operation) {
        case 'insert':
          await supabase
            .from(change.table)
            .delete()
            .eq('id', change.data.id);
          break;

        case 'update':
          await supabase
            .from(change.table)
            .update(change.data.oldValues)
            .eq('id', change.data.id);
          break;

        case 'delete':
          await supabase
            .from(change.table)
            .insert(change.data);
          break;
      }

      console.log(`✅ Rollback completado para ${change.table}`);
    } catch (error) {
      console.error(`❌ Error en rollback para ${change.table}:`, error);
    }
  }

  console.log('🔄 Rollback finalizado');
};
```

---

*Esta guía de debugging se actualiza continuamente con soluciones a nuevos problemas encontrados durante el desarrollo.*
