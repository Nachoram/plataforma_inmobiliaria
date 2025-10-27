-- ============================================================================
-- SCRIPT DE PRUEBA: Verificar funcionamiento del generador automático
-- ============================================================================
-- Ejecutar este script en Supabase SQL Editor para probar el funcionamiento
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🧪 Iniciando pruebas del generador automático de rental_owner_characteristic_id';
END $$;

-- ============================================================================
-- PRUEBA 1: VERIFICAR QUE LA SECUENCIA EXISTE
-- ============================================================================

DO $$
DECLARE
  sequence_exists BOOLEAN := FALSE;
  current_value INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_sequences
    WHERE schemaname = 'public'
    AND sequencename = 'rental_owner_characteristic_id_seq'
  ) INTO sequence_exists;

  IF sequence_exists THEN
    SELECT last_value INTO current_value
    FROM rental_owner_characteristic_id_seq;

    RAISE NOTICE '✅ PRUEBA 1 PASADA: Secuencia existe - Valor actual: %', current_value;
  ELSE
    RAISE EXCEPTION '❌ PRUEBA 1 FALLIDA: Secuencia rental_owner_characteristic_id_seq no existe';
  END IF;
END $$;

-- ============================================================================
-- PRUEBA 2: VERIFICAR QUE LA FUNCIÓN EXISTE
-- ============================================================================

DO $$
DECLARE
  function_exists BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'generate_rental_owner_characteristic_id'
  ) INTO function_exists;

  IF function_exists THEN
    RAISE NOTICE '✅ PRUEBA 2 PASADA: Función generate_rental_owner_characteristic_id() existe';
  ELSE
    RAISE EXCEPTION '❌ PRUEBA 2 FALLIDA: Función generate_rental_owner_characteristic_id() no existe';
  END IF;
END $$;

-- ============================================================================
-- PRUEBA 3: VERIFICAR QUE EL TRIGGER EXISTE Y ESTÁ ACTIVO
-- ============================================================================

DO $$
DECLARE
  trigger_exists BOOLEAN := FALSE;
  trigger_enabled BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_generate_rental_owner_characteristic_id'
    AND tgrelid = 'rental_owners'::regclass
  ) INTO trigger_exists;

  IF trigger_exists THEN
    SELECT tgenabled = 'O' INTO trigger_enabled
    FROM pg_trigger
    WHERE tgname = 'trigger_generate_rental_owner_characteristic_id'
    AND tgrelid = 'rental_owners'::regclass;

    IF trigger_enabled THEN
      RAISE NOTICE '✅ PRUEBA 3 PASADA: Trigger existe y está habilitado';
    ELSE
      RAISE NOTICE '⚠️  PRUEBA 3 ADVERTENCIA: Trigger existe pero no está habilitado';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ PRUEBA 3 FALLIDA: Trigger trigger_generate_rental_owner_characteristic_id no existe';
  END IF;
END $$;

-- ============================================================================
-- PRUEBA 4: INSERTAR UN PROPIETARIO DE PRUEBA Y VERIFICAR ID GENERADO
-- ============================================================================

DO $$
DECLARE
  test_property_id UUID;
  inserted_owner_id UUID;
  generated_characteristic_id TEXT;
  original_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Obtener un property_id válido para la prueba (el primero que encontremos)
  SELECT id INTO test_property_id
  FROM properties
  WHERE listing_type = 'arriendo'
  LIMIT 1;

  IF test_property_id IS NULL THEN
    RAISE NOTICE '⚠️  PRUEBA 4 OMITIDA: No hay propiedades de alquiler para usar como referencia';
    RETURN;
  END IF;

  -- Contar propietarios antes del insert
  SELECT COUNT(*) INTO original_count FROM rental_owners;

  -- Insertar propietario de prueba SIN especificar rental_owner_characteristic_id
  INSERT INTO rental_owners (
    property_id,
    first_name,
    paternal_last_name,
    maternal_last_name,
    rut,
    address_street,
    address_number,
    address_commune,
    address_region,
    marital_status,
    email
  ) VALUES (
    test_property_id,
    'TEST_PRUEBA',
    'AUTO_GENERADO',
    'ID',
    '99999999-9',
    'Av. Prueba',
    '123',
    'Santiago',
    'region-metropolitana',
    'soltero',
    'prueba@test.com'
  )
  RETURNING id, rental_owner_characteristic_id INTO inserted_owner_id, generated_characteristic_id;

  -- Contar propietarios después del insert
  SELECT COUNT(*) INTO new_count FROM rental_owners;

  -- Verificar que se insertó correctamente
  IF new_count = original_count + 1 THEN
    -- Verificar formato del ID generado
    IF generated_characteristic_id LIKE 'RENTAL_OWNER_%' THEN
      -- Verificar que tiene exactamente 7 dígitos después del prefijo
      IF LENGTH(generated_characteristic_id) = 20 THEN -- 'RENTAL_OWNER_' (13) + '0000001' (7) = 20
        RAISE NOTICE '✅ PRUEBA 4 PASADA: Propietario insertado con ID generado: %', generated_characteristic_id;
      ELSE
        RAISE NOTICE '⚠️  PRUEBA 4 PARCIAL: ID generado tiene formato correcto pero longitud inesperada: % (longitud: %)', generated_characteristic_id, LENGTH(generated_characteristic_id);
      END IF;
    ELSE
      RAISE EXCEPTION '❌ PRUEBA 4 FALLIDA: ID generado no tiene el formato esperado: %', generated_characteristic_id;
    END IF;
  ELSE
    RAISE EXCEPTION '❌ PRUEBA 4 FALLIDA: No se insertó el propietario de prueba correctamente';
  END IF;

  -- Limpiar: eliminar el registro de prueba
  DELETE FROM rental_owners WHERE id = inserted_owner_id;
  RAISE NOTICE '🧹 Registro de prueba eliminado: %', inserted_owner_id;
