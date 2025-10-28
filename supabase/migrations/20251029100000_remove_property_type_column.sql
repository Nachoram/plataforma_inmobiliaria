-- Migración: Eliminar columna property_type de la tabla properties
-- Esta columna ya no se usa ya que se reemplazó por property_type_characteristics_id

DO $$ BEGIN
    RAISE NOTICE '🗑️  ELIMINANDO COLUMNA property_type DE LA TABLA properties...';
END $$;

-- Paso 1: Eliminar el trigger que sincroniza property_type con tipo_propiedad
DROP TRIGGER IF EXISTS sync_property_type_trigger ON public.properties;

-- Paso 2: Eliminar la función que sincroniza los campos
DROP FUNCTION IF EXISTS public.sync_property_type_fields();

-- Paso 3: Eliminar la columna property_type
ALTER TABLE public.properties DROP COLUMN IF EXISTS property_type;

DO $$ BEGIN
    RAISE NOTICE '✅ COLUMNA property_type ELIMINADA EXITOSAMENTE';
    RAISE NOTICE '✅ TRIGGER sync_property_type_trigger ELIMINADO';
    RAISE NOTICE '✅ FUNCIÓN sync_property_type_fields() ELIMINADA';
END $$;
