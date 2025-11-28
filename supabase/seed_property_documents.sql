-- Seed script: Insertar documentos de ejemplo para propiedades
-- Ejecutar después de crear la tabla property_sale_documents

-- Insertar documentos para la propiedad que se usa en las ofertas de ejemplo
-- Nota: Esta es una propiedad de ejemplo con ID fijo para desarrollo

DO $$
DECLARE
    property_id UUID := '4be98a96-bb90-44bb-bdbd-bc7a1badb098'; -- ID de propiedad de ejemplo
BEGIN
    -- Verificar si ya existen documentos para esta propiedad
    IF NOT EXISTS (SELECT 1 FROM property_sale_documents WHERE property_id = property_id) THEN

        -- Insertar documentos de ejemplo
        INSERT INTO property_sale_documents (
            property_id,
            doc_type,
            file_name,
            file_url,
            storage_path,
            file_size_bytes,
            mime_type,
            uploaded_by,
            notes
        ) VALUES
        (
            property_id,
            'dominio_vigente',
            'certificado_dominio.pdf',
            'https://example.com/docs/certificado_dominio.pdf',
            'property-documents/' || property_id || '/certificado_dominio.pdf',
            245760, -- 240KB
            'application/pdf',
            '36f64a85-96c2-4d65-8ca9-7ac553c36d8d', -- ID de usuario de ejemplo
            'Certificado de dominio vigente emitido por el Conservador de Bienes Raíces'
        ),
        (
            property_id,
            'hipotecas_gravamenes',
            'certificado_hipotecas.pdf',
            'https://example.com/docs/certificado_hipotecas.pdf',
            'property-documents/' || property_id || '/certificado_hipotecas.pdf',
            189440, -- 185KB
            'application/pdf',
            '36f64a85-96c2-4d65-8ca9-7ac553c36d8d',
            'Certificado de hipotecas y gravámenes - Propiedad libre de cargas'
        ),
        (
            property_id,
            'avaluo_fiscal',
            'avaluo_fiscal_2024.pdf',
            'https://example.com/docs/avaluo_fiscal_2024.pdf',
            'property-documents/' || property_id || '/avaluo_fiscal_2024.pdf',
            156320, -- 152KB
            'application/pdf',
            '36f64a85-96c2-4d65-8ca9-7ac553c36d8d',
            'Avalúo fiscal actualizado al año 2024'
        ),
        (
            property_id,
            'planos_propiedad',
            'planos_propiedad.pdf',
            'https://example.com/docs/planos_propiedad.pdf',
            'property-documents/' || property_id || '/planos_propiedad.pdf',
            512000, -- 500KB
            'application/pdf',
            '36f64a85-96c2-4d65-8ca9-7ac553c36d8d',
            'Planos arquitectónicos de la propiedad incluyendo distribución de ambientes'
        ),
        (
            property_id,
            'cert_numero_municipal',
            'certificado_numero_municipal.pdf',
            'https://example.com/docs/certificado_numero_municipal.pdf',
            'property-documents/' || property_id || '/certificado_numero_municipal.pdf',
            98752, -- 96KB
            'application/pdf',
            '36f64a85-96c2-4d65-8ca9-7ac553c36d8d',
            'Certificado de número municipal y dirección oficial'
        );

        RAISE NOTICE '✅ Documentos de ejemplo insertados para propiedad ID: %', property_id;
    ELSE
        RAISE NOTICE 'ℹ️ Los documentos ya existen para la propiedad ID: %', property_id;
    END IF;
END $$;



