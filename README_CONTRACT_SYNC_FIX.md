# ✅ Solución: Sincronización de Condiciones Contractuales

## Problema Resuelto

La funcionalidad para rellenar la tabla `rental_contracts` con las condiciones contractuales no se estaba aplicando correctamente. Había una desconexión entre:

1. **Tabla `rental_contract_conditions`** (donde se guardaban los datos del formulario)
2. **Tabla `rental_contracts`** (que permanecía con datos básicos)

## ✅ Solución Implementada

### 1. Nueva Función SQL: `sync_contract_conditions_to_rental_contract`

**Ubicación:** `supabase/migrations/20251110_create_rental_contract_on_approval_function.sql`

Esta función sincroniza automáticamente todos los datos de `rental_contract_conditions` a `rental_contracts`, rellenando:

- ✅ **Información financiera:** `final_amount`, `guarantee_amount`, monedas
- ✅ **Fechas:** `start_date`, `validity_period_months`
- ✅ **Información bancaria:** `account_holder_name`, `account_number`, `account_bank`, `account_type`
- ✅ **Condiciones especiales:** `has_dicom_clause`, `allows_pets`, `is_furnished`
- ✅ **Información del corredor:** `broker_name`, `broker_amount`, `broker_rut`, `has_brokerage_commission`
- ✅ **Emails:** `tenant_email`, `landlord_email`
- ✅ **Notas adicionales** con timestamp de actualización

### 2. Integración Automática

**Ubicación:** `src/components/contracts/RentalContractConditionsForm.tsx`

El formulario de condiciones contractuales ahora llama automáticamente a la función de sincronización después de guardar las condiciones.

**Ubicación:** `supabase/migrations/20251110_create_rental_contract_on_approval_function.sql`

La función `create_rental_contract_on_approval` intenta sincronizar condiciones existentes al crear contratos automáticamente.

## 🚀 Cómo Aplicar la Solución

### Problemas de Foreign Keys en Scripts de Prueba

**Importante:** Los scripts de prueba están diseñados para manejar restricciones de foreign keys que pueden existir en diferentes entornos de Supabase. Si encuentras errores de foreign keys:

1. **Usa `test_sync_minimal.sql`** - Es el más seguro y evita problemas de foreign keys
2. **Usa `test_sync_robust.sql`** - Reutiliza datos existentes cuando puede
3. **Los otros scripts** pueden requerir que ajustes los IDs según tu base de datos

### Paso 1: Aplicar Migraciones

```bash
# Si tienes Supabase CLI configurado:
npx supabase db push

# O ejecuta manualmente la migración:
# supabase/migrations/20251110_create_rental_contract_on_approval_function.sql
```

### Paso 2: Probar la Funcionalidad

#### Opción A: Verificar Funciones (Primero)
Ejecuta `test_function_exists.sql` - solo verifica que las funciones existen, sin crear datos.

#### Opción B: Solo Datos Existentes (Más Seguro)
Ejecuta `test_sync_existing_only.sql` - sincroniza contratos existentes sin crear nuevos datos. **¡Ideal para producción!**

#### Opción C: Directo y Simple (Muy Seguro)
Ejecuta `test_sync_direct.sql` - crea todo en orden correcto con IDs consistentes. **¡La más directa!**

#### Opción D: Sin Constraints (Muy Seguro)
Ejecuta `test_sync_no_constraints.sql` - crea datos evitando todas las foreign key constraints. **¡Funciona en cualquier entorno!**

#### Opción E: Script Robusto
Ejecuta `test_sync_robust.sql` - reutiliza datos existentes cuando puede, creando solo lo mínimo necesario.

#### Opción F: Usar Datos Existentes
Ejecuta `test_sync_existing_data.sql` para probar con aplicaciones que ya tengan contratos y condiciones.

#### Opción G: Crear Datos Completos
Ejecuta `test_contract_sync_simple.sql` para crear un conjunto completo de datos de prueba desde cero.

#### Opción H: Script Node.js
Si tienes las variables de entorno configuradas:
```bash
node test_contract_sync_functionality.js
```

