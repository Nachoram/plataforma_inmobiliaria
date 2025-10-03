# 🔧 Aplicar Solución Completa - Contratos

## El Problema

Error al crear contratos:
```
❌ new row violates row-level security policy for table "rental_contracts"
```

## Causas Identificadas

1. ✅ `contract_content` podría ser NOT NULL (necesita ser nullable)
2. ✅ Políticas RLS no permiten inserción desde el frontend
3. ✅ Usuario autenticado necesita ser propietario de la propiedad

## Solución: 2 Opciones

### Opción A: SQL Directo (Más Rápido) ⚡

```bash
# Copia y pega este comando en la terminal SQL de Supabase
```

```sql
-- 1. Hacer contract_content nullable
ALTER TABLE rental_contracts 
ALTER COLUMN contract_content DROP NOT NULL;

-- 2. Recrear política INSERT
DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;

CREATE POLICY "Owners can create contracts for their applications" 
ON rental_contracts
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = rental_contracts.application_id
    AND p.owner_id = auth.uid()
  )
);
```

### Opción B: Archivo SQL Completo

```bash
# En tu terminal de PostgreSQL o Supabase SQL Editor:
psql -U postgres -d tu_base_datos -f SOLUCION_COMPLETA_RLS_CONTRACTS.sql
```

O desde el Dashboard de Supabase:
1. Ir a SQL Editor
2. Abrir `SOLUCION_COMPLETA_RLS_CONTRACTS.sql`
3. Ejecutar

## Verificar Solución

### 1. Verificar que contract_content es nullable

```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rental_contracts' 
  AND column_name = 'contract_content';
```

Debe retornar: `is_nullable = YES`

### 2. Verificar políticas RLS

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'rental_contracts' 
ORDER BY cmd;
```

Debe mostrar:
- ✅ INSERT: "Owners can create contracts..."
- ✅ SELECT: "Owners can view..." y "Applicants can view..."
- ✅ UPDATE: "Owners can update..."

### 3. Probar inserción

```bash
node test_insert_directo.js
```

## Después de Aplicar

1. **Recarga el navegador** (Ctrl + Shift + R)
2. **Ve a**: /applications
3. **Aprueba una aplicación**
4. **Debe funcionar** ✅

## Verificar Resultado

```bash
node ver_contratos.js
```

Debe mostrar el contrato creado.

## Si Aún Falla

### Verificar Usuario Autenticado

El usuario que aprueba la aplicación **DEBE ser el propietario** de la propiedad.

Si el error persiste:

1. Verifica en Supabase Dashboard → Authentication → Users
   - ¿Cuál es tu user ID?
   
2. Verifica en la tabla properties:
   ```sql
   SELECT id, owner_id 
   FROM properties 
   WHERE id = (
     SELECT property_id 
     FROM applications 
     WHERE id = '69a4f2d5-e08b-4c8e-a748-7e4de3e2d8fb'
   );
   ```

3. Compara: ¿Tu user ID coincide con el owner_id de la propiedad?

Si NO coinciden:
```sql
-- Actualiza el owner de la propiedad a tu usuario
UPDATE properties 
SET owner_id = 'tu-user-id-aqui'
WHERE id = 'property-id-aqui';
```

## Resumen Ejecutivo

```bash
# 1. Aplicar SQL
psql ... -f SOLUCION_COMPLETA_RLS_CONTRACTS.sql

# 2. Verificar
node ver_contratos.js

# 3. Probar en navegador
# Recargar y aprobar aplicación

# 4. Ver resultado
node ver_contratos.js
```

## Estado Esperado

✅ contract_content nullable
✅ Políticas RLS creadas
✅ Usuario puede crear contratos
✅ Contrato se crea al aprobar aplicación

