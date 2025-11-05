-- PASO 1: Crear enums necesarios
-- Fecha: 4 de noviembre de 2025
-- Descripción: Crear los tipos enum antes de cualquier tabla que los use

-- Crear enum para tipo de entidad si no existe
DO $$ BEGIN
    CREATE TYPE entity_type_enum AS ENUM ('natural', 'juridica');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear enum para estado civil si no existe
DO $$ BEGIN
    CREATE TYPE marital_status_enum AS ENUM ('soltero', 'casado', 'divorciado', 'viudo', 'union_civil');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear enum para tipo de constitución si no existe
DO $$ BEGIN
    CREATE TYPE constitution_type_enum AS ENUM ('empresa_un_dia', 'tradicional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verificar que se crearon
DO $$
BEGIN
    RAISE NOTICE 'Enums creados exitosamente: entity_type_enum, marital_status_enum, constitution_type_enum';
END $$;
