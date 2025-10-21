# 🚀 **Despliegue y Producción**

> **Guía completa para llevar tu plataforma inmobiliaria a producción**

---

## 📋 **Índice**
- [🌐 Plataformas de Despliegue](#-plataformas-de-despliegue)
- [⚙️ Configuración de Producción](#️-configuración-de-producción)
- [🏗️ Build y Optimización](#️-build-y-optimización)
- [🔐 Variables de Entorno](#-variables-de-entorno)
- [📊 Monitoreo y Analytics](#-monitoreo-y-analytics)
- [🛡️ Seguridad en Producción](#️-seguridad-en-producción)
- [🚨 Mantenimiento y Backups](#-mantenimiento-y-backups)
- [🔄 CI/CD y Automatización](#-cicd-y-automatización)

---

## 🌐 **Plataformas de Despliegue**

### **Vercel (Recomendado)**

#### **Configuración Automática**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_RAILWAY_WEBHOOK_URL": "@railway_webhook_url"
  }
}
```

#### **Scripts de Build**
```json
// package.json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "npm run build && npx vite-bundle-analyzer",
    "build:preview": "npm run build && vite preview",
    "deploy:vercel": "npm run build && vercel --prod",
    "deploy:preview": "npm run build && vercel"
  }
}
```

#### **Comandos de Despliegue**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Configurar proyecto
vercel

# Deploy de preview
npm run deploy:preview

# Deploy a producción
npm run deploy:vercel

# Configurar variables de entorno
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_RAILWAY_WEBHOOK_URL
```

### **Netlify**

#### **Configuración netlify.toml**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Formularios de contacto (opcional)
[[forms]]
  name = "contact"

# Edge functions (si se necesitan)
[[edge_functions]]
  function = "property-webhook"
  path = "/api/webhook/*"
```

#### **Comandos de Despliegue Netlify**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Configurar proyecto
netlify init

# Deploy de preview
netlify deploy

# Deploy a producción
netlify deploy --prod

# Configurar variables
netlify env:set VITE_SUPABASE_URL "tu_url_de_supabase"
netlify env:set VITE_SUPABASE_ANON_KEY "tu_clave_anon"
```

### **Railway**

#### **railway.toml**
```toml
[build]
  builder = "nixpacks"
  buildCommand = "npm run build"

[deploy]
  startCommand = "npm run preview"
  healthcheckPath = "/"
  healthcheckTimeout = 300

[environment]
  NODE_ENV = "production"
  PORT = "3000"

[variables]
  VITE_SUPABASE_URL = "${{VITE_SUPABASE_URL}}"
  VITE_SUPABASE_ANON_KEY = "${{VITE_SUPABASE_ANON_KEY}}"
  VITE_RAILWAY_WEBHOOK_URL = "${{RAILWAY_PUBLIC_DOMAIN}}"
```

#### **Server para Railway**
```javascript
// server.js (para Railway)
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(join(__dirname, 'dist')));

// Manejar rutas SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **Docker Deployment**

#### **Dockerfile**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### **nginx.conf para Docker**
```nginx
# docker/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options DENY always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

#### **docker-compose.yml**
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Proxy (opcional para SSL)
  proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./proxy.conf:/etc/nginx/nginx.conf
    depends_on:
      - web
    restart: unless-stopped
```

---

## ⚙️ **Configuración de Producción**

### **Vite Configuration**

#### **vite.config.ts Optimizado**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react({
        // Optimize React in production
        babel: isProduction ? {
          plugins: [
            ['transform-remove-console', { exclude: ['error', 'warn'] }]
          ]
        } : undefined
      })
    ],
    
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@lib': resolve(__dirname, 'src/lib'),
        '@hooks': resolve(__dirname, 'src/hooks')
      }
    },

    build: {
      // Optimize build for production
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction,
      
      // Chunk splitting strategy
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'react-hook-form'],
            utils: ['date-fns', 'clsx']
          }
        }
      },
      
      // Optimize assets
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1000,
      
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log']
        }
      } : undefined
    },

    // Development server
    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: false
      }
    },

    // Preview server (for testing production builds)
    preview: {
      port: 3000,
      host: true
    },

    // Environment variables
    define: {
      __DEV__: !isProduction,
      __VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  };
});
```

### **Performance Optimization**

#### **Code Splitting**
```typescript
// src/lib/lazyComponents.ts
import { lazy } from 'react';

// Lazy load heavy components
export const PropertiesPage = lazy(() => 
  import('@/components/properties/PropertiesPage')
    .then(module => ({ default: module.PropertiesPage }))
);

export const MarketplacePage = lazy(() => 
  import('@/components/panel/PanelPage')
    .then(module => ({ default: module.PanelPage }))
);

export const AdminDashboard = lazy(() => 
  import('@/components/admin/AdminDashboard')
    .then(module => ({ default: module.AdminDashboard }))
);

// Preload components on user interaction
export const preloadComponent = (componentImport: () => Promise<any>) => {
  return componentImport();
};

// Preload on hover
export const usePreloadOnHover = (preload: () => void) => {
  return {
    onMouseEnter: preload,
    onTouchStart: preload
  };
};
```

#### **Image Optimization**
```typescript
// src/components/common/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  lazy = true,
  className
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const getOptimizedUrl = (originalUrl: string, w?: number, h?: number) => {
    // For Supabase Storage, you can add transformation parameters
    if (originalUrl.includes('supabase.co')) {
      const params = new URLSearchParams();
      if (w) params.set('width', w.toString());
      if (h) params.set('height', h.toString());
      params.set('quality', '80');
      params.set('format', 'webp');
      
      return `${originalUrl}?${params.toString()}`;
    }
    return originalUrl;
  };

  const optimizedSrc = getOptimizedUrl(src, width, height);

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Image not available</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};
```

#### **Bundle Analysis**
```bash
# Instalar analizador de bundle
npm install -D vite-bundle-analyzer

# Agregar script al package.json
"analyze": "vite-bundle-analyzer"

# Ejecutar análisis
npm run build
npm run analyze
```

---

## 🔗 **Configuración de Webhooks en Producción**

### **Activación de Webhooks**

#### **Estado Actual**
- ✅ **URL Configurada**: `VITE_RAILWAY_WEBHOOK_URL` está configurada
- ⚠️ **Modo Prueba**: El webhook está en modo test en n8n
- 🔄 **Activación**: Para producción, activar el workflow en n8n

#### **Pasos para Activar en Producción**

1. **Acceder a n8n/Railway**
   ```bash
   # URL del webhook actual
   https://primary-production-bafdc.up.railway.app/webhook-test/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
   ```

2. **Activar el Workflow**
   - Ir a la interfaz de n8n
   - Buscar el workflow "Real Estate Notifications"
   - Cambiar de modo "Test" a "Production"
   - Activar el workflow

3. **Verificar Configuración**
   ```typescript
   // Test de webhook en producción
   const testProductionWebhook = async () => {
     try {
       await webhookClient.send({
         action: 'test',
         status: 'test',
         timestamp: new Date().toISOString(),
         property: { id: 'test' },
         property_owner: { id: 'test' },
         metadata: { source: 'production_test' }
       });
       console.log('✅ Production webhook test successful');
     } catch (error) {
       console.error('❌ Production webhook test failed:', error);
     }
   };
   ```

#### **Eventos Soportados en Producción**
- `application_received` - Nueva postulación
- `application_approved` - Postulación aprobada
- `application_rejected` - Postulación rechazada
- `offer_received` - Nueva oferta
- `offer_accepted` - Oferta aceptada
- `offer_rejected` - Oferta rechazada

#### **Monitoreo de Webhooks**
```typescript
// src/lib/webhookMonitoring.ts
export const monitorWebhookHealth = async () => {
  const webhookUrl = import.meta.env.VITE_RAILWAY_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('⚠️ Webhook URL not configured');
    return { status: 'not_configured' };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HealthCheck/1.0'
      },
      body: JSON.stringify({
        action: 'health_check',
        timestamp: new Date().toISOString()
      })
    });

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      responseTime: Date.now()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};
```

---

## 🏗️ **Build y Optimización**

### **Build Scripts Avanzados**

#### **Scripts de Optimización**
```json
// package.json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "npm run build && npx vite-bundle-analyzer",
    "build:profile": "npm run build -- --profile",
    "build:stats": "npm run build -- --stats",
    "optimize:images": "node scripts/optimize-images.js",
    "optimize:deps": "npm run build && npm audit --audit-level high",
    "precommit:build": "npm run build && npm run test:unit",
    "postbuild": "npm run optimize:images && npm run build:stats"
  }
}
```

#### **Image Optimization Script**
```javascript
// scripts/optimize-images.js
import sharp from 'sharp';
import { glob } from 'glob';
import { promises as fs } from 'fs';
import path from 'path';

const optimizeImages = async () => {
  console.log('🖼️  Optimizing images...');
  
  // Find all images in dist directory
  const images = await glob('dist/**/*.{jpg,jpeg,png}');
  
  for (const imagePath of images) {
    const ext = path.extname(imagePath).toLowerCase();
    const nameWithoutExt = path.basename(imagePath, ext);
    const dir = path.dirname(imagePath);
    
    try {
      // Create WebP version
      await sharp(imagePath)
        .webp({ quality: 80 })
        .toFile(path.join(dir, `${nameWithoutExt}.webp`));
      
      // Optimize original
      if (ext === '.png') {
        await sharp(imagePath)
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(`${imagePath}.tmp`);
      } else {
        await sharp(imagePath)
          .jpeg({ quality: 80, progressive: true })
          .toFile(`${imagePath}.tmp`);
      }
      
      // Replace original with optimized
      await fs.rename(`${imagePath}.tmp`, imagePath);
      
      console.log(`✅ Optimized: ${imagePath}`);
    } catch (error) {
      console.error(`❌ Failed to optimize ${imagePath}:`, error.message);
    }
  }
  
  console.log('✨ Image optimization complete!');
};

optimizeImages().catch(console.error);
```

### **Asset Optimization**

#### **Static Asset Strategy**
```typescript
// src/lib/assets.ts
export const ASSET_URLS = {
  // Use CDN for common assets
  PLACEHOLDER_IMAGE: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&crop=center',
  DEFAULT_AVATAR: '/assets/default-avatar.svg',
  LOGO: '/assets/logo.svg',
  FAVICON: '/assets/favicon.ico'
} as const;

// Preload critical assets
export const preloadCriticalAssets = () => {
  const criticalAssets = [
    ASSET_URLS.LOGO,
    '/assets/hero-bg.webp'
  ];

  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset;
    link.as = asset.endsWith('.webp') || asset.endsWith('.jpg') ? 'image' : 'fetch';
    document.head.appendChild(link);
  });
};

// Lazy load non-critical images
export const lazyLoadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};
```

---

## 🔐 **Variables de Entorno**

### **Production Environment**

#### **Variables de Entorno Requeridas**
```env
# .env.production
NODE_ENV=production

# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Configuración de Supabase en Producción**

**Obtener Credenciales de Producción:**
1. Ve a [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
2. Selecciona tu proyecto de producción
3. Ve a **Settings** > **API**
4. Copia los valores para producción:
   - **Project URL** (para VITE_SUPABASE_URL)
   - **anon public** key (para VITE_SUPABASE_ANON_KEY)

**Verificar Configuración:**
```typescript
// Test de configuración en producción
const verifySupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔧 Supabase Production Config:');
  console.log('- URL configured:', !!url);
  console.log('- Key configured:', !!key);
  console.log('- URL format valid:', url?.startsWith('https://') && url?.includes('.supabase.co'));
  console.log('- Key format valid:', key?.startsWith('eyJ'));
  
  if (!url || !key) {
    console.error('❌ Supabase configuration incomplete');
    return false;
  }
  
  console.log('✅ Supabase configuration valid');
  return true;
};
```

# Webhook Configuration
VITE_RAILWAY_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook-test/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb

# Security Configuration
VITE_APP_DOMAIN=https://tu-dominio.com
VITE_API_BASE_URL=https://tu-api.com/api

# Analytics (opcional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Rate Limiting
VITE_API_RATE_LIMIT=100
VITE_UPLOAD_RATE_LIMIT=10

# Cache Configuration
VITE_CACHE_TTL=300
VITE_STATIC_CACHE_TTL=86400
```

#### **Environment Validation**
```typescript
// src/config/envValidation.ts
import { z } from 'zod';

const envSchema = z.object({
  // Supabase (required)
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL').refine(
    (url) => url.includes('.supabase.co'),
    'Supabase URL must be a valid Supabase project URL'
  ),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required').refine(
    (key) => key.startsWith('eyJ'),
    'Supabase anon key must be a valid JWT token'
  ),
  
  // App configuration
  VITE_APP_DOMAIN: z.string().url().optional(),
  VITE_API_BASE_URL: z.string().url().optional(),
  
  // Webhook
  VITE_RAILWAY_WEBHOOK_URL: z.string().url().optional(),
  
  // Analytics
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().url().optional(),
  
  // Feature flags
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_ERROR_TRACKING: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').default('false'),
  
  // Rate limiting
  VITE_API_RATE_LIMIT: z.string().transform(Number).default('100'),
  VITE_UPLOAD_RATE_LIMIT: z.string().transform(Number).default('10'),
  
  // Cache
  VITE_CACHE_TTL: z.string().transform(Number).default('300'),
  VITE_STATIC_CACHE_TTL: z.string().transform(Number).default('86400')
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validateEnv = (): EnvConfig => {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    
    throw new Error('Environment validation failed');
  }
};

// Export validated config
export const ENV = validateEnv();
```

### **Secrets Management**

#### **GitHub Actions Secrets**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_RAILWAY_WEBHOOK_URL: ${{ secrets.VITE_RAILWAY_WEBHOOK_URL }}
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 📊 **Monitoreo y Analytics**

### **Error Tracking con Sentry**

#### **Configuración de Sentry**
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { ENV } from '@/config/envValidation';

export const initSentry = () => {
  if (!ENV.VITE_ENABLE_ERROR_TRACKING || !ENV.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: ENV.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false
      })
    ],
    
    // Performance Monitoring
    tracesSampleRate: 0.1,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    environment: import.meta.env.MODE,
    
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Skip network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          return null;
        }
        
        // Skip cancelled requests
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }
      }
      
      return event;
    }
  });
};

