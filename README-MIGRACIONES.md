# 🔧 **Migraciones y Fixes de Base de Datos**

> **Documentación completa de migraciones, fixes de errores críticos y scripts de reparación**

---

## 📋 **Índice**
- [🗄️ Migraciones Principales](#️-migraciones-principales)
- [🚨 Fixes de Errores Críticos](#-fixes-de-errores-críticos)
- [🛠️ Scripts de Reparación](#️-scripts-de-reparación)
- [🔍 Diagnóstico y Debugging](#-diagnóstico-y-debugging)
- [⚡ Optimización de Performance](#-optimización-de-performance)
- [📊 Mantenimiento Rutinario](#-mantenimiento-rutinario)
- [🧪 Testing de Migraciones](#-testing-de-migraciones)
- [📝 Historial de Cambios](#-historial-de-cambios)

---

## 🗄️ **Migraciones Principales**

### **Migración Base del Sistema**

#### **20250901000000_initial_schema.sql**
```sql
-- Migración inicial del esquema completo de la plataforma inmobiliaria
-- Ejecutar PRIMERA vez al configurar el proyecto

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos de datos personalizados
CREATE TYPE listing_type_enum AS ENUM ('venta', 'arriendo');
CREATE TYPE property_type_enum AS ENUM ('casa', 'departamento', 'oficina', 'local_comercial', 'terreno', 'bodega');
CREATE TYPE property_status_enum AS ENUM ('disponible', 'reservada', 'arrendada', 'vendida', 'pausada');
CREATE TYPE application_status_enum AS ENUM ('pendiente', 'info_solicitada', 'aprobada', 'rechazada');
CREATE TYPE offer_status_enum AS ENUM ('pendiente', 'aceptada', 'rechazada', 'contraoferta');
CREATE TYPE marital_status_enum AS ENUM ('soltero', 'casado', 'divorciado', 'viudo', 'union_civil');

-- Tabla de perfiles de usuario
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    first_name text DEFAULT '',
    paternal_last_name text DEFAULT '',
    maternal_last_name text DEFAULT '',
    rut text DEFAULT '',
    phone text DEFAULT '',
    profession text DEFAULT '',
    marital_status marital_status_enum DEFAULT 'soltero',
    address_street text DEFAULT '',
    address_number text DEFAULT '',
    address_commune text DEFAULT '',
    address_region text DEFAULT '',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla principal de propiedades
CREATE TABLE properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_type listing_type_enum NOT NULL,
    property_type property_type_enum NOT NULL,
    title text NOT NULL DEFAULT '',
    description text DEFAULT '',
    address_street text NOT NULL,
    address_number text NOT NULL,
    address_commune text NOT NULL,
    address_region text NOT NULL,
    price_clp bigint NOT NULL,
    common_expenses_clp bigint DEFAULT 0,
    surface_m2 integer NOT NULL,
    bedrooms integer DEFAULT 0,
    bathrooms integer DEFAULT 0,
    parking_spaces integer DEFAULT 0,
    has_terrace boolean DEFAULT false,
    has_garden boolean DEFAULT false,
    has_pool boolean DEFAULT false,
    allows_pets boolean DEFAULT false,
    is_furnished boolean DEFAULT false,
    status property_status_enum DEFAULT 'disponible',
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de postulaciones para arriendo
CREATE TABLE applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text DEFAULT '',
    status application_status_enum DEFAULT 'pendiente',
    
    -- Snapshot de datos del postulante (preservar información histórica)
    snapshot_applicant_profession text NOT NULL,
    snapshot_applicant_monthly_income_clp bigint NOT NULL,
    snapshot_applicant_age integer NOT NULL,
    snapshot_applicant_nationality text NOT NULL,
    snapshot_applicant_marital_status marital_status_enum NOT NULL,
    snapshot_applicant_address_street text NOT NULL,
    snapshot_applicant_address_number text NOT NULL,
    snapshot_applicant_address_commune text NOT NULL,
    snapshot_applicant_address_region text NOT NULL,
    
    guarantor_id uuid REFERENCES guarantors(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    UNIQUE(applicant_id, property_id)
);

-- Tabla de garantes
CREATE TABLE guarantors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    rut text NOT NULL,
    profession text NOT NULL,
    monthly_income_clp bigint NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    address_street text NOT NULL,
    address_number text NOT NULL,
    address_commune text NOT NULL,
    address_region text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla de ofertas de compra
CREATE TABLE offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    offerer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_clp bigint NOT NULL,
    message text DEFAULT '',
    status offer_status_enum DEFAULT 'pendiente',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de documentos
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type text NOT NULL, -- 'property_legal', 'application_applicant', 'application_guarantor'
    entity_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    content_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla de imágenes de propiedades
CREATE TABLE property_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_path text NOT NULL,
    image_order integer DEFAULT 0,
    alt_text text DEFAULT '',
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla de favoritos de usuarios
CREATE TABLE user_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, property_id)
);

-- Índices para optimización
CREATE INDEX idx_properties_status_location ON properties(status, address_commune, address_region) WHERE is_visible = true;
CREATE INDEX idx_properties_type_price ON properties(property_type, listing_type, price_clp) WHERE status = 'disponible';
CREATE INDEX idx_applications_status_created ON applications(status, created_at);
CREATE INDEX idx_offers_status_created ON offers(status, created_at);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_property_images_property ON property_images(property_id, image_order);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Migración de RLS (Row Level Security)**

#### **20250901120000_enable_rls.sql**
```sql
-- Habilitar Row Level Security en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Políticas para properties
CREATE POLICY "properties_select_policy" ON properties FOR SELECT USING (
    (status = 'disponible' AND is_visible = true) OR (auth.uid() = owner_id)
);
CREATE POLICY "properties_insert_policy" ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id AND auth.uid() IS NOT NULL);
CREATE POLICY "properties_update_policy" ON properties FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties_delete_policy" ON properties FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para applications
CREATE POLICY "applications_select_policy" ON applications FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = applications.property_id)
);
CREATE POLICY "applications_insert_policy" ON applications FOR INSERT WITH CHECK (
    auth.uid() = applicant_id AND auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND status = 'disponible' AND is_visible = true)
);
CREATE POLICY "applications_update_policy" ON applications FOR UPDATE USING (
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = applications.property_id)
) WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = applications.property_id)
);

-- Políticas para offers
CREATE POLICY "offers_select_policy" ON offers FOR SELECT USING (
    auth.uid() = offerer_id OR 
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = offers.property_id)
);
CREATE POLICY "offers_insert_policy" ON offers FOR INSERT WITH CHECK (
    auth.uid() = offerer_id AND auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND listing_type = 'venta' AND status = 'disponible' AND is_visible = true) AND
    amount_clp > 0
);
CREATE POLICY "offers_update_policy" ON offers FOR UPDATE USING (
    auth.uid() = offerer_id OR auth.uid() IN (SELECT owner_id FROM properties WHERE id = offers.property_id)
) WITH CHECK (
    auth.uid() = offerer_id OR auth.uid() IN (SELECT owner_id FROM properties WHERE id = offers.property_id)
);
CREATE POLICY "offers_delete_policy" ON offers FOR DELETE USING (auth.uid() = offerer_id AND status = 'pendiente');

