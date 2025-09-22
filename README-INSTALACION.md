# 🚀 **Guía de Instalación y Configuración**

> **Instalación completa paso a paso de la Plataforma Inmobiliaria**

---

## 📋 **Índice**
- [🔧 Prerrequisitos](#-prerrequisitos)
- [⚡ Instalación Rápida](#-instalación-rápida)
- [🗄️ Configuración de Base de Datos](#️-configuración-de-base-de-datos)
- [🔐 Configuración de Autenticación](#-configuración-de-autenticación)
- [📁 Configuración de Storage](#-configuración-de-storage)
- [🌍 Variables de Entorno](#-variables-de-entorno)
- [🧪 Verificación de Instalación](#-verificación-de-instalación)
- [🚨 Solución de Problemas](#-solución-de-problemas)

---

## 🔧 **Prerrequisitos**

### **Software Requerido**
- 📦 **Node.js v18 o superior** - [Descargar](https://nodejs.org/)
- 🐙 **Git** - [Descargar](https://git-scm.com/)
- 💻 **Editor de código** (VSCode recomendado)

### **Servicios Externos**
- ☁️ **Cuenta de Supabase** - [Registrarse](https://supabase.com/)
- 🌐 **Cuenta de GitHub** (para deploy)

### **Verificar Instalaciones**
```bash
node --version    # v18.0.0 o superior
npm --version     # v9.0.0 o superior
git --version     # v2.30.0 o superior
```

---

## ⚡ **Instalación Rápida**

### **Paso 1: Clonar el Repositorio**
```bash
git clone <repository-url>
cd plataforma_inmobiliaria
```

### **Paso 2: Instalar Dependencias**
```bash
npm install
```

**Dependencias principales instaladas:**
- ⚛️ React 18.3.1
- 🔷 TypeScript 5.5.3
- 🎨 Tailwind CSS 3.4.1
- ⚡ Vite 5.4.2
- 🗄️ Supabase 2.57.2
- 🧭 React Router DOM 7.8.2

### **Paso 3: Variables de Entorno**
```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env
```

**Contenido del archivo .env:**
```env
# Configuración de Supabase
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w

# Configuración opcional de notificaciones
VITE_RAILWAY_WEBHOOK_URL=https://tu-n8n-webhook.com/webhook/real-estate-events
```

### **Paso 4: Iniciar Desarrollo**
```bash
npm run dev
```

✅ **La aplicación estará disponible en:** `http://localhost:5173`

---

## 🗄️ **Configuración de Base de Datos**

### **Paso 1: Acceder al Dashboard de Supabase**
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **New query**

### **Paso 2: Ejecutar Migración Principal**
```bash
# Archivo de migración
supabase/migrations/20250101000000_complete_real_estate_schema.sql
```

**Instrucciones:**
1. **Copia TODO el contenido** del archivo de migración
2. **Pega en SQL Editor** de Supabase
3. **Ejecuta** presionando "Run"
4. **Verifica** que no hay errores

### **Paso 3: Verificar Tablas Creadas**
```sql
-- Verificar tablas principales
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

**Tablas esperadas (8+ tablas):**
- ✅ `profiles` - Perfiles de usuario
- ✅ `properties` - Propiedades
- ✅ `applications` - Postulaciones
- ✅ `offers` - Ofertas de compra
- ✅ `guarantors` - Garantes
- ✅ `documents` - Documentos
- ✅ `property_images` - Imágenes de propiedades
- ✅ `user_favorites` - Favoritos

### **Paso 4: Verificar Triggers y Funciones**
```sql
-- Verificar trigger de creación de perfiles
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%profile%';
```

**Resultado esperado:**
- ✅ `on_auth_user_created` - Trigger para crear perfiles automáticamente

---

## 🔐 **Configuración de Autenticación**

### **Configuración en Supabase Dashboard**

#### **1. Authentication → URL Configuration**
```json
{
  "Site URL": "https://tu-dominio.com",
  "Redirect URLs": [
    "http://localhost:5173/**",
    "https://tu-dominio.vercel.app/**"
  ]
}
```

#### **2. Authentication → Providers → Email**
- ✅ **Habilitar Email Provider**
- ❌ **Desactivar "Confirm email"** (para desarrollo)
- ✅ **Activar "Secure email change enabled"**

#### **3. Authentication → Settings**
```json
{
  "JWT Expiry": 3600,
  "Refresh Token Rotation": true,
  "Session Timeout": 3600
}
```

### **Verificar Configuración de Auth**
```typescript
// Test en consola del navegador
import { supabase } from './src/lib/supabase';

// Verificar configuración
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Anon Key exists:', !!supabase.supabaseKey);

// Test de registro
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
});
console.log('Signup test:', { data, error });
```

---

## 📁 **Configuración de Storage**

### **Buckets Creados Automáticamente**
La migración crea automáticamente los siguientes buckets:

#### **1. property-images (Público)**
- **Propósito**: Imágenes de propiedades
- **Acceso**: Público para lectura, autenticado para escritura
- **Tipos**: JPEG, PNG, WebP, GIF
- **Límite**: 10MB por archivo

#### **2. user-documents (Privado)**
- **Propósito**: Documentos de usuarios y aplicaciones
- **Acceso**: Privado, solo el propietario
- **Tipos**: PDF, DOC, DOCX, JPEG, PNG
- **Límite**: 50MB por archivo

### **Verificar Storage**
```sql
-- Ver buckets creados
SELECT * FROM storage.buckets;

-- Ver políticas de storage
SELECT * FROM storage.policies;
```

### **Test de Upload**
```javascript
// Test en consola del navegador
const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

const { data, error } = await supabase.storage
  .from('property-images')
  .upload(`test/${Date.now()}.txt`, testFile);

console.log('Upload test:', { data, error });
```

---

## 🌍 **Variables de Entorno**

### **Variables Requeridas**
```env
# ⚠️ REQUERIDAS
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### **Variables Opcionales**
```env
# 📧 Notificaciones (opcional)
VITE_RAILWAY_WEBHOOK_URL=https://tu-webhook-n8n.com

# 🐛 Desarrollo (opcional)
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGER=true

# 📊 Analytics (opcional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://tu-sentry-dsn
```

### **Configuración por Entorno**

#### **Desarrollo (.env.local)**
```env
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...desarrollo
VITE_DEBUG_MODE=true
```

#### **Producción (.env.production)**
```env
VITE_SUPABASE_URL=https://tu-prod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...produccion
NODE_ENV=production
```

### **Verificar Variables**
```typescript
// Test en consola del navegador
console.log('Environment Variables:');
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('WEBHOOK_URL:', import.meta.env.VITE_RAILWAY_WEBHOOK_URL);
```

---

## 🧪 **Verificación de Instalación**

### **Test Completo de Funcionalidades**

#### **1. Test de Base de Datos**
```bash
# Accede a http://localhost:5173/demo
# Deberías ver formularios funcionando sin errores 403/406
```

#### **2. Test de Autenticación**
```typescript
// En consola del navegador
const testAuth = async () => {
  try {
    // Test de registro
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test123456'
    });
    console.log('Signup:', { data: signUpData, error: signUpError });

    // Test de login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });
    console.log('Signin:', { data: signInData, error: signInError });

  } catch (error) {
    console.error('Auth test failed:', error);
  }
};

testAuth();
```

#### **3. Test de Storage**
```typescript
// Test de upload de imagen
const testImageUpload = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  
  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
    
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(`test/${Date.now()}.jpg`, file);
      
    console.log('Image upload test:', { data, error });
  });
};

testImageUpload();
```

### **Checklist de Verificación**

#### ✅ **Backend/Database**
- [ ] Supabase proyecto conectado
- [ ] 8+ tablas creadas en PostgreSQL
- [ ] Trigger de profiles funcionando
- [ ] RLS policies activadas
- [ ] Storage buckets creados

#### ✅ **Frontend**
- [ ] Aplicación inicia sin errores
- [ ] Variables de entorno cargadas
- [ ] Rutas principales accesibles
- [ ] Componentes renderizan correctamente
- [ ] Auth provider inicializa

#### ✅ **Funcionalidades Core**
- [ ] Registro de usuario funciona
- [ ] Login/logout funciona
- [ ] Creación de perfil automática
- [ ] Formularios sin errores 403/406
- [ ] Upload de imágenes funciona
- [ ] Upload de documentos funciona

---

## 🚨 **Solución de Problemas**

### **Error: "Supabase URL or Anon Key is missing"**

**Causa:** Variables de entorno no configuradas correctamente

**Solución:**
1. Verificar que existe el archivo `.env` en la raíz
2. Verificar que las variables tienen el prefijo `VITE_`
3. Reiniciar el servidor de desarrollo

```bash
# Verificar archivo .env
cat .env

# Reiniciar servidor
npm run dev
```

### **Error: "relation 'public.profiles' does not exist"**

**Causa:** Migración de base de datos no ejecutada

**Solución:**
1. Ve al SQL Editor de Supabase
2. Ejecuta la migración completa
3. Verifica que todas las tablas se crearon

```sql
-- Verificar tablas
\dt public.*

-- O desde SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### **Error: "useAuth must be used within an AuthProvider"**

**Causa:** Arquitectura de providers mal configurada

**Solución:** Verificar que la estructura de `AppProviders` esté correcta:

```typescript
// src/App.tsx debe usar AppProviders
function App() {
  return <AppProviders />;
}

// src/components/AppProviders.tsx
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

### **Error: "403 Forbidden" en operaciones CRUD**

**Causa:** Políticas RLS bloqueando operaciones

**Solución:**
1. Verificar que el usuario esté autenticado
2. Aplicar migrations de fix de RLS si es necesario
3. Ver [README-MIGRACIONES.md](README-MIGRACIONES.md)

### **Error: "Upload failed" en Storage**

**Causa:** Políticas de storage incorrectas

**Solución:**
```sql
-- Verificar políticas de storage
SELECT * FROM storage.policies WHERE bucket_id = 'property-images';

-- Si faltan políticas, ejecutar migración de storage
```

### **Error: "Connection refused" o problemas de red**

**Causa:** URL o configuración de Supabase incorrecta

**Solución:**
1. Verificar URL en Supabase Dashboard
2. Verificar que el proyecto esté activo
3. Comprobar firewall/antivirus

### **Problemas de Performance**

**Síntomas:** Carga lenta, timeouts

**Soluciones:**
1. Verificar índices de base de datos
2. Optimizar consultas
3. Implementar caché
4. Ver [README-DESPLIEGUE.md](README-DESPLIEGUE.md)

---

## 📞 **Obtener Ayuda**

### **Recursos de Documentación**
- 📖 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Guía completa de debugging
- 🏗️ **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Documentación técnica
- 🔐 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - Configuración de permisos

### **Enlaces Útiles**
- 🌐 **[Supabase Documentation](https://supabase.com/docs)**
- ⚛️ **[React Documentation](https://react.dev/)**
- 🎨 **[Tailwind CSS](https://tailwindcss.com/docs)**
- 🔷 **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**

### **Comunidad y Soporte**
- 💬 **[GitHub Issues](https://github.com/tu-repo/issues)** - Reportar problemas
- 🗨️ **[GitHub Discussions](https://github.com/tu-repo/discussions)** - Preguntas generales
- 📧 **Email**: soporte@tu-dominio.com

---

**✅ Una vez completada la instalación, consulta [README-DESARROLLO.md](README-DESARROLLO.md) para comenzar a desarrollar.**
