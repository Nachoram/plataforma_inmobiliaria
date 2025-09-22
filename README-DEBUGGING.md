# 🐛 **Guía de Debugging y Resolución de Problemas**

> **Soluciones completas a problemas comunes y herramientas de diagnóstico**

---

## 📋 **Índice**
- [🚨 Problemas Comunes](#-problemas-comunes)
- [🔍 Herramientas de Debugging](#-herramientas-de-debugging)
- [📊 Debugging de Base de Datos](#-debugging-de-base-de-datos)
- [🎨 Debugging de UI](#-debugging-de-ui)
- [⚡ Debugging de Performance](#-debugging-de-performance)
- [🗃️ Debugging de Storage](#️-debugging-de-storage)
- [🧪 Debugging de Tests](#-debugging-de-tests)
- [📱 Debugging Mobile](#-debugging-mobile)
- [🚨 Casos de Emergencia](#-casos-de-emergencia)

---

## 🚨 **Problemas Comunes**

### **1. Error: "useAuth must be used within an AuthProvider"**

#### **🔍 Síntomas:**
- Error en consola: `useAuth must be used within an AuthProvider`
- Componentes no renderizan correctamente
- Pantalla en blanco o componentes faltantes
- Errores de contexto en componentes autenticados

#### **🎯 Causa Raíz:**
La arquitectura de providers no está inicializándose correctamente o hay una condición de carrera entre la inicialización de AuthProvider y el renderizado de componentes.

#### **✅ Solución Completa:**

**Paso 1: Verificar estructura de AppProviders:**
```typescript
// src/components/AppProviders.tsx debe existir y ser correcto
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

**Paso 2: Verificar AppContent con estado de carga:**
```typescript
// src/components/AppContent.tsx debe manejar loading state
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

  return <Routes>{/* Rutas */}</Routes>;
};
```

**Paso 3: Verificar orden en main.tsx:**
```typescript
// src/main.tsx debe usar AppProviders
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
```

**Paso 4: Verificar que App.tsx esté simplificado:**
```typescript
// src/App.tsx debe ser simple
function App() {
  return <AppProviders />;
}
```

---

### **2. Error: "Webhook no disponible" o "Servicio de notificaciones no disponible"**

#### **🔍 Síntomas:**
- Notificaciones no se envían al aprobar/rechazar postulaciones
- Mensajes de advertencia en consola sobre webhook
- Aplicación funciona pero sin notificaciones externas
- Logs muestran "⚠️ Webhook no disponible" o "⚠️ Servicio de notificaciones no disponible"

#### **🎯 Causa Raíz:**
La integración con n8n/Railway webhooks no está configurada o la URL no es accesible.

#### **✅ Solución:**

**Opción 1: Configurar webhook (funcionalidad completa)**
```bash
# En archivo .env
VITE_RAILWAY_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/real-estate-events
```

**Opción 2: Funcionar sin notificaciones (opcional)**
El sistema está diseñado para funcionar sin webhooks. Los mensajes de advertencia son informativos, no errores críticos.

**Verificar conectividad:**
```bash
# Probar con curl
curl -X POST https://tu-n8n-instance.com/webhook/real-estate-events \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```

**Estructura de payload esperada:**
```javascript
const testPayload = {
  action: 'test_connection',
  timestamp: new Date().toISOString(),
  source: 'propiedades_app'
};
```

---

### **3. Error: "Supabase URL or Anon Key is missing"**

#### **🔍 Síntomas:**
- Aplicación no carga completamente
- Error en consola: `Supabase URL or Anon Key is missing. Check your .env file.`
- Variables de entorno no se cargan correctamente

#### **✅ Solución:**

**Paso 1: Verificar archivo .env:**
```bash
# Asegurarse de que existe .env en la raíz
ls -la | grep .env

# Verificar contenido
cat .env
```

**Paso 2: Verificar formato correcto:**
```env
# Archivo .env correcto (IMPORTANTE: prefijo VITE_)
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Paso 3: Reiniciar servidor:**
```bash
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

**Paso 4: Verificar variables en navegador:**
```javascript
// En consola del navegador
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**Paso 5: Obtener credenciales correctas de Supabase:**
1. Ve a [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia los valores exactos:
   - **Project URL** (para VITE_SUPABASE_URL)
   - **anon public** key (para VITE_SUPABASE_ANON_KEY)

**Paso 6: Verificar formato del archivo .env:**
```env
# Formato correcto (IMPORTANTE: sin espacios alrededor del =)
VITE_SUPABASE_URL="https://tu-proyecto-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ❌ Formato incorrecto (con espacios)
VITE_SUPABASE_URL = "https://tu-proyecto-id.supabase.co"

# ❌ Formato incorrecto (sin comillas dobles)
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
```

---

### **4. Error: "relation 'public.profiles' does not exist"**

#### **🔍 Síntomas:**
- Errores al registrar usuarios
- Consultas a tablas fallan
- Base de datos parece vacía

#### **✅ Solución:**

**Paso 1: Ejecutar migración completa:**
```sql
-- En SQL Editor de Supabase
-- Copiar y ejecutar TODO el contenido de:
-- supabase/migrations/20250101000000_complete_real_estate_schema.sql
```

**Paso 2: Verificar tablas creadas:**
```sql
-- En SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**Resultado esperado (8+ tablas):**
- profiles
- properties  
- applications
- offers
- guarantors
- documents
- property_images
- user_favorites

**Paso 3: Verificar trigger de perfil:**
```sql
-- Verificar que existe el trigger
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%profile%';
```

---

### **5. Errores 403 Forbidden y 406 Not Acceptable**

#### **🔍 Síntomas:**
- Error 403 al crear/editar propiedades, aplicaciones u ofertas
- Error 406 al consultar perfiles o tablas
- Operaciones CRUD fallan con permisos

#### **🎯 Causa Raíz:**
Problemas con Row Level Security (RLS) policies o falta de PRIMARY KEY en tablas.

#### **✅ Solución:**
Ver sección completa en [README-MIGRACIONES.md](README-MIGRACIONES.md) - scripts específicos disponibles:

- `fix_profiles_rls_select_policy.sql` - Fix para perfiles
- `fix_properties_rls_policies.sql` - Fix para propiedades  
- `fix_applications_403_error_complete.sql` - Fix para postulaciones
- `fix_offers_403_DEFINITIVO.sql` - Fix para ofertas
- `fix_authenticated_role_permissions_ultimate.sql` - Fix general de permisos

---

## 🔍 **Herramientas de Debugging**

### **Supabase Query Logger**

#### **Activación Automática**
El logger se activa automáticamente en modo desarrollo y registra todas las consultas de Supabase en la consola.

```typescript
// Ya está integrado en src/lib/supabase.ts
// Se activa automáticamente cuando import.meta.env.DEV === true
```

#### **Cómo Usarlo**
1. **Abre la consola del navegador** (F12 → Console)
2. **Navega por la aplicación** - verás logs como:

```
🔍 Query #1 - Tabla: "properties"
📋 Consulta #1 - Detalles
  🟢 select("address_street, price_clp")
  🔵 eq("status", "disponible")  
  🟡 order({"ascending": false})
  ⚡ then()
✅ Query #1 COMPLETADA (45ms)
```

3. **Busca errores marcados con 🔥** - estos indican problemas:

```
🔍 Query #2 - Tabla: "properties"
📋 Consulta #2 - Detalles
  🟢 select("i_address, price_clp")  // ❌ ¡Aquí está el problema!
  🔵 eq("status", "disponible")
❌ Query #2 FALLÓ (23ms)
🔥 Error: column properties.i_address does not exist
🔥 Código: 42703
```

#### **Desactivar Logger**
```typescript
// Si necesitas desactivarlo temporalmente
import { disableSupabaseLogger } from './lib/supabaseLogger';
disableSupabaseLogger();
```

### **Debug de Autenticación**

#### **Script de Debugging Completo**
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
      .maybeSingle();

    console.log('- Profile exists:', !!profile);
    console.log('- Profile error:', profileError);
    console.log('- Profile data:', profile);
  }

  console.log('🔍 === END AUTH DEBUGGING ===');
};
```

#### **Uso en Componente**
```typescript
import { debugAuthFlow } from '../utils/authDebug';

// En un componente o directamente en consola
debugAuthFlow();
```

### **Debug de Registro de Usuario**

#### **Script de Testing de Registro**
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
        .maybeSingle();

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

### **Verificación de RLS Policies**

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
```

#### **Testing de Permisos**
```sql
-- Simular consulta como usuario específico
-- (Cambiar 'user-uuid' por el ID real del usuario)
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid", "role": "authenticated"}';
SELECT * FROM properties LIMIT 5;
```

### **Debugging de Queries Lentas**

#### **Analizar performance:**
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
```

### **Logger de Consultas JavaScript**

#### **Logger avanzado para desarrollo:**
```typescript
// src/utils/queryLogger.ts
export const createQueryLogger = () => {
  if (!import.meta.env.DEV) return;

  const originalFrom = supabase.from;
  let queryCounter = 0;

  supabase.from = function(table: string) {
    queryCounter++;
    const queryId = queryCounter;
    
    console.log(`🔍 Query #${queryId} - Tabla: "${table}"`);
    console.groupCollapsed(`📋 Consulta #${queryId} - Detalles`);

    const builder = originalFrom.call(this, table);

    // Override methods to add logging
    const loggedMethods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range'];

    loggedMethods.forEach(method => {
      if (builder[method]) {
        const originalMethod = builder[method];
        builder[method] = function(...args) {
          console.log(`  🟢 ${method}(${JSON.stringify(args).slice(1, -1)})`);
          return originalMethod.apply(this, args);
        };
      }
    });

    // Override then to log results
    const originalThen = builder.then;
    builder.then = function(onResolve, onReject) {
      const startTime = Date.now();
      
      return originalThen.call(this, 
        (result) => {
          const duration = Date.now() - startTime;
          console.groupEnd();
          
          if (result.error) {
            console.log(`❌ Query #${queryId} FALLÓ (${duration}ms)`);
            console.error(`🔥 Error: ${result.error.message}`);
            console.error(`🔥 Código: ${result.error.code}`);
            if (result.error.details) {
              console.error(`🔥 Detalles: ${result.error.details}`);
            }
          } else {
            console.log(`✅ Query #${queryId} COMPLETADA (${duration}ms)`);
          }
          
          console.log(`📊 Resumen - Tabla: "${table}", Pasos: ${loggedMethods.length}`);
          
          return onResolve ? onResolve(result) : result;
        },
        (error) => {
          const duration = Date.now() - startTime;
          console.groupEnd();
          console.log(`❌ Query #${queryId} FALLÓ (${duration}ms)`);
          console.error(`🔥 Error: ${error.message}`);
          
          return onReject ? onReject(error) : Promise.reject(error);
        }
      );
    };

    return builder;
  };
};

// Activar en desarrollo
if (import.meta.env.DEV) {
  createQueryLogger();
}
```

---

## 🎨 **Debugging de UI**

### **Componente de Debugging Visual**

#### **ComponentDebugger Avanzado**
```typescript
// src/components/debug/ComponentDebugger.tsx
import React, { useState, useEffect } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(Date.now());

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime;
    
    console.log(`🔧 ${name} - Render #${renderCount + 1} (+${timeSinceLastRender}ms)`);
    setLastRenderTime(now);
  });

  useEffect(() => {
    console.log(`📝 ${name} - Props changed:`, props);
  }, [name, props]);

  useEffect(() => {
    console.log(`🔄 ${name} - State changed:`, state);
  }, [name, state]);

  if (!import.meta.env.DEV) return <>{children}</>;

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-2 right-2 z-10 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-mono transition-colors"
        title={`${name} - Render #${renderCount}`}
      >
        🐛 {name} ({renderCount})
      </button>

      {isExpanded && (
        <div className="absolute top-8 right-2 z-20 bg-black text-green-400 p-4 rounded font-mono text-sm max-w-md max-h-96 overflow-auto shadow-lg">
          <div className="mb-3">
            <strong className="text-yellow-400">Component: {name}</strong>
            <div className="text-xs text-gray-400">Renders: {renderCount}</div>
          </div>
          
          <div className="mb-2">
            <strong>Props:</strong>
            <pre className="text-xs mt-1 overflow-x-auto">
              {JSON.stringify(props, null, 2)}
            </pre>
          </div>
          
          {state && (
            <div>
              <strong>State:</strong>
              <pre className="text-xs mt-1 overflow-x-auto">
                {JSON.stringify(state, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
```

#### **Uso del ComponentDebugger**
```typescript
import { ComponentDebugger } from '../debug/ComponentDebugger';

const MyComponent: React.FC<Props> = (props) => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <ComponentDebugger
      name="MyComponent"
      props={props}
      state={{ count, name }}
    >
      <div>
        <h1>My Component</h1>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
    </ComponentDebugger>
  );
};
```

### **Debugging Responsive Design**

#### **ResponsiveDebugger**
```typescript
// src/components/debug/ResponsiveDebugger.tsx
import React, { useState, useEffect } from 'react';

export const ResponsiveDebugger: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
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
    if (width < 640) return '📱 xs';
    if (width < 768) return '📱 sm';
    if (width < 1024) return '💻 md';
    if (width < 1280) return '💻 lg';
    if (width < 1536) return '🖥️ xl';
    return '🖥️ 2xl';
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg font-mono text-sm z-50 pointer-events-none">
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

### **Hook de Performance**

#### **usePerformanceDebug**
```typescript
// src/hooks/usePerformanceDebug.ts
import { useEffect, useRef } from 'react';

export const usePerformanceDebug = (componentName: string, dependencies?: any[]) => {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceMount = now - mountTime.current;
    const timeSinceLastRender = now - lastRenderTime.current;

    if (import.meta.env.DEV) {
      console.log(`⚡ ${componentName}:`, {
        renderCount: renderCount.current,
        timeSinceMount,
        timeSinceLastRender,
        dependencies: dependencies,
      });

      // Advertir sobre renders frecuentes
      if (timeSinceLastRender < 16) { // < 1 frame a 60fps
        console.warn(`🚨 ${componentName} está renderizando muy frecuentemente!`);
      }

      // Advertir sobre muchos renders
      if (renderCount.current > 50) {
        console.warn(`🚨 ${componentName} ha renderizado ${renderCount.current} veces!`);
      }
    }

    lastRenderTime.current = now;
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`📍 ${componentName} mounted`);
    }

    return () => {
      if (import.meta.env.DEV) {
        const totalTime = Date.now() - mountTime.current;
        console.log(`📍 ${componentName} unmounted after ${totalTime}ms (${renderCount.current} renders)`);
      }
    };
  }, [componentName]);
};
```

### **Memory Leak Detector**

#### **Detector de Memory Leaks**
```typescript
// src/utils/memoryDebug.ts
export const detectMemoryLeaks = () => {
  if (!import.meta.env.DEV) return;

  // Track component instances
  const componentInstances = new Map<string, number>();
  
  // Log memory usage periodically
  const memoryInterval = setInterval(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const used = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
      const total = Math.round(memInfo.totalJSHeapSize / 1024 / 1024);
      const limit = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);
      
      console.log('💾 Memory usage:', {
        used: `${used}MB`,
        total: `${total}MB`,
        limit: `${limit}MB`,
        percentage: `${Math.round((used / total) * 100)}%`
      });

      // Advertir sobre uso alto de memoria
      if (used / total > 0.8) {
        console.warn('🚨 High memory usage detected!');
      }
    }
  }, 10000); // Cada 10 segundos

  // Cleanup function
  return () => {
    clearInterval(memoryInterval);
  };
};
```

---

## 🗃️ **Debugging de Storage**

### **Debug de Upload de Archivos**

#### **Logger de Storage Completo**
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
    // 1. Verificar bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return { data: null, error: bucketsError };
    }

    const bucketExists = buckets?.some(b => b.name === bucket);
    if (!bucketExists) {
      console.error(`Bucket "${bucket}" does not exist!`);
      return { data: null, error: { message: `Bucket "${bucket}" does not exist` } };
    }

    // 2. Intentar upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    console.log('Upload result:', { data, error });

    // 3. Si éxito, obtener URL pública
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('Public URL:', publicUrl);

      // 4. Verificar que el archivo es accesible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log('File accessibility:', response.ok ? 'Accessible' : 'Not accessible');
        console.log('Response status:', response.status);
      } catch (fetchError) {
        console.warn('Could not verify file accessibility:', fetchError);
      }
    }

    return { data, error };
  } catch (error) {
    console.error('Upload failed:', error);
    return { data: null, error };
  }
};
```

### **Verificar Políticas de Storage**

#### **Script SQL para Storage Policies**
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

-- Ver buckets disponibles
SELECT
  id,
  name,
  public,
  created_at,
  updated_at
FROM storage.buckets;
```

---

## 🧪 **Debugging de Tests**

### **Test Debugging Helpers**

#### **Debug Helper para Tests**
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
      console.error(`⏰ Timeout waiting for condition after ${timeout}ms`);
      throw new Error('Timeout waiting for condition');
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    if (process.env.DEBUG_TESTS) {
      console.log('⏳ Waiting for condition...');
    }
  }

  if (process.env.DEBUG_TESTS) {
    console.log('✅ Condition met');
  }
};

export const mockSupabaseResponse = (data: any = null, error: any = null) => {
  return {
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK'
  };
};
```

#### **Enhanced Test Setup**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';

// Global test debugging
global.debugTest = (description: string, data: any) => {
  if (process.env.DEBUG_TESTS) {
    console.log(`🧪 [TEST] ${description}:`, data);
  }
};

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  if (!process.env.DEBUG_TESTS) {
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterEach(() => {
  if (!process.env.DEBUG_TESTS) {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
});
```

---

## 📱 **Debugging Mobile**

### **Touch Events Debugger**

#### **Debug Touch Events**
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
          force: e.touches[0].force || 'N/A'
        } : null,
        target: e.target?.tagName,
        preventDefault: e.defaultPrevented
      });
    });
  });

  // También escuchar eventos de mouse para comparar
  const mouseEvents = ['mousedown', 'mousemove', 'mouseup'];
  mouseEvents.forEach(eventType => {
    element.addEventListener(eventType, (e: MouseEvent) => {
      console.log(`🖱️ ${eventType}:`, {
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        buttons: e.buttons,
        target: e.target?.tagName
      });
    });
  });
};
```

---

## 🚨 **Casos de Emergencia**

### **Script de Health Check Completo**

#### **health-check.js**
```javascript
// scripts/health-check.js - Ejecutar con node health-check.js
const fs = require('fs');
const path = require('path');

