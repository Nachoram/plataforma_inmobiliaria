-- CORREGIR: Políticas RLS para property_sale_offers
-- Solución más eficiente y segura

-- Primero, limpiar políticas existentes
DROP POLICY IF EXISTS "Buyers can view their own offers" ON property_sale_offers;
DROP POLICY IF EXISTS "Sellers can view offers on their properties" ON property_sale_offers;
DROP POLICY IF EXISTS "Authenticated users can create offers" ON property_sale_offers;
DROP POLICY IF EXISTS "Buyers can update their pending offers" ON property_sale_offers;
DROP POLICY IF EXISTS "Sellers can update offers on their properties" ON property_sale_offers;

-- Política simplificada para compradores ver sus ofertas
CREATE POLICY "Users can view offers they are involved in" ON property_sale_offers
    FOR SELECT USING (
        buyer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_offers.property_id
            AND p.owner_id = auth.uid()
        )
    );

-- Política para crear ofertas (solo usuarios autenticados)
CREATE POLICY "Authenticated users can create offers" ON property_sale_offers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para actualizar ofertas
CREATE POLICY "Users can update offers they are involved in" ON property_sale_offers
    FOR UPDATE USING (
        buyer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_offers.property_id
            AND p.owner_id = auth.uid()
        )
    );

-- Política para eliminar ofertas (solo administradores o vendedores)
CREATE POLICY "Users can delete offers on their properties" ON property_sale_offers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = property_sale_offers.property_id
            AND p.owner_id = auth.uid()
        )
    );

-- REACTIVAR RLS (estaba deshabilitado temporalmente)
ALTER TABLE property_sale_offers ENABLE ROW LEVEL SECURITY;

