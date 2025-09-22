# 🏠 **Plataforma Inmobiliaria Completa**

> **Una plataforma completa de gestión inmobiliaria desarrollada con React, TypeScript y Supabase**

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.57.2-green.svg)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-yellow.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-blue.svg)](https://tailwindcss.com/)

---

## 🎯 **Descripción General**

Esta es una **plataforma inmobiliaria completa** diseñada para facilitar la gestión integral de propiedades en Chile. La aplicación permite a propietarios publicar propiedades para venta o arriendo, mientras que los interesados pueden explorar listados, hacer ofertas y postular a propiedades en arriendo.

### ✨ **Características Principales**

#### 🏠 **Para Propietarios**
- 📝 **Publicación de propiedades** (venta/arriendo)
- 📊 **Gestión de portafolio personal**
- 📋 **Revisión de postulaciones bidireccional**
- 💰 **Gestión completa de ofertas de compra**
- 📄 **Subida de documentos legales**
- 🖼️ **Gestión de imágenes con preview**
- 📲 **Notificaciones automáticas via webhooks**

#### 🏢 **Para Postulantes**
- 🔍 **Búsqueda avanzada de propiedades**
- 📝 **Sistema de postulaciones con garante**
- 💰 **Envío de ofertas de compra**
- ⭐ **Sistema de favoritos**
- 📱 **Interfaz mobile-friendly**
- 📊 **Seguimiento de postulaciones enviadas**

#### 🔐 **Sistema de Seguridad**
- 🔒 **Autenticación robusta con Supabase Auth**
- 🛡️ **Row Level Security (RLS) avanzado**
- 🔐 **Validación de RUT chileno**
- 📋 **Encriptación de datos sensibles**
- 🚫 **Arquitectura de providers mejorada**

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
2. Ejecuta la migración: `supabase/migrations/20250101000000_complete_real_estate_schema.sql`
3. Verifica que se crearon 8+ tablas y 2 buckets de storage

### **4. Iniciar Desarrollo**
```bash
npm run dev
# Acceder a: http://localhost:5173
```

---

## 📁 **Estructura del Proyecto**

```
plataforma_inmobiliaria/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 auth/           # Sistema de autenticación
│   │   ├── 📁 dashboard/      # Paneles de gestión avanzada
│   │   ├── 📁 marketplace/    # Marketplace con filtros
│   │   ├── 📁 portfolio/      # Gestión de portafolio
│   │   ├── 📁 profile/        # Perfiles completos
│   │   └── 📁 properties/     # Gestión completa de propiedades
│   ├── 📁 hooks/              # Custom hooks avanzados
│   ├── 📁 lib/                # Configuraciones y utilidades
│   └── 📄 App.tsx             # Aplicación con providers
├── 📁 supabase/
│   ├── 📁 migrations/         # Migraciones de BD
│   └── 📁 functions/          # Edge functions
├── 📄 package.json            # Dependencias actualizadas
└── 📄 vite.config.ts          # Configuración optimizada
```

---

## 🛠️ **Stack Tecnológico**

### **Frontend**
- ⚛️ **React 18.3.1** - Framework principal con hooks avanzados
- 🔷 **TypeScript 5.5.3** - Tipado estático completo
- 🎨 **Tailwind CSS 3.4.1** - Framework CSS moderno
- ⚡ **Vite 5.4.2** - Build tool optimizado
- 🧭 **React Router DOM 7.8.2** - Routing avanzado
- 🎯 **Lucide React 0.344.0** - Iconografía moderna

### **Backend & Base de Datos**
- 🗄️ **Supabase** - Backend-as-a-Service completo
- 🔐 **Supabase Auth** - Autenticación robusta
- 📊 **PostgreSQL** - Base de datos normalizada (3NF)
- 🗃️ **Supabase Storage** - Almacenamiento de archivos
- 🛡️ **Row Level Security** - Seguridad granular
- ⚡ **Edge Functions** - Lógica serverless

---

## 📚 **Documentación Completa**

La documentación está organizada en archivos especializados para facilitar la navegación:

### 🚀 **Configuración e Instalación**
- 📄 **[README-INSTALACION.md](README-INSTALACION.md)** - Guía completa de setup y configuración inicial
- 📄 **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones, fixes de BD y scripts de mantenimiento

### 🏗️ **Arquitectura y Desarrollo**
- 📄 **[README-ARQUITECTURA.md](README-ARQUITECTURA.md)** - Arquitectura técnica del sistema y base de datos
- 📄 **[README-DESARROLLO.md](README-DESARROLLO.md)** - Ejemplos prácticos, hooks avanzados y mejores prácticas
- 📄 **[README-API.md](README-API.md)** - APIs, webhooks, Edge Functions e integraciones externas

### 🔐 **Seguridad y Despliegue**
- 📄 **[README-SEGURIDAD.md](README-SEGURIDAD.md)** - RLS, autenticación, permisos y políticas de seguridad
- 📄 **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)** - Producción, optimización, CI/CD y monitoreo

