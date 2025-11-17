-- =====================================================
-- SEED DOCUMENTS - Datos iniciales de documentos para desarrollo
-- =====================================================
-- Este archivo crea documentos de prueba con diferentes tipos y estados
-- Incluye documentos de identificación, empleo, financieros, etc.

-- =====================================================
-- DOCUMENTOS PARA JUAN PÉREZ (Postulante independiente)
-- =====================================================

-- Cédula de identidad - Verificada
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    ocr_text,
    metadata,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com
    '880e8400-e29b-41d4-a716-446655440001'::uuid, -- application_applicant ID
    'application_applicant',
    'cedula_identidad',
    'user-documents/550e8400-e29b-41d4-a716-446655440004/cedula_juan_perez.pdf',
    'cedula_juan_perez.pdf',
    'cedula_identidad',
    'processed',
    1,
    now() - interval '2 hours',
    'CÉDULA DE IDENTIDAD NACIONAL\nRUN: 5.555.555-5\nNOMBRE: JUAN PÉREZ LÓPEZ\nFECHA DE NACIMIENTO: 15/08/1989\nNACIONALIDAD: CHILENA',
    '{"document_quality": "good", "has_watermark": false, "extraction_confidence": 0.95}'::jsonb,
    now() - interval '2 hours'
) ON CONFLICT (id) DO NOTHING;

-- Liquidación de sueldo - Procesando
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com
    '880e8400-e29b-41d4-a716-446655440001'::uuid, -- application_applicant ID
    'application_applicant',
    'liquidacion_sueldo',
    'user-documents/550e8400-e29b-41d4-a716-446655440004/liquidacion_junio_2025.pdf',
    'liquidacion_junio_2025.pdf',
    'liquidacion_sueldo',
    'processing',
    2,
    now() - interval '1 hour',
    now() - interval '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- Extracto bancario - Verificado
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    ocr_text,
    metadata,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com
    '880e8400-e29b-41d4-a716-446655440001'::uuid, -- application_applicant ID
    'application_applicant',
    'extracto_bancario',
    'user-documents/550e8400-e29b-41d4-a716-446655440004/extracto_banco_junio.pdf',
    'extracto_banco_junio.pdf',
    'extracto_bancario',
    'processed',
    1,
    now() - interval '3 hours',
    'BANCO ESTADO\nEXTRACTO DE CUENTA CORRIENTE\nSALDO PROMEDIO: $2,850,000\nMOVIMIENTOS DEL MES: 45',
    '{"bank_name": "Banco Estado", "account_type": "cuenta_corriente", "balance": 2850000}'::jsonb,
    now() - interval '3 hours'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DOCUMENTOS PARA ANA RODRÍGUEZ (Broker de firma)
-- =====================================================

-- Cédula de identidad - Verificada
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    ocr_text,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440004'::uuid,
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    '880e8400-e29b-41d4-a716-446655440002'::uuid, -- application_applicant ID
    'application_applicant',
    'cedula_identidad',
    'user-documents/550e8400-e29b-41d4-a716-446655440005/cedula_ana_rodriguez.pdf',
    'cedula_ana_rodriguez.pdf',
    'cedula_identidad',
    'processed',
    1,
    now() - interval '4 hours',
    'CÉDULA DE IDENTIDAD NACIONAL\nRUN: 6.666.666-6\nNOMBRE: ANA RODRÍGUEZ FERNÁNDEZ\nFECHA DE NACIMIENTO: 12/03/1982\nNACIONALIDAD: CHILENA',
    now() - interval '4 hours'
) ON CONFLICT (id) DO NOTHING;

