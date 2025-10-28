-- ========================================================================
-- Migración: Crear tabla property_type_characteristics
-- Fecha: 2025-10-28
-- Descripción: Crear tabla para características de tipos de propiedad
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
