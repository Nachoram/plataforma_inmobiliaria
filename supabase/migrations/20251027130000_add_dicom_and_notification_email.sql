-- Añadir columna dicom_clause (cláusula de terminación por DICOM)
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS dicom_clause BOOLEAN DEFAULT false;

-- Añadir columna notification_email (email para enviar contrato)
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN rental_contract_conditions.dicom_clause IS 'Indica si se incluye cláusula de terminación anticipada por ingreso a DICOM';
COMMENT ON COLUMN rental_contract_conditions.notification_email IS 'Correo electrónico al cual se enviará la notificación del contrato generado';