-- Políticas para otras tablas...
-- (Ver README-SEGURIDAD.md para políticas completas)
```

---

## 🚨 **Fixes de Errores Críticos**

### **Fix Error 500 - Trigger de Creación de Perfiles**

#### **20250902180000_fix_auth_trigger.sql**
```sql
-- PROBLEMA: Error 500 al registrar usuarios debido a trigger fallido
-- SOLUCIÓN: Recrear trigger con manejo de errores mejorado

-- Eliminar trigger anterior (si existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Tabla para registrar errores del trigger (debugging)
CREATE TABLE IF NOT EXISTS trigger_errors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    error_message text,
    error_detail text,
    created_at timestamp with time zone DEFAULT now()
);

-- Función mejorada para crear perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  first_name text;
  last_name text;
BEGIN
  -- Extraer datos del usuario
  user_email := COALESCE(NEW.email, '');
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name := COALESCE(NEW.raw_user_meta_data->>'paternal_last_name', '');
  
  -- Insertar perfil básico
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    paternal_last_name,
    maternal_last_name,
    rut,
    phone,
    profession,
    marital_status,
    address_street,
    address_number,
    address_commune,
    address_region,
    created_at
  ) VALUES (
    NEW.id,
    user_email,
    first_name,
    last_name,
    '', -- Se completará después por el usuario
    '', -- Se completará después por el usuario
    '', -- Se completará después por el usuario
    '', -- Se completará después por el usuario
    'soltero', -- Valor por defecto
    '', -- Se completará después por el usuario
    '', -- Se completará después por el usuario
    '', -- Se completará después por el usuario
    '', -- Se completará después por el usuario
    now()
  );
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Registrar error para debugging pero no fallar la creación del usuario
  INSERT INTO public.trigger_errors (
    user_id,
    error_message,
    error_detail,
    created_at
  ) VALUES (
    NEW.id,
    SQLERRM,
    SQLSTATE,
    now()
  );
  
  -- IMPORTANTE: Retornar NEW para no bloquear la creación del usuario
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Script de verificación
-- Ejecutar para verificar que el trigger funciona:
/*
SELECT 
  u.id,
  u.email,
  p.id as profile_id,
  p.first_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.created_at > now() - interval '1 hour';

-- Verificar errores del trigger
SELECT * FROM trigger_errors ORDER BY created_at DESC LIMIT 10;
*/
```

### **Fix Error 406/403 - Primary Key en Profiles**

#### **20250902190000_fix_profiles_primary_key.sql**
```sql
-- PROBLEMA: Error 406 "Content-Type Mismatch" y 403 al consultar profiles
-- CAUSA: Falta Primary Key y Foreign Key constraints en tabla profiles
-- SOLUCIÓN: Agregar constraints faltantes y limpiar duplicados

-- 1. Verificar estructura actual
DO $$
BEGIN
  RAISE NOTICE 'Verificando estructura actual de profiles...';
  
  -- Mostrar constraints existentes
  RAISE NOTICE 'Constraints actuales:';
  PERFORM 1; -- Placeholder para mostrar constraints
END $$;

-- 2. Limpiar posibles duplicados antes de agregar constraints
-- Mantener solo el registro más reciente de cada usuario
DELETE FROM profiles 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
    FROM profiles
  ) ranked
  WHERE rn > 1
);

-- 3. Verificar que no hay huérfanos (profiles sin usuario)
DELETE FROM profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- 4. Agregar Primary Key si no existe
DO $$
BEGIN
  -- Verificar si ya existe la primary key
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE profiles ADD PRIMARY KEY (id);
    RAISE NOTICE 'Primary Key agregada a profiles.id';
  ELSE
    RAISE NOTICE 'Primary Key ya existe en profiles.id';
  END IF;
END $$;

-- 5. Agregar Foreign Key si no existe
DO $$
BEGIN
  -- Verificar si ya existe la foreign key
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign Key agregada: profiles.id -> auth.users.id';
  ELSE
    RAISE NOTICE 'Foreign Key ya existe: profiles.id -> auth.users.id';
  END IF;
END $$;

-- 6. Agregar unique constraint para email si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'profiles_email_key'
  ) THEN
    -- Limpiar emails duplicados primero
    DELETE FROM profiles 
    WHERE id IN (
      SELECT id 
      FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM profiles
        WHERE email != ''
      ) ranked
      WHERE rn > 1
    );
    
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    RAISE NOTICE 'Unique constraint agregada a profiles.email';
  ELSE
    RAISE NOTICE 'Unique constraint ya existe en profiles.email';
  END IF;
END $$;

-- 7. Verificación final
DO $$
DECLARE
  total_profiles integer;
  total_users integer;
  orphaned_profiles integer;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO total_users FROM auth.users;
  
  SELECT COUNT(*) INTO orphaned_profiles 
  FROM profiles p 
  LEFT JOIN auth.users u ON p.id = u.id 
  WHERE u.id IS NULL;
  
  RAISE NOTICE 'VERIFICACIÓN FINAL:';
  RAISE NOTICE '- Total profiles: %', total_profiles;
  RAISE NOTICE '- Total users: %', total_users;
  RAISE NOTICE '- Profiles huérfanos: %', orphaned_profiles;
  
  IF orphaned_profiles > 0 THEN
    RAISE WARNING 'Existen profiles sin usuario correspondiente!';
  ELSE
    RAISE NOTICE '✓ Estructura de profiles corregida correctamente';
  END IF;
END $$;
```

### **Fix Error 406/403 - RLS Policies para Properties**

#### **20250902210000_fix_properties_rls_policies.sql**
```sql
-- PROBLEMA: Error 406 "Not Acceptable" y 403 "Forbidden" al publicar propiedades
-- CAUSA: 1) Falta valor 'disponible' en enum property_status_enum
--        2) RLS policies usan user() en lugar de auth.uid()
--        3) Default status no coincide con enum

-- 1. Verificar enum actual
DO $$
BEGIN
  RAISE NOTICE 'Verificando enum property_status_enum...';
  -- Mostrar valores actuales del enum
END $$;

-- 2. Agregar 'disponible' al enum si no existe
DO $$
BEGIN
  -- Verificar si 'disponible' ya existe en el enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'property_status_enum' 
    AND e.enumlabel = 'disponible'
  ) THEN
    ALTER TYPE property_status_enum ADD VALUE 'disponible';
    RAISE NOTICE '✓ Valor "disponible" agregado al enum property_status_enum';
  ELSE
    RAISE NOTICE 'ℹ Valor "disponible" ya existe en el enum';
  END IF;
END $$;

-- 3. Cambiar default de la columna status
ALTER TABLE properties ALTER COLUMN status SET DEFAULT 'disponible';
RAISE NOTICE '✓ Default status cambiado a "disponible"';

-- 4. Actualizar propiedades existentes con status NULL o inválido
UPDATE properties 
SET status = 'disponible' 
WHERE status IS NULL;

UPDATE properties 
SET status = 'disponible' 
WHERE status NOT IN ('disponible', 'reservada', 'arrendada', 'vendida', 'pausada');

RAISE NOTICE '✓ Propiedades existentes actualizadas con status "disponible"';

-- 5. Eliminar políticas RLS existentes que usan user()
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON properties;

