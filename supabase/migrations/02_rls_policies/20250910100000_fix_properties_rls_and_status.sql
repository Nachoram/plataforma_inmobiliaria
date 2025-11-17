-- 1. Añadir el nuevo valor 'disponible' al enum de estados de propiedad si no existe.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'disponible' AND enumtypid = 'property_status_enum'::regtype) THEN
        ALTER TYPE property_status_enum ADD VALUE 'disponible';
    END IF;
END
$$;

-- 2. Cambiar el valor por defecto de la columna 'status' a 'disponible'.
ALTER TABLE public.properties ALTER COLUMN status SET DEFAULT 'disponible';

-- 3. Actualizar todas las propiedades existentes con estado 'activa' a 'disponible'.
UPDATE public.properties SET status = 'disponible' WHERE status = 'activa';

-- 4. Eliminar TODAS las políticas RLS existentes en la tabla 'properties' para evitar conflictos.
-- Esto incluye cualquier política que pueda existir con nombres diferentes
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "properties_select_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_update_policy" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_policy" ON public.properties;

-- También eliminar cualquier política que pueda tener nombres con prefijos diferentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname FROM pg_policies WHERE tablename = 'properties'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.properties';
        RAISE NOTICE 'Dropped existing policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 5. Crear las políticas RLS correctas y seguras.
-- SELECT: Cualquiera puede ver propiedades disponibles. Los usuarios autenticados pueden ver las suyas sin importar el estado.
CREATE POLICY "properties_select_policy" ON public.properties
FOR SELECT USING (
    (status = 'disponible') OR (auth.uid() = owner_id)
);

-- INSERT: Solo usuarios autenticados pueden crear propiedades para sí mismos.
CREATE POLICY "properties_insert_policy" ON public.properties
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- UPDATE: Solo los propietarios pueden actualizar sus propias propiedades.
CREATE POLICY "properties_update_policy" ON public.properties
FOR UPDATE USING (
    auth.role() = 'authenticated' AND auth.uid() = owner_id
);

-- DELETE: Solo los propietarios pueden eliminar sus propias propiedades.
CREATE POLICY "properties_delete_policy" ON public.properties
FOR DELETE USING (
    auth.role() = 'authenticated' AND auth.uid() = owner_id
);
