# Función RPC: get_properties_with_postulation_count

Esta función RPC de PostgreSQL optimiza la consulta de propiedades con conteo de postulaciones para un usuario específico.

## Descripción

La función `get_properties_with_postulation_count` realiza una consulta optimizada que:
1. Filtra propiedades por `owner_id` (usuario propietario)
2. Cuenta las postulaciones (applications) relacionadas con cada propiedad
3. Devuelve todas las columnas de la tabla `properties` más una columna `postulation_count`

## Beneficios de Optimización

- **Una sola consulta**: Usa `LEFT JOIN` y `GROUP BY` en lugar de múltiples consultas
- **Índices eficientes**: Aprovecha índices existentes en `owner_id` y `property_id`
- **Conteo preciso**: Incluye propiedades sin postulaciones (conteo = 0)

## Parámetros

- `user_id_param`: UUID del usuario propietario de las propiedades

## Retorno

Devuelve una tabla con todas las columnas de `properties` más:
- `postulation_count`: BIGINT - Número de postulaciones por propiedad

## Uso desde el Backend

### JavaScript/TypeScript (Supabase Client)

```javascript
import { supabase } from './supabaseClient';

const getPropertiesWithPostulationCount = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_properties_with_postulation_count', {
      user_id_param: userId
    });

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
};

// Ejemplo de uso
const userId = '550e8400-e29b-41d4-a716-446655440000';
const properties = await getPropertiesWithPostulationCount(userId);
```

### SQL Directo

```sql
-- Llamar la función directamente
SELECT * FROM get_properties_with_postulation_count('user-uuid-here'::uuid);

-- O con límite para paginación
SELECT * FROM get_properties_with_postulation_count('user-uuid-here'::uuid)
LIMIT 10 OFFSET 0;
```

## Estructura de la Respuesta

Cada fila contiene todas las columnas de `properties`:
- `id`, `owner_id`, `status`, `listing_type`, etc.
- `postulation_count`: Número de postulaciones para esa propiedad

## Consideraciones de Seguridad

- La función tiene `SECURITY DEFINER` para acceder a datos con permisos elevados
- Solo usuarios autenticados pueden ejecutar la función (`GRANT EXECUTE TO authenticated`)
- Los permisos RLS se aplican en el contexto del definidor de la función

## Rendimiento

- **Complejidad**: O(n) donde n es el número de propiedades del usuario
- **Optimización**: Un solo `LEFT JOIN` vs múltiples consultas separadas
- **Índices recomendados**: `properties(owner_id)`, `applications(property_id)`

## Ejemplo de Resultado

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "disponible",
    "listing_type": "venta",
    "address_street": "Calle Principal",
    "price_clp": 150000000,
    "bedrooms": 3,
    "bathrooms": 2,
    // ... todas las demás columnas de properties
    "postulation_count": 5
  }
]
```

## Instalación

Ejecutar el archivo `create_get_properties_with_postulation_count_function.sql` en la base de datos:

```bash
# Desde Supabase CLI
npx supabase db push

# O ejecutar directamente en SQL Editor de Supabase Dashboard
```

## Testing

Usar el archivo `test_get_properties_with_postulation_count.sql` para verificar la instalación y funcionalidad.
