-- Identificar exactamente qué columna falta
WITH expected_columns AS (
    SELECT unnest(ARRAY[
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
    ]) as column_name
),
existing_columns AS (
    SELECT column_name
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
)
SELECT
    ec.column_name as expected_column,
    CASE
        WHEN ex.column_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ FALTA - NECESITA AGREGARSE'
    END as status
FROM expected_columns ec
LEFT JOIN existing_columns ex ON ec.column_name = ex.column_name
ORDER BY
    CASE WHEN ex.column_name IS NULL THEN 1 ELSE 2 END,
    ec.column_name;

-- Mostrar resumen
SELECT
    (SELECT COUNT(*) FROM expected_columns) as expected_total,
    (SELECT COUNT(*) FROM existing_columns) as existing_total,
    (SELECT COUNT(*) FROM expected_columns) - (SELECT COUNT(*) FROM existing_columns) as missing_count,
    CASE
        WHEN (SELECT COUNT(*) FROM expected_columns) - (SELECT COUNT(*) FROM existing_columns) = 0
        THEN '✅ TODAS LAS COLUMNAS EXISTEN'
        ELSE '❌ FALTAN COLUMNAS - REVISAR ARRIBA'
    END as status;




