# Cambio de Formato: Rental Owner Characteristic ID

## Resumen del Cambio

Se ha actualizado el formato del `rental_owner_characteristic_id` en la tabla `rental_owners` para optimizar la búsqueda de arrendatarios durante la generación de contratos.

### Cambios Realizados

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Formato** | `RENTAL_OWNER_XXXXXXX` (7 dígitos) | `RENTAL_OWNER_xxxxxx` (6 dígitos) |
| **Tipo de Dato** | UUID/TEXT | TEXT (confirmado) |
| **Función Principal** | - | Búsqueda de arrendatarios para contratos |
| **Uso en RAG** | Organización de datos | No aplica (solo búsqueda) |

## Archivos Modificados/Creados

### Migraciones
- `supabase/migrations/20251029220500_fix_rental_owner_characteristic_id_format_to_6_digits.sql`
  - Migración principal que actualiza el formato

### Scripts de Aplicación
- `fix_rental_owner_characteristic_id_to_6_digits.sql`
  - Script independiente para aplicar el cambio de manera segura

### Scripts de Verificación
- `verify_rental_owner_characteristic_id_format.js`
  - Script Node.js para verificar que todos los IDs cumplan con el formato correcto

## Detalles Técnicos

### Función Generadora Actualizada

```sql
CREATE OR REPLACE FUNCTION generate_rental_owner_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  new_characteristic_id TEXT;
BEGIN
  IF NEW.rental_owner_characteristic_id IS NULL OR NEW.rental_owner_characteristic_id = '' THEN
    next_id := nextval('rental_owner_characteristic_id_seq');
    -- Formato actualizado: 6 dígitos en lugar de 7
    new_characteristic_id := 'RENTAL_OWNER_' || LPAD(next_id::TEXT, 6, '0');
    NEW.rental_owner_characteristic_id := new_characteristic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Ejemplos de IDs

**Formato Correcto:**
- `RENTAL_OWNER_000001`
- `RENTAL_OWNER_000042`
- `RENTAL_OWNER_001234`
- `RENTAL_OWNER_999999`

**Formato Incorrecto (antiguo):**
- `RENTAL_OWNER_0000001` (7 dígitos)

## Propósito del Cambio

1. **Identificación Mejorada**: Los IDs de 6 dígitos son más legibles y manejables
2. **Búsqueda Optimizada**: Facilita la búsqueda de arrendatarios específicos para generación de contratos
3. **Consistencia**: Mantiene un formato uniforme en toda la aplicación
4. **Función Específica**: Este ID no organiza datos RAG, sino que sirve específicamente para localizar arrendatarios

## Aplicación de la Migración

### Opción 1: Usando Supabase CLI (Recomendado)
```bash
supabase db push
```

### Opción 2: Script Independiente
```sql
-- Ejecutar el contenido de fix_rental_owner_characteristic_id_to_6_digits.sql
-- en el SQL Editor de Supabase
```

## Verificación

### Verificación Automática
```bash
node verify_rental_owner_characteristic_id_format.js
```

### Verificación Manual
```sql
-- Verificar formato correcto
SELECT COUNT(*) as correct_format_count
FROM rental_owners
WHERE rental_owner_characteristic_id ~ '^RENTAL_OWNER_\d{6}$';

-- Verificar formato incorrecto
SELECT rental_owner_characteristic_id, first_name, paternal_last_name
FROM rental_owners
WHERE rental_owner_characteristic_id NOT ~ '^RENTAL_OWNER_\d{6}$'
  AND rental_owner_characteristic_id IS NOT NULL;
```

## Impacto en el Sistema

### ✅ Beneficios
- Mejor identificación de arrendatarios
- Formato más limpio y legible
- Optimización para búsqueda en contratos
- Consistencia en el formato de IDs

### ⚠️ Consideraciones
- Los IDs existentes serán actualizados automáticamente
- La secuencia se reinicia para evitar conflictos
- Nuevos registros usarán el formato de 6 dígitos

## Próximos Pasos

1. **Aplicar la migración** en el entorno de desarrollo
2. **Verificar** que todos los IDs tienen el formato correcto
3. **Probar** la generación de contratos con los nuevos IDs
4. **Desplegar** a producción una vez verificado

## Contacto

Para preguntas sobre este cambio, revisar:
- La función `generate_rental_owner_characteristic_id()`
- Los scripts de verificación incluidos
- La migración principal en `supabase/migrations/`
