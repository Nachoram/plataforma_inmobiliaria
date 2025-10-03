-- Permitir que contract_content acepte valores NULL
-- Ya que el contenido se generara externamente (N8N)

ALTER TABLE rental_contracts 
ALTER COLUMN contract_content DROP NOT NULL;

-- Verificar el cambio
SELECT 
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'rental_contracts' 
  AND column_name = 'contract_content';

