# Instrucciones para Implementar Tablas de Propietarios

## Problema Resuelto
Se han creado tablas separadas para propietarios de propiedades de arriendo y venta, y se han actualizado los formularios para guardar correctamente los datos de los propietarios.

## Archivos Creados/Modificados

### 1. Migración de Base de Datos
**Archivo:** `create_rental_and_sale_owners_tables.sql`

Esta migración crea:
- Tabla `rental_owners` para propietarios de propiedades en arriendo
- Tabla `sale_owners` para propietarios de propiedades en venta
- Políticas RLS (Row Level Security) para ambas tablas
- Índices para optimizar consultas
- Triggers para actualizar timestamps

### 2. Formulario de Arriendo Actualizado
**Archivo:** `src/components/properties/RentalPublicationForm.tsx`

**Cambios realizados:**
- Agregado campo `owner_rut` al estado del formulario
- Agregada validación para el RUT del propietario
- Agregado campo RUT en el formulario HTML
- Modificada la función `handleSubmit` para guardar datos en la tabla `rental_owners`

### 3. Nuevo Formulario de Venta
**Archivo:** `src/components/properties/SalePublicationForm.tsx`

**Características:**
- Formulario específico para propiedades en venta
- Campos completos para datos del propietario (incluyendo RUT)
- Validaciones completas
- Guarda datos en la tabla `sale_owners`
- Interfaz similar al formulario de arriendo pero con colores azules

## Pasos para Implementar

### Paso 1: Aplicar la Migración
1. Conecta a tu base de datos de Supabase
2. Ejecuta el archivo `create_rental_and_sale_owners_tables.sql`
3. Verifica que las tablas se crearon correctamente

### Paso 2: Actualizar las Rutas (Opcional)
Si quieres usar el nuevo formulario de venta, agrega la ruta en tu archivo de rutas:

```tsx
import { SalePublicationForm } from './components/properties/SalePublicationForm';

// En tu router
<Route path="/publicar-venta" element={<SalePublicationForm />} />
```

### Paso 3: Verificar Funcionamiento
1. Prueba publicar una propiedad en arriendo usando `RentalPublicationForm`
2. Verifica que los datos del propietario se guarden en la tabla `rental_owners`
3. Si implementaste el formulario de venta, prueba publicar una propiedad en venta
4. Verifica que los datos del propietario se guarden en la tabla `sale_owners`

## Estructura de las Nuevas Tablas

### Tabla `rental_owners`
```sql
- id (uuid, primary key)
- property_id (uuid, foreign key to properties)
- first_name (text)
- paternal_last_name (text)
- maternal_last_name (text)
- rut (varchar(12))
- address_street (text)
- address_number (varchar(10))
- address_department (varchar(10))
- address_commune (text)
- address_region (text)
- marital_status (enum)
- property_regime (enum)
- phone (varchar(20))
- email (varchar(255))
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabla `sale_owners`
```sql
- id (uuid, primary key)
- property_id (uuid, foreign key to properties)
- first_name (text)
- paternal_last_name (text)
- maternal_last_name (text)
- rut (varchar(12))
- address_street (text)
- address_number (varchar(10))
- address_department (varchar(10))
- address_commune (text)
- address_region (text)
- marital_status (enum)
- property_regime (enum)
- phone (varchar(20))
- email (varchar(255))
- created_at (timestamptz)
- updated_at (timestamptz)
```

## Beneficios de esta Implementación

1. **Separación de Datos**: Los propietarios de arriendo y venta están en tablas separadas
2. **Datos Completos**: Se capturan todos los datos necesarios del propietario
3. **Validaciones**: Formularios con validaciones completas
4. **Seguridad**: Políticas RLS implementadas
5. **Escalabilidad**: Estructura preparada para futuras funcionalidades
6. **Integridad**: Relaciones correctas entre propiedades y propietarios

## Notas Importantes

- Los formularios mantienen la funcionalidad existente de subir archivos
- Las políticas RLS aseguran que los usuarios solo puedan ver/editar sus propios datos
- Los datos del propietario se guardan tanto en `profiles` (para compatibilidad) como en las nuevas tablas específicas
- El campo RUT es obligatorio en ambos formularios

## Próximos Pasos Sugeridos

1. Crear vistas para consultar propiedades con datos de propietarios
2. Implementar funcionalidad de edición de datos de propietarios
3. Agregar validación de RUT chileno
4. Crear reportes que incluyan información de propietarios
