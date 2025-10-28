-- Script SQL para eliminar manualmente la columna property_type
-- Ejecutar este script en el SQL Editor de Supabase Dashboard

-- 1. Eliminar el trigger que sincroniza property_type con tipo_propiedad
DROP TRIGGER IF EXISTS sync_property_type_trigger ON public.properties;

-- 2. Eliminar la función que sincroniza los campos
DROP FUNCTION IF EXISTS public.sync_property_type_fields();

-- 3. Eliminar la columna property_type
ALTER TABLE public.properties DROP COLUMN IF EXISTS property_type;

-- Verificación
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
AND table_schema = 'public'
ORDER BY ordinal_position;
