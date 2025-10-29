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

# Configuración de contratos (requerida para generar contratos automáticamente)
VITE_N8N_CONTRACT_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/generate-contract

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
# ⚠️ REQUERIDAS - SIN ESTAS VARIABLES LA APLICACIÓN NO FUNCIONARÁ
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima

# ⚠️ REQUERIDA PARA FUNCIONALIDAD DE CONTRATOS
VITE_N8N_CONTRACT_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/generate-contract
```

### **Configuración de Supabase**

#### **Obtener Credenciales de Supabase**
1. Ve a [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia los siguientes valores:
   - **Project URL** (para VITE_SUPABASE_URL)
   - **anon public** key (para VITE_SUPABASE_ANON_KEY)

#### **Ejemplo de Configuración**
```env
# Ejemplo real de configuración
VITE_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.ejemplo-de-clave-anonima"
```

#### **Verificación de Configuración**
Una vez configurado correctamente, deberías ver en la consola:
```
✅ Configuración de entorno validada correctamente
🌐 Supabase URL: https://tu-proyecto.supabase.co
🔑 Clave anónima: Presente ✓
```

#### **Notas Importantes de Configuración**
- ⚠️ Las variables **DEBEN** comenzar con `VITE_` para que Vite las reconozca
- ⚠️ No incluyas espacios alrededor del signo `=`
- ⚠️ No uses comillas simples, solo comillas dobles
- ⚠️ El archivo `.env` debe estar en la raíz del proyecto
- ⚠️ **NUNCA** subas el archivo `.env` a Git (ya está en .gitignore)
- ⚠️ **MUY IMPORTANTE**: Después de crear o modificar el archivo `.env`, debes reiniciar el servidor de desarrollo

### **Variables Opcionales**
```env
# 📧 Webhooks y Notificaciones (opcional)
VITE_RAILWAY_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook-test/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb

# 🐛 Desarrollo (opcional)
VITE_DEBUG_MODE=true
VITE_ENABLE_LOGGER=true

# 📊 Analytics (opcional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://tu-sentry-dsn
```

### **Configuración de Webhooks**

#### **Webhook de Contratos (N8N)**
- ⚠️ **Variable Requerida**: `VITE_N8N_CONTRACT_WEBHOOK_URL`
- 📄 **Propósito**: Generar contratos automáticamente usando n8n
- 📋 **Configuración**: Ver [INSTRUCCIONES_CONTRATOS_WORKFLOW_N8N.md](INSTRUCCIONES_CONTRATOS_WORKFLOW_N8N.md)

#### **Estado Actual del Webhook de Notificaciones**
- ✅ **URL Configurada**: `VITE_RAILWAY_WEBHOOK_URL` está configurada
- ⚠️ **Modo Prueba**: El webhook está en modo test en n8n
- 🔄 **Activación**: Para producción, activar el workflow en n8n

#### **Eventos Soportados**
- `application_received` - Nueva postulación
- `application_approved` - Postulación aprobada
- `application_rejected` - Postulación rechazada
- `offer_received` - Nueva oferta
- `offer_accepted` - Oferta aceptada
- `offer_rejected` - Oferta rechazada

#### **Configuración de N8N para Contratos**
Para habilitar la generación automática de contratos:

1. **Configurar Workflow en N8N**
   - Crear un workflow que reciba datos de contrato
   - Configurar webhook trigger
   - Procesar la información y generar PDF/HTML

2. **Obtener URL del Webhook**
   - Activar el workflow en n8n
   - Copiar la URL del webhook endpoint
   - Agregar a `VITE_N8N_CONTRACT_WEBHOOK_URL`

3. **Campos Requeridos en el Payload**
   - `property_type_characteristics_id` (UUID obligatorio)
   - `rental_owner_characteristic_id` (ID único del propietario)
   - `application_characteristic_id` (ID único de la postulación)
   - Datos completos del contrato (fechas, montos, condiciones)

#### **Test de Webhook**
```typescript
// Test en consola del navegador
import { webhookClient } from './src/lib/webhook';

// Verificar configuración
console.log('Webhook URL:', import.meta.env.VITE_RAILWAY_WEBHOOK_URL);

// Test de conectividad (opcional)
const testWebhook = async () => {
  try {
    await webhookClient.send({
      action: 'test',
      status: 'test',
      timestamp: new Date().toISOString(),
      property: { id: 'test' },
      property_owner: { id: 'test' },
      metadata: { source: 'test' }
    });
    console.log('✅ Webhook test successful');
  } catch (error) {
    console.log('⚠️ Webhook test failed (expected in test mode):', error.message);
  }
};

testWebhook();
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
console.log('CONTRACT_WEBHOOK_URL:', import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL);
console.log('NOTIFICATION_WEBHOOK_URL:', import.meta.env.VITE_RAILWAY_WEBHOOK_URL);
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

**Pasos Detallados:**
1. **Crear archivo .env** en la raíz del proyecto (mismo nivel que `package.json`)
2. **Obtener credenciales** de Supabase Dashboard > Settings > API
3. **Configurar variables** con el formato correcto:
   ```env
   VITE_SUPABASE_URL="https://tu-proyecto-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="tu-clave-anonima-aqui"
   ```
4. **Reiniciar servidor** completamente (Ctrl + C, luego `npm run dev`)

**Verificaciones Adicionales:**
- ✅ El archivo se llama exactamente `.env` (con punto)
- ✅ Está en la raíz del proyecto
- ✅ Las variables comienzan con `VITE_`
- ✅ No hay espacios alrededor del `=`
- ✅ Se usan comillas dobles, no simples

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

### **Error: "URL del webhook no configurada"**

**Causa:** Falta variable de entorno `VITE_N8N_CONTRACT_WEBHOOK_URL`

**Solución:**
1. Crear o editar el archivo `.env` en la raíz del proyecto
2. Agregar la variable:
   ```env
   VITE_N8N_CONTRACT_WEBHOOK_URL=https://tu-n8n-instance.com/webhook/generate-contract
   ```
3. Reiniciar el servidor de desarrollo
4. Ver [INSTRUCCIONES_CONTRATOS_WORKFLOW_N8N.md](INSTRUCCIONES_CONTRATOS_WORKFLOW_N8N.md) para configuración completa

### **Error: "propertyData is not defined"**

**Causa:** Datos de propiedad incompletos o consulta fallida

**Soluciones:**
1. Verificar que la propiedad tenga `property_type_characteristics_id` asignado
2. Ejecutar migraciones de actualización de propiedades legacy:
   ```sql
   -- Archivo: supabase/migrations/20251029010000_update_legacy_properties_with_uuid.sql
   ```
3. Verificar que el propietario tenga `rental_owner_characteristic_id`:
   ```sql
   -- Archivo: supabase/migrations/20251029020000_ensure_rental_owner_characteristic_ids.sql
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

---

## 🎯 **Próximos Pasos**

Una vez completada la instalación:

1. 🏗️ **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Entender la arquitectura del sistema
2. 💻 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Comenzar a desarrollar
3. 📖 **[README-API.md](README-API.md)** - Conocer las APIs disponibles
4. 🔐 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - Configurar seguridad

---

**✅ ¡Instalación completada! Ya puedes comenzar a desarrollar tu plataforma inmobiliaria.**