#### Opción I: Prueba Manual
1. Crea condiciones contractuales desde el formulario
2. Verifica que la tabla `rental_contracts` se rellene automáticamente

### Paso 3: Verificar Resultados

Ejecuta esta consulta para verificar que los campos se están rellenando:

```sql
SELECT
    id,
    final_amount, guarantee_amount,
    start_date, validity_period_months,
    account_holder_name, account_bank, account_type,
    has_dicom_clause, allows_pets,
    broker_name, broker_amount,
    tenant_email, landlord_email,
    notes
FROM rental_contracts
WHERE application_id IN (
    SELECT application_id FROM rental_contract_conditions
);
```

## 📋 Campos que Ahora se Rellenan Automáticamente

| Campo | Origen | Descripción |
|-------|--------|-------------|
| `final_amount` | `rental_contract_conditions.final_rent_price` | Monto final del contrato |
| `guarantee_amount` | `rental_contract_conditions.guarantee_amount` | Monto de garantía |
| `start_date` | `rental_contract_conditions.contract_start_date` | Fecha de inicio |
| `validity_period_months` | `rental_contract_conditions.contract_duration_months` | Período de validez |
| `account_holder_name` | `rental_contract_conditions.account_holder_name` | Nombre del titular |
| `account_number` | `rental_contract_conditions.account_number` | Número de cuenta |
| `account_bank` | `rental_contract_conditions.bank_name` | Banco |
| `account_type` | `rental_contract_conditions.account_type` | Tipo de cuenta |
| `has_dicom_clause` | `rental_contract_conditions.dicom_clause` | Cláusula DICOM |
| `allows_pets` | `rental_contract_conditions.accepts_pets` | Permite mascotas |
| `broker_name` | `rental_contract_conditions.broker_name` | Nombre del corredor |
| `broker_amount` | `rental_contract_conditions.brokerage_commission` | Comisión del corredor |
| `tenant_email` | `application_applicants.email` | Email del arrendatario |
| `landlord_email` | `rental_contract_conditions.notification_email` | Email del arrendador |

## 🔧 Funciones SQL Disponibles

### `sync_contract_conditions_to_rental_contract(p_application_id UUID)`

Sincroniza datos de condiciones contractuales a un contrato existente.

**Parámetros:**
- `p_application_id`: UUID de la aplicación

**Retorna:** UUID del contrato actualizado, o NULL si no hay condiciones

### `create_rental_contract_on_approval(p_application_id UUID, p_approved_by UUID)`

Crea contrato al aprobar aplicación e intenta sincronizar condiciones.

**Parámetros:**
- `p_application_id`: UUID de la aplicación
- `p_approved_by`: UUID del usuario que aprueba

**Retorna:** UUID del contrato creado

## 🧪 Scripts de Prueba

- **`test_function_exists.sql`**: Verificación simple de funciones (sin datos)
- **`test_sync_existing_only.sql`**: Solo datos existentes (más seguro)
- **`test_sync_direct.sql`**: Directo y simple (muy directo)
- **`test_sync_no_constraints.sql`**: Sin foreign key constraints (muy seguro)
- **`test_sync_minimal.sql`**: Script minimalista (seguro)
- **`test_sync_robust.sql`**: Script inteligente que reutiliza datos existentes
- **`test_sync_existing_data.sql`**: Prueba solo con datos existentes
- **`test_contract_sync_simple.sql`**: Prueba completa creando datos de prueba
- **`test_contract_sync_functionality.js`**: Script Node.js para testing automatizado

## ✅ Verificación de Funcionamiento

Después de aplicar la solución:

1. **Formulario de condiciones** → Guarda en `rental_contract_conditions` y sincroniza automáticamente a `rental_contracts`
2. **Aprobación de aplicaciones** → Crea contrato básico y sincroniza condiciones si existen
3. **Tabla `rental_contracts`** → Contiene todos los datos necesarios para generar contratos

## 🎯 Resultado Final

Ahora cuando se incorporan las condiciones contractuales, la tabla `rental_contracts` se rellena completamente con **todos** los datos disponibles, cumpliendo exactamente con el requerimiento de rellenar "todo dentro de lo posible, sino existe dato se null menos la columna contract_content y contract_html".
