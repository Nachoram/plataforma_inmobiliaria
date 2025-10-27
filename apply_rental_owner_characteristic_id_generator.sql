-- ============================================================================
-- SCRIPT PARA APLICAR: Generar rental_owner_characteristic_id automáticamente
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/[tu-project-id]/sql
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🚀 Iniciando aplicación del generador automático de rental_owner_characteristic_id';
END $$;

-- ============================================================================
-- PASO 1: CAMBIAR TIPO DE COLUMNA rental_owner_characteristic_id
-- ============================================================================

DO $$
BEGIN
  -- Verificar si la columna existe y es del tipo uuid
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_owners'
    AND column_name = 'rental_owner_characteristic_id'
    AND data_type = 'uuid'
  ) THEN
    -- Cambiar de uuid a text
    ALTER TABLE rental_owners
    ALTER COLUMN rental_owner_characteristic_id TYPE text;

    RAISE NOTICE '✅ Columna rental_owner_characteristic_id cambiada de uuid a text';
  ELSE
    RAISE NOTICE 'ℹ️  Columna rental_owner_characteristic_id ya es de tipo text o no existe';
  END IF;
END $$;

-- ============================================================================
-- PASO 2: CREAR SECUENCIA PARA LOS IDs DE rental_owners
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS rental_owner_characteristic_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE rental_owner_characteristic_id_seq IS
  'Secuencia para generar IDs únicos de rental_owner_characteristic_id';

DO $$
BEGIN
  RAISE NOTICE '✅ Secuencia rental_owner_characteristic_id_seq creada';
END $$;

-- ============================================================================
-- PASO 3: CREAR FUNCIÓN QUE GENERA EL rental_owner_characteristic_id
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_rental_owner_characteristic_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  new_characteristic_id TEXT;
BEGIN
  -- Solo generar si el campo está vacío o es null
  IF NEW.rental_owner_characteristic_id IS NULL OR NEW.rental_owner_characteristic_id = '' THEN

    -- Obtener el siguiente número de la secuencia
    next_id := nextval('rental_owner_characteristic_id_seq');

    -- Generar el ID con formato RENTAL_OWNER_XXXXXXX (7 dígitos con padding de ceros)
    new_characteristic_id := 'RENTAL_OWNER_' || LPAD(next_id::TEXT, 7, '0');

    -- Asignar el nuevo ID al registro
    NEW.rental_owner_characteristic_id := new_characteristic_id;

    -- Log para debugging (visible en logs de Supabase)
    RAISE NOTICE 'Generated rental_owner_characteristic_id: %', new_characteristic_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_rental_owner_characteristic_id() IS
  'Genera automáticamente un rental_owner_characteristic_id único con formato RENTAL_OWNER_XXXXXXX';

DO $$
BEGIN
  RAISE NOTICE '✅ Función generate_rental_owner_characteristic_id() creada';
END $$;

-- ============================================================================
-- PASO 4: CREAR TRIGGER QUE EJECUTA LA FUNCIÓN ANTES DE CADA INSERT
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_generate_rental_owner_characteristic_id ON rental_owners;

CREATE TRIGGER trigger_generate_rental_owner_characteristic_id
  BEFORE INSERT ON rental_owners
  FOR EACH ROW
  EXECUTE FUNCTION generate_rental_owner_characteristic_id();

COMMENT ON TRIGGER trigger_generate_rental_owner_characteristic_id ON rental_owners IS
  'Trigger que genera automáticamente el rental_owner_characteristic_id antes de insertar un nuevo propietario';

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger trigger_generate_rental_owner_characteristic_id creado';
END $$;

-- ============================================================================
-- PASO 5: ACTUALIZAR REGISTROS EXISTENTES
-- ============================================================================

DO $$
DECLARE
  owner_record RECORD;
  next_id INTEGER;
  new_id TEXT;
  updated_count INTEGER := 0;
