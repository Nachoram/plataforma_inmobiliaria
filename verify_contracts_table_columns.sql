-- Verificar que todas las columnas necesarias existen en rental_contracts
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
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

-- Contar columnas que deberían existir (26)
SELECT
    COUNT(*) as existing_columns,
    26 as required_columns,
    CASE WHEN COUNT(*) = 26 THEN '✅ TODAS LAS COLUMNAS EXISTEN' ELSE '❌ FALTAN COLUMNAS' END as status
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


