# Instrucciones: Contract Characteristic ID

## 📋 Resumen de Cambios

Se ha implementado un **ID característico para contratos** (`contract_characteristic_id`) que se genera automáticamente cuando se aprueba una postulación y se crea un contrato de arriendo.

---

## 🗂️ Archivos Modificados

### 1. **SQL de Migración**
- **Archivo:** `20251003180000_add_contract_characteristic_id.sql`
- **Propósito:** Agrega la columna `contract_characteristic_id` a la tabla `rental_contracts`

### 2. **Frontend**
- **Archivo:** `src/components/dashboard/ApplicationsPage.tsx`
  - Captura el `contract_characteristic_id` al crear el contrato
  - Envía el ID al webhook para integración con N8N

- **Archivo:** `src/lib/webhook.ts`
  - Actualiza la función `sendSimpleApprovalEvent()` para incluir el nuevo parámetro
  - Agrega logging del `contract_characteristic_id`

---

## 🚀 Paso 1: Aplicar la Migración SQL

### Opción A: Via Supabase CLI (Recomendado)

```bash
# Copiar el archivo de migración a la carpeta de migraciones
cp 20251003180000_add_contract_characteristic_id.sql supabase/migrations/

# Aplicar la migración
supabase db push
```

### Opción B: Via Supabase Dashboard

1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `20251003180000_add_contract_characteristic_id.sql`
4. Copia y pega todo el contenido
5. Haz clic en **Run** para ejecutar

---

## 📊 ¿Qué hace la migración?

La migración SQL realiza las siguientes acciones:

1. ✅ **Agrega la columna** `contract_characteristic_id` a `rental_contracts`
2. ✅ **Actualiza la función** `generate_characteristic_id()` para incluir el caso de `rental_contracts`
3. ✅ **Crea un trigger** que genera automáticamente el ID al insertar un contrato
4. ✅ **Popula IDs existentes** para contratos que ya existen en la base de datos
5. ✅ **Crea un índice** para mejorar el rendimiento de búsquedas
6. ✅ **Agrega documentación** a la columna

---

## 🔍 Formato del ID Característico

```
CONTRACT_[timestamp]_[primeros 8 chars del UUID]
```

**Ejemplo:**
```
CONTRACT_1704067200_a1b2c3d4
```

---

## 🧪 Verificación Post-Migración

### 1. Verificar que la columna existe

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rental_contracts' 
  AND column_name = 'contract_characteristic_id';
```

**Resultado esperado:**
```
column_name                  | data_type | is_nullable
-----------------------------|-----------|------------
contract_characteristic_id   | text      | YES
```

### 2. Verificar que el trigger existe

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_generate_contract_characteristic_id';
```

**Resultado esperado:**
```
trigger_name                                | event_manipulation | action_timing
--------------------------------------------|--------------------|--------------
trigger_generate_contract_characteristic_id | INSERT             | BEFORE
```

### 3. Verificar que contratos existentes tienen IDs

```sql
SELECT 
  id,
  contract_characteristic_id,
  application_id,
  status,
  created_at
FROM rental_contracts
LIMIT 5;
```

**Resultado esperado:** Todos los contratos deberían tener un `contract_characteristic_id` generado.

### 4. Probar creación de nuevo contrato

```sql
-- Insertar un contrato de prueba (ajusta el application_id a uno válido)
INSERT INTO rental_contracts (application_id, status, version)
VALUES ('tu-application-id-aqui', 'pending_signature', 1)
RETURNING id, contract_characteristic_id, created_at;
```

**Resultado esperado:** El `contract_characteristic_id` debe generarse automáticamente con el formato `CONTRACT_XXXXXXXXXX_XXXXXXXX`.

---

## 🎯 Flujo de Aprobación Actualizado

### Antes:
```
1. Usuario aprueba postulación
2. Se actualiza estado en applications
3. Se crea registro en rental_contracts con campos básicos
4. Se envía webhook a N8N
```

### Ahora:
```
1. Usuario aprueba postulación
2. Se actualiza estado en applications
3. Se crea registro en rental_contracts con campos básicos
   └─> ✨ Se genera automáticamente contract_characteristic_id
4. Se captura el contract_characteristic_id
5. Se envía webhook a N8N con el contract_characteristic_id
```

---

## 📡 Webhook Payload Actualizado

El webhook ahora incluye el nuevo campo:

```json
{
  "application_characteristic_id": "APP_1704067200_a1b2c3d4",
  "property_characteristic_id": "PROP_1704067100_b2c3d4e5",
  "applicant_characteristic_id": "uuid-del-applicant",
  "rental_owner_characteristic_id": "RO_1704067000_c3d4e5f6",
  "guarantor_characteristic_id": "GUAR_1704066900_d4e5f6g7",
  "contract_conditions_characteristic_id": "RCOND_1704067300_e5f6g7h8",
  "contract_characteristic_id": "CONTRACT_1704067400_f6g7h8i9", // ⭐ NUEVO
  "action": "application_approved",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🎛️ Integración con N8N

En tu workflow de N8N, ahora puedes:

1. **Recibir** el `contract_characteristic_id` en el webhook trigger
2. **Usar** este ID para buscar el contrato específico en Supabase
3. **Actualizar** el contrato con contenido HTML generado externamente
4. **Asociar** documentos o firmas al contrato usando este ID único

### Ejemplo de búsqueda en N8N:

```javascript
// En un nodo de Supabase en N8N
const contractCharacteristicId = $json.contract_characteristic_id;

// Buscar el contrato
const { data, error } = await supabase
  .from('rental_contracts')
  .select('*')
  .eq('contract_characteristic_id', contractCharacteristicId)
  .single();
```

---

## ✅ Checklist de Implementación

- [ ] Migración SQL aplicada exitosamente
- [ ] Columna `contract_characteristic_id` existe en `rental_contracts`
- [ ] Trigger funciona correctamente (probado con INSERT manual)
- [ ] Contratos existentes tienen IDs generados
- [ ] Frontend captura y envía el ID al webhook
- [ ] N8N recibe el nuevo campo en el webhook payload
- [ ] Workflow de N8N actualizado para usar el nuevo ID

---

## 🔧 Troubleshooting

### Error: "column contract_characteristic_id does not exist"

**Solución:** La migración no se aplicó correctamente. Ejecuta nuevamente el SQL completo.

### Los contratos existentes no tienen contract_characteristic_id

**Solución:** Ejecuta manualmente el paso de población:

```sql
UPDATE rental_contracts 
SET contract_characteristic_id = 'CONTRACT_' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || '_' || SUBSTRING(id::text, 1, 8)
WHERE contract_characteristic_id IS NULL;
```

### El webhook no está enviando el contract_characteristic_id

**Solución:** 
1. Verifica que el contrato se creó correctamente con el ID
2. Revisa los logs de consola en el navegador
3. Asegúrate de que la aplicación frontend esté actualizada

---

## 📞 Soporte

Si tienes problemas con la implementación:
1. Revisa los logs de consola del navegador
2. Verifica los logs de Supabase
3. Ejecuta las queries de verificación mencionadas arriba

---

## 🎉 ¡Listo!

Una vez aplicada la migración, el sistema generará automáticamente IDs característicos para todos los contratos nuevos y los enviará a tu webhook para integración con N8N.