END $$;

-- ============================================================================
-- PRUEBA 5: VERIFICAR INTEGRIDAD DE DATOS EXISTENTES
-- ============================================================================

DO $$
DECLARE
  total_owners INTEGER;
  owners_with_valid_id INTEGER;
  owners_with_invalid_id INTEGER;
  owners_without_id INTEGER;
BEGIN
  -- Contar propietarios totales
  SELECT COUNT(*) INTO total_owners FROM rental_owners;

  -- Contar propietarios con IDs válidos (formato correcto)
  SELECT COUNT(*) INTO owners_with_valid_id
  FROM rental_owners
  WHERE rental_owner_characteristic_id LIKE 'RENTAL_OWNER_%'
    AND LENGTH(rental_owner_characteristic_id) = 20;

  -- Contar propietarios con IDs inválidos
  SELECT COUNT(*) INTO owners_with_invalid_id
  FROM rental_owners
  WHERE rental_owner_characteristic_id IS NOT NULL
    AND rental_owner_characteristic_id != ''
    AND (rental_owner_characteristic_id NOT LIKE 'RENTAL_OWNER_%' OR LENGTH(rental_owner_characteristic_id) != 20);

  -- Contar propietarios sin ID
  SELECT COUNT(*) INTO owners_without_id
  FROM rental_owners
  WHERE rental_owner_characteristic_id IS NULL
     OR rental_owner_characteristic_id = '';

  -- Mostrar resultados
  RAISE NOTICE '📊 PRUEBA 5 - INTEGRIDAD DE DATOS:';
  RAISE NOTICE '   Total de propietarios: %', total_owners;
  RAISE NOTICE '   Con IDs válidos (RENTAL_OWNER_XXXXXXX): %', owners_with_valid_id;
  RAISE NOTICE '   Con IDs inválidos: %', owners_with_invalid_id;
  RAISE NOTICE '   Sin ID: %', owners_without_id;

  -- Verificar integridad
  IF owners_without_id = 0 AND owners_with_invalid_id = 0 THEN
    RAISE NOTICE '✅ PRUEBA 5 PASADA: Todos los propietarios tienen IDs válidos';
  ELSIF owners_without_id = 0 AND owners_with_invalid_id > 0 THEN
    RAISE NOTICE '⚠️  PRUEBA 5 ADVERTENCIA: Hay % propietarios con IDs inválidos', owners_with_invalid_id;
  ELSE
    RAISE NOTICE '⚠️  PRUEBA 5 ADVERTENCIA: Hay % propietarios sin ID', owners_without_id;
  END IF;
END $$;

-- ============================================================================
-- PRUEBA 6: VERIFICAR QUE LOS IDs SON ÚNICOS
-- ============================================================================

DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Contar IDs duplicados
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT rental_owner_characteristic_id, COUNT(*) as count
    FROM rental_owners
    WHERE rental_owner_characteristic_id IS NOT NULL
      AND rental_owner_characteristic_id != ''
    GROUP BY rental_owner_characteristic_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count = 0 THEN
    RAISE NOTICE '✅ PRUEBA 6 PASADA: Todos los rental_owner_characteristic_id son únicos';
  ELSE
    RAISE EXCEPTION '❌ PRUEBA 6 FALLIDA: Hay % IDs duplicados', duplicate_count;
  END IF;
END $$;

-- ============================================================================
-- RESULTADO FINAL DE LAS PRUEBAS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 PRUEBAS COMPLETADAS';
  RAISE NOTICE '📋 Si todas las pruebas pasaron, el sistema está funcionando correctamente';
  RAISE NOTICE '🚀 Puedes proceder a probar desde el formulario de publicación de propiedades';
  RAISE NOTICE '';
  RAISE NOTICE '💡 RECUERDA:';
  RAISE NOTICE '   - Los IDs se generan automáticamente al insertar propietarios';
  RAISE NOTICE '   - El formato es: RENTAL_OWNER_XXXXXXX (7 dígitos)';
  RAISE NOTICE '   - Los IDs son únicos e incrementales';
  RAISE NOTICE '   - Los registros existentes ya fueron actualizados';
END $$;