### 🐛 **Debugging y Contribución**
- 📄 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Herramientas de debugging, troubleshooting y resolución de problemas
- 📄 **[README-CONTRIBUCION.md](README-CONTRIBUCION.md)** - Guías de contribución, testing, code review y estándares

---

## ✅ **Estado del Proyecto**

### **🚀 Funcionalidades Completadas**
- ✅ **Sistema de autenticación completo** con arquitectura robusta
- ✅ **Base de datos normalizada** con 8+ tablas y RLS avanzado
- ✅ **Gestión completa de propiedades** (venta/arriendo)
- ✅ **Sistema bidireccional de postulaciones** con garantes
- ✅ **Gestión completa de ofertas de compra**
- ✅ **Sistema de notificaciones** con integración n8n
- ✅ **Gestión de documentos y archivos**
- ✅ **Interfaz responsive moderna**
- ✅ **Configuración automática de storage**
- ✅ **Arquitectura escalable de providers**

### **📋 Funcionalidades en Desarrollo**
- [ ] 🔔 **Notificaciones push en tiempo real**
- [ ] 📱 **Aplicación móvil nativa**
- [ ] 🤖 **Chat integrado entre usuarios**
- [ ] 🗺️ **Mapa interactivo con geolocalización**
- [ ] 📈 **Analytics y reportes avanzados**
- [ ] 💳 **Integración de pagos**

---

## 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Vista previa de build

# Calidad de código
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos TypeScript

# Testing
npm run test         # Ejecutar tests
npm run test:ui      # Vitest UI
npm run test:coverage # Cobertura de tests

# Base de datos
supabase start       # Supabase local
supabase db push     # Aplicar migraciones
```

---

## 🎯 **Enlaces Rápidos**

- 🌐 **[Demo en Vivo](https://tu-demo.vercel.app)** - Ver la aplicación funcionando
- 📊 **[Dashboard Supabase](https://app.supabase.com)** - Panel de control de BD
- 📖 **[Documentación Supabase](https://supabase.com/docs)** - Referencia oficial
- 🐛 **[Issues](https://github.com/tu-repo/issues)** - Reportar problemas
- 💬 **[Discusiones](https://github.com/tu-repo/discussions)** - Comunidad

---

## 🤝 **Contribuir**

¡Las contribuciones son bienvenidas! Por favor lee **[README-CONTRIBUCION.md](README-CONTRIBUCION.md)** para conocer:

- 📋 Proceso de contribución
- 🧪 Estándares de testing
- 📝 Convenciones de código
- 🔍 Code review guidelines

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🆘 **Soporte**

¿Necesitas ayuda? Consulta la documentación:

1. 🚀 **Instalación**: [README-INSTALACION.md](README-INSTALACION.md)
2. 🐛 **Problemas**: [README-DEBUGGING.md](README-DEBUGGING.md)
3. 🏗️ **Arquitectura**: [README-ARQUITECTURA.md](README-ARQUITECTURA.md)
4. 💬 **Issues**: [GitHub Issues](https://github.com/tu-repo/issues)

---

**⭐ Si este proyecto te resulta útil, ¡dale una estrella en GitHub!**

*Desarrollado con ❤️ para la comunidad inmobiliaria chilena*