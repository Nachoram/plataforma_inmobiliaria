# 🔍 Supabase Query Logger - Herramienta de Diagnóstico

## 🎯 Propósito

Esta herramienta intercepta **todas** las consultas de Supabase y las registra en la consola del navegador **antes** de que se ejecuten. Esto te permite identificar inequívocamente la consulta que está causando errores `400 Bad Request`.

## 🚀 Funcionalidades

- ✅ **Intercepción automática** de todas las consultas Supabase
- ✅ **Registro detallado** de cada paso de construcción de consulta
- ✅ **Detección de errores** con información completa
- ✅ **Solo en desarrollo** (no afecta producción)
- ✅ **Colores y emojis** para fácil identificación
- ✅ **Tiempos de ejecución** de cada consulta

## 📋 Cómo Funciona

### 1. Activación Automática

El logger se activa automáticamente cuando:
- La aplicación está en modo desarrollo (`import.meta.env.DEV === true`)
- Se importa desde `src/lib/supabase.ts`

### 2. Intercepción de Consultas

```typescript
// Consulta normal (sin logger)
const { data, error } = await supabase
  .from('properties')
  .select('address_street, price_clp')
  .eq('status', 'activa')
  .order('created_at', { ascending: false });

// Con logger activado, verás en consola:
🔍 Query #1 - Tabla: "properties"
📋 Consulta #1 - Detalles
  🟢 select("address_street, price_clp")
  🔵 eq("status", "activa")
  🟡 order({"ascending": false})
  ⚡ then()
✅ Query #1 COMPLETADA (45ms)
📊 Resumen - Tabla: "properties", Pasos: 4
```

## 🔥 Detección de Errores 400

Cuando ocurre un error 400, verás algo como:

```
🔍 Query #5 - Tabla: "properties"
📋 Consulta #5 - Detalles
  🟢 select("i_address, price_clp")  // ❌ ¡Aquí está el problema!
  🔵 eq("status", "activa")
  🟡 order({"ascending": false})
  ⚡ then()
❌ Query #5 FALLÓ (23ms)
🔥 Error: column properties.i_address does not exist
🔥 Código: 42703
🔥 Detalles: column "i_address" does not exist
📊 Resumen - Tabla: "properties", Pasos: 4
```

## 📖 Instrucciones de Uso

### Paso 1: Activar el Logger
```typescript
// Ya está activado automáticamente en desarrollo
// No necesitas hacer nada más
```

### Paso 2: Reproducir el Error
1. **Abre la consola del navegador** (F12 → Console)
2. **Navega a las páginas problemáticas** donde aparecen errores 400
3. **Busca los logs marcados con 🔥** en la consola

### Paso 3: Identificar el Problema
- Los logs aparecerán **justo antes** de cada error 400
- El log mostrará la consulta exacta con el problema
- Busca errores comunes como:
  - Nombres de columnas incorrectos (`i_address` en lugar de `address_street`)
  - Nombres de tablas incorrectos
  - Sintaxis de filtros mal formada

### Paso 4: Corregir el Error
Una vez identificado el problema en los logs, corrige el código correspondiente.

## 🎨 Ejemplos de Output

### Consulta Exitosa
```
🔍 Query #1 - Tabla: "properties"
📋 Consulta #1 - Detalles
  🟢 select("address_street, address_commune, price_clp")
  🔵 eq("status", "activa")
  🟡 order({"ascending": false})
  ⚡ then()
✅ Query #1 COMPLETADA (45ms)
📊 Resumen - Tabla: "properties", Pasos: 4
```

### Consulta con Error 400
```
🔍 Query #2 - Tabla: "properties"
📋 Consulta #2 - Detalles
  🟢 select("i_address, price_clp")  // ❌ ¡Columna incorrecta!
  🔵 eq("status", "activa")
  ⚡ then()
❌ Query #2 FALLÓ (23ms)
🔥 Error: column properties.i_address does not exist
🔥 Código: 42703
📊 Resumen - Tabla: "properties", Pasos: 3
```

### Consulta Compleja
```
🔍 Query #3 - Tabla: "offers"
📋 Consulta #3 - Detalles
  🟢 select("*, property:properties!inner(address_street, price_clp)")
  🔵 eq("offerer_id", "user-123")
  🟡 order({"column": "created_at", "ascending": false})
  🔵 limit(10)
  ⚡ then()
✅ Query #3 COMPLETADA (67ms)
📊 Resumen - Tabla: "offers", Pasos: 5
```

## 🛠️ Configuración Avanzada

### Desactivar el Logger
```typescript
import { disableSupabaseLogger } from './lib/supabaseLogger';

// Desactivar el logger
disableSupabaseLogger();
```

### Configuración Personalizada
```typescript
import { logSupabaseQueries } from './lib/supabaseLogger';
import { supabase } from './lib/supabase';

// Configuración personalizada
const logger = logSupabaseQueries(supabase, {
  autoEnable: false,  // No activar automáticamente
  logToConsole: true  // Mostrar logs en consola
});

// Activar manualmente
logger.enable();
```

### Acceder al Logger Global
```typescript
import { getSupabaseLogger } from './lib/supabaseLogger';

const logger = getSupabaseLogger();
if (logger) {
  // El logger está activo
  console.log('Logger activo:', logger);
}
```

## 🔧 Solución de Problemas

### El Logger no Aparece
- Verifica que estés en modo desarrollo: `import.meta.env.DEV === true`
- Reinicia el servidor de desarrollo
- Limpia la caché del navegador

### Demasiados Logs
- El logger está diseñado para mostrar todos los logs en desarrollo
- Usa `disableSupabaseLogger()` para desactivarlo temporalmente
- Filtra en la consola del navegador usando términos como "Query #" o "🔥"

### Errores de TypeScript
- Asegúrate de que el archivo `src/lib/supabaseLogger.ts` esté correctamente tipado
- Verifica que tengas `@supabase/supabase-js` instalado

## 📊 Métricas y Rendimiento

- **Impacto en rendimiento**: Mínimo en desarrollo (solo logging)
- **Memoria**: Se limpia automáticamente después de cada consulta
- **Grupos de consola**: Los logs están organizados en grupos colapsables

## 🎯 Casos de Uso Comunes

1. **Errores 400 persistentes**: Identificar consultas mal formadas
2. **Nombres de columnas incorrectos**: Detectar typos en `select()`
3. **Filtros malformados**: Verificar sintaxis de `eq()`, `gt()`, etc.
4. **Problemas de relaciones**: Detectar errores en joins
5. **Debugging de consultas complejas**: Ver el flujo completo de construcción

---

**💡 Tip**: Mantén la consola abierta mientras navegas por la aplicación. Los logs aparecerán automáticamente cuando se ejecuten consultas, permitiéndote identificar problemas en tiempo real.
