-- Script para ejecutar y probar la función get_properties_with_postulation_count

-- Primero, obtengamos un user_id existente para probar
SELECT
    p.id,
    p.email,
    p.first_name,
    p.paternal_last_name
FROM profiles p
WHERE p.id IN (
    SELECT DISTINCT owner_id
    FROM properties
    LIMIT 1
)
LIMIT 1;

-- Una vez que tengamos un user_id, podemos ejecutar:
-- SELECT * FROM get_properties_with_postulation_count('user-uuid-here'::uuid);

-- Para probar con datos reales, ejecutemos la función con el primer user_id que encontremos:
DO $$
DECLARE
    test_user_id uuid;
    result_count integer;
BEGIN
    -- Obtener el primer owner_id de properties
    SELECT owner_id INTO test_user_id
    FROM properties
    WHERE owner_id IS NOT NULL
    LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Probando función con user_id: %', test_user_id;

        -- Ejecutar la función y contar resultados
        SELECT COUNT(*) INTO result_count
        FROM get_properties_with_postulation_count(test_user_id);

        RAISE NOTICE 'La función retornó % propiedades', result_count;

        -- Mostrar primeros resultados
        RAISE NOTICE 'Primeros resultados:';
        FOR result IN
            SELECT id, address_street, price_clp, postulation_count
            FROM get_properties_with_postulation_count(test_user_id)
            LIMIT 3
        LOOP
            RAISE NOTICE 'Propiedad %: % - $% - % postulaciones',
                result.id, result.address_street, result.price_clp, result.postulation_count;
        END LOOP;
    ELSE
        RAISE NOTICE 'No se encontraron propiedades con owner_id para probar';
    END IF;
END $$;