console.log('🔍 === HEALTH CHECK COMPLETO ===');

// 1. Verificar archivos críticos
console.log('\n📁 Verificando estructura de archivos...');
const criticalFiles = [
  '.env',
  'package.json',
  'vite.config.ts',
  'src/App.tsx',
  'src/components/AppProviders.tsx',
  'src/components/AppContent.tsx',
  'src/hooks/useAuth.tsx',
  'src/lib/supabase.ts'
];

let missingFiles = [];
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTA`);
    missingFiles.push(file);
  }
});

// 2. Verificar variables de entorno
console.log('\n🌍 Verificando variables de entorno...');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  
  if (envContent.includes('VITE_SUPABASE_URL')) {
    console.log('✅ VITE_SUPABASE_URL configurado');
  } else {
    console.log('❌ VITE_SUPABASE_URL no encontrado');
  }
  
  if (envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log('✅ VITE_SUPABASE_ANON_KEY configurado');
  } else {
    console.log('❌ VITE_SUPABASE_ANON_KEY no encontrado');
  }
} else {
  console.log('❌ Archivo .env no existe');
}

// 3. Verificar dependencias
console.log('\n📦 Verificando dependencias...');
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = {
    'react': '18.3.1',
    'typescript': '5.5.3',
    '@supabase/supabase-js': '2.57.2',
    'vite': '5.4.2'
  };
  
  Object.entries(requiredDeps).forEach(([dep, version]) => {
    const installedVersion = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
    if (installedVersion) {
      console.log(`✅ ${dep}: ${installedVersion}`);
    } else {
      console.log(`❌ ${dep}: NO INSTALADO`);
    }
  });
}

// 4. Resumen
console.log('\n📋 === RESUMEN ===');
if (missingFiles.length === 0) {
  console.log('✅ Todos los archivos críticos están presentes');
} else {
  console.log(`❌ Faltan ${missingFiles.length} archivos críticos:`, missingFiles);
}

// 5. Próximos pasos
console.log('\n🎯 Próximos pasos sugeridos:');
console.log('1. Si faltan archivos: ejecutar los fixes correspondientes');
console.log('2. Si faltan variables: configurar .env');
console.log('3. Si faltan dependencias: ejecutar npm install');
console.log('4. Ejecutar: npm run dev');
console.log('5. Verificar: http://localhost:5173');
```

