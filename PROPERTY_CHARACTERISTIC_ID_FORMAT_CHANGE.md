# Cambio de Formato: Property Characteristic ID

## Resumen del Cambio

Se ha actualizado el formato del `property_characteristic_id` en la tabla `properties` para optimizar la búsqueda de propiedades durante la generación de contratos.

### Cambios Realizados

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Formato** | `PROP_timestamp_id` (complejo) | `PROP_xxxxxx` (6 dígitos) |
| **Tipo de Dato** | TEXT (ya era) | TEXT (confirmado) |
| **Función Principal** | - | Búsqueda de propiedades para contratos |
| **Uso en RAG** | No aplica | No aplica (solo búsqueda) |

## Detalles Técnicos

### Función Generadora Actualizada

```sql
CREATE OR REPLACE FUNCTION generate_property_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  new_characteristic_id TEXT;
BEGIN
  IF NEW.property_characteristic_id IS NULL OR NEW.property_characteristic_id = '' THEN
    next_id := nextval('property_characteristic_id_seq');
    -- Formato actualizado: PROP_ seguido de 6 dígitos
    new_characteristic_id := 'PROP_' || LPAD(next_id::TEXT, 6, '0');
    NEW.property_characteristic_id := new_characteristic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Ejemplos de IDs

**Formato Correcto (Nuevo):**
- `PROP_000001`
- `PROP_000042`
- `PROP_001234`
- `PROP_999999`

**Formato Incorrecto (Antiguo):**
- `PROP_1704067200_a1b2c3d4` (timestamp + ID)
- `PROP_1704067300_v5w6x7y8` (timestamp + ID)

## Archivos Modificados/Creados

### Migraciones
- `supabase/migrations/20251029220600_fix_property_characteristic_id_format_to_6_digits.sql`
  - Migración principal que actualiza el formato

### Scripts de Aplicación
- `fix_property_characteristic_id_to_6_digits.sql`
  - Script independiente para aplicar el cambio de manera segura

### Scripts de Verificación
- `verify_property_characteristic_id_format.js`
  - Script Node.js para verificar que todos los IDs cumplan con el formato correcto

## Aplicación de la Migración

### Opción 1: Usando Supabase CLI (Recomendado)
```bash
supabase db push
```

### Opción 2: Script Independiente
```sql
-- Ejecutar el contenido de fix_property_characteristic_id_to_6_digits.sql
-- en el SQL Editor de Supabase
```

## Verificación

### Verificación Automática
```bash
node verify_property_characteristic_id_format.js
```

### Verificación Manual
```sql
-- Verificar formato correcto
SELECT COUNT(*) as correct_format_count
FROM properties
WHERE property_characteristic_id ~ '^PROP_[0-9]{6}$';

-- Verificar formato incorrecto
SELECT property_characteristic_id, address_street, address_number
FROM properties
WHERE property_characteristic_id IS NOT NULL
  AND property_characteristic_id != ''
  AND property_characteristic_id !~ '^PROP_[0-9]{6}$';
```

## Propósito del Cambio

1. **Identificación Mejorada**: Los IDs de 6 dígitos son más legibles y manejables
2. **Búsqueda Optimizada**: Facilita la búsqueda de propiedades específicas para generación de contratos
3. **Consistencia**: Mantiene un formato uniforme similar a otros characteristic_ids
4. **Función Específica**: Este ID no organiza datos RAG, sino que sirve específicamente para localizar propiedades

## Impacto en el Sistema

### ✅ Beneficios
- Mejor identificación de propiedades
- Formato más limpio y legible
- Optimización para búsqueda en contratos
- Consistencia con otros formatos de ID

### ⚠️ Consideraciones
- Los IDs existentes serán actualizados automáticamente
- La secuencia se reinicia para evitar conflictos
- Nuevos registros usarán el formato de 6 dígitos

## Próximos Pasos

1. **Aplicar la migración** en el entorno de desarrollo
2. **Verificar** que todos los IDs tienen el formato correcto
3. **Probar** la funcionalidad de búsqueda de propiedades en contratos
4. **Desplegar** a producción una vez verificado

## Contacto

Para preguntas sobre este cambio, revisar:
- La función `generate_property_characteristic_id()`
- Los scripts de verificación incluidos
- La migración principal en `supabase/migrations/`