-- 6. Crear nuevas políticas RLS usando auth.uid()
CREATE POLICY "properties_select_policy" ON properties
FOR SELECT
USING (
  -- Público puede ver propiedades disponibles y visibles
  (status = 'disponible' AND is_visible = true) OR
  -- Propietarios pueden ver todas sus propiedades
  (auth.uid() = owner_id)
);

CREATE POLICY "properties_insert_policy" ON properties
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "properties_update_policy" ON properties
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_delete_policy" ON properties
FOR DELETE
USING (auth.uid() = owner_id);

RAISE NOTICE '✓ Políticas RLS recreadas con auth.uid()';

-- 7. Actualizar TypeScript interfaces (manual)
-- NOTA: Ejecutar manualmente en src/lib/supabase.ts:
/*
export interface Property {
  // ... otros campos ...
  status: 'disponible' | 'reservada' | 'arrendada' | 'vendida' | 'pausada';
  // ... resto de campos ...
}
*/

-- 8. Verificación final
DO $$
DECLARE
  total_properties integer;
  available_properties integer;
  properties_with_owner integer;
BEGIN
  SELECT COUNT(*) INTO total_properties FROM properties;
  SELECT COUNT(*) INTO available_properties FROM properties WHERE status = 'disponible';
  SELECT COUNT(*) INTO properties_with_owner FROM properties WHERE owner_id IS NOT NULL;
  
  RAISE NOTICE 'VERIFICACIÓN FINAL:';
  RAISE NOTICE '- Total propiedades: %', total_properties;
  RAISE NOTICE '- Propiedades disponibles: %', available_properties;
  RAISE NOTICE '- Propiedades con owner: %', properties_with_owner;
  
  IF properties_with_owner = total_properties THEN
    RAISE NOTICE '✓ Todas las propiedades tienen owner_id';
  ELSE
    RAISE WARNING 'Algunas propiedades no tienen owner_id!';
  END IF;
END $$;
```

### **Fix Error 409 - Duplicate Property Prevention**

#### **20250902220000_fix_duplicate_properties.sql**
```sql
-- PROBLEMA: Error 409 "Conflict" al publicar propiedades con direcciones duplicadas
-- SOLUCIÓN: Agregar validación y constraint para prevenir duplicados

