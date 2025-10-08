# ✅ Corrección del Error al Crear Contratos

## Problema Identificado

Al aprobar una aplicación, el sistema intentaba insertar un contrato en `rental_contracts` pero fallaba con error **400 Bad Request** porque:

1. Intentaba hacer SELECT de un campo `contract_characteristic_id` que no existe
2. Estaba usando campos antiguos que ya no son parte de la estructura actual

## Solución Aplicada

### Cambios en `ApplicationsPage.tsx`

**Antes** (❌ Error):
```typescript
.insert({
  application_id: application.id,
  status: 'draft',
  contract_content: null,
  // ... otros campos obsoletos
})
.select('id, application_id, status, approved_at, version, contract_characteristic_id')
//                                                          ^^^ Este campo no existe
```

**Después** (✅ Correcto):
```typescript
.insert({
  application_id: application.id,
  status: 'draft',
  contract_content: null,          // Null hasta que N8N lo actualice
  contract_html: null,              // N8N insertará el HTML aquí
  contract_format: 'html',          // Formato que esperamos de N8N
  approved_at: now,
  notes: 'Contrato creado automáticamente al aprobar aplicación',
  version: 1
})
.select('id, contract_number, application_id, status, approved_at, version')
//          ^^^^^^^^^^^^^^ Este campo sí existe y se genera automáticamente
```

## Flujo Actualizado

```
1. Usuario aprueba aplicación
   ↓
2. Sistema crea registro en rental_contracts
   - status: 'draft'
   - contract_html: null (vacío por ahora)
   - contract_format: 'html'
   - contract_number: Auto-generado (CTR-20251003-000001)
   ↓
3. Sistema envía webhook a N8N/Railway
   - Incluye contract_id
   - Incluye application_id
   ↓
4. N8N genera el HTML del contrato
   ↓
5. N8N actualiza rental_contracts
   - UPDATE SET contract_html = '<!DOCTYPE html>...'
   - WHERE id = contract_id
   ↓
6. Usuario visualiza contrato en /contract/{id}
```

## Cómo N8N Debe Actualizar el Contrato

### Opción A: Nodo Supabase Update

```json
{
  "operation": "Update",
  "table": "rental_contracts",
  "filters": {
    "id": "{{$json.contract_id}}"
  },
  "update_fields": {
    "contract_html": "{{$node['Generate HTML'].json.html}}",
    "status": "draft"
  }
}
```

### Opción B: HTTP Request

```javascript
// PUT request
{
  "method": "PATCH",
  "url": "https://tu-proyecto.supabase.co/rest/v1/rental_contracts?id=eq.{{$json.contract_id}}",
  "headers": {
    "apikey": "service-role-key",
    "Authorization": "Bearer service-role-key",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  "body": {
    "contract_html": "{{$node['Generate HTML'].json.html}}"
  }
}
```

## Testing

### 1. Verificar que el Contrato se Crea

```bash
node ver_contratos.js
```

Debería mostrar:
- ✅ Contrato con `contract_html: null`
- ✅ `contract_format: 'html'`
- ✅ `contract_number` generado automáticamente

### 2. Probar Aprobación de Aplicación

1. Ir a `/applications`
2. Aprobar una aplicación
3. Ver en consola: `✅ Contrato creado exitosamente`
4. Copiar el `Contract ID`
5. Visitar `/contract/{id}`

### 3. Verificar en Base de Datos

```sql
SELECT 
  id,
  contract_number,
  status,
  contract_format,
  LENGTH(contract_html) as html_length,
  created_at
FROM rental_contracts
ORDER BY created_at DESC
LIMIT 5;
```

## Estado Actual

✅ **Corrección aplicada**
✅ **Frontend actualizado**
✅ **Estructura de BD compatible**
⏳ **Pendiente**: N8N debe actualizar con HTML

## Próximos Pasos

1. **Recargar el frontend**: `npm run dev` (si está corriendo)
2. **Aprobar una aplicación** para probar
3. **Configurar N8N** para que actualice el HTML del contrato
4. **Visualizar el contrato** una vez que N8N lo actualice

## Notas Importantes

- El contrato se crea **vacío** (sin HTML) al aprobar
- N8N debe **actualizar** el registro con el HTML
- El `contract_number` se genera automáticamente
- El formato es siempre `'html'` para contratos de N8N