### **Rollback de Cambios**

#### **Sistema de Rollback**
```typescript
// src/utils/rollback.ts
interface Change {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

class RollbackSystem {
  private changes: Change[] = [];

  recordChange(change: Omit<Change, 'timestamp'>) {
    this.changes.push({
      ...change,
      timestamp: new Date().toISOString()
    });
  }

  async rollbackAll() {
    console.log('🔄 Iniciando rollback completo...');
    
    // Procesar cambios en orden inverso
    for (const change of this.changes.reverse()) {
      try {
        await this.rollbackSingle(change);
        console.log(`✅ Rollback exitoso para ${change.table}`);
      } catch (error) {
        console.error(`❌ Error en rollback para ${change.table}:`, error);
      }
    }
    
    this.changes = [];
    console.log('🔄 Rollback completado');
  }

  private async rollbackSingle(change: Change) {
    switch (change.operation) {
      case 'insert':
        return await supabase
          .from(change.table)
          .delete()
          .eq('id', change.data.id);
          
      case 'update':
        return await supabase
          .from(change.table)
          .update(change.data.oldValues)
          .eq('id', change.data.id);
          
      case 'delete':
        return await supabase
          .from(change.table)
          .insert(change.data);
    }
  }

  getChanges() {
    return this.changes;
  }

  clearChanges() {
    this.changes = [];
  }
}

export const rollbackSystem = new RollbackSystem();
```

