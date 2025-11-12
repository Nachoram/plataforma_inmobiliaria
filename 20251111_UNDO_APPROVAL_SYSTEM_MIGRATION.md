# 🚀 Migración del Sistema de Anulación de Aprobaciones

## Fecha: 2025-11-11

### 📋 Resumen
Esta migración completa el sistema de anulación de aprobaciones (`undo approval`) que permite a los administradores revertir postulaciones aprobadas de vuelta al estado pendiente.

### 🔧 Cambios Incluidos

#### 1. **Campos de Auditoría en Tabla `applications`**
- `undo_date`: Fecha y hora de la anulación
- `undo_requested_by`: Usuario que realizó la anulación
- `undo_reason`: Razón de la anulación

#### 2. **Función Mejorada `revert_application_approval`**
- Soporte para contratos en estado `draft`
- Validaciones más robustas
- Integración completa con sistema de auditoría
- Soporte para razones de anulación

#### 3. **Nueva Función `can_undo_application_approval`**
- Verifica si se puede anular una aprobación
- Retorna detalles sobre contratos existentes
- Función helper para validaciones del frontend

#### 4. **Índices de Optimización**
- Índices para campos de undo para mejor rendimiento

### 🎯 Funcionalidades

#### ✅ Lo que permite:
- Anular aprobaciones de postulaciones en estado `aprobada`
- Eliminar contratos en estado `draft` asociados
- Registrar auditoría completa de la acción
- Almacenar razones de anulación

#### ❌ Lo que NO permite:
- Anular postulaciones que no estén aprobadas
- Eliminar contratos que ya estén firmados (status ≠ 'draft')

### 📁 Archivos Relacionados

#### Migración de Base de Datos:
```
supabase/migrations/20251111144518_complete_undo_approval_system.sql
```

#### Función Edge (ya corregida):
```
supabase/functions/undo-application-approval/index.ts
```

#### Guía de Despliegue:
```
deploy_undo_approval_function.md
```

### 🚀 Cómo Aplicar la Migración

#### Opción 1: CLI (Recomendado)
```bash
npx supabase db push
```

#### Opción 2: Dashboard de Supabase
1. Ir a **"SQL Editor"** en Supabase Dashboard
2. Copiar y pegar el contenido de `20251111144518_complete_undo_approval_system.sql`
3. Ejecutar la consulta

### 🔍 Verificación Post-Migración

Ejecutar estas consultas para verificar que todo funcione:

```sql
-- Verificar campos nuevos
SELECT column_name FROM information_schema.columns
WHERE table_name = 'applications' AND column_name LIKE 'undo_%';

-- Verificar funciones
SELECT proname FROM pg_proc
WHERE proname IN ('revert_application_approval', 'can_undo_application_approval');

-- Probar función helper
SELECT can_undo_application_approval('some-application-id');
```

### 🔗 Integración con Edge Functions

La función Edge `undo-application-approval` utiliza esta migración para:
1. Validar que se puede anular la aprobación
2. Actualizar campos de auditoría
3. Registrar eventos en `application_audit_log`

### 🛡️ Seguridad

- **RLS**: Respeta todas las políticas de seguridad existentes
- **Permisos**: Solo usuarios autenticados pueden ejecutar las funciones
- **Validaciones**: Múltiples verificaciones antes de realizar cambios

### 📊 Auditoría

Cada anulación queda registrada en `application_audit_log` con:
- Usuario que realizó la acción
- Estados anterior y nuevo
- Razón de la anulación
- Información sobre contratos afectados
- Timestamp completo

### 🎉 Próximos Pasos

1. **Aplicar la migración** en tu base de datos
2. **Desplegar la función Edge** usando las instrucciones en `deploy_undo_approval_function.md`
3. **Probar el flujo completo** desde el panel administrativo
4. **Verificar logs de auditoría** para confirmar que todo funciona

---

**Estado**: ✅ Listo para aplicar
**Prioridad**: Alta (completa funcionalidad crítica)
**Tiempo estimado de aplicación**: 2-3 minutos

