# Desplegar Funciones Edge Functions de Supabase

## Opción 1: Desde el Dashboard de Supabase (Recomendado)

### Paso 1: Acceder al Dashboard
1. Ve a [supabase.com](https://supabase.com) y accede a tu proyecto
2. Ve a la sección **"Edge Functions"** en el menú lateral

### Paso 2: Crear la Función `approve-application`
1. Haz clic en **"Create a function"**
2. Nombre: `approve-application`
3. Pega el contenido del archivo `supabase/functions/approve-application/index.ts`

### Paso 3: Probar la Función
1. Una vez desplegada, ve a la pestaña **"Logs"** para ver si hay errores
2. Puedes probar la función usando el botón **"Test"** en el dashboard

## Opción 2: Usando CLI (Requiere configuración)

### Paso 1: Login en Supabase
```bash
npx supabase login
```

### Paso 2: Enlazar proyecto (si no está enlazado)
```bash
npx supabase link --project-ref TU_PROJECT_REF
```

### Paso 3: Desplegar función
```bash
npx supabase functions deploy approve-application
```

## Verificar que funciona

Después de desplegar, prueba desde tu aplicación. Si aún hay errores:

1. Revisa los logs de la función en el dashboard de Supabase
2. Verifica que la URL de la función sea correcta
3. Asegúrate de que tengas permisos para ejecutar funciones

## URL de la Función

La función debería estar disponible en:
```
https://TU_PROJECT_REF.supabase.co/functions/v1/approve-application
```

Reemplaza `TU_PROJECT_REF` con el ID de tu proyecto Supabase.