---

## 🔧 **Scripts de Diagnóstico Rápido**

### **Browser DevTools Snippets**

#### **Snippet 1: React Debug**
```javascript
// Agregar a DevTools Snippets - Nombre: "React Debug"
(function() {
  console.log('⚛️ === REACT DEBUG INFO ===');
  
  // React DevTools
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('React DevTools disponibles:', !!reactDevTools);
  
  // Supabase
  console.log('Supabase disponible:', !!window.supabase);
  
  // Variables de entorno (si están expuestas)
  if (window.__ENV__) {
    console.log('Variables de entorno:', window.__ENV__);
  }
  
  // Performance
  if ('memory' in performance) {
    const memInfo = performance.memory;
    console.log('Memoria JS:', {
      used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB'
    });
  }
  
  console.log('⚛️ === END REACT DEBUG ===');
})();
```

#### **Snippet 2: Network Debug**
```javascript
// Agregar a DevTools Snippets - Nombre: "Network Debug"
(function() {
  console.log('🌐 Activando network debugging...');
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    console.log('📤 Fetch request:', {
      url: url,
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body
    });

    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📥 Fetch response:', {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
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

---

## 📚 **Documentación Relacionada**

### **🏗️ Arquitectura y Desarrollo**
- 🏗️ **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Arquitectura del sistema y base de datos
- 💻 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Ejemplos prácticos y mejores prácticas
- 👥 **[README-CONTRIBUCION.md](README-CONTRIBUCION.md)** - Guías de contribución y estándares

### **🛠️ Configuración y Seguridad**
- 🚀 **[README-INSTALACION.md](README-INSTALACION.md)** - Instalación y configuración inicial
- 🔐 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - Seguridad, RLS y autenticación
- 📖 **[README-API.md](README-API.md)** - APIs, webhooks y Edge Functions

### **🗄️ Base de Datos y Producción**
- 🗄️ **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones y fixes de base de datos
- 🚀 **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)** - Despliegue y producción

---

**✅ Con estas herramientas de debugging, puedes resolver cualquier problema en tu plataforma inmobiliaria.**
