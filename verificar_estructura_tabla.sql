-- Verificar la estructura exacta de rental_contracts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rental_contracts'
ORDER BY ordinal_position;

