-- ========================================================================
-- Migración: Crear tabla property_type_characteristics y agregar FK a properties
-- Fecha: 2025-10-28
-- Descripción: Crear tabla para características de tipos de propiedad y agregar relación con properties
-- ========================================================================

-- Crear tabla property_type_characteristics
CREATE TABLE IF NOT EXISTS public.property_type_characteristics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_type_characteristics_name
ON public.property_type_characteristics(name);

-- Otorgar permisos para PostgREST/Supabase
GRANT ALL ON public.property_type_characteristics TO authenticated;
GRANT ALL ON public.property_type_characteristics TO service_role;

-- Agregar comentarios
COMMENT ON TABLE public.property_type_characteristics IS 'Características de tipos de propiedad para contratos';
COMMENT ON COLUMN public.property_type_characteristics.name IS 'Nombre del tipo de propiedad';
COMMENT ON COLUMN public.property_type_characteristics.description IS 'Descripción del tipo de propiedad';

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_property_type_characteristics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS property_type_characteristics_updated_at ON public.property_type_characteristics;
CREATE TRIGGER property_type_characteristics_updated_at
    BEFORE UPDATE ON public.property_type_characteristics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_property_type_characteristics_updated_at();

-- ========================================================================
-- POBLAR TABLA CON DATOS BÁSICOS
-- ========================================================================

-- Insertar tipos de propiedad básicos
INSERT INTO public.property_type_characteristics (name, description) VALUES
    ('Casa', 'Vivienda unifamiliar independiente'),
    ('Departamento', 'Unidad habitacional dentro de un edificio'),
    ('Oficina', 'Espacio destinado a actividades administrativas o comerciales'),
    ('Local Comercial', 'Espacio destinado a actividades comerciales'),
    ('Bodega', 'Espacio destinado al almacenamiento'),
    ('Estacionamiento', 'Espacio destinado al estacionamiento de vehículos')
ON CONFLICT (name) DO NOTHING;

-- ========================================================================
-- VERIFICACIÓN
-- ========================================================================

-- Verificar que la tabla se creó correctamente
DO $$
DECLARE
    v_count integer;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.property_type_characteristics;
    RAISE NOTICE '✅ Tabla property_type_characteristics creada con % registros', v_count;

    -- Mostrar algunos registros de ejemplo
    RAISE NOTICE 'Registros creados:';
    FOR r IN SELECT name, description FROM public.property_type_characteristics ORDER BY name LIMIT 5 LOOP
        RAISE NOTICE '  - %: %', r.name, COALESCE(r.description, 'Sin descripción');
    END LOOP;
END $$;

-- ========================================================================
-- AGREGAR RELACIÓN CON PROPERTIES
-- ========================================================================

-- Agregar columna property_type_characteristics_id a la tabla properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_type_characteristics_id UUID REFERENCES public.property_type_characteristics(id);

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_properties_property_type_characteristics_id
ON public.properties(property_type_characteristics_id);

-- Agregar comentario
COMMENT ON COLUMN public.properties.property_type_characteristics_id IS 'Referencia al UUID de property_type_characteristics para el tipo de propiedad';

-- Función para mapear tipo_propiedad al UUID correspondiente de property_type_characteristics
CREATE OR REPLACE FUNCTION public.get_property_type_characteristics_id(property_type_text TEXT)
RETURNS UUID AS $$
DECLARE
    characteristics_id UUID;
BEGIN
    SELECT id INTO characteristics_id
    FROM public.property_type_characteristics
    WHERE name = property_type_text
    LIMIT 1;

    RETURN characteristics_id;
END;
$$ LANGUAGE plpgsql;

-- Actualizar registros existentes en properties para mapear tipo_propiedad a property_type_characteristics_id
DO $$
DECLARE
    property_record RECORD;
    characteristics_id UUID;
BEGIN
    RAISE NOTICE '🔄 Actualizando property_type_characteristics_id en tabla properties...';

    FOR property_record IN
        SELECT id, tipo_propiedad
        FROM public.properties
        WHERE property_type_characteristics_id IS NULL
        AND tipo_propiedad IS NOT NULL
    LOOP
        -- Obtener el UUID correspondiente del tipo de propiedad
        SELECT id INTO characteristics_id
        FROM public.property_type_characteristics
        WHERE name = property_record.tipo_propiedad::text
        LIMIT 1;

        IF characteristics_id IS NOT NULL THEN
            UPDATE public.properties
            SET property_type_characteristics_id = characteristics_id
            WHERE id = property_record.id;

            RAISE NOTICE '  ✅ Actualizado propiedad %: % -> %', property_record.id, property_record.tipo_propiedad, characteristics_id;
        ELSE
            RAISE NOTICE '  ⚠️ No se encontró UUID para tipo_propiedad: % en propiedad %', property_record.tipo_propiedad, property_record.id;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Actualización completada';
END $$;

-- Verificar la actualización
DO $$
DECLARE
    v_total_properties integer;
    v_updated_properties integer;
    v_missing_mappings integer;
BEGIN
    SELECT COUNT(*) INTO v_total_properties FROM public.properties;
    SELECT COUNT(*) INTO v_updated_properties FROM public.properties WHERE property_type_characteristics_id IS NOT NULL;
    SELECT COUNT(*) INTO v_missing_mappings FROM public.properties WHERE property_type_characteristics_id IS NULL;

    RAISE NOTICE '📊 Estadísticas de mapeo:';
    RAISE NOTICE '  - Total de propiedades: %', v_total_properties;
    RAISE NOTICE '  - Propiedades con mapeo actualizado: %', v_updated_properties;
    RAISE NOTICE '  - Propiedades sin mapeo: %', v_missing_mappings;
END $$;
