# 🔧 Configuración de Supabase - Solución al Error de Credenciales

## 🚨 Problema Identificado
Tu aplicación no puede conectarse a Supabase porque faltan las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## ✅ Solución Paso a Paso

### 1. Crear el archivo .env
En la raíz de tu proyecto (mismo nivel que `package.json`), crea un archivo llamado exactamente `.env` (con el punto al inicio).

### 2. Obtener las credenciales de Supabase
1. Ve a [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia los siguientes valores:
   - **Project URL** (para VITE_SUPABASE_URL)
   - **anon public** key (para VITE_SUPABASE_ANON_KEY)

### 3. Configurar el archivo .env
Agrega estas líneas al archivo `.env`:

```env
VITE_SUPABASE_URL="https://tu-proyecto-id.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-clave-anonima-aqui"
```

**Ejemplo real:**
```env
VITE_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.ejemplo-de-clave-anonima"
```

### 4. Reiniciar el servidor
**MUY IMPORTANTE:** Después de crear o modificar el archivo `.env`, debes:
1. Detener el servidor de desarrollo (Ctrl + C)
2. Reiniciarlo con: `npm run dev`

## 🔍 Verificación
Una vez configurado correctamente, deberías ver en la consola:
```
✅ Configuración de entorno validada correctamente
🌐 Supabase URL: https://tu-proyecto.supabase.co
🔑 Clave anónima: Presente ✓
```

## ⚠️ Notas Importantes
- Las variables **DEBEN** comenzar con `VITE_` para que Vite las reconozca
- No incluyas espacios alrededor del signo `=`
- No uses comillas simples, solo comillas dobles
- El archivo `.env` debe estar en la raíz del proyecto
- **NUNCA** subas el archivo `.env` a Git (ya está en .gitignore)

## 🆘 Si sigues teniendo problemas
1. Verifica que el archivo se llame exactamente `.env` (con punto)
2. Asegúrate de que esté en la raíz del proyecto
3. Reinicia completamente el servidor
4. Verifica que las credenciales sean correctas en el dashboard de Supabase
