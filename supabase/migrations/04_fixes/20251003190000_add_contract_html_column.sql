-- Agregar soporte para HTML directo en contratos
-- Permite almacenar contratos generados por N8N como HTML completo

-- Agregar columna contract_html para almacenar HTML completo
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS contract_html TEXT;

-- Hacer contract_content nullable (algunos contratos pueden tener solo HTML)
ALTER TABLE rental_contracts
ALTER COLUMN contract_content DROP NOT NULL;

-- Agregar constraint: debe tener al menos contract_content o contract_html
ALTER TABLE rental_contracts
ADD CONSTRAINT check_contract_has_content 
CHECK (
  contract_content IS NOT NULL OR contract_html IS NOT NULL
);

-- Agregar columna para indicar el formato del contrato
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS contract_format VARCHAR(20) DEFAULT 'json'
CHECK (contract_format IN ('json', 'html', 'hybrid'));

-- Agregar índice para búsquedas por formato
CREATE INDEX IF NOT EXISTS idx_rental_contracts_format 
ON rental_contracts(contract_format);

-- Agregar número de contrato si no existe
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS contract_number VARCHAR(50);

-- Crear función para generar número de contrato automáticamente
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('rental_contracts_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear secuencia para números de contrato si no existe
CREATE SEQUENCE IF NOT EXISTS rental_contracts_seq START 1;

-- Crear trigger para auto-generar número de contrato
DROP TRIGGER IF EXISTS trigger_generate_contract_number ON rental_contracts;
CREATE TRIGGER trigger_generate_contract_number
  BEFORE INSERT ON rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_number();

-- Comentarios para documentación
COMMENT ON COLUMN rental_contracts.contract_html IS 'Contrato completo en formato HTML, generado por N8N o sistema externo';
COMMENT ON COLUMN rental_contracts.contract_content IS 'Contrato en formato JSON estructurado con sections editables (opcional)';
COMMENT ON COLUMN rental_contracts.contract_format IS 'Formato del contrato: json (estructurado), html (HTML puro), hybrid (ambos)';
COMMENT ON COLUMN rental_contracts.contract_number IS 'Número único de contrato generado automáticamente';