-- 1. Crear función para normalizar direcciones
CREATE OR REPLACE FUNCTION normalize_address(
  p_street text,
  p_number text,
  p_commune text,
  p_region text
) RETURNS text AS $$
BEGIN
  RETURN LOWER(TRIM(
    COALESCE(p_street, '') || ' ' ||
    COALESCE(p_number, '') || ', ' ||
    COALESCE(p_commune, '') || ', ' ||
    COALESCE(p_region, '')
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Agregar columna para dirección normalizada
ALTER TABLE properties ADD COLUMN IF NOT EXISTS normalized_address text;

-- 3. Poblar direcciones normalizadas para propiedades existentes
UPDATE properties 
SET normalized_address = normalize_address(
  address_street, 
  address_number, 
  address_commune, 
  address_region
)
WHERE normalized_address IS NULL;

-- 4. Crear función trigger para mantener normalizada la dirección
CREATE OR REPLACE FUNCTION update_normalized_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_address := normalize_address(
    NEW.address_street,
    NEW.address_number,
    NEW.address_commune,
    NEW.address_region
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para actualizar automáticamente
DROP TRIGGER IF EXISTS update_property_normalized_address ON properties;
CREATE TRIGGER update_property_normalized_address
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_normalized_address();

-- 6. Función para verificar duplicados antes de insertar
CREATE OR REPLACE FUNCTION check_property_duplicate()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count integer;
  duplicate_id uuid;
BEGIN
  -- Contar propiedades existentes con la misma dirección normalizada
  -- del mismo propietario (evitar que alguien publique la misma propiedad múltiples veces)
  SELECT COUNT(*), MIN(id) 
  INTO duplicate_count, duplicate_id
  FROM properties 
  WHERE normalized_address = NEW.normalized_address
  AND owner_id = NEW.owner_id
  AND status IN ('disponible', 'reservada')  -- Solo considerar propiedades activas
  AND (NEW.id IS NULL OR id != NEW.id); -- Excluir la propia propiedad en UPDATEs
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Ya existe una propiedad activa en esta dirección. ID existente: %', duplicate_id
      USING ERRCODE = '23505', -- unique_violation
            HINT = 'Verifique si ya tiene una propiedad publicada en esta dirección';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para verificar duplicados
DROP TRIGGER IF EXISTS check_property_duplicate_trigger ON properties;
CREATE TRIGGER check_property_duplicate_trigger
    BEFORE INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION check_property_duplicate();

-- 8. Crear índice único parcial para mejor performance
-- Solo para propiedades activas del mismo propietario
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_unique_active_address
ON properties (owner_id, normalized_address)
WHERE status IN ('disponible', 'reservada');

-- 9. Función auxiliar para frontend: verificar dirección antes de submit
CREATE OR REPLACE FUNCTION check_address_availability(
  p_owner_id uuid,
  p_street text,
  p_number text,
  p_commune text,
  p_region text,
  p_exclude_property_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  normalized_addr text;
  existing_count integer;
BEGIN
  normalized_addr := normalize_address(p_street, p_number, p_commune, p_region);
  
  SELECT COUNT(*)
  INTO existing_count
  FROM properties
  WHERE owner_id = p_owner_id
  AND normalized_address = normalized_addr
  AND status IN ('disponible', 'reservada')
  AND (p_exclude_property_id IS NULL OR id != p_exclude_property_id);
  
  RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Script de limpieza para duplicados existentes (ejecutar con cuidado)
/*
-- USAR SOLO SI HAY DUPLICADOS EXISTENTES
-- Este script mantiene la propiedad más reciente de cada dirección duplicada

WITH duplicates AS (
  SELECT 
    normalized_address,
    owner_id,
    array_agg(id ORDER BY created_at DESC) as property_ids,
    COUNT(*) as duplicate_count
  FROM properties 
  WHERE status IN ('disponible', 'reservada')
  GROUP BY normalized_address, owner_id
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT 
    unnest(property_ids[2:]) as property_id
  FROM duplicates
)
DELETE FROM properties 
WHERE id IN (SELECT property_id FROM to_delete);
*/

-- 11. Verificación final
DO $$
DECLARE
  total_properties integer;
  properties_with_normalized integer;
  duplicate_addresses integer;
BEGIN
  SELECT COUNT(*) INTO total_properties FROM properties;
  SELECT COUNT(*) INTO properties_with_normalized FROM properties WHERE normalized_address IS NOT NULL;
  
  SELECT COUNT(*) INTO duplicate_addresses
  FROM (
    SELECT normalized_address, owner_id, COUNT(*) 
    FROM properties 
    WHERE status IN ('disponible', 'reservada')
    GROUP BY normalized_address, owner_id 
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'VERIFICACIÓN FINAL:';
  RAISE NOTICE '- Total propiedades: %', total_properties;
  RAISE NOTICE '- Con dirección normalizada: %', properties_with_normalized;
  RAISE NOTICE '- Direcciones duplicadas: %', duplicate_addresses;
  
  IF duplicate_addresses = 0 THEN
    RAISE NOTICE '✓ No hay direcciones duplicadas';
  ELSE
    RAISE WARNING 'Aún existen % direcciones duplicadas', duplicate_addresses;
  END IF;
END $$;
```

---

## 🛠️ **Scripts de Reparación**

### **Script de Diagnóstico General**

#### **diagnostic_full_system.sql**
```sql
-- Script completo de diagnóstico del sistema
-- Ejecutar para identificar problemas comunes

-- ===== DIAGNÓSTICO DE USUARIOS Y PERFILES =====
\echo '🔍 DIAGNÓSTICO DE USUARIOS Y PERFILES'

-- Usuarios sin perfil
SELECT 
  '❌ Usuarios sin perfil' as issue,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Perfiles huérfanos (sin usuario)
SELECT 
  '❌ Perfiles huérfanos' as issue,
  COUNT(*) as count
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Perfiles con email vacío
SELECT 
  '⚠️  Perfiles con email vacío' as issue,
  COUNT(*) as count
FROM profiles
WHERE email = '' OR email IS NULL;

-- ===== DIAGNÓSTICO DE PROPIEDADES =====
\echo '🏠 DIAGNÓSTICO DE PROPIEDADES'

-- Propiedades sin owner_id
SELECT 
  '❌ Propiedades sin propietario' as issue,
  COUNT(*) as count
FROM properties
WHERE owner_id IS NULL;

-- Propiedades con owner_id inválido
SELECT 
  '❌ Propiedades con propietario inválido' as issue,
  COUNT(*) as count
FROM properties p
LEFT JOIN auth.users u ON p.owner_id = u.id
WHERE p.owner_id IS NOT NULL AND u.id IS NULL;

-- Propiedades con status inválido
SELECT 
  '⚠️  Propiedades con status inválido' as issue,
  COUNT(*) as count
FROM properties
WHERE status NOT IN ('disponible', 'reservada', 'arrendada', 'vendida', 'pausada')
OR status IS NULL;

-- Propiedades con precios inválidos
SELECT 
  '⚠️  Propiedades con precios inválidos' as issue,
  COUNT(*) as count
FROM properties
WHERE price_clp <= 0 OR price_clp IS NULL;

-- ===== DIAGNÓSTICO DE POSTULACIONES =====
\echo '📋 DIAGNÓSTICO DE POSTULACIONES'

-- Postulaciones huérfanas (propiedad eliminada)
SELECT 
  '❌ Postulaciones huérfanas (propiedad)' as issue,
  COUNT(*) as count
FROM applications a
LEFT JOIN properties p ON a.property_id = p.id
WHERE p.id IS NULL;

-- Postulaciones huérfanas (usuario eliminado)
SELECT 
  '❌ Postulaciones huérfanas (usuario)' as issue,
  COUNT(*) as count
FROM applications a
LEFT JOIN auth.users u ON a.applicant_id = u.id
WHERE u.id IS NULL;

-- Postulaciones con datos snapshot incompletos
SELECT 
  '⚠️  Postulaciones con datos incompletos' as issue,
  COUNT(*) as count
FROM applications
WHERE snapshot_applicant_profession = '' 
OR snapshot_applicant_monthly_income_clp <= 0
OR snapshot_applicant_age < 18;

-- ===== DIAGNÓSTICO DE OFERTAS =====
\echo '💰 DIAGNÓSTICO DE OFERTAS'

-- Ofertas huérfanas (propiedad eliminada)
SELECT 
  '❌ Ofertas huérfanas (propiedad)' as issue,
  COUNT(*) as count
FROM offers o
LEFT JOIN properties p ON o.property_id = p.id
WHERE p.id IS NULL;

-- Ofertas huérfanas (usuario eliminado)
SELECT 
  '❌ Ofertas huérfanas (usuario)' as issue,
  COUNT(*) as count
FROM offers o
LEFT JOIN auth.users u ON o.offerer_id = u.id
WHERE u.id IS NULL;

-- Ofertas con montos inválidos
SELECT 
  '⚠️  Ofertas con montos inválidos' as issue,
  COUNT(*) as count
FROM offers
WHERE amount_clp <= 0 OR amount_clp IS NULL;

-- ===== DIAGNÓSTICO DE RLS =====
\echo '🔒 DIAGNÓSTICO DE ROW LEVEL SECURITY'

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✓ RLS Habilitado' ELSE '❌ RLS Deshabilitado' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties', 'applications', 'offers', 'documents', 'property_images', 'user_favorites')
ORDER BY tablename;

-- Contar políticas por tabla
SELECT 
  pt.tablename,
  COUNT(pp.policyname) as policy_count,
  CASE 
    WHEN COUNT(pp.policyname) >= 3 THEN '✓ Suficientes políticas'
    ELSE '⚠️  Pocas políticas'
  END as status
FROM pg_tables pt
LEFT JOIN pg_policies pp ON pt.tablename = pp.tablename
WHERE pt.schemaname = 'public' 
AND pt.tablename IN ('profiles', 'properties', 'applications', 'offers')
GROUP BY pt.tablename
ORDER BY pt.tablename;

-- ===== DIAGNÓSTICO DE ÍNDICES =====
\echo '📊 DIAGNÓSTICO DE ÍNDICES'

-- Verificar índices importantes
SELECT 
  indexname,
  tablename,
  CASE WHEN indexname IS NOT NULL THEN '✓ Existe' ELSE '❌ Falta' END as status
FROM (
  VALUES 
    ('idx_properties_status_location', 'properties'),
    ('idx_applications_status_created', 'applications'),
    ('idx_offers_status_created', 'offers')
) AS expected_indexes(indexname, tablename)
LEFT JOIN pg_indexes pi ON expected_indexes.indexname = pi.indexname;

-- ===== DIAGNÓSTICO DE TRIGGERS =====
\echo '⚡ DIAGNÓSTICO DE TRIGGERS'

-- Verificar triggers importantes
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  CASE WHEN trigger_name IS NOT NULL THEN '✓ Existe' ELSE '❌ Falta' END as status
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_properties_updated_at')
ORDER BY event_object_table, trigger_name;

-- ===== RESUMEN FINAL =====
\echo '📈 RESUMEN DEL SISTEMA'

SELECT 
  'Total usuarios' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Total perfiles' as metric,
  COUNT(*)::text as value
FROM profiles
UNION ALL
SELECT 
  'Total propiedades' as metric,
  COUNT(*)::text as value
FROM properties
UNION ALL
SELECT 
  'Propiedades disponibles' as metric,
  COUNT(*)::text as value
FROM properties
WHERE status = 'disponible' AND is_visible = true
UNION ALL
SELECT 
  'Total postulaciones' as metric,
  COUNT(*)::text as value
FROM applications
UNION ALL
SELECT 
  'Total ofertas' as metric,
  COUNT(*)::text as value
FROM offers;
```

### **Script de Limpieza de Datos**

#### **cleanup_orphaned_data.sql**
```sql
-- Script para limpiar datos huérfanos y corregir inconsistencias
-- USAR CON CUIDADO - HACE CAMBIOS PERMANENTES

-- ===== LIMPIEZA DE PERFILES =====
\echo '🧹 Limpiando perfiles huérfanos...'

-- Eliminar perfiles sin usuario correspondiente
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

\echo '✓ Perfiles huérfanos eliminados'

-- ===== LIMPIEZA DE PROPIEDADES =====
\echo '🏠 Limpiando propiedades...'

-- Eliminar propiedades sin propietario válido
DELETE FROM properties 
WHERE owner_id NOT IN (SELECT id FROM auth.users);

-- Corregir status inválidos
UPDATE properties 
SET status = 'disponible' 
WHERE status IS NULL 
OR status NOT IN ('disponible', 'reservada', 'arrendada', 'vendida', 'pausada');

-- Corregir precios inválidos (poner precio mínimo)
UPDATE properties 
SET price_clp = 1000000 
WHERE price_clp <= 0 OR price_clp IS NULL;

-- Corregir common_expenses negativos
UPDATE properties 
SET common_expenses_clp = 0 
WHERE common_expenses_clp < 0;

\echo '✓ Propiedades corregidas'

-- ===== LIMPIEZA DE POSTULACIONES =====
\echo '📋 Limpiando postulaciones...'

-- Eliminar postulaciones huérfanas (propiedad eliminada)
DELETE FROM applications 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Eliminar postulaciones huérfanas (usuario eliminado)
DELETE FROM applications 
WHERE applicant_id NOT IN (SELECT id FROM auth.users);

-- Corregir datos snapshot inválidos
UPDATE applications 
SET snapshot_applicant_age = 25 
WHERE snapshot_applicant_age < 18 OR snapshot_applicant_age > 100;

UPDATE applications 
SET snapshot_applicant_monthly_income_clp = 500000 
WHERE snapshot_applicant_monthly_income_clp <= 0;

UPDATE applications 
SET snapshot_applicant_profession = 'No especificado' 
WHERE snapshot_applicant_profession = '' OR snapshot_applicant_profession IS NULL;

\echo '✓ Postulaciones corregidas'

-- ===== LIMPIEZA DE OFERTAS =====
\echo '💰 Limpiando ofertas...'

-- Eliminar ofertas huérfanas (propiedad eliminada)
DELETE FROM offers 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Eliminar ofertas huérfanas (usuario eliminado)
DELETE FROM offers 
WHERE offerer_id NOT IN (SELECT id FROM auth.users);

-- Corregir montos inválidos
UPDATE offers 
SET amount_clp = (
  SELECT price_clp * 0.8 
  FROM properties 
  WHERE id = offers.property_id
)
WHERE amount_clp <= 0 OR amount_clp IS NULL;

\echo '✓ Ofertas corregidas'

-- ===== LIMPIEZA DE DOCUMENTOS =====
\echo '📄 Limpiando documentos...'

-- Eliminar documentos huérfanos (usuario eliminado)
DELETE FROM documents 
WHERE owner_id NOT IN (SELECT id FROM auth.users);

\echo '✓ Documentos corregidos'

-- ===== LIMPIEZA DE IMÁGENES =====
\echo '🖼️  Limpiando imágenes...'

-- Eliminar imágenes de propiedades eliminadas
DELETE FROM property_images 
WHERE property_id NOT IN (SELECT id FROM properties);

\echo '✓ Imágenes corregidas'

-- ===== LIMPIEZA DE FAVORITOS =====
\echo '⭐ Limpiando favoritos...'

-- Eliminar favoritos huérfanos
DELETE FROM user_favorites 
WHERE user_id NOT IN (SELECT id FROM auth.users)
OR property_id NOT IN (SELECT id FROM properties);

\echo '✓ Favoritos corregidos'

-- ===== OPTIMIZACIÓN FINAL =====
\echo '⚡ Optimizando tablas...'

VACUUM ANALYZE profiles;
VACUUM ANALYZE properties;
VACUUM ANALYZE applications;
VACUUM ANALYZE offers;
VACUUM ANALYZE documents;
VACUUM ANALYZE property_images;
VACUUM ANALYZE user_favorites;

\echo '✅ Limpieza completa terminada'

-- ===== VERIFICACIÓN FINAL =====
\echo '🔍 Verificación post-limpieza:'

-- Contar registros después de limpieza
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 'properties', COUNT(*) FROM properties
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'offers', COUNT(*) FROM offers
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'property_images', COUNT(*) FROM property_images
UNION ALL
SELECT 'user_favorites', COUNT(*) FROM user_favorites;
```

---

## 🔍 **Diagnóstico y Debugging**

### **Scripts de Debug por Errores Específicos**

#### **debug_registration_step1.sql**
```sql
-- Debug paso 1: Limpiar datos de prueba antiguos
\echo '🔍 PASO 1: Limpieza inicial'

-- Eliminar usuarios de prueba anteriores
DELETE FROM auth.users WHERE email LIKE '%test%' OR email LIKE '%debug%';

-- Limpiar logs de errores
DELETE FROM trigger_errors WHERE created_at < now() - interval '1 day';

-- Verificar estado inicial
SELECT 
  'usuarios_total' as metric,
  COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
  'perfiles_total',
  COUNT(*)
FROM profiles
UNION ALL
SELECT 
  'errores_trigger',
  COUNT(*)
FROM trigger_errors;

\echo '✅ Paso 1 completado'
```

#### **debug_registration_step2.sql**
```sql
-- Debug paso 2: Verificar estructura de tablas
\echo '🔍 PASO 2: Verificación de estructura'

-- Verificar que la tabla profiles existe y tiene la estructura correcta
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles';

-- Verificar que el trigger existe
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

\echo '✅ Paso 2 completado'
```

#### **debug_registration_step3.sql**
```sql
-- Debug paso 3: Desactivar RLS temporalmente
\echo '🔍 PASO 3: Desactivar RLS temporalmente'

-- Desactivar RLS en profiles para debugging
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

\echo '⚠️  RLS desactivado en profiles (solo para debugging)'
\echo '✅ Paso 3 completado - Ahora prueba el registro'
```

#### **debug_registration_step4.sql**
```sql
-- Debug paso 4: Recrear trigger minimalista
\echo '🔍 PASO 4: Recrear trigger minimalista'

-- Eliminar trigger actual
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Crear función minimalista para debugging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insertar perfil básico sin validaciones extras
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, COALESCE(NEW.email, ''), now());
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Insertar error en log
  INSERT INTO public.trigger_errors (
    user_id, error_message, error_detail, created_at
  ) VALUES (
    NEW.id, SQLERRM, SQLSTATE, now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

\echo '✅ Paso 4 completado - Trigger minimalista creado'
```

#### **debug_registration_step5.sql**
```sql
-- Debug paso 5: Analizar resultados
\echo '🔍 PASO 5: Analizar resultados'

-- Verificar usuarios creados recientemente
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Perfil creado'
    ELSE '❌ Sin perfil'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.created_at > now() - interval '1 hour'
ORDER BY u.created_at DESC;

-- Verificar errores del trigger
SELECT 
  user_id,
  error_message,
  error_detail,
  created_at
FROM trigger_errors
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- Reactivar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

\echo '✅ Paso 5 completado - RLS reactivado'
```

#### **test_registration.js**
```javascript
// Script de testing para el frontend
// Ejecutar en la consola del navegador o como test unitario

const testRegistration = async () => {
  console.log('🧪 Testing user registration...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. Registro
    console.log('📝 Registrando usuario...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          paternal_last_name: 'User'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Error en registro:', signUpError);
      return;
    }

    console.log('✅ Usuario registrado:', signUpData.user?.id);

    // 2. Esperar a que el trigger cree el perfil
    console.log('⏳ Esperando creación de perfil...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar perfil
    console.log('🔍 Verificando perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError);
    } else {
      console.log('✅ Perfil creado correctamente:', profile);
    }

    // 4. Test de autenticación
    console.log('🔐 Probando login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Error en login:', signInError);
    } else {
      console.log('✅ Login exitoso');
    }

    console.log('🎉 Test de registro completado');

  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
};

// Ejecutar test
testRegistration();
```

---

## ⚡ **Optimización de Performance**

### **Índices para Mejor Performance**

#### **performance_indexes.sql**
```sql
-- Índices adicionales para optimizar consultas frecuentes

-- ===== ÍNDICES PARA BÚSQUEDAS DE PROPIEDADES =====

-- Búsqueda por tipo y precio (marketplace)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_type_price_status
ON properties (property_type, listing_type, price_clp, status)
WHERE is_visible = true;

-- Búsqueda por ubicación (filtros geográficos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location
ON properties (address_region, address_commune, address_street);

-- Búsqueda full-text en descripción
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_description_search
ON properties USING gin(to_tsvector('spanish', description));

-- ===== ÍNDICES PARA DASHBOARD DE USUARIO =====

-- Propiedades del usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_owner_status
ON properties (owner_id, status, created_at DESC);

-- Postulaciones del usuario (como postulante)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_applicant
ON applications (applicant_id, status, created_at DESC);

-- Postulaciones a propiedades del usuario (como propietario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_property_owner
ON applications (property_id, status, created_at DESC);

-- Ofertas del usuario (como oferente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_offerer
ON offers (offerer_id, status, created_at DESC);

-- ===== ÍNDICES PARA STORAGE Y ARCHIVOS =====

-- Documentos por entidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_entity_type
ON documents (entity_type, entity_id, created_at DESC);

-- Imágenes de propiedades ordenadas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_images_ordered
ON property_images (property_id, image_order, created_at);

-- ===== ÍNDICES PARA AUDITORÍA =====

-- Logs de auditoría por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_time
ON audit_logs (user_id, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Logs de seguridad por severidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_severity_time
ON security_events (severity, timestamp DESC);

-- ===== ESTADÍSTICAS DE PERFORMANCE =====

-- Función para mostrar estadísticas de uso de índices
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
  table_name text,
  index_name text,
  times_used bigint,
  size_mb numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::text || '.' || relname::text as table_name,
    indexrelname::text as index_name,
    idx_scan as times_used,
    round(pg_relation_size(indexrelid) / 1024.0 / 1024.0, 2) as size_mb
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Ver estadísticas: SELECT * FROM get_index_usage_stats();
```

### **Query Optimization**

#### **optimized_queries.sql**
```sql
-- Queries optimizadas para operaciones frecuentes

-- ===== BÚSQUEDA OPTIMIZADA DE PROPIEDADES =====

-- Query optimizada para marketplace con filtros
CREATE OR REPLACE VIEW marketplace_properties AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.listing_type,
  p.property_type,
  p.address_street || ' ' || p.address_number as full_address,
  p.address_commune,
  p.address_region,
  p.price_clp,
  p.common_expenses_clp,
  p.surface_m2,
  p.bedrooms,
  p.bathrooms,
  p.parking_spaces,
  p.created_at,
  -- Imagen principal (primera imagen)
  (
    SELECT pi.image_path 
    FROM property_images pi 
    WHERE pi.property_id = p.id 
    ORDER BY pi.image_order 
    LIMIT 1
  ) as main_image,
  -- Número total de imágenes
  (
    SELECT COUNT(*) 
    FROM property_images pi 
    WHERE pi.property_id = p.id
  ) as total_images,
  -- Es favorito del usuario actual (si está autenticado)
  CASE 
    WHEN auth.uid() IS NOT NULL THEN (
      SELECT COUNT(*) > 0
      FROM user_favorites uf
      WHERE uf.user_id = auth.uid() AND uf.property_id = p.id
    )
    ELSE false
  END as is_favorite
FROM properties p
WHERE p.status = 'disponible' 
  AND p.is_visible = true;

-- ===== DASHBOARD OPTIMIZADO DEL USUARIO =====

-- Vista para propiedades del usuario con estadísticas
CREATE OR REPLACE VIEW user_properties_dashboard AS
SELECT 
  p.id,
  p.title,
  p.listing_type,
  p.property_type,
  p.status,
  p.price_clp,
  p.created_at,
  p.is_visible,
  -- Estadísticas de postulaciones (solo para arriendos)
  CASE 
    WHEN p.listing_type = 'arriendo' THEN (
      SELECT COUNT(*)
      FROM applications a
      WHERE a.property_id = p.id
    )
    ELSE 0
  END as total_applications,
  -- Estadísticas de ofertas (solo para ventas)
  CASE 
    WHEN p.listing_type = 'venta' THEN (
      SELECT COUNT(*)
      FROM offers o
      WHERE o.property_id = p.id
    )
    ELSE 0
  END as total_offers,
  -- Postulaciones pendientes
  CASE 
    WHEN p.listing_type = 'arriendo' THEN (
      SELECT COUNT(*)
      FROM applications a
      WHERE a.property_id = p.id AND a.status = 'pendiente'
    )
    ELSE 0
  END as pending_applications,
  -- Ofertas pendientes
  CASE 
    WHEN p.listing_type = 'venta' THEN (
      SELECT COUNT(*)
      FROM offers o
      WHERE o.property_id = p.id AND o.status = 'pendiente'
    )
    ELSE 0
  END as pending_offers,
  -- Imagen principal
  (
    SELECT pi.image_path 
    FROM property_images pi 
    WHERE pi.property_id = p.id 
    ORDER BY pi.image_order 
    LIMIT 1
  ) as main_image
FROM properties p
WHERE p.owner_id = auth.uid();

-- ===== FUNCIÓN PARA BÚSQUEDA CON FILTROS =====

CREATE OR REPLACE FUNCTION search_properties(
  p_listing_type listing_type_enum DEFAULT NULL,
  p_property_type property_type_enum DEFAULT NULL,
  p_min_price bigint DEFAULT NULL,
  p_max_price bigint DEFAULT NULL,
  p_min_bedrooms integer DEFAULT NULL,
  p_commune text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_search_text text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  listing_type listing_type_enum,
  property_type property_type_enum,
  full_address text,
  address_commune text,
  address_region text,
  price_clp bigint,
  common_expenses_clp bigint,
  surface_m2 integer,
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  created_at timestamp with time zone,
  main_image text,
  total_images bigint,
  is_favorite boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id,
    mp.title,
    mp.description,
    mp.listing_type,
    mp.property_type,
    mp.full_address,
    mp.address_commune,
    mp.address_region,
    mp.price_clp,
    mp.common_expenses_clp,
    mp.surface_m2,
    mp.bedrooms,
    mp.bathrooms,
    mp.parking_spaces,
    mp.created_at,
    mp.main_image,
    mp.total_images,
    mp.is_favorite
  FROM marketplace_properties mp
  WHERE 
    (p_listing_type IS NULL OR mp.listing_type = p_listing_type)
    AND (p_property_type IS NULL OR mp.property_type = p_property_type)
    AND (p_min_price IS NULL OR mp.price_clp >= p_min_price)
    AND (p_max_price IS NULL OR mp.price_clp <= p_max_price)
    AND (p_min_bedrooms IS NULL OR mp.bedrooms >= p_min_bedrooms)
    AND (p_commune IS NULL OR mp.address_commune ILIKE '%' || p_commune || '%')
    AND (p_region IS NULL OR mp.address_region ILIKE '%' || p_region || '%')
    AND (
      p_search_text IS NULL OR 
      mp.title ILIKE '%' || p_search_text || '%' OR
      mp.description ILIKE '%' || p_search_text || '%' OR
      mp.full_address ILIKE '%' || p_search_text || '%'
    )
  ORDER BY mp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejemplo de uso:
-- SELECT * FROM search_properties(
--   p_listing_type => 'venta',
--   p_min_price => 50000000,
--   p_max_price => 150000000,
--   p_min_bedrooms => 2,
--   p_commune => 'Las Condes'
-- );
```

---

## 📊 **Mantenimiento Rutinario**

### **Script de Mantenimiento Semanal**

#### **weekly_maintenance.sql**
```sql
-- Script de mantenimiento semanal automatizado
-- Programar para ejecutarse todos los domingos a las 2:00 AM

\echo '🔧 INICIO MANTENIMIENTO SEMANAL - ' || now()

-- ===== LIMPIEZA DE DATOS ANTIGUOS =====

-- 1. Limpiar logs de auditoría (más de 90 días)
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- 2. Limpiar eventos de seguridad (más de 30 días)
DELETE FROM security_events 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- 3. Limpiar errores del trigger (más de 7 días)
DELETE FROM trigger_errors 
WHERE created_at < NOW() - INTERVAL '7 days';

-- 4. Limpiar rate limits expirados
DELETE FROM rate_limits 
WHERE window_start < NOW() - INTERVAL '24 hours';

\echo '✅ Limpieza de datos antiguos completada'

-- ===== OPTIMIZACIÓN DE TABLAS =====

-- 5. VACUUM y ANALYZE en tablas principales
VACUUM ANALYZE profiles;
VACUUM ANALYZE properties;
VACUUM ANALYZE applications;
VACUUM ANALYZE offers;
VACUUM ANALYZE documents;
VACUUM ANALYZE property_images;
VACUUM ANALYZE user_favorites;

\echo '✅ VACUUM ANALYZE completado'

-- ===== REINDEXACIÓN =====

-- 6. Reindexar índices más utilizados (solo si es necesario)
REINDEX INDEX CONCURRENTLY idx_properties_status_location;
REINDEX INDEX CONCURRENTLY idx_applications_status_created;
REINDEX INDEX CONCURRENTLY idx_offers_status_created;

\echo '✅ Reindexación completada'

-- ===== ACTUALIZACIÓN DE ESTADÍSTICAS =====

-- 7. Actualizar estadísticas de PostgreSQL
ANALYZE profiles;
ANALYZE properties;
ANALYZE applications;
ANALYZE offers;

\echo '✅ Estadísticas actualizadas'

-- ===== VERIFICACIONES DE INTEGRIDAD =====

-- 8. Verificar integridad referencial
DO $$
DECLARE
  orphaned_count integer;
BEGIN
  -- Verificar aplicaciones huérfanas
  SELECT COUNT(*) INTO orphaned_count
  FROM applications a
  LEFT JOIN properties p ON a.property_id = p.id
  WHERE p.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Encontradas % aplicaciones huérfanas', orphaned_count;
  END IF;
  
  -- Verificar ofertas huérfanas
  SELECT COUNT(*) INTO orphaned_count
  FROM offers o
  LEFT JOIN properties p ON o.property_id = p.id
  WHERE p.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Encontradas % ofertas huérfanas', orphaned_count;
  END IF;
END $$;

\echo '✅ Verificaciones de integridad completadas'

-- ===== ESTADÍSTICAS DEL SISTEMA =====

-- 9. Generar reporte de estadísticas
WITH stats AS (
  SELECT 
    'usuarios_activos_7d' as metric,
    COUNT(DISTINCT u.id) as value
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE u.last_sign_in_at > NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  SELECT 
    'propiedades_nuevas_7d',
    COUNT(*)
  FROM properties
  WHERE created_at > NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  SELECT 
    'aplicaciones_nuevas_7d',
    COUNT(*)
  FROM applications
  WHERE created_at > NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  SELECT 
    'ofertas_nuevas_7d',
    COUNT(*)
  FROM offers
  WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT 
  '📊 ESTADÍSTICAS SEMANALES:' as report_section,
  '' as metric,
  '' as value
UNION ALL
SELECT 
  '',
  metric,
  value::text
FROM stats;

-- ===== ALERTAS AUTOMÁTICAS =====

-- 10. Generar alertas si hay problemas
DO $$
DECLARE
  error_count integer;
  duplicate_count integer;
BEGIN
  -- Verificar errores recientes del trigger
  SELECT COUNT(*) INTO error_count
  FROM trigger_errors
  WHERE created_at > NOW() - INTERVAL '7 days';
  
  IF error_count > 10 THEN
    RAISE WARNING '🚨 ALERTA: % errores del trigger en la última semana', error_count;
  END IF;
  
  -- Verificar duplicados de propiedades
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT normalized_address, owner_id
    FROM properties
    WHERE status IN ('disponible', 'reservada')
    GROUP BY normalized_address, owner_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING '🚨 ALERTA: % direcciones de propiedades duplicadas', duplicate_count;
  END IF;
END $$;

\echo '✅ Verificación de alertas completada'

-- ===== BACKUP DE CONFIGURACIÓN =====

-- 11. Backup de configuraciones críticas
CREATE TABLE IF NOT EXISTS maintenance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_type text NOT NULL,
  executed_at timestamp with time zone DEFAULT now(),
  details jsonb
);

INSERT INTO maintenance_log (maintenance_type, details)
VALUES (
  'weekly_maintenance',
  jsonb_build_object(
    'tables_vacuumed', ARRAY['profiles', 'properties', 'applications', 'offers', 'documents', 'property_images', 'user_favorites'],
    'indexes_reindexed', ARRAY['idx_properties_status_location', 'idx_applications_status_created', 'idx_offers_status_created'],
    'old_data_cleaned', true,
    'integrity_checked', true
  )
);

\echo '✅ Log de mantenimiento guardado'

\echo '🎉 MANTENIMIENTO SEMANAL COMPLETADO - ' || now()

-- ===== RESUMEN FINAL =====
SELECT 
  'Total usuarios' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Propiedades disponibles',
  COUNT(*)::text
FROM properties
WHERE status = 'disponible' AND is_visible = true
UNION ALL
SELECT 
  'Aplicaciones activas',
  COUNT(*)::text
FROM applications
WHERE status IN ('pendiente', 'info_solicitada')
UNION ALL
SELECT 
  'Ofertas pendientes',
  COUNT(*)::text
FROM offers
WHERE status = 'pendiente';
```

---

## 🧪 **Testing de Migraciones**

### **Test Suite para Migraciones**

#### **test_migrations.sql**
```sql
-- Suite de tests para verificar que las migraciones funcionan correctamente

-- ===== SETUP DE TESTING =====

-- Crear schema de testing
CREATE SCHEMA IF NOT EXISTS testing;

-- Función helper para tests
CREATE OR REPLACE FUNCTION testing.assert_equals(actual anyelement, expected anyelement, test_name text)
RETURNS void AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'TEST FAILED: % - Expected: %, Got: %', test_name, expected, actual;
  ELSE
    RAISE NOTICE '✅ PASSED: %', test_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION testing.assert_not_null(actual anyelement, test_name text)
RETURNS void AS $$
BEGIN
  IF actual IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: % - Expected non-null value', test_name;
  ELSE
    RAISE NOTICE '✅ PASSED: %', test_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===== TESTS DE ESTRUCTURA =====

DO $$
BEGIN
  RAISE NOTICE '🧪 INICIANDO TESTS DE MIGRACIONES';
  
  -- Test 1: Verificar que todas las tablas existen
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('profiles', 'properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites'))::integer,
    8,
    'Todas las tablas principales existen'
  );
  
  -- Test 2: Verificar que los enums existen
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM pg_type 
     WHERE typname IN ('listing_type_enum', 'property_type_enum', 'property_status_enum', 'application_status_enum', 'offer_status_enum', 'marital_status_enum'))::integer,
    6,
    'Todos los enums están creados'
  );
  
  -- Test 3: Verificar que RLS está habilitado
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' 
     AND tablename IN ('profiles', 'properties', 'applications', 'offers') 
     AND rowsecurity = true)::integer,
    4,
    'RLS habilitado en tablas principales'
  );
  
  -- Test 4: Verificar políticas RLS
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' 
     AND tablename = 'properties')::integer >= 4,
    true,
    'Properties tiene al menos 4 políticas RLS'
  );
  
  -- Test 5: Verificar triggers importantes
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM information_schema.triggers 
     WHERE trigger_name = 'on_auth_user_created')::integer,
    1,
    'Trigger de creación de perfiles existe'
  );
  
  -- Test 6: Verificar índices importantes
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public' 
     AND indexname IN ('idx_properties_status_location', 'idx_applications_status_created', 'idx_offers_status_created'))::integer,
    3,
    'Índices importantes existen'
  );
  
