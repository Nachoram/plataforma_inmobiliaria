-- TEMPORAL: Deshabilitar RLS para debugging
-- Esto es solo para pruebas - NO dejar en producción

ALTER TABLE property_sale_offers DISABLE ROW LEVEL SECURITY;

-- Permitir acceso temporal para debugging
GRANT SELECT ON property_sale_offers TO authenticated;
GRANT SELECT ON properties TO authenticated;