// Error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Algo salió mal
          </h1>
          <p className="text-gray-600 mb-4">
            Se ha producido un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          <button
            onClick={resetError}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    ),
    showDialog: false
  }
);
```

### **Google Analytics 4**

#### **Configuración de GA4**
```typescript
// src/lib/analytics.ts
import { ENV } from '@/config/envValidation';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const initGoogleAnalytics = () => {
  if (!ENV.VITE_ENABLE_ANALYTICS || !ENV.VITE_GA_MEASUREMENT_ID) {
    return;
  }

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ENV.VITE_GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args) {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', ENV.VITE_GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href
  });
};

// Custom event tracking
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!ENV.VITE_ENABLE_ANALYTICS) return;
  
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
};

// Page view tracking
export const trackPageView = (path: string, title?: string) => {
  if (!ENV.VITE_ENABLE_ANALYTICS) return;
  
  window.gtag?.('config', ENV.VITE_GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title || document.title
  });
};

// Ecommerce tracking
export const trackPurchase = (transactionId: string, value: number, currency: string = 'CLP') => {
  if (!ENV.VITE_ENABLE_ANALYTICS) return;
  
  window.gtag?.('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency
  });
};

// Custom React hook
export const useAnalytics = () => {
  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackPropertyView: (propertyId: string) => 
      trackEvent('view_item', 'property', propertyId),
    trackPropertyContact: (propertyId: string) => 
      trackEvent('generate_lead', 'property', propertyId),
    trackSearchProperty: (searchTerm: string) => 
      trackEvent('search', 'property', searchTerm)
  };
};
```

### **Performance Monitoring**

#### **Web Vitals**
```typescript
// src/lib/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { ENV } from '@/config/envValidation';