BEGIN
  -- Iterar sobre propietarios sin characteristic_id
  FOR owner_record IN
    SELECT id
    FROM rental_owners
    WHERE rental_owner_characteristic_id IS NULL
       OR rental_owner_characteristic_id = ''
    ORDER BY created_at ASC
  LOOP
    -- Obtener siguiente ID de la secuencia
    next_id := nextval('rental_owner_characteristic_id_seq');
    new_id := 'RENTAL_OWNER_' || LPAD(next_id::TEXT, 7, '0');

    -- Actualizar el registro
    UPDATE rental_owners
    SET rental_owner_characteristic_id = new_id
    WHERE id = owner_record.id;

    updated_count := updated_count + 1;
  END LOOP;

  -- Mostrar resultado
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Actualizados % propietarios existentes con nuevos characteristic_ids', updated_count;
  ELSE
    RAISE NOTICE 'ℹ️  No hay propietarios sin characteristic_id - no se requirieron actualizaciones';
  END IF;
END $$;

-- ============================================================================
-- PASO 6: VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
  total_owners INTEGER;
  owners_with_id INTEGER;
  owners_without_id INTEGER;
  max_sequence_value INTEGER;
BEGIN
  -- Contar propietarios totales
  SELECT COUNT(*) INTO total_owners FROM rental_owners;

  -- Contar propietarios con ID
  SELECT COUNT(*) INTO owners_with_id
  FROM rental_owners
  WHERE rental_owner_characteristic_id IS NOT NULL
    AND rental_owner_characteristic_id != '';

  -- Contar propietarios sin ID
  SELECT COUNT(*) INTO owners_without_id
  FROM rental_owners
  WHERE rental_owner_characteristic_id IS NULL
     OR rental_owner_characteristic_id = '';

  -- Obtener el último valor de la secuencia
  SELECT COALESCE(last_value, 0) INTO max_sequence_value
  FROM rental_owner_characteristic_id_seq;

  -- Mostrar resultados
  RAISE NOTICE '📊 VERIFICACIÓN FINAL:';
  RAISE NOTICE '   Total de propietarios: %', total_owners;
  RAISE NOTICE '   Propietarios con ID legible: %', owners_with_id;
  RAISE NOTICE '   Propietarios sin ID: %', owners_without_id;
  RAISE NOTICE '   Último valor de secuencia: %', max_sequence_value;

  -- Verificar integridad
  IF owners_without_id = 0 THEN
    RAISE NOTICE '✅ ÉXITO: Todos los propietarios tienen ID legible';
  ELSE
    RAISE NOTICE '⚠️  ADVERTENCIA: Aún hay % propietarios sin ID', owners_without_id;
  END IF;

  -- Mostrar ejemplos de IDs generados
  IF owners_with_id > 0 THEN
    RAISE NOTICE '📋 Ejemplos de IDs generados:';
    FOR i IN 1..LEAST(5, owners_with_id) LOOP
      RAISE NOTICE '   %', (SELECT rental_owner_characteristic_id FROM rental_owners WHERE rental_owner_characteristic_id IS NOT NULL ORDER BY created_at DESC LIMIT 1 OFFSET (i-1));
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- LOG DE ÉXITO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Script aplicado exitosamente!';
  RAISE NOTICE '📋 Formato de ID: RENTAL_OWNER_XXXXXXX (7 dígitos)';
  RAISE NOTICE '🔢 Secuencia iniciada en: 1';
  RAISE NOTICE '🔄 Trigger activo: Se ejecuta automáticamente en cada INSERT';
  RAISE NOTICE '✅ Próximos pasos:';
  RAISE NOTICE '   1. Probar insertando un propietario manualmente';
  RAISE NOTICE '   2. Verificar en Supabase Dashboard que el ID se genera automáticamente';
  RAISE NOTICE '   3. Probar desde el formulario de publicación de propiedades';
END $$;