-- Certificado de matrimonio - Verificado
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    ocr_text,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440005'::uuid,
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    '880e8400-e29b-41d4-a716-446655440002'::uuid, -- application_applicant ID
    'application_applicant',
    'certificado_matrimonio',
    'user-documents/550e8400-e29b-41d4-a716-446655440005/certificado_matrimonio.pdf',
    'certificado_matrimonio.pdf',
    'certificado_matrimonio',
    'processed',
    1,
    now() - interval '5 hours',
    'CERTIFICADO DE MATRIMONIO\nANA RODRÍGUEZ FERNÁNDEZ Y CARLOS RODRÍGUEZ FERNÁNDEZ\nFECHA: 15/06/2010\nREGISTRO CIVIL ÑUÑOA',
    now() - interval '5 hours'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DOCUMENTOS PARA CARLOS RODRÍGUEZ (Segundo postulante)
-- =====================================================

-- Cédula de identidad - Verificada
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    ocr_text,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440006'::uuid,
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    '880e8400-e29b-41d4-a716-446655440003'::uuid, -- application_applicant ID
    'application_applicant',
    'cedula_identidad',
    'user-documents/550e8400-e29b-41d4-a716-446655440005/cedula_carlos_rodriguez.pdf',
    'cedula_carlos_rodriguez.pdf',
    'cedula_identidad',
    'processed',
    1,
    now() - interval '6 hours',
    'CÉDULA DE IDENTIDAD NACIONAL\nRUN: 7.777.777-7\nNOMBRE: CARLOS RODRÍGUEZ FERNÁNDEZ\nFECHA DE NACIMIENTO: 08/11/1979\nNACIONALIDAD: CHILENA',
    now() - interval '6 hours'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DOCUMENTOS PARA CONSTRUCTORA MODERNA (Empresa)
-- =====================================================

-- Cédula representante legal - Verificada
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    ocr_text,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440007'::uuid,
    '550e8400-e29b-41d4-a716-446655440006'::uuid, -- applicant3@test.com
    '880e8400-e29b-41d4-a716-446655440004'::uuid, -- application_applicant ID
    'application_applicant',
    'cedula_identidad',
    'user-documents/550e8400-e29b-41d4-a716-446655440006/cedula_pedro_sanchez.pdf',
    'cedula_pedro_sanchez.pdf',
    'cedula_identidad',
    'processed',
    1,
    now() - interval '7 hours',
    'CÉDULA DE IDENTIDAD NACIONAL\nRUN: 7.777.777-7\nNOMBRE: PEDRO SÁNCHEZ MORALES\nREPRESENTANTE LEGAL CONSTRUCTORA MODERNA LTDA.',
    now() - interval '7 hours'
) ON CONFLICT (id) DO NOTHING;

-- Informe comercial - Procesando
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440008'::uuid,
    '550e8400-e29b-41d4-a716-446655440006'::uuid, -- applicant3@test.com
    '880e8400-e29b-41d4-a716-446655440004'::uuid, -- application_applicant ID
    'application_applicant',
    'informe_comercial',
    'user-documents/550e8400-e29b-41d4-a716-446655440006/informe_comercial_constructora.pdf',
    'informe_comercial_constructora.pdf',
    'informe_comercial',
    'processing',
    3,
    now() - interval '8 hours',
    now() - interval '8 hours'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DOCUMENTOS CON DIFERENTES ESTADOS
-- =====================================================

-- Documento pendiente - Subido pero no procesado
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440009'::uuid,
    '550e8400-e29b-41d4-a716-446655440004'::uuid, -- applicant@test.com
    '880e8400-e29b-41d4-a716-446655440001'::uuid, -- application_applicant ID
    'application_applicant',
    'referencia_laboral',
    'user-documents/550e8400-e29b-41d4-a716-446655440004/referencia_laboral.pdf',
    'referencia_laboral.pdf',
    'referencia_laboral',
    'uploaded',
    0,
    now()
) ON CONFLICT (id) DO NOTHING;

