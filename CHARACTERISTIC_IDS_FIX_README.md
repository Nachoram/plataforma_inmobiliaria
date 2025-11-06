# 🔧 Characteristic IDs Format Fix

## Problema

El webhook está enviando **UUIDs normales** en lugar de **IDs característicos con formato especial** (`APP_`, `PROP_`, `GUAR_`, etc.) que espera el backend N8N.

**Error típico:**
```
ERROR: 42883: operator does not exist: uuid !~~ unknown
```

## Solución

### Scripts Disponibles

1. **`safe_fix_characteristic_ids.sql`** - Script seguro y recomendado
2. **`fix_characteristic_ids_format.sql`** - Script directo (más rápido pero menos seguro)
3. **`rollback_characteristic_ids.sql`** - Script de rollback por si algo sale mal
4. **`verify_characteristic_ids_format.js`** - Script de verificación

## 🚀 Cómo Ejecutar la Corrección

### Opción 1: Script Seguro (Recomendado)

```bash
# Ejecutar el script seguro
psql -h [host] -d [database] -U [user] -f safe_fix_characteristic_ids.sql
```

**Ventajas:**
- ✅ Verifica tipos de columna antes de cambiarlos
- ✅ Crea backups automáticos (opcional)
- ✅ Procesamiento por lotes para evitar timeouts
- ✅ Verificación automática al final

### Opción 2: Script Directo (Más Rápido)

```bash
# Ejecutar el script directo
psql -h [host] -d [database] -U [user] -f fix_characteristic_ids_format.sql
```

**Ventajas:**
- ⚡ Más rápido para bases de datos pequeñas
- ✅ Verificación automática al final

## 📋 Formatos de IDs Característicos

| Entidad | Formato | Ejemplo |
|---------|---------|---------|
| Applications | `APP_{timestamp}_{id_part}` | `APP_1761769106_674b62aa` |
| Properties | `PROP_{timestamp}_{id_part}` | `PROP_1761769106_509808ab` |
| Guarantors | `GUAR_{timestamp}_{id_part}` | `GUAR_1761769106_xxxxxxx` |
| Rental Owners | `RENTAL_OWNER_{timestamp}_{id_part}` | `RENTAL_OWNER_1761769106_xxxxxxx` |
| Contract Conditions | `CONTRACT_COND_{timestamp}_{id_part}` | `CONTRACT_COND_1761769106_xxxxxxx` |
| Contracts | `CONTRACT_{timestamp}_{id_part}` | `CONTRACT_1761769107_xxxxxxx` |

## 🔍 Verificación

### Verificar con SQL

```sql
-- Verificar que todos los IDs tienen el formato correcto
SELECT
  COUNT(*) as total_apps,
  COUNT(CASE WHEN application_characteristic_id LIKE 'APP_%' THEN 1 END) as formatted_apps
FROM applications WHERE application_characteristic_id IS NOT NULL;

SELECT
  COUNT(*) as total_props,
  COUNT(CASE WHEN property_characteristic_id LIKE 'PROP_%' THEN 1 END) as formatted_props
FROM properties WHERE property_characteristic_id IS NOT NULL;
```

### Verificar con Node.js

```bash
# Ejecutar script de verificación
node verify_characteristic_ids_format.js
```

## ⚠️ Rollback (Si algo sale mal)

```bash
# Ejecutar rollback
psql -h [host] -d [database] -U [user] -f rollback_characteristic_ids.sql
```

**Nota:** El rollback restablece los IDs a formato UUID básico, lo que puede afectar la compatibilidad con webhooks hasta que se vuelva a ejecutar la corrección.

## 🔄 Próximos Pasos

1. **Ejecutar la corrección** usando uno de los scripts
2. **Verificar** que todos los IDs tienen el formato correcto
3. **Probar** la generación de contratos para confirmar que el webhook funciona
4. **Monitorear** los logs del webhook para asegurar compatibilidad

## 📝 Payload Esperado del Webhook

Después de la corrección, el webhook debería enviar:

```json
{
  "application_characteristic_id": "APP_1761769106_674b62aa",
  "property_characteristic_id": "PROP_1761769106_509808ab",
  "applicant_characteristic_id": "APP_1761769106_674b62aa",
  "rental_owner_characteristic_id": "RENTAL_OWNER_1761769106_xxxxxxx",
  "guarantor_characteristic_id": "GUAR_1761769106_xxxxxxx",
  "contract_conditions_characteristic_id": "CONTRACT_COND_1761769106_xxxxxxx",
  "contract_characteristic_id": "CONTRACT_1761769107_xxxxxxx",
  "action": "contract_generated",
  "timestamp": "2025-10-29T20:18:28.051Z",
  "application_uuid": "674b62aa-f021-4ce3-a98b-06f2d94fd8b4",
  "property_uuid": "509808ab-40ff-4edb-b2b8-19895409d7c5",
  "applicant_uuid": "674b62aa-f021-4ce3-a98b-06f2d94fd8b4",
  "owner_uuid": "RENTAL_OWNER_1761769106_xxxxxxx",
  "guarantor_uuid": "GUAR_1761769106_xxxxxxx"
}
```

## 🆘 Solución de Problemas

### Error: "operator does not exist: uuid !~~ unknown"
- **Causa:** Columna aún es de tipo UUID
- **Solución:** Ejecutar el script de corrección que cambia los tipos a TEXT

### Error: "permission denied for table"
- **Causa:** Usuario no tiene permisos para ALTER TABLE
- **Solución:** Ejecutar como superusuario o dar permisos apropiados

### Timeout en bases de datos grandes
- **Causa:** Script procesa demasiados registros a la vez
- **Solución:** Usar `safe_fix_characteristic_ids.sql` que procesa por lotes

### IDs no se actualizan
- **Causa:** Registros pueden no tener `created_at` o IDs válidos
- **Solución:** Verificar datos existentes antes de ejecutar el script











