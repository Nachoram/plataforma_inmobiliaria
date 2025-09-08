# 🏠 **Plataforma Inmobiliaria Completa**

> **Una plataforma completa de gestión inmobiliaria desarrollada con React, TypeScript y Supabase**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.57.2-green.svg)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.8-yellow.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-blue.svg)](https://tailwindcss.com/)

---

## 📋 **Índice**
- [🎯 Descripción General](#-descripción-general)
- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🚀 Instalación Rápida](#-instalación-rápida)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🎨 Componentes Principales](#-componentes-principales)
- [🔧 Scripts Disponibles](#-scripts-disponibles)
- [📚 Documentación Adicional](#-documentación-adicional)
- [🎯 Próximos Pasos](#-próximos-pasos)

---

## 🎯 **Descripción General**

Esta es una **plataforma inmobiliaria completa** diseñada para facilitar la gestión integral de propiedades en Chile. La aplicación permite a propietarios publicar propiedades para venta o arriendo, mientras que los interesados pueden explorar listados, hacer ofertas y postular a propiedades en arriendo.

### 🎯 **Objetivos Principales**
- ✅ **Gestión completa de propiedades** (venta y arriendo)
- ✅ **Sistema de postulaciones con garantes**
- ✅ **Gestión de documentos legales**
- ✅ **Sistema de ofertas competitivo**
- ✅ **Interfaz moderna y responsiva**
- ✅ **Seguridad avanzada con RLS**
- ✅ **Integración completa con Supabase**

---

## ✨ **Características Principales**

### 🏠 **Para Propietarios**
- 📝 **Publicación de propiedades** (venta/arriendo)
- 📊 **Gestión de portafolio personal**
- 📋 **Revisión de postulaciones**
- 💰 **Gestión de ofertas recibidas**
- 📄 **Subida de documentos legales**
- 🖼️ **Gestión de imágenes de propiedades**

### 🏢 **Para Postulantes**
- 🔍 **Búsqueda avanzada de propiedades**
- 📝 **Sistema de postulaciones con garante**
- 💰 **Envío de ofertas de compra**
- ⭐ **Sistema de favoritos**
- 📱 **Interfaz mobile-friendly**

### 🔐 **Sistema de Seguridad**
- 🔒 **Autenticación robusta con Supabase Auth**
- 🛡️ **Row Level Security (RLS)**
- 🔐 **Validación de RUT chileno**
- 📋 **Encriptación de datos sensibles**
- 🚫 **Protección contra accesos no autorizados**

---

## 🛠️ **Tecnologías Utilizadas**

### **Frontend**
- ⚛️ **React 18.3.1** - Framework principal
- 🔷 **TypeScript 5.5.3** - Tipado estático
- 🎨 **Tailwind CSS 3.4.1** - Framework CSS
- ⚡ **Vite 5.4.8** - Build tool y dev server
- 🧭 **React Router DOM 7.8.2** - Routing
- 🎯 **Lucide React** - Iconos

### **Backend & Base de Datos**
- 🗄️ **Supabase** - Backend-as-a-Service
- 🔐 **Supabase Auth** - Autenticación
- 📊 **PostgreSQL** - Base de datos
- 🗃️ **Supabase Storage** - Almacenamiento de archivos
- 🛡️ **Row Level Security** - Seguridad a nivel fila

### **Herramientas de Desarrollo**
- 📝 **ESLint** - Linting
- 🎯 **TypeScript** - Compilación
- 📦 **npm** - Gestión de dependencias
- 🐙 **Git** - Control de versiones

---

## 🚀 **Instalación Rápida**

### **Prerrequisitos**
- 📦 **Node.js** v18+
- 🐙 **Git**
- ☁️ **Cuenta de Supabase**

### **1. Clonar y Instalar**
```bash
git clone <repository-url>
cd plataforma_inmobiliaria
npm install
```

### **2. Variables de Entorno**
```bash
# Crear archivo .env
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w
```

### **3. Configurar Base de Datos**
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Ejecuta la migración SQL en el SQL Editor
3. Archivo: `supabase/migrations/20250101000000_complete_real_estate_schema.sql`

### **4. Iniciar Desarrollo**
```bash
npm run dev
```

**Acceder a:** `http://localhost:5173`

---

## 📁 **Estructura del Proyecto**

```
plataforma_inmobiliaria/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 auth/           # Formularios de autenticación
│   │   ├── 📁 dashboard/      # Paneles de gestión
│   │   ├── 📁 marketplace/    # Marketplace principal
│   │   ├── 📁 portfolio/      # Gestión de portafolio
│   │   ├── 📁 profile/        # Perfiles de usuario
│   │   └── 📁 properties/     # Gestión de propiedades
│   ├── 📁 hooks/              # Custom hooks
│   ├── 📁 lib/                # Configuraciones y utilidades
│   └── 📄 App.tsx             # Aplicación principal
├── 📁 supabase/
│   └── 📁 migrations/         # Migraciones de base de datos
├── 📄 package.json            # Dependencias
├── 📄 vite.config.ts          # Configuración Vite
└── 📄 .env                    # Variables de entorno
```

---

## 🎨 **Componentes Principales**

### **📱 Layout Components**
- **`<Layout />`** - Layout principal con navegación
- **`<ProtectedRoute />`** - Protección de rutas autenticadas
- **`<AuthProvider />`** - Proveedor de contexto de autenticación

### **🏠 Property Components**
- **`<PropertyForm />`** - Formulario de publicación de propiedades
- **`<PropertyDetailsPage />`** - Página de detalles de propiedad
- **`<PublicPropertiesPage />`** - Listado público de propiedades
- **`<RentalPublicationForm />`** - Formulario específico para arriendos

### **📊 Dashboard Components**
- **`<PortfolioPage />`** - Portafolio personal del usuario
- **`<ApplicationsPage />`** - Gestión de postulaciones
- **`<OffersPage />`** - Gestión de ofertas
- **`<MyActivityPage />`** - Actividad personal

### **🔐 Authentication Components**
- **`<AuthPage />`** - Página de login/registro
- **`<AuthForm />`** - Formulario de autenticación
- **`<UserProfile />`** - Perfil de usuario

### **🛒 Marketplace Components**
- **`<MarketplacePage />`** - Página principal del marketplace
- **`<ApplicationModal />`** - Modal de postulación
- **`<OfferModal />`** - Modal de ofertas

---

## 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Vista previa de build

# Calidad de código
npm run lint         # Ejecuta ESLint

# Supabase (requiere CLI)
npx supabase start   # Inicia Supabase local
npx supabase db push # Aplica migraciones
```

---

## 📚 **Documentación Adicional**

Para información detallada sobre aspectos específicos:

### **📊 Base de Datos**
- 📄 **[DATABASE_SCHEMA_README.md](DATABASE_SCHEMA_README.md)** - Esquema completo de BD
- 📄 **[IMPLEMENTACION_GUIA.md](IMPLEMENTACION_GUIA.md)** - Guía de implementación
- 📄 **[DEBUG_REGISTRATION_README.md](DEBUG_REGISTRATION_README.md)** - Debugging de registro

### **🗂️ Archivos SQL de Debug**
- 📄 `debug_registration_step1.sql` - Primer paso del registro
- 📄 `debug_registration_step2.sql` - Segundo paso
- 📄 `debug_registration_step3.sql` - Tercer paso
- 📄 `debug_registration_step4.sql` - Cuarto paso
- 📄 `debug_registration_step5_success.sql` - Caso exitoso
- 📄 `debug_registration_step5_failure.sql` - Caso de error
- 📄 `debug_registration_rollback.sql` - Rollback

### **⚙️ Configuración**
- 📄 `src/lib/supabase.ts` - Configuración de Supabase
- 📄 `vite.config.ts` - Configuración de Vite
- 📄 `tailwind.config.js` - Configuración de Tailwind
- 📄 `.env` - Variables de entorno

---

## 🎯 **Próximos Pasos**

### **🚀 Funcionalidades Implementadas**
- ✅ Sistema de autenticación completo
- ✅ Gestión de perfiles de usuario
- ✅ Publicación de propiedades
- ✅ Sistema de postulaciones
- ✅ Gestión de documentos
- ✅ Interfaz responsive
- ✅ Base de datos normalizada

### **📋 Próximas Funcionalidades**
- [ ] 🔔 **Notificaciones en tiempo real**
- [ ] 📱 **Aplicación móvil nativa**
- [ ] 🤖 **Chat integrado**
- [ ] 📊 **Dashboard administrativo**
- [ ] 🗺️ **Mapa interactivo**
- [ ] 📈 **Analytics y reportes**

---

## 🤝 **Contribución**

### **Proceso de Contribución**
1. 🍴 **Fork** el proyecto
2. 🌿 **Crear rama** para tu feature
3. 💻 **Desarrollar** la funcionalidad
4. 📝 **Escribir tests** si es necesario
5. 🔍 **Revisar linting** y tipos
6. 📤 **Pull Request** con descripción detallada

### **Estándares de Código**
- ✅ **Commits** descriptivos en español
- 📋 **Issues** bien documentados
- 🔍 **Code review** obligatorio
- 📚 **Documentación** actualizada

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🎯 **Soporte y Contacto**

Para soporte técnico o consultas sobre desarrollo:

- 💬 **Issues:** GitHub Issues
- 📖 **Documentación:** Wiki del proyecto

---

**⭐ Si este proyecto te resulta útil, ¡dale una estrella en GitHub!**

*Desarrollado con ❤️ para la comunidad inmobiliaria chilena*