END $$;

-- ===== TESTS FUNCIONALES =====

DO $$
DECLARE
  test_user_id uuid;
  test_property_id uuid;
  test_application_id uuid;
BEGIN
  RAISE NOTICE '🧪 INICIANDO TESTS FUNCIONALES';
  
  -- Crear usuario de prueba
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (gen_random_uuid(), 'test@example.com', crypt('password', gen_salt('bf')), now(), now(), now())
  RETURNING id INTO test_user_id;
  
  -- Test 7: Verificar creación automática de perfil
  PERFORM testing.assert_equals(
    (SELECT COUNT(*) FROM profiles WHERE id = test_user_id)::integer,
    1,
    'Perfil creado automáticamente para nuevo usuario'
  );
  
  -- Test 8: Verificar que se puede crear propiedad
  INSERT INTO properties (owner_id, listing_type, property_type, address_street, address_number, address_commune, address_region, price_clp, surface_m2)
  VALUES (test_user_id, 'venta', 'casa', 'Test Street', '123', 'Test Commune', 'Test Region', 100000000, 100)
  RETURNING id INTO test_property_id;
  
  PERFORM testing.assert_not_null(test_property_id, 'Propiedad creada exitosamente');
  
  -- Test 9: Verificar status por defecto
  PERFORM testing.assert_equals(
    (SELECT status FROM properties WHERE id = test_property_id)::text,
    'disponible',
    'Status por defecto es "disponible"'
  );
  
  -- Test 10: Verificar que se puede crear aplicación
  INSERT INTO applications (
    property_id, applicant_id, message,
    snapshot_applicant_profession, snapshot_applicant_monthly_income_clp,
    snapshot_applicant_age, snapshot_applicant_nationality,
    snapshot_applicant_marital_status, snapshot_applicant_address_street,
    snapshot_applicant_address_number, snapshot_applicant_address_commune,
    snapshot_applicant_address_region
  ) VALUES (
    test_property_id, test_user_id, 'Test application',
    'Engineer', 1500000, 30, 'Chilean', 'soltero',
    'Test Address', '456', 'Test Commune', 'Test Region'
  ) RETURNING id INTO test_application_id;
  
  PERFORM testing.assert_not_null(test_application_id, 'Aplicación creada exitosamente');
  
  -- Limpiar datos de prueba
  DELETE FROM applications WHERE id = test_application_id;
  DELETE FROM properties WHERE id = test_property_id;
  DELETE FROM profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE '✅ TODOS LOS TESTS PASARON EXITOSAMENTE';
  