export const initWebVitals = () => {
  if (!ENV.VITE_ENABLE_PERFORMANCE_MONITORING) return;

  const sendToAnalytics = (metric: any) => {
    // Send to Google Analytics
    window.gtag?.('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true
    });

    // Send to custom endpoint (opcional)
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        url: window.location.href,
        timestamp: Date.now()
      })
    }).catch(console.error);
  };

  // Measure all Web Vitals
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};

// Performance observer
export const observePerformance = () => {
  if (!ENV.VITE_ENABLE_PERFORMANCE_MONITORING) return;

  // Resource timing
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          // Track slow resources
          if (entry.duration > 1000) {
            trackEvent('slow_resource', 'performance', entry.name, entry.duration);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
};
```

### **Health Checks**

#### **Application Health**
```typescript
// src/lib/healthCheck.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    auth: 'up' | 'down';
  };
  performance: {
    responseTime: number;
    memoryUsage: number;
  };
}

export const performHealthCheck = async (): Promise<HealthStatus> => {
  const startTime = performance.now();
  
  const checks = {
    database: checkDatabase(),
    storage: checkStorage(),
    auth: checkAuth()
  };

  const results = await Promise.allSettled([
    checks.database,
    checks.storage,
    checks.auth
  ]);

  const services = {
    database: results[0].status === 'fulfilled' ? 'up' : 'down',
    storage: results[1].status === 'fulfilled' ? 'up' : 'down',
    auth: results[2].status === 'fulfilled' ? 'up' : 'down'
  } as const;

  const responseTime = performance.now() - startTime;
  const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

  const healthyServices = Object.values(services).filter(s => s === 'up').length;
  const status = 
    healthyServices === 3 ? 'healthy' : 
    healthyServices >= 2 ? 'degraded' : 
    'unhealthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    services,
    performance: {
      responseTime,
      memoryUsage
    }
  };
};

