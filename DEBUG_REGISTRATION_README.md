# 🔧 DEPURACIÓN AVANZADA: Error 500 en Registro de Supabase

## 🎯 Problema
Error 500 Internal Server Error durante el registro de nuevos usuarios, causado por el trigger `on_auth_user_created`.

## 📋 Proceso de Depuración Sistemático

### Paso 1: Limpieza Inicial
**Archivo:** `debug_registration_step1.sql`

Ejecuta este script en tu **SQL Editor de Supabase** para eliminar cualquier trigger o función existente.

```sql
-- Copia y pega el contenido de debug_registration_step1.sql
```

**Resultado esperado:**
- ✅ Trigger eliminado
- ✅ Función eliminada

### Paso 2: Buscar Datos Huérfanos
**Archivo:** `debug_registration_step2.sql`

Busca registros huérfanos que puedan estar causando conflictos únicos.

1. **Edita el archivo** y reemplaza `'tu-email-de-prueba@gmail.com'` con tu email real
2. **Ejecuta el script** en SQL Editor
3. **Si encuentras registros huérfanos**, elimínalos con:
   ```sql
   DELETE FROM public.profiles WHERE email = 'tu-email@gmail.com';
   ```

### Paso 3: Desactivar RLS Temporalmente
**Archivo:** `debug_registration_step3.sql`

Este es el paso más importante para determinar si el problema es RLS.

1. **Ejecuta el script** para desactivar RLS temporalmente
2. **Ve a tu aplicación**
3. **Intenta registrar un usuario**

### Paso 4: Recrear Trigger Minimalista
**Archivo:** `debug_registration_step4.sql`

Con RLS desactivado, recrea el trigger más simple posible.

1. **Ejecuta el script** para crear trigger minimalista
2. **Ve a tu aplicación**
3. **Intenta registrar un usuario nuevamente**

### Paso 5: Análisis de Resultados

#### 🎉 Si el registro FUNCIONÓ:
**Archivo:** `debug_registration_step5_success.sql`

¡El problema era RLS! Ejecuta este script para aplicar la solución final:
- ✅ Reactiva RLS
- ✅ Crea políticas correctas
- ✅ Permite que el trigger funcione

#### ❌ Si el registro SIGUE FALLANDO:
**Archivo:** `debug_registration_step5_failure.sql`

El problema NO es RLS. Ejecuta este script para diagnóstico avanzado:
- 🔍 Revisa logs de base de datos
- 🔒 Verifica restricciones de tabla
- 🔑 Busca conflictos de índices únicos

## 🧪 Script de Prueba Interactivo

**Archivo:** `test_registration.js`

Script mejorado que puedes ejecutar en la consola del navegador:

1. **Configura tus credenciales** en las líneas 8-9
2. **Copia el código completo**
3. **Pégalo en la consola del navegador**
4. **Ejecuta** para obtener diagnóstico automático

## 📊 Flujo de Depuración

```
PASO 1: Limpieza → PASO 2: Datos Huérfanos → PASO 3: Desactivar RLS
     ↓                           ↓                          ↓
  ✅ OK                     ✅ OK                     ✅ OK
     ↓                           ↓                          ↓
PASO 4: Trigger → ¿Registro funciona? → SÍ: Paso 5 Success
     ↓                           ↓              NO: Paso 5 Failure
  ✅ OK                           ↓
                             ❌ SIGUE FALLANDO
```

## 🎯 Resultados Esperados

### Caso Éxito (RLS era el problema):
- ✅ Registro funciona correctamente
- ✅ Perfiles se crean automáticamente
- ✅ RLS está configurado correctamente

### Caso Alternativo (Otro problema):
- 🔍 Diagnóstico detallado de logs
- 🔒 Identificación de restricciones problemáticas
- 💡 Guía para solución específica

## ⚠️ Notas Importantes

1. **NO dejes RLS desactivado** en producción
2. **Haz backups** antes de ejecutar scripts
3. **Prueba en entorno de desarrollo** primero
4. **Documenta cualquier error** que encuentres

## 🚀 Próximos Pasos

Después de completar la depuración:
1. ✅ Registro funcionando
2. ✅ Trigger operativo
3. ✅ RLS configurado correctamente
4. ✅ Usuarios pueden completar su perfil después

---

**¿Necesitas ayuda con algún paso específico?** Los scripts están diseñados para ser ejecutados en orden y proporcionan feedback claro sobre cada paso.

