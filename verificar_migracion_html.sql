-- Verificar que la migración se aplicó correctamente

-- 1. Ver las columnas de rental_contracts
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rental_contracts' 
  AND column_name IN ('contract_html', 'contract_format', 'contract_number', 'contract_content')
ORDER BY column_name;

-- 2. Verificar constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'rental_contracts'::regclass
  AND conname LIKE '%contract%';

-- 3. Verificar que la secuencia existe
SELECT * FROM pg_sequences WHERE sequencename = 'rental_contracts_seq';

-- 4. Verificar que la función existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'generate_contract_number';