const checkDatabase = async () => {
  const { error } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });
  
  if (error) throw error;
};

const checkStorage = async () => {
  const { error } = await supabase
    .storage
    .from('property-images')
    .list('', { limit: 1 });
  
  if (error) throw error;
};

const checkAuth = async () => {
  const { error } = await supabase.auth.getSession();
  if (error) throw error;
};
```

---

## 🛡️ **Seguridad en Producción**

### **Content Security Policy**

#### **CSP Headers**
```typescript
// src/lib/securityHeaders.ts
export const getSecurityHeaders = () => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
};
```

### **Rate Limiting**

#### **Client-side Rate Limiting**
```typescript
// src/lib/rateLimiting.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = ENV.VITE_API_RATE_LIMIT,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  getResetTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    return Math.max(0, requests[0] + this.windowMs - Date.now());
  }
}

export const apiRateLimit = new RateLimiter();
export const uploadRateLimit = new RateLimiter(ENV.VITE_UPLOAD_RATE_LIMIT, 60000);
```

---

## 🚨 **Mantenimiento y Backups**

### **Database Maintenance**

#### **Automated Maintenance Scripts**
```sql
-- maintenance.sql
-- Scripts de mantenimiento automatizado

-- 1. Limpiar logs antiguos (más de 30 días)
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM security_events 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- 2. Optimizar tablas principales
VACUUM ANALYZE profiles;
VACUUM ANALYZE properties;
VACUUM ANALYZE applications;
VACUUM ANALYZE offers;