EXCEPTION WHEN OTHERS THEN
  -- Limpiar en caso de error
  DELETE FROM applications WHERE applicant_id = test_user_id;
  DELETE FROM properties WHERE owner_id = test_user_id;
  DELETE FROM profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE EXCEPTION 'TEST FAILED: %', SQLERRM;
END $$;

-- Limpiar schema de testing
DROP SCHEMA IF EXISTS testing CASCADE;

\echo '🎉 SUITE DE TESTS COMPLETADO'
```

---

## 📝 **Historial de Cambios**

### **Changelog de Migraciones**

| Fecha | Versión | Descripción | Archivos |
|-------|---------|-------------|----------|
| **2025-09-01** | `v1.0.0` | Schema inicial completo | `20250901000000_initial_schema.sql` |
| **2025-09-01** | `v1.1.0` | Habilitación de RLS | `20250901120000_enable_rls.sql` |
| **2025-09-02** | `v1.2.0` | Fix trigger auth | `20250902180000_fix_auth_trigger.sql` |
| **2025-09-02** | `v1.2.1` | Fix Primary Key profiles | `20250902190000_fix_profiles_primary_key.sql` |
| **2025-09-02** | `v1.2.2` | Fix RLS policies | `20250902210000_fix_properties_rls_policies.sql` |
| **2025-09-02** | `v1.3.0` | Prevención duplicados | `20250902220000_fix_duplicate_properties.sql` |

### **Estados Conocidos de la Base de Datos**

#### **Estado Actual (Post-Migraciones)**
```sql
-- Query para verificar estado actual del sistema
SELECT 
  'Sistema' as component,
  'Estado' as status,
  'Detalles' as details
