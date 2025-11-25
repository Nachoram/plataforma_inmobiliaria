# Migración: Relación Directa Guarantors-Properties

## 📋 Resumen

Esta migración implementa una relación directa entre la tabla `guarantors` y `properties`, permitiendo que los garantes estén ligados directamente con las propiedades que respaldan, además de mantener la relación existente con las postulaciones (`applications`).

## 🔗 Estructura Anterior vs Nueva

### Antes
```
applications (property_id) → properties
applications (guarantor_id) → guarantors
```

### Después
```
applications (property_id) → properties
applications (guarantor_id) → guarantors
guarantors (property_id) → properties  ← NUEVA RELACIÓN DIRECTA
```

## 📝 Cambios Implementados

### 1. Nueva Columna en Guarantors
- **Columna**: `property_id` (UUID, referencia a `properties.id`)
- **Comportamiento**: `ON DELETE CASCADE`
- **Comentario**: "ID de la propiedad que este garante respalda directamente"

### 2. Actualización de Datos Existentes
- Los guarantors existentes en postulaciones (`applications`) se actualizan automáticamente con el `property_id` correspondiente.

### 3. Índices Optimizados
- `idx_guarantors_property_id`: Búsquedas por propiedad
- `idx_guarantors_property_created`: Índice compuesto para listados ordenados

### 4. Políticas RLS Actualizadas
- **Propietarios de propiedades** pueden ver/editar garantes de sus propiedades
- **Postulantes** pueden ver/editar garantes de sus postulaciones
- **Cualquier usuario autenticado** puede crear garantes

### 5. Nueva Función Helper
```sql
get_guarantors_for_property(property_uuid uuid)
```
Retorna todos los garantes asociados a una propiedad específica junto con el conteo de postulaciones.

### 6. Vista Actualizada
- `applications_complete_view` ahora incluye `guarantor_property_id` para mostrar la relación directa.

### 7. Validación de Consistencia
- **Trigger**: `validate_guarantor_application_consistency`
- **Función**: Asegura que cuando se asocia un garante a una postulación, el garante pertenezca a la misma propiedad.

## 🚀 Cómo Aplicar la Migración

### Opción 1: Usando el Script JavaScript (Recomendado)
```bash
# Asegúrate de tener las variables de entorno configuradas
node apply_guarantors_property_relation_migration.js
```

### Opción 2: Ejecutar SQL Directamente
```bash
# Ejecutar el archivo SQL en Supabase
supabase db push
# o aplicar manualmente el contenido de 20251030_add_property_relation_to_guarantors.sql
```

## 🔍 Verificación de la Migración

### Verificar la Nueva Columna
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guarantors' AND column_name = 'property_id';
```

### Verificar la Nueva Función
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_guarantors_for_property';
```

### Verificar Índices
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'guarantors' AND indexname LIKE '%property%';
```

## 📖 Uso de la Nueva Estructura

### Crear un Garante para una Propiedad
```sql
INSERT INTO guarantors (
  first_name, paternal_last_name, rut, profession,
  monthly_income_clp, property_id, address_street, address_commune, address_region
) VALUES (
  'Juan', 'Pérez', '12345678-9', 'Ingeniero',
  2000000, 'property-uuid-here', 'Calle Falsa', 'Santiago', 'Región Metropolitana'
);
```

### Obtener Garantes de una Propiedad
```sql
SELECT * FROM get_guarantors_for_property('property-uuid-here');
```

### Crear una Postulación con Garante
```sql
INSERT INTO applications (
  property_id, applicant_id, guarantor_id, message
) VALUES (
  'property-uuid', 'applicant-uuid', 'guarantor-uuid', 'Estoy interesado en esta propiedad'
);
-- NOTA: El trigger validará que el garante pertenezca a la misma propiedad
```

## 🔐 Seguridad y Permisos

### Políticas Implementadas
1. **Lectura**: Propietarios ven garantes de sus propiedades + Postulantes ven garantes de sus postulaciones
2. **Escritura**: Propietarios editan garantes de sus propiedades + Postulantes editan garantes de sus postulaciones
3. **Inserción**: Cualquier usuario autenticado puede crear garantes

### Validaciones
- Un garante solo puede estar asociado a postulaciones de la propiedad que respalda
- Los datos existentes se migran automáticamente manteniendo consistencia

## 🎯 Beneficios de la Nueva Estructura

1. **Consulta Directa**: Los propietarios pueden ver todos los garantes de sus propiedades sin necesidad de consultar postulaciones
2. **Mejor Rendimiento**: Índices optimizados para consultas por propiedad
3. **Consistencia de Datos**: Validación automática asegura integridad referencial
4. **Flexibilidad**: Un garante puede respaldar múltiples postulaciones para la misma propiedad
5. **Escalabilidad**: Estructura preparada para futuras funcionalidades (ej: gestión independiente de garantes)

## ⚠️ Consideraciones Importantes

1. **Datos Existentes**: La migración actualiza automáticamente los guarantors existentes con sus property_id correspondientes
2. **Validación**: El trigger impide asociaciones inconsistentes entre garantías y propiedades
3. **RLS**: Las políticas aseguran que solo usuarios autorizados puedan acceder/ver/editar garantes
4. **Cascade Delete**: Si se elimina una propiedad, sus garantes asociados también se eliminan

## 🧪 Testing

Para probar la nueva funcionalidad:

1. Crear una propiedad de prueba
2. Crear un garante asociado a esa propiedad
3. Crear una postulación usando ese garante
4. Verificar que las consultas funcionen correctamente
5. Probar las validaciones (intentar asociar un garante de otra propiedad)

## 📞 Soporte

Si encuentras problemas con esta migración:
1. Verificar logs de Supabase
2. Revisar políticas RLS
3. Comprobar triggers activos
4. Validar índices creados

---

**Fecha de Implementación**: 2025-10-30
**Versión**: 1.0
**Estado**: ✅ Implementado y Probado





















