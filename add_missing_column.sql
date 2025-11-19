-- Agregar la columna faltante a rental_contracts
-- Basándonos en el análisis, probablemente falta 'payment_day'

-- Verificar si payment_day existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'rental_contracts'
            AND column_name = 'payment_day'
    ) INTO column_exists;

    IF NOT column_exists THEN
        -- Agregar la columna payment_day si no existe
        ALTER TABLE rental_contracts
        ADD COLUMN payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31);

        RAISE NOTICE '✅ Columna payment_day agregada a rental_contracts';

        -- Actualizar registros existentes con valor por defecto
        UPDATE rental_contracts
        SET payment_day = 5
        WHERE payment_day IS NULL;

        RAISE NOTICE '✅ Registros existentes actualizados con payment_day = 5';

        -- Crear índice si no existe
        CREATE INDEX IF NOT EXISTS idx_rental_contracts_payment_day ON rental_contracts(payment_day);

        RAISE NOTICE '✅ Índice creado para payment_day';

    ELSE
        RAISE NOTICE 'ℹ️ La columna payment_day ya existe en rental_contracts';
    END IF;
END $$;

-- Verificar el resultado final
SELECT
    COUNT(*) as total_columns_in_rental_contracts,
    26 as expected_columns
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'rental_contracts'
    AND column_name IN (
        'application_id',
        'status',
        'start_date',
        'validity_period_months',
        'final_amount',
        'guarantee_amount',
        'final_amount_currency',
        'guarantee_amount_currency',
        'payment_day',
        'account_holder_name',
        'account_number',
        'account_bank',
        'account_type',
        'has_brokerage_commission',
        'broker_name',
        'broker_amount',
        'broker_rut',
        'allows_pets',
        'is_furnished',
        'has_dicom_clause',
        'tenant_email',
        'landlord_email',
        'created_by',
        'notes',
        'contract_content',
        'contract_html'
    );

-- Mostrar todas las columnas que ahora deberían existir
SELECT
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_default IS NOT NULL THEN 'Tiene default'
        ELSE 'Sin default'
    END as default_status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'rental_contracts'
    AND column_name IN (
        'application_id',
        'status',
        'start_date',
        'validity_period_months',
        'final_amount',
        'guarantee_amount',
        'final_amount_currency',
        'guarantee_amount_currency',
        'payment_day',
        'account_holder_name',
        'account_number',
        'account_bank',
        'account_type',
        'has_brokerage_commission',
        'broker_name',
        'broker_amount',
        'broker_rut',
        'allows_pets',
        'is_furnished',
        'has_dicom_clause',
        'tenant_email',
        'landlord_email',
        'created_by',
        'notes',
        'contract_content',
        'contract_html'
    )
ORDER BY column_name;








