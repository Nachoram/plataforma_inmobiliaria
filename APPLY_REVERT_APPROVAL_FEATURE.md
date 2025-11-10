# Implementación: Anular Aprobación de Postulaciones

## Resumen
Se ha implementado la funcionalidad para anular la aprobación de postulaciones, que elimina automáticamente el contrato creado y revierte el estado de la postulación.

## Cambios Realizados

### 1. Función SQL: `revert_application_approval`
**Archivo:** `supabase/migrations/20251111_create_revert_approval_function.sql`

Esta función RPC realiza las siguientes acciones:
- ✅ **Verifica** que la aplicación esté aprobada
- ✅ **Elimina** el contrato asociado en `rental_contracts` (si existe)
- ✅ **Revierte** el estado de la aplicación de 'aprobada' a 'pendiente'
- ✅ **Limpia** los campos `approved_at` y `approved_by`
- ✅ **Registra** la acción en `application_audit_log`

### 2. Modificación del Frontend
**Archivo:** `src/components/properties/PostulationAdminPanel.tsx`

Se agregó:
- ✅ **Nueva función:** `handleRevertApproval()` con validaciones y confirmación
- ✅ **Nuevo botón:** "ANULAR APROBACIÓN" en la sección "ADMINISTRAR ACEPTACIÓN"
- ✅ **Layout actualizado:** De 2 columnas a 3 columnas para acomodar el nuevo botón
- ✅ **Estados de carga:** Reutiliza `isUndoingAcceptance` para el loading

## Instrucciones de Aplicación

### Paso 1: Aplicar la Migración SQL
Ejecuta la función SQL en tu base de datos de Supabase:

```sql
-- Ejecutar el contenido del archivo:
-- supabase/migrations/20251111_create_revert_approval_function.sql
```

**Opción A - Supabase Dashboard:**
1. Ve a tu proyecto Supabase
2. SQL Editor
3. Copia y pega el contenido del archivo de migración
4. Ejecuta la consulta

**Opción B - CLI de Supabase:**
```bash
npx supabase db push
```

### Paso 2: Verificar la Función
Verifica que la función se creó correctamente:

```sql
-- Verificar que la función existe
SELECT proname FROM pg_proc WHERE proname = 'revert_application_approval';

-- Verificar permisos
SELECT grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'revert_application_approval';
```

## Flujo de Funcionamiento

### 1. Estado Inicial: Postulación en "En Revisión"
- ✅ Se muestra el botón **"APROBAR POSTULACIÓN"**
- ❌ No se muestra la sección "ADMINISTRAR ACEPTACIÓN"

### 2. Después de Aprobar: Postulación en "Aprobado"
- ✅ Se crea automáticamente el contrato en `rental_contracts`
- ✅ Aparece la sección **"ADMINISTRAR ACEPTACIÓN"** con 3 botones:
  - 🔄 **"Deshacer Aceptación"** - Solo revierte el estado (contrato permanece)
  - ❌ **"Anular Aprobación"** - **NUEVO:** Elimina contrato y revierte estado
  - ✏️ **"Modificar Aceptación"** - Edita términos sin cambiar estado

### 3. Después de Anular: Postulación de vuelta en "En Revisión"
- ✅ Contrato eliminado de `rental_contracts`
- ✅ Estado revertido a 'pendiente'
- ✅ Campos `approved_at` y `approved_by` limpiados
- ✅ Registro en audit log
- ✅ Vuelve a mostrarse el botón **"APROBAR POSTULACIÓN"**

## Validaciones Implementadas

### En Frontend:
- ✅ Solo disponible cuando `status === 'Aprobado'`
- ✅ Deshabilitado si el contrato está firmado (`contractSigned`)
- ✅ Confirmación del usuario antes de proceder
- ✅ Manejo de errores y estados de carga

### En Backend:
- ✅ Verifica que la aplicación esté aprobada
- ✅ Elimina contrato solo si existe
- ✅ Registra todas las acciones en audit log

## Mensajes al Usuario

### Confirmación antes de anular:
```
¿Estás seguro de anular la aprobación de esta postulación?

• Se eliminará cualquier contrato generado automáticamente
• La postulación volverá al estado "En Revisión"
• Se podrá aprobar nuevamente después
```

### Éxito:
```
✅ Aprobación anulada correctamente. La postulación vuelve a estar en revisión.
```

### Error:
```
❌ Error al anular la aprobación. Por favor, intenta nuevamente.
```

## Verificación de Funcionamiento

Después de anular una aprobación, verifica:

```sql
-- Verificar que el contrato fue eliminado
SELECT COUNT(*) as contratos_restantes
FROM rental_contracts
WHERE application_id = 'id-de-la-aplicacion';

-- Verificar que el estado cambió
SELECT status, approved_at, approved_by
FROM applications
WHERE id = 'id-de-la-aplicacion';

-- Verificar registro en audit log
SELECT event_type, event_data, created_at
FROM application_audit_log
WHERE application_id = 'id-de-la-aplicacion'
ORDER BY created_at DESC
LIMIT 1;
```

## Diferencias con "Deshacer Aceptación"

| Acción | Deshacer Aceptación | Anular Aprobación |
|--------|-------------------|-------------------|
| **Estado** | 'aprobada' → 'pendiente' | 'aprobada' → 'pendiente' |
| **Contrato** | ❌ Se mantiene | ✅ Se elimina |
| **Campos** | approved_at/by se mantienen | ✅ approved_at/by se limpian |
| **Uso** | Corrección temporal | Reversión completa |

## Manejo de Errores

- **Contrato firmado:** No se puede anular si `contractSigned = true`
- **Estado inválido:** Solo funciona con postulaciones aprobadas
- **Error de red:** Mensaje de error y retry disponible
- **Permisos:** Requiere permisos de administrador/propietario

## Próximos Pasos Sugeridos

1. **Notificaciones:** Enviar email al postulante cuando se anula la aprobación
2. **Historial:** Mostrar historial completo de anulaciones en la UI
3. **Motivos:** Agregar campo obligatorio de motivo para la anulación
4. **Backup:** Crear backup automático de contratos antes de eliminarlos
5. **Auditoría:** Dashboard de anulaciones para análisis administrativo

## Logs y Debugging

Los logs se generan en:
- **Frontend:** Consola del navegador
- **Backend:** Logs de Supabase RPC
- **Audit:** Tabla `application_audit_log` con `event_type = 'approval_reverted'`

¡La funcionalidad está lista para usar! 🚀 Ahora puedes anular completamente las aprobaciones de postulaciones cuando sea necesario.