-- Documento fallido - Error en procesamiento
INSERT INTO documents (
    id,
    uploader_id,
    related_entity_id,
    related_entity_type,
    document_type,
    storage_path,
    file_name,
    applicant_document_type_code,
    processing_status,
    processing_attempts,
    last_processed_at,
    metadata,
    created_at
) VALUES (
    '990e8400-e29b-41d4-a716-446655440010'::uuid,
    '550e8400-e29b-41d4-a716-446655440005'::uuid, -- applicant2@test.com
    '880e8400-e29b-41d4-a716-446655440002'::uuid, -- application_applicant ID
    'application_applicant',
    'pasaporte',
    'user-documents/550e8400-e29b-41d4-a716-446655440005/pasaporte_corrupto.pdf',
    'pasaporte_corrupto.pdf',
    'pasaporte',
    'failed',
    5,
    now() - interval '30 minutes',
    '{"error": "Archivo corrupto o ilegible", "error_code": "CORRUPTED_FILE"}'::jsonb,
    now() - interval '30 minutes'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
    document_count integer;
    processed_count integer;
    processing_count integer;
    uploaded_count integer;
    failed_count integer;
    identification_count integer;
    employment_count integer;
    financial_count integer;
BEGIN
    SELECT COUNT(*) INTO document_count FROM documents
    WHERE id IN (
        '990e8400-e29b-41d4-a716-446655440001'::uuid,
        '990e8400-e29b-41d4-a716-446655440002'::uuid,
        '990e8400-e29b-41d4-a716-446655440003'::uuid,
        '990e8400-e29b-41d4-a716-446655440004'::uuid,
        '990e8400-e29b-41d4-a716-446655440005'::uuid,
        '990e8400-e29b-41d4-a716-446655440006'::uuid,
        '990e8400-e29b-41d4-a716-446655440007'::uuid,
        '990e8400-e29b-41d4-a716-446655440008'::uuid,
        '990e8400-e29b-41d4-a716-446655440009'::uuid,
        '990e8400-e29b-41d4-a716-446655440010'::uuid
    );

    SELECT COUNT(*) INTO processed_count FROM documents
    WHERE id IN (
        '990e8400-e29b-41d4-a716-446655440001'::uuid,
        '990e8400-e29b-41d4-a716-446655440003'::uuid,
        '990e8400-e29b-41d4-a716-446655440004'::uuid,
        '990e8400-e29b-41d4-a716-446655440005'::uuid,
        '990e8400-e29b-41d4-a716-446655440006'::uuid,
        '990e8400-e29b-41d4-a716-446655440007'::uuid
    ) AND processing_status = 'processed';

    SELECT COUNT(*) INTO processing_count FROM documents
    WHERE id IN (
        '990e8400-e29b-41d4-a716-446655440002'::uuid,
        '990e8400-e29b-41d4-a716-446655440008'::uuid
    ) AND processing_status = 'processing';

    SELECT COUNT(*) INTO uploaded_count FROM documents
    WHERE id = '990e8400-e29b-41d4-a716-446655440009'::uuid AND processing_status = 'uploaded';

    SELECT COUNT(*) INTO failed_count FROM documents
    WHERE id = '990e8400-e29b-41d4-a716-446655440010'::uuid AND processing_status = 'failed';

    SELECT COUNT(*) INTO identification_count FROM documents
    WHERE applicant_document_type_code IN ('cedula_identidad', 'pasaporte', 'certificado_matrimonio');

    SELECT COUNT(*) INTO employment_count FROM documents
    WHERE applicant_document_type_code IN ('liquidacion_sueldo', 'contrato_trabajo', 'referencia_laboral');

    SELECT COUNT(*) INTO financial_count FROM documents
    WHERE applicant_document_type_code IN ('extracto_bancario', 'informe_comercial');

    RAISE NOTICE 'Seed documents completado exitosamente:';
    RAISE NOTICE '  - Total documentos creados: %', document_count;
    RAISE NOTICE '  - Procesados: %', processed_count;
    RAISE NOTICE '  - Procesando: %', processing_count;
    RAISE NOTICE '  - Pendientes: %', uploaded_count;
    RAISE NOTICE '  - Fallidos: %', failed_count;
    RAISE NOTICE '  - Documentos de identidad: %', identification_count;
    RAISE NOTICE '  - Documentos laborales: %', employment_count;
    RAISE NOTICE '  - Documentos financieros: %', financial_count;
END $$;