-- 3. Reindexar tablas críticas
REINDEX INDEX idx_properties_status_location;
REINDEX INDEX idx_applications_status_created;
REINDEX INDEX idx_offers_status_created;

-- 4. Actualizar estadísticas
ANALYZE profiles;
ANALYZE properties;
ANALYZE applications;
ANALYZE offers;

-- 5. Limpiar sesiones expiradas (si aplicable)
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- 6. Archivar datos antiguos (opcional)
-- Mover aplicaciones rechazadas de hace más de 1 año a tabla de archivo
INSERT INTO applications_archive 
SELECT * FROM applications 
WHERE status = 'rechazada' 
AND created_at < NOW() - INTERVAL '1 year';

DELETE FROM applications 
WHERE status = 'rechazada' 
AND created_at < NOW() - INTERVAL '1 year';
```

#### **Backup Strategy**
```bash
#!/bin/bash
# backup.sh - Script de backup automatizado

# Configuración
BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_ID="tu-proyecto-id"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "🗄️  Iniciando backup de base de datos..."
supabase db dump \
  --project-ref $PROJECT_ID \
  --data-only \
  > "$BACKUP_DIR/db_data_$DATE.sql"

supabase db dump \
  --project-ref $PROJECT_ID \
  --schema-only \
  > "$BACKUP_DIR/db_schema_$DATE.sql"

# Backup de Storage (archivos importantes)
echo "📁 Backing up storage..."
supabase storage cp \
  --recursive \
  --project-ref $PROJECT_ID \
  property-images \
  "$BACKUP_DIR/storage_$DATE/"

# Comprimir backups
echo "🗜️  Comprimiendo backups..."
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
  "$BACKUP_DIR/db_data_$DATE.sql" \
  "$BACKUP_DIR/db_schema_$DATE.sql" \
  "$BACKUP_DIR/storage_$DATE/"

# Limpiar archivos temporales
rm -rf "$BACKUP_DIR/db_data_$DATE.sql"
rm -rf "$BACKUP_DIR/db_schema_$DATE.sql"
rm -rf "$BACKUP_DIR/storage_$DATE/"

