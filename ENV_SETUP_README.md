# 🔧 Configuración de Variables de Entorno

## Problema Resuelto

Se eliminaron las credenciales hardcodeadas de `src/lib/supabase.ts` por razones de seguridad. Ahora es necesario configurar las variables de entorno correctamente.

## Configuración Requerida

### 1. Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFubONiLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w
```

### 2. Variables de Entorno Requeridas

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Sí |

### 3. Verificación

Después de crear el archivo `.env`, reinicia el servidor de desarrollo:

```bash
npm run dev
```

Si las variables están configuradas correctamente, no deberías ver errores relacionados con "Supabase URL or Anon Key is missing".

## Seguridad

- **Nunca** commits el archivo `.env` al repositorio
- El archivo `.env` ya está incluido en `.gitignore`
- Las variables `VITE_*` son expuestas al cliente, pero la clave anónima está diseñada para uso público

## Troubleshooting

Si aún ves errores:

1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Confirma que las variables tienen el prefijo `VITE_`
3. Reinicia el servidor de desarrollo
4. Revisa la consola del navegador para más detalles del error

## Variables de Producción

Para producción, configura estas variables en tu plataforma de despliegue (Vercel, Netlify, etc.):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-produccion
```
