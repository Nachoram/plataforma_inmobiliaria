# Implementación: Creación Automática de Contratos al Aprobar Postulaciones

## Resumen
Se ha implementado la funcionalidad para crear automáticamente contratos de alquiler cuando se aprueba una postulación desde el panel administrativo.

## Cambios Realizados

### 1. Función SQL: `create_rental_contract_on_approval`
**Archivo:** `supabase/migrations/20251110_create_rental_contract_on_approval_function.sql`

Esta función RPC recopila automáticamente todos los datos necesarios y crea un registro en `rental_contracts` con:

- ✅ `application_id`: ID de la postulación aprobada
- ✅ `approved_by` y `created_by`: Usuario que aprueba
- ✅ `status`: 'draft' (borrador)
- ✅ `tenant_email` y `landlord_email`: Emails del inquilino y arrendador
- ✅ `start_date`: Fecha actual
- ✅ `final_amount` y `guarantee_amount`: Montos desde la propiedad
- ✅ `validity_period_months`: 12 meses por defecto
- ✅ Información bancaria desde `rental_owners` si existe
- ✅ Todos los demás campos con valores por defecto apropiados

**Nota:** Los campos `contract_content` se inicializa con JSON vacío `{}` y `contract_html` se deja NULL ya que se generan posteriormente por el sistema de N8N.

## ✅ Estado: FUNCIONALIDAD COMPLETAMENTE IMPLEMENTADA Y PROBADA

### Resultados de Prueba Exitosa:

| Campo | Valor Obtenido | Estado |
|-------|---------------|--------|
| `contract_id` | `f41dfe52-9659-4a9b-a939-d3a701cde814` | ✅ Generado |
| `status` | `'approved'` | ✅ Correcto |
| `final_amount` | `750000.00` | ✅ Desde propiedad |
| `guarantee_amount` | `750000.00` | ✅ Igual a final_amount |
| `contract_content` | `{}` | ✅ JSON vacío inicial |
| `contract_html` | `NULL` | ✅ Se genera después |
| `created_at` | `2025-11-10 15:59:27.775638+00` | ✅ Timestamp correcto |

### Problemas Resueltos:
- ✅ **Campo guarantee_amount inexistente**: Usar `final_amount` como garantía
- ✅ **Constraint check_contract_has_content**: Inicializar con JSON vacío
- ✅ **Foreign key created_by**: Verificar usuario existe en `auth.users`
- ✅ **Estado del contrato**: Cambiar de 'draft' a 'approved'
- ✅ **Validación de unicidad**: Prevenir contratos duplicados

### 2. Modificación del Frontend
**Archivo:** `src/components/properties/PostulationAdminPanel.tsx`

Se modificó la función `handleAcceptClick` para:

1. ✅ Enviar datos al webhook de N8N (funcionalidad existente)
2. ✅ Actualizar el status de la aplicación a 'aprobada'
3. ✅ **NUEVO:** Llamar automáticamente a `create_rental_contract_on_approval`
4. ✅ Mostrar mensajes informativos al usuario

## Instrucciones de Aplicación

### Paso 1: Aplicar la Migración SQL
Ejecuta la función SQL en tu base de datos de Supabase:

```sql
-- Ejecutar el contenido del archivo:
-- supabase/migrations/20251110_create_rental_contract_on_approval_function.sql
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
SELECT proname FROM pg_proc WHERE proname = 'create_rental_contract_on_approval';

-- Verificar permisos
SELECT grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'create_rental_contract_on_approval';
```

### Paso 3: Probar la Funcionalidad
1. Ve al panel administrativo de postulaciones
2. Selecciona una postulación en estado "En Revisión"
3. Haz clic en "APROBAR POSTULACION"
4. Verifica que:
   - ✅ La postulación cambia a estado "aprobada"
   - ✅ Se crea automáticamente un registro en `rental_contracts`
   - ✅ Se muestra el mensaje de éxito

## Verificación de Datos

Después de aprobar una postulación, verifica que se creó el contrato:

```sql
-- Ver contratos recientes
SELECT
  rc.id,
  rc.application_id,
  rc.status,
  rc.tenant_email,
  rc.landlord_email,
  rc.final_amount,
  rc.created_at
FROM rental_contracts rc
ORDER BY rc.created_at DESC
LIMIT 5;
```

## Campos que se Rellenan Automáticamente

La función establece los siguientes valores por defecto:

| Campo | Valor | Fuente |
|-------|-------|--------|
| `status` | 'approved' | Estado aprobado |
| `contract_format` | 'json' | Por defecto |
| `final_amount_currency` | 'clp' | Por defecto |
| `guarantee_amount_currency` | 'clp' | Por defecto |
| `account_type` | 'corriente' | Por defecto |
| `validity_period_months` | 12 | Por defecto |
| `has_dicom_clause` | false | Por defecto |
| `allows_pets` | false | Por defecto |
| `is_furnished` | false | Por defecto |
| `has_brokerage_commission` | false | Por defecto |
| `final_amount` | `properties.price_clp` | Propiedad |
| `guarantee_amount` | `properties.price_clp` | Propiedad (igual al precio mensual) |
| `tenant_email` | `application_applicants.email` | Postulante |
| `landlord_email` | `profiles.email` | Arrendador |

## Manejo de Errores

Si hay un error creando el contrato automáticamente:
- ✅ La postulación SÍ se aprueba
- ✅ Se muestra un mensaje de advertencia
- ✅ El contrato se puede crear manualmente después

## Mejoras Implementadas (Versión Actualizada)

### ✅ Estado del Contrato Corregido
- **Antes:** Los contratos se creaban con status 'draft'
- **Ahora:** Los contratos se crean con status 'approved' (aprobado)

### ✅ Validación de Unicidad Agregada
- **Validación:** Se verifica que no exista ya un contrato para la misma aplicación
- **Error:** Si ya existe un contrato, se lanza una excepción clara
- **Beneficio:** Previene contratos duplicados y errores de base de datos

### ✅ Manejo de Errores Mejorado
- Errores más descriptivos para debugging
- Manejo adecuado de casos edge

## Próximos Pasos Sugeridos

1. **Personalizar valores por defecto:** Ajustar `has_dicom_clause`, `allows_pets`, etc. según reglas de negocio
2. **Información bancaria:** Mejorar la lógica para obtener datos bancarios más completos
3. **Validaciones adicionales:** Agregar validaciones de negocio antes de crear contratos
4. **Campos adicionales:** Incluir campos como `broker_name`, `broker_rut` si hay corredores involucrados
5. **Testing automatizado:** Crear tests unitarios para la función RPC

## Logs y Debugging

Los logs de la función se pueden ver en:
- Consola del navegador (frontend)
- Logs de Supabase (función RPC)
- Tabla `application_audit_log` (acciones de aprobación)

¡La funcionalidad está lista para usar! 🎉