# Limpiar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup completado: backup_$DATE.tar.gz"
```

### **Monitoring Dashboard**

#### **System Status Component**
```typescript
// src/components/admin/SystemStatus.tsx
export const SystemStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await performHealthCheck();
        setHealth(status);
      } catch (error) {
        console.error('Health check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="animate-pulse">Checking system status...</div>;
  }

  if (!health) {
    return <div className="text-red-500">Unable to get system status</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'up': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">System Status</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Overall Health</h4>
          <div className={`text-xl font-bold ${getStatusColor(health.status)}`}>
            {health.status.toUpperCase()}
          </div>
          <div className="text-sm text-gray-500">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Services</h4>
          <div className="space-y-1">
            {Object.entries(health.services).map(([service, status]) => (
              <div key={service} className="flex justify-between">
                <span className="capitalize">{service}:</span>
                <span className={getStatusColor(status)}>
                  {status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Performance</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Response Time:</span>
              <span>{Math.round(health.performance.responseTime)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span>{Math.round(health.performance.memoryUsage / 1024 / 1024)}MB</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full text-left px-2 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded"
            >
              Refresh Status
            </button>
            <button
              onClick={() => performHealthCheck().then(setHealth)}
              className="w-full text-left px-2 py-1 text-sm bg-green-50 hover:bg-green-100 rounded"
            >
              Force Health Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔄 **CI/CD y Automatización**

### **GitHub Actions Workflow**

#### **Complete CI/CD Pipeline**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}

  security:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run dependency check
      uses: actions/dependency-review-action@v3

  build:
    runs-on: ubuntu-latest
    needs: [test, security]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_RAILWAY_WEBHOOK_URL: ${{ secrets.VITE_RAILWAY_WEBHOOK_URL }}
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to Vercel (Staging)
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--env ENVIRONMENT=staging'

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to Vercel (Production)
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
    
    - name: Create GitHub Release
      if: success()
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v${{ github.run_number }}
        release_name: Release v${{ github.run_number }}
        body: |
          Automated release from commit ${{ github.sha }}
          
          Changes in this release:
          ${{ github.event.head_commit.message }}

  notify:
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: always()
    
    steps:
    - name: Notify deployment status
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        fields: repo,message,commit,author,action,eventName,ref,workflow
```

### **Automated Testing**

#### **E2E Testing Setup**
```typescript
// cypress/e2e/critical-path.cy.ts
describe('Critical User Flows', () => {
  beforeEach(() => {
    // Reset database to known state
    cy.task('resetDatabase');
    
    // Mock external services
    cy.intercept('POST', '**/webhook/**', { statusCode: 200 });
  });

  it('should complete property listing flow', () => {
    // Authentication
    cy.login('owner@test.com', 'password123');
    
    // Navigate to property creation
    cy.visit('/properties/create');
    
    // Fill property form
    cy.get('[data-testid="property-form"]').within(() => {
      cy.get('select[name="listing_type"]').select('venta');
      cy.get('input[name="address_street"]').type('Test Street');
      cy.get('input[name="address_number"]').type('123');
      cy.get('input[name="price_clp"]').type('100000000');
      cy.get('textarea[name="description"]').type('Test property description');
    });
    
    // Upload images
    cy.get('input[type="file"]').selectFile('cypress/fixtures/property.jpg');
    cy.get('[data-testid="upload-progress"]').should('be.visible');
    cy.get('[data-testid="upload-complete"]').should('be.visible');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify success
    cy.url().should('include', '/properties/');
    cy.contains('Property listed successfully').should('be.visible');
    
    // Verify property appears in marketplace
    cy.visit('/marketplace');
    cy.contains('Test Street 123').should('be.visible');
  });

  it('should complete rental application flow', () => {
    // Setup: Create test property
    cy.task('createTestProperty', {
      address: 'Test Rental Street 456',
      type: 'arriendo',
      price: 500000
    });
    
    // Login as different user
    cy.login('applicant@test.com', 'password123');
    
    // Find and apply to property
    cy.visit('/marketplace');
    cy.contains('Test Rental Street 456').click();
    cy.get('[data-testid="apply-button"]').click();
    
    // Fill application form
    cy.get('[data-testid="application-form"]').within(() => {
      cy.get('textarea[name="message"]').type('I would like to rent this property');
      cy.get('input[name="monthly_income"]').type('1500000');
      cy.get('select[name="profession"]').select('Engineer');
    });
    
    // Submit application
    cy.get('button[type="submit"]').click();
    
    // Verify success
    cy.contains('Application submitted').should('be.visible');
    
    // Check application appears in dashboard
    cy.visit('/dashboard/applications');
    cy.contains('Test Rental Street 456').should('be.visible');
    cy.contains('pendiente').should('be.visible');
  });
});
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

### **🗄️ Base de Datos y Debugging**
- 🗄️ **[README-MIGRACIONES.md](README-MIGRACIONES.md)** - Migraciones y fixes de base de datos
- 🐛 **[README-DEBUGGING.md](README-DEBUGGING.md)** - Debugging y troubleshooting

---

**✅ Con esta configuración de despliegue, tu plataforma inmobiliaria está lista para producción.**