UNION ALL
SELECT 
  'Base de Datos',
  CASE WHEN COUNT(*) = 8 THEN '✅ Completa' ELSE '❌ Incompleta' END,
  'Tablas: ' || COUNT(*)::text
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'properties', 'applications', 'offers', 'guarantors', 'documents', 'property_images', 'user_favorites')
UNION ALL
SELECT 
  'RLS',
  CASE WHEN COUNT(*) >= 4 THEN '✅ Activo' ELSE '❌ Incompleto' END,
  'Tablas protegidas: ' || COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
UNION ALL
SELECT 
  'Triggers',
  CASE WHEN COUNT(*) >= 1 THEN '✅ Activos' ELSE '❌ Faltantes' END,
  'Triggers: ' || COUNT(*)::text
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'update_properties_updated_at')
UNION ALL
SELECT 
  'Índices',
  CASE WHEN COUNT(*) >= 3 THEN '✅ Optimizados' ELSE '❌ Faltantes' END,
  'Índices críticos: ' || COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_properties_status_location', 'idx_applications_status_created', 'idx_offers_status_created');
```

---

**⚡ Para continuar con el desarrollo, consulta [README-CONTRIBUCION.md](README-CONTRIBUCION.md)**

**🔙 Para configuración inicial, revisa [README-INSTALACION.md](README-INSTALACION.md)**
