# Instrucciones para Aplicar Migración de Campos del Propietario

## Resumen de Cambios

Se ha implementado una lógica condicional en el formulario de publicación de propiedades para manejar diferentes tipos de propietarios (Persona Natural vs Persona Jurídica).

### Cambios Realizados:

1. **Formulario React (PropertyPublicationForm.tsx)**:
   - ✅ Agregado selector de tipo de persona (Natural/Jurídica)
   - ✅ Campos condicionales para Persona Natural (nombres, apellidos, RUT, email, teléfono)
   - ✅ Campos condicionales para Persona Jurídica (razón social, RUT empresa, giro, email, teléfono)
   - ✅ Campos para representante legal (nombres, apellidos, RUT, email, teléfono)
   - ✅ Campo condicional para certificado de personería (solo para jurídicas)
   - ✅ Validaciones actualizadas para los nuevos campos requeridos
   - ✅ Lógica de guardado actualizada para incluir todos los campos

2. **Base de Datos**:
   - ✅ Migración SQL creada: `20251015130000_add_owner_fields_to_properties.sql`
   - ✅ Tipos TypeScript actualizados en `supabase.ts`

## Aplicación de la Migración

### Opción 1: Supabase Dashboard (Recomendado)
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a "SQL Editor"
3. Copia y pega el contenido del archivo `20251015130000_add_owner_fields_to_properties.sql`
4. Ejecuta la consulta

### Opción 2: Supabase CLI (si tienes Docker corriendo)
```bash
npx supabase db reset --yes
```

### Opción 3: Ejecutar manualmente en PostgreSQL
Si tienes acceso directo a PostgreSQL, ejecuta el archivo SQL directamente.

## Verificación

Después de aplicar la migración, verifica que los campos se crearon correctamente:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name LIKE 'owner_%'
ORDER BY column_name;
```

Deberías ver estos campos nuevos:
- owner_type
- owner_first_name, owner_paternal_last_name, owner_maternal_last_name
- owner_rut, owner_email, owner_phone
- owner_company_name, owner_company_rut, owner_company_business, owner_company_email, owner_company_phone
- owner_representative_first_name, owner_representative_paternal_last_name, owner_representative_maternal_last_name
- owner_representative_rut, owner_representative_email, owner_representative_phone

## Funcionalidades Implementadas

1. **Selector Dinámico**: El usuario puede elegir entre "Persona Natural" o "Persona Jurídica"

2. **Campos Condicionales**:
   - **Persona Natural**: Nombres, apellido paterno, apellido materno, RUT, email, teléfono
   - **Persona Jurídica**: Razón social, RUT empresa, giro, email empresa, teléfono empresa
   - **Representante Legal** (solo para jurídicas): Nombres, apellidos, RUT, email, teléfono

3. **Documentos Condicionales**:
   - Certificado de personería (solo visible para personas jurídicas)

4. **Validaciones**: Todos los campos marcados como requeridos son validados antes del envío

5. **Persistencia**: Los datos se guardan en la tabla `properties` y se cargan correctamente al editar

## Archivos Modificados

- `src/components/properties/PropertyPublicationForm.tsx` - Formulario principal
- `src/lib/supabase.ts` - Tipos TypeScript
- `20251015130000_add_owner_fields_to_properties.sql` - Migración de base de datos

¡La implementación está completa y lista para usar!
