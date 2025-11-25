-- Verificar qué columna específica falta en rental_contracts
SELECT
    'Columnas que esperamos tener:' as info,
    unnest(ARRAY[
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
    ]) as expected_column
UNION ALL
SELECT
    'Columnas que realmente existen:' as info,
    column_name as expected_column
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
ORDER BY info, expected_column;

-- Verificar específicamente cuáles faltan
SELECT
    expected_column,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'rental_contracts'
                AND column_name = expected_column
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END as status
FROM (
    VALUES
        ('application_id'),
        ('status'),
        ('start_date'),
        ('validity_period_months'),
        ('final_amount'),
        ('guarantee_amount'),
        ('final_amount_currency'),
        ('guarantee_amount_currency'),
        ('payment_day'),
        ('account_holder_name'),
        ('account_number'),
        ('account_bank'),
        ('account_type'),
        ('has_brokerage_commission'),
        ('broker_name'),
        ('broker_amount'),
        ('broker_rut'),
        ('allows_pets'),
        ('is_furnished'),
        ('has_dicom_clause'),
        ('tenant_email'),
        ('landlord_email'),
        ('created_by'),
        ('notes'),
        ('contract_content'),
        ('contract_html')
) AS expected(expected_column)
ORDER BY
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'rental_contracts'
            AND column_name = expected.expected_column
    ) THEN 1 ELSE 2 END,
    expected_column;